import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'
import type { DiscussionTopic, RoundHistory, ActiveRound, GroupAssignment } from '~/types/topic'
import type { Room } from '~/types/room'

// Function to automatically assign participants to groups based on their votes and assign rooms
// Each participant can only attend ONE discussion group based on their preferences
async function createGroupAssignments(topics: DiscussionTopic[], selectedTopicIds: string[]): Promise<GroupAssignment[]> {
  const selectedTopics = topics.filter(topic => selectedTopicIds.includes(topic.id))
  const groupAssignments: GroupAssignment[] = []
  
  // Load available rooms
  let availableRooms: Room[] = []
  try {
    const roomsPath = join(process.cwd(), 'data', 'rooms.json')
    const roomsData = await fs.readFile(roomsPath, 'utf-8')
    availableRooms = JSON.parse(roomsData).filter((room: Room) => room.available)
  } catch (error) {
    console.warn('No rooms file found, topics will not have room assignments')
  }

  // Create empty assignments for each selected topic
  selectedTopics.forEach((topic, index) => {
    const assignment: GroupAssignment = {
      topicId: topic.id,
      topicTitle: topic.title,
      participants: [],
      roomAssignment: availableRooms[index % availableRooms.length]?.name || undefined
    }
    groupAssignments.push(assignment)
  })

  // Track assigned participants to ensure each person is only in one group
  const assignedVoters = new Set<string>()
  
  // Step 1: Assign participants to their first choice topics (if selected)
  selectedTopics.forEach(topic => {
    const assignment = groupAssignments.find(g => g.topicId === topic.id)
    if (assignment && topic.firstChoiceVoters) {
      topic.firstChoiceVoters.forEach(voterEmail => {
        if (!assignedVoters.has(voterEmail)) {
          assignment.participants.push(voterEmail)
          assignedVoters.add(voterEmail)
        }
      })
    }
  })
  
  // Step 2: Assign participants to their second choice topics (if selected and not already assigned)
  selectedTopics.forEach(topic => {
    const assignment = groupAssignments.find(g => g.topicId === topic.id)
    if (assignment && topic.secondChoiceVoters) {
      topic.secondChoiceVoters.forEach(voterEmail => {
        if (!assignedVoters.has(voterEmail)) {
          assignment.participants.push(voterEmail)
          assignedVoters.add(voterEmail)
        }
      })
    }
  })
  
  // Step 3: Participants whose neither first nor second choice was selected remain unassigned
  // They can join any discussion group but are not automatically assigned to maintain the 
  // "one participant, one group" principle
  
  return groupAssignments
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const topTopicsCount = config.public.topTopicsCount
  const { user } = await requireUserSession(event)
  
  // Verify admin or organizer role
  const userRole = (user as any).Role || (user as any).role
  if (!['Admin', 'Organizer'].includes(userRole) && (user as any).globalRole !== 'SuperAdmin') {
    throw createError({
      statusCode: 403,
      message: 'Only administrators and organizers can start a new round'
    })
  }

  const topicsPath = join(process.cwd(), config.topicsFilePath)
  
  try {
    // Read existing topics
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData) as DiscussionTopic[]
    
    // Sort topics by preference score (weighted voting) to find top topics
    const sortedTopics = [...topics]
      .filter(topic => !topic.frozen) // Only include non-frozen topics
      .sort((a, b) => (b.totalPreferenceScore || 0) - (a.totalPreferenceScore || 0))
    
    const topTopics = sortedTopics.slice(0, Math.min(topTopicsCount, 5)) // Limit to 5 topics max for quick round
    const selectedTopicIds = topTopics.map(t => t.id)

    // Create group assignments for the top topics
    const groupAssignments = await createGroupAssignments(topics, selectedTopicIds)
    
    // Create round history entry
    const roundHistoryPath = join(process.cwd(), 'data', 'round-history.json')
    let roundHistory: RoundHistory[] = []
    try {
      const historyData = await fs.readFile(roundHistoryPath, 'utf-8')
      roundHistory = JSON.parse(historyData)
    } catch {
      // No history file yet
    }
    
    const nextRoundNumber = Math.max(0, ...roundHistory.map(r => r.roundNumber || 0)) + 1
    const newRoundHistory: RoundHistory = {
      id: `quick-round-${nextRoundNumber}`,
      roundNumber: nextRoundNumber,
      timestamp: new Date().toISOString(),
      startTime: new Date(),
      duration: 20, // Default 20 minutes for quick rounds
      topicIds: selectedTopicIds,
      topicTitles: topTopics.map(t => t.title),
      participantCount: groupAssignments.reduce((sum: number, group: GroupAssignment) => sum + group.participants.length, 0),
      eventId: 'default-event',
      selectedTopics: topTopics.map(topic => {
        const assignment = groupAssignments.find((g: GroupAssignment) => g.topicId === topic.id)
        return {
          topicId: topic.id,
          title: topic.title,
          participantCount: assignment?.participants.length || 0,
          finalScore: topic.totalPreferenceScore || 0,
          assignedParticipants: assignment?.participants || [],
          roomAssignment: assignment?.roomAssignment
        }
      }),
      totalParticipants: groupAssignments.reduce((sum: number, group: GroupAssignment) => sum + group.participants.length, 0)
    }
    
    roundHistory.push(newRoundHistory)
    await fs.writeFile(roundHistoryPath, JSON.stringify(roundHistory, null, 2))
    
    // Create active round
    const activeRoundPath = join(process.cwd(), 'data', 'active-round.json')
    const activeRound: ActiveRound = {
      id: `quick-active-round-${nextRoundNumber}`,
      roundNumber: nextRoundNumber,
      startTime: new Date(),
      duration: 20,
      topicIds: selectedTopicIds,
      topicTitles: topTopics.map(t => t.title),
      selectedTopics: selectedTopicIds,
      isActive: true,
      groupAssignments: groupAssignments,
      votingDisabled: true,
      eventId: 'default-event'
    }
    await fs.writeFile(activeRoundPath, JSON.stringify(activeRound, null, 2))
    
    // Award badges to top topics and mark them as selected
    topTopics.forEach((topTopic: DiscussionTopic) => {
      const topic = topics.find(t => t.id === topTopic.id)
      if (topic) {
        topic.badges = (topic.badges || 0) + 1
        topic.selectedForRound = true
        topic.currentRound = nextRoundNumber
      }
    })

    // Reset votes and frozen status for all topics
    topics.forEach(topic => {
      topic.votes = 0
      topic.voters = []
      topic.frozen = false
      // Reset preference voting as well
      topic.firstChoiceVoters = []
      topic.secondChoiceVoters = []
      topic.totalPreferenceScore = 0
    })
    
    // Write back to file
    await fs.writeFile(topicsPath, JSON.stringify(topics, null, 2))
    
    logger.debug(`Quick round started with ${topTopics.length} topics and ${groupAssignments.reduce((sum, group) => sum + group.participants.length, 0)} participants assigned to groups.`)
    
    return { 
      message: 'Quick round started successfully',
      roundNumber: nextRoundNumber,
      selectedTopics: topTopics.map(t => ({ id: t.id, title: t.title })),
      groupAssignments: groupAssignments
    }
  } catch (error) {
    logger.error('Error starting new round:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to start new round'
    })
  }
})

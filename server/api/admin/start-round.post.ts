import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'
import type { DiscussionTopic, RoundHistory, ActiveRound, GroupAssignment } from '~/types/topic'
import type { User } from '~/types/user'

// Function to automatically assign participants to groups based on their votes
function createGroupAssignments(topics: DiscussionTopic[], selectedTopicIds: string[]): GroupAssignment[] {
  const selectedTopics = topics.filter(topic => selectedTopicIds.includes(topic.id))
  const groupAssignments: GroupAssignment[] = []
  
  // Create initial assignments based on first choices
  selectedTopics.forEach(topic => {
    groupAssignments.push({
      topicId: topic.id,
      topicTitle: topic.title,
      participants: [...(topic.firstChoiceVoters || [])],
      roomAssignment: undefined // Will be assigned separately
    })
  })
  
  // Assign second choice voters to groups with fewer participants
  selectedTopics.forEach(topic => {
    const secondChoiceVoters = topic.secondChoiceVoters || []
    
    secondChoiceVoters.forEach(voterEmail => {
      // Check if voter is already assigned (via first choice)
      const alreadyAssigned = groupAssignments.some(group => 
        group.participants.includes(voterEmail)
      )
      
      if (!alreadyAssigned) {
        // Find the group with the fewest participants
        const sortedGroups = [...groupAssignments].sort((a, b) => 
          a.participants.length - b.participants.length
        )
        
        if (sortedGroups.length > 0) {
          sortedGroups[0].participants.push(voterEmail)
        }
      }
    })
  })
  
  // Handle voters who didn't vote for any selected topics
  const allVoters = new Set<string>()
  topics.forEach(topic => {
    topic.firstChoiceVoters?.forEach(email => allVoters.add(email))
    topic.secondChoiceVoters?.forEach(email => allVoters.add(email))
  })
  
  const assignedVoters = new Set<string>()
  groupAssignments.forEach(group => {
    group.participants.forEach(email => assignedVoters.add(email))
  })
  
  const unassignedVoters = Array.from(allVoters).filter(email => !assignedVoters.has(email))
  
  // Distribute unassigned voters evenly
  unassignedVoters.forEach((voterEmail, index) => {
    if (groupAssignments.length > 0) {
      const targetGroupIndex = index % groupAssignments.length
      groupAssignments[targetGroupIndex].participants.push(voterEmail)
    }
  })
  
  return groupAssignments
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { user } = await requireUserSession(event)
  const body = await readBody(event)
  
  // Verify admin role
  if ((user as User).role !== 'Admin') {
    throw createError({
      statusCode: 403,
      message: 'Only administrators can start a new round'
    })
  }

  const { selectedTopicIds, roundDuration } = body
  
  if (!selectedTopicIds || !Array.isArray(selectedTopicIds) || selectedTopicIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'At least one topic must be selected'
    })
  }

  const topicsPath = join(process.cwd(), config.topicsFilePath)
  const roundHistoryPath = join(process.cwd(), 'data', 'round-history.json')
  const activeRoundPath = join(process.cwd(), 'data', 'active-round.json')
  
  try {
    // Read existing topics
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData) as DiscussionTopic[]
    
    // Read round history
    let roundHistory: RoundHistory[] = []
    try {
      const historyData = await fs.readFile(roundHistoryPath, 'utf-8')
      roundHistory = JSON.parse(historyData)
    } catch {
      // File doesn't exist, create empty array
    }
    
    // Determine next round number
    const nextRoundNumber = roundHistory.length > 0 
      ? Math.max(...roundHistory.map(r => r.roundNumber)) + 1 
      : 1
    
    // Get top topics for badges (before resetting votes)
    const topTopicsCount = config.public.topTopicsCount
    const sortedTopics = [...topics].sort((a, b) => (b.totalPreferenceScore || 0) - (a.totalPreferenceScore || 0))
    const topTopics = sortedTopics.slice(0, topTopicsCount)
    
    // Award badges to top topics
    topTopics.forEach((topTopic: DiscussionTopic) => {
      const topic = topics.find(t => t.id === topTopic.id)
      if (topic) {
        topic.badges = (topic.badges || 0) + 1
      }
    })
    
    // Save round history
    const selectedTopics = topics.filter(topic => selectedTopicIds.includes(topic.id))
    const groupAssignments = createGroupAssignments(topics, selectedTopicIds)
    
    const newRoundHistory: RoundHistory = {
      roundNumber: nextRoundNumber,
      timestamp: new Date().toISOString(),
      selectedTopics: selectedTopics.map(topic => {
        const assignment = groupAssignments.find(g => g.topicId === topic.id)
        return {
          topicId: topic.id,
          title: topic.title,
          participantCount: assignment?.participants.length || 0,
          finalScore: topic.totalPreferenceScore || 0,
          assignedParticipants: assignment?.participants || [],
          roomAssignment: assignment?.roomAssignment
        }
      }),
      totalParticipants: groupAssignments.reduce((sum, group) => sum + group.participants.length, 0)
    }
    
    roundHistory.push(newRoundHistory)
    await fs.writeFile(roundHistoryPath, JSON.stringify(roundHistory, null, 2))
    
    // Create active round with group assignments
    const activeRound: ActiveRound = {
      roundNumber: nextRoundNumber,
      startTime: new Date().toISOString(),
      duration: roundDuration || 20,
      selectedTopics: selectedTopicIds,
      isActive: true,
      groupAssignments: groupAssignments,
      votingDisabled: true  // Disable voting during active rounds
    }
    await fs.writeFile(activeRoundPath, JSON.stringify(activeRound, null, 2))
    
    // Update topics: mark selected ones and reset voting
    topics.forEach(topic => {
      // Mark selected topics for current round
      if (selectedTopicIds.includes(topic.id)) {
        topic.selectedForRound = true
        topic.currentRound = nextRoundNumber
      } else {
        topic.selectedForRound = false
        topic.currentRound = undefined
      }
      
      // Reset votes and preferences for all topics
      topic.votes = 0
      topic.voters = []
      topic.firstChoiceVoters = []
      topic.secondChoiceVoters = []
      topic.totalPreferenceScore = 0
      topic.frozen = false
    })
    
    // Write back to file
    await fs.writeFile(topicsPath, JSON.stringify(topics, null, 2))
    
    logger.debug(`New round ${nextRoundNumber} started by admin ${(user as User).email}. Selected topics: ${selectedTopicIds.join(', ')}`)
    
    return { 
      message: 'New round started successfully',
      roundNumber: nextRoundNumber,
      selectedTopics: selectedTopics.map(t => ({ id: t.id, title: t.title })),
      activeRound,
      groupAssignments
    }
  } catch (error) {
    logger.error('Error starting new round:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to start new round'
    })
  }
})

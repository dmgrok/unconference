import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../../utils/logger'
import { requireEventPermission } from "../../../../utils/authService"
import type { DiscussionTopic, RoundHistory, ActiveRound, GroupAssignment } from '~/types/topic'

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
  
  return groupAssignments
}

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'Event ID is required'
    })
  }

  // Check if user has permission to manage rounds in this event
  await requireEventPermission(event, eventId, 'rounds', 'create')

  const body = await readBody(event)
  const { selectedTopicIds, roundDuration } = body
  
  if (!selectedTopicIds || !Array.isArray(selectedTopicIds) || selectedTopicIds.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Selected topic IDs are required'
    })
  }

  try {
    const eventDir = join(process.cwd(), 'data', 'events', eventId)
    const topicsPath = join(eventDir, 'topics.json')
    const activeRoundPath = join(eventDir, 'active-round.json')
    const roundHistoryPath = join(eventDir, 'round-history.json')
    const currentGroupsPath = join(eventDir, 'current-groups.json')

    // Check for existing active round
    const activeRoundExists = await fs.access(activeRoundPath).then(() => true).catch(() => false)
    if (activeRoundExists) {
      const activeRoundData = await fs.readFile(activeRoundPath, 'utf-8')
      const activeRound = JSON.parse(activeRoundData)
      
      if (activeRound && activeRound.isActive) {
        throw createError({
          statusCode: 400,
          message: 'There is already an active round. Please end the current round before starting a new one.'
        })
      }
    }

    // Read topics
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData) as DiscussionTopic[]

    // Validate selected topics exist
    const selectedTopics = topics.filter(topic => selectedTopicIds.includes(topic.id))
    if (selectedTopics.length !== selectedTopicIds.length) {
      throw createError({
        statusCode: 400,
        message: 'Some selected topics do not exist'
      })
    }

    // Create group assignments
    const groupAssignments = createGroupAssignments(topics, selectedTopicIds)

    // Create active round
    const activeRound: ActiveRound = {
      id: `round_${Date.now()}`,
      topicIds: selectedTopicIds,
      startTime: new Date(),
      duration: roundDuration || 45, // Default 45 minutes
      isActive: true,
      votingDisabled: true,
      eventId: eventId
    }

    // Save active round
    await fs.writeFile(activeRoundPath, JSON.stringify(activeRound, null, 2))

    // Save group assignments
    await fs.writeFile(currentGroupsPath, JSON.stringify(groupAssignments, null, 2))

    // Update round history
    let roundHistory: RoundHistory[] = []
    try {
      const historyData = await fs.readFile(roundHistoryPath, 'utf-8')
      roundHistory = JSON.parse(historyData)
    } catch {
      // File doesn't exist, start with empty array
    }

    const roundRecord: RoundHistory = {
      id: activeRound.id,
      topicIds: selectedTopicIds,
      topicTitles: selectedTopics.map(t => t.title),
      startTime: activeRound.startTime,
      duration: activeRound.duration,
      participantCount: groupAssignments.reduce((total, group) => total + group.participants.length, 0),
      eventId: eventId
    }

    roundHistory.push(roundRecord)
    await fs.writeFile(roundHistoryPath, JSON.stringify(roundHistory, null, 2))

    logger.info(`Round started for event ${eventId}: ${selectedTopics.length} topics, ${roundRecord.participantCount} participants`)

    return {
      success: true,
      round: activeRound,
      groups: groupAssignments,
      message: 'Round started successfully'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    logger.error('Error starting round:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to start round'
    })
  }
})

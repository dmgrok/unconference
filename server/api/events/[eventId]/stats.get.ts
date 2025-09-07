import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../utils/logger'
import { requireEventPermission } from '../../../utils/authService'

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID is required'
    })
  }

  // Check if user has permission to read stats for this event
  await requireEventPermission(event, eventId, 'event', 'read')

  try {
    const platformPath = join(process.cwd(), 'data', 'platform')
    const eventPath = join(process.cwd(), 'data', 'events', eventId)
    
    // Initialize stats
    let participantCount = 0
    let organizerCount = 0
    let topicCount = 0
    let roundCount = 0

    // Get participant and organizer counts from memberships
    try {
      const membershipsPath = join(platformPath, 'memberships.json')
      const membershipsData = await fs.readFile(membershipsPath, 'utf-8')
      const memberships = JSON.parse(membershipsData)
      
      // Filter memberships for this event (excluding guests)
      const eventMemberships = memberships.filter((m: any) => 
        m.eventId === eventId && m.role !== 'Guest'
      )
      
      participantCount = eventMemberships.length
      organizerCount = eventMemberships.filter((m: any) => m.role === 'Organizer').length
    } catch (error) {
      logger.warn(`Could not load memberships for stats: ${error}`)
    }

    // Get topic count
    try {
      const topicsPath = join(eventPath, 'topics.json')
      const topicsData = await fs.readFile(topicsPath, 'utf-8')
      const topics = JSON.parse(topicsData)
      topicCount = topics.length
    } catch (error) {
      logger.warn(`Could not load topics for stats: ${error}`)
    }

    // Get round count from round history
    try {
      const roundHistoryPath = join(eventPath, 'round-history.json')
      const roundHistoryData = await fs.readFile(roundHistoryPath, 'utf-8')
      const roundHistory = JSON.parse(roundHistoryData)
      roundCount = Array.isArray(roundHistory) ? roundHistory.length : 0
    } catch (error) {
      logger.warn(`Could not load round history for stats: ${error}`)
    }

    return {
      participantCount,
      organizerCount,
      topicCount,
      roundCount
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    logger.error('Failed to load event stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load event statistics'
    })
  }
})

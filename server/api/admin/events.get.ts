import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  // Check if user is super admin
  if ((user as any).globalRole !== 'Admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Super admin access required'
    })
  }

  try {
    const platformBasePath = join(process.cwd(), 'data', 'platform')
    
    // Get all events
    const eventsPath = join(platformBasePath, 'events.json')
    let events = []
    try {
      const eventsData = await fs.readFile(eventsPath, 'utf-8')
      events = JSON.parse(eventsData)
    } catch {
      // No events file yet
    }

    // Get all memberships for participant counts
    const membershipsPath = join(platformBasePath, 'memberships.json')
    let memberships = []
    try {
      const membershipsData = await fs.readFile(membershipsPath, 'utf-8')
      memberships = JSON.parse(membershipsData)
    } catch {
      // No memberships file yet
    }

    // Get all users for organizer names
    const usersPath = join(platformBasePath, 'users.json')
    let users = []
    try {
      const usersData = await fs.readFile(usersPath, 'utf-8')
      users = JSON.parse(usersData)
    } catch {
      // No users file yet
    }

    // Enhance events with additional data
    const enhancedEvents = await Promise.all(events.map(async (event: any) => {
      const eventMemberships = memberships.filter((m: any) => m.eventId === event.id)
      const organizer = users.find((u: any) => u.id === event.organizerId)
      
      // Get topic count from event data if available
      let topicCount = 0
      try {
        const eventDataPath = join(process.cwd(), 'data', 'events', event.id, 'topics.json')
        const topicsData = await fs.readFile(eventDataPath, 'utf-8')
        const topics = JSON.parse(topicsData)
        topicCount = topics.length
      } catch {
        // No topics file or error reading it
      }
      
      return {
        ...event,
        organizerName: organizer?.name || 'Unknown',
        participantCount: eventMemberships.length,
        organizerCount: eventMemberships.filter((m: any) => m.role === 'Organizer').length,
        moderatorCount: eventMemberships.filter((m: any) => m.role === 'Moderator').length,
        topicCount
      }
    }))

    logger.debug(`Super admin events list accessed by ${(user as any).email}`)
    
    return {
      success: true,
      events: enhancedEvents
    }
  } catch (error) {
    logger.error('Error getting super admin events:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve events'
    })
  }
})

import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  // Check if user is super admin
  if ((user as any).globalRole !== 'SuperAdmin') {
    throw createError({
      statusCode: 403,
      message: 'Super admin access required'
    })
  }

  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'Event ID is required'
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
      events = []
    }

    // Find the specific event
    const targetEvent = events.find((e: any) => e.id === eventId)
    
    if (!targetEvent) {
      throw createError({
        statusCode: 404,
        message: 'Event not found'
      })
    }

    // Get all memberships for participant counts
    const membershipsPath = join(platformBasePath, 'memberships.json')
    let memberships = []
    try {
      const membershipsData = await fs.readFile(membershipsPath, 'utf-8')
      memberships = JSON.parse(membershipsData)
    } catch {
      memberships = []
    }

    // Get all users
    const usersPath = join(platformBasePath, 'users.json')
    let users = []
    try {
      const usersData = await fs.readFile(usersPath, 'utf-8')
      users = JSON.parse(usersData)
    } catch {
      users = []
    }

    // Get event-specific memberships
    const eventMemberships = memberships.filter((m: any) => m.eventId === eventId)
    const organizer = users.find((u: any) => u.id === targetEvent.organizerId)
    
    // Enhance event with stats
    const eventWithStats = {
      ...targetEvent,
      participantCount: eventMemberships.length,
      organizerName: organizer?.name || 'Unknown',
      organizerCount: eventMemberships.filter((m: any) => m.role === 'Organizer').length || 1,
      moderatorCount: eventMemberships.filter((m: any) => m.role === 'Moderator').length
    }

    // Mock activity data (in a real app, you'd have an activity log)
    const activities = [
      {
        id: '1',
        type: 'event_created',
        description: 'Event was created',
        timestamp: targetEvent.createdAt
      },
      {
        id: '2',
        type: targetEvent.isActive ? 'event_activated' : 'event_suspended',
        description: targetEvent.isActive ? 'Event was activated' : 'Event was suspended',
        timestamp: targetEvent.updatedAt || targetEvent.createdAt
      }
    ]

    logger.debug(`Super admin ${(user as any).email} viewed event ${eventId}`)
    
    return {
      success: true,
      event: eventWithStats,
      activities
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    logger.error('Error getting event details:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to retrieve event details'
    })
  }
})

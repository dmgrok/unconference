import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  // Check if user is super admin
  if ((user as any).globalRole !== 'SuperAdmin') {
    throw createError({
      statusCode: 403,
      message: 'Super admin access required'
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

    // Get all memberships for user counts
    const membershipsPath = join(platformBasePath, 'memberships.json')
    let memberships = []
    try {
      const membershipsData = await fs.readFile(membershipsPath, 'utf-8')
      memberships = JSON.parse(membershipsData)
    } catch {
      // No memberships file yet
    }

    // Calculate stats
    const activeEvents = events.filter((e: any) => e.isActive).length
    const totalUsers = new Set(memberships.map((m: any) => m.userId)).size
    const totalParticipants = memberships.length

    // Enhance events with participant counts
    const eventsWithStats = events.map((event: any) => {
      const eventMemberships = memberships.filter((m: any) => m.eventId === event.id)
      return {
        ...event,
        participantCount: eventMemberships.length,
        organizerCount: eventMemberships.filter((m: any) => m.role === 'Organizer').length,
        moderatorCount: eventMemberships.filter((m: any) => m.role === 'Moderator').length
      }
    })
    
    logger.debug(`Super admin dashboard accessed by ${(user as any).email}`)
    
    return {
      success: true,
      stats: {
        totalEvents: events.length,
        activeEvents,
        totalUsers,
        totalParticipants
      },
      events: eventsWithStats
    }
  } catch (error) {
    logger.error('Error getting super admin dashboard:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to retrieve dashboard data'
    })
  }
})

import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  // Check if user is super admin
  if ((user as any).globalRole !== 'Admin') {
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

    // Get all users
    const usersPath = join(platformBasePath, 'users.json')
    let users = []
    try {
      const usersData = await fs.readFile(usersPath, 'utf-8')
      users = JSON.parse(usersData)
    } catch {
      // No users file yet
    }

    // Calculate stats
    const activeEvents = events.filter((e: any) => e.isActive).length
    const totalUsers = users.length
    const totalOrganizers = memberships.filter((m: any) => m.role === 'Organizer').length

    // Enhance events with participant counts
    const eventsWithStats = events.map((event: any) => {
      const eventMemberships = memberships.filter((m: any) => m.eventId === event.id)
      const organizer = users.find((u: any) => u.id === event.organizerId)
      
      return {
        ...event,
        participantCount: eventMemberships.length,
        organizerName: organizer?.name || 'Unknown',
        organizerCount: eventMemberships.filter((m: any) => m.role === 'Organizer').length,
        moderatorCount: eventMemberships.filter((m: any) => m.role === 'Moderator').length
      }
    })

    // Recent activity (mock data for now - can be enhanced with actual activity tracking)
    const recentActivity = [
      {
        id: '1',
        type: 'event_created',
        description: 'New event created',
        eventName: events[0]?.name || 'Unknown Event',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'user_joined',
        description: 'New user joined platform',
        eventName: 'Platform',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ]

    // Recent events (top 5)
    const recentEvents = eventsWithStats.slice(0, 5)

    // Analytics
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const analytics = {
      eventsLast30Days: events.filter((e: any) => {
        return new Date(e.createdAt) > thirtyDaysAgo
      }).length,
      activeUsersToday: Math.floor(totalUsers * 0.2) // Mock calculation
    }

    // System health (mock data)
    const systemHealth = {
      server: 'healthy',
      database: 'healthy',
      memoryUsage: Math.floor(Math.random() * 30) + 50
    }
    
    logger.debug(`Super admin dashboard accessed by ${(user as any).email}`)
    
    return {
      success: true,
      stats: {
        totalEvents: events.length,
        activeEvents,
        totalUsers,
        totalOrganizers
      },
      events: eventsWithStats,
      recentActivity,
      recentEvents,
      analytics,
      systemHealth
    }
  } catch (error) {
    logger.error('Error getting super admin dashboard:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to retrieve dashboard data'
    })
  }
})

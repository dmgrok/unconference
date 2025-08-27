import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  // Check if user is super admin
  if ((user as any).globalRole !== 'SuperAdmin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Super admin access required'
    })
  }

  try {
    const platformBasePath = join(process.cwd(), 'data', 'platform')
    
    // Get all users
    const usersPath = join(platformBasePath, 'users.json')
    let users = []
    try {
      const usersData = await fs.readFile(usersPath, 'utf-8')
      users = JSON.parse(usersData)
    } catch {
      // No users file yet
    }

    // Get all memberships
    const membershipsPath = join(platformBasePath, 'memberships.json')
    let memberships = []
    try {
      const membershipsData = await fs.readFile(membershipsPath, 'utf-8')
      memberships = JSON.parse(membershipsData)
    } catch {
      // No memberships file yet
    }

    // Get all events for event names
    const eventsPath = join(platformBasePath, 'events.json')
    let events = []
    try {
      const eventsData = await fs.readFile(eventsPath, 'utf-8')
      events = JSON.parse(eventsData)
    } catch {
      // No events file yet
    }

    // Enhance users with event membership data
    const enhancedUsers = users.map((user: any) => {
      const userMemberships = memberships.filter((m: any) => m.userId === user.id)
      
      const eventMemberships = userMemberships.map((membership: any) => {
        const event = events.find((e: any) => e.id === membership.eventId)
        return {
          eventId: membership.eventId,
          eventName: event?.name || 'Unknown Event',
          role: membership.role,
          joinedAt: membership.joinedAt
        }
      })

      return {
        ...user,
        eventCount: userMemberships.length,
        eventMemberships
      }
    })

    logger.debug(`Super admin users list accessed by ${(user as any).email}`)
    
    return {
      success: true,
      users: enhancedUsers
    }
  } catch (error) {
    logger.error('Error getting super admin users:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve users'
    })
  }
})

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

  // Check if user has permission to read participants in this event
  await requireEventPermission(event, eventId, 'participants', 'read')

  try {
    const platformPath = join(process.cwd(), 'data', 'platform')
    const eventPath = join(process.cwd(), 'data', 'events', eventId)
    
    // Load memberships for this event
    const membershipsPath = join(platformPath, 'memberships.json')
    const usersPath = join(platformPath, 'users.json')
    
    let memberships = []
    let users = []
    
    try {
      const membershipsData = await fs.readFile(membershipsPath, 'utf-8')
      memberships = JSON.parse(membershipsData)
    } catch {
      // No memberships file
    }
    
    try {
      const usersData = await fs.readFile(usersPath, 'utf-8')
      users = JSON.parse(usersData)
    } catch {
      // No users file
    }

    // Get event-specific memberships
    const eventMemberships = memberships.filter((m: any) => m.eventId === eventId)
    
    // Enhance with user data
    const participants = eventMemberships.map((membership: any) => {
      const user = users.find((u: any) => u.id === membership.userId)
      
      return {
        id: membership.userId,
        name: user?.name || 'Unknown User',
        email: user?.email || 'unknown@example.com',
        role: membership.role,
        status: membership.status || 'active',
        joinedAt: membership.joinedAt,
        lastActive: user?.lastLoginAt
      }
    })

    return {
      success: true,
      participants
    }

  } catch (error) {
    logger.error('Error getting event participants:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load participants'
    })
  }
})

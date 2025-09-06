import logger from '../../../utils/logger'
import { eventService } from "../../../utils/eventService"
import { resolveUserId } from '../../utils/userHelper'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required'
    })
  }

  try {
    // Get the actual user ID by looking up the user by email
    const userId = await resolveUserId(user)
    
    if (!userId) {
      logger.warn(`No user found for session user: ${JSON.stringify(user)}`)
      return {
        success: true,
        events: []
      }
    }
    
    const userEvents = await eventService.getUserEvents(userId)
    
    // Enhance events with user role information
    const eventsWithRoles = await Promise.all(
      userEvents.map(async (evt) => {
        const userRole = await eventService.getUserRoleInEvent(userId, evt.id)
        return {
          ...evt,
          role: userRole,
          joinedAt: evt.createdAt // Default to creation date, could be enhanced with actual join date
        }
      })
    )
    
    logger.debug(`Retrieved ${eventsWithRoles.length} events for user ${userId} (${(user as any).email})`)
    
    return {
      success: true,
      events: eventsWithRoles
    }
  } catch (error) {
    logger.error('Error getting user events:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to retrieve events'
    })
  }
})

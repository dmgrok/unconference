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
    
    logger.debug(`Retrieved ${userEvents.length} events for user ${userId} (${(user as any).email})`)
    
    return {
      success: true,
      events: userEvents
    }
  } catch (error) {
    logger.error('Error getting user events:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to retrieve events'
    })
  }
})

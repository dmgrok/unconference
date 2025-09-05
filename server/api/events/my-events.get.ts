import logger from '../../../utils/logger'
import { eventService } from "../../../utils/eventService"

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required'
    })
  }

  try {
    const userId = (user as any).id || (user as any).email
    const userEvents = await eventService.getUserEvents(userId)
    
    logger.debug(`Retrieved ${userEvents.length} events for user ${userId}`)
    
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

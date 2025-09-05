import logger from '../../../../../utils/logger'
import { eventService } from "../../../../../utils/eventService"

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'Event ID is required'
    })
  }

  // Check if user has access to this event (at least participant level)
  const userId = (user as any).id || (user as any).email
  const userRole = await eventService.getUserRoleInEvent(userId, eventId)
  
  if (!userRole) {
    throw createError({
      statusCode: 403,
      message: 'Access denied to this event'
    })
  }

  try {
    const organizers = await eventService.getEventOrganizers(eventId)
    
    return {
      success: true,
      organizers
    }
  } catch (error) {
    logger.error('Error getting event organizers:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to get event organizers'
    })
  }
})

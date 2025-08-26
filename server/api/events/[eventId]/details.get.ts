import { z } from 'zod'
import logger from '../../../../utils/logger'
import { eventService } from '../../../utils/eventService'
import { requireEventPermission } from '../../../utils/authService'

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'Event ID is required'
    })
  }

  // Check if user has permission to view event details
  await requireEventPermission(event, eventId, 'settings', 'read')

  try {
    const eventData = await eventService.getEvent(eventId)
    
    if (!eventData) {
      throw createError({
        statusCode: 404,
        message: 'Event not found'
      })
    }
    
    logger.debug(`Retrieved event details for ${eventId}`)
    
    return {
      success: true,
      event: eventData
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    logger.error('Error getting event details:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to retrieve event details'
    })
  }
})

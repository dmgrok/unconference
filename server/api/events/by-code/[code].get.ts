import logger from '../../../../utils/logger'
import { eventService } from '../../../../utils/eventService'

export default defineEventHandler(async (event) => {
  const eventCode = getRouterParam(event, 'code')
  
  if (!eventCode) {
    throw createError({
      statusCode: 400,
      message: 'Event code is required'
    })
  }

  try {
    const eventData = await eventService.getEventByCode(eventCode.toUpperCase())
    
    if (!eventData) {
      throw createError({
        statusCode: 404,
        message: 'Event not found'
      })
    }

    logger.debug(`Retrieved event by code ${eventCode}: ${eventData.name}`)
    
    return {
      success: true,
      event: eventData
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    logger.error('Error getting event by code:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to retrieve event'
    })
  }
})

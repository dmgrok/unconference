import logger from '../../../../utils/logger'
import { eventService } from '../../../../utils/eventService'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'Event ID is required'
    })
  }

  const userId = (user as any).id || (user as any).email

  try {
    // Check if event exists
    const eventData = await eventService.getEvent(eventId)
    if (!eventData) {
      throw createError({
        statusCode: 404,
        message: 'Event not found'
      })
    }

    // Check if user is already a member
    const existingRole = await eventService.getUserRoleInEvent(userId, eventId)
    
    if (existingRole) {
      return {
        success: true,
        message: 'Already a member of this event',
        role: existingRole
      }
    }

    // Check participant limit (49 for free tier)
    const currentParticipants = await eventService.getEventParticipants(eventId)
    const participantCount = currentParticipants.length
    
    // TODO: Check if event has commercial license - for now, enforce 49 limit
    const maxParticipants = 49
    
    if (participantCount >= maxParticipants) {
      throw createError({
        statusCode: 403,
        message: `Event has reached the maximum participant limit (${maxParticipants}). Upgrade to commercial license for unlimited participants.`,
        data: {
          participantCount,
          maxParticipants,
          upgradeRequired: true
        }
      })
    }

    // Add user as participant
    await eventService.addEventMembership(eventId, userId, 'Participant')
    
    logger.info(`User ${userId} joined event ${eventId}`)
    
    return {
      success: true,
      message: 'Successfully joined event',
      role: 'Participant'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    logger.error('Error joining event:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to join event'
    })
  }
})

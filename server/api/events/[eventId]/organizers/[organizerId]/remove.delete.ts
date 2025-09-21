import logger from '../../../../../../utils/logger'
import { eventService } from "../../../../../../utils/eventService"

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const eventId = getRouterParam(event, 'eventId')
  const organizerId = getRouterParam(event, 'organizerId')
  
  if (!eventId || !organizerId) {
    throw createError({
      statusCode: 400,
      message: 'Event ID and Organizer ID are required'
    })
  }

  // Check if user is organizer of this event
  const userId = (user as any).id || (user as any).email
  const userRole = await eventService.getUserRoleInEvent(userId, eventId)
  const isAdmin = (user as any).globalRole === 'Admin'
  
  if (userRole !== 'Organizer' && !isAdmin) {
    throw createError({
      statusCode: 403,
      message: 'Only organizers or super admins can remove organizers'
    })
  }

  try {
    // Get event details to check primary organizer
    const eventDetails = await eventService.getEvent(eventId)
    if (!eventDetails) {
      throw createError({
        statusCode: 404,
        message: 'Event not found'
      })
    }

    // Prevent removing the primary organizer (event creator)
    if (eventDetails.organizerId === organizerId) {
      throw createError({
        statusCode: 400,
        message: 'Cannot remove the primary organizer. Transfer ownership first.'
      })
    }

    // Prevent self-removal unless super admin
    if (userId === organizerId && !isAdmin) {
      throw createError({
        statusCode: 400,
        message: 'Cannot remove yourself as organizer. Ask another organizer or transfer ownership.'
      })
    }

    // Remove organizer role (change to participant)
    await eventService.addEventMembership(eventId, organizerId, 'Participant')
    
    logger.info(`Organizer ${organizerId} removed from event ${eventId} by ${userId}`)
    
    return {
      success: true,
      message: 'Organizer removed successfully'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    logger.error('Error removing organizer:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to remove organizer'
    })
  }
})

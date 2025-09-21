import { eventService } from '../../../../utils/eventService'
import { resolveUserId } from '../../../utils/userHelper'
import logger from '../../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID is required'
    })
  }

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  try {
    // Get the actual user ID by looking up the user by email
    const userId = await resolveUserId(user)
    
    if (!userId) {
      logger.warn(`No user found for session user: ${JSON.stringify(user)}`)
      throw createError({
        statusCode: 403,
        statusMessage: 'User not found in platform'
      })
    }

    // Check if user has access to this event
    const userRole = await eventService.getUserRoleInEvent(userId, eventId)
    const isAdmin = (user as any).globalRole === 'Admin'
    
    if (!userRole && !isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied to this event'
      })
    }

    // Get event details
    const eventDetails = await eventService.getEvent(eventId)
    if (!eventDetails) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }

    const isActive = (eventDetails as any).isActive ?? true
    let statusReason = ''
    
    if (!isActive) {
      if ((eventDetails as any).suspendedAt) {
        statusReason = 'Event was suspended by an administrator'
      } else if ((eventDetails as any).closedAt) {
        statusReason = 'Event was closed by an organizer'
      } else {
        statusReason = 'Event is currently inactive'
      }
    }

    return {
      success: true,
      isActive,
      statusReason,
      canReactivate: userRole === 'Organizer' || isAdmin,
      suspendedAt: (eventDetails as any).suspendedAt,
      closedAt: (eventDetails as any).closedAt,
      reactivatedAt: (eventDetails as any).reactivatedAt || (eventDetails as any).activatedAt
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to get event status'
    })
  }
})

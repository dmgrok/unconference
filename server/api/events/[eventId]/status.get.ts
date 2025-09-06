import { eventService } from '../../../../utils/eventService'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID is required'
    })
  }

  const userId = (user as any).id || (user as any).email

  try {
    // Check if user has access to this event
    const userRole = await eventService.getUserRoleInEvent(userId, eventId)
    const isSuperAdmin = (user as any).globalRole === 'SuperAdmin'
    
    if (!userRole && !isSuperAdmin) {
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
      canReactivate: userRole === 'Organizer' || isSuperAdmin,
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

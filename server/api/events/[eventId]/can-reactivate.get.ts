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
    // Check if user has permission to reactivate this event
    const userRole = await eventService.getUserRoleInEvent(userId, eventId)
    const isSuperAdmin = (user as any).globalRole === 'SuperAdmin'
    
    // Only organizers and super admins can reactivate events
    const canReactivate = userRole === 'Organizer' || isSuperAdmin

    return {
      success: true,
      canReactivate,
      userRole,
      isSuperAdmin
    }

  } catch (error: any) {
    return {
      success: true,
      canReactivate: false,
      userRole: null,
      isSuperAdmin: false
    }
  }
})

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
      return {
        success: true,
        canReactivate: false,
        userRole: null,
        isSuperAdmin: false
      }
    }

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

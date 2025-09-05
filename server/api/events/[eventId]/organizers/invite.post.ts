import { z } from 'zod'
import logger from '../../../../../utils/logger'
import { eventService } from "../../../../../utils/eventService"

const inviteOrganizerSchema = z.object({
  email: z.string().email(),
  message: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'Event ID is required'
    })
  }

  // Check if user is organizer of this event
  const userId = (user as any).id || (user as any).email
  const userRole = await eventService.getUserRoleInEvent(userId, eventId)
  
  if (userRole !== 'Organizer') {
    throw createError({
      statusCode: 403,
      message: 'Only organizers can invite additional organizers'
    })
  }

  const body = await readValidatedBody(event, inviteOrganizerSchema.parse)
  
  try {
    // Check if user already exists in platform
    const platformUsers = await eventService.getPlatformUsers()
    const existingUser = platformUsers.find((u: any) => u.email === body.email)
    
    if (existingUser) {
      // Check if already an organizer
      const existingRole = await eventService.getUserRoleInEvent(existingUser.id, eventId)
      if (existingRole === 'Organizer') {
        throw createError({
          statusCode: 400,
          message: 'User is already an organizer of this event'
        })
      }
      
      // Add organizer role
      await eventService.addEventMembership(eventId, existingUser.id, 'Organizer')
      
      logger.info(`User ${existingUser.email} invited as organizer to event ${eventId} by ${userId}`)
      
      return {
        success: true,
        message: 'User has been added as organizer',
        userExists: true
      }
    } else {
      // TODO: Implement invitation system for new users
      // For now, return error asking them to join platform first
      throw createError({
        statusCode: 404,
        message: 'User not found. They need to join the platform first.'
      })
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    logger.error('Error inviting organizer:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to invite organizer'
    })
  }
})

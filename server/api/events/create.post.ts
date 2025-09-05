import { z } from 'zod'
import logger from '../../../utils/logger'
import { eventService } from '../../../utils/eventService'

const createEventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  description: z.string().optional(),
  location: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  settings: z.object({
    allowGuestAccess: z.boolean().optional(),
    maxVotesPerTopic: z.number().optional(),
    topTopicsCount: z.number().optional(),
    allowTopicSubmission: z.boolean().optional(),
    autoStartNewRound: z.boolean().optional(),
    showVoterNames: z.boolean().optional(),
    maxParticipants: z.number().optional()
  }).optional()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required'
    })
  }

  try {
    const body = await readValidatedBody(event, createEventSchema.parse)
    
    const userId = (user as any).id || (user as any).email
    
    // Create the event using the event service
    const newEvent = await eventService.createEvent(userId, {
      name: body.name,
      description: body.description,
      location: body.location,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      settings: body.settings // The eventService will merge with defaults
    })
    
    logger.info(`Event created successfully: ${newEvent.name} (${newEvent.id}) by user ${userId}`)
    
    return {
      success: true,
      message: 'Event created successfully',
      event: newEvent
    }
  } catch (error: any) {
    // If it's already a validation or server error, re-throw it
    if (error.statusCode) {
      throw error
    }
    
    logger.error('Error creating event:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create event'
    })
  }
})

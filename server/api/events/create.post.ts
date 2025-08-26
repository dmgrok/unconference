import { z } from 'zod'
import logger from '../../../utils/logger'
import { eventService } from "../../../utils/eventService"

const createEventSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  settings: z.object({
    maxVotesPerTopic: z.number().min(1).max(50).optional(),
    topTopicsCount: z.number().min(1).max(20).optional(),
    showVoterNames: z.boolean().optional(),
    allowTopicSubmission: z.boolean().optional(),
    autoStartNewRound: z.boolean().optional(),
    allowGuestAccess: z.boolean().optional(),
    maxParticipants: z.number().min(1).optional()
  }).optional()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  // Only authenticated users can create events
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required'
    })
  }

  const body = await readValidatedBody(event, createEventSchema.parse)
  
  try {
    const userId = (user as any).id || (user as any).email
    const newEvent = await eventService.createEvent(userId, {
      ...body,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined
    })
    
    logger.info(`Event created: ${newEvent.name} (${newEvent.id}) by user ${userId}`)
    
    return {
      success: true,
      event: newEvent,
      message: 'Event created successfully'
    }
  } catch (error) {
    logger.error('Error creating event:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create event'
    })
  }
})

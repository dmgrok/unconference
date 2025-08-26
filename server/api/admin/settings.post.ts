import { promises as fs } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import logger from '../../../utils/logger'
import { requireEventPermission } from "../../../utils/authService"

const settingsSchema = z.object({
  maxVotesPerTopic: z.number().min(1).max(50),
  topTopicsCount: z.number().min(1).max(20),
  showVoterNames: z.boolean(),
  allowTopicSubmission: z.boolean(),
  autoStartNewRound: z.boolean(),
  allowGuestAccess: z.boolean().optional(),
  maxParticipants: z.number().min(1).optional()
})

export default defineEventHandler(async (event) => {
  const eventId = getQuery(event).eventId as string
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'Event ID is required'
    })
  }

  // Check if user has permission to update event settings
  await requireEventPermission(event, eventId, 'settings', 'update')

  const body = await readValidatedBody(event, settingsSchema.parse)
  
  try {
    // Ensure event directory exists
    const eventDir = join(process.cwd(), 'data', 'events', eventId)
    await fs.mkdir(eventDir, { recursive: true })
    
    // Save settings to event-specific file
    const settingsPath = join(eventDir, 'settings.json')
    await fs.writeFile(settingsPath, JSON.stringify(body, null, 2))
    
    logger.info(`Event settings saved successfully for event ${eventId}`, body)
    
    return {
      success: true,
      settings: body
    }
  } catch (error: any) {
    logger.error('Error saving admin settings:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to save admin settings'
    })
  }
})

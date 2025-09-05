import { promises as fs } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import logger from '../../../utils/logger'

const settingsSchema = z.object({
  maxVotesPerTopic: z.number().min(1).max(50),
  topTopicsCount: z.number().min(1).max(20),
  showVoterNames: z.boolean(),
  allowTopicSubmission: z.boolean(),
  autoStartNewRound: z.boolean(),
  roundDurationMinutes: z.number().min(5).max(180).optional(),
  maxTopicsPerRound: z.number().min(1).max(20).optional(),
  allowGuestAccess: z.boolean().optional(),
  maxParticipants: z.number().min(1).optional()
})

export default defineEventHandler(async (event) => {
  // For backward compatibility, support calls without eventId
  const eventId = getQuery(event).eventId as string
  
  const body = await readValidatedBody(event, settingsSchema.parse)
  
  try {
    let settingsPath: string
    
    if (eventId) {
      // Multi-event mode
      const eventDir = join(process.cwd(), 'data', 'events', eventId)
      await fs.mkdir(eventDir, { recursive: true })
      settingsPath = join(eventDir, 'settings.json')
    } else {
      // Single event mode (backward compatibility)
      settingsPath = join(process.cwd(), 'data', 'admin-settings.json')
    }
    
    await fs.writeFile(settingsPath, JSON.stringify(body, null, 2))
    
    logger.info(`Admin settings saved successfully to ${settingsPath}`, body)
    
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

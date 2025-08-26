import { promises as fs } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import logger from '../../../utils/logger'

const settingsSchema = z.object({
  maxVotesPerTopic: z.number().min(1).max(50),
  topTopicsCount: z.number().min(1).max(20),
  showVoterNames: z.boolean(),
  allowTopicSubmission: z.boolean(),
  autoStartNewRound: z.boolean()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  // Check if user is admin
  if ((user as any).role !== 'Admin') {
    throw createError({
      statusCode: 403,
      message: 'Admin access required'
    })
  }

  const body = await readValidatedBody(event, settingsSchema.parse)
  const settingsPath = join(process.cwd(), 'data', 'admin-settings.json')
  
  try {
    // Ensure data directory exists
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true })
    
    // Save settings to file
    await fs.writeFile(settingsPath, JSON.stringify(body, null, 2))
    
    logger.info('Admin settings saved successfully', body)
    
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

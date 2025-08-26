import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  // Check if user is admin
  if ((user as any).role !== 'Admin') {
    throw createError({
      statusCode: 403,
      message: 'Admin access required'
    })
  }

  const config = useRuntimeConfig()
  const settingsPath = join(process.cwd(), 'data', 'admin-settings.json')
  
  try {
    // Try to read existing settings file
    const settingsData = await fs.readFile(settingsPath, 'utf-8')
    const settings = JSON.parse(settingsData)
    
    logger.debug('Admin settings loaded from file')
    return settings
  } catch (error) {
    // If file doesn't exist, return default settings
    const defaultSettings = {
      maxVotesPerTopic: config.public.maxVotesPerTopic || 12,
      topTopicsCount: config.public.topTopicsCount || 10,
      showVoterNames: true,
      allowTopicSubmission: true,
      autoStartNewRound: false
    }
    
    logger.debug('Using default admin settings')
    return defaultSettings
  }
})

import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'
import { requireEventPermission } from "../../../utils/authService"

export default defineEventHandler(async (event) => {
  const eventId = getQuery(event).eventId as string
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'Event ID is required'
    })
  }

  // Check if user has permission to read event settings
  await requireEventPermission(event, eventId, 'settings', 'read')

  try {
    // Read event-specific settings
    const settingsPath = join(process.cwd(), 'data', 'events', eventId, 'settings.json')
    const settingsData = await fs.readFile(settingsPath, 'utf-8')
    const settings = JSON.parse(settingsData)
    
    logger.debug(`Event settings loaded for event ${eventId}`)
    return settings
  } catch (error) {
    // If file doesn't exist, return default settings
    const defaultSettings = {
      maxVotesPerTopic: 12,
      topTopicsCount: 10,
      showVoterNames: true,
      allowTopicSubmission: true,
      autoStartNewRound: false,
      allowGuestAccess: true
    }
    
    logger.debug(`Using default settings for event ${eventId}`)
    return defaultSettings
  }
})

import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  // For backward compatibility, support calls without eventId
  const eventId = getQuery(event).eventId as string
  
  try {
    let settingsPath: string
    
    if (eventId) {
      // Multi-event mode
      settingsPath = join(process.cwd(), 'data', 'events', eventId, 'settings.json')
    } else {
      // Single event mode (backward compatibility)
      settingsPath = join(process.cwd(), 'data', 'admin-settings.json')
    }
    
    const settingsData = await fs.readFile(settingsPath, 'utf-8')
    const settings = JSON.parse(settingsData)
    
    logger.debug(`Admin settings loaded from ${settingsPath}`)
    return settings
  } catch (error) {
    // If file doesn't exist, return default settings
    const defaultSettings = {
      maxVotesPerTopic: 12,
      topTopicsCount: 10,
      showVoterNames: true,
      allowTopicSubmission: true,
      autoStartNewRound: false,
      roundDurationMinutes: 20,
      maxTopicsPerRound: 8,
      allowGuestAccess: true
    }
    
    logger.debug(`Using default admin settings`)
    return defaultSettings
  }
})

import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  // Check if user is super admin
  if ((user as any).globalRole !== 'SuperAdmin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Super admin access required'
    })
  }

  try {
    const dataBasePath = join(process.cwd(), 'data')
    
    const exportData: {
      exportDate: string
      exportedBy: string
      platform: Record<string, any>
      events: Record<string, any>
    } = {
      exportDate: new Date().toISOString(),
      exportedBy: (user as any).email,
      platform: {},
      events: {}
    }

    // Export platform data
    const platformPath = join(dataBasePath, 'platform')
    try {
      const platformFiles = await fs.readdir(platformPath)
      for (const file of platformFiles) {
        if (file.endsWith('.json')) {
          const filePath = join(platformPath, file)
          const data = await fs.readFile(filePath, 'utf-8')
          const key = file.replace('.json', '')
          exportData.platform[key] = JSON.parse(data)
        }
      }
    } catch {
      // No platform directory
    }

    // Export events data
    const eventsPath = join(dataBasePath, 'events')
    try {
      const eventDirs = await fs.readdir(eventsPath)
      for (const eventDir of eventDirs) {
        const eventPath = join(eventsPath, eventDir)
        const eventStat = await fs.stat(eventPath)
        if (eventStat.isDirectory()) {
          const eventData: Record<string, any> = {}
          const eventFiles = await fs.readdir(eventPath)
          for (const file of eventFiles) {
            if (file.endsWith('.json')) {
              const filePath = join(eventPath, file)
              const data = await fs.readFile(filePath, 'utf-8')
              const key = file.replace('.json', '')
              eventData[key] = JSON.parse(data)
            }
          }
          exportData.events[eventDir] = eventData
        }
      }
    } catch {
      // No events directory
    }

    logger.info(`Platform data exported by super admin ${(user as any).email}`)
    
    return {
      success: true,
      data: exportData
    }
  } catch (error) {
    logger.error('Error exporting platform data:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to export data'
    })
  }
})

import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readBody(event)
  
  // Check if user is super admin
  if ((user as any).globalRole !== 'SuperAdmin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Super admin access required'
    })
  }

  try {
    const platformBasePath = join(process.cwd(), 'data', 'platform')
    
    // Ensure platform directory exists
    try {
      await fs.access(platformBasePath)
    } catch {
      await fs.mkdir(platformBasePath, { recursive: true })
    }

    const settingsPath = join(platformBasePath, 'super-admin-settings.json')
    
    // Save settings
    const settingsToSave = {
      ...body.settings,
      updatedAt: new Date().toISOString(),
      updatedBy: (user as any).email
    }

    await fs.writeFile(settingsPath, JSON.stringify(settingsToSave, null, 2))

    logger.info(`Platform settings updated by super admin ${(user as any).email}`)
    
    return {
      success: true,
      message: 'Settings saved successfully'
    }
  } catch (error) {
    logger.error('Error saving super admin settings:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save settings'
    })
  }
})

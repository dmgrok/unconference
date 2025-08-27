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
    const platformBasePath = join(process.cwd(), 'data', 'platform')
    const settingsPath = join(platformBasePath, 'super-admin-settings.json')
    
    // Default settings
    const defaultSettings = {
      platformName: 'Unconference Platform',
      platformDescription: 'A platform for organizing discussion-based unconferences',
      supportEmail: 'support@unconference.com',
      maxEventsPerOrganizer: 10,
      allowPublicRegistration: true,
      requireEmailVerification: false,
      allowGuestAccess: true,
      sessionTimeoutMinutes: 480,
      maxParticipantsPerEvent: 500,
      maxTopicsPerEvent: 100,
      enableAuditLog: true,
      dataRetentionDays: 365,
      autoBackup: true,
      backupFrequencyHours: 24,
      features: {
        multiEvent: true,
        qrCodeJoin: true,
        realTimeUpdates: true,
        analytics: true,
        eventCloning: true,
        advancedPermissions: false
      },
      notifications: {
        emailEnabled: true,
        eventCreated: true,
        userRegistered: true,
        fromEmail: 'noreply@unconference.com',
        fromName: 'Unconference Platform'
      },
      announcement: {
        enabled: false,
        type: 'info',
        title: '',
        message: '',
        expiresAt: ''
      }
    }

    let settings = defaultSettings
    try {
      const settingsData = await fs.readFile(settingsPath, 'utf-8')
      settings = { ...defaultSettings, ...JSON.parse(settingsData) }
    } catch {
      // Use default settings if file doesn't exist
    }

    logger.debug(`Super admin settings accessed by ${(user as any).email}`)
    
    return {
      success: true,
      settings
    }
  } catch (error) {
    logger.error('Error getting super admin settings:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve settings'
    })
  }
})

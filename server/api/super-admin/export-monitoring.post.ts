import { monitoringService } from '../../utils/monitoringService'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  // Check if user is super admin
  if ((user as any).globalRole !== 'SuperAdmin') {
    throw createError({
      statusCode: 403,
      message: 'Super admin access required'
    })
  }

  try {
    const filePath = await monitoringService.exportMonitoringData()
    
    return {
      success: true,
      message: 'Monitoring data exported successfully',
      filePath: filePath.replace(process.cwd(), ''),
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to export monitoring data'
    })
  }
})

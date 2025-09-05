import { monitoringService } from '../../utils/monitoringService'
import { securityService } from '../../utils/securityService'

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
    const [systemMetrics, apiMetrics, securityMetrics] = await Promise.all([
      monitoringService.getSystemMetrics(),
      monitoringService.getAPIMetrics(),
      securityService.getMetrics()
    ])

    const errorSummary = monitoringService.getErrorSummary()
    const performanceInsights = monitoringService.getPerformanceInsights()
    const recentActivities = monitoringService.getRecentUserActivities(20)

    return {
      system: systemMetrics,
      api: {
        endpoints: apiMetrics.slice(0, 20), // Top 20 endpoints
        totalEndpoints: apiMetrics.length,
        errorSummary: errorSummary.slice(0, 10), // Top 10 error sources
        performance: performanceInsights
      },
      security: securityMetrics,
      activities: recentActivities,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch monitoring data'
    })
  }
})

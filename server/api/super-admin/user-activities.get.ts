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

  const query = getQuery(event)
  const userId = query.userId as string

  if (!userId) {
    throw createError({
      statusCode: 400,
      message: 'User ID is required'
    })
  }

  try {
    const activities = monitoringService.getUserActivities(userId, 50)
    
    return {
      userId,
      activities,
      total: activities.length,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch user activities'
    })
  }
})

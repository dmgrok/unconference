import { z } from 'zod'
import { AnalyticsService } from '~/server/utils/analyticsService'
import logger from '~/server/utils/logger'

const querySchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d', '12m']).optional().default('30d'),
  eventIds: z.string().optional(), // comma-separated event IDs
  includeDetails: z.boolean().optional().default(false)
})

export default defineEventHandler(async (event) => {
  try {
    // Ensure user is authenticated and is admin
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const user = session.user as any
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!currentUser || currentUser.globalRole !== 'SUPER_ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const query = getQuery(event)
    const { timeRange, eventIds, includeDetails } = querySchema.parse(query)

    // Calculate date range
    const endDate = new Date()
    let startDate = new Date()

    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '12m':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
    }

    // Parse event IDs filter
    const eventIdFilter = eventIds?.split(',').filter(id => id.trim())

    const filters = {
      dateRange: { start: startDate, end: endDate },
      ...(eventIdFilter?.length && { eventIds: eventIdFilter })
    }

    // Get platform metrics
    const platformMetrics = await AnalyticsService.getPlatformMetrics(filters)

    // Get recent events with metrics if details requested
    let eventMetrics = []
    if (includeDetails) {
      const recentEvents = await prisma.event.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          ...(eventIdFilter?.length && { id: { in: eventIdFilter } })
        },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      })

      eventMetrics = await Promise.all(
        recentEvents.map(async (e) => ({
          ...e,
          metrics: await AnalyticsService.getEventMetrics(e.id)
        }))
      )
    }

    // Get user engagement trends
    const engagementTrend = await prisma.userEngagement.groupBy({
      by: ['date'],
      where: {
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      _avg: {
        engagementScore: true
      },
      _count: {
        userId: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    // Get top performing events
    const topEvents = await prisma.eventAnalytics.findMany({
      select: {
        eventId: true,
        engagementScore: true,
        successScore: true,
        totalConnections: true,
        totalParticipants: true
      },
      orderBy: {
        successScore: 'desc'
      },
      take: 5
    })

    // Get cohort analysis
    const cohortAnalysis = await AnalyticsService.getCohortAnalysis('monthly')

    const dashboardData = {
      platformMetrics,
      engagementTrend: engagementTrend.map(et => ({
        date: et.date,
        avgEngagement: et._avg.engagementScore || 0,
        activeUsers: et._count.userId
      })),
      topEvents,
      cohortAnalysis,
      ...(includeDetails && { eventMetrics }),
      metadata: {
        timeRange,
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
        generatedAt: new Date().toISOString(),
        filters: filters
      }
    }

    return {
      success: true,
      data: dashboardData
    }

  } catch (error: any) {
    logger.error('Analytics dashboard error:', error)

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid query parameters',
        data: error.errors
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to generate analytics dashboard'
    })
  }
})
import { z } from 'zod'
import prisma from '~/lib/database'
import { SUBSCRIPTION_LIMITS } from '~/lib/subscription'

const analyticsQuerySchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d', '12m']).optional().default('30d'),
  format: z.enum(['json', 'csv']).optional().default('json')
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
    const { timeRange, format } = analyticsQuerySchema.parse(query)

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

    // Get analytics data
    const analyticsData = await generateAnalyticsData(startDate, endDate)

    if (format === 'csv') {
      return await generateCSVExport(analyticsData, timeRange)
    }

    return {
      success: true,
      data: analyticsData,
      timeRange,
      generatedAt: new Date().toISOString()
    }

  } catch (error: any) {
    console.error('Analytics error:', error)

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
      statusMessage: error.message || 'Failed to generate analytics'
    })
  }
})

async function generateAnalyticsData(startDate: Date, endDate: Date) {
  // Summary statistics
  const totalUsers = await prisma.user.count()

  const activeSubscriptions = await prisma.user.count({
    where: {
      subscriptionStatus: 'ACTIVE',
      subscriptionTier: { not: 'FREE' }
    }
  })

  const paidUsers = await prisma.user.findMany({
    where: {
      subscriptionStatus: 'ACTIVE',
      subscriptionTier: { not: 'FREE' }
    },
    select: {
      subscriptionTier: true,
      subscriptionStart: true,
      subscriptionEnd: true
    }
  })

  // Calculate monthly revenue
  const totalRevenue = paidUsers.reduce((sum, user) => {
    const tierPrices = {
      'COMMUNITY': 19,
      'ORGANIZER': 49,
      'UNLIMITED': 99
    }
    return sum + (tierPrices[user.subscriptionTier as keyof typeof tierPrices] || 0)
  }, 0)

  const averageRevenue = activeSubscriptions > 0 ? Math.round(totalRevenue / activeSubscriptions) : 0

  // Calculate churn rate (canceled subscriptions in the period vs total at start)
  const canceledInPeriod = await prisma.user.count({
    where: {
      subscriptionStatus: 'CANCELED',
      subscriptionEnd: {
        gte: startDate,
        lte: endDate
      }
    }
  })

  const churnRate = activeSubscriptions > 0 ?
    Math.round((canceledInPeriod / (activeSubscriptions + canceledInPeriod)) * 100 * 10) / 10 : 0

  // Tier distribution
  const tierCounts = await prisma.user.groupBy({
    by: ['subscriptionTier'],
    _count: {
      subscriptionTier: true
    }
  })

  const tierDistribution = tierCounts.map(tier => ({
    tier: tier.subscriptionTier,
    count: tier._count.subscriptionTier,
    percentage: Math.round((tier._count.subscriptionTier / totalUsers) * 100)
  }))

  // Usage trends
  const eventsInPeriod = await prisma.event.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    },
    include: {
      memberships: {
        where: { status: 'ACTIVE' }
      },
      owner: {
        select: { subscriptionTier: true }
      }
    }
  })

  const totalEvents = eventsInPeriod.length
  const totalParticipants = eventsInPeriod.reduce((sum, event) => sum + event.memberships.length, 0)
  const avgEventsPerUser = activeSubscriptions > 0 ? Math.round(totalEvents / activeSubscriptions * 10) / 10 : 0
  const avgParticipantsPerEvent = totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0

  // Calculate capacity utilization
  const capacityUtilization = eventsInPeriod.length > 0 ?
    Math.round((eventsInPeriod.reduce((sum, event) => {
      const limits = SUBSCRIPTION_LIMITS[event.owner.subscriptionTier]
      const maxCapacity = limits.maxParticipants === -1 ? 1000 : limits.maxParticipants
      return sum + (event.memberships.length / maxCapacity)
    }, 0) / eventsInPeriod.length) * 100) : 0

  // Recent activities from audit logs
  const recentActivities = await prisma.auditLog.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate
      },
      action: {
        in: [
          'subscription_upgraded',
          'subscription_downgraded',
          'subscription_canceled',
          'payment_failed',
          'payment_recovered'
        ]
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      }
    }
  })

  const formattedActivities = recentActivities.map(log => {
    let title = ''
    let description = ''

    switch (log.action) {
      case 'subscription_upgraded':
        title = 'Subscription Upgraded'
        const upgradeDetails = JSON.parse(log.details || '{}')
        description = `User upgraded from ${upgradeDetails.fromTier || 'FREE'} to ${upgradeDetails.toTier}`
        break
      case 'subscription_downgraded':
        title = 'Subscription Downgraded'
        const downgradeDetails = JSON.parse(log.details || '{}')
        description = `User downgraded from ${downgradeDetails.fromTier} to ${downgradeDetails.toTier}`
        break
      case 'subscription_canceled':
        title = 'Subscription Canceled'
        description = 'User canceled their subscription'
        break
      case 'payment_failed':
        title = 'Payment Failed'
        const failureDetails = JSON.parse(log.details || '{}')
        description = `Payment of $${failureDetails.amount || 0} failed`
        break
      case 'payment_recovered':
        title = 'Payment Recovered'
        const recoveryDetails = JSON.parse(log.details || '{}')
        description = `Payment of $${recoveryDetails.amount || 0} succeeded after failure`
        break
      default:
        title = log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        description = 'Subscription activity'
    }

    return {
      id: log.id,
      type: log.action,
      title,
      description,
      timestamp: log.createdAt,
      userId: log.userId || undefined,
      userName: log.user?.name || 'Unknown User'
    }
  })

  return {
    summaryStats: {
      totalRevenue,
      activeSubscriptions,
      churnRate,
      averageRevenue
    },
    tierDistribution,
    usageTrends: {
      avgEventsPerUser,
      avgParticipantsPerEvent,
      capacityUtilization,
      eventsTrend: 8.3, // Mock trend data - would need historical comparison
      participantsTrend: 12.1 // Mock trend data - would need historical comparison
    },
    recentActivities: formattedActivities,
    metadata: {
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      totalUsers,
      totalEvents,
      totalParticipants
    }
  }
}

async function generateCSVExport(data: any, timeRange: string) {
  const csvRows = []

  // Header
  csvRows.push([
    'Metric',
    'Value',
    'Period'
  ])

  // Summary stats
  csvRows.push(['Total Revenue', `$${data.summaryStats.totalRevenue}`, timeRange])
  csvRows.push(['Active Subscriptions', data.summaryStats.activeSubscriptions, timeRange])
  csvRows.push(['Churn Rate', `${data.summaryStats.churnRate}%`, timeRange])
  csvRows.push(['Average Revenue per User', `$${data.summaryStats.averageRevenue}`, timeRange])

  // Tier distribution
  csvRows.push(['', '', '']) // Empty row
  csvRows.push(['Subscription Tier', 'User Count', 'Percentage'])
  data.tierDistribution.forEach((tier: any) => {
    csvRows.push([tier.tier, tier.count, `${tier.percentage}%`])
  })

  // Usage trends
  csvRows.push(['', '', '']) // Empty row
  csvRows.push(['Usage Metric', 'Value', 'Trend'])
  csvRows.push(['Average Events per User', data.usageTrends.avgEventsPerUser, `${data.usageTrends.eventsTrend}%`])
  csvRows.push(['Average Participants per Event', data.usageTrends.avgParticipantsPerEvent, `${data.usageTrends.participantsTrend}%`])
  csvRows.push(['Capacity Utilization', `${data.usageTrends.capacityUtilization}%`, ''])

  // Convert to CSV string
  const csvContent = csvRows.map(row =>
    row.map(cell => `"${cell}"`).join(',')
  ).join('\n')

  // Set headers for CSV download
  setHeader(event, 'Content-Type', 'text/csv')
  setHeader(event, 'Content-Disposition', `attachment; filename="subscription-analytics-${timeRange}.csv"`)

  return csvContent
}
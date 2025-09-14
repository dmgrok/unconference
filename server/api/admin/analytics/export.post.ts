import { z } from 'zod'
import { AnalyticsService } from '~/server/utils/analyticsService'
import logger from '~/server/utils/logger'

const exportSchema = z.object({
  timeRange: z.enum(['7d', '30d', '90d', '12m']).default('30d'),
  format: z.enum(['csv', 'json']).default('csv'),
  sections: z.array(z.enum(['platform', 'events', 'engagement', 'revenue', 'cohort'])).default(['platform']),
  eventIds: z.array(z.string()).optional(),
  includeRawData: z.boolean().default(false)
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

    const body = await readBody(event)
    const { timeRange, format, sections, eventIds, includeRawData } = exportSchema.parse(body)

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

    const filters = {
      dateRange: { start: startDate, end: endDate },
      ...(eventIds?.length && { eventIds })
    }

    // Collect data for each requested section
    const reportData: Record<string, any> = {}

    if (sections.includes('platform')) {
      reportData.platform = await AnalyticsService.getPlatformMetrics(filters)
    }

    if (sections.includes('events')) {
      const events = await prisma.event.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          ...(eventIds?.length && { id: { in: eventIds } })
        },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          ownerId: true
        }
      })

      const eventMetrics = await Promise.all(
        events.map(async (e) => ({
          ...e,
          metrics: await AnalyticsService.getEventMetrics(e.id)
        }))
      )

      reportData.events = eventMetrics
    }

    if (sections.includes('engagement')) {
      const engagement = await prisma.userEngagement.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate
          },
          ...(eventIds?.length && { eventId: { in: eventIds } })
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              subscriptionTier: true
            }
          }
        }
      })

      reportData.engagement = engagement
    }

    if (sections.includes('revenue')) {
      const subscriptions = await prisma.user.findMany({
        where: {
          subscriptionStatus: 'ACTIVE',
          subscriptionTier: { not: 'FREE' },
          subscriptionStart: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          id: true,
          email: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          subscriptionStart: true,
          subscriptionEnd: true,
          createdAt: true
        }
      })

      const auditLogs = await prisma.auditLog.findMany({
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
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      reportData.revenue = {
        subscriptions,
        auditLogs
      }
    }

    if (sections.includes('cohort')) {
      reportData.cohort = await AnalyticsService.getCohortAnalysis('monthly')
    }

    // Add raw analytics events if requested
    if (includeRawData) {
      const rawEvents = await prisma.analyticsEvent.findMany({
        where: {
          timestamp: {
            gte: startDate,
            lte: endDate
          },
          ...(eventIds?.length && { eventId: { in: eventIds } })
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 10000 // Limit to prevent huge exports
      })

      reportData.rawEvents = rawEvents
    }

    // Store the report
    const reportRecord = await prisma.analyticsReport.create({
      data: {
        name: `Analytics Export - ${timeRange}`,
        description: `Export for ${sections.join(', ')} sections from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        reportType: 'COMPREHENSIVE_EXPORT',
        filters: JSON.stringify({ timeRange, sections, eventIds }),
        data: JSON.stringify(reportData),
        generatedBy: currentUser.id
      }
    })

    // Format the response based on requested format
    if (format === 'csv') {
      const csvContent = generateCSVReport(reportData, sections)

      setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
      setHeader(event, 'Content-Disposition', `attachment; filename="analytics-export-${timeRange}-${Date.now()}.csv"`)

      return csvContent
    }

    // JSON format
    const jsonReport = {
      reportId: reportRecord.id,
      metadata: {
        timeRange,
        sections,
        periodStart: startDate.toISOString(),
        periodEnd: endDate.toISOString(),
        generatedAt: new Date().toISOString(),
        totalRecords: Object.values(reportData).reduce((sum, section) => {
          if (Array.isArray(section)) return sum + section.length
          if (section && typeof section === 'object' && 'length' in section) return sum + (section.length || 0)
          return sum + 1
        }, 0)
      },
      data: reportData
    }

    return {
      success: true,
      report: jsonReport
    }

  } catch (error: any) {
    logger.error('Analytics export error:', error)

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid export parameters',
        data: error.errors
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to export analytics report'
    })
  }
})

function generateCSVReport(reportData: Record<string, any>, sections: string[]): string {
  const csvRows: string[][] = []

  // Add header with report info
  csvRows.push(['Analytics Report Export'])
  csvRows.push(['Generated At', new Date().toISOString()])
  csvRows.push(['Sections', sections.join(', ')])
  csvRows.push(['']) // Empty row

  sections.forEach(section => {
    switch (section) {
      case 'platform':
        if (reportData.platform) {
          csvRows.push(['PLATFORM METRICS'])
          csvRows.push(['Metric', 'Value'])
          csvRows.push(['Total Users', reportData.platform.totalUsers.toString()])
          csvRows.push(['Active Users', reportData.platform.activeUsers.toString()])
          csvRows.push(['Total Events', reportData.platform.totalEvents.toString()])
          csvRows.push(['Active Events', reportData.platform.activeEvents.toString()])
          csvRows.push(['Total Connections', reportData.platform.totalConnections.toString()])
          csvRows.push(['Avg Connection Quality', reportData.platform.avgConnectionQuality.toFixed(2)])
          csvRows.push(['Platform Engagement Score', reportData.platform.platformEngagementScore.toFixed(2)])
          csvRows.push(['Monthly Recurring Revenue', `$${(reportData.platform.revenueMetrics.monthlyRecurringRevenue / 100).toFixed(2)}`])
          csvRows.push(['Churn Rate', `${reportData.platform.revenueMetrics.churnRate.toFixed(2)}%`])
          csvRows.push(['']) // Empty row
        }
        break

      case 'events':
        if (reportData.events && Array.isArray(reportData.events)) {
          csvRows.push(['EVENT METRICS'])
          csvRows.push(['Event ID', 'Title', 'Status', 'Participants', 'Connections', 'Engagement Score', 'Success Score'])
          reportData.events.forEach((event: any) => {
            csvRows.push([
              event.id,
              event.title,
              event.status,
              event.metrics.participantCount.toString(),
              event.metrics.connectionCount.toString(),
              event.metrics.engagementScore.toFixed(1),
              event.metrics.successScore?.toFixed(1) || '0'
            ])
          })
          csvRows.push(['']) // Empty row
        }
        break

      case 'engagement':
        if (reportData.engagement && Array.isArray(reportData.engagement)) {
          csvRows.push(['USER ENGAGEMENT'])
          csvRows.push(['User ID', 'User Name', 'Email', 'Subscription Tier', 'Page Views', 'Actions', 'Connections Made', 'Engagement Score', 'Date'])
          reportData.engagement.forEach((engagement: any) => {
            csvRows.push([
              engagement.userId,
              engagement.user?.name || '',
              engagement.user?.email || '',
              engagement.user?.subscriptionTier || '',
              engagement.pageViews.toString(),
              engagement.actionsCount.toString(),
              engagement.connectionsMade.toString(),
              engagement.engagementScore.toFixed(1),
              engagement.date.toISOString().split('T')[0]
            ])
          })
          csvRows.push(['']) // Empty row
        }
        break

      case 'revenue':
        if (reportData.revenue) {
          csvRows.push(['REVENUE ANALYTICS'])
          csvRows.push(['SUBSCRIPTIONS'])
          csvRows.push(['User Email', 'Subscription Tier', 'Status', 'Start Date', 'End Date'])
          if (Array.isArray(reportData.revenue.subscriptions)) {
            reportData.revenue.subscriptions.forEach((sub: any) => {
              csvRows.push([
                sub.email,
                sub.subscriptionTier,
                sub.subscriptionStatus,
                sub.subscriptionStart?.toISOString().split('T')[0] || '',
                sub.subscriptionEnd?.toISOString().split('T')[0] || ''
              ])
            })
          }
          csvRows.push(['']) // Empty row

          csvRows.push(['SUBSCRIPTION ACTIVITIES'])
          csvRows.push(['Date', 'User Email', 'Action', 'Details'])
          if (Array.isArray(reportData.revenue.auditLogs)) {
            reportData.revenue.auditLogs.forEach((log: any) => {
              csvRows.push([
                log.createdAt.toISOString().split('T')[0],
                log.user?.email || '',
                log.action,
                log.details || ''
              ])
            })
          }
          csvRows.push(['']) // Empty row
        }
        break

      case 'cohort':
        if (reportData.cohort && Array.isArray(reportData.cohort)) {
          csvRows.push(['COHORT ANALYSIS'])
          csvRows.push(['Cohort Period', 'Total Users', 'Active Users', 'Retention Rate'])
          reportData.cohort.forEach((cohort: any) => {
            const retention = cohort.totalUsers > 0 ? ((cohort.activeUsers / cohort.totalUsers) * 100).toFixed(2) : '0.00'
            csvRows.push([
              cohort.cohortPeriod,
              cohort.totalUsers.toString(),
              cohort.activeUsers.toString(),
              `${retention}%`
            ])
          })
          csvRows.push(['']) // Empty row
        }
        break
    }
  })

  // Convert to CSV string
  return csvRows.map(row =>
    row.map(cell => {
      // Escape quotes and wrap in quotes if necessary
      const cellStr = String(cell || '')
      if (cellStr.includes('"') || cellStr.includes(',') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    }).join(',')
  ).join('\n')
}
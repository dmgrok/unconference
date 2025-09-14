import prisma from '~/lib/database'
import logger from './logger'

export interface AnalyticsFilters {
  dateRange?: {
    start: Date
    end: Date
  }
  eventIds?: string[]
  userIds?: string[]
  eventTypes?: string[]
}

export interface PlatformMetrics {
  totalUsers: number
  activeUsers: number
  totalEvents: number
  activeEvents: number
  totalConnections: number
  avgConnectionQuality: number
  platformEngagementScore: number
  revenueMetrics: {
    totalRevenue: number
    monthlyRecurringRevenue: number
    churnRate: number
    avgRevenuePerUser: number
  }
}

export interface EventMetrics {
  eventId: string
  participantCount: number
  connectionCount: number
  collaborationCount: number
  avgConnectionQuality: number
  participantRetention: number
  engagementScore: number
  topTopics: Array<{ title: string; votes: number }>
  roundsCompleted: number
  avgParticipantsPerRound: number
}

export interface UserJourney {
  userId: string
  events: Array<{
    eventType: string
    timestamp: Date
    properties: Record<string, any>
  }>
  engagementTrend: Array<{
    date: Date
    score: number
  }>
}

export class AnalyticsService {
  /**
   * Track an analytics event
   */
  static async trackEvent(data: {
    eventType: string
    userId?: string
    eventId?: string
    sessionId?: string
    properties?: Record<string, any>
    ipAddress?: string
    userAgent?: string
  }) {
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType: data.eventType,
          userId: data.userId,
          eventId: data.eventId,
          sessionId: data.sessionId,
          properties: data.properties ? JSON.stringify(data.properties) : null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent
        }
      })
    } catch (error) {
      logger.error('Failed to track analytics event:', error)
    }
  }

  /**
   * Get platform-wide metrics
   */
  static async getPlatformMetrics(filters?: AnalyticsFilters): Promise<PlatformMetrics> {
    const dateFilter = filters?.dateRange ? {
      createdAt: {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      }
    } : {}

    // Get user metrics
    const totalUsers = await prisma.user.count()
    const activeUsers = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    })

    // Get event metrics
    const totalEvents = await prisma.event.count()
    const activeEvents = await prisma.event.count({
      where: { status: 'ACTIVE' }
    })

    // Get connection metrics
    const connections = await prisma.connection.findMany({
      select: {
        qualityScore: true
      }
    })
    const totalConnections = connections.length
    const avgConnectionQuality = connections.length > 0
      ? connections.reduce((sum, c) => sum + c.qualityScore, 0) / connections.length
      : 0

    // Calculate platform engagement score
    const recentActivity = await prisma.analyticsEvent.count({
      where: {
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    })
    const platformEngagementScore = activeUsers > 0 ? (recentActivity / activeUsers) * 10 : 0

    // Revenue metrics
    const revenueMetrics = await this.getRevenueMetrics()

    return {
      totalUsers,
      activeUsers,
      totalEvents,
      activeEvents,
      totalConnections,
      avgConnectionQuality,
      platformEngagementScore,
      revenueMetrics
    }
  }

  /**
   * Get event-specific metrics
   */
  static async getEventMetrics(eventId: string): Promise<EventMetrics> {
    // Get or create event analytics record
    let eventAnalytics = await prisma.eventAnalytics.findUnique({
      where: { eventId }
    })

    if (!eventAnalytics) {
      eventAnalytics = await this.calculateAndStoreEventMetrics(eventId)
    }

    // Get additional real-time metrics
    const participantCount = await prisma.eventMembership.count({
      where: { eventId, status: 'ACTIVE' }
    })

    const topTopics = await prisma.topic.findMany({
      where: { eventId },
      select: { title: true, totalVotes: true },
      orderBy: { totalVotes: 'desc' },
      take: 5
    })

    const roundsCompleted = await prisma.round.count({
      where: { eventId, status: 'COMPLETED' }
    })

    const roundParticipations = await prisma.roundParticipation.groupBy({
      by: ['roundId'],
      where: {
        round: { eventId }
      },
      _count: {
        userId: true
      }
    })

    const avgParticipantsPerRound = roundParticipations.length > 0
      ? roundParticipations.reduce((sum, rp) => sum + rp._count.userId, 0) / roundParticipations.length
      : 0

    return {
      eventId,
      participantCount,
      connectionCount: eventAnalytics.totalConnections,
      collaborationCount: eventAnalytics.totalCollaborations,
      avgConnectionQuality: eventAnalytics.avgConnectionQuality,
      participantRetention: eventAnalytics.participantRetention,
      engagementScore: eventAnalytics.engagementScore,
      topTopics: topTopics.map(t => ({ title: t.title, votes: t.totalVotes })),
      roundsCompleted,
      avgParticipantsPerRound
    }
  }

  /**
   * Get user journey analytics
   */
  static async getUserJourney(userId: string, eventId?: string): Promise<UserJourney> {
    const eventFilter = eventId ? { eventId } : {}

    // Get analytics events for this user
    const events = await prisma.analyticsEvent.findMany({
      where: {
        userId,
        ...eventFilter
      },
      orderBy: { timestamp: 'asc' }
    })

    // Get engagement trend
    const engagementData = await prisma.userEngagement.findMany({
      where: {
        userId,
        eventId
      },
      orderBy: { date: 'asc' }
    })

    const engagementTrend = engagementData.map(e => ({
      date: e.date,
      score: e.engagementScore
    }))

    return {
      userId,
      events: events.map(e => ({
        eventType: e.eventType,
        timestamp: e.timestamp,
        properties: e.properties ? JSON.parse(e.properties) : {}
      })),
      engagementTrend
    }
  }

  /**
   * Generate cohort analysis
   */
  static async getCohortAnalysis(cohortType: 'weekly' | 'monthly' = 'monthly') {
    // Implementation for cohort analysis
    // This would analyze user retention by signup date cohorts
    const users = await prisma.user.findMany({
      select: {
        id: true,
        createdAt: true,
        lastLoginAt: true
      }
    })

    // Group users by cohort period and calculate retention
    // This is a simplified version - full implementation would be more complex
    const cohorts: Record<string, any> = {}

    for (const user of users) {
      const cohortKey = cohortType === 'monthly'
        ? `${user.createdAt.getFullYear()}-${user.createdAt.getMonth() + 1}`
        : `${user.createdAt.getFullYear()}-W${Math.ceil((user.createdAt.getDate() / 7))}`

      if (!cohorts[cohortKey]) {
        cohorts[cohortKey] = {
          cohortPeriod: cohortKey,
          totalUsers: 0,
          activeUsers: 0
        }
      }

      cohorts[cohortKey].totalUsers++

      if (user.lastLoginAt && user.lastLoginAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        cohorts[cohortKey].activeUsers++
      }
    }

    return Object.values(cohorts)
  }

  /**
   * Calculate and store event metrics
   */
  private static async calculateAndStoreEventMetrics(eventId: string) {
    // Get connections for this event
    const connections = await prisma.connection.findMany({
      where: { eventId }
    })

    // Get collaborations for this event
    const collaborations = await prisma.collaborationSpace.findMany({
      where: { eventId }
    })

    // Calculate metrics
    const totalConnections = connections.length
    const totalCollaborations = collaborations.length
    const avgConnectionQuality = connections.length > 0
      ? connections.reduce((sum, c) => sum + c.qualityScore, 0) / connections.length
      : 0

    // Calculate participant retention (simplified)
    const totalParticipants = await prisma.eventMembership.count({
      where: { eventId }
    })

    const activeParticipants = await prisma.eventMembership.count({
      where: {
        eventId,
        status: 'ACTIVE'
      }
    })

    const participantRetention = totalParticipants > 0
      ? (activeParticipants / totalParticipants) * 100
      : 0

    // Calculate engagement score (based on connections, collaborations, and activity)
    const engagementScore = Math.min(100,
      (totalConnections * 10) +
      (totalCollaborations * 15) +
      (avgConnectionQuality / 2)
    )

    // Calculate overall success score
    const successScore = Math.min(100,
      (participantRetention * 0.3) +
      (engagementScore * 0.4) +
      (avgConnectionQuality * 0.3)
    )

    // Store or update event analytics
    const eventAnalytics = await prisma.eventAnalytics.upsert({
      where: { eventId },
      update: {
        totalParticipants,
        totalConnections,
        totalCollaborations,
        avgConnectionQuality,
        participantRetention,
        engagementScore,
        successScore,
        updatedAt: new Date()
      },
      create: {
        eventId,
        totalParticipants,
        totalConnections,
        totalCollaborations,
        avgConnectionQuality,
        participantRetention,
        engagementScore,
        successScore
      }
    })

    return eventAnalytics
  }

  /**
   * Get revenue metrics
   */
  private static async getRevenueMetrics() {
    // Get active subscriptions
    const activeSubscriptions = await prisma.user.count({
      where: {
        subscriptionStatus: 'ACTIVE',
        subscriptionTier: { not: 'FREE' }
      }
    })

    // Calculate monthly recurring revenue
    const subscriptionTiers = await prisma.user.groupBy({
      by: ['subscriptionTier'],
      where: {
        subscriptionStatus: 'ACTIVE',
        subscriptionTier: { not: 'FREE' }
      },
      _count: {
        id: true
      }
    })

    const tierPricing = {
      'COMMUNITY': 1900, // $19 in cents
      'ORGANIZER': 4900,  // $49 in cents
      'UNLIMITED': 9900   // $99 in cents
    }

    let monthlyRecurringRevenue = 0
    subscriptionTiers.forEach(tier => {
      if (tier.subscriptionTier in tierPricing) {
        monthlyRecurringRevenue += (tierPricing[tier.subscriptionTier as keyof typeof tierPricing] * tier._count.id)
      }
    })

    // Calculate churn rate (simplified - last 30 days)
    const canceledInLastMonth = await prisma.user.count({
      where: {
        subscriptionStatus: 'CANCELED',
        subscriptionEnd: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      }
    })

    const churnRate = activeSubscriptions > 0
      ? (canceledInLastMonth / (activeSubscriptions + canceledInLastMonth)) * 100
      : 0

    const avgRevenuePerUser = activeSubscriptions > 0
      ? monthlyRecurringRevenue / activeSubscriptions
      : 0

    return {
      totalRevenue: monthlyRecurringRevenue,
      monthlyRecurringRevenue,
      churnRate,
      avgRevenuePerUser
    }
  }
}
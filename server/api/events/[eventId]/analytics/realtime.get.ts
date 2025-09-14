import { z } from 'zod'
import { AnalyticsService } from '~/server/utils/analyticsService'
import { requireEventPermission } from '~/server/utils/authService'
import logger from '~/server/utils/logger'

const querySchema = z.object({
  refresh: z.boolean().optional().default(false) // Force refresh cached metrics
})

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'eventId')

  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID is required'
    })
  }

  try {
    // Check if user has permission to view this event's analytics
    await requireEventPermission(event, eventId, 'event', 'read')

    const query = getQuery(event)
    const { refresh } = querySchema.parse(query)

    // Track this analytics view
    const session = await getUserSession(event)
    if (session.user) {
      await AnalyticsService.trackEvent({
        eventType: 'ANALYTICS_VIEW',
        userId: (session.user as any).id,
        eventId: eventId,
        properties: { type: 'realtime' }
      })
    }

    // Get comprehensive event metrics
    const eventMetrics = await AnalyticsService.getEventMetrics(eventId)

    // Get real-time participant activity (last 10 minutes)
    const recentActivity = await prisma.analyticsEvent.findMany({
      where: {
        eventId: eventId,
        timestamp: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
        }
      },
      select: {
        eventType: true,
        timestamp: true,
        userId: true
      },
      orderBy: { timestamp: 'desc' },
      take: 50
    })

    // Get current round information
    const currentRound = await prisma.round.findFirst({
      where: {
        eventId: eventId,
        status: 'ACTIVE'
      },
      include: {
        participants: {
          include: {
            user: {
              select: { name: true, avatar: true }
            }
          }
        },
        roundTopics: {
          include: {
            topic: {
              select: { title: true, description: true }
            }
          }
        }
      }
    })

    // Get live connection activity
    const recentConnections = await prisma.connection.findMany({
      where: {
        eventId: eventId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // Last 30 minutes
        }
      },
      include: {
        user: { select: { name: true } },
        connectedUser: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    // Get voting activity for current topics
    const recentVotes = await prisma.vote.findMany({
      where: {
        topic: { eventId: eventId },
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      include: {
        topic: { select: { title: true } },
        user: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    // Calculate activity heatmap (participants active by time)
    const activityHeatmap = await prisma.analyticsEvent.groupBy({
      by: ['timestamp'],
      where: {
        eventId: eventId,
        timestamp: {
          gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
        }
      },
      _count: {
        userId: true
      },
      orderBy: {
        timestamp: 'asc'
      }
    })

    // Format activity data for frontend visualization
    const activityData = activityHeatmap.reduce((acc: Record<string, number>, item) => {
      const timeSlot = new Date(item.timestamp).toISOString().slice(0, 16) // Group by minute
      acc[timeSlot] = (acc[timeSlot] || 0) + item._count.userId
      return acc
    }, {})

    const realtimeData = {
      eventMetrics,
      liveActivity: {
        recentActions: recentActivity.map(a => ({
          type: a.eventType,
          timestamp: a.timestamp,
          userId: a.userId
        })),
        activityHeatmap: activityData,
        participantsOnline: await getOnlineParticipants(eventId)
      },
      currentRound: currentRound ? {
        id: currentRound.id,
        roundNumber: currentRound.roundNumber,
        status: currentRound.status,
        startTime: currentRound.startTime,
        endTime: currentRound.endTime,
        participantCount: currentRound.participants.length,
        topics: currentRound.roundTopics.map(rt => rt.topic.title)
      } : null,
      recentConnections: recentConnections.map(c => ({
        id: c.id,
        users: [c.user.name, c.connectedUser.name],
        qualityScore: c.qualityScore,
        timestamp: c.createdAt
      })),
      recentVotes: recentVotes.map(v => ({
        id: v.id,
        user: v.user.name,
        topic: v.topic.title,
        preference: v.preference,
        timestamp: v.createdAt
      })),
      metadata: {
        generatedAt: new Date().toISOString(),
        refreshed: refresh,
        eventId
      }
    }

    return {
      success: true,
      data: realtimeData
    }

  } catch (error: any) {
    logger.error(`Real-time analytics error for event ${eventId}:`, error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch real-time analytics'
    })
  }
})

async function getOnlineParticipants(eventId: string): Promise<number> {
  // Count unique users who have had activity in the last 5 minutes
  const result = await prisma.analyticsEvent.groupBy({
    by: ['userId'],
    where: {
      eventId: eventId,
      userId: { not: null },
      timestamp: {
        gte: new Date(Date.now() - 5 * 60 * 1000)
      }
    },
    _count: {
      userId: true
    }
  })

  return result.length
}
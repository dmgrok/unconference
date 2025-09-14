import { z } from 'zod'
import { AnalyticsService } from '~/server/utils/analyticsService'
import logger from '~/server/utils/logger'

const trackingSchema = z.object({
  eventType: z.string().min(1),
  eventId: z.string().optional(),
  sessionId: z.string().optional(),
  properties: z.record(z.any()).optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { eventType, eventId, sessionId, properties } = trackingSchema.parse(body)

    // Get user ID from session if available
    const session = await getUserSession(event)
    const userId = session?.user?.id

    // Get request metadata
    const headers = getHeaders(event)
    const ipAddress = getClientIP(event)
    const userAgent = headers['user-agent']

    // Track the analytics event
    await AnalyticsService.trackEvent({
      eventType,
      userId,
      eventId,
      sessionId,
      properties,
      ipAddress,
      userAgent
    })

    // Update user engagement metrics if user is logged in
    if (userId && eventId) {
      await updateUserEngagement(userId, eventId, eventType)
    }

    return {
      success: true,
      tracked: true
    }

  } catch (error: any) {
    logger.error('Analytics tracking error:', error)

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid tracking data',
        data: error.errors
      })
    }

    // Don't fail requests for analytics tracking errors
    return {
      success: false,
      error: 'Tracking failed',
      tracked: false
    }
  }
})

async function updateUserEngagement(userId: string, eventId: string, eventType: string) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get or create user engagement record for today
    const engagement = await prisma.userEngagement.upsert({
      where: {
        userId_eventId_date: {
          userId,
          eventId,
          date: today
        }
      },
      update: {
        actionsCount: {
          increment: 1
        },
        // Update engagement score based on event type
        engagementScore: {
          increment: getEngagementPoints(eventType)
        }
      },
      create: {
        userId,
        eventId,
        date: today,
        actionsCount: 1,
        engagementScore: getEngagementPoints(eventType)
      }
    })

    // Update specific metrics based on event type
    const updateData: any = {}

    switch (eventType) {
      case 'PAGE_VIEW':
        updateData.pageViews = { increment: 1 }
        break
      case 'CONNECTION_MADE':
        updateData.connectionsMade = { increment: 1 }
        break
      case 'FOLLOW_UP_COMPLETED':
        updateData.followUpsCompleted = { increment: 1 }
        break
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.userEngagement.update({
        where: { id: engagement.id },
        data: updateData
      })
    }

  } catch (error) {
    logger.error('Failed to update user engagement:', error)
  }
}

function getEngagementPoints(eventType: string): number {
  const pointMap: Record<string, number> = {
    'PAGE_VIEW': 1,
    'TOPIC_CREATE': 5,
    'VOTE_CAST': 3,
    'CONNECTION_MADE': 10,
    'COLLABORATION_START': 15,
    'FOLLOW_UP_COMPLETED': 8,
    'ROUND_JOIN': 7,
    'MESSAGE_SENT': 2
  }

  return pointMap[eventType] || 1
}
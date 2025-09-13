import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID is required'
    })
  }

  try {
    // Get event details
    const eventData = await (prisma as any).event.findUnique({
      where: { id: eventId },
      include: {
        eventMemberships: {
          include: {
            user: true
          }
        }
      }
    })

    if (!eventData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }

    // Get connections for this event
    const connections = await (prisma as any).eventConnection.findMany({
      where: { eventId },
      include: {
        participantA: true,
        participantB: true
      }
    })

    // Get achievements for this event
    const achievements = await (prisma as any).userAchievement.findMany({
      where: { eventId }
    })

    // Generate summary statistics
    const summary = {
      event: {
        id: eventData.id,
        name: eventData.title,
        date: eventData.createdAt,
        participantCount: eventData.eventMemberships?.length || 0
      },
      statistics: {
        totalConnections: connections.length,
        totalAchievements: achievements.length,
        uniqueParticipants: new Set([
          ...connections.map((c: any) => c.participantAId),
          ...connections.map((c: any) => c.participantBId)
        ]).size,
        averageConnectionsPerPerson: connections.length > 0 ? 
          (connections.length * 2) / new Set([
            ...connections.map((c: any) => c.participantAId),
            ...connections.map((c: any) => c.participantBId)
          ]).size : 0
      },
      topAchievers: achievements
        .reduce((acc: any, achievement: any) => {
          const existing = acc.find((a: any) => a.userId === achievement.userId)
          if (existing) {
            existing.count++
          } else {
            acc.push({ userId: achievement.userId, count: 1 })
          }
          return acc
        }, [])
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5),
      recentConnections: connections
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
        .map((c: any) => ({
          from: c.participantA?.name || 'Unknown',
          to: c.participantB?.name || 'Unknown',
          date: c.createdAt,
          strength: c.connectionStrength
        }))
    }

    return {
      success: true,
      summary
    }
  } catch (error) {
    console.error('Error generating event summary:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate event summary'
    })
  }
})

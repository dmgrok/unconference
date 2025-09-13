import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method === 'POST') {
    try {
      const body = await readBody(event)
      const { fromUserId, toUserId, eventId, type, metadata } = body

      if (!fromUserId || !toUserId || !eventId) {
        throw createError({
          statusCode: 400,
          statusMessage: 'fromUserId, toUserId, and eventId are required'
        })
      }

      // Create the connection using EventConnection model
      const connection = await (prisma as any).eventConnection.create({
        data: {
          eventId,
          participantAId: fromUserId,
          participantBId: toUserId,
          connectionStrength: 1,
          sharedTopics: metadata?.topic ? JSON.stringify([metadata.topic]) : null,
          collaboratedOn: null,
          createdAt: new Date()
        }
      })

      // Check for achievements after creating connection
      await checkConnectionAchievements(fromUserId, eventId)

      return {
        success: true,
        connection
      }
    } catch (error) {
      console.error('Error creating connection:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create connection'
      })
    }
  } else {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }
})

async function checkConnectionAchievements(userId: string, eventId: string) {
  try {
    // Count user's connections in this event
    const connectionCount = await (prisma as any).eventConnection.count({
      where: {
        AND: [
          { eventId },
          {
            OR: [
              { participantAId: userId },
              { participantBId: userId }
            ]
          }
        ]
      }
    })

    // Award achievements based on connection count
    const achievements = []
    
    if (connectionCount >= 1) {
      achievements.push({
        name: 'First Connection',
        description: 'Made your first connection at an event',
        icon: 'mdi-handshake',
        type: 'CONNECTION'
      })
    }
    
    if (connectionCount >= 5) {
      achievements.push({
        name: 'Networker',
        description: 'Connected with 5 people',
        icon: 'mdi-account-group',
        type: 'CONNECTION'
      })
    }

    if (connectionCount >= 10) {
      achievements.push({
        name: 'Super Connector',
        description: 'Connected with 10+ people',
        icon: 'mdi-trophy',
        type: 'CONNECTION'
      })
    }

    // Save new achievements
    for (const achievement of achievements) {
      try {
        await (prisma as any).userAchievement.create({
          data: {
            userId,
            eventId,
            achievementType: achievement.type,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            metadata: JSON.stringify({ connectionCount })
          }
        })
      } catch (error: any) {
        // Ignore duplicate achievements
        if (!error?.message?.includes('unique constraint')) {
          console.error('Error creating achievement:', error)
        }
      }
    }
  } catch (error) {
    console.error('Error checking achievements:', error)
  }
}

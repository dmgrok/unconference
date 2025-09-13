import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'userId')
  
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required'
    })
  }

  try {
    const achievements = await prisma.userAchievement.findMany({
      where: { userId },
      orderBy: { earnedAt: 'desc' }
    })

    return {
      success: true,
      achievements: achievements.map((ua: any) => ({
        id: ua.id,
        name: ua.name,
        description: ua.description,
        icon: ua.icon,
        type: ua.achievementType,
        badgeUrl: ua.badgeUrl,
        eventId: ua.eventId,
        metadata: ua.metadata ? JSON.parse(ua.metadata) : null,
        earnedAt: ua.earnedAt
      }))
    }
  } catch (error) {
    console.error('Error fetching user achievements:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch achievements'
    })
  }
})

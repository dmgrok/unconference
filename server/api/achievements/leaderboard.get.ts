import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const eventId = query.eventId as string | undefined
    const limit = parseInt(query.limit as string || '10')

    // Get users with their achievement counts
    const userStats = await prisma.userAchievement.groupBy({
      by: ['userId'],
      where: eventId ? { eventId } : {},
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: limit
    })

    // Get user details
    const userIds = userStats.map(stat => stat.userId)
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    })

    // Combine data
    const leaderboard = userStats.map(stat => {
      const user = users.find(u => u.id === stat.userId)
      return {
        userId: stat.userId,
        userName: user?.name || 'Unknown User',
        userEmail: user?.email,
        achievementCount: stat._count.id,
        rank: userStats.indexOf(stat) + 1
      }
    })

    return {
      success: true,
      leaderboard,
      eventId: eventId || 'global'
    }
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch leaderboard'
    })
  }
})

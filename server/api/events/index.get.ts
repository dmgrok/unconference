import prisma from '~/lib/database'

export default defineEventHandler(async (event) => {
  try {
    // Get current user from session
    const session = await getUserSession(event)
    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Fetch user's events with related data
    const events = await prisma.event.findMany({
      where: {
        ownerId: session.user.id
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            subscriptionTier: true
          }
        },
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                nickname: true
              }
            }
          }
        },
        _count: {
          select: {
            topics: true,
            memberships: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    return {
      success: true,
      events
    }

  } catch (error) {
    console.error('Events fetch error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch events'
    })
  }
})
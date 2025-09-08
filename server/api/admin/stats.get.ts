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

    // Check if user is admin (you might need to implement proper admin role checking)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })
    
    if (!user || user.globalRole !== 'SUPER_ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    // Get platform statistics
    const [
      totalUsers,
      activeEvents,
      paidSubscriptions,
      totalEvents,
      recentActivity,
      recentUsers
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Active events
      prisma.event.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Paid subscriptions
      prisma.user.count({
        where: {
          subscriptionTier: {
            not: 'FREE'
          },
          subscriptionStatus: 'ACTIVE'
        }
      }),
      
      // Total events
      prisma.event.count(),
      
      // Recent activity (last 7 days)
      prisma.auditLog.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      }),
      
      // Recent users (last 30 days)
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          subscriptionTier: true,
          createdAt: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      })
    ])

    // Calculate estimated monthly revenue (rough calculation)
    const subscriptionRevenue = await prisma.user.aggregate({
      where: {
        subscriptionTier: { not: 'FREE' },
        subscriptionStatus: 'ACTIVE'
      },
      _count: {
        id: true
      }
    })

    // Get event payments (last 30 days)
    const eventPayments = await prisma.event.aggregate({
      where: {
        paymentStatus: 'PAID',
        paidAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      _sum: {
        paidAmount: true
      }
    })

    // Estimate monthly recurring revenue
    const tierPricing = {
      'COMMUNITY': 1900, // $19 in cents
      'ORGANIZER': 4900,  // $49 in cents
      'UNLIMITED': 9900   // $99 in cents
    }

    const recurringRevenue = await prisma.user.groupBy({
      by: ['subscriptionTier'],
      where: {
        subscriptionTier: { not: 'FREE' },
        subscriptionStatus: 'ACTIVE'
      },
      _count: {
        id: true
      }
    })

    let estimatedMRR = 0
    recurringRevenue.forEach(group => {
      if (group.subscriptionTier in tierPricing) {
        estimatedMRR += (tierPricing[group.subscriptionTier as keyof typeof tierPricing] * group._count.id)
      }
    })

    // Add one-time event payments
    const totalRevenue = estimatedMRR + (eventPayments._sum.paidAmount || 0)

    return {
      success: true,
      stats: {
        totalUsers,
        activeEvents,
        totalEvents,
        paidSubscriptions,
        revenue: totalRevenue,
        monthlyRecurringRevenue: estimatedMRR,
        eventPaymentsThisMonth: eventPayments._sum.paidAmount || 0
      },
      recentActivity,
      recentUsers
    }

  } catch (error) {
    console.error('Admin stats error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch admin statistics'
    })
  }
})
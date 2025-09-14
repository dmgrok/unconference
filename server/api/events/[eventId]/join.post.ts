import prisma from '~/lib/database'
import { SubscriptionService, SUBSCRIPTION_LIMITS } from '~/lib/subscription'
import logger from '~/utils/logger'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const eventId = getRouterParam(event, 'eventId')

  if (!session?.user?.id) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID is required'
    })
  }

  const userId = (session.user as any).id

  try {
    // Check if event exists and get owner info
    const eventData = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        owner: true,
        memberships: {
          where: { status: 'ACTIVE' }
        }
      }
    })

    if (!eventData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }

    // Check if user is already a member
    const existingMembership = await prisma.eventMembership.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId
        }
      }
    })

    if (existingMembership) {
      return {
        success: true,
        message: 'Already a member of this event',
        role: existingMembership.role,
        status: existingMembership.status
      }
    }

    // Check participant limits using subscription service
    const limitCheck = await SubscriptionService.canAddParticipants(eventId, 1)

    if (!limitCheck.allowed) {
      const ownerLimits = SUBSCRIPTION_LIMITS[eventData.owner.subscriptionTier]
      const currentCount = eventData.memberships.length

      // Provide detailed upgrade information
      const upgradeOptions: Array<{
        tier: string
        maxParticipants: number | string
        price: number
        features: string[]
      }> = []

      // Calculate soft warning threshold (80% of limit)
      const warningThreshold = Math.floor(ownerLimits.maxParticipants * 0.8)
      const isSoftWarning = currentCount < ownerLimits.maxParticipants && currentCount >= warningThreshold

      if (isSoftWarning) {
        // Soft warning - still allow joining but show warning
        logger.warn(`Event ${eventId} approaching participant limit: ${currentCount}/${ownerLimits.maxParticipants}`)
      } else {
        // Hard limit reached
        // Suggest subscription upgrades
        Object.entries(SUBSCRIPTION_LIMITS).forEach(([tier, limits]) => {
          if (tier !== eventData.owner.subscriptionTier && tier !== 'FREE') {
            if (limits.maxParticipants === -1 || limits.maxParticipants > ownerLimits.maxParticipants) {
              upgradeOptions.push({
                tier,
                maxParticipants: limits.maxParticipants === -1 ? 'Unlimited' : limits.maxParticipants,
                price: limits.price,
                features: [...limits.features]
              })
            }
          }
        })

        throw createError({
          statusCode: 403,
          statusMessage: limitCheck.reason || 'Event has reached participant limit',
          data: {
            currentCount,
            limit: ownerLimits.maxParticipants,
            ownerTier: eventData.owner.subscriptionTier,
            upgradeRequired: true,
            upgradeOptions,
            contactOrganizer: true
          }
        })
      }
    }

    // Add user as participant
    const membership = await prisma.eventMembership.create({
      data: {
        userId,
        eventId,
        role: 'PARTICIPANT',
        status: eventData.requireApproval ? 'PENDING_APPROVAL' : 'ACTIVE'
      }
    })

    logger.info(`User ${userId} joined event ${eventId} as ${membership.role}`)

    // Return soft warning if approaching limit
    const currentCount = eventData.memberships.length + 1
    const ownerLimits = SUBSCRIPTION_LIMITS[eventData.owner.subscriptionTier]
    const warningThreshold = Math.floor(ownerLimits.maxParticipants * 0.8)

    return {
      success: true,
      message: eventData.requireApproval
        ? 'Join request submitted. Waiting for organizer approval.'
        : 'Successfully joined event',
      role: membership.role,
      status: membership.status,
      warning: currentCount >= warningThreshold ? {
        message: `Event is approaching participant limit (${currentCount}/${ownerLimits.maxParticipants})`,
        percentFull: Math.round((currentCount / ownerLimits.maxParticipants) * 100)
      } : undefined
    }
  } catch (error: any) {
    if (error.statusCode) throw error

    logger.error('Error joining event:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to join event'
    })
  }
})

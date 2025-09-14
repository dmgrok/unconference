import prisma from '~/lib/database'
import { SubscriptionService, SUBSCRIPTION_LIMITS } from '~/lib/subscription'

/**
 * Middleware to check participant limits before allowing event-related actions
 * Can be applied to routes that modify event membership
 */
export default defineEventHandler(async (event) => {
  // Only apply to specific routes
  const url = getRequestURL(event)
  const shouldCheck = [
    '/api/events/',
    '/api/admin/'
  ].some(path => url.pathname.includes(path)) &&
  ['POST', 'PUT', 'PATCH'].includes(getMethod(event))

  if (!shouldCheck) {
    return
  }

  // Skip for non-participant related endpoints
  const skipPaths = [
    '/api/events/create',
    '/api/events/index',
    '/api/admin/settings',
    '/api/admin/stats'
  ]

  if (skipPaths.some(path => url.pathname.includes(path))) {
    return
  }

  // Extract event ID from URL
  const eventIdMatch = url.pathname.match(/\/events\/([^\/]+)/)
  if (!eventIdMatch) {
    return
  }

  const eventId = eventIdMatch[1]

  try {
    // Get event with owner and current memberships
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
      return
    }

    // Check current participant count against limits
    const ownerLimits = SUBSCRIPTION_LIMITS[eventData.owner.subscriptionTier]
    const currentCount = eventData.memberships.length

    // Add warning headers if approaching limits
    const warningThreshold = Math.floor(ownerLimits.maxParticipants * 0.8)

    if (currentCount >= warningThreshold && ownerLimits.maxParticipants !== -1) {
      setHeader(event, 'X-Participant-Warning', 'true')
      setHeader(event, 'X-Participant-Count', currentCount.toString())
      setHeader(event, 'X-Participant-Limit', ownerLimits.maxParticipants.toString())
      setHeader(event, 'X-Participant-Percent-Full', Math.round((currentCount / ownerLimits.maxParticipants) * 100).toString())

      // Add upgrade suggestion for event owners
      if (eventData.owner.subscriptionTier === 'FREE' && currentCount >= 40) {
        setHeader(event, 'X-Upgrade-Suggestion', 'COMMUNITY')
      } else if (eventData.owner.subscriptionTier === 'COMMUNITY' && currentCount >= 120) {
        setHeader(event, 'X-Upgrade-Suggestion', 'ORGANIZER')
      } else if (eventData.owner.subscriptionTier === 'ORGANIZER' && currentCount >= 240) {
        setHeader(event, 'X-Upgrade-Suggestion', 'UNLIMITED')
      }
    }

    // Store event context for use by route handlers
    event.context.eventLimits = {
      current: currentCount,
      max: ownerLimits.maxParticipants,
      tier: eventData.owner.subscriptionTier,
      approaching: currentCount >= warningThreshold,
      percentFull: Math.round((currentCount / ownerLimits.maxParticipants) * 100)
    }

  } catch (error) {
    // Don't block requests on middleware errors, just log them
    console.error('Participant limits middleware error:', error)
  }
})
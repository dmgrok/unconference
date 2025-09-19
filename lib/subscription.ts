import { SubscriptionTier, type User } from '@prisma/client'
import prisma from './database'

// Subscription tier limits and pricing - Focused on small/medium community events
export const SUBSCRIPTION_LIMITS = {
  FREE: {
    maxParticipants: 50,
    maxEventsPerMonth: 5, // More events for community organizers
    features: ['basic_voting', 'room_management', 'qr_codes', 'basic_analytics'],
    price: 0,
    stripePriceId: null,
    description: 'Perfect for small meetups, workshops, and community events'
  },
  COMMUNITY: {
    maxParticipants: 150, // Sweet spot for most community events
    maxEventsPerMonth: 15, // Regular community organizers
    features: ['basic_voting', 'room_management', 'qr_codes', 'analytics', 'custom_branding', 'export_data', 'email_templates'],
    price: 19, // Affordable for community organizers
    stripePriceId: 'price_community_monthly',
    description: 'Ideal for regular meetup organizers and small conference hosts'
  },
  ORGANIZER: {
    maxParticipants: 300, // Medium conferences
    maxEventsPerMonth: 30, // Professional event organizers
    features: ['all_community_features', 'advanced_analytics', 'multi_organizer', 'attendee_management', 'feedback_collection'],
    price: 49, // Still accessible for small businesses
    stripePriceId: 'price_organizer_monthly',
    description: 'For professional event organizers and conference series'
  },
  UNLIMITED: {
    maxParticipants: -1, // Unlimited for larger events
    maxEventsPerMonth: -1, // Unlimited events
    features: ['all_features', 'priority_support', 'custom_domains', 'white_label', 'api_access'],
    price: 99, // Premium but not enterprise-level
    stripePriceId: 'price_unlimited_monthly',
    description: 'For large conferences and event management companies'
  }
} as const

// Pay-per-event pricing - Lean MVP model from business plan
export const PAY_PER_EVENT_PRICING = {
  PROFESSIONAL: {
    maxParticipants: 100,
    price: 29, // $29 for up to 100 participants
    stripePriceId: 'price_event_professional',
    description: 'Perfect for one-off workshops and medium conferences'
  },
  ENTERPRISE: {
    maxParticipants: -1, // Unlimited
    price: 99, // $99 for unlimited participants
    stripePriceId: 'price_event_enterprise',
    description: 'Ideal for large conferences and corporate events'
  }
} as const

export class SubscriptionService {
  /**
   * Check if user can create a new event based on their subscription
   */
  static async canCreateEvent(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedEvents: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // This month
            }
          }
        }
      }
    })

    if (!user) {
      return { allowed: false, reason: 'User not found' }
    }

    const limits = SUBSCRIPTION_LIMITS[user.subscriptionTier]
    const eventsThisMonth = user.ownedEvents.length

    if (limits.maxEventsPerMonth !== -1 && eventsThisMonth >= limits.maxEventsPerMonth) {
      return { 
        allowed: false, 
        reason: `You've reached your monthly limit of ${limits.maxEventsPerMonth} events. Upgrade your subscription to create more events.` 
      }
    }

    return { allowed: true }
  }

  /**
   * Check if event can accommodate more participants
   */
  static async canAddParticipants(eventId: string, additionalCount: number = 1): Promise<{ allowed: boolean; reason?: string }> {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        owner: true,
        memberships: {
          where: { status: 'ACTIVE' }
        }
      }
    })

    if (!event) {
      return { allowed: false, reason: 'Event not found' }
    }

    const limits = SUBSCRIPTION_LIMITS[event.owner.subscriptionTier]
    const currentParticipants = event.memberships.length
    const proposedTotal = currentParticipants + additionalCount

    if (limits.maxParticipants !== -1 && proposedTotal > limits.maxParticipants) {
      return { 
        allowed: false, 
        reason: `This event would exceed your participant limit of ${limits.maxParticipants}. Current: ${currentParticipants}, Attempting to add: ${additionalCount}. Upgrade your subscription for more capacity.` 
      }
    }

    return { allowed: true }
  }

  /**
   * Check if user has access to a specific feature
   */
  static async hasFeature(userId: string, feature: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) return false

    const limits = SUBSCRIPTION_LIMITS[user.subscriptionTier]
    return limits.features.includes(feature) || limits.features.includes('all_features')
  }

  /**
   * Get user's subscription details and usage
   */
  static async getSubscriptionDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedEvents: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }
      }
    })

    if (!user) return null

    const limits = SUBSCRIPTION_LIMITS[user.subscriptionTier]
    const usage = {
      eventsThisMonth: user.ownedEvents.length,
      totalEvents: await prisma.event.count({ where: { ownerId: userId } })
    }

    return {
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      limits,
      usage,
      isActive: user.subscriptionStatus === 'ACTIVE',
      needsUpgrade: usage.eventsThisMonth >= (limits.maxEventsPerMonth || 0)
    }
  }

  /**
   * Update user's subscription after successful Stripe payment
   */
  static async updateSubscription(
    userId: string, 
    subscriptionData: {
      tier: SubscriptionTier
      stripeSubscriptionId: string
      stripeCustomerId: string
      currentPeriodStart: Date
      currentPeriodEnd: Date
    }
  ) {
    const limits = SUBSCRIPTION_LIMITS[subscriptionData.tier]
    
    return await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: subscriptionData.tier,
        subscriptionId: subscriptionData.stripeSubscriptionId,
        customerId: subscriptionData.stripeCustomerId,
        subscriptionStatus: 'ACTIVE',
        subscriptionStart: subscriptionData.currentPeriodStart,
        subscriptionEnd: subscriptionData.currentPeriodEnd,
        participantLimit: limits.maxParticipants === -1 ? 999999 : limits.maxParticipants
      }
    })
  }

  /**
   * Cancel user's subscription
   */
  static async cancelSubscription(userId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'CANCELED',
        subscriptionEnd: new Date() // End immediately or at period end based on business logic
      }
    })
  }

  /**
   * Check if user needs to pay for an event (exceeds free limits)
   */
  static async checkEventPaymentRequired(userId: string, expectedParticipants: number): Promise<{
    paymentRequired: boolean
    reason?: string
    suggestedOptions?: Array<{
      type: 'subscription' | 'pay_per_event'
      tier?: string
      eventSize?: string
      price: number
      description: string
    }>
  }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ownedEvents: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }
      }
    })

    if (!user) {
      return { paymentRequired: true, reason: 'User not found' }
    }

    const limits = SUBSCRIPTION_LIMITS[user.subscriptionTier]
    const eventsThisMonth = user.ownedEvents.length

    // Check if within subscription limits
    const withinEventLimit = limits.maxEventsPerMonth === -1 || eventsThisMonth < limits.maxEventsPerMonth
    const withinParticipantLimit = limits.maxParticipants === -1 || expectedParticipants <= limits.maxParticipants

    if (withinEventLimit && withinParticipantLimit) {
      return { paymentRequired: false }
    }

    // Payment required - suggest options
    const suggestions = []

    // Suggest pay-per-event options
    Object.entries(PAY_PER_EVENT_PRICING).forEach(([key, pricing]) => {
      if (pricing.maxParticipants === -1 || expectedParticipants <= pricing.maxParticipants) {
        suggestions.push({
          type: 'pay_per_event' as const,
          eventTier: key,
          eventSize: key, // Keep for backward compatibility
          price: pricing.price,
          description: `Pay $${pricing.price} for this event (${pricing.maxParticipants === -1 ? 'unlimited' : pricing.maxParticipants} participants)`
        })
      }
    })

    // Suggest subscription upgrades for regular organizers
    if (eventsThisMonth >= 3) {
      Object.entries(SUBSCRIPTION_LIMITS).forEach(([key, pricing]) => {
        if (key !== 'FREE' && key !== user.subscriptionTier) {
          const tierPricing = pricing as any
          if ((tierPricing.maxEventsPerMonth === -1 || tierPricing.maxEventsPerMonth > limits.maxEventsPerMonth) &&
              (tierPricing.maxParticipants === -1 || tierPricing.maxParticipants >= expectedParticipants)) {
            suggestions.push({
              type: 'subscription' as const,
              tier: key,
              price: tierPricing.price,
              description: `Upgrade to ${key} ($${tierPricing.price}/month) for unlimited events this size`
            })
          }
        }
      })
    }

    return {
      paymentRequired: true,
      reason: !withinEventLimit ? 
        `You've reached your monthly limit of ${limits.maxEventsPerMonth} events` : 
        `This event (${expectedParticipants} participants) exceeds your limit of ${limits.maxParticipants}`,
      suggestedOptions: suggestions
    }
  }

  /**
   * Get upgrade recommendations based on usage
   */
  static async getUpgradeRecommendations(userId: string) {
    const details = await this.getSubscriptionDetails(userId)
    if (!details) return null

    const recommendations = []

    if (details.tier === 'FREE') {
      if (details.usage.eventsThisMonth >= 2) {
        recommendations.push({
          reason: 'You\'re approaching your monthly event limit',
          suggestedTier: 'COMMUNITY',
          benefits: ['15 events per month', '150 participants', 'Custom branding', 'Analytics dashboard']
        })
      }
    }

    if (details.tier === 'COMMUNITY' || details.tier === 'FREE') {
      // Check if any events are near participant limits
      const events = await prisma.event.findMany({
        where: { ownerId: userId, status: 'ACTIVE' },
        include: { memberships: { where: { status: 'ACTIVE' } } }
      })

      const nearLimitEvents = events.filter(event => 
        event.memberships.length > (details.limits.maxParticipants * 0.8)
      )

      if (nearLimitEvents.length > 0) {
        recommendations.push({
          reason: 'Some events are approaching participant limits',
          suggestedTier: details.tier === 'COMMUNITY' ? 'ORGANIZER' : 'COMMUNITY',
          benefits: ['More participants per event', 'Advanced features']
        })
      }
    }

    return recommendations
  }
}
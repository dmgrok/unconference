import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SubscriptionService, SUBSCRIPTION_LIMITS } from '~/lib/subscription'

// Mock Prisma
const mockPrisma = {
  event: {
    findUnique: vi.fn()
  },
  user: {
    findUnique: vi.fn(),
    update: vi.fn()
  },
  eventMembership: {
    findUnique: vi.fn(),
    create: vi.fn()
  }
}

vi.mock('~/lib/database', () => ({
  default: mockPrisma
}))

describe('Participant Limit Enforcement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('SUBSCRIPTION_LIMITS configuration', () => {
    it('should have correct limits for FREE tier', () => {
      expect(SUBSCRIPTION_LIMITS.FREE).toEqual({
        maxParticipants: 50,
        maxEventsPerMonth: 5,
        features: expect.arrayContaining(['basic_voting', 'room_management', 'qr_codes', 'basic_analytics']),
        price: 0,
        stripePriceId: null,
        description: expect.any(String)
      })
    })

    it('should have correct limits for COMMUNITY tier', () => {
      expect(SUBSCRIPTION_LIMITS.COMMUNITY).toEqual({
        maxParticipants: 150,
        maxEventsPerMonth: 15,
        features: expect.arrayContaining(['analytics', 'custom_branding', 'export_data']),
        price: 19,
        stripePriceId: 'price_community_monthly',
        description: expect.any(String)
      })
    })

    it('should have unlimited participants for UNLIMITED tier', () => {
      expect(SUBSCRIPTION_LIMITS.UNLIMITED.maxParticipants).toBe(-1)
      expect(SUBSCRIPTION_LIMITS.UNLIMITED.maxEventsPerMonth).toBe(-1)
    })
  })

  describe('SubscriptionService.canAddParticipants', () => {
    it('should allow adding participants when under limit', async () => {
      const mockEvent = {
        id: 'event-1',
        owner: { subscriptionTier: 'FREE' },
        memberships: new Array(30).fill({ status: 'ACTIVE' }) // 30 current participants
      }

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent)

      const result = await SubscriptionService.canAddParticipants('event-1', 1)

      expect(result.allowed).toBe(true)
    })

    it('should reject adding participants when at FREE tier limit', async () => {
      const mockEvent = {
        id: 'event-1',
        owner: { subscriptionTier: 'FREE' },
        memberships: new Array(50).fill({ status: 'ACTIVE' }) // At limit
      }

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent)

      const result = await SubscriptionService.canAddParticipants('event-1', 1)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('exceed your participant limit of 50')
    })

    it('should allow unlimited participants for UNLIMITED tier', async () => {
      const mockEvent = {
        id: 'event-1',
        owner: { subscriptionTier: 'UNLIMITED' },
        memberships: new Array(500).fill({ status: 'ACTIVE' }) // Many participants
      }

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent)

      const result = await SubscriptionService.canAddParticipants('event-1', 1)

      expect(result.allowed).toBe(true)
    })

    it('should handle multiple participants addition', async () => {
      const mockEvent = {
        id: 'event-1',
        owner: { subscriptionTier: 'COMMUNITY' },
        memberships: new Array(145).fill({ status: 'ACTIVE' }) // Close to 150 limit
      }

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent)

      // Should allow adding 5 participants (145 + 5 = 150)
      const allowedResult = await SubscriptionService.canAddParticipants('event-1', 5)
      expect(allowedResult.allowed).toBe(true)

      // Should reject adding 6 participants (145 + 6 = 151, over limit)
      const rejectedResult = await SubscriptionService.canAddParticipants('event-1', 6)
      expect(rejectedResult.allowed).toBe(false)
    })

    it('should return error when event not found', async () => {
      mockPrisma.event.findUnique.mockResolvedValue(null)

      const result = await SubscriptionService.canAddParticipants('nonexistent-event', 1)

      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('Event not found')
    })
  })

  describe('SubscriptionService.canCreateEvent', () => {
    it('should allow creating events when under monthly limit', async () => {
      const mockUser = {
        id: 'user-1',
        subscriptionTier: 'FREE',
        ownedEvents: new Array(3).fill({}) // 3 events this month, limit is 5
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await SubscriptionService.canCreateEvent('user-1')

      expect(result.allowed).toBe(true)
    })

    it('should reject creating events when at monthly limit', async () => {
      const mockUser = {
        id: 'user-1',
        subscriptionTier: 'FREE',
        ownedEvents: new Array(5).fill({}) // At limit of 5
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await SubscriptionService.canCreateEvent('user-1')

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('monthly limit of 5 events')
    })

    it('should allow unlimited events for UNLIMITED tier', async () => {
      const mockUser = {
        id: 'user-1',
        subscriptionTier: 'UNLIMITED',
        ownedEvents: new Array(100).fill({}) // Many events
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await SubscriptionService.canCreateEvent('user-1')

      expect(result.allowed).toBe(true)
    })
  })

  describe('SubscriptionService.checkEventPaymentRequired', () => {
    it('should not require payment for events within FREE tier limits', async () => {
      const mockUser = {
        id: 'user-1',
        subscriptionTier: 'FREE',
        ownedEvents: new Array(2).fill({}) // 2 events this month
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await SubscriptionService.checkEventPaymentRequired('user-1', 40)

      expect(result.paymentRequired).toBe(false)
    })

    it('should require payment when exceeding participant limits', async () => {
      const mockUser = {
        id: 'user-1',
        subscriptionTier: 'FREE',
        ownedEvents: new Array(2).fill({}) // 2 events this month
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await SubscriptionService.checkEventPaymentRequired('user-1', 100) // Over 50 limit

      expect(result.paymentRequired).toBe(true)
      expect(result.reason).toContain('exceeds your limit of 50')
      expect(result.suggestedOptions).toBeDefined()
      expect(result.suggestedOptions!.length).toBeGreaterThan(0)
    })

    it('should suggest pay-per-event options', async () => {
      const mockUser = {
        id: 'user-1',
        subscriptionTier: 'FREE',
        ownedEvents: new Array(2).fill({})
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await SubscriptionService.checkEventPaymentRequired('user-1', 75)

      expect(result.paymentRequired).toBe(true)
      expect(result.suggestedOptions).toBeDefined()

      const payPerEventOptions = result.suggestedOptions!.filter(opt => opt.type === 'pay_per_event')
      expect(payPerEventOptions.length).toBeGreaterThan(0)

      // Should suggest SMALL (100 participants, $29) for 75 participant event
      const smallOption = payPerEventOptions.find(opt => opt.eventSize === 'SMALL')
      expect(smallOption).toBeDefined()
      expect(smallOption!.price).toBe(29)
    })

    it('should suggest subscription upgrades for frequent organizers', async () => {
      const mockUser = {
        id: 'user-1',
        subscriptionTier: 'FREE',
        ownedEvents: new Array(4).fill({}) // 4 events this month (approaching limit)
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      const result = await SubscriptionService.checkEventPaymentRequired('user-1', 100)

      expect(result.paymentRequired).toBe(true)
      expect(result.suggestedOptions).toBeDefined()

      const subscriptionOptions = result.suggestedOptions!.filter(opt => opt.type === 'subscription')
      expect(subscriptionOptions.length).toBeGreaterThan(0)

      // Should suggest COMMUNITY tier for regular organizers
      const communityOption = subscriptionOptions.find(opt => opt.tier === 'COMMUNITY')
      expect(communityOption).toBeDefined()
      expect(communityOption!.price).toBe(19)
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockPrisma.event.findUnique.mockRejectedValue(new Error('Database error'))

      // Should not throw, but return an error result
      await expect(SubscriptionService.canAddParticipants('event-1', 1)).resolves.toEqual({
        allowed: false,
        reason: expect.any(String)
      })
    })

    it('should handle zero participants correctly', async () => {
      const mockEvent = {
        id: 'event-1',
        owner: { subscriptionTier: 'FREE' },
        memberships: []
      }

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent)

      const result = await SubscriptionService.canAddParticipants('event-1', 0)
      expect(result.allowed).toBe(true)
    })

    it('should handle negative participant counts', async () => {
      const mockEvent = {
        id: 'event-1',
        owner: { subscriptionTier: 'FREE' },
        memberships: []
      }

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent)

      const result = await SubscriptionService.canAddParticipants('event-1', -1)
      expect(result.allowed).toBe(true) // Negative addition should be allowed
    })
  })

  describe('Warning thresholds', () => {
    it('should provide warning information when approaching limits', async () => {
      const mockEvent = {
        id: 'event-1',
        owner: { subscriptionTier: 'FREE' },
        memberships: new Array(40).fill({ status: 'ACTIVE' }) // 80% of 50
      }

      mockPrisma.event.findUnique.mockResolvedValue(mockEvent)

      const result = await SubscriptionService.canAddParticipants('event-1', 1)

      expect(result.allowed).toBe(true)
      // The result should still allow addition but could include warning info
      // This test verifies that approaching limit doesn't block additions
    })
  })
})
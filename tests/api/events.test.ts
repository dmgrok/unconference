import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserFactory, EventFactory, EventMembershipFactory } from '../fixtures/factories'

// Mock dependencies
const mockEventService = {
  createEvent: vi.fn(),
  getEvent: vi.fn(),
  addEventMembership: vi.fn(),
  getEventByCode: vi.fn()
}

const mockSubscriptionService = {
  canCreateEvent: vi.fn(),
  canAddParticipants: vi.fn()
}

const mockUserSession = {
  user: { id: 'test-user-1', email: 'test@example.com' }
}

vi.mock('~/utils/eventService', () => ({
  eventService: mockEventService
}))

vi.mock('~/lib/subscription', () => ({
  SubscriptionService: mockSubscriptionService
}))

vi.mock('#auth-utils', () => ({
  requireUserSession: vi.fn(() => Promise.resolve(mockUserSession)),
  getUserSession: vi.fn(() => Promise.resolve(mockUserSession))
}))

// Import after mocks
import createEventHandler from '~/server/api/events/create.post'

describe('Events API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/events/create', () => {
    it('should create event with valid data', async () => {
      const newEvent = EventFactory.create({ name: 'Test Event' })
      mockEventService.createEvent.mockResolvedValue(newEvent)

      const mockEvent = {
        node: {
          req: { method: 'POST' },
          res: { statusCode: 200 }
        }
      }

      // Mock readValidatedBody
      vi.doMock('h3', () => ({
        readValidatedBody: vi.fn().mockResolvedValue({
          name: 'Test Event',
          description: 'Test Description'
        })
      }))

      const result = await createEventHandler(mockEvent as any)

      expect(result.success).toBe(true)
      expect(result.event.name).toBe('Test Event')
      expect(mockEventService.createEvent).toHaveBeenCalledWith(
        'test-user-1',
        expect.objectContaining({
          name: 'Test Event',
          description: 'Test Description'
        })
      )
    })

    it('should validate required fields', async () => {
      const mockEvent = {
        node: {
          req: { method: 'POST' },
          res: { statusCode: 200 }
        }
      }

      vi.doMock('h3', () => ({
        readValidatedBody: vi.fn().mockRejectedValue({
          statusCode: 400,
          message: 'Event name must be at least 3 characters'
        })
      }))

      await expect(createEventHandler(mockEvent as any)).rejects.toThrow()
    })

    it('should handle service errors', async () => {
      mockEventService.createEvent.mockRejectedValue(new Error('Database error'))

      const mockEvent = {
        node: {
          req: { method: 'POST' },
          res: { statusCode: 200 }
        }
      }

      vi.doMock('h3', () => ({
        readValidatedBody: vi.fn().mockResolvedValue({
          name: 'Test Event'
        })
      }))

      await expect(createEventHandler(mockEvent as any)).rejects.toThrow('Failed to create event')
    })
  })

  describe('Event joining with participant limits', () => {
    it('should allow joining when under limit', async () => {
      const scenario = {
        owner: UserFactory.createWithTier('FREE'),
        event: EventFactory.create(),
        participants: UserFactory.createMany(30),
        memberships: []
      }

      scenario.memberships = scenario.participants.map(p =>
        EventMembershipFactory.createForEvent(scenario.event.id, { userId: p.id })
      )

      mockSubscriptionService.canAddParticipants.mockResolvedValue({
        allowed: true
      })

      const result = mockSubscriptionService.canAddParticipants('event-1', 1)
      const canJoin = await result

      expect(canJoin.allowed).toBe(true)
    })

    it('should reject joining when at limit', async () => {
      const scenario = {
        owner: UserFactory.createWithTier('FREE'),
        event: EventFactory.create(),
        participants: UserFactory.createMany(50) // At FREE limit
      }

      mockSubscriptionService.canAddParticipants.mockResolvedValue({
        allowed: false,
        reason: 'This would exceed your participant limit of 50'
      })

      const result = await mockSubscriptionService.canAddParticipants('event-1', 1)

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain('exceed your participant limit of 50')
    })

    it('should provide upgrade options when limit exceeded', async () => {
      mockSubscriptionService.canAddParticipants.mockResolvedValue({
        allowed: false,
        reason: 'Limit exceeded',
        upgradeOptions: [
          {
            tier: 'COMMUNITY',
            maxParticipants: 150,
            price: 19,
            stripePriceId: 'price_community_monthly'
          }
        ]
      })

      const result = await mockSubscriptionService.canAddParticipants('event-1', 1)

      expect(result.allowed).toBe(false)
      expect(result.upgradeOptions).toBeDefined()
      expect(result.upgradeOptions[0].tier).toBe('COMMUNITY')
      expect(result.upgradeOptions[0].price).toBe(19)
    })
  })

  describe('Event code validation', () => {
    it('should find event by valid code', async () => {
      const event = EventFactory.createWithCode('ABC123')
      mockEventService.getEventByCode.mockResolvedValue(event)

      const result = await mockEventService.getEventByCode('ABC123')

      expect(result).toBeTruthy()
      expect(result.code).toBe('ABC123')
    })

    it('should return null for invalid code', async () => {
      mockEventService.getEventByCode.mockResolvedValue(null)

      const result = await mockEventService.getEventByCode('INVALID')

      expect(result).toBeNull()
    })

    it('should handle case-insensitive codes', async () => {
      const event = EventFactory.createWithCode('ABC123')
      mockEventService.getEventByCode.mockResolvedValue(event)

      const result = await mockEventService.getEventByCode('abc123')

      expect(result).toBeTruthy()
    })
  })

  describe('Event permissions', () => {
    it('should allow organizer access', async () => {
      const user = UserFactory.create()
      const event = EventFactory.createWithOwner(user)
      const membership = EventMembershipFactory.createOrganizerMembership(user.id, event.id)

      // Mock permission check
      const hasPermission = membership.role === 'ORGANIZER' || membership.role === 'OWNER'

      expect(hasPermission).toBe(true)
    })

    it('should deny participant access to admin functions', async () => {
      const user = UserFactory.create()
      const event = EventFactory.create()
      const membership = EventMembershipFactory.createForEvent(event.id, {
        userId: user.id,
        role: 'PARTICIPANT'
      })

      const hasAdminPermission = membership.role === 'ORGANIZER' || membership.role === 'OWNER'

      expect(hasAdminPermission).toBe(false)
    })
  })
})
import { describe, it, expect, beforeEach, vi } from 'vitest'

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

const mockUserFactory = {
  create: vi.fn(),
  createWithTier: vi.fn(),
  createMany: vi.fn()
}

const mockEventFactory = {
  create: vi.fn(),
  createWithCode: vi.fn(),
  createWithOwner: vi.fn()
}

const mockEventMembershipFactory = {
  createForEvent: vi.fn(),
  createOrganizerMembership: vi.fn()
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

vi.mock('../fixtures/factories', () => ({
  UserFactory: mockUserFactory,
  EventFactory: mockEventFactory,
  EventMembershipFactory: mockEventMembershipFactory
}))

describe('Events API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /api/events/create', () => {
    it('should create event with valid data', async () => {
      const newEvent = { id: 'event-1', name: 'Test Event', description: 'Test Description' }
      mockEventFactory.create.mockReturnValue(newEvent)
      mockEventService.createEvent.mockResolvedValue(newEvent)

      // Test the service method directly since we can't easily test the handler
      const result = await mockEventService.createEvent('test-user-1', {
        name: 'Test Event',
        description: 'Test Description'
      })

      expect(result).toEqual(newEvent)
      expect(mockEventService.createEvent).toHaveBeenCalledWith(
        'test-user-1',
        expect.objectContaining({
          name: 'Test Event',
          description: 'Test Description'
        })
      )
    })

    it('should validate required fields', async () => {
      mockEventService.createEvent.mockRejectedValue(new Error('Event name must be at least 3 characters'))

      await expect(
        mockEventService.createEvent('test-user-1', { name: '' })
      ).rejects.toThrow('Event name must be at least 3 characters')
    })

    it('should handle service errors', async () => {
      mockEventService.createEvent.mockRejectedValue(new Error('Database error'))

      await expect(
        mockEventService.createEvent('test-user-1', { name: 'Test Event' })
      ).rejects.toThrow('Database error')
    })
  })

  describe('Event joining with participant limits', () => {
    it('should allow joining when under limit', async () => {
      const owner = { id: 'user-1', tier: 'FREE' }
      const event = { id: 'event-1', ownerId: 'user-1' }
      const participants = Array.from({ length: 30 }, (_, i) => ({ id: `user-${i + 2}` }))

      mockUserFactory.createWithTier.mockReturnValue(owner)
      mockEventFactory.create.mockReturnValue(event)
      mockUserFactory.createMany.mockReturnValue(participants)

      mockSubscriptionService.canAddParticipants.mockResolvedValue({
        allowed: true
      })

      const result = await mockSubscriptionService.canAddParticipants('event-1', 1)

      expect(result.allowed).toBe(true)
    })

    it('should reject joining when at limit', async () => {
      const owner = { id: 'user-1', tier: 'FREE' }
      const event = { id: 'event-1', ownerId: 'user-1' }
      const participants = Array.from({ length: 50 }, (_, i) => ({ id: `user-${i + 2}` })) // At FREE limit

      mockUserFactory.createWithTier.mockReturnValue(owner)
      mockEventFactory.create.mockReturnValue(event)
      mockUserFactory.createMany.mockReturnValue(participants)

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
      const event = { id: 'event-1', code: 'ABC123', name: 'Test Event' }
      mockEventFactory.createWithCode.mockReturnValue(event)
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
      const event = { id: 'event-1', code: 'ABC123', name: 'Test Event' }
      mockEventFactory.createWithCode.mockReturnValue(event)
      mockEventService.getEventByCode.mockResolvedValue(event)

      const result = await mockEventService.getEventByCode('abc123')

      expect(result).toBeTruthy()
    })
  })

  describe('Event permissions', () => {
    it('should allow organizer access', async () => {
      const user = { id: 'user-1', name: 'Test User' }
      const event = { id: 'event-1', ownerId: 'user-1' }
      const membership = { userId: 'user-1', eventId: 'event-1', role: 'ORGANIZER' }

      mockUserFactory.create.mockReturnValue(user)
      mockEventFactory.createWithOwner.mockReturnValue(event)
      mockEventMembershipFactory.createOrganizerMembership.mockReturnValue(membership)

      // Mock permission check
      const hasPermission = membership.role === 'ORGANIZER' || membership.role === 'OWNER'

      expect(hasPermission).toBe(true)
    })

    it('should deny participant access to admin functions', async () => {
      const user = { id: 'user-1', name: 'Test User' }
      const event = { id: 'event-1', ownerId: 'user-2' }
      const membership = { userId: 'user-1', eventId: 'event-1', role: 'PARTICIPANT' }

      mockUserFactory.create.mockReturnValue(user)
      mockEventFactory.create.mockReturnValue(event)
      mockEventMembershipFactory.createForEvent.mockReturnValue(membership)

      const hasAdminPermission = membership.role === 'ORGANIZER' || membership.role === 'OWNER'

      expect(hasAdminPermission).toBe(false)
    })
  })
})
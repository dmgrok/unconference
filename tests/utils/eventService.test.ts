import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { promises as fs } from 'fs'
import { join } from 'path'
import { EventService } from '~/utils/eventService'

// Mock filesystem operations
vi.mock('fs', () => ({
  promises: {
    access: vi.fn(),
    mkdir: vi.fn(),
    writeFile: vi.fn(),
    readFile: vi.fn(),
    readdir: vi.fn()
  }
}))

// Mock logger
vi.mock('~/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}))

describe('EventService', () => {
  let eventService: EventService
  const mockFs = fs as any

  beforeEach(() => {
    vi.clearAllMocks()
    eventService = EventService.getInstance()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('createEvent', () => {
    it('should create a new event with required fields', async () => {
      // Mock successful filesystem operations
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)
      mockFs.readFile.mockResolvedValue('[]') // Empty events array

      const eventData = {
        name: 'Test Event',
        description: 'A test event',
        location: 'Test Venue'
      }

      const event = await eventService.createEvent('user-123', eventData)

      expect(event.name).toBe(eventData.name)
      expect(event.description).toBe(eventData.description)
      expect(event.location).toBe(eventData.location)
      expect(event.organizerId).toBe('user-123')
      expect(event.id).toBeDefined()
      expect(event.code).toBeDefined()
      expect(event.isActive).toBe(true)
      expect(event.settings).toBeDefined()
    })

    it('should generate unique event ID and code', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)
      mockFs.readFile.mockResolvedValue('[]')

      const event1 = await eventService.createEvent('user-123', { name: 'Event 1' })
      const event2 = await eventService.createEvent('user-123', { name: 'Event 2' })

      expect(event1.id).not.toBe(event2.id)
      expect(event1.code).not.toBe(event2.code)
    })

    it('should apply default settings when none provided', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)
      mockFs.readFile.mockResolvedValue('[]')

      const event = await eventService.createEvent('user-123', { name: 'Test Event' })

      expect(event.settings).toEqual(expect.objectContaining({
        allowGuestAccess: expect.any(Boolean),
        maxVotesPerTopic: expect.any(Number),
        topTopicsCount: expect.any(Number)
      }))
    })

    it('should merge custom settings with defaults', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)
      mockFs.readFile.mockResolvedValue('[]')

      const customSettings = {
        maxVotesPerTopic: 15,
        allowGuestAccess: false
      }

      const event = await eventService.createEvent('user-123', {
        name: 'Test Event',
        settings: customSettings
      })

      expect(event.settings.maxVotesPerTopic).toBe(15)
      expect(event.settings.allowGuestAccess).toBe(false)
      expect(event.settings.topTopicsCount).toBeDefined() // Should have default
    })

    it('should set appropriate timestamps', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)
      mockFs.readFile.mockResolvedValue('[]')

      const beforeCreate = new Date()
      const event = await eventService.createEvent('user-123', { name: 'Test Event' })
      const afterCreate = new Date()

      expect(event.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
      expect(event.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime())
      expect(event.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
      expect(event.updatedAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime())
    })
  })

  describe('getEvent', () => {
    it('should return event when it exists', async () => {
      const mockEvent = {
        id: 'event-123',
        name: 'Test Event',
        code: 'ABC123',
        organizerId: 'user-123',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      mockFs.readFile.mockResolvedValue(JSON.stringify([mockEvent]))

      const event = await eventService.getEvent('event-123')

      expect(event).toBeTruthy()
      expect(event?.id).toBe('event-123')
      expect(event?.name).toBe('Test Event')
    })

    it('should return null when event does not exist', async () => {
      mockFs.readFile.mockResolvedValue('[]')

      const event = await eventService.getEvent('nonexistent')

      expect(event).toBeNull()
    })

    it('should handle filesystem errors gracefully', async () => {
      mockFs.readFile.mockRejectedValue(new Error('File not found'))

      const event = await eventService.getEvent('event-123')

      expect(event).toBeNull()
    })
  })

  describe('addEventMembership', () => {
    it('should add membership with correct role', async () => {
      mockFs.readFile.mockResolvedValue('[]') // Empty memberships array
      mockFs.writeFile.mockResolvedValue(undefined)

      await eventService.addEventMembership('event-123', 'user-456', 'Participant')

      // Check that writeFile was called with correct membership data
      expect(mockFs.writeFile).toHaveBeenCalled()
      const writeCall = mockFs.writeFile.mock.calls[0]
      const membershipData = JSON.parse(writeCall[1])

      expect(Array.isArray(membershipData)).toBe(true)
      expect(membershipData[0]).toEqual(expect.objectContaining({
        eventId: 'event-123',
        userId: 'user-456',
        role: 'Participant'
      }))
    })

    it('should not add duplicate memberships', async () => {
      const existingMembership = {
        eventId: 'event-123',
        userId: 'user-456',
        role: 'Participant'
      }

      mockFs.readFile.mockResolvedValue(JSON.stringify([existingMembership]))
      mockFs.writeFile.mockResolvedValue(undefined)

      await eventService.addEventMembership('event-123', 'user-456', 'Organizer')

      // Should not write anything if membership already exists
      expect(mockFs.writeFile).not.toHaveBeenCalled()
    })
  })

  describe('singleton pattern', () => {
    it('should return same instance', () => {
      const instance1 = EventService.getInstance()
      const instance2 = EventService.getInstance()

      expect(instance1).toBe(instance2)
    })
  })

  describe('event code generation', () => {
    it('should generate codes of correct length', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)
      mockFs.readFile.mockResolvedValue('[]')

      const event = await eventService.createEvent('user-123', { name: 'Test Event' })

      expect(event.code).toMatch(/^[A-Z0-9]{6}$/)
    })

    it('should generate unique codes for multiple events', async () => {
      mockFs.mkdir.mockResolvedValue(undefined)
      mockFs.writeFile.mockResolvedValue(undefined)
      mockFs.readFile.mockResolvedValue('[]')

      const codes = new Set()

      // Create multiple events and collect their codes
      for (let i = 0; i < 10; i++) {
        const event = await eventService.createEvent('user-123', { name: `Event ${i}` })
        codes.add(event.code)
      }

      // All codes should be unique
      expect(codes.size).toBe(10)
    })
  })
})
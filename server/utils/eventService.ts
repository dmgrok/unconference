import { promises as fs } from 'fs'
import { join } from 'path'
import type { Event, EventSettings } from '~/types/event'
import type { User, UserEventRole } from '~/types/user'
import logger from '../../utils/logger'

export class EventService {
  private static instance: EventService
  private eventsBasePath = join(process.cwd(), 'data', 'events')
  private platformBasePath = join(process.cwd(), 'data', 'platform')

  static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService()
    }
    return EventService.instance
  }

  async createEvent(organizerId: string, eventData: Partial<Event> & { name: string }): Promise<Event> {
    const eventId = this.generateEventId()
    const eventCode = this.generateEventCode()
    
    const event: Event = {
      id: eventId,
      code: eventCode,
      name: eventData.name,
      description: eventData.description,
      organizerId,
      location: eventData.location,
      startDate: eventData.startDate || new Date(),
      endDate: eventData.endDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
      isActive: true,
      settings: { ...this.getDefaultEventSettings(), ...eventData.settings },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Create event directory and files
    await this.initializeEventData(event)
    
    // Add organizer membership
    await this.addEventMembership(eventId, organizerId, 'Organizer')
    
    logger.info(`Event created: ${event.name} (${eventId}) by user ${organizerId}`)
    return event
  }

  async getEvent(eventId: string): Promise<Event | null> {
    try {
      const eventsPath = join(this.platformBasePath, 'events.json')
      const eventsData = await fs.readFile(eventsPath, 'utf-8')
      const events = JSON.parse(eventsData) as Event[]
      return events.find(e => e.id === eventId) || null
    } catch (error) {
      logger.error('Error reading events:', error)
      return null
    }
  }

  async getEventByCode(eventCode: string): Promise<Event | null> {
    try {
      const eventsPath = join(this.platformBasePath, 'events.json')
      const eventsData = await fs.readFile(eventsPath, 'utf-8')
      const events = JSON.parse(eventsData) as Event[]
      return events.find(e => e.code.toUpperCase() === eventCode.toUpperCase()) || null
    } catch (error) {
      logger.error('Error reading events:', error)
      return null
    }
  }

  async getUserEvents(userId: string): Promise<Event[]> {
    try {
      const membershipsPath = join(this.platformBasePath, 'memberships.json')
      const membershipsData = await fs.readFile(membershipsPath, 'utf-8')
      const memberships = JSON.parse(membershipsData) as UserEventRole[]
      
      const userEventIds = memberships
        .filter(m => m.userId === userId && m.role !== 'Guest')
        .map(m => m.eventId)

      const eventsPath = join(this.platformBasePath, 'events.json')
      const eventsData = await fs.readFile(eventsPath, 'utf-8')
      const events = JSON.parse(eventsData) as Event[]
      
      return events.filter(e => userEventIds.includes(e.id))
    } catch (error) {
      logger.error('Error getting user events:', error)
      return []
    }
  }

  async getUserRoleInEvent(userId: string, eventId: string): Promise<string | null> {
    try {
      const membershipsPath = join(this.platformBasePath, 'memberships.json')
      const membershipsData = await fs.readFile(membershipsPath, 'utf-8')
      const memberships = JSON.parse(membershipsData) as UserEventRole[]
      
      const membership = memberships.find(m => 
        m.userId === userId && m.eventId === eventId
      )
      
      return membership?.role || null
    } catch (error) {
      logger.error('Error getting user role:', error)
      return null
    }
  }

  async addEventMembership(eventId: string, userId: string, role: 'Organizer' | 'Moderator' | 'Participant'): Promise<void> {
    try {
      const membershipsPath = join(this.platformBasePath, 'memberships.json')
      let memberships: UserEventRole[] = []
      
      try {
        const membershipsData = await fs.readFile(membershipsPath, 'utf-8')
        memberships = JSON.parse(membershipsData)
      } catch {
        // File doesn't exist, start with empty array
      }

      const membership: UserEventRole = {
        userId,
        eventId,
        role,
        permissions: this.getDefaultPermissions(role),
        joinedAt: new Date()
      }

      // Remove existing membership if any
      memberships = memberships.filter(m => !(m.userId === userId && m.eventId === eventId))
      memberships.push(membership)

      await fs.mkdir(this.platformBasePath, { recursive: true })
      await fs.writeFile(membershipsPath, JSON.stringify(memberships, null, 2))
    } catch (error) {
      logger.error('Error adding membership:', error)
      throw error
    }
  }

  private async initializeEventData(event: Event): Promise<void> {
    const eventDir = join(this.eventsBasePath, event.id)
    await fs.mkdir(eventDir, { recursive: true })

    // Initialize event files
    const files = {
      'settings.json': event.settings,
      'topics.json': [],
      'rooms.json': [],
      'active-round.json': null,
      'round-history.json': [],
      'current-groups.json': []
    }

    for (const [filename, content] of Object.entries(files)) {
      await fs.writeFile(
        join(eventDir, filename),
        JSON.stringify(content, null, 2)
      )
    }

    // Update global events list
    await this.saveEventToGlobalList(event)
  }

  private async saveEventToGlobalList(event: Event): Promise<void> {
    const eventsPath = join(this.platformBasePath, 'events.json')
    let events: Event[] = []
    
    try {
      const eventsData = await fs.readFile(eventsPath, 'utf-8')
      events = JSON.parse(eventsData)
    } catch {
      // File doesn't exist, start with empty array
    }

    // Remove existing event if updating
    events = events.filter(e => e.id !== event.id)
    events.push(event)

    await fs.mkdir(this.platformBasePath, { recursive: true })
    await fs.writeFile(eventsPath, JSON.stringify(events, null, 2))
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateEventCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  private getDefaultEventSettings(): EventSettings {
    return {
      maxVotesPerTopic: 12,
      topTopicsCount: 10,
      showVoterNames: true,
      allowTopicSubmission: true,
      autoStartNewRound: false,
      allowGuestAccess: true
    }
  }

  private getDefaultPermissions(role: string) {
    const permissions: Record<string, any> = {
      'Organizer': [
        { resource: 'topics', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'rooms', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'settings', actions: ['read', 'update', 'manage'] },
        { resource: 'users', actions: ['read', 'update', 'manage'] },
        { resource: 'rounds', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'voting', actions: ['read', 'manage'] }
      ],
      'Moderator': [
        { resource: 'topics', actions: ['create', 'read', 'update'] },
        { resource: 'rooms', actions: ['read', 'update'] },
        { resource: 'settings', actions: ['read'] },
        { resource: 'users', actions: ['read'] },
        { resource: 'rounds', actions: ['read', 'update'] },
        { resource: 'voting', actions: ['read'] }
      ],
      'Participant': [
        { resource: 'topics', actions: ['create', 'read'] },
        { resource: 'rooms', actions: ['read'] },
        { resource: 'voting', actions: ['create', 'read'] }
      ]
    }
    
    return permissions[role] || permissions['Participant']
  }
}

export const eventService = EventService.getInstance()

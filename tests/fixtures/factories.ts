import { faker } from '@faker-js/faker'
import { vi } from 'vitest'

// Type imports
export interface User {
  id: string
  email: string
  name: string
  subscriptionTier: 'FREE' | 'COMMUNITY' | 'ORGANIZER' | 'UNLIMITED'
  role: 'USER' | 'ADMIN' | 'ADMIN'
  status: 'ACTIVE' | 'SUSPENDED'
  emailPreferences?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Event {
  id: string
  title: string
  description: string
  code: string
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  requireApproval: boolean
  ownerId: string
  maxParticipants?: number
  createdAt: Date
  updatedAt: Date
}

export interface EventMembership {
  id: string
  userId: string
  eventId: string
  role: 'PARTICIPANT' | 'ORGANIZER' | 'OWNER'
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED'
  joinedAt: Date
}

export interface DiscussionTopic {
  id: string
  title: string
  description: string
  eventId: string
  submittedBy: string
  votes: number
  status: 'ACTIVE' | 'SELECTED' | 'COMPLETED' | 'CANCELLED'
  createdAt: Date
  updatedAt: Date
}

// Factory functions
export class UserFactory {
  static create(overrides: Partial<User> = {}): User {
    return {
      id: faker.string.uuid(),
      email: faker.internet.email(),
      name: faker.person.fullName(),
      subscriptionTier: 'FREE',
      role: 'USER',
      status: 'ACTIVE',
      emailPreferences: null,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    }
  }

  static createMany(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  static createAdmin(overrides: Partial<User> = {}): User {
    return this.create({
      role: 'ADMIN',
      subscriptionTier: 'ORGANIZER',
      ...overrides
    })
  }

  static createAdmin(overrides: Partial<User> = {}): User {
    return this.create({
      role: 'ADMIN',
      subscriptionTier: 'UNLIMITED',
      ...overrides
    })
  }

  static createWithTier(tier: User['subscriptionTier'], overrides: Partial<User> = {}): User {
    return this.create({
      subscriptionTier: tier,
      ...overrides
    })
  }
}

export class EventFactory {
  static create(overrides: Partial<Event> = {}): Event {
    return {
      id: faker.string.uuid(),
      title: faker.company.catchPhrase(),
      description: faker.lorem.paragraph(),
      code: faker.string.alphanumeric(6).toUpperCase(),
      status: 'ACTIVE',
      requireApproval: false,
      ownerId: faker.string.uuid(),
      maxParticipants: undefined,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    }
  }

  static createMany(count: number, overrides: Partial<Event> = {}): Event[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  static createWithOwner(owner: User, overrides: Partial<Event> = {}): Event {
    return this.create({
      ownerId: owner.id,
      ...overrides
    })
  }

  static createWithCode(code: string, overrides: Partial<Event> = {}): Event {
    return this.create({
      code,
      ...overrides
    })
  }
}

export class EventMembershipFactory {
  static create(overrides: Partial<EventMembership> = {}): EventMembership {
    return {
      id: faker.string.uuid(),
      userId: faker.string.uuid(),
      eventId: faker.string.uuid(),
      role: 'PARTICIPANT',
      status: 'ACTIVE',
      joinedAt: faker.date.past(),
      ...overrides
    }
  }

  static createMany(count: number, overrides: Partial<EventMembership> = {}): EventMembership[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  static createForEvent(eventId: string, overrides: Partial<EventMembership> = {}): EventMembership {
    return this.create({
      eventId,
      ...overrides
    })
  }

  static createForUser(userId: string, overrides: Partial<EventMembership> = {}): EventMembership {
    return this.create({
      userId,
      ...overrides
    })
  }

  static createOrganizerMembership(userId: string, eventId: string, overrides: Partial<EventMembership> = {}): EventMembership {
    return this.create({
      userId,
      eventId,
      role: 'ORGANIZER',
      ...overrides
    })
  }
}

export class TopicFactory {
  static create(overrides: Partial<DiscussionTopic> = {}): DiscussionTopic {
    return {
      id: faker.string.uuid(),
      title: faker.lorem.sentence(),
      description: faker.lorem.paragraph(),
      eventId: faker.string.uuid(),
      submittedBy: faker.string.uuid(),
      votes: faker.number.int({ min: 0, max: 50 }),
      status: 'ACTIVE',
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
      ...overrides
    }
  }

  static createMany(count: number, overrides: Partial<DiscussionTopic> = {}): DiscussionTopic[] {
    return Array.from({ length: count }, () => this.create(overrides))
  }

  static createForEvent(eventId: string, overrides: Partial<DiscussionTopic> = {}): DiscussionTopic {
    return this.create({
      eventId,
      ...overrides
    })
  }

  static createPopular(overrides: Partial<DiscussionTopic> = {}): DiscussionTopic {
    return this.create({
      votes: faker.number.int({ min: 20, max: 50 }),
      ...overrides
    })
  }
}

// Mock data generators for specific scenarios
export class ScenarioFactory {
  /**
   * Create a complete event scenario with owner, participants, and topics
   */
  static createEventScenario(participantCount: number = 25) {
    const owner = UserFactory.create({ subscriptionTier: 'FREE' })
    const event = EventFactory.createWithOwner(owner)
    const participants = UserFactory.createMany(participantCount)
    const memberships = [
      EventMembershipFactory.create({
        userId: owner.id,
        eventId: event.id,
        role: 'OWNER'
      }),
      ...participants.map(p =>
        EventMembershipFactory.createForEvent(event.id, {
          userId: p.id,
          role: 'PARTICIPANT'
        })
      )
    ]
    const topics = TopicFactory.createMany(10, { eventId: event.id })

    return {
      owner,
      event,
      participants,
      memberships,
      topics,
      allUsers: [owner, ...participants]
    }
  }

  /**
   * Create a near-capacity event for limit testing
   */
  static createNearCapacityEvent(subscriptionTier: User['subscriptionTier'] = 'FREE') {
    const limits = {
      'FREE': 50,
      'COMMUNITY': 150,
      'ORGANIZER': 500,
      'UNLIMITED': -1
    }

    const limit = limits[subscriptionTier]
    const participantCount = limit === -1 ? 100 : limit - 5 // 5 spots remaining

    const owner = UserFactory.create({ subscriptionTier })
    const event = EventFactory.createWithOwner(owner)
    const participants = UserFactory.createMany(participantCount)
    const memberships = participants.map(p =>
      EventMembershipFactory.createForEvent(event.id, { userId: p.id })
    )

    return {
      owner,
      event,
      participants,
      memberships,
      participantCount,
      limit
    }
  }

  /**
   * Create email preferences scenarios
   */
  static createEmailPreferencesScenario() {
    const users = [
      UserFactory.create({
        emailPreferences: JSON.stringify({
          eventSummaries: true,
          collaborationReminders: true,
          networkingFollowUp: true,
          weeklyDigest: true,
          eventInvitations: true
        })
      }),
      UserFactory.create({
        emailPreferences: JSON.stringify({
          eventSummaries: false,
          collaborationReminders: true,
          networkingFollowUp: false,
          weeklyDigest: false,
          eventInvitations: true
        })
      }),
      UserFactory.create({
        emailPreferences: null // Should use defaults
      })
    ]

    return { users }
  }
}

// Database mock helpers
export class DatabaseMocks {
  static mockPrismaClient() {
    return {
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
      },
      event: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
      },
      eventMembership: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
      },
      discussionTopic: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn()
      }
    }
  }

  static mockEventWithMemberships(event: Event, memberships: EventMembership[]) {
    return {
      ...event,
      memberships: memberships.filter(m => m.eventId === event.id),
      owner: { subscriptionTier: 'FREE' } // Default owner
    }
  }
}
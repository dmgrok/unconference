import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

/**
 * Test utilities for setting up and cleaning up test data
 */

export interface CreateTestUserOptions {
  email: string
  name: string
  globalRole?: 'USER' | 'SUPER_ADMIN'
  isActive?: boolean
  skills?: string
  interests?: string
}

export interface CreateTestEventOptions {
  title: string
  code: string
  ownerId: string
  status?: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'
  maxParticipants?: number
  allowGuestAccess?: boolean
  requireApproval?: boolean
}

/**
 * Create a test user with minimal required data
 */
export async function createTestUser(
  prisma: PrismaClient,
  options: CreateTestUserOptions
) {
  // Make email unique by adding timestamp to avoid conflicts
  const uniqueEmail = options.email.includes('@')
    ? options.email.replace('@', `+${Date.now()}@`)
    : `${options.email}+${Date.now()}@test.com`

  return await prisma.user.create({
    data: {
      id: randomUUID(),
      email: uniqueEmail,
      name: options.name,
      globalRole: options.globalRole || 'USER',
      isActive: options.isActive ?? true,
      skills: options.skills || null,
      interests: options.interests || null,
      isEmailVerified: true
    }
  })
}

/**
 * Create a test event with minimal required data
 */
export async function createTestEvent(
  prisma: PrismaClient,
  options: CreateTestEventOptions
) {
  return await prisma.event.create({
    data: {
      id: randomUUID(),
      title: options.title,
      code: options.code,
      ownerId: options.ownerId,
      status: options.status || 'ACTIVE',
      maxParticipants: options.maxParticipants || 50,
      allowGuestAccess: options.allowGuestAccess ?? true,
      requireApproval: options.requireApproval ?? false,
      maxVotesPerTopic: 12,
      maxTopicsPerRound: 10,
      defaultRoundDuration: 20
    }
  })
}

/**
 * Create a test showcase with minimal required data
 */
export async function createTestShowcase(
  prisma: PrismaClient,
  eventId: string,
  overrides: any = {}
) {
  return await prisma.workShowcase.create({
    data: {
      id: randomUUID(),
      eventId,
      projectName: 'Test Project',
      description: 'This is a test project for testing purposes',
      status: 'IDEATION',
      contributors: JSON.stringify([]),
      skillsUsed: JSON.stringify([]),
      skillsNeeded: JSON.stringify([]),
      images: JSON.stringify([]),
      tags: JSON.stringify([]),
      ...overrides
    }
  })
}

/**
 * Create event membership for a user
 */
export async function createEventMembership(
  prisma: PrismaClient,
  userId: string,
  eventId: string,
  role: 'ORGANIZER' | 'MODERATOR' | 'PARTICIPANT' | 'GUEST' = 'PARTICIPANT'
) {
  return await prisma.eventMembership.create({
    data: {
      userId,
      eventId,
      role,
      status: 'ACTIVE'
    }
  })
}

/**
 * Clean up all test data
 * This should be called in afterEach hooks to ensure test isolation
 */
export async function cleanupTestData(prisma: PrismaClient) {
  // Delete in order of dependencies
  await prisma.workShowcase.deleteMany({
    where: {
      projectName: {
        startsWith: 'Test'
      }
    }
  })

  await prisma.eventMembership.deleteMany({
    where: {
      user: {
        email: {
          contains: 'test'
        }
      }
    }
  })

  await prisma.event.deleteMany({
    where: {
      OR: [
        { title: { startsWith: 'Test' } },
        { code: { startsWith: 'TEST' } }
      ]
    }
  })

  await prisma.user.deleteMany({
    where: {
      email: {
        contains: 'test'
      }
    }
  })
}

/**
 * Create a mock user session for API testing
 */
export function createMockUserSession(user: any) {
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      globalRole: user.globalRole,
      isActive: user.isActive
    }
  }
}

/**
 * Mock authentication middleware for testing
 */
export function mockAuth(userId: string) {
  return {
    headers: {
      'x-test-user-id': userId
    }
  }
}

/**
 * Create sample showcase data for testing
 */
export function createSampleShowcaseData(overrides: any = {}) {
  return {
    projectName: 'Sample Project',
    description: 'This is a sample project with a detailed description that meets the minimum length requirements for testing purposes.',
    status: 'IDEATION',
    skillsUsed: ['JavaScript', 'Vue.js', 'Node.js'],
    skillsNeeded: ['Python', 'Machine Learning', 'UI/UX Design'],
    tags: ['web-development', 'ai', 'open-source'],
    contactEmail: 'project@example.com',
    repositoryUrl: 'https://github.com/example/project',
    demoUrl: 'https://demo.example.com',
    images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
    contributors: [],
    ...overrides
  }
}

/**
 * Validation helpers for testing API responses
 */
export function validateShowcaseResponse(showcase: any) {
  expect(showcase).toHaveProperty('id')
  expect(showcase).toHaveProperty('projectName')
  expect(showcase).toHaveProperty('description')
  expect(showcase).toHaveProperty('status')
  expect(showcase).toHaveProperty('createdAt')
  expect(showcase).toHaveProperty('updatedAt')

  // Ensure arrays are properly parsed
  expect(Array.isArray(showcase.skillsUsed)).toBe(true)
  expect(Array.isArray(showcase.skillsNeeded)).toBe(true)
  expect(Array.isArray(showcase.tags)).toBe(true)
  expect(Array.isArray(showcase.images)).toBe(true)
  expect(Array.isArray(showcase.contributors)).toBe(true)
}

/**
 * Database seeding for integration tests
 */
export async function seedTestDatabase(prisma: PrismaClient) {
  // Create test users
  const testUsers = await Promise.all([
    createTestUser(prisma, {
      email: 'organizer@test.com',
      name: 'Test Organizer'
    }),
    createTestUser(prisma, {
      email: 'participant1@test.com',
      name: 'Test Participant 1',
      skills: 'JavaScript, React, Node.js'
    }),
    createTestUser(prisma, {
      email: 'participant2@test.com',
      name: 'Test Participant 2',
      skills: 'Python, Django, Machine Learning'
    })
  ])

  // Create test event
  const testEvent = await createTestEvent(prisma, {
    title: 'Integration Test Event',
    code: 'INTTEST',
    ownerId: testUsers[0].id
  })

  // Create event memberships
  await Promise.all(
    testUsers.map(user =>
      createEventMembership(
        prisma,
        user.id,
        testEvent.id,
        user.id === testUsers[0].id ? 'ORGANIZER' : 'PARTICIPANT'
      )
    )
  )

  // Create test showcases
  const testShowcases = await Promise.all([
    createTestShowcase(prisma, testEvent.id, {
      projectName: 'Web Dashboard',
      description: 'A comprehensive web dashboard for data visualization and analytics.',
      status: 'ACTIVE',
      skillsUsed: JSON.stringify(['JavaScript', 'React', 'D3.js']),
      skillsNeeded: JSON.stringify(['Python', 'Data Science']),
      contributors: JSON.stringify([testUsers[0].id, testUsers[1].id]),
      tags: JSON.stringify(['web-development', 'analytics', 'visualization'])
    }),
    createTestShowcase(prisma, testEvent.id, {
      projectName: 'ML Prediction Model',
      description: 'Machine learning model for predicting user behavior patterns.',
      status: 'SEEKING_COLLABORATORS',
      skillsUsed: JSON.stringify(['Python', 'TensorFlow', 'Pandas']),
      skillsNeeded: JSON.stringify(['React', 'API Development']),
      contributors: JSON.stringify([testUsers[2].id]),
      tags: JSON.stringify(['machine-learning', 'ai', 'data-science'])
    }),
    createTestShowcase(prisma, testEvent.id, {
      projectName: 'Mobile App Prototype',
      description: 'Prototype of a mobile application for community networking.',
      status: 'IDEATION',
      skillsUsed: JSON.stringify(['Figma', 'UI Design']),
      skillsNeeded: JSON.stringify(['React Native', 'iOS', 'Android']),
      contributors: JSON.stringify([testUsers[1].id]),
      tags: JSON.stringify(['mobile', 'prototype', 'community'])
    })
  ])

  return {
    users: testUsers,
    event: testEvent,
    showcases: testShowcases
  }
}

/**
 * Performance test helpers
 */
export async function measureApiPerformance(
  apiCall: () => Promise<any>,
  maxDurationMs: number = 1000
) {
  const startTime = Date.now()
  const result = await apiCall()
  const duration = Date.now() - startTime

  expect(duration).toBeLessThan(maxDurationMs)
  return { result, duration }
}
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { createTestUser, createTestEvent, cleanupTestData } from '../helpers/test-utils'

const prisma = new PrismaClient()

describe('WorkShowcase API', () => {
  let testUser: any
  let testEvent: any
  let testShowcase: any

  beforeEach(async () => {
    // Create test user and event
    testUser = await createTestUser({
      email: 'test@example.com',
      name: 'Test User'
    })

    testEvent = await createTestEvent({
      title: 'Test Event',
      code: 'TEST001',
      ownerId: testUser.id
    })

    // Create event membership
    await prisma.eventMembership.create({
      data: {
        userId: testUser.id,
        eventId: testEvent.id,
        role: 'PARTICIPANT'
      }
    })
  })

  afterEach(async () => {
    await cleanupTestData(prisma)
  })

  describe('POST /api/events/[eventId]/showcases', () => {
    it('should create a new showcase successfully', async () => {
      const showcaseData = {
        projectName: 'Test Project',
        description: 'This is a test project for demonstration purposes',
        status: 'IDEATION',
        skillsUsed: ['JavaScript', 'Vue.js'],
        skillsNeeded: ['Python', 'Machine Learning'],
        tags: ['web-development', 'AI'],
        contactEmail: 'project@example.com',
        repositoryUrl: 'https://github.com/test/project',
        demoUrl: 'https://test-project.demo.com',
        images: ['https://example.com/image1.jpg'],
        contributors: [testUser.id]
      }

      const response = await $fetch(`/api/events/${testEvent.id}/showcases`, {
        method: 'POST',
        body: showcaseData,
        headers: {
          // Mock authentication - in real tests you'd set up proper auth
          'x-user-id': testUser.id
        }
      })

      expect(response.success).toBe(true)
      expect(response.showcase).toMatchObject({
        projectName: showcaseData.projectName,
        description: showcaseData.description,
        status: showcaseData.status,
        skillsUsed: showcaseData.skillsUsed,
        skillsNeeded: showcaseData.skillsNeeded,
        tags: showcaseData.tags
      })

      testShowcase = response.showcase
    })

    it('should fail with invalid data', async () => {
      const invalidData = {
        projectName: '', // Empty name should fail
        description: 'Short' // Too short description
      }

      await expect(
        $fetch(`/api/events/${testEvent.id}/showcases`, {
          method: 'POST',
          body: invalidData,
          headers: { 'x-user-id': testUser.id }
        })
      ).rejects.toThrow()
    })

    it('should fail for non-members', async () => {
      const nonMember = await createTestUser({
        email: 'nonmember@example.com',
        name: 'Non Member'
      })

      const showcaseData = {
        projectName: 'Test Project',
        description: 'This is a test project'
      }

      await expect(
        $fetch(`/api/events/${testEvent.id}/showcases`, {
          method: 'POST',
          body: showcaseData,
          headers: { 'x-user-id': nonMember.id }
        })
      ).rejects.toThrow('You must be a member of this event')
    })
  })

  describe('GET /api/events/[eventId]/showcases', () => {
    beforeEach(async () => {
      // Create test showcases
      testShowcase = await prisma.workShowcase.create({
        data: {
          eventId: testEvent.id,
          projectName: 'Test Project 1',
          description: 'First test project',
          status: 'ACTIVE',
          skillsUsed: JSON.stringify(['JavaScript', 'Vue.js']),
          skillsNeeded: JSON.stringify(['Python']),
          tags: JSON.stringify(['web-dev']),
          contributors: JSON.stringify([testUser.id])
        }
      })

      await prisma.workShowcase.create({
        data: {
          eventId: testEvent.id,
          projectName: 'Test Project 2',
          description: 'Second test project',
          status: 'SEEKING_COLLABORATORS',
          skillsUsed: JSON.stringify(['Python', 'AI']),
          skillsNeeded: JSON.stringify(['JavaScript']),
          tags: JSON.stringify(['ai', 'machine-learning']),
          contributors: JSON.stringify([testUser.id])
        }
      })
    })

    it('should return all showcases for an event', async () => {
      const response = await $fetch(`/api/events/${testEvent.id}/showcases`, {
        headers: { 'x-user-id': testUser.id }
      })

      expect(response.success).toBe(true)
      expect(response.showcases).toHaveLength(2)
      expect(response.showcases[0]).toHaveProperty('projectName')
      expect(response.showcases[0].skillsUsed).toBeInstanceOf(Array)
    })

    it('should filter by status', async () => {
      const response = await $fetch(`/api/events/${testEvent.id}/showcases?status=ACTIVE`, {
        headers: { 'x-user-id': testUser.id }
      })

      expect(response.showcases).toHaveLength(1)
      expect(response.showcases[0].status).toBe('ACTIVE')
    })

    it('should filter by skills', async () => {
      const response = await $fetch(`/api/events/${testEvent.id}/showcases?skillsUsed=JavaScript`, {
        headers: { 'x-user-id': testUser.id }
      })

      expect(response.showcases).toHaveLength(1)
      expect(response.showcases[0].skillsUsed).toContain('JavaScript')
    })

    it('should search by text', async () => {
      const response = await $fetch(`/api/events/${testEvent.id}/showcases?search=First`, {
        headers: { 'x-user-id': testUser.id }
      })

      expect(response.showcases).toHaveLength(1)
      expect(response.showcases[0].description).toContain('First')
    })
  })

  describe('GET /api/events/[eventId]/showcases/[id]', () => {
    beforeEach(async () => {
      testShowcase = await prisma.workShowcase.create({
        data: {
          eventId: testEvent.id,
          projectName: 'Test Project',
          description: 'Test project description',
          status: 'ACTIVE',
          contributors: JSON.stringify([testUser.id])
        }
      })
    })

    it('should return a specific showcase', async () => {
      const response = await $fetch(`/api/events/${testEvent.id}/showcases/${testShowcase.id}`, {
        headers: { 'x-user-id': testUser.id }
      })

      expect(response.success).toBe(true)
      expect(response.showcase.id).toBe(testShowcase.id)
      expect(response.showcase.projectName).toBe('Test Project')
    })

    it('should return 404 for non-existent showcase', async () => {
      await expect(
        $fetch(`/api/events/${testEvent.id}/showcases/non-existent-id`, {
          headers: { 'x-user-id': testUser.id }
        })
      ).rejects.toThrow('Showcase not found')
    })
  })

  describe('PUT /api/events/[eventId]/showcases/[id]', () => {
    beforeEach(async () => {
      testShowcase = await prisma.workShowcase.create({
        data: {
          eventId: testEvent.id,
          projectName: 'Original Project',
          description: 'Original description',
          status: 'IDEATION',
          contributors: JSON.stringify([testUser.id])
        }
      })
    })

    it('should update a showcase successfully', async () => {
      const updateData = {
        projectName: 'Updated Project Name',
        status: 'ACTIVE',
        skillsUsed: ['New Skill']
      }

      const response = await $fetch(`/api/events/${testEvent.id}/showcases/${testShowcase.id}`, {
        method: 'PUT',
        body: updateData,
        headers: { 'x-user-id': testUser.id }
      })

      expect(response.success).toBe(true)
      expect(response.showcase.projectName).toBe(updateData.projectName)
      expect(response.showcase.status).toBe(updateData.status)
      expect(response.showcase.skillsUsed).toEqual(updateData.skillsUsed)
    })

    it('should perform partial updates', async () => {
      const updateData = {
        status: 'COMPLETED'
      }

      const response = await $fetch(`/api/events/${testEvent.id}/showcases/${testShowcase.id}`, {
        method: 'PUT',
        body: updateData,
        headers: { 'x-user-id': testUser.id }
      })

      expect(response.showcase.status).toBe('COMPLETED')
      expect(response.showcase.projectName).toBe('Original Project') // Should remain unchanged
    })

    it('should fail for non-members', async () => {
      const nonMember = await createTestUser({
        email: 'nonmember@example.com',
        name: 'Non Member'
      })

      await expect(
        $fetch(`/api/events/${testEvent.id}/showcases/${testShowcase.id}`, {
          method: 'PUT',
          body: { status: 'ACTIVE' },
          headers: { 'x-user-id': nonMember.id }
        })
      ).rejects.toThrow('You must be a member of this event')
    })
  })

  describe('DELETE /api/events/[eventId]/showcases/[id]', () => {
    beforeEach(async () => {
      testShowcase = await prisma.workShowcase.create({
        data: {
          eventId: testEvent.id,
          projectName: 'To Be Deleted',
          description: 'This will be deleted',
          status: 'IDEATION',
          contributors: JSON.stringify([testUser.id])
        }
      })
    })

    it('should delete a showcase successfully', async () => {
      const response = await $fetch(`/api/events/${testEvent.id}/showcases/${testShowcase.id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': testUser.id }
      })

      expect(response.success).toBe(true)
      expect(response.message).toContain('deleted successfully')

      // Verify it's actually deleted
      const deletedShowcase = await prisma.workShowcase.findUnique({
        where: { id: testShowcase.id }
      })
      expect(deletedShowcase).toBeNull()
    })

    it('should return 404 for non-existent showcase', async () => {
      await expect(
        $fetch(`/api/events/${testEvent.id}/showcases/non-existent-id`, {
          method: 'DELETE',
          headers: { 'x-user-id': testUser.id }
        })
      ).rejects.toThrow('Showcase not found')
    })
  })

  describe('POST /api/events/[eventId]/showcases/[id]/join', () => {
    let otherUser: any

    beforeEach(async () => {
      otherUser = await createTestUser({
        email: 'other@example.com',
        name: 'Other User'
      })

      // Add other user to event
      await prisma.eventMembership.create({
        data: {
          userId: otherUser.id,
          eventId: testEvent.id,
          role: 'PARTICIPANT'
        }
      })

      testShowcase = await prisma.workShowcase.create({
        data: {
          eventId: testEvent.id,
          projectName: 'Seeking Help Project',
          description: 'This project needs collaborators',
          status: 'SEEKING_COLLABORATORS',
          contributors: JSON.stringify([testUser.id])
        }
      })
    })

    it('should allow user to join a project', async () => {
      const response = await $fetch(`/api/events/${testEvent.id}/showcases/${testShowcase.id}/join`, {
        method: 'POST',
        body: {
          message: 'I would like to help!',
          skills: ['JavaScript', 'Design']
        },
        headers: { 'x-user-id': otherUser.id }
      })

      expect(response.success).toBe(true)
      expect(response.message).toContain('joined')
      expect(response.showcase.contributors).toContain(otherUser.id)
    })

    it('should fail if project is not seeking collaborators', async () => {
      await prisma.workShowcase.update({
        where: { id: testShowcase.id },
        data: { status: 'COMPLETED' }
      })

      await expect(
        $fetch(`/api/events/${testEvent.id}/showcases/${testShowcase.id}/join`, {
          method: 'POST',
          body: {},
          headers: { 'x-user-id': otherUser.id }
        })
      ).rejects.toThrow('not currently seeking collaborators')
    })

    it('should fail if user is already a contributor', async () => {
      await expect(
        $fetch(`/api/events/${testEvent.id}/showcases/${testShowcase.id}/join`, {
          method: 'POST',
          body: {},
          headers: { 'x-user-id': testUser.id }
        })
      ).rejects.toThrow('already a contributor')
    })

    it('should fail for non-members', async () => {
      const nonMember = await createTestUser({
        email: 'nonmember@example.com',
        name: 'Non Member'
      })

      await expect(
        $fetch(`/api/events/${testEvent.id}/showcases/${testShowcase.id}/join`, {
          method: 'POST',
          body: {},
          headers: { 'x-user-id': nonMember.id }
        })
      ).rejects.toThrow('You must be a member of this event')
    })
  })

  describe('Admin endpoints', () => {
    let adminUser: any

    beforeEach(async () => {
      adminUser = await createTestUser({
        email: 'admin@example.com',
        name: 'Admin User'
      })

      // Make user an organizer
      await prisma.eventMembership.create({
        data: {
          userId: adminUser.id,
          eventId: testEvent.id,
          role: 'ORGANIZER'
        }
      })

      // Create test showcases
      await prisma.workShowcase.createMany({
        data: [
          {
            eventId: testEvent.id,
            projectName: 'Admin Test 1',
            description: 'First admin test',
            status: 'ACTIVE',
            contributors: JSON.stringify([testUser.id])
          },
          {
            eventId: testEvent.id,
            projectName: 'Admin Test 2',
            description: 'Second admin test',
            status: 'COMPLETED',
            contributors: JSON.stringify([testUser.id])
          }
        ]
      })
    })

    describe('GET /api/admin/events/[eventId]/showcases/stats', () => {
      it('should return showcase statistics', async () => {
        const response = await $fetch(`/api/admin/events/${testEvent.id}/showcases/stats`, {
          headers: { 'x-user-id': adminUser.id }
        })

        expect(response.success).toBe(true)
        expect(response.stats).toHaveProperty('total')
        expect(response.stats).toHaveProperty('byStatus')
        expect(response.stats.total).toBe(2)
        expect(response.stats.byStatus.ACTIVE).toBe(1)
        expect(response.stats.byStatus.COMPLETED).toBe(1)
      })

      it('should fail for non-organizers', async () => {
        await expect(
          $fetch(`/api/admin/events/${testEvent.id}/showcases/stats`, {
            headers: { 'x-user-id': testUser.id }
          })
        ).rejects.toThrow('You must be an organizer or moderator')
      })
    })

    describe('POST /api/admin/events/[eventId]/showcases/moderate', () => {
      it('should moderate showcases successfully', async () => {
        const showcases = await prisma.workShowcase.findMany({
          where: { eventId: testEvent.id }
        })

        const response = await $fetch(`/api/admin/events/${testEvent.id}/showcases/moderate`, {
          method: 'POST',
          body: {
            showcaseIds: [showcases[0].id],
            action: 'delete',
            reason: 'Test deletion'
          },
          headers: { 'x-user-id': adminUser.id }
        })

        expect(response.success).toBe(true)
        expect(response.results[0].success).toBe(true)
        expect(response.results[0].action).toBe('deleted')

        // Verify deletion
        const deletedShowcase = await prisma.workShowcase.findUnique({
          where: { id: showcases[0].id }
        })
        expect(deletedShowcase).toBeNull()
      })

      it('should fail for non-organizers', async () => {
        const showcases = await prisma.workShowcase.findMany({
          where: { eventId: testEvent.id }
        })

        await expect(
          $fetch(`/api/admin/events/${testEvent.id}/showcases/moderate`, {
            method: 'POST',
            body: {
              showcaseIds: [showcases[0].id],
              action: 'delete'
            },
            headers: { 'x-user-id': testUser.id }
          })
        ).rejects.toThrow('You must be an organizer or moderator')
      })
    })
  })
})
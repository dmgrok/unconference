import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@prisma/client'
import {
  createTestUser,
  createTestEvent,
  createEventMembership,
  cleanupTestData,
  seedTestDatabase,
  validateShowcaseResponse,
  createSampleShowcaseData
} from '../helpers/test-utils'

const prisma = new PrismaClient()

describe('WorkShowcase Integration Tests', () => {
  let testData: any

  beforeAll(async () => {
    // Set up test database with comprehensive data
    testData = await seedTestDatabase(prisma)
  })

  afterAll(async () => {
    await cleanupTestData(prisma)
  })

  describe('Complete Showcase Lifecycle', () => {
    it('should support full CRUD lifecycle', async () => {
      const { users, event } = testData
      const user = users[1] // Participant

      // 1. Create showcase
      const showcaseData = createSampleShowcaseData({
        projectName: 'Lifecycle Test Project',
        status: 'IDEATION'
      })

      const createResponse = await $fetch(`/api/events/${event.id}/showcases`, {
        method: 'POST',
        body: showcaseData,
        headers: { 'x-user-id': user.id }
      })

      expect(createResponse.success).toBe(true)
      validateShowcaseResponse(createResponse.showcase)
      const showcaseId = createResponse.showcase.id

      // 2. Read the created showcase
      const getResponse = await $fetch(`/api/events/${event.id}/showcases/${showcaseId}`, {
        headers: { 'x-user-id': user.id }
      })

      expect(getResponse.success).toBe(true)
      expect(getResponse.showcase.projectName).toBe(showcaseData.projectName)
      expect(getResponse.showcase.status).toBe(showcaseData.status)

      // 3. Update showcase to seeking collaborators
      const updateResponse = await $fetch(`/api/events/${event.id}/showcases/${showcaseId}`, {
        method: 'PUT',
        body: {
          status: 'SEEKING_COLLABORATORS',
          skillsNeeded: ['React', 'Node.js', 'MongoDB']
        },
        headers: { 'x-user-id': user.id }
      })

      expect(updateResponse.success).toBe(true)
      expect(updateResponse.showcase.status).toBe('SEEKING_COLLABORATORS')
      expect(updateResponse.showcase.skillsNeeded).toEqual(['React', 'Node.js', 'MongoDB'])

      // 4. Another user joins the project
      const joinResponse = await $fetch(`/api/events/${event.id}/showcases/${showcaseId}/join`, {
        method: 'POST',
        body: {
          message: 'I have experience with React and Node.js!',
          skills: ['React', 'Node.js']
        },
        headers: { 'x-user-id': users[2].id }
      })

      expect(joinResponse.success).toBe(true)
      expect(joinResponse.showcase.contributors).toContain(users[2].id)

      // 5. Update project to active status
      const activateResponse = await $fetch(`/api/events/${event.id}/showcases/${showcaseId}`, {
        method: 'PUT',
        body: {
          status: 'ACTIVE',
          repositoryUrl: 'https://github.com/team/project',
          demoUrl: 'https://demo.team-project.com'
        },
        headers: { 'x-user-id': user.id }
      })

      expect(activateResponse.success).toBe(true)
      expect(activateResponse.showcase.status).toBe('ACTIVE')

      // 6. Complete the project
      const completeResponse = await $fetch(`/api/events/${event.id}/showcases/${showcaseId}`, {
        method: 'PUT',
        body: { status: 'COMPLETED' },
        headers: { 'x-user-id': user.id }
      })

      expect(completeResponse.success).toBe(true)
      expect(completeResponse.showcase.status).toBe('COMPLETED')

      // 7. Clean up - delete showcase
      const deleteResponse = await $fetch(`/api/events/${event.id}/showcases/${showcaseId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': user.id }
      })

      expect(deleteResponse.success).toBe(true)

      // Verify deletion
      await expect(
        $fetch(`/api/events/${event.id}/showcases/${showcaseId}`, {
          headers: { 'x-user-id': user.id }
        })
      ).rejects.toThrow()
    })
  })

  describe('Advanced Filtering and Search', () => {
    it('should handle complex filtering scenarios', async () => {
      const { event, users } = testData

      // Get all showcases without filters
      const allResponse = await $fetch(`/api/events/${event.id}/showcases`, {
        headers: { 'x-user-id': users[0].id }
      })

      expect(allResponse.success).toBe(true)
      expect(allResponse.showcases.length).toBeGreaterThan(0)

      // Filter by status
      const activeResponse = await $fetch(`/api/events/${event.id}/showcases?status=ACTIVE`, {
        headers: { 'x-user-id': users[0].id }
      })

      expect(activeResponse.success).toBe(true)
      activeResponse.showcases.forEach((showcase: any) => {
        expect(showcase.status).toBe('ACTIVE')
      })

      // Search by text
      const searchResponse = await $fetch(`/api/events/${event.id}/showcases?search=Dashboard`, {
        headers: { 'x-user-id': users[0].id }
      })

      expect(searchResponse.success).toBe(true)
      searchResponse.showcases.forEach((showcase: any) => {
        const matchesSearch =
          showcase.projectName.toLowerCase().includes('dashboard') ||
          showcase.description.toLowerCase().includes('dashboard')
        expect(matchesSearch).toBe(true)
      })

      // Filter by skills
      const skillsResponse = await $fetch(`/api/events/${event.id}/showcases?skillsUsed=React`, {
        headers: { 'x-user-id': users[0].id }
      })

      expect(skillsResponse.success).toBe(true)
      skillsResponse.showcases.forEach((showcase: any) => {
        const hasReact = showcase.skillsUsed.some((skill: string) =>
          skill.toLowerCase().includes('react')
        )
        expect(hasReact).toBe(true)
      })

      // Combine multiple filters
      const combinedResponse = await $fetch(
        `/api/events/${event.id}/showcases?status=SEEKING_COLLABORATORS&skillsNeeded=React`,
        { headers: { 'x-user-id': users[0].id } }
      )

      expect(combinedResponse.success).toBe(true)
      combinedResponse.showcases.forEach((showcase: any) => {
        expect(showcase.status).toBe('SEEKING_COLLABORATORS')
        const needsReact = showcase.skillsNeeded.some((skill: string) =>
          skill.toLowerCase().includes('react')
        )
        expect(needsReact).toBe(true)
      })
    })
  })

  describe('Collaboration Workflow', () => {
    it('should support realistic collaboration scenarios', async () => {
      const { users, event } = testData

      // Project creator creates a project seeking help
      const projectData = createSampleShowcaseData({
        projectName: 'Open Source Analytics Tool',
        status: 'SEEKING_COLLABORATORS',
        skillsUsed: ['Python', 'Flask'],
        skillsNeeded: ['React', 'UI/UX Design', 'DevOps']
      })

      const createResponse = await $fetch(`/api/events/${event.id}/showcases`, {
        method: 'POST',
        body: projectData,
        headers: { 'x-user-id': users[0].id }
      })

      const showcaseId = createResponse.showcase.id

      // Multiple users express interest by joining
      const collaborators = [users[1], users[2]]

      for (const collaborator of collaborators) {
        const joinResponse = await $fetch(`/api/events/${event.id}/showcases/${showcaseId}/join`, {
          method: 'POST',
          body: {
            message: `I'd love to contribute with my ${collaborator.skills} skills!`,
            skills: collaborator.skills?.split(', ') || []
          },
          headers: { 'x-user-id': collaborator.id }
        })

        expect(joinResponse.success).toBe(true)
        expect(joinResponse.showcase.contributors).toContain(collaborator.id)
      }

      // Verify final state
      const finalResponse = await $fetch(`/api/events/${event.id}/showcases/${showcaseId}`, {
        headers: { 'x-user-id': users[0].id }
      })

      expect(finalResponse.showcase.contributors).toHaveLength(3) // Original creator + 2 collaborators
      collaborators.forEach(collaborator => {
        expect(finalResponse.showcase.contributors).toContain(collaborator.id)
      })
    })

    it('should prevent duplicate collaborations', async () => {
      const { users, event, showcases } = testData
      const seekingShowcase = showcases.find((s: any) => s.status === 'SEEKING_COLLABORATORS')

      if (!seekingShowcase) {
        // Create one if needed
        const createResponse = await $fetch(`/api/events/${event.id}/showcases`, {
          method: 'POST',
          body: createSampleShowcaseData({ status: 'SEEKING_COLLABORATORS' }),
          headers: { 'x-user-id': users[0].id }
        })
        seekingShowcase = createResponse.showcase
      }

      // User joins successfully first time
      const firstJoinResponse = await $fetch(`/api/events/${event.id}/showcases/${seekingShowcase.id}/join`, {
        method: 'POST',
        body: {},
        headers: { 'x-user-id': users[1].id }
      })

      expect(firstJoinResponse.success).toBe(true)

      // Second attempt should fail
      await expect(
        $fetch(`/api/events/${event.id}/showcases/${seekingShowcase.id}/join`, {
          method: 'POST',
          body: {},
          headers: { 'x-user-id': users[1].id }
        })
      ).rejects.toThrow('already a contributor')
    })
  })

  describe('Admin Functionality', () => {
    it('should provide comprehensive admin statistics', async () => {
      const { users, event } = testData
      const organizer = users[0] // First user is organizer

      const statsResponse = await $fetch(`/api/admin/events/${event.id}/showcases/stats`, {
        headers: { 'x-user-id': organizer.id }
      })

      expect(statsResponse.success).toBe(true)
      expect(statsResponse.stats).toHaveProperty('total')
      expect(statsResponse.stats).toHaveProperty('byStatus')
      expect(statsResponse.stats).toHaveProperty('topSkills')
      expect(statsResponse.stats).toHaveProperty('topTags')
      expect(statsResponse.stats).toHaveProperty('collaborationStats')
      expect(statsResponse.stats).toHaveProperty('timeline')

      // Validate structure
      expect(statsResponse.stats.byStatus).toHaveProperty('IDEATION')
      expect(statsResponse.stats.byStatus).toHaveProperty('ACTIVE')
      expect(statsResponse.stats.byStatus).toHaveProperty('COMPLETED')
      expect(statsResponse.stats.byStatus).toHaveProperty('SEEKING_COLLABORATORS')

      expect(Array.isArray(statsResponse.stats.topSkills)).toBe(true)
      expect(Array.isArray(statsResponse.stats.topTags)).toBe(true)

      expect(statsResponse.stats.collaborationStats).toHaveProperty('totalContributors')
      expect(statsResponse.stats.collaborationStats).toHaveProperty('averageContributorsPerProject')
      expect(statsResponse.stats.collaborationStats).toHaveProperty('projectsSeekingHelp')
    })

    it('should support bulk moderation actions', async () => {
      const { users, event, showcases } = testData
      const organizer = users[0]

      // Get current showcases to moderate
      const showcaseIds = showcases.slice(0, 2).map((s: any) => s.id)

      // Test deletion action
      const moderateResponse = await $fetch(`/api/admin/events/${event.id}/showcases/moderate`, {
        method: 'POST',
        body: {
          showcaseIds,
          action: 'delete',
          reason: 'Integration test cleanup'
        },
        headers: { 'x-user-id': organizer.id }
      })

      expect(moderateResponse.success).toBe(true)
      expect(moderateResponse.results).toHaveLength(2)

      moderateResponse.results.forEach((result: any) => {
        expect(result.success).toBe(true)
        expect(result.action).toBe('deleted')
        expect(showcaseIds).toContain(result.showcaseId)
      })

      // Verify showcases were actually deleted
      for (const showcaseId of showcaseIds) {
        await expect(
          $fetch(`/api/events/${event.id}/showcases/${showcaseId}`, {
            headers: { 'x-user-id': users[1].id }
          })
        ).rejects.toThrow()
      }
    })

    it('should restrict admin actions to authorized users', async () => {
      const { users, event } = testData
      const regularUser = users[1] // Not an organizer

      // Regular user should not be able to view admin stats
      await expect(
        $fetch(`/api/admin/events/${event.id}/showcases/stats`, {
          headers: { 'x-user-id': regularUser.id }
        })
      ).rejects.toThrow('You must be an organizer or moderator')

      // Regular user should not be able to moderate
      await expect(
        $fetch(`/api/admin/events/${event.id}/showcases/moderate`, {
          method: 'POST',
          body: {
            showcaseIds: ['any-id'],
            action: 'delete'
          },
          headers: { 'x-user-id': regularUser.id }
        })
      ).rejects.toThrow('You must be an organizer or moderator')
    })
  })

  describe('Performance and Scale', () => {
    it('should handle reasonable loads efficiently', async () => {
      const { users, event } = testData

      // Create multiple showcases rapidly
      const createPromises = Array.from({ length: 10 }, (_, i) =>
        $fetch(`/api/events/${event.id}/showcases`, {
          method: 'POST',
          body: createSampleShowcaseData({
            projectName: `Performance Test Project ${i}`,
            description: `Performance test description ${i} with sufficient length to meet minimum requirements`
          }),
          headers: { 'x-user-id': users[1].id }
        })
      )

      const startTime = Date.now()
      const results = await Promise.all(createPromises)
      const duration = Date.now() - startTime

      // All should succeed
      results.forEach(result => {
        expect(result.success).toBe(true)
      })

      // Should complete within reasonable time (adjust based on expectations)
      expect(duration).toBeLessThan(10000) // 10 seconds for 10 creations

      // Test batch retrieval performance
      const retrievalStart = Date.now()
      const listResponse = await $fetch(`/api/events/${event.id}/showcases`, {
        headers: { 'x-user-id': users[0].id }
      })
      const retrievalDuration = Date.now() - retrievalStart

      expect(listResponse.success).toBe(true)
      expect(listResponse.showcases.length).toBeGreaterThanOrEqual(10)
      expect(retrievalDuration).toBeLessThan(2000) // 2 seconds for retrieval
    })
  })

  describe('Error Handling', () => {
    it('should gracefully handle various error conditions', async () => {
      const { users, event } = testData

      // Test invalid event ID
      await expect(
        $fetch(`/api/events/invalid-event-id/showcases`, {
          headers: { 'x-user-id': users[0].id }
        })
      ).rejects.toThrow()

      // Test invalid showcase ID
      await expect(
        $fetch(`/api/events/${event.id}/showcases/invalid-showcase-id`, {
          headers: { 'x-user-id': users[0].id }
        })
      ).rejects.toThrow()

      // Test invalid data in creation
      await expect(
        $fetch(`/api/events/${event.id}/showcases`, {
          method: 'POST',
          body: {
            projectName: '', // Invalid: empty name
            description: 'x' // Invalid: too short
          },
          headers: { 'x-user-id': users[0].id }
        })
      ).rejects.toThrow()

      // Test unauthorized operations
      const nonMember = await createTestUser(prisma, {
        email: 'nonmember-integration@test.com',
        name: 'Non Member'
      })

      await expect(
        $fetch(`/api/events/${event.id}/showcases`, {
          method: 'POST',
          body: createSampleShowcaseData(),
          headers: { 'x-user-id': nonMember.id }
        })
      ).rejects.toThrow()
    })
  })

  describe('Data Consistency', () => {
    it('should maintain data integrity across operations', async () => {
      const { users, event } = testData

      // Create showcase with specific data
      const originalData = createSampleShowcaseData({
        projectName: 'Integrity Test Project',
        skillsUsed: ['Original', 'Skills'],
        contributors: []
      })

      const createResponse = await $fetch(`/api/events/${event.id}/showcases`, {
        method: 'POST',
        body: originalData,
        headers: { 'x-user-id': users[1].id }
      })

      const showcaseId = createResponse.showcase.id

      // Perform multiple updates
      await $fetch(`/api/events/${event.id}/showcases/${showcaseId}`, {
        method: 'PUT',
        body: { status: 'ACTIVE' },
        headers: { 'x-user-id': users[1].id }
      })

      await $fetch(`/api/events/${event.id}/showcases/${showcaseId}`, {
        method: 'PUT',
        body: { skillsUsed: ['Updated', 'Skills', 'List'] },
        headers: { 'x-user-id': users[1].id }
      })

      // Verify final state maintains consistency
      const finalResponse = await $fetch(`/api/events/${event.id}/showcases/${showcaseId}`, {
        headers: { 'x-user-id': users[1].id }
      })

      expect(finalResponse.showcase.projectName).toBe(originalData.projectName) // Unchanged
      expect(finalResponse.showcase.status).toBe('ACTIVE') // Changed
      expect(finalResponse.showcase.skillsUsed).toEqual(['Updated', 'Skills', 'List']) // Changed
      expect(finalResponse.showcase.description).toBe(originalData.description) // Unchanged

      // Verify timestamps are updated appropriately
      expect(new Date(finalResponse.showcase.updatedAt).getTime())
        .toBeGreaterThan(new Date(finalResponse.showcase.createdAt).getTime())
    })
  })
})
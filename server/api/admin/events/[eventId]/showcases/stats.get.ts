import { PrismaClient } from '@prisma/client'
import logger from '~/utils/logger'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    const eventId = getRouterParam(event, 'eventId')

    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    // Check if user is an admin/organizer of the event
    const eventMembership = await prisma.eventMembership.findFirst({
      where: {
        eventId,
        userId: user.id,
        role: { in: ['ORGANIZER', 'MODERATOR'] }
      }
    })

    if (!eventMembership && user.globalRole !== 'SUPER_ADMIN') {
      throw createError({
        statusCode: 403,
        statusMessage: 'You must be an organizer or moderator to view showcase statistics'
      })
    }

    // Get all showcases for the event
    const showcases = await prisma.workShowcase.findMany({
      where: { eventId },
      select: {
        id: true,
        projectName: true,
        status: true,
        skillsUsed: true,
        skillsNeeded: true,
        contributors: true,
        tags: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Calculate statistics
    const stats = {
      total: showcases.length,
      byStatus: {
        IDEATION: 0,
        ACTIVE: 0,
        COMPLETED: 0,
        SEEKING_COLLABORATORS: 0
      },
      topSkills: new Map<string, number>(),
      topTags: new Map<string, number>(),
      collaborationStats: {
        totalContributors: 0,
        averageContributorsPerProject: 0,
        projectsSeekingHelp: 0
      },
      timeline: {
        projectsThisWeek: 0,
        projectsThisMonth: 0,
        completedProjects: 0
      }
    }

    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    let totalContributorCount = 0

    showcases.forEach(showcase => {
      // Status counts
      stats.byStatus[showcase.status]++

      // Timeline stats
      const createdDate = new Date(showcase.createdAt)
      if (createdDate >= oneWeekAgo) {
        stats.timeline.projectsThisWeek++
      }
      if (createdDate >= oneMonthAgo) {
        stats.timeline.projectsThisMonth++
      }
      if (showcase.status === 'COMPLETED') {
        stats.timeline.completedProjects++
      }

      // Skills analysis
      if (showcase.skillsUsed) {
        const skills = JSON.parse(showcase.skillsUsed)
        skills.forEach((skill: string) => {
          stats.topSkills.set(skill, (stats.topSkills.get(skill) || 0) + 1)
        })
      }

      if (showcase.skillsNeeded) {
        const skills = JSON.parse(showcase.skillsNeeded)
        skills.forEach((skill: string) => {
          stats.topSkills.set(skill, (stats.topSkills.get(skill) || 0) + 1)
        })
      }

      // Tags analysis
      if (showcase.tags) {
        const tags = JSON.parse(showcase.tags)
        tags.forEach((tag: string) => {
          stats.topTags.set(tag, (stats.topTags.get(tag) || 0) + 1)
        })
      }

      // Collaboration stats
      if (showcase.contributors) {
        const contributors = JSON.parse(showcase.contributors)
        totalContributorCount += contributors.length
      }

      if (showcase.status === 'SEEKING_COLLABORATORS') {
        stats.collaborationStats.projectsSeekingHelp++
      }
    })

    // Finalize collaboration stats
    stats.collaborationStats.totalContributors = totalContributorCount
    stats.collaborationStats.averageContributorsPerProject =
      stats.total > 0 ? Math.round((totalContributorCount / stats.total) * 10) / 10 : 0

    // Convert Maps to sorted arrays for frontend consumption
    const topSkillsArray = Array.from(stats.topSkills.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }))

    const topTagsArray = Array.from(stats.topTags.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }))

    const finalStats = {
      ...stats,
      topSkills: topSkillsArray,
      topTags: topTagsArray
    }

    logger.info(`Generated showcase stats for event ${eventId}`)

    return {
      success: true,
      stats: finalStats
    }

  } catch (error) {
    logger.error('Error generating showcase stats:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate showcase statistics'
    })
  }
})
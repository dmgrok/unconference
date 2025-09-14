import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import logger from '~/utils/logger'

const prisma = new PrismaClient()

const querySchema = z.object({
  status: z.enum(['IDEATION', 'ACTIVE', 'COMPLETED', 'SEEKING_COLLABORATORS']).optional(),
  skillsUsed: z.string().optional(),
  skillsNeeded: z.string().optional(),
  tags: z.string().optional(),
  search: z.string().optional()
})

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    const eventId = getRouterParam(event, 'eventId')
    const query = getQuery(event)

    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    // Validate query parameters
    const { status, skillsUsed, skillsNeeded, tags, search } = querySchema.parse(query)

    // Build where clause for filtering
    const where: any = {
      eventId
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { projectName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    // For skill/tag filtering, we'll do it post-query since they're stored as JSON strings
    const showcases = await prisma.workShowcase.findMany({
      where,
      orderBy: [
        { status: 'asc' }, // Show SEEKING_COLLABORATORS first
        { updatedAt: 'desc' }
      ]
    })

    // Apply additional filters on JSON fields
    let filteredShowcases = showcases

    if (skillsUsed) {
      const targetSkills = skillsUsed.split(',').map(s => s.trim().toLowerCase())
      filteredShowcases = filteredShowcases.filter(showcase => {
        if (!showcase.skillsUsed) return false
        const skills = JSON.parse(showcase.skillsUsed).map((s: string) => s.toLowerCase())
        return targetSkills.some(target => skills.includes(target))
      })
    }

    if (skillsNeeded) {
      const targetSkills = skillsNeeded.split(',').map(s => s.trim().toLowerCase())
      filteredShowcases = filteredShowcases.filter(showcase => {
        if (!showcase.skillsNeeded) return false
        const skills = JSON.parse(showcase.skillsNeeded).map((s: string) => s.toLowerCase())
        return targetSkills.some(target => skills.includes(target))
      })
    }

    if (tags) {
      const targetTags = tags.split(',').map(t => t.trim().toLowerCase())
      filteredShowcases = filteredShowcases.filter(showcase => {
        if (!showcase.tags) return false
        const showcaseTags = JSON.parse(showcase.tags).map((t: string) => t.toLowerCase())
        return targetTags.some(target => showcaseTags.includes(target))
      })
    }

    // Transform the data to match component expectations
    const transformedShowcases = filteredShowcases.map(showcase => ({
      ...showcase,
      contributors: showcase.contributors ? JSON.parse(showcase.contributors) : [],
      skillsUsed: showcase.skillsUsed ? JSON.parse(showcase.skillsUsed) : [],
      skillsNeeded: showcase.skillsNeeded ? JSON.parse(showcase.skillsNeeded) : [],
      images: showcase.images ? JSON.parse(showcase.images) : [],
      tags: showcase.tags ? JSON.parse(showcase.tags) : []
    }))

    logger.info(`Retrieved ${transformedShowcases.length} showcases for event ${eventId}`)

    return {
      success: true,
      showcases: transformedShowcases
    }

  } catch (error) {
    logger.error('Error fetching showcases:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch showcases'
    })
  }
})
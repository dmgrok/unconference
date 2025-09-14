import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import logger from '~/utils/logger'

const prisma = new PrismaClient()

const joinRequestSchema = z.object({
  message: z.string().max(500).optional(),
  skills: z.array(z.string()).optional().default([])
})

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    const eventId = getRouterParam(event, 'eventId')
    const showcaseId = getRouterParam(event, 'id')
    const body = await readBody(event)

    if (!eventId || !showcaseId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID and Showcase ID are required'
      })
    }

    // Validate input
    const { message, skills } = joinRequestSchema.parse(body)

    // Check if showcase exists and is seeking collaborators
    const showcase = await prisma.workShowcase.findFirst({
      where: {
        id: showcaseId,
        eventId
      }
    })

    if (!showcase) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Showcase not found'
      })
    }

    if (showcase.status !== 'SEEKING_COLLABORATORS') {
      throw createError({
        statusCode: 400,
        statusMessage: 'This project is not currently seeking collaborators'
      })
    }

    // Check if user is already a contributor
    const contributors = JSON.parse(showcase.contributors || '[]')
    if (contributors.includes(user.id)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'You are already a contributor to this project'
      })
    }

    // Check if user is a member of the event
    const eventMembership = await prisma.eventMembership.findFirst({
      where: {
        eventId,
        userId: user.id
      }
    })

    if (!eventMembership) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You must be a member of this event to join projects'
      })
    }

    // For now, we'll automatically add the user as a contributor
    // In a more complex system, this could create a join request that needs approval
    const updatedContributors = [...contributors, user.id]

    // Update the showcase with the new contributor
    const updatedShowcase = await prisma.workShowcase.update({
      where: { id: showcaseId },
      data: {
        contributors: JSON.stringify(updatedContributors),
        updatedAt: new Date()
      }
    })

    // Log the join event
    logger.info(`User ${user.id} joined showcase ${showcaseId} in event ${eventId}`)

    // Transform response
    const transformedShowcase = {
      ...updatedShowcase,
      contributors: JSON.parse(updatedShowcase.contributors || '[]'),
      skillsUsed: JSON.parse(updatedShowcase.skillsUsed || '[]'),
      skillsNeeded: JSON.parse(updatedShowcase.skillsNeeded || '[]'),
      images: JSON.parse(updatedShowcase.images || '[]'),
      tags: JSON.parse(updatedShowcase.tags || '[]')
    }

    return {
      success: true,
      message: 'Successfully joined the project!',
      showcase: transformedShowcase
    }

  } catch (error) {
    logger.error('Error joining showcase:', error)

    if (error.statusCode) {
      throw error
    }

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid data provided',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to join showcase'
    })
  }
})
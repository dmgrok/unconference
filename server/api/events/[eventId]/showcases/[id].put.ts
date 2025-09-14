import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import logger from '~/utils/logger'

const prisma = new PrismaClient()

const updateShowcaseSchema = z.object({
  projectName: z.string().min(1, 'Project name is required').max(100).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000).optional(),
  contributors: z.array(z.string()).optional(),
  skillsUsed: z.array(z.string()).optional(),
  skillsNeeded: z.array(z.string()).optional(),
  status: z.enum(['IDEATION', 'ACTIVE', 'COMPLETED', 'SEEKING_COLLABORATORS']).optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  repositoryUrl: z.string().url().optional().or(z.literal('')),
  demoUrl: z.string().url().optional().or(z.literal('')),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional()
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

    // Check if showcase exists and user has permission
    const existingShowcase = await prisma.workShowcase.findFirst({
      where: {
        id: showcaseId,
        eventId
      }
    })

    if (!existingShowcase) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Showcase not found'
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
        statusMessage: 'You must be a member of this event to update showcases'
      })
    }

    // Validate input data
    const validatedData = updateShowcaseSchema.parse(body)

    // Prepare update data - only include fields that were provided
    const updateData: any = {}

    if (validatedData.projectName !== undefined) {
      updateData.projectName = validatedData.projectName
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description
    }
    if (validatedData.contributors !== undefined) {
      updateData.contributors = JSON.stringify(validatedData.contributors)
    }
    if (validatedData.skillsUsed !== undefined) {
      updateData.skillsUsed = JSON.stringify(validatedData.skillsUsed)
    }
    if (validatedData.skillsNeeded !== undefined) {
      updateData.skillsNeeded = JSON.stringify(validatedData.skillsNeeded)
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
    }
    if (validatedData.contactEmail !== undefined) {
      updateData.contactEmail = validatedData.contactEmail || null
    }
    if (validatedData.repositoryUrl !== undefined) {
      updateData.repositoryUrl = validatedData.repositoryUrl || null
    }
    if (validatedData.demoUrl !== undefined) {
      updateData.demoUrl = validatedData.demoUrl || null
    }
    if (validatedData.images !== undefined) {
      updateData.images = JSON.stringify(validatedData.images)
    }
    if (validatedData.tags !== undefined) {
      updateData.tags = JSON.stringify(validatedData.tags)
    }

    // Always update the updatedAt timestamp
    updateData.updatedAt = new Date()

    // Update the showcase
    const updatedShowcase = await prisma.workShowcase.update({
      where: { id: showcaseId },
      data: updateData
    })

    // Transform response to match component expectations
    const transformedShowcase = {
      ...updatedShowcase,
      contributors: JSON.parse(updatedShowcase.contributors || '[]'),
      skillsUsed: JSON.parse(updatedShowcase.skillsUsed || '[]'),
      skillsNeeded: JSON.parse(updatedShowcase.skillsNeeded || '[]'),
      images: JSON.parse(updatedShowcase.images || '[]'),
      tags: JSON.parse(updatedShowcase.tags || '[]')
    }

    logger.info(`Updated showcase ${showcaseId} for event ${eventId} by user ${user.id}`)

    return {
      success: true,
      showcase: transformedShowcase
    }

  } catch (error) {
    logger.error('Error updating showcase:', error)

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

    if (error.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Showcase not found'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update showcase'
    })
  }
})
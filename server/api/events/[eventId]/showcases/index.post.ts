import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import logger from '~/utils/logger'

const prisma = new PrismaClient()

const createShowcaseSchema = z.object({
  projectName: z.string().min(1, 'Project name is required').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  contributors: z.array(z.string()).optional().default([]),
  skillsUsed: z.array(z.string()).optional().default([]),
  skillsNeeded: z.array(z.string()).optional().default([]),
  status: z.enum(['IDEATION', 'ACTIVE', 'COMPLETED', 'SEEKING_COLLABORATORS']).default('IDEATION'),
  contactEmail: z.string().email().optional(),
  repositoryUrl: z.string().url().optional().or(z.literal('')),
  demoUrl: z.string().url().optional().or(z.literal('')),
  images: z.array(z.string().url()).optional().default([]),
  tags: z.array(z.string()).optional().default([])
})

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    const eventId = getRouterParam(event, 'eventId')
    const body = await readBody(event)

    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    // Verify user is part of the event
    const eventMembership = await prisma.eventMembership.findFirst({
      where: {
        eventId,
        userId: user.id
      }
    })

    if (!eventMembership) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You must be a member of this event to create showcases'
      })
    }

    // Validate input data
    const validatedData = createShowcaseSchema.parse(body)

    // Clean up empty URL fields
    const cleanData = {
      ...validatedData,
      repositoryUrl: validatedData.repositoryUrl || null,
      demoUrl: validatedData.demoUrl || null,
      contactEmail: validatedData.contactEmail || null
    }

    // Create new showcase
    const newShowcase = await prisma.workShowcase.create({
      data: {
        eventId,
        projectName: cleanData.projectName,
        description: cleanData.description,
        contributors: JSON.stringify(cleanData.contributors),
        skillsUsed: JSON.stringify(cleanData.skillsUsed),
        skillsNeeded: JSON.stringify(cleanData.skillsNeeded),
        status: cleanData.status,
        contactEmail: cleanData.contactEmail,
        repositoryUrl: cleanData.repositoryUrl,
        demoUrl: cleanData.demoUrl,
        images: JSON.stringify(cleanData.images),
        tags: JSON.stringify(cleanData.tags)
      }
    })

    // Transform response to match component expectations
    const transformedShowcase = {
      ...newShowcase,
      contributors: JSON.parse(newShowcase.contributors || '[]'),
      skillsUsed: JSON.parse(newShowcase.skillsUsed || '[]'),
      skillsNeeded: JSON.parse(newShowcase.skillsNeeded || '[]'),
      images: JSON.parse(newShowcase.images || '[]'),
      tags: JSON.parse(newShowcase.tags || '[]')
    }

    logger.info(`Created showcase "${newShowcase.projectName}" for event ${eventId} by user ${user.id}`)

    return {
      success: true,
      showcase: transformedShowcase
    }

  } catch (error) {
    logger.error('Error creating showcase:', error)

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

    if (error.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'A showcase with this name already exists for this event'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create showcase'
    })
  }
})
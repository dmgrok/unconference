import { PrismaClient } from '@prisma/client'
import logger from '~/utils/logger'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    const eventId = getRouterParam(event, 'eventId')
    const showcaseId = getRouterParam(event, 'id')

    if (!eventId || !showcaseId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID and Showcase ID are required'
      })
    }

    // Get the showcase
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

    // Transform response to match component expectations
    const transformedShowcase = {
      ...showcase,
      contributors: JSON.parse(showcase.contributors || '[]'),
      skillsUsed: JSON.parse(showcase.skillsUsed || '[]'),
      skillsNeeded: JSON.parse(showcase.skillsNeeded || '[]'),
      images: JSON.parse(showcase.images || '[]'),
      tags: JSON.parse(showcase.tags || '[]')
    }

    logger.info(`Retrieved showcase ${showcaseId} for event ${eventId}`)

    return {
      success: true,
      showcase: transformedShowcase
    }

  } catch (error) {
    logger.error('Error fetching showcase:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch showcase'
    })
  }
})
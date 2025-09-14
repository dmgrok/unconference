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

    // Check if showcase exists
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

    // Check if user has permission to delete
    // User can delete if they are a member of the event
    // Additional permission checks can be added here (e.g., only creators or organizers)
    const eventMembership = await prisma.eventMembership.findFirst({
      where: {
        eventId,
        userId: user.id
      }
    })

    if (!eventMembership) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You must be a member of this event to delete showcases'
      })
    }

    // Delete the showcase
    await prisma.workShowcase.delete({
      where: { id: showcaseId }
    })

    logger.info(`Deleted showcase ${showcaseId} from event ${eventId} by user ${user.id}`)

    return {
      success: true,
      message: 'Showcase deleted successfully'
    }

  } catch (error) {
    logger.error('Error deleting showcase:', error)

    if (error.statusCode) {
      throw error
    }

    if (error.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Showcase not found'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete showcase'
    })
  }
})
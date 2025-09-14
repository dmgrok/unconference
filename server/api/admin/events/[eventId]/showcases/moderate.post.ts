import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import logger from '~/utils/logger'

const prisma = new PrismaClient()

const moderationSchema = z.object({
  showcaseIds: z.array(z.string()).min(1, 'At least one showcase must be selected'),
  action: z.enum(['approve', 'hide', 'delete', 'feature']),
  reason: z.string().optional()
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
        statusMessage: 'You must be an organizer or moderator to moderate showcases'
      })
    }

    // Validate input
    const { showcaseIds, action, reason } = moderationSchema.parse(body)

    const results = []

    for (const showcaseId of showcaseIds) {
      try {
        let updateData: any = {}

        switch (action) {
          case 'approve':
            // For future use when approval workflow is implemented
            updateData = { updatedAt: new Date() }
            break

          case 'hide':
            // For future use - could add a 'hidden' field to schema
            updateData = { updatedAt: new Date() }
            break

          case 'delete':
            await prisma.workShowcase.delete({
              where: { id: showcaseId, eventId }
            })
            results.push({ showcaseId, action: 'deleted', success: true })
            continue

          case 'feature':
            // For future use - could add a 'featured' field to schema
            updateData = { updatedAt: new Date() }
            break
        }

        if (Object.keys(updateData).length > 0) {
          await prisma.workShowcase.update({
            where: { id: showcaseId, eventId },
            data: updateData
          })
        }

        results.push({ showcaseId, action, success: true })

      } catch (error) {
        logger.error(`Error moderating showcase ${showcaseId}:`, error)
        results.push({
          showcaseId,
          action,
          success: false,
          error: error.code === 'P2025' ? 'Showcase not found' : 'Unknown error'
        })
      }
    }

    // Log moderation action
    logger.info(`Admin ${user.id} performed ${action} on showcases in event ${eventId}`, {
      showcaseIds,
      reason,
      results
    })

    return {
      success: true,
      results,
      message: `Successfully processed ${results.filter(r => r.success).length} of ${showcaseIds.length} showcases`
    }

  } catch (error) {
    logger.error('Error in showcase moderation:', error)

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
      statusMessage: 'Failed to moderate showcases'
    })
  }
})
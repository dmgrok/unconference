import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import logger from '~/utils/logger'

const prisma = new PrismaClient()

const updateNotesSchema = z.object({
  sharedNotes: z.string()
})

export default defineEventHandler(async (event) => {
  try {
    const collaborationId = getRouterParam(event, 'id')

    if (!collaborationId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Collaboration ID is required'
      })
    }

    const body = await readBody(event)
    const { sharedNotes } = updateNotesSchema.parse(body)

    // Update the collaboration space with new shared notes
    const updatedCollaboration = await prisma.collaborationSpace.update({
      where: { id: collaborationId },
      data: {
        sharedNotes,
        updatedAt: new Date()
      },
      include: {
        actionItems: true,
        resources: true
      }
    })

    logger.info(`Updated shared notes for collaboration ${collaborationId}`)

    return {
      success: true,
      collaboration: updatedCollaboration
    }

  } catch (error) {
    logger.error('Error updating collaboration notes:', error)

    if (error.code === 'P2025') {
      throw createError({
        statusCode: 404,
        statusMessage: 'Collaboration space not found'
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update collaboration notes'
    })
  }
})
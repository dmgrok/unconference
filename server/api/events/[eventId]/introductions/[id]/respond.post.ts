// API endpoint for responding to introduction requests
import { z } from 'zod'
import prisma from '~/lib/db'

const responseSchema = z.object({
  status: z.enum(['ACCEPTED', 'DECLINED']),
  message: z.string().max(500).optional()
})

export default defineEventHandler(async (event) => {
  try {
    const eventId = getRouterParam(event, 'eventId')
    const introId = getRouterParam(event, 'id')
    const body = await readValidatedBody(event, responseSchema.parse)

    if (!eventId || !introId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID and Introduction ID are required'
      })
    }

    // Get current user from session
    const session = await requireUserSession(event)
    const userId = session.user.id

    // Find introduction request
    const introRequest = await prisma.introductionRequest.findFirst({
      where: {
        id: introId,
        eventId,
        targetPersonId: userId,
        status: 'PENDING'
      },
      include: {
        requester: {
          select: { id: true, name: true, nickname: true }
        },
        targetPerson: {
          select: { id: true, name: true, nickname: true }
        }
      }
    })

    if (!introRequest) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Introduction request not found or already processed'
      })
    }

    // Update introduction request status
    const updatedRequest = await prisma.introductionRequest.update({
      where: { id: introId },
      data: {
        status: body.status,
        completedAt: body.status === 'ACCEPTED' ? new Date() : null
      }
    })

    // If accepted, create a connection record
    if (body.status === 'ACCEPTED') {
      await prisma.connection.create({
        data: {
          userId: introRequest.requesterId,
          connectedUserId: introRequest.targetPersonId,
          eventId,
          qualityScore: 70, // Start with a good base score for facilitated introductions
          connectionStrength: 'MEDIUM',
          followUpStatus: 'PENDING',
          sharedInterests: introRequest.commonInterests || '',
          mutualGoals: `Connected through ${introRequest.reason}`
        }
      })

      // Also create the reverse connection
      await prisma.connection.create({
        data: {
          userId: introRequest.targetPersonId,
          connectedUserId: introRequest.requesterId,
          eventId,
          qualityScore: 70,
          connectionStrength: 'MEDIUM',
          followUpStatus: 'PENDING',
          sharedInterests: introRequest.commonInterests || '',
          mutualGoals: `Connected through ${introRequest.reason}`
        }
      })
    }

    // TODO: Send notification to requester about the response
    // This could include email notifications, in-app notifications, etc.

    return {
      id: updatedRequest.id,
      status: updatedRequest.status,
      completedAt: updatedRequest.completedAt,
      message: `Introduction request ${body.status.toLowerCase()}`,
      connectedUsers: body.status === 'ACCEPTED' ? {
        requester: introRequest.requester,
        target: introRequest.targetPerson
      } : null
    }

  } catch (error) {
    console.error('Error responding to introduction request:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process introduction response'
    })
  }
})
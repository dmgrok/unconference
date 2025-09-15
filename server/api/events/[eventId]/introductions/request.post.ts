// API endpoint for requesting introductions based on skill matching
import { z } from 'zod'
import prisma from '~/lib/db'

const requestSchema = z.object({
  targetPersonId: z.string().min(1, 'Target person ID is required'),
  reason: z.string().min(10, 'Please provide a reason for the introduction').max(500),
  commonInterests: z.array(z.string()).optional().default([]),
  personalMessage: z.string().max(1000).optional()
})

export default defineEventHandler(async (event) => {
  try {
    const eventId = getRouterParam(event, 'eventId')
    const body = await readValidatedBody(event, requestSchema.parse)

    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    // Get current user from session
    const session = await requireUserSession(event)
    const requesterId = session.user.id

    // Validate that both users are members of the event
    const memberships = await prisma.eventMembership.findMany({
      where: {
        eventId,
        userId: { in: [requesterId, body.targetPersonId] },
        status: 'ACTIVE'
      }
    })

    if (memberships.length !== 2) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Both users must be active members of this event'
      })
    }

    // Check if introduction request already exists
    const existingRequest = await prisma.introductionRequest.findFirst({
      where: {
        eventId,
        requesterId,
        targetPersonId: body.targetPersonId,
        status: { in: ['PENDING', 'ACCEPTED'] }
      }
    })

    if (existingRequest) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Introduction request already exists'
      })
    }

    // Get users' data for skill matching context
    const [requester, targetPerson] = await Promise.all([
      prisma.user.findUnique({
        where: { id: requesterId },
        select: {
          id: true,
          name: true,
          skills: true,
          interests: true,
          lookingFor: true
        }
      }),
      prisma.user.findUnique({
        where: { id: body.targetPersonId },
        select: {
          id: true,
          name: true,
          skills: true,
          interests: true,
          lookingFor: true
        }
      })
    ])

    if (!requester || !targetPerson) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Generate skill match data for the introduction
    const { findSkillMatches } = await import('~/composables/useSkillMatching')
    const matches = await findSkillMatches(requester, [targetPerson], eventId, {
      maxResults: 1
    })

    const skillMatchData = matches.length > 0 ? matches[0] : null

    // Create introduction request
    const introRequest = await prisma.introductionRequest.create({
      data: {
        eventId,
        requesterId,
        targetPersonId: body.targetPersonId,
        reason: body.reason,
        commonInterests: body.commonInterests.join(', '),
        status: 'PENDING'
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatar: true,
            bio: true,
            skills: true,
            interests: true,
            lookingFor: true
          }
        },
        targetPerson: {
          select: {
            id: true,
            name: true,
            nickname: true,
            avatar: true,
            bio: true,
            skills: true,
            interests: true,
            lookingFor: true
          }
        }
      }
    })

    // Create or update skill match record
    if (skillMatchData) {
      await prisma.skillMatch.upsert({
        where: {
          eventId_personAId_personBId: {
            eventId,
            personAId: requesterId,
            personBId: body.targetPersonId
          }
        },
        update: {
          compatibilityScore: skillMatchData.compatibilityScore,
          reason: skillMatchData.reason
        },
        create: {
          eventId,
          personAId: requesterId,
          personBId: body.targetPersonId,
          matchType: skillMatchData.matchType,
          skills: skillMatchData.sharedSkills.concat(skillMatchData.complementarySkills).join(', '),
          compatibilityScore: skillMatchData.compatibilityScore,
          reason: skillMatchData.reason
        }
      })
    }

    // TODO: Send notification to target person about the introduction request
    // This could be implemented with email notifications, in-app notifications, etc.

    const response = {
      id: introRequest.id,
      status: introRequest.status,
      reason: introRequest.reason,
      commonInterests: introRequest.commonInterests?.split(', ').filter(Boolean) || [],
      createdAt: introRequest.createdAt,
      requester: {
        id: introRequest.requester.id,
        name: introRequest.requester.name,
        nickname: introRequest.requester.nickname,
        avatar: introRequest.requester.avatar
      },
      targetPerson: {
        id: introRequest.targetPerson.id,
        name: introRequest.targetPerson.name,
        nickname: introRequest.targetPerson.nickname,
        avatar: introRequest.targetPerson.avatar
      },
      skillMatch: skillMatchData ? {
        matchType: skillMatchData.matchType,
        compatibilityScore: Math.round(skillMatchData.compatibilityScore * 100),
        reason: skillMatchData.reason,
        sharedSkills: skillMatchData.sharedSkills,
        complementarySkills: skillMatchData.complementarySkills
      } : null
    }

    return response

  } catch (error) {
    console.error('Error creating introduction request:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create introduction request'
    })
  }
})
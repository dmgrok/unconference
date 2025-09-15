// API endpoint for skill-based people recommendations
import { z } from 'zod'
import prisma from '~/lib/db'

const querySchema = z.object({
  includeComplementary: z.string().optional().transform(v => v === 'true'),
  includeSharedInterests: z.string().optional().transform(v => v === 'true'),
  includeMentorship: z.string().optional().transform(v => v === 'true'),
  minScore: z.string().optional().transform(v => v ? parseFloat(v) : 0.1),
  limit: z.string().optional().transform(v => v ? parseInt(v) : 10)
})

export default defineEventHandler(async (event) => {
  try {
    // Get and validate parameters
    const eventId = getRouterParam(event, 'eventId')
    const query = await getValidatedQuery(event, querySchema.parse)

    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    // Get current user from session
    const session = await requireUserSession(event)
    const currentUserId = session.user.id

    // Check if user is member of this event
    const membership = await prisma.eventMembership.findFirst({
      where: {
        eventId,
        userId: currentUserId,
        status: 'ACTIVE'
      }
    })

    if (!membership) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied - not a member of this event'
      })
    }

    // Get current user with profile data
    const currentUser = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        name: true,
        skills: true,
        interests: true,
        lookingFor: true,
        bio: true
      }
    })

    if (!currentUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Get all other participants in the event
    const participants = await prisma.user.findMany({
      where: {
        eventMemberships: {
          some: {
            eventId,
            status: 'ACTIVE'
          }
        },
        NOT: {
          id: currentUserId
        }
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        avatar: true,
        bio: true,
        skills: true,
        interests: true,
        lookingFor: true,
        linkedinUrl: true,
        twitterHandle: true,
        websiteUrl: true,
        allowContactSharing: true
      }
    })

    // Use skill matching algorithm
    const { findSkillMatches } = await import('~/composables/useSkillMatching')

    const recommendations = await findSkillMatches(
      currentUser,
      participants,
      eventId,
      {
        includeComplementary: query.includeComplementary ?? true,
        includeSharedInterests: query.includeSharedInterests ?? true,
        includeMentorship: query.includeMentorship ?? true,
        minCompatibilityScore: query.minScore ?? 0.1,
        maxResults: query.limit ?? 10
      }
    )

    // Check if we already have stored skill matches for these recommendations
    const existingMatches = await prisma.skillMatch.findMany({
      where: {
        eventId,
        OR: [
          {
            personAId: currentUserId,
            personBId: { in: recommendations.map(r => r.targetUser.id) }
          },
          {
            personAId: { in: recommendations.map(r => r.targetUser.id) },
            personBId: currentUserId
          }
        ]
      }
    })

    // Create new skill matches for high-scoring recommendations
    const newMatches = []
    for (const rec of recommendations) {
      if (rec.compatibilityScore >= 0.3) { // Only store high-quality matches
        const existingMatch = existingMatches.find(match =>
          (match.personAId === currentUserId && match.personBId === rec.targetUser.id) ||
          (match.personAId === rec.targetUser.id && match.personBId === currentUserId)
        )

        if (!existingMatch) {
          const matchData = {
            eventId,
            personAId: currentUserId,
            personBId: rec.targetUser.id,
            matchType: rec.matchType,
            skills: rec.sharedSkills.concat(rec.complementarySkills).join(', '),
            compatibilityScore: rec.compatibilityScore,
            reason: rec.reason,
          }

          newMatches.push(matchData)
        }
      }
    }

    // Batch create new matches
    if (newMatches.length > 0) {
      await prisma.skillMatch.createMany({
        data: newMatches,
        skipDuplicates: true
      })
    }

    // Format response
    const response = {
      recommendations: recommendations.map(rec => ({
        id: rec.targetUser.id,
        user: {
          id: rec.targetUser.id,
          name: rec.targetUser.name,
          nickname: rec.targetUser.nickname,
          avatar: rec.targetUser.avatar,
          bio: rec.targetUser.bio,
          skills: rec.targetUser.skills?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
          interests: rec.targetUser.interests?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
          lookingFor: rec.targetUser.lookingFor?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
          contactInfo: rec.targetUser.allowContactSharing ? {
            linkedin: rec.targetUser.linkedinUrl,
            twitter: rec.targetUser.twitterHandle,
            website: rec.targetUser.websiteUrl,
            allowContactSharing: rec.targetUser.allowContactSharing
          } : null
        },
        matchType: rec.matchType,
        compatibilityScore: Math.round(rec.compatibilityScore * 100), // Convert to percentage
        reason: rec.reason,
        details: {
          sharedSkills: rec.sharedSkills,
          complementarySkills: rec.complementarySkills,
          mutualInterests: rec.mutualInterests,
          mentorshipPotential: rec.mentorshipPotential,
          strengthIndicators: {
            ...rec.strengthIndicators,
            skillOverlap: Math.round(rec.strengthIndicators.skillOverlap * 100),
            experienceAlignment: Math.round(rec.strengthIndicators.experienceAlignment * 100),
            goalAlignment: Math.round(rec.strengthIndicators.goalAlignment * 100),
            industryFit: Math.round(rec.strengthIndicators.industryFit * 100)
          }
        }
      })),
      metadata: {
        total: recommendations.length,
        eventId,
        generatedAt: new Date().toISOString(),
        filters: {
          includeComplementary: query.includeComplementary,
          includeSharedInterests: query.includeSharedInterests,
          includeMentorship: query.includeMentorship,
          minScore: query.minScore,
          limit: query.limit
        }
      }
    }

    return response

  } catch (error) {
    console.error('Error generating skill recommendations:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate recommendations'
    })
  }
})
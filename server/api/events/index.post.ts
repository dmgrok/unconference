import { z } from 'zod'
import prisma from '~/lib/database'
import { SubscriptionService } from '~/lib/subscription'

const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  maxParticipants: z.number().min(1, 'Must allow at least 1 participant').max(1000, 'Maximum 1000 participants'),
  allowGuestAccess: z.boolean().default(true),
  requireApproval: z.boolean().default(false),
  startsAt: z.string().transform((str) => str ? new Date(str) : null).nullable().optional(),
  endsAt: z.string().transform((str) => str ? new Date(str) : null).nullable().optional()
})

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  try {
    // Get current user from session
    const session = await getUserSession(event)
    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const body = await readBody(event)
    const eventData = createEventSchema.parse(body)

    // Check if user can create events (subscription limits)
    const canCreate = await SubscriptionService.canCreateEvent(session.user.id)
    if (!canCreate.allowed) {
      throw createError({
        statusCode: 403,
        statusMessage: canCreate.reason || 'Cannot create event'
      })
    }

    // Check if participant count requires payment
    const paymentCheck = await SubscriptionService.checkEventPaymentRequired(
      session.user.id,
      eventData.maxParticipants
    )

    // Generate unique event code
    const eventCode = await generateUniqueEventCode()

    // Create the event
    const newEvent = await prisma.event.create({
      data: {
        title: eventData.title,
        description: eventData.description,
        code: eventCode,
        maxParticipants: eventData.maxParticipants,
        allowGuestAccess: eventData.allowGuestAccess,
        requireApproval: eventData.requireApproval,
        startsAt: eventData.startsAt,
        endsAt: eventData.endsAt,
        ownerId: session.user.id,
        // Set payment status based on requirements
        paymentType: paymentCheck.paymentRequired ? 'PAY_PER_EVENT' : 'FREE',
        paymentStatus: paymentCheck.paymentRequired ? 'PENDING' : 'FREE',
        status: paymentCheck.paymentRequired ? 'DRAFT' : 'ACTIVE'
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            subscriptionTier: true
          }
        },
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                nickname: true
              }
            }
          }
        }
      }
    })

    // Automatically add creator as organizer
    await prisma.eventMembership.create({
      data: {
        userId: session.user.id,
        eventId: newEvent.id,
        role: 'ORGANIZER',
        status: 'ACTIVE'
      }
    })

    // Log the event creation
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        eventId: newEvent.id,
        action: 'event_created',
        details: JSON.stringify({
          title: newEvent.title,
          maxParticipants: newEvent.maxParticipants,
          paymentRequired: paymentCheck.paymentRequired,
          eventCode: newEvent.code
        })
      }
    })

    return {
      success: true,
      event: newEvent,
      paymentRequired: paymentCheck.paymentRequired,
      paymentOptions: paymentCheck.suggestedOptions
    }

  } catch (error) {
    console.error('Event creation error:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create event'
    })
  }
})

// Generate a unique 6-character event code
async function generateUniqueEventCode(): Promise<string> {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length))
    }

    // Check if code is unique
    const existing = await prisma.event.findFirst({
      where: { code }
    })

    if (!existing) {
      return code
    }

    attempts++
  }

  throw new Error('Failed to generate unique event code')
}
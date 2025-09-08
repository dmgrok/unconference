import { z } from 'zod'
import { SubscriptionService } from '~/lib/subscription'

const paymentCheckSchema = z.object({
  expectedParticipants: z.number().min(1, 'Expected participants must be at least 1'),
  eventId: z.string().optional()
})

export default defineEventHandler(async (event) => {
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
    const { expectedParticipants, eventId } = paymentCheckSchema.parse(body)

    // Check if payment is required for this event
    const paymentCheck = await SubscriptionService.checkEventPaymentRequired(
      session.user.id,
      expectedParticipants
    )

    return {
      success: true,
      paymentRequired: paymentCheck.paymentRequired,
      reason: paymentCheck.reason,
      suggestedOptions: paymentCheck.suggestedOptions,
      currentParticipants: expectedParticipants
    }

  } catch (error) {
    console.error('Payment check error:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to check payment requirements'
    })
  }
})
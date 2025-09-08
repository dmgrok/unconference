import { z } from 'zod'
import { StripeService } from '~/lib/stripe'

const checkoutSchema = z.object({
  tier: z.enum(['COMMUNITY', 'ORGANIZER', 'UNLIMITED']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url()
})

export default defineEventHandler(async (event) => {
  try {
    // Ensure user is authenticated
    const session = await getUserSession(event)
    if (!session.user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const body = await readBody(event)
    const { tier, successUrl, cancelUrl } = checkoutSchema.parse(body)

    const user = session.user as any
    const checkoutUrl = await StripeService.createCheckoutSession(
      user.id,
      user.email,
      tier,
      successUrl,
      cancelUrl
    )

    return {
      success: true,
      checkoutUrl
    }
  } catch (error: any) {
    console.error('Checkout error:', error)
    
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create checkout session'
    })
  }
})
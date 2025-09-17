import { z } from 'zod'
import { stripe } from '~/lib/stripe'
import { PRICING_TIERS } from '~/types/pricing'
import prisma from '~/lib/database'

const upgradeEventSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  tier: z.enum(['professional', 'enterprise'], {
    errorMap: () => ({ message: 'Tier must be either professional or enterprise' })
  })
})

export default defineEventHandler(async (event) => {
  try {
    // Get current user from session
    const { user } = await requireUserSession(event)
    
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const body = await readBody(event)
    const { eventId, tier } = upgradeEventSchema.parse(body)

    // Get the pricing tier configuration
    const tierConfig = PRICING_TIERS.find(t => t.id === tier)
    if (!tierConfig) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid pricing tier'
      })
    }

    // Verify the event exists and user owns it
    const eventRecord = await prisma.event.findUnique({
      where: { id: eventId },
      include: { owner: true }
    })

    if (!eventRecord) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }

    const userId = (user as any).id || (user as any).email
    if (eventRecord.ownerId !== userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You can only upgrade your own events'
      })
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Unconference ${tierConfig.name}`,
            description: `Upgrade "${eventRecord.title}" to ${tierConfig.name} tier`,
          },
          unit_amount: tierConfig.price,
        },
        quantity: 1,
      }],
      success_url: `${getBaseURL()}/events/${eventId}?upgraded=true&tier=${tier}`,
      cancel_url: `${getBaseURL()}/events/${eventId}`,
      metadata: {
        eventId,
        tier,
        userId,
        type: 'event_upgrade'
      },
      customer_email: (user as any).email || undefined,
    })

    return {
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    }

  } catch (error: any) {
    console.error('Event upgrade error:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: error.errors
      })
    }

    if (error?.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create upgrade checkout session'
    })
  }
})

// Helper function to get base URL for redirects
function getBaseURL(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  if (process.env.NUXT_PUBLIC_BASE_URL) {
    return process.env.NUXT_PUBLIC_BASE_URL
  }
  return 'http://localhost:3000'
}

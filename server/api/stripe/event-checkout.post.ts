import Stripe from 'stripe'
import prisma from '~/lib/database'
import { z } from 'zod'
import { SubscriptionService, PAY_PER_EVENT_PRICING } from '~/lib/subscription'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

const createEventCheckoutSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  eventSize: z.enum(['SMALL', 'MEDIUM', 'LARGE']),
  successUrl: z.string().url('Valid success URL required'),
  cancelUrl: z.string().url('Valid cancel URL required')
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
    const body = await readBody(event)
    const { eventId, eventSize, successUrl, cancelUrl } = createEventCheckoutSchema.parse(body)

    // Get current user from session
    const session = await getUserSession(event)
    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    // Verify event exists and user owns it
    const eventRecord = await prisma.event.findFirst({
      where: {
        id: eventId,
        ownerId: session.user.id
      },
      include: {
        owner: true,
        memberships: {
          where: { status: 'ACTIVE' }
        }
      }
    })

    if (!eventRecord) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found or access denied'
      })
    }

    // Check if event already paid for
    if (eventRecord.paymentStatus === 'PAID') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event is already paid for'
      })
    }

    // Get pricing for selected event size
    const pricing = PAY_PER_EVENT_PRICING[eventSize]
    if (!pricing) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid event size'
      })
    }

    // Verify event size is appropriate
    const currentParticipants = eventRecord.memberships.length
    if (currentParticipants > pricing.maxParticipants) {
      throw createError({
        statusCode: 400,
        statusMessage: `Event has ${currentParticipants} participants but selected size supports only ${pricing.maxParticipants}`
      })
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${eventSize} Event - ${eventRecord.title}`,
            description: pricing.description,
            metadata: {
              eventId: eventRecord.id,
              eventTitle: eventRecord.title,
              maxParticipants: pricing.maxParticipants.toString()
            }
          },
          unit_amount: pricing.price * 100, // Stripe expects cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: eventRecord.owner.email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        eventId: eventRecord.id,
        userId: session.user.id,
        paymentType: 'pay_per_event',
        eventSize: eventSize,
        maxParticipants: pricing.maxParticipants.toString()
      }
    })

    // Update event with payment pending status
    await prisma.event.update({
      where: { id: eventId },
      data: {
        paymentType: 'PAY_PER_EVENT',
        paymentStatus: 'PENDING',
        maxParticipants: pricing.maxParticipants
      }
    })

    return {
      success: true,
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id
    }

  } catch (error) {
    console.error('Event checkout error:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation failed',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create checkout session'
    })
  }
})
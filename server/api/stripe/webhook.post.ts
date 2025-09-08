import { StripeService } from '~/lib/stripe'
import { SubscriptionService } from '~/lib/subscription'
import prisma from '~/lib/database'

export default defineEventHandler(async (event) => {
  try {
    const body = await readRawBody(event)
    const signature = getHeader(event, 'stripe-signature')

    if (!body || !signature) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing body or signature'
      })
    }

    // Verify the webhook signature
    const stripeEvent = StripeService.validateWebhook(body, signature)

    // Handle different event types
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripeEvent)
        break
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent)
        break
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent)
        break
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent)
        break
      
      default:
        console.log(`Unhandled Stripe event: ${stripeEvent.type}`)
    }

    return { received: true }
  } catch (error: any) {
    console.error('Stripe webhook error:', error)
    throw createError({
      statusCode: 400,
      statusMessage: 'Webhook error: ' + error.message
    })
  }
})

async function handleCheckoutCompleted(stripeEvent: any) {
  try {
    const session = stripeEvent.data.object
    
    // Check if this is a subscription or one-time payment
    if (session.metadata?.paymentType === 'pay_per_event') {
      await handleEventPaymentCompleted(session)
    } else {
      await handleSubscriptionPaymentCompleted(session)
    }
  } catch (error) {
    console.error('Error handling checkout completion:', error)
    throw error
  }
}

async function handleSubscriptionPaymentCompleted(session: any) {
  const paymentData = await StripeService.handleSuccessfulPayment(session.id)
  
  // Map Stripe tier to Prisma enum
  const tierMap: Record<string, any> = {
    'COMMUNITY': 'COMMUNITY',
    'ORGANIZER': 'ORGANIZER', 
    'UNLIMITED': 'UNLIMITED'
  }
  
  const subscriptionTier = tierMap[paymentData.tier]
  if (!subscriptionTier) {
    throw new Error(`Unknown subscription tier: ${paymentData.tier}`)
  }

  // Update user subscription in database
  await SubscriptionService.updateSubscription(paymentData.userId, {
    tier: subscriptionTier,
    stripeSubscriptionId: paymentData.subscriptionId,
    stripeCustomerId: paymentData.customerId,
    currentPeriodStart: paymentData.currentPeriodStart,
    currentPeriodEnd: paymentData.currentPeriodEnd
  })

  // Log the upgrade
  await prisma.auditLog.create({
    data: {
      userId: paymentData.userId,
      action: 'subscription_upgraded',
      details: JSON.stringify({
        tier: subscriptionTier,
        amount: getAmountFromTier(subscriptionTier)
      })
    }
  })

  console.log(`Successfully upgraded user ${paymentData.userId} to ${subscriptionTier}`)
}

async function handleEventPaymentCompleted(session: any) {
  const { eventId, userId, eventSize, maxParticipants } = session.metadata
  
  if (!eventId || !userId) {
    throw new Error('Missing required metadata for event payment')
  }

  // Update event payment status
  await prisma.event.update({
    where: { id: eventId },
    data: {
      paymentStatus: 'PAID',
      stripePaymentId: session.payment_intent,
      paidAmount: session.amount_total,
      paidAt: new Date(),
      maxParticipants: parseInt(maxParticipants)
    }
  })

  // Log the payment
  await prisma.auditLog.create({
    data: {
      userId,
      eventId,
      action: 'event_payment_completed',
      details: JSON.stringify({
        eventSize,
        amount: session.amount_total / 100, // Convert from cents
        maxParticipants: parseInt(maxParticipants),
        sessionId: session.id
      })
    }
  })

  console.log(`Successfully processed payment for event ${eventId} (${eventSize} - $${session.amount_total / 100})`)
}

async function handleSubscriptionUpdated(stripeEvent: any) {
  const subscription = stripeEvent.data.object
  const userId = subscription.metadata?.userId
  
  if (!userId) {
    console.log('No userId in subscription metadata')
    return
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: mapStripeStatus(subscription.status),
        subscriptionEnd: new Date(subscription.current_period_end * 1000)
      }
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
  }
}

async function handleSubscriptionDeleted(stripeEvent: any) {
  const subscription = stripeEvent.data.object
  const userId = subscription.metadata?.userId
  
  if (!userId) {
    console.log('No userId in subscription metadata')
    return
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: 'FREE',
        subscriptionStatus: 'CANCELED',
        participantLimit: 50,
        subscriptionEnd: new Date()
      }
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'subscription_canceled',
        details: JSON.stringify({ reason: 'stripe_deletion' })
      }
    })
  } catch (error) {
    console.error('Error handling subscription deletion:', error)
  }
}

async function handlePaymentFailed(stripeEvent: any) {
  const invoice = stripeEvent.data.object
  const customerId = invoice.customer
  
  try {
    const user = await prisma.user.findFirst({
      where: { customerId: customerId as string }
    })
    
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'PAST_DUE'
        }
      })

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'payment_failed',
          details: JSON.stringify({
            invoiceId: invoice.id,
            amount: invoice.amount_due
          })
        }
      })
    }
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}

function mapStripeStatus(stripeStatus: string): any {
  const statusMap: Record<string, any> = {
    'active': 'ACTIVE',
    'canceled': 'CANCELED',
    'past_due': 'PAST_DUE',
    'incomplete': 'INCOMPLETE',
    'incomplete_expired': 'INCOMPLETE_EXPIRED',
    'trialing': 'TRIALING',
    'unpaid': 'UNPAID'
  }
  
  return statusMap[stripeStatus] || 'ACTIVE'
}

function getAmountFromTier(tier: string): number {
  const amounts: Record<string, number> = {
    'COMMUNITY': 19,
    'ORGANIZER': 49,
    'UNLIMITED': 99
  }
  return amounts[tier] || 0
}
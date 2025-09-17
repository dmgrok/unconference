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

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(stripeEvent)
        break

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(stripeEvent)
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
    
    // Check payment type from metadata
    if (session.metadata?.type === 'event_upgrade') {
      await handleEventUpgradeCompleted(session)
    } else if (session.metadata?.paymentType === 'pay_per_event') {
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
  const { eventId, userId, eventTier, maxParticipants } = session.metadata

  if (!eventId || !userId) {
    throw new Error('Missing required metadata for event payment')
  }

  // Handle unlimited participants
  const participantLimit = maxParticipants === 'unlimited' ? -1 : parseInt(maxParticipants)

  // Update event payment status
  await prisma.event.update({
    where: { id: eventId },
    data: {
      paymentStatus: 'PAID',
      stripePaymentId: session.payment_intent,
      paidAmount: session.amount_total,
      paidAt: new Date(),
      maxParticipants: participantLimit
    }
  })

  // Log the payment
  await prisma.auditLog.create({
    data: {
      userId,
      eventId,
      action: 'event_payment_completed',
      details: JSON.stringify({
        eventTier,
        amount: session.amount_total / 100, // Convert from cents
        maxParticipants: participantLimit,
        sessionId: session.id
      })
    }
  })

  console.log(`Successfully processed payment for event ${eventId} (${eventTier} - $${session.amount_total / 100})`)
}

async function handleEventUpgradeCompleted(session: any) {
  const { eventId, userId, tier } = session.metadata

  if (!eventId || !userId || !tier) {
    throw new Error('Missing required metadata for event upgrade')
  }

  // Get the pricing tier limits
  const { PRICING_TIERS } = await import('~/types/pricing')
  const tierConfig = PRICING_TIERS.find(t => t.id === tier)
  
  if (!tierConfig) {
    throw new Error(`Invalid tier: ${tier}`)
  }

  // Update event with new participant limit and payment info
  await prisma.event.update({
    where: { id: eventId },
    data: {
      maxParticipants: tierConfig.participantLimit,
      paymentStatus: 'PAID',
      paymentType: 'PAY_PER_EVENT',
      stripePaymentId: session.payment_intent,
      paidAmount: session.amount_total,
      paidAt: new Date()
    }
  })

  // Log the upgrade
  await prisma.auditLog.create({
    data: {
      userId,
      eventId,
      action: 'event_upgraded',
      details: JSON.stringify({
        tier,
        amount: session.amount_total / 100,
        maxParticipants: tierConfig.participantLimit,
        sessionId: session.id
      })
    }
  })

  console.log(`Successfully upgraded event ${eventId} to ${tier} tier - $${session.amount_total / 100}`)
}

async function handleSubscriptionUpdated(stripeEvent: any) {
  const subscription = stripeEvent.data.object
  const userId = subscription.metadata?.userId

  if (!userId) {
    console.log('No userId in subscription metadata')
    return
  }

  try {
    // Detect tier change from price ID
    const priceId = subscription.items?.data[0]?.price?.id
    let newTier = null

    // Map price IDs to tiers
    const priceToTierMap: Record<string, string> = {
      'price_community_monthly': 'COMMUNITY',
      'price_organizer_monthly': 'ORGANIZER',
      'price_unlimited_monthly': 'UNLIMITED'
    }

    // Check environment variables for price IDs
    if (priceId === process.env.STRIPE_COMMUNITY_PRICE_ID) newTier = 'COMMUNITY'
    else if (priceId === process.env.STRIPE_ORGANIZER_PRICE_ID) newTier = 'ORGANIZER'
    else if (priceId === process.env.STRIPE_UNLIMITED_PRICE_ID) newTier = 'UNLIMITED'
    else newTier = priceToTierMap[priceId]

    // Get current user to compare tiers
    const currentUser = await prisma.user.findUnique({ where: { id: userId } })
    const isUpgrade = newTier && currentUser &&
      (['FREE', 'COMMUNITY', 'ORGANIZER', 'UNLIMITED'].indexOf(newTier) >
       ['FREE', 'COMMUNITY', 'ORGANIZER', 'UNLIMITED'].indexOf(currentUser.subscriptionTier))

    const updateData: any = {
      subscriptionStatus: mapStripeStatus(subscription.status),
      subscriptionStart: new Date(subscription.current_period_start * 1000),
      subscriptionEnd: new Date(subscription.current_period_end * 1000)
    }

    // Update tier and limits if tier changed
    if (newTier && currentUser?.subscriptionTier !== newTier) {
      const limits = {
        'COMMUNITY': { tier: 'COMMUNITY', limit: 150 },
        'ORGANIZER': { tier: 'ORGANIZER', limit: 300 },
        'UNLIMITED': { tier: 'UNLIMITED', limit: 999999 }
      }

      const tierLimits = limits[newTier as keyof typeof limits]
      if (tierLimits) {
        updateData.subscriptionTier = tierLimits.tier
        updateData.participantLimit = tierLimits.limit
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    // Log tier changes
    if (newTier && currentUser?.subscriptionTier !== newTier) {
      await prisma.auditLog.create({
        data: {
          userId,
          action: isUpgrade ? 'subscription_upgraded' : 'subscription_downgraded',
          details: JSON.stringify({
            fromTier: currentUser?.subscriptionTier,
            toTier: newTier,
            priceId,
            amount: subscription.items?.data[0]?.price?.unit_amount / 100
          })
        }
      })

      console.log(`Subscription ${isUpgrade ? 'upgraded' : 'downgraded'}: ${currentUser?.subscriptionTier} -> ${newTier} for user ${userId}`)
    }

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

async function handlePaymentSucceeded(stripeEvent: any) {
  const invoice = stripeEvent.data.object
  const customerId = invoice.customer

  try {
    const user = await prisma.user.findFirst({
      where: { customerId: customerId as string }
    })

    if (user && user.subscriptionStatus === 'PAST_DUE') {
      // Payment recovery successful - reactivate subscription
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: 'ACTIVE'
        }
      })

      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'payment_recovered',
          details: JSON.stringify({
            invoiceId: invoice.id,
            amount: invoice.amount_paid / 100
          })
        }
      })

      console.log(`Payment recovered for user ${user.id}`)
    }
  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

async function handleTrialWillEnd(stripeEvent: any) {
  const subscription = stripeEvent.data.object
  const userId = subscription.metadata?.userId

  if (!userId) {
    return
  }

  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'trial_ending',
        details: JSON.stringify({
          trialEndDate: new Date(subscription.trial_end * 1000),
          subscriptionId: subscription.id
        })
      }
    })

    console.log(`Trial ending soon for user ${userId}`)
  } catch (error) {
    console.error('Error handling trial end warning:', error)
  }
}

function getAmountFromTier(tier: string): number {
  const amounts: Record<string, number> = {
    'COMMUNITY': 19,
    'ORGANIZER': 49,
    'UNLIMITED': 99
  }
  return amounts[tier] || 0
}
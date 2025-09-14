import { z } from 'zod'
import { StripeService, STRIPE_PRODUCTS, stripe } from '~/lib/stripe'
import { SubscriptionService } from '~/lib/subscription'
import prisma from '~/lib/database'

const downgradeSchema = z.object({
  newTier: z.enum(['FREE', 'COMMUNITY', 'ORGANIZER']),
  immediate: z.boolean().optional().default(false)
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
    const { newTier, immediate } = downgradeSchema.parse(body)

    const user = session.user as any

    // Get current user subscription details
    const currentUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!currentUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    if (!currentUser.subscriptionId || currentUser.subscriptionStatus !== 'ACTIVE') {
      throw createError({
        statusCode: 400,
        statusMessage: 'No active subscription to downgrade'
      })
    }

    try {
      if (newTier === 'FREE') {
        // Cancel subscription
        if (immediate) {
          await stripe.subscriptions.cancel(currentUser.subscriptionId)

          // Update user immediately to free tier
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionTier: 'FREE',
              subscriptionStatus: 'CANCELED',
              subscriptionEnd: new Date(),
              participantLimit: 50 // Free tier limit
            }
          })

          return {
            success: true,
            message: 'Subscription canceled immediately',
            newTier: 'FREE',
            effectiveDate: new Date().toISOString()
          }
        } else {
          // Cancel at period end
          await stripe.subscriptions.update(currentUser.subscriptionId, {
            cancel_at_period_end: true
          })

          return {
            success: true,
            message: 'Subscription will be canceled at the end of the billing period',
            newTier: 'FREE',
            effectiveDate: currentUser.subscriptionEnd?.toISOString() || 'Unknown'
          }
        }
      } else {
        // Downgrade to a lower paid tier
        const currentSubscription = await stripe.subscriptions.retrieve(currentUser.subscriptionId)

        if (currentSubscription.status !== 'active') {
          throw new Error('Current subscription is not active')
        }

        // Get new price ID
        const newProduct = STRIPE_PRODUCTS[newTier]
        if (!newProduct) {
          throw new Error(`Invalid tier: ${newTier}`)
        }

        // Update subscription - downgrades typically happen at period end to avoid refunds
        const updatedSubscription = await stripe.subscriptions.update(currentUser.subscriptionId, {
          items: [{
            id: currentSubscription.items.data[0].id,
            price: newProduct.priceId,
          }],
          proration_behavior: immediate ? 'create_prorations' : 'none',
          billing_cycle_anchor: immediate ? undefined : 'unchanged'
        })

        // Update user in database if immediate
        if (immediate) {
          await SubscriptionService.updateSubscription(user.id, {
            tier: newTier as any,
            stripeSubscriptionId: updatedSubscription.id,
            stripeCustomerId: updatedSubscription.customer as string,
            currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
            currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000)
          })
        }

        return {
          success: true,
          message: immediate ? 'Subscription downgraded immediately' : 'Subscription will be downgraded at the end of the billing period',
          newTier,
          effectiveDate: immediate ? new Date().toISOString() : (currentUser.subscriptionEnd?.toISOString() || 'Unknown'),
          refundIssued: immediate ? 'Prorated refund will be applied to your next invoice' : null
        }
      }

    } catch (stripeError: any) {
      console.error('Stripe downgrade error:', stripeError)
      throw createError({
        statusCode: 400,
        statusMessage: `Failed to downgrade subscription: ${stripeError.message}`
      })
    }

  } catch (error: any) {
    console.error('Downgrade error:', error)

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: error.errors
      })
    }

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to process subscription downgrade'
    })
  }
})
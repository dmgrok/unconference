import { z } from 'zod'
import { StripeService, STRIPE_PRODUCTS, stripe } from '~/lib/stripe'
import { SubscriptionService } from '~/lib/subscription'
import prisma from '~/lib/database'

const upgradeSchema = z.object({
  newTier: z.enum(['COMMUNITY', 'ORGANIZER', 'UNLIMITED']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  prorate: z.boolean().optional().default(true)
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
    const { newTier, successUrl, cancelUrl, prorate } = upgradeSchema.parse(body)

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

    // If user has an existing subscription, handle upgrade
    if (currentUser.subscriptionId && currentUser.subscriptionStatus === 'ACTIVE') {
      try {
        // Get current subscription from Stripe
        const currentSubscription = await stripe.subscriptions.retrieve(currentUser.subscriptionId)

        if (currentSubscription.status !== 'active') {
          throw new Error('Current subscription is not active')
        }

        // Get new price ID
        const newProduct = STRIPE_PRODUCTS[newTier]
        if (!newProduct) {
          throw new Error(`Invalid tier: ${newTier}`)
        }

        // Update subscription with proration
        const updatedSubscription = await stripe.subscriptions.update(currentUser.subscriptionId, {
          items: [{
            id: currentSubscription.items.data[0].id,
            price: newProduct.priceId,
          }],
          proration_behavior: prorate ? 'create_prorations' : 'none',
          billing_cycle_anchor: prorate ? undefined : 'unchanged'
        })

        // Update user in database
        await SubscriptionService.updateSubscription(user.id, {
          tier: newTier as any,
          stripeSubscriptionId: updatedSubscription.id,
          stripeCustomerId: updatedSubscription.customer as string,
          currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000)
        })

        return {
          success: true,
          message: 'Subscription upgraded successfully',
          subscriptionId: updatedSubscription.id,
          newTier,
          proratedAmount: prorate ? 'Prorated charges will appear on your next invoice' : null
        }

      } catch (stripeError: any) {
        console.error('Stripe upgrade error:', stripeError)
        throw createError({
          statusCode: 400,
          statusMessage: `Failed to upgrade subscription: ${stripeError.message}`
        })
      }
    } else {
      // No existing subscription - create new one via checkout
      const checkoutUrl = await StripeService.createCheckoutSession(
        user.id,
        user.email,
        newTier,
        successUrl,
        cancelUrl
      )

      return {
        success: true,
        message: 'Checkout session created',
        checkoutUrl,
        requiresCheckout: true
      }
    }

  } catch (error: any) {
    console.error('Upgrade error:', error)

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
      statusMessage: error.message || 'Failed to process subscription upgrade'
    })
  }
})
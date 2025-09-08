import Stripe from 'stripe'
import { SUBSCRIPTION_LIMITS } from './subscription'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
})

// Product and price configuration for community-focused pricing
export const STRIPE_PRODUCTS = {
  COMMUNITY: {
    priceId: process.env.STRIPE_COMMUNITY_PRICE_ID || 'price_community_monthly',
    productName: 'Unconference Community',
    description: 'Perfect for regular meetup and community event organizers',
    price: 1900, // $19.00 in cents
  },
  ORGANIZER: {
    priceId: process.env.STRIPE_ORGANIZER_PRICE_ID || 'price_organizer_monthly',
    productName: 'Unconference Organizer',
    description: 'For professional event organizers running multiple conferences',
    price: 4900, // $49.00 in cents
  },
  UNLIMITED: {
    priceId: process.env.STRIPE_UNLIMITED_PRICE_ID || 'price_unlimited_monthly',
    productName: 'Unconference Unlimited',
    description: 'For large events and event management companies',
    price: 9900, // $99.00 in cents
  }
} as const

export class StripeService {
  /**
   * Create or retrieve a Stripe customer
   */
  static async createOrGetCustomer(userId: string, email: string, name?: string): Promise<string> {
    try {
      // Check if customer already exists
      const customers = await stripe.customers.list({
        email,
        limit: 1
      })

      if (customers.data.length > 0) {
        return customers.data[0].id
      }

      // Create new customer
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId
        }
      })

      return customer.id
    } catch (error) {
      throw new Error(`Failed to create/get Stripe customer: ${error}`)
    }
  }

  /**
   * Create a checkout session for subscription upgrade
   */
  static async createCheckoutSession(
    userId: string,
    email: string,
    tier: keyof typeof STRIPE_PRODUCTS,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    try {
      const customerId = await this.createOrGetCustomer(userId, email)
      const product = STRIPE_PRODUCTS[tier]

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: product.priceId,
            quantity: 1,
          },
        ],
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata: {
          userId,
          tier,
        },
        subscription_data: {
          metadata: {
            userId,
            tier,
          },
        },
        allow_promotion_codes: true, // Allow discount codes for community organizers
      })

      if (!session.url) {
        throw new Error('Failed to create checkout session URL')
      }

      return session.url
    } catch (error) {
      throw new Error(`Failed to create checkout session: ${error}`)
    }
  }

  /**
   * Handle successful payment and update user subscription
   */
  static async handleSuccessfulPayment(sessionId: string) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription']
      })

      if (!session.subscription) {
        throw new Error('No subscription found in session')
      }

      const subscription = session.subscription as Stripe.Subscription
      const userId = session.metadata?.userId

      if (!userId) {
        throw new Error('No user ID found in session metadata')
      }

      return {
        userId,
        subscriptionId: subscription.id,
        customerId: subscription.customer as string,
        tier: session.metadata?.tier,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        status: subscription.status
      }
    } catch (error) {
      throw new Error(`Failed to handle successful payment: ${error}`)
    }
  }

  /**
   * Create a billing portal session for subscription management
   */
  static async createBillingPortalSession(customerId: string, returnUrl: string): Promise<string> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      })

      return session.url
    } catch (error) {
      throw new Error(`Failed to create billing portal session: ${error}`)
    }
  }

  /**
   * Cancel subscription (immediate or at period end)
   */
  static async cancelSubscription(subscriptionId: string, immediate = false): Promise<void> {
    try {
      if (immediate) {
        await stripe.subscriptions.cancel(subscriptionId)
      } else {
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        })
      }
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error}`)
    }
  }

  /**
   * Get subscription usage for billing
   */
  static async getSubscriptionUsage(subscriptionId: string) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      const invoices = await stripe.invoices.list({
        subscription: subscriptionId,
        limit: 1
      })

      return {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        lastInvoice: invoices.data[0] || null
      }
    } catch (error) {
      throw new Error(`Failed to get subscription usage: ${error}`)
    }
  }

  /**
   * Validate webhook signature
   */
  static validateWebhook(payload: string | Buffer, signature: string): Stripe.Event {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
    }

    try {
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error}`)
    }
  }

  /**
   * Generate pricing table data for the frontend
   */
  static getPricingPlans() {
    return [
      {
        tier: 'FREE',
        name: 'Community Starter',
        price: 0,
        description: SUBSCRIPTION_LIMITS.FREE.description,
        features: [
          'Up to 50 participants',
          '5 events per month',
          'Basic voting system',
          'Room management',
          'QR code access',
          'Basic analytics'
        ],
        highlighted: false,
        stripePriceId: null
      },
      {
        tier: 'COMMUNITY',
        name: 'Community Pro',
        price: 19,
        description: SUBSCRIPTION_LIMITS.COMMUNITY.description,
        features: [
          'Up to 150 participants',
          '15 events per month',
          'All free features',
          'Custom branding',
          'Data export',
          'Email templates',
          'Advanced analytics'
        ],
        highlighted: true,
        stripePriceId: STRIPE_PRODUCTS.COMMUNITY.priceId
      },
      {
        tier: 'ORGANIZER',
        name: 'Professional',
        price: 49,
        description: SUBSCRIPTION_LIMITS.ORGANIZER.description,
        features: [
          'Up to 300 participants',
          '30 events per month',
          'All community features',
          'Multi-organizer support',
          'Attendee management',
          'Feedback collection',
          'Priority email support'
        ],
        highlighted: false,
        stripePriceId: STRIPE_PRODUCTS.ORGANIZER.priceId
      },
      {
        tier: 'UNLIMITED',
        name: 'Enterprise',
        price: 99,
        description: SUBSCRIPTION_LIMITS.UNLIMITED.description,
        features: [
          'Unlimited participants',
          'Unlimited events',
          'All professional features',
          'Custom domains',
          'White-label options',
          'API access',
          'Priority phone support'
        ],
        highlighted: false,
        stripePriceId: STRIPE_PRODUCTS.UNLIMITED.priceId
      }
    ]
  }
}
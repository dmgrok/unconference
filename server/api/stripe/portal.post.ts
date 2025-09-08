import { z } from 'zod'
import { StripeService } from '~/lib/stripe'
import prisma from '~/lib/database'

const portalSchema = z.object({
  returnUrl: z.string().url()
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
    const { returnUrl } = portalSchema.parse(body)

    const user = session.user as any
    
    // Get user's Stripe customer ID from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { customerId: true }
    })

    if (!dbUser?.customerId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No active subscription found'
      })
    }

    const portalUrl = await StripeService.createBillingPortalSession(
      dbUser.customerId,
      returnUrl
    )

    return {
      success: true,
      portalUrl
    }
  } catch (error: any) {
    console.error('Billing portal error:', error)
    
    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid request data',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to create billing portal session'
    })
  }
})
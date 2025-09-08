import { SubscriptionService } from '~/lib/subscription'

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

    // Get subscription details
    const details = await SubscriptionService.getSubscriptionDetails(session.user.id)
    
    if (!details) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    return details

  } catch (error) {
    console.error('Subscription details error:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch subscription details'
    })
  }
})
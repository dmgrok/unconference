import { SocialProfileService } from '~/lib/social-profile'

export default defineEventHandler(async (event) => {
  try {
    // Check authentication
    const session = await getUserSession(event)
    if (!session?.user?.id) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authentication required'
      })
    }

    const connectedAccounts = await SocialProfileService.getConnectedAccounts(session.user.id)
    const suggestions = await SocialProfileService.getImportSuggestions(session.user.id)

    return {
      connectedAccounts,
      suggestions
    }
  } catch (error: any) {
    console.error('Connected accounts error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch connected accounts'
    })
  }
})
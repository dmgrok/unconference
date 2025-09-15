import { SocialProfileService } from '~/lib/social-profile'
import { z } from 'zod'

const importSchema = z.object({
  provider: z.enum(['linkedin', 'twitter', 'github']),
  accessToken: z.string().optional() // Optional since we might store tokens
})

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

    const body = await readBody(event)
    const { provider, accessToken } = importSchema.parse(body)

    let result

    switch (provider) {
      case 'linkedin':
        if (!accessToken) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Access token required for LinkedIn import'
          })
        }
        result = await SocialProfileService.importLinkedInProfile(accessToken, session.user.id)
        break

      case 'twitter':
        if (!accessToken) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Access token required for Twitter import'
          })
        }
        result = await SocialProfileService.importTwitterProfile(accessToken, session.user.id)
        break

      case 'github':
        if (!accessToken) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Access token required for GitHub import'
          })
        }
        result = await SocialProfileService.importGitHubProfile(accessToken, session.user.id)
        break

      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Unsupported provider'
        })
    }

    return {
      success: true,
      provider,
      ...result
    }
  } catch (error: any) {
    console.error('Profile import error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to import profile'
    })
  }
})
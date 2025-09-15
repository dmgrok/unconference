import { SocialSharingService, shareContentSchema } from '~/lib/social-sharing'

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

    const eventId = getRouterParam(event, 'eventId')
    if (!eventId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Event ID is required'
      })
    }

    const body = await readBody(event)
    const { platform, template, customMessage, includeMetrics, includeHashtags } = shareContentSchema.parse(body)

    let content

    switch (platform) {
      case 'linkedin':
        content = await SocialSharingService.generateLinkedInPost(eventId, session.user.id, template, customMessage)
        break
      case 'twitter':
        content = await SocialSharingService.generateTwitterPost(eventId, session.user.id, template, customMessage)
        break
      case 'facebook':
        content = await SocialSharingService.generateFacebookPost(eventId, session.user.id, template, customMessage)
        break
      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Unsupported platform'
        })
    }

    // Generate share URL
    const shareUrl = SocialSharingService.generateShareUrls(content, platform)

    return {
      success: true,
      platform,
      template,
      content: {
        ...content,
        hashtags: includeHashtags ? content.hashtags : [],
        shareUrl
      }
    }
  } catch (error: any) {
    console.error('Social sharing error:', error)

    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Failed to generate share content'
    })
  }
})
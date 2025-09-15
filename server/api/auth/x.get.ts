import { AuthService } from '~/lib/auth'

export default defineOAuthXEventHandler({
  async onSuccess(event, { user: twitterUser, tokens }) {
    try {
      // Upsert user in database
      const user = await AuthService.upsertOAuthUser('twitter', {
        id: twitterUser.data?.id || twitterUser.id,
        email: twitterUser.data?.email || twitterUser.email,
        name: twitterUser.data?.name || twitterUser.name || twitterUser.data?.username,
        avatar: twitterUser.data?.profile_image_url || twitterUser.profile_image_url
      })

      // Create session
      const sessionUser = AuthService.createSessionUser(user)
      await setUserSession(event, {
        user: sessionUser,
        loggedInAt: new Date()
      })

      // Redirect to appropriate page
      const query = getQuery(event)
      const redirectUrl = query.redirect?.toString() || '/groups'

      return sendRedirect(event, redirectUrl)
    } catch (error: any) {
      console.error('Twitter OAuth error:', error)

      // Redirect to login with error
      return sendRedirect(event, '/login?error=oauth_failed')
    }
  },

  onError(event, error) {
    console.error('Twitter OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth_failed')
  }
})
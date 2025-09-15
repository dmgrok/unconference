import { AuthService } from '~/lib/auth'

export default defineOAuthLinkedInEventHandler({
  async onSuccess(event, { user: linkedinUser, tokens }) {
    try {
      // Upsert user in database
      const user = await AuthService.upsertOAuthUser('linkedin', {
        id: linkedinUser.sub,
        email: linkedinUser.email,
        name: linkedinUser.name,
        avatar: linkedinUser.picture
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
      console.error('LinkedIn OAuth error:', error)

      // Redirect to login with error
      return sendRedirect(event, '/login?error=oauth_failed')
    }
  },

  onError(event, error) {
    console.error('LinkedIn OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth_failed')
  }
})
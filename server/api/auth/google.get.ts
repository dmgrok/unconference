import { AuthService } from '~/lib/auth'

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user: googleUser, tokens }) {
    try {
      // Upsert user in database
      const user = await AuthService.upsertOAuthUser('google', {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture
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
      console.error('Google OAuth error:', error)
      
      // Redirect to login with error
      return sendRedirect(event, '/login?error=oauth_failed')
    }
  },
  
  onError(event, error) {
    console.error('Google OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth_failed')
  }
})
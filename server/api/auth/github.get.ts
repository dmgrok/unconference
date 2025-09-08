import { AuthService } from '~/lib/auth'

export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user: githubUser, tokens }) {
    try {
      // Upsert user in database
      const user = await AuthService.upsertOAuthUser('github', {
        id: githubUser.id,
        email: githubUser.email,
        name: githubUser.name || githubUser.login,
        avatar: githubUser.avatar_url
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
      console.error('GitHub OAuth error:', error)
      
      // Redirect to login with error
      return sendRedirect(event, '/login?error=oauth_failed')
    }
  },
  
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth_failed')
  }
})
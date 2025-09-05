import logger from '../../../utils/logger'
import { promises as fs } from 'fs'
import { join } from 'path'

export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user: githubUser, tokens }) {
    logger.info('GitHub OAuth success', { 
      login: githubUser.login, 
      email: githubUser.email, 
      name: githubUser.name 
    })
    
    try {
      // Check if user exists in our system
      const config = useRuntimeConfig()
      const usersFilePath = join(process.cwd(), config.usersFilePath)
      const platformUsersPath = join(process.cwd(), 'data', 'platform', 'users.json')
      
      let existingUsers = []
      let platformUsers = []
      
      // Read existing users
      try {
        const usersData = await fs.readFile(usersFilePath, 'utf-8')
        existingUsers = JSON.parse(usersData)
      } catch (error) {
        existingUsers = []
      }

      try {
        const platformData = await fs.readFile(platformUsersPath, 'utf-8')
        platformUsers = JSON.parse(platformData)
      } catch (error) {
        platformUsers = []
      }

      // Check if user already exists (by email or GitHub login)
      let user = existingUsers.find((u: any) => 
        (githubUser.email && u.Email.toLowerCase() === githubUser.email.toLowerCase()) ||
        u.Email.toLowerCase() === `${githubUser.login}@github.local`.toLowerCase()
      ) || platformUsers.find((u: any) => 
        (githubUser.email && u.email.toLowerCase() === githubUser.email.toLowerCase()) ||
        u.email.toLowerCase() === `${githubUser.login}@github.local`.toLowerCase()
      )

      if (!user) {
        // Create new user if doesn't exist
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const [firstName, ...lastNameParts] = (githubUser.name || githubUser.login || '').split(' ')
        const lastName = lastNameParts.join(' ') || ''
        const email = githubUser.email || `${githubUser.login}@github.local`

        // Create user object for legacy system
        const legacyUser = {
          id: userId,
          Email: email,
          Password: '', // OAuth users don't have passwords
          Firstname: firstName,
          Lastname: lastName,
          Role: 'User',
          GlobalRole: 'User',
          CreatedAt: new Date().toISOString(),
          IsActive: true,
          AuthProvider: 'github',
          GitHubLogin: githubUser.login
        }

        // Create user object for platform system
        const platformUser = {
          id: userId,
          name: githubUser.name || githubUser.login,
          email: email,
          globalRole: 'User',
          isGuest: false,
          createdAt: new Date(),
          lastLoginAt: new Date(),
          isActive: true,
          authProvider: 'github',
          githubLogin: githubUser.login
        }

        // Add to existing users arrays
        existingUsers.push(legacyUser)
        platformUsers.push(platformUser)

        // Ensure directories exist and write back to files
        await fs.mkdir(join(process.cwd(), 'data', 'platform'), { recursive: true })
        await fs.writeFile(usersFilePath, JSON.stringify(existingUsers, null, 2))
        await fs.writeFile(platformUsersPath, JSON.stringify(platformUsers, null, 2))

        user = legacyUser
        logger.info(`New GitHub user registered: ${email}`)
      } else {
        logger.info(`Existing GitHub user login: ${user.Email || user.email}`)
        
        // Update last login time for platform user
        const platformUserIndex = platformUsers.findIndex((u: any) => 
          (githubUser.email && u.email.toLowerCase() === githubUser.email.toLowerCase()) ||
          u.email.toLowerCase() === `${githubUser.login}@github.local`.toLowerCase()
        )
        if (platformUserIndex !== -1) {
          platformUsers[platformUserIndex].lastLoginAt = new Date()
          await fs.writeFile(platformUsersPath, JSON.stringify(platformUsers, null, 2))
        }
      }

      // Get pending event code and redirect from query parameters
      const query = getQuery(event)
      const pendingEventCode = query.state as string // OAuth state parameter can carry event code
      const pendingRedirect = query.redirect_uri as string

      // Set user session
      await setUserSession(event, {
        user: {
          id: user.id,
          name: user.Firstname ? `${user.Firstname} ${user.Lastname}` : user.name || githubUser.name || githubUser.login,
          email: user.Email || user.email,
          role: user.Role || user.globalRole || 'User',
          globalRole: user.GlobalRole || user.globalRole || 'User',
          pendingEventCode,
          pendingRedirect
        }
      })

      // Redirect to post-login handler for smart routing
      return sendRedirect(event, '/api/auth/post-login-redirect')
      
    } catch (error: any) {
      logger.error('Error during GitHub OAuth:', error)
      throw createError({
        statusCode: 500,
        statusMessage: 'Authentication failed'
      })
    }
  },
  
  onError(event, error) {
    logger.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/login?error=oauth_failed')
  }
})

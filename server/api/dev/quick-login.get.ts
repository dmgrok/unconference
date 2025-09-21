/**
 * Development Authentication Bypass
 * Simplifies testing by allowing quick login switches
 */
export default defineEventHandler(async (event) => {
  // Only allow in development
  const config = useRuntimeConfig()
  if (config.public.devMode !== true && process.env.NODE_ENV !== 'development') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Development mode only'
    })
  }

  const query = getQuery(event)
  const userType = query.as as string

  // Quick login as different user types for testing
  const testUsers = {
    'super-admin': {
      name: 'Super Admin',
      email: 'superadmin@unconference.com',
      role: 'Admin',
      globalRole: 'Admin'
    },
    'admin': {
      name: 'Darth Vader',
      email: 'darth.vader@starwars.com', 
      role: 'Admin',
      globalRole: 'User'
    },
    'organizer': {
      name: 'Luke Skywalker',
      email: 'organizer@example.com',
      role: 'Organizer',
      globalRole: 'User' 
    },
    'user': {
      name: 'Storm Trooper',
      email: 'storm.trooper@starwars.com',
      role: 'User',
      globalRole: 'User'
    },
    'guest': {
      name: 'Guest User',
      email: 'guest@unconference.com',
      role: 'User',
      globalRole: 'User',
      isGuest: true
    }
  }

  if (!userType || !testUsers[userType]) {
    return {
      available: Object.keys(testUsers),
      usage: 'Use ?as=user-type (e.g., ?as=admin)',
      message: 'Development authentication bypass'
    }
  }

  const userData = testUsers[userType]
  
  // Set user session
  await setUserSession(event, {
    user: {
      id: `test-${userType}-${Date.now()}`,
      ...userData,
      currentEventId: query.eventId || 'test-event-001'
    },
    loggedInAt: new Date()
  })

  // Redirect to dashboard or specified page
  const redirectTo = query.redirect as string || '/dashboard'
  
  return sendRedirect(event, redirectTo)
})

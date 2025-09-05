import { monitoringService } from '../utils/monitoringService'

export default defineEventHandler(async (event) => {
  // Skip middleware for static assets
  const url = getRequestURL(event).pathname
  if (url.startsWith('/_nuxt') || url.startsWith('/favicon') || url.startsWith('/__') || url.endsWith('.js') || url.endsWith('.css')) {
    return
  }

  // Track request start
  monitoringService.trackRequestStart(event)

  // Track user activity if user is authenticated and it's an API call
  if (url.startsWith('/api/')) {
    try {
      const { user } = await getUserSession(event)
      if (user) {
        const action = `${getMethod(event).toLowerCase()}_${url.split('/').pop() || 'unknown'}`
        const eventId = getQuery(event).eventId as string || undefined
        const userId = (user as any).id || (user as any).email || 'unknown'
        monitoringService.trackUserActivity(userId, action, event, eventId)
      }
    } catch {
      // User not authenticated or session error - ignore
    }
  }
})

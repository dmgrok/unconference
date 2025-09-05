import { securityService } from '../utils/securityService'
import { monitoringService } from '../utils/monitoringService'
import logger from '../../utils/logger'

export default defineEventHandler(async (event) => {
  // Skip middleware for static assets and internal routes
  const url = getRequestURL(event).pathname
  if (url.startsWith('/_nuxt') || url.startsWith('/favicon') || url.startsWith('/__') || url.endsWith('.js') || url.endsWith('.css')) {
    return
  }

  const startTime = Date.now()
  const ip = securityService.getClientIP(event)
  const method = getMethod(event)

  try {
    // 1. Check if IP is blocked
    if (securityService.isBlocked(ip)) {
      logger.warn(`Blocked request from IP: ${ip}`)
      throw createError({
        statusCode: 403,
        statusMessage: 'Access denied'
      })
    }

    // 2. Set security headers
    securityService.setSecurityHeaders(event)

    // 3. Rate limiting (different limits for different endpoints)
    // More lenient in development mode
    let maxRequests = process.env.NODE_ENV === 'development' ? 1000 : 100
    let windowMs = 60000

    if (url.includes('/api/auth/')) {
      maxRequests = process.env.NODE_ENV === 'development' ? 100 : 10  // Stricter for auth endpoints
      windowMs = 60000
    } else if (url.includes('/api/topics/') && method === 'POST') {
      maxRequests = process.env.NODE_ENV === 'development' ? 200 : 20  // Voting endpoints
      windowMs = 60000
    } else if (url.includes('/api/admin/') || url.includes('/api/super-admin/')) {
      maxRequests = process.env.NODE_ENV === 'development' ? 2000 : 200  // Higher limit for admin endpoints
      windowMs = 60000
    }

    // In development, only warn about rate limits instead of blocking
    if (process.env.NODE_ENV === 'development') {
      if (!securityService.checkRateLimit(event, maxRequests, windowMs)) {
        logger.warn(`Rate limit exceeded for ${ip} on ${url} - allowing in development mode`)
        // Don't throw error in development
      }
    } else {
      if (!securityService.checkRateLimit(event, maxRequests, windowMs)) {
        throw createError({
          statusCode: 429,
          statusMessage: 'Too many requests'
        })
      }
    }

    // 4. Validate request size for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentLength = getHeader(event, 'content-length')
      if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB limit
        securityService.flagSuspiciousActivity(ip, 'large_payload')
        throw createError({
          statusCode: 413,
          statusMessage: 'Payload too large'
        })
      }
    }

    // 5. Basic input validation and sanitization
    if (method !== 'GET') {
      try {
        const body = await readBody(event).catch(() => null)
        if (body) {
          // Validate payload size
          if (!securityService.validatePayload(body)) {
            throw createError({
              statusCode: 400,
              statusMessage: 'Invalid payload'
            })
          }

          // Sanitize input
          const sanitizedBody = securityService.sanitizeInput(body)
          // Store sanitized body for the handler
          event.context.sanitizedBody = sanitizedBody
        }
      } catch (error: any) {
        if (error.statusCode) throw error
        logger.warn(`Invalid request body from IP: ${ip}`)
        securityService.flagSuspiciousActivity(ip, 'invalid_body')
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid request format'
        })
      }
    }

    // 6. Track request start for monitoring
    monitoringService.trackRequestStart(event)

    // 7. Log security events
    if (url.includes('/api/auth/') || url.includes('/api/admin/') || url.includes('/api/super-admin/')) {
      logger.info(`Security-sensitive request: ${method} ${url} from ${ip}`)
    }

  } catch (error: any) {
    const endTime = Date.now()
    const responseTime = endTime - startTime

    // Track failed request
    monitoringService.trackRequestEnd(event, error.statusCode || 500, error.statusMessage)

    // Log security incident
    logger.warn(`Security middleware blocked request: ${method} ${url} from ${ip} - ${error.statusMessage}`)

    throw error
  }
})

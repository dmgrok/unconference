import crypto from 'crypto'

const CSRF_TOKEN_HEADER = 'x-csrf-token'
const CSRF_COOKIE_NAME = 'csrf-token'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event).pathname
  const method = getMethod(event)

  // Skip CSRF protection for GET requests and static assets
  if (method === 'GET' || url.startsWith('/_nuxt') || url.startsWith('/favicon') || url.startsWith('/__')) {
    return
  }

  // Skip for auth endpoints (they have their own protection)
  if (url.includes('/api/auth/')) {
    return
  }

  // Skip CSRF in development mode to avoid blocking legitimate requests
  if (process.env.NODE_ENV === 'development') {
    // Still generate tokens for testing, but don't enforce
    const newToken = crypto.randomBytes(32).toString('hex')
    setCookie(event, CSRF_COOKIE_NAME, newToken, {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24
    })
    return
  }

  try {
    // Get CSRF token from header and cookie
    const headerToken = getHeader(event, CSRF_TOKEN_HEADER)
    const cookieToken = getCookie(event, CSRF_COOKIE_NAME)

    // For API endpoints that modify data, require CSRF token in production
    if (url.startsWith('/api/') && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      if (!headerToken || !cookieToken || headerToken !== cookieToken) {
        // In production, block the request
        if (process.env.NODE_ENV === 'production') {
          throw createError({
            statusCode: 403,
            statusMessage: 'Invalid CSRF token'
          })
        }
        // In development, just warn but allow
        console.warn(`CSRF token missing or invalid for ${method} ${url} - allowing in development mode`)
      }
    }

    // Generate new CSRF token for the next request
    const newToken = crypto.randomBytes(32).toString('hex')
    setCookie(event, CSRF_COOKIE_NAME, newToken, {
      httpOnly: false, // Allow JS access for client-side requests
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

  } catch (error) {
    // Log CSRF violation
    const ip = getHeader(event, 'x-forwarded-for') || 
               getHeader(event, 'x-real-ip') || 
               'unknown'
    
    console.warn(`CSRF violation from IP: ${ip}, URL: ${url}, Method: ${method}`)
    throw error
  }
})

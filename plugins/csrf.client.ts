export default defineNuxtPlugin(() => {
  // Set up global request interceptor for CSRF protection
  if (import.meta.client) {
    const getCSRFToken = (): string | null => {
      return useCookie('csrf-token').value || null
    }

    const setCSRFHeader = (headers: any = {}): any => {
      const token = getCSRFToken()
      if (token && process.env.NODE_ENV === 'production') {
        headers['x-csrf-token'] = token
      }
      return headers
    }

    // Override the global $fetch to include CSRF headers only in production
    if (process.env.NODE_ENV === 'production') {
      globalThis.$fetch = $fetch.create({
        onRequest({ request, options }) {
          // Add CSRF token to headers for modifying requests in production
          if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
            options.headers = setCSRFHeader(options.headers || {})
          }
        }
      })
    }
  }
})

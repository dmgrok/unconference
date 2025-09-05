// Security configuration for the unconference application
export const securityConfig = {
  // Environment-based settings
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // CSRF Protection
  csrf: {
    enabled: process.env.NODE_ENV === 'production',
    cookieName: 'csrf-token',
    headerName: 'x-csrf-token',
    tokenLength: 32
  },
  
  // Rate Limiting Configuration
  rateLimiting: {
    enabled: true,
    // More lenient in development, strict in production
    limits: {
      development: {
        general: 1000,      // requests per minute
        auth: 100,         // auth endpoints
        voting: 200,       // voting endpoints  
        admin: 2000        // admin endpoints
      },
      production: {
        general: 100,      // requests per minute
        auth: 10,          // auth endpoints
        voting: 20,        // voting endpoints
        admin: 200         // admin endpoints
      }
    },
    windowMs: 60000,      // 1 minute window
    blockAfterViolations: 5
  },
  
  // Input Validation
  validation: {
    maxPayloadSize: 1024 * 1024,  // 1MB
    sanitizeInput: true,
    removeScripts: true
  },
  
  // Security Headers
  headers: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  },
  
  // Session Security
  session: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000  // 24 hours
  },
  
  // Monitoring
  monitoring: {
    enabled: true,
    maxActivitiesHistory: 1000,
    autoRefreshInterval: 30000,  // 30 seconds
    exportEnabled: true
  }
}

// Helper functions
export const getSecurityConfig = () => securityConfig

export const getRateLimit = (endpointType: 'general' | 'auth' | 'voting' | 'admin') => {
  const env = securityConfig.isDevelopment ? 'development' : 'production'
  return securityConfig.rateLimiting.limits[env][endpointType]
}

export const isSecurityEnabled = (feature: 'csrf' | 'rateLimiting') => {
  if (feature === 'csrf') {
    return securityConfig.csrf.enabled
  }
  if (feature === 'rateLimiting') {
    return securityConfig.rateLimiting.enabled
  }
  return false
}

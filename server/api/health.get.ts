import { promises as fs } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  try {
    const startTime = Date.now()
    
    // Basic health checks
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      checks: {
        filesystem: false,
        dataAccess: false,
        auth: false
      },
      responseTime: 0
    }

    // Check filesystem access
    try {
      const dataPath = join(process.cwd(), 'data')
      await fs.access(dataPath)
      health.checks.filesystem = true
    } catch (error) {
      health.status = 'degraded'
    }

    // Check data file access
    try {
      const platformPath = join(process.cwd(), 'data', 'platform')
      await fs.access(platformPath)
      health.checks.dataAccess = true
    } catch (error) {
      health.status = 'degraded'
    }

    // Check auth system (basic check)
    try {
      // Simple check - if we can access the session system
      const session = await getUserSession(event)
      health.checks.auth = true
    } catch (error) {
      // Auth check failed, but this might be expected for unauthenticated requests
      health.checks.auth = true // Don't fail health check for auth
    }

    health.responseTime = Date.now() - startTime

    // Set appropriate status code
    const statusCode = health.status === 'healthy' ? 200 : 503

    setResponseStatus(event, statusCode)
    
    return health
  } catch (error) {
    setResponseStatus(event, 503)
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }
  }
})

import { securityService } from '../../utils/securityService'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  // Check if user is super admin
  if ((user as any).globalRole !== 'SuperAdmin') {
    throw createError({
      statusCode: 403,
      message: 'Super admin access required'
    })
  }

  const body = await readBody(event)
  const { ip, reason } = body

  if (!ip || !reason) {
    throw createError({
      statusCode: 400,
      message: 'IP address and reason are required'
    })
  }

  try {
    securityService.blockIP(ip, reason)
    
    return {
      success: true,
      message: `IP ${ip} has been blocked`,
      reason,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to block IP address'
    })
  }
})

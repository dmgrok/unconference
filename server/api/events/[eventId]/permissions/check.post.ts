export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'eventId')
  const body = await readBody(event)
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'Event ID is required'
    })
  }

  const { resource, action } = body
  
  if (!resource || !action) {
    throw createError({
      statusCode: 400,
      message: 'Resource and action are required'
    })
  }

  try {
    // Import and use the permission helper
    const { requireEventPermission } = await import('../../../../utils/authService')
    
    // This will throw if user doesn't have permission
    await requireEventPermission(event, eventId, resource, action)
    
    return {
      success: true,
      hasPermission: true
    }
  } catch (error: any) {
    if (error.statusCode === 403) {
      return {
        success: true,
        hasPermission: false
      }
    }
    throw error
  }
})

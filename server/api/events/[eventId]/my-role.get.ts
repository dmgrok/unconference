export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'eventId')
  const { user } = await requireUserSession(event)
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'Event ID is required'
    })
  }

  try {
    const { eventService } = await import('../../../utils/eventService')
    const userId = (user as any).id || (user as any).email
    const role = await eventService.getUserRoleInEvent(userId, eventId)
    
    return {
      success: true,
      role: role,
      eventId: eventId
    }
  } catch (error) {
    return {
      success: true,
      role: null,
      eventId: eventId
    }
  }
})

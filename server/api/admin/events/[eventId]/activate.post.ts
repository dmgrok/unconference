import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const eventId = getRouterParam(event, 'eventId')
  
  // Check if user is super admin
  if ((user as any).globalRole !== 'Admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Super admin access required'
    })
  }

  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID is required'
    })
  }

  try {
    const platformBasePath = join(process.cwd(), 'data', 'platform')
    const eventsPath = join(platformBasePath, 'events.json')
    
    // Load events
    let events = []
    try {
      const eventsData = await fs.readFile(eventsPath, 'utf-8')
      events = JSON.parse(eventsData)
    } catch {
      throw createError({
        statusCode: 404,
        statusMessage: 'Events not found'
      })
    }

    // Find and activate the event
    const eventIndex = events.findIndex((e: any) => e.id === eventId)
    if (eventIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }

    // Update event status
    events[eventIndex].isActive = true
    if (events[eventIndex].suspendedAt) {
      delete events[eventIndex].suspendedAt
      delete events[eventIndex].suspendedBy
    }
    events[eventIndex].reactivatedAt = new Date().toISOString()
    events[eventIndex].reactivatedBy = (user as any).id

    // Save updated events
    await fs.writeFile(eventsPath, JSON.stringify(events, null, 2))

    logger.info(`Event ${eventId} activated by super admin ${(user as any).email}`)

    return {
      success: true,
      message: 'Event activated successfully'
    }

  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    logger.error('Error activating event:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to activate event'
    })
  }
})

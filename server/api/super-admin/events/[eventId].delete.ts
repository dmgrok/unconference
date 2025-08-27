import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const eventId = getRouterParam(event, 'eventId')
  
  // Check if user is super admin
  if ((user as any).globalRole !== 'SuperAdmin') {
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

    // Find the event
    const eventIndex = events.findIndex((e: any) => e.id === eventId)
    if (eventIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }

    const eventToDelete = events[eventIndex]

    // Remove event from events list
    events.splice(eventIndex, 1)
    await fs.writeFile(eventsPath, JSON.stringify(events, null, 2))

    // Remove event memberships
    const membershipsPath = join(platformBasePath, 'memberships.json')
    try {
      const membershipsData = await fs.readFile(membershipsPath, 'utf-8')
      let memberships = JSON.parse(membershipsData)
      memberships = memberships.filter((m: any) => m.eventId !== eventId)
      await fs.writeFile(membershipsPath, JSON.stringify(memberships, null, 2))
    } catch {
      // No memberships file
    }

    // Remove event data directory
    const eventDataPath = join(process.cwd(), 'data', 'events', eventId)
    try {
      await fs.rmdir(eventDataPath, { recursive: true })
    } catch {
      // Directory might not exist
    }

    logger.info(`Event ${eventId} (${eventToDelete.name}) deleted by super admin ${(user as any).email}`)
    
    return {
      success: true,
      message: 'Event deleted successfully'
    }
  } catch (error) {
    logger.error('Error deleting event:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete event'
    })
  }
})

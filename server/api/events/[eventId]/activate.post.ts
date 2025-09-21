import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../utils/logger'
import { eventService } from '../../../../utils/eventService'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID is required'
    })
  }

  const userId = (user as any).id || (user as any).email

  try {
    // Check if user is organizer of this event or super admin
    const userRole = await eventService.getUserRoleInEvent(userId, eventId)
    const isAdmin = (user as any).globalRole === 'Admin'
    
    if (userRole !== 'Organizer' && !isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only event organizers can activate their events'
      })
    }

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
    events[eventIndex].activatedAt = new Date().toISOString()
    events[eventIndex].activatedBy = userId
    events[eventIndex].updatedAt = new Date().toISOString()

    // Save updated events
    await fs.writeFile(eventsPath, JSON.stringify(events, null, 2))

    logger.info(`Event ${eventId} activated by ${isAdmin ? 'admin' : 'organizer'} ${(user as any).email}`)

    return {
      success: true,
      message: 'Event activated successfully',
      event: events[eventIndex]
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

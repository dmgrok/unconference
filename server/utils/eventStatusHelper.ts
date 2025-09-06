import { eventService } from '../../utils/eventService'
import logger from '../../utils/logger'

/**
 * Check if an event is active and allow actions
 * @param eventId - The event ID to check
 * @returns Object with isActive status and reason if inactive
 */
export async function checkEventStatus(eventId: string) {
  try {
    const eventDetails = await eventService.getEvent(eventId)
    
    if (!eventDetails) {
      return {
        isActive: false,
        reason: 'Event not found',
        statusCode: 404
      }
    }

    const isActive = (eventDetails as any).isActive ?? true
    let reason = ''
    let statusCode = 403

    if (!isActive) {
      if ((eventDetails as any).suspendedAt) {
        reason = 'Event was suspended by an administrator'
      } else if ((eventDetails as any).closedAt) {
        reason = 'Event was closed by an organizer'
      } else {
        reason = 'Event is currently inactive'
      }
    }

    return {
      isActive,
      reason,
      statusCode
    }
  } catch (error) {
    logger.error(`Failed to check event status for ${eventId}:`, error)
    return {
      isActive: false,
      reason: 'Failed to verify event status',
      statusCode: 500
    }
  }
}

/**
 * Middleware function to require an active event
 * Throws an error if the event is not active
 */
export async function requireActiveEvent(eventId: string) {
  const { isActive, reason, statusCode } = await checkEventStatus(eventId)
  
  if (!isActive) {
    throw createError({
      statusCode,
      statusMessage: `Cannot perform this action: ${reason}`
    })
  }
}

import logger from '../../../utils/logger'
import { eventService } from '../../../utils/eventService'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required'
    })
  }

  const userId = (user as any).id || (user as any).email
  const pendingEventCode = (user as any).pendingEventCode
  const pendingRedirect = (user as any).pendingRedirect
  
  try {
    // Clear pending data from session
    await setUserSession(event, {
      user: {
        ...(user as any),
        pendingEventCode: undefined,
        pendingRedirect: undefined
      }
    })

    // If there's a specific redirect, use it
    if (pendingRedirect) {
      return {
        redirect: pendingRedirect,
        reason: 'custom_redirect'
      }
    }

    // If there's a pending event code, try to join/switch to that event
    if (pendingEventCode) {
      try {
        const eventData = await eventService.getEventByCode(pendingEventCode)
        if (eventData) {
          // Check if user is already a member
          const existingRole = await eventService.getUserRoleInEvent(userId, eventData.id)
          
          if (!existingRole) {
            // Add user as participant
            await eventService.addEventMembership(eventData.id, userId, 'Participant')
            logger.info(`User ${userId} joined event ${eventData.id} via code ${pendingEventCode}`)
          }
          
          // Set current event context
          await setUserSession(event, {
            user: {
              ...(user as any),
              currentEventId: eventData.id
            }
          })
          
          return {
            redirect: `/voting?eventId=${eventData.id}`,
            reason: 'event_code_join',
            eventName: eventData.name
          }
        }
      } catch (error) {
        logger.warn(`Failed to join event with code ${pendingEventCode}:`, error)
        // Continue with normal logic if event join fails
      }
    }

    // Get user's events to determine best redirect
    const userEvents = await eventService.getUserEvents(userId)
    
    if (userEvents.length === 0) {
      // No events - redirect to events page to join or create
      return {
        redirect: '/events',
        reason: 'no_events'
      }
    } else if (userEvents.length === 1) {
      // Single event - go directly to it
      const singleEvent = userEvents[0]
      await setUserSession(event, {
        user: {
          ...(user as any),
          currentEventId: singleEvent.id
        }
      })
      
      return {
        redirect: `/voting?eventId=${singleEvent.id}`,
        reason: 'single_event',
        eventName: singleEvent.name
      }
    } else {
      // Multiple events - let user choose
      return {
        redirect: '/events',
        reason: 'multiple_events'
      }
    }
    
  } catch (error) {
    logger.error('Error determining post-login redirect:', error)
    
    // Fallback to voting page
    return {
      redirect: '/voting',
      reason: 'fallback'
    }
  }
})

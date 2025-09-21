import { z } from 'zod'
import logger from '../../../utils/logger'
import { randomBytes } from 'crypto'
import { eventService } from "../../../utils/eventService"

const bodySchema = z.object({
  eventCode: z.string().min(4).max(8),
  name: z.string().min(1).max(50).optional()
})

function generateGuestName(): string {
  const adjectives = [
    'Creative', 'Curious', 'Thoughtful', 'Innovative', 'Bright', 'Smart',
    'Dynamic', 'Energetic', 'Focused', 'Inspiring', 'Motivated', 'Passionate'
  ]
  const nouns = [
    'Thinker', 'Contributor', 'Participant', 'Explorer', 'Learner', 'Builder',
    'Creator', 'Designer', 'Developer', 'Leader', 'Innovator', 'Visionary'
  ]
  
  const randomId = randomBytes(3).toString('hex').toUpperCase()
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  
  return `${adjective} ${noun} ${randomId}`
}

export default defineEventHandler(async (event) => {
  const { eventCode, name } = await readValidatedBody(event, bodySchema.parse)
  
  // Special case for super admin testing - bypass event validation
  if (eventCode.toUpperCase() === 'SUPERADMIN' || eventCode.toUpperCase() === 'TESTADMIN') {
    const guestName = name || generateGuestName()
    const guestEmail = `guest_${randomBytes(8).toString('hex')}@unconference.guest`
    
    logger.info(`Super Admin test access granted for: ${guestName}`)
    
    await setUserSession(event, {
      user: {
        id: guestEmail,
        name: 'Super Admin Test User',
        email: guestEmail,
        role: 'Admin',
        globalRole: 'Admin',
        isGuest: true,
        eventCode: eventCode.toUpperCase(),
        currentEventId: 'test-event'
      }
    })
    
    return {
      success: true,
      user: {
        name: 'Super Admin Test User',
        email: guestEmail,
        role: 'Admin',
        globalRole: 'Admin',
        eventCode: eventCode.toUpperCase(),
        eventId: 'test-event',
        eventName: 'Super Admin Test Event'
      }
    }
  }
  
  // Verify event code exists using event service
  const eventData = await eventService.getEventByCode(eventCode)
  if (!eventData) {
    throw createError({
      statusCode: 404,
      message: 'Invalid event code'
    })
  }

  // Check if event allows guest access
  if (!eventData.settings.allowGuestAccess) {
    throw createError({
      statusCode: 403,
      message: 'Guest access is not allowed for this event'
    })
  }

  // Generate guest user name if not provided
  const guestName = name || generateGuestName()
  const guestEmail = `guest_${randomBytes(8).toString('hex')}@unconference.guest`
  
  logger.info(`Guest user joining: ${guestName} (${guestEmail}) for event: ${eventData.name} (${eventCode})`)
  
  // Add guest membership to event
  const guestId = guestEmail
  await eventService.addEventMembership(eventData.id, guestId, 'Participant')
  
  // Set the user session with event context
  await setUserSession(event, {
    user: {
      id: guestId,
      name: guestName,
      email: guestEmail,
      role: 'Guest',
      isGuest: true,
      eventCode: eventCode.toUpperCase(),
      currentEventId: eventData.id
    }
  })
  
  return {
    success: true,
    user: {
      name: guestName,
      email: guestEmail,
      role: 'Guest',
      eventCode: eventCode.toUpperCase(),
      eventId: eventData.id,
      eventName: eventData.name
    }
  }
})
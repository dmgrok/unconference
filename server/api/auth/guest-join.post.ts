import { z } from 'zod'
import logger from '../../../utils/logger'
import { randomBytes } from 'crypto'

const bodySchema = z.object({
  eventCode: z.string().min(4).max(8),
  name: z.string().min(1).max(50).optional()
})

// Simple in-memory store for event codes (in production, use database)
const eventCodes = new Map<string, { name: string, created: Date }>()

// Initialize with a default event code for development
if (!eventCodes.has('DEMO2024')) {
  eventCodes.set('DEMO2024', {
    name: 'Demo Unconference 2024',
    created: new Date()
  })
}

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
  
  // Verify event code exists
  const eventInfo = eventCodes.get(eventCode.toUpperCase())
  if (!eventInfo) {
    throw createError({
      statusCode: 404,
      message: 'Invalid event code'
    })
  }

  // Generate guest user name if not provided
  const guestName = name || generateGuestName()
  const guestEmail = `guest_${randomBytes(8).toString('hex')}@unconference.guest`
  
  logger.info(`Guest user joining: ${guestName} (${guestEmail}) with event code: ${eventCode}`)
  
  // Set the user session
  await setUserSession(event, {
    user: {
      name: guestName,
      email: guestEmail,
      role: 'Guest',
      isGuest: true,
      eventCode: eventCode.toUpperCase()
    }
  })
  
  return {
    success: true,
    user: {
      name: guestName,
      email: guestEmail,
      role: 'Guest',
      eventCode: eventCode.toUpperCase()
    }
  }
})
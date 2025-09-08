import { AuthService } from '~/lib/auth'
import { z } from 'zod'

const guestSchema = z.object({
  eventCode: z.string().min(4, 'Event code must be at least 4 characters')
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { eventCode } = guestSchema.parse(body)

    // Create guest user and join event
    const guestUser = await AuthService.createGuestUser(eventCode)

    // Create session
    await setUserSession(event, {
      user: guestUser,
      loggedInAt: new Date()
    })

    return {
      success: true,
      user: guestUser,
      message: 'Joined event as guest'
    }
  } catch (error: any) {
    console.error('Guest join error:', error)

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to join event as guest'
    })
  }
})
import { z } from 'zod'

const bodySchema = z.object({
  eventId: z.string()
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const { eventId } = await readValidatedBody(event, bodySchema.parse)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Authentication required'
    })
  }

  try {
    // Update user session with current event
    await setUserSession(event, {
      user: {
        ...(user as any),
        currentEventId: eventId
      }
    })
    
    return {
      success: true,
      currentEventId: eventId
    }
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: 'Failed to set current event'
    })
  }
})

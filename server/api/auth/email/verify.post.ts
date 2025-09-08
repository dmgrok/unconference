import { AuthService, verifyEmailSchema } from '~/lib/auth'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const validData = verifyEmailSchema.parse(body)

    // Verify email with PIN
    const user = await AuthService.verifyEmail(validData)

    // Create session
    await setUserSession(event, {
      user,
      loggedInAt: new Date()
    })

    return {
      success: true,
      user,
      message: 'Email verified successfully! Welcome to Unconference.'
    }
  } catch (error: any) {
    console.error('Email verification error:', error)

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Email verification failed'
    })
  }
})
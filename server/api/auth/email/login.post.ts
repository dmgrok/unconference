import { AuthService, loginSchema } from '~/lib/auth'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const validData = loginSchema.parse(body)

    // Authenticate user
    const user = await AuthService.authenticate(validData)

    // Create session
    const sessionUser = AuthService.createSessionUser(user)
    await setUserSession(event, {
      user: sessionUser,
      loggedInAt: new Date()
    })

    return {
      success: true,
      user: sessionUser,
      message: 'Login successful'
    }
  } catch (error: any) {
    console.error('Login error:', error)

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 401,
      statusMessage: error.message || 'Authentication failed'
    })
  }
})
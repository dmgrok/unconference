import { AuthService, registerSchema } from '~/lib/auth'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const validData = registerSchema.parse(body)

    // Register user (sends PIN to email)
    const result = await AuthService.register(validData)

    return {
      success: true,
      ...result
    }
  } catch (error: any) {
    console.error('Registration error:', error)

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Registration failed'
    })
  }
})
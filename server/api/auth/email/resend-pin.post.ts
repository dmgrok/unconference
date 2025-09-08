import { AuthService } from '~/lib/auth'
import { z } from 'zod'

const resendSchema = z.object({
  email: z.string().email('Invalid email address')
})

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { email } = resendSchema.parse(body)

    const result = await AuthService.resendVerificationPin(email)

    return {
      success: true,
      ...result
    }
  } catch (error: any) {
    console.error('Resend PIN error:', error)

    if (error.name === 'ZodError') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Validation error',
        data: error.errors
      })
    }

    throw createError({
      statusCode: 400,
      statusMessage: error.message || 'Failed to resend PIN'
    })
  }
})
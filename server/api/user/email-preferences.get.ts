import prisma from '~/lib/database'
import { parseEmailPreferences, getEmailPreferenceLabels, getEmailPreferenceDescriptions } from '~/lib/emailPreferences'

const db = prisma as any

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  // TODO: Add authentication to get current user ID
  // For now, we'll use a query parameter for testing
  const query = getQuery(event)
  const { userId } = query

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required'
    })
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId as string },
      select: {
        id: true,
        email: true,
        name: true,
        emailPreferences: true
      }
    })

    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    const preferences = parseEmailPreferences(user.emailPreferences)
    const labels = getEmailPreferenceLabels()
    const descriptions = getEmailPreferenceDescriptions()

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      preferences,
      metadata: {
        labels,
        descriptions
      }
    }

  } catch (error) {
    console.error('Failed to get email preferences:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve email preferences'
    })
  }
})
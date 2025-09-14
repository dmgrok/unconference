import prisma from '~/lib/database'
import { parseEmailPreferences, serializeEmailPreferences, type EmailPreferences } from '~/lib/emailPreferences'

const db = prisma as any

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const body = await readBody(event)

  if (method !== 'PUT') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  // TODO: Add authentication to get current user ID
  // For now, we'll use body parameter for testing
  const { userId, preferences } = body

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required'
    })
  }

  if (!preferences || typeof preferences !== 'object') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Valid preferences object is required'
    })
  }

  try {
    // Validate that user exists
    const existingUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, emailPreferences: true }
    })

    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Parse current preferences and merge with updates
    const currentPreferences = parseEmailPreferences(existingUser.emailPreferences)
    const updatedPreferences: EmailPreferences = {
      eventSummaries: preferences.eventSummaries ?? currentPreferences.eventSummaries,
      collaborationReminders: preferences.collaborationReminders ?? currentPreferences.collaborationReminders,
      networkingFollowUp: preferences.networkingFollowUp ?? currentPreferences.networkingFollowUp,
      weeklyDigest: preferences.weeklyDigest ?? currentPreferences.weeklyDigest,
      eventInvitations: preferences.eventInvitations ?? currentPreferences.eventInvitations
    }

    // Validate boolean values
    for (const [key, value] of Object.entries(updatedPreferences)) {
      if (typeof value !== 'boolean') {
        throw createError({
          statusCode: 400,
          statusMessage: `Invalid value for ${key}: must be boolean`
        })
      }
    }

    // Update user preferences
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        emailPreferences: serializeEmailPreferences(updatedPreferences),
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        emailPreferences: true,
        updatedAt: true
      }
    })

    return {
      success: true,
      message: 'Email preferences updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        updatedAt: updatedUser.updatedAt
      },
      preferences: updatedPreferences
    }

  } catch (error) {
    console.error('Failed to update email preferences:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update email preferences'
    })
  }
})
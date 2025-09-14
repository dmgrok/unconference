import prisma from '~/lib/database'
import { emailQueue } from '~/lib/emailQueue'
import { canSendEmail, parseEmailPreferences } from '~/lib/emailPreferences'

const db = prisma as any

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const { eventId } = getRouterParams(event)
  const body = await readBody(event)

  if (method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  // TODO: Add authentication check for admin/organizer role
  // For now, we'll assume this is behind proper authentication

  try {
    const { sendToAll = false, userIds = [] } = body

    // Get event details to validate it exists and is completed
    const eventDetails = await db.event.findUnique({
      where: { id: eventId },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                emailPreferences: true,
                isActive: true,
                isEmailVerified: true
              }
            }
          }
        }
      }
    })

    if (!eventDetails) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }

    // Determine which users should receive summaries
    let targetUsers = []

    if (sendToAll) {
      // Send to all event participants who have opted in
      targetUsers = eventDetails.memberships
        .map((membership: any) => membership.user)
        .filter((user: any) => {
          return (
            user.isActive &&
            user.isEmailVerified &&
            canSendEmail(user.emailPreferences, 'eventSummaries')
          )
        })
    } else if (userIds.length > 0) {
      // Send to specific users
      const specificUsers = await db.user.findMany({
        where: {
          id: { in: userIds },
          eventMemberships: {
            some: { eventId }
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          emailPreferences: true,
          isActive: true,
          isEmailVerified: true
        }
      })

      targetUsers = specificUsers.filter((user: any) => {
        return (
          user.isActive &&
          user.isEmailVerified &&
          canSendEmail(user.emailPreferences, 'eventSummaries')
        )
      })
    } else {
      throw createError({
        statusCode: 400,
        statusMessage: 'Either sendToAll must be true or userIds must be provided'
      })
    }

    if (targetUsers.length === 0) {
      return {
        success: true,
        message: 'No eligible users found for sending summaries',
        emailsQueued: 0,
        skippedUsers: 0
      }
    }

    // Add email jobs to the queue
    const participants = targetUsers.map((user: any) => ({
      email: user.email,
      userId: user.id
    }))

    const jobIds = await emailQueue.addEventSummaryBatch(eventId, participants)

    // Log the batch sending activity
    console.log(`Queued ${jobIds.length} event summary emails for event ${eventId}`)

    return {
      success: true,
      message: `Successfully queued ${jobIds.length} event summary emails`,
      emailsQueued: jobIds.length,
      skippedUsers: eventDetails.memberships.length - targetUsers.length,
      eventName: eventDetails.title,
      jobIds
    }

  } catch (error) {
    console.error('Failed to send event summaries:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to queue event summary emails'
    })
  }
})
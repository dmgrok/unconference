import { emailQueue } from '~/lib/emailQueue'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  // TODO: Add authentication check for admin role
  // For now, we'll assume this is behind proper authentication

  try {
    const status = emailQueue.getStatus()
    const failedJobs = emailQueue.getFailedJobs()

    return {
      success: true,
      queue: {
        ...status,
        failedJobsCount: failedJobs.length,
        recentFailedJobs: failedJobs.slice(-5).map(job => ({
          id: job.id,
          type: job.type,
          recipientEmail: job.recipientEmail,
          attempts: job.attempts,
          lastAttemptAt: job.lastAttemptAt,
          errorMessage: job.errorMessage
        }))
      }
    }

  } catch (error) {
    console.error('Failed to get email queue status:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve queue status'
    })
  }
})
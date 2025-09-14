import { emailQueue } from '~/lib/emailQueue'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  // TODO: Add authentication check for admin role
  // For now, we'll assume this is behind proper authentication

  try {
    const retriedCount = emailQueue.retryFailedJobs()

    return {
      success: true,
      message: `Successfully retried ${retriedCount} failed email jobs`,
      retriedJobs: retriedCount
    }

  } catch (error) {
    console.error('Failed to retry failed jobs:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retry failed jobs'
    })
  }
})
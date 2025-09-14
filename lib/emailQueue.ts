import { EmailService } from './email'

export interface EmailJob {
  id: string
  type: 'event-summary' | 'collaboration-reminder' | 'networking-followup' | 'welcome' | 'verification'
  recipientEmail: string
  recipientName?: string
  data: any
  scheduledFor?: Date
  attempts: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
  lastAttemptAt?: Date
  errorMessage?: string
}

export class EmailQueue {
  private jobs: EmailJob[] = []
  private processing = false

  /**
   * Add an email job to the queue
   */
  addJob(job: Omit<EmailJob, 'id' | 'attempts' | 'status' | 'createdAt'>): string {
    const id = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newJob: EmailJob = {
      ...job,
      id,
      attempts: 0,
      status: 'pending',
      createdAt: new Date()
    }

    this.jobs.push(newJob)
    console.log(`Email job ${id} added to queue (type: ${job.type})`)

    // Process queue asynchronously
    this.processQueue()

    return id
  }

  /**
   * Add event summary emails for multiple recipients
   */
  async addEventSummaryBatch(eventId: string, participants: Array<{email: string, userId: string}>) {
    const jobs: string[] = []

    for (const participant of participants) {
      try {
        // Generate summary data for this participant
        const summary = await this.generateEventSummary(eventId, participant.userId)

        const jobId = this.addJob({
          type: 'event-summary',
          recipientEmail: participant.email,
          data: { summary }
        })

        jobs.push(jobId)
      } catch (error) {
        console.error(`Failed to generate summary for user ${participant.userId}:`, error)
      }
    }

    console.log(`Added ${jobs.length} event summary emails to queue for event ${eventId}`)
    return jobs
  }

  /**
   * Process pending jobs in the queue
   */
  private async processQueue() {
    if (this.processing) {
      return
    }

    this.processing = true

    try {
      const pendingJobs = this.jobs.filter(job =>
        job.status === 'pending' &&
        (!job.scheduledFor || job.scheduledFor <= new Date())
      )

      for (const job of pendingJobs) {
        await this.processJob(job)

        // Small delay between jobs to avoid overwhelming SMTP server
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } finally {
      this.processing = false
    }
  }

  /**
   * Process a single email job
   */
  private async processJob(job: EmailJob) {
    job.status = 'processing'
    job.attempts += 1
    job.lastAttemptAt = new Date()

    try {
      let success = false

      switch (job.type) {
        case 'event-summary':
          success = await EmailService.sendEventSummary(job.recipientEmail, job.data.summary)
          break

        case 'collaboration-reminder':
          success = await EmailService.sendCollaborationReminder(
            job.recipientEmail,
            job.recipientName || 'there',
            job.data.collaborations
          )
          break

        case 'networking-followup':
          success = await EmailService.sendNetworkingFollowUp(
            job.recipientEmail,
            job.recipientName || 'there',
            job.data.suggestions
          )
          break

        case 'welcome':
          success = await EmailService.sendWelcomeEmail(
            job.recipientEmail,
            job.recipientName || 'User',
            job.data.nickname
          )
          break

        case 'verification':
          success = await EmailService.sendVerificationPin(
            job.recipientEmail,
            job.data.pin,
            job.recipientName
          )
          break

        default:
          console.error(`Unknown email job type: ${job.type}`)
          job.status = 'failed'
          job.errorMessage = `Unknown job type: ${job.type}`
          return
      }

      if (success) {
        job.status = 'completed'
        console.log(`Email job ${job.id} completed successfully`)
      } else {
        throw new Error('Email sending returned false')
      }

    } catch (error) {
      console.error(`Email job ${job.id} failed (attempt ${job.attempts}):`, error)

      const maxAttempts = 3
      if (job.attempts >= maxAttempts) {
        job.status = 'failed'
        job.errorMessage = error instanceof Error ? error.message : String(error)
        console.error(`Email job ${job.id} permanently failed after ${maxAttempts} attempts`)
      } else {
        job.status = 'pending'
        // Exponential backoff: retry after 2^attempts minutes
        const retryDelay = Math.pow(2, job.attempts) * 60 * 1000
        job.scheduledFor = new Date(Date.now() + retryDelay)
        console.log(`Email job ${job.id} scheduled for retry in ${retryDelay/1000/60} minutes`)
      }
    }
  }

  /**
   * Generate event summary data for a specific user
   * This is a simplified version - in production you'd import the actual function
   */
  private async generateEventSummary(eventId: string, userId: string) {
    // This would normally call the generateEventSummary function from the summary API
    // For now, return a minimal structure
    return {
      event: { name: 'Sample Event', date: new Date().toISOString() },
      summary: { connectionsCount: 0, collaborationsCount: 0, projectsCount: 0, achievementsCount: 0 },
      connections: [],
      collaborations: [],
      projects: [],
      achievements: [],
      followUpSuggestions: [],
      generatedAt: new Date()
    }
  }

  /**
   * Get queue status
   */
  getStatus() {
    const statusCounts = this.jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      total: this.jobs.length,
      processing: this.processing,
      statusCounts,
      oldestPendingJob: this.jobs
        .filter(job => job.status === 'pending')
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0]?.createdAt
    }
  }

  /**
   * Get failed jobs for debugging
   */
  getFailedJobs() {
    return this.jobs.filter(job => job.status === 'failed')
  }

  /**
   * Retry failed jobs
   */
  retryFailedJobs() {
    const failedJobs = this.jobs.filter(job => job.status === 'failed')
    failedJobs.forEach(job => {
      job.status = 'pending'
      job.attempts = 0
      job.errorMessage = undefined
      job.scheduledFor = undefined
    })

    console.log(`Reset ${failedJobs.length} failed jobs for retry`)
    this.processQueue()

    return failedJobs.length
  }

  /**
   * Clear completed jobs older than specified days
   */
  cleanupCompletedJobs(daysOld = 7) {
    const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000))
    const initialLength = this.jobs.length

    this.jobs = this.jobs.filter(job =>
      job.status !== 'completed' || job.createdAt > cutoffDate
    )

    const cleaned = initialLength - this.jobs.length
    console.log(`Cleaned up ${cleaned} completed email jobs older than ${daysOld} days`)
    return cleaned
  }
}

// Create a singleton instance
export const emailQueue = new EmailQueue()
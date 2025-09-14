import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { EmailService } from '~/lib/email'
import { EmailQueue, type EmailJob } from '~/lib/emailQueue'
import {
  parseEmailPreferences,
  serializeEmailPreferences,
  canSendEmail,
  updateEmailPreference,
  type EmailPreferences
} from '~/lib/emailPreferences'

// Mock nodemailer
vi.mock('nodemailer', () => {
  const mockSendMail = vi.fn()
  const mockTransporter = {
    sendMail: mockSendMail
  }
  const mockCreateTransporter = vi.fn().mockResolvedValue(mockTransporter)

  return {
    default: {
      createTransporter: mockCreateTransporter,
      createTestAccount: vi.fn().mockResolvedValue({
        user: 'test@ethereal.email',
        pass: 'test-password'
      })
    }
  }
})

// Mock environment
const originalEnv = process.env
beforeEach(() => {
  vi.resetAllMocks()
  process.env = { ...originalEnv }
  process.env.NODE_ENV = 'test'
  process.env.FROM_EMAIL = 'test@unconference.app'
})

afterEach(() => {
  process.env = originalEnv
})

describe('EmailService', () => {
  describe('sendVerificationPin', () => {
    it('should log PIN in development mode', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const result = await EmailService.sendVerificationPin('user@test.com', '123456', 'Test User')

      expect(result).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('PIN: 123456'))

      consoleSpy.mockRestore()
    })

    it('should send actual email in production mode', async () => {
      process.env.NODE_ENV = 'production'

      // Mock the transporter methods
      const nodemailerMock = await import('nodemailer')
      const mockTransporter = {
        sendMail: vi.fn().mockResolvedValue({ messageId: 'test-message-id' })
      }
      vi.mocked(nodemailerMock.default.createTransporter).mockResolvedValue(mockTransporter as any)

      const result = await EmailService.sendVerificationPin('user@test.com', '123456', 'Test User')

      expect(result).toBe(true)
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
        from: 'test@unconference.app',
        to: 'user@test.com',
        subject: expect.stringContaining('PIN'),
        html: expect.stringContaining('123456'),
        text: expect.stringContaining('123456')
      }))
    })

    it('should throw error if sending fails in production', async () => {
      process.env.NODE_ENV = 'production'
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'))

      await expect(
        EmailService.sendVerificationPin('user@test.com', '123456')
      ).rejects.toThrow('Failed to send verification email')
    })
  })

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with proper template', async () => {
      process.env.NODE_ENV = 'production'
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' })

      const result = await EmailService.sendWelcomeEmail('user@test.com', 'Test User', 'TestNick')

      expect(result).toBe(true)
      expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
        from: 'test@unconference.app',
        to: 'user@test.com',
        subject: '🎉 Welcome to Unconference!',
        html: expect.stringContaining('Test User'),
        text: expect.stringContaining('TestNick')
      }))
    })

    it('should not throw error if welcome email fails', async () => {
      process.env.NODE_ENV = 'production'
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'))

      const result = await EmailService.sendWelcomeEmail('user@test.com', 'Test User', 'TestNick')

      expect(result).toBe(false)
    })
  })

  describe('sendEventSummary', () => {
    const mockSummary = {
      event: { name: 'Test Event', date: '2024-01-01' },
      summary: { connectionsCount: 3, collaborationsCount: 2, projectsCount: 1, achievementsCount: 1 },
      connections: [],
      collaborations: [],
      projects: [],
      achievements: [],
      followUpSuggestions: []
    }

    it('should send event summary with proper template', async () => {
      process.env.NODE_ENV = 'production'
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' })

      const result = await EmailService.sendEventSummary('user@test.com', mockSummary)

      expect(result).toBe(true)
      expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
        from: 'test@unconference.app',
        to: 'user@test.com',
        subject: 'Your Test Event Summary - 3 connections, 2 collaborations',
        html: expect.stringContaining('Test Event'),
        text: expect.stringContaining('3 new connections')
      }))
    })

    it('should throw error if event summary fails', async () => {
      process.env.NODE_ENV = 'production'
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'))

      await expect(
        EmailService.sendEventSummary('user@test.com', mockSummary)
      ).rejects.toThrow('Failed to send event summary email')
    })
  })

  describe('sendCollaborationReminder', () => {
    const mockCollaborations = [
      {
        name: 'Test Project',
        description: 'A test collaboration',
        pendingActionItems: 3,
        contributors: ['user1', 'user2'],
        resourcesCount: 5
      }
    ]

    it('should send collaboration reminder with proper template', async () => {
      process.env.NODE_ENV = 'production'
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' })

      const result = await EmailService.sendCollaborationReminder('user@test.com', 'Test User', mockCollaborations)

      expect(result).toBe(true)
      expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
        from: 'test@unconference.app',
        to: 'user@test.com',
        subject: '🤝 Follow-up: 1 collaboration waiting for your action',
        html: expect.stringContaining('Test Project'),
        text: expect.stringContaining('Test Project')
      }))
    })
  })

  describe('sendNetworkingFollowUp', () => {
    const mockSuggestions = [
      {
        title: 'Connect on LinkedIn',
        description: 'Reach out to 3 new contacts',
        action: 'Send connection requests',
        count: 3
      }
    ]

    it('should send networking follow-up with proper template', async () => {
      process.env.NODE_ENV = 'production'
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-message-id' })

      const result = await EmailService.sendNetworkingFollowUp('user@test.com', 'Test User', mockSuggestions)

      expect(result).toBe(true)
      expect(mockSendMail).toHaveBeenCalledWith(expect.objectContaining({
        from: 'test@unconference.app',
        to: 'user@test.com',
        subject: '🌟 Test User, 1 networking opportunities await!',
        html: expect.stringContaining('Connect on LinkedIn'),
        text: expect.stringContaining('Connect on LinkedIn')
      }))
    })
  })
})

describe('EmailQueue', () => {
  let emailQueue: EmailQueue

  beforeEach(() => {
    emailQueue = new EmailQueue()
  })

  describe('addJob', () => {
    it('should add a job to the queue with proper defaults', () => {
      const jobId = emailQueue.addJob({
        type: 'event-summary',
        recipientEmail: 'user@test.com',
        data: { summary: {} }
      })

      expect(jobId).toMatch(/^email_\d+_[a-z0-9]+$/)

      const status = emailQueue.getStatus()
      expect(status.total).toBe(1)
      expect(status.statusCounts.pending).toBe(1)
    })

    it('should add scheduled job', () => {
      const scheduledFor = new Date(Date.now() + 3600000) // 1 hour from now

      const jobId = emailQueue.addJob({
        type: 'collaboration-reminder',
        recipientEmail: 'user@test.com',
        recipientName: 'Test User',
        data: { collaborations: [] },
        scheduledFor
      })

      expect(jobId).toBeDefined()

      const status = emailQueue.getStatus()
      expect(status.total).toBe(1)
    })
  })

  describe('addEventSummaryBatch', () => {
    it('should add multiple summary jobs', async () => {
      const participants = [
        { email: 'user1@test.com', userId: 'user1' },
        { email: 'user2@test.com', userId: 'user2' }
      ]

      const jobIds = await emailQueue.addEventSummaryBatch('event1', participants)

      expect(jobIds).toHaveLength(2)

      const status = emailQueue.getStatus()
      expect(status.total).toBe(2)
      expect(status.statusCounts.pending).toBe(2)
    })
  })

  describe('getStatus', () => {
    it('should return proper queue status', () => {
      emailQueue.addJob({
        type: 'event-summary',
        recipientEmail: 'user@test.com',
        data: { summary: {} }
      })

      const status = emailQueue.getStatus()

      expect(status).toMatchObject({
        total: 1,
        processing: false,
        statusCounts: { pending: 1 }
      })
      expect(status.oldestPendingJob).toBeInstanceOf(Date)
    })
  })

  describe('retryFailedJobs', () => {
    it('should reset failed jobs for retry', () => {
      // Add a job and manually mark it as failed
      const jobId = emailQueue.addJob({
        type: 'event-summary',
        recipientEmail: 'user@test.com',
        data: { summary: {} }
      })

      // Simulate job failure by directly accessing the jobs array
      const jobs = (emailQueue as any).jobs
      jobs[0].status = 'failed'
      jobs[0].errorMessage = 'Test error'

      const retriedCount = emailQueue.retryFailedJobs()

      expect(retriedCount).toBe(1)
      expect(jobs[0].status).toBe('pending')
      expect(jobs[0].errorMessage).toBeUndefined()
      expect(jobs[0].attempts).toBe(0)
    })
  })

  describe('cleanupCompletedJobs', () => {
    it('should remove old completed jobs', () => {
      // Add completed job
      emailQueue.addJob({
        type: 'event-summary',
        recipientEmail: 'user@test.com',
        data: { summary: {} }
      })

      // Add pending job
      emailQueue.addJob({
        type: 'welcome',
        recipientEmail: 'user2@test.com',
        data: { nickname: 'Test' }
      })

      // Mark first job as completed and old
      const jobs = (emailQueue as any).jobs
      jobs[0].status = 'completed'
      jobs[0].createdAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days old

      const cleaned = emailQueue.cleanupCompletedJobs(7)

      expect(cleaned).toBe(1)
      expect(emailQueue.getStatus().total).toBe(1)
    })
  })
})

describe('Email Preferences', () => {
  describe('parseEmailPreferences', () => {
    it('should parse valid JSON preferences', () => {
      const json = '{"eventSummaries":false,"collaborationReminders":true,"networkingFollowUp":true,"weeklyDigest":false,"eventInvitations":true}'
      const preferences = parseEmailPreferences(json)

      expect(preferences).toEqual({
        eventSummaries: false,
        collaborationReminders: true,
        networkingFollowUp: true,
        weeklyDigest: false,
        eventInvitations: true
      })
    })

    it('should return defaults for invalid JSON', () => {
      const preferences = parseEmailPreferences('invalid-json')

      expect(preferences).toEqual({
        eventSummaries: true,
        collaborationReminders: true,
        networkingFollowUp: true,
        weeklyDigest: true,
        eventInvitations: true
      })
    })

    it('should return defaults for null input', () => {
      const preferences = parseEmailPreferences(null)

      expect(preferences).toEqual({
        eventSummaries: true,
        collaborationReminders: true,
        networkingFollowUp: true,
        weeklyDigest: true,
        eventInvitations: true
      })
    })

    it('should fill missing fields with defaults', () => {
      const json = '{"eventSummaries":false}'
      const preferences = parseEmailPreferences(json)

      expect(preferences.eventSummaries).toBe(false)
      expect(preferences.collaborationReminders).toBe(true)
      expect(preferences.networkingFollowUp).toBe(true)
      expect(preferences.weeklyDigest).toBe(true)
      expect(preferences.eventInvitations).toBe(true)
    })
  })

  describe('serializeEmailPreferences', () => {
    it('should serialize preferences to JSON string', () => {
      const preferences: EmailPreferences = {
        eventSummaries: false,
        collaborationReminders: true,
        networkingFollowUp: false,
        weeklyDigest: true,
        eventInvitations: false
      }

      const json = serializeEmailPreferences(preferences)
      const parsed = JSON.parse(json)

      expect(parsed).toEqual(preferences)
    })
  })

  describe('canSendEmail', () => {
    it('should return true for enabled preference', () => {
      const preferences = '{"eventSummaries":true,"collaborationReminders":false}'

      expect(canSendEmail(preferences, 'eventSummaries')).toBe(true)
      expect(canSendEmail(preferences, 'collaborationReminders')).toBe(false)
    })

    it('should work with preference object', () => {
      const preferences: EmailPreferences = {
        eventSummaries: true,
        collaborationReminders: false,
        networkingFollowUp: true,
        weeklyDigest: false,
        eventInvitations: true
      }

      expect(canSendEmail(preferences, 'eventSummaries')).toBe(true)
      expect(canSendEmail(preferences, 'collaborationReminders')).toBe(false)
      expect(canSendEmail(preferences, 'networkingFollowUp')).toBe(true)
    })

    it('should return defaults for null preferences', () => {
      expect(canSendEmail(null, 'eventSummaries')).toBe(true)
      expect(canSendEmail(null, 'collaborationReminders')).toBe(true)
    })
  })

  describe('updateEmailPreference', () => {
    it('should update specific preference', () => {
      const current = '{"eventSummaries":true,"collaborationReminders":false}'

      const updated = updateEmailPreference(current, 'collaborationReminders', true)
      const parsed = parseEmailPreferences(updated)

      expect(parsed.eventSummaries).toBe(true)
      expect(parsed.collaborationReminders).toBe(true)
    })

    it('should work with null current preferences', () => {
      const updated = updateEmailPreference(null, 'eventSummaries', false)
      const parsed = parseEmailPreferences(updated)

      expect(parsed.eventSummaries).toBe(false)
      expect(parsed.collaborationReminders).toBe(true) // default
    })
  })
})
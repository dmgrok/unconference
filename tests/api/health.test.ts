import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock filesystem operations
const mockAccess = vi.fn()
const mockGetUserSession = vi.fn()

vi.mock('fs', () => ({
  promises: {
    access: mockAccess
  }
}))

vi.mock('#auth-utils', () => ({
  getUserSession: mockGetUserSession
}))

// Import after mocks
import healthHandler from '~/server/api/health.get'

describe('Health API Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return healthy status when all checks pass', async () => {
    mockAccess.mockResolvedValue(undefined) // fs.access succeeds by not throwing
    mockGetUserSession.mockResolvedValue({ user: { id: 'test' } })

    const mockEvent = {
      node: {
        req: {},
        res: {
          statusCode: 200
        }
      }
    }

    const result = await healthHandler(mockEvent as any)

    expect(result.status).toBe('healthy')
    expect(result.checks.filesystem).toBe(true)
    expect(result.checks.dataAccess).toBe(true)
    expect(result.checks.auth).toBe(true)
    expect(result.timestamp).toBeDefined()
    expect(result.uptime).toBeDefined()
    expect(result.memory).toBeDefined()
    expect(result.responseTime).toBeDefined()
  })

  it('should return degraded status when filesystem check fails', async () => {
    mockAccess.mockRejectedValue(new Error('Access denied'))
    mockGetUserSession.mockResolvedValue({ user: { id: 'test' } })

    const mockEvent = {
      node: {
        req: {},
        res: {
          statusCode: 200
        }
      }
    }

    const result = await healthHandler(mockEvent as any)

    expect(result.status).toBe('degraded')
    expect(result.checks.filesystem).toBe(false)
  })

  it('should handle auth check gracefully', async () => {
    mockAccess.mockResolvedValue(undefined)
    mockGetUserSession.mockRejectedValue(new Error('No session'))

    const mockEvent = {
      node: {
        req: {},
        res: {
          statusCode: 200
        }
      }
    }

    const result = await healthHandler(mockEvent as any)

    // Auth check failure should not fail overall health
    expect(result.checks.auth).toBe(true)
  })

  it('should return unhealthy status when handler throws error', async () => {
    // Mock process.uptime to throw an error
    const originalUptime = process.uptime
    process.uptime = vi.fn(() => { throw new Error('Process error') })

    const mockEvent = {
      node: {
        req: {},
        res: {
          statusCode: 200
        }
      }
    }

    const result = await healthHandler(mockEvent as any)

    expect(result.status).toBe('unhealthy')
    expect(result.error).toBe('Health check failed')
    expect(result.timestamp).toBeDefined()

    // Restore original function
    process.uptime = originalUptime
  })

  it('should include process memory information', async () => {
    mockAccess.mockResolvedValue(undefined)
    mockGetUserSession.mockResolvedValue({ user: { id: 'test' } })

    const mockEvent = {
      node: {
        req: {},
        res: {
          statusCode: 200
        }
      }
    }

    const result = await healthHandler(mockEvent as any)

    expect(result.memory).toBeDefined()
    expect(result.memory).toHaveProperty('rss')
    expect(result.memory).toHaveProperty('heapTotal')
    expect(result.memory).toHaveProperty('heapUsed')
  })

  it('should measure response time', async () => {
    mockAccess.mockResolvedValue(undefined)
    mockGetUserSession.mockResolvedValue({ user: { id: 'test' } })

    const mockEvent = {
      node: {
        req: {},
        res: {
          statusCode: 200
        }
      }
    }

    const result = await healthHandler(mockEvent as any)

    expect(result.responseTime).toBeGreaterThanOrEqual(0)
    expect(typeof result.responseTime).toBe('number')
  })
})
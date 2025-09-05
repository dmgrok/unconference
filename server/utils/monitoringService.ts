import type { H3Event } from 'h3'
import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../utils/logger'

interface APIMetrics {
  endpoint: string
  method: string
  totalRequests: number
  successfulRequests: number
  errorRequests: number
  averageResponseTime: number
  lastAccessed: number
  errorTypes: Record<string, number>
}

interface SystemMetrics {
  uptime: number
  memoryUsage: NodeJS.MemoryUsage
  cpuUsage: NodeJS.CpuUsage
  activeUsers: number
  activeEvents: number
  totalUsers: number
  lastUpdated: number
}

interface UserActivity {
  userId: string
  action: string
  endpoint: string
  timestamp: number
  ip: string
  userAgent?: string
  eventId?: string
}

export class MonitoringService {
  private static instance: MonitoringService
  private apiMetrics = new Map<string, APIMetrics>()
  private userActivities: UserActivity[] = []
  private requestTimes = new Map<string, number>()
  private systemMetrics: SystemMetrics | null = null
  private maxActivitiesHistory = 1000

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService()
    }
    return MonitoringService.instance
  }

  // Track API request start
  trackRequestStart(event: H3Event) {
    const requestId = this.generateRequestId(event)
    this.requestTimes.set(requestId, Date.now())
  }

  // Track API request completion
  trackRequestEnd(event: H3Event, statusCode: number, error?: string) {
    const requestId = this.generateRequestId(event)
    const startTime = this.requestTimes.get(requestId)
    const endTime = Date.now()
    const responseTime = startTime ? endTime - startTime : 0

    this.requestTimes.delete(requestId)

    const endpoint = this.getEndpointKey(event)
    const method = getMethod(event)
    
    let metrics = this.apiMetrics.get(endpoint)
    if (!metrics) {
      metrics = {
        endpoint,
        method,
        totalRequests: 0,
        successfulRequests: 0,
        errorRequests: 0,
        averageResponseTime: 0,
        lastAccessed: endTime,
        errorTypes: {}
      }
    }

    // Update metrics
    metrics.totalRequests++
    metrics.lastAccessed = endTime
    
    if (statusCode >= 200 && statusCode < 400) {
      metrics.successfulRequests++
    } else {
      metrics.errorRequests++
      const errorType = error || `HTTP_${statusCode}`
      metrics.errorTypes[errorType] = (metrics.errorTypes[errorType] || 0) + 1
    }

    // Calculate rolling average response time
    metrics.averageResponseTime = Math.round(
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) / metrics.totalRequests
    )

    this.apiMetrics.set(endpoint, metrics)
  }

  // Track user activity
  trackUserActivity(userId: string, action: string, event: H3Event, eventId?: string) {
    const activity: UserActivity = {
      userId,
      action,
      endpoint: this.getEndpointKey(event),
      timestamp: Date.now(),
      ip: this.getClientIP(event),
      userAgent: getHeader(event, 'user-agent'),
      eventId
    }

    this.userActivities.push(activity)

    // Keep only recent activities
    if (this.userActivities.length > this.maxActivitiesHistory) {
      this.userActivities = this.userActivities.slice(-this.maxActivitiesHistory)
    }

    logger.info(`User activity: ${userId} performed ${action} on ${activity.endpoint}`)
  }

  // Get system metrics
  async getSystemMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage()
    const cpuUsage = process.cpuUsage()
    
    // Get user and event counts
    const { activeUsers, totalUsers, activeEvents } = await this.getUserAndEventCounts()

    this.systemMetrics = {
      uptime: process.uptime(),
      memoryUsage,
      cpuUsage,
      activeUsers,
      activeEvents,
      totalUsers,
      lastUpdated: Date.now()
    }

    return this.systemMetrics
  }

  // Get API metrics
  getAPIMetrics(): APIMetrics[] {
    return Array.from(this.apiMetrics.values())
      .sort((a, b) => b.totalRequests - a.totalRequests)
  }

  // Get recent user activities
  getRecentUserActivities(limit: number = 50): UserActivity[] {
    return this.userActivities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  // Get user activities for specific user
  getUserActivities(userId: string, limit: number = 20): UserActivity[] {
    return this.userActivities
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  // Get error summary
  getErrorSummary(): { endpoint: string; errorCount: number; errorTypes: Record<string, number> }[] {
    return Array.from(this.apiMetrics.values())
      .filter(metrics => metrics.errorRequests > 0)
      .map(metrics => ({
        endpoint: metrics.endpoint,
        errorCount: metrics.errorRequests,
        errorTypes: metrics.errorTypes
      }))
      .sort((a, b) => b.errorCount - a.errorCount)
  }

  // Get performance insights
  getPerformanceInsights() {
    const metrics = Array.from(this.apiMetrics.values())
    const slowEndpoints = metrics
      .filter(m => m.averageResponseTime > 1000)
      .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
    
    const highTrafficEndpoints = metrics
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, 10)

    const recentErrors = this.userActivities
      .filter(activity => activity.timestamp > Date.now() - 3600000) // Last hour
      .filter(activity => activity.action.includes('error'))

    return {
      slowEndpoints: slowEndpoints.slice(0, 5),
      highTrafficEndpoints,
      recentErrors: recentErrors.slice(0, 10),
      totalEndpoints: metrics.length,
      averageResponseTime: Math.round(
        metrics.reduce((sum, m) => sum + m.averageResponseTime, 0) / metrics.length
      )
    }
  }

  // Export monitoring data
  async exportMonitoringData() {
    const data = {
      timestamp: new Date().toISOString(),
      systemMetrics: await this.getSystemMetrics(),
      apiMetrics: this.getAPIMetrics(),
      userActivities: this.getRecentUserActivities(100),
      errorSummary: this.getErrorSummary(),
      performanceInsights: this.getPerformanceInsights()
    }

    const exportPath = join(process.cwd(), 'data', 'monitoring', `monitoring-${Date.now()}.json`)
    
    try {
      await fs.mkdir(join(process.cwd(), 'data', 'monitoring'), { recursive: true })
      await fs.writeFile(exportPath, JSON.stringify(data, null, 2))
      logger.info(`Monitoring data exported to: ${exportPath}`)
      return exportPath
    } catch (error) {
      logger.error('Failed to export monitoring data:', error)
      throw error
    }
  }

  // Helper methods
  private generateRequestId(event: H3Event): string {
    const url = getRequestURL(event).pathname
    const method = getMethod(event)
    const timestamp = Date.now()
    return `${method}:${url}:${timestamp}`
  }

  private getEndpointKey(event: H3Event): string {
    const url = getRequestURL(event).pathname
    // Normalize dynamic routes
    return url.replace(/\/[0-9a-f-]{36}/g, '/:id')
             .replace(/\/\d+/g, '/:id')
             .replace(/\/[^\/]+\.(json|xml|csv)$/g, '/:file')
  }

  private getClientIP(event: H3Event): string {
    const forwarded = getHeader(event, 'x-forwarded-for')
    const realIP = getHeader(event, 'x-real-ip')
    
    if (realIP) return realIP
    if (forwarded) return forwarded.split(',')[0].trim()
    
    const socket = event.node.req.socket
    return (socket as any)?.remoteAddress || 'unknown'
  }

  private async getUserAndEventCounts(): Promise<{ activeUsers: number; totalUsers: number; activeEvents: number }> {
    try {
      const platformBasePath = join(process.cwd(), 'data', 'platform')
      
      // Get users
      const usersPath = join(platformBasePath, 'users.json')
      let totalUsers = 0
      try {
        const usersData = await fs.readFile(usersPath, 'utf-8')
        const users = JSON.parse(usersData)
        totalUsers = users.length
      } catch {
        // No users file yet
      }

      // Get events
      const eventsPath = join(platformBasePath, 'events.json')
      let activeEvents = 0
      try {
        const eventsData = await fs.readFile(eventsPath, 'utf-8')
        const events = JSON.parse(eventsData)
        activeEvents = events.filter((e: any) => e.isActive).length
      } catch {
        // No events file yet
      }

      // Count active users from recent activities (last 24 hours)
      const recentThreshold = Date.now() - 24 * 60 * 60 * 1000
      const activeUserIds = new Set(
        this.userActivities
          .filter(activity => activity.timestamp > recentThreshold)
          .map(activity => activity.userId)
      )

      return {
        activeUsers: activeUserIds.size,
        totalUsers,
        activeEvents
      }
    } catch (error) {
      logger.error('Error getting user and event counts:', error)
      return { activeUsers: 0, totalUsers: 0, activeEvents: 0 }
    }
  }

  // Reset metrics (for testing)
  resetMetrics() {
    this.apiMetrics.clear()
    this.userActivities = []
    this.requestTimes.clear()
    this.systemMetrics = null
  }
}

export const monitoringService = MonitoringService.getInstance()

import type { H3Event } from 'h3'
import logger from '../../utils/logger'

interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
}

interface SecurityMetrics {
  requests: number
  blockedRequests: number
  suspiciousActivities: number
  lastUpdated: number
}

export class SecurityService {
  private static instance: SecurityService
  private rateLimitMap = new Map<string, RateLimitEntry>()
  private suspiciousIPs = new Set<string>()
  private metrics: SecurityMetrics = {
    requests: 0,
    blockedRequests: 0,
    suspiciousActivities: 0,
    lastUpdated: Date.now()
  }

  static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService()
    }
    return SecurityService.instance
  }

  // Rate limiting
  checkRateLimit(event: H3Event, maxRequests: number = 100, windowMs: number = 60000): boolean {
    const ip = this.getClientIP(event)
    const now = Date.now()
    const key = `${ip}:${Math.floor(now / windowMs)}`

    const entry = this.rateLimitMap.get(key) || { count: 0, resetTime: now + windowMs, blocked: false }
    
    entry.count++
    this.metrics.requests++

    if (entry.count > maxRequests) {
      entry.blocked = true
      this.metrics.blockedRequests++
      this.flagSuspiciousActivity(ip, 'rate_limit_exceeded')
      logger.warn(`Rate limit exceeded for IP: ${ip}`)
      return false
    }

    this.rateLimitMap.set(key, entry)
    this.cleanupOldEntries()
    return true
  }

  // Get client IP with proxy support
  getClientIP(event: H3Event): string {
    const forwarded = getHeader(event, 'x-forwarded-for')
    const realIP = getHeader(event, 'x-real-ip')
    const cfConnectingIP = getHeader(event, 'cf-connecting-ip')
    
    if (cfConnectingIP) return cfConnectingIP
    if (realIP) return realIP
    if (forwarded) return forwarded.split(',')[0].trim()
    
    // Fallback to request socket
    const socket = event.node.req.socket
    return (socket as any)?.remoteAddress || 'unknown'
  }

  // Security headers
  setSecurityHeaders(event: H3Event) {
    setHeader(event, 'X-Content-Type-Options', 'nosniff')
    setHeader(event, 'X-Frame-Options', 'DENY')
    setHeader(event, 'X-XSS-Protection', '1; mode=block')
    setHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')
    setHeader(event, 'Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    
    // HSTS for production
    if (process.env.NODE_ENV === 'production') {
      setHeader(event, 'Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
  }

  // Input sanitization
  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim()
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item))
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value)
      }
      return sanitized
    }
    
    return input
  }

  // Suspicious activity detection
  flagSuspiciousActivity(ip: string, reason: string) {
    this.suspiciousIPs.add(ip)
    this.metrics.suspiciousActivities++
    
    logger.warn(`Suspicious activity detected from IP ${ip}: ${reason}`)
    
    // Auto-block after multiple suspicious activities
    if (this.getSuspiciousActivityCount(ip) > 5) {
      this.blockIP(ip, 'Multiple suspicious activities')
    }
  }

  getSuspiciousActivityCount(ip: string): number {
    return Array.from(this.rateLimitMap.keys())
      .filter(key => key.startsWith(ip))
      .reduce((count, key) => {
        const entry = this.rateLimitMap.get(key)
        return count + (entry?.blocked ? 1 : 0)
      }, 0)
  }

  blockIP(ip: string, reason: string) {
    // In a real app, you'd add this to a persistent blocklist
    logger.warn(`Blocking IP ${ip}: ${reason}`)
    this.suspiciousIPs.add(ip)
  }

  isBlocked(ip: string): boolean {
    return this.suspiciousIPs.has(ip)
  }

  // Validate request payload
  validatePayload(payload: any, maxSize: number = 1024 * 1024): boolean {
    if (!payload) return true
    
    const payloadSize = JSON.stringify(payload).length
    if (payloadSize > maxSize) {
      logger.warn(`Payload too large: ${payloadSize} bytes`)
      return false
    }
    
    return true
  }

  // Get security metrics
  getMetrics(): SecurityMetrics & { 
    activeConnections: number
    suspiciousIPs: string[]
    rateLimitEntries: number
  } {
    return {
      ...this.metrics,
      activeConnections: this.rateLimitMap.size,
      suspiciousIPs: Array.from(this.suspiciousIPs),
      rateLimitEntries: this.rateLimitMap.size,
      lastUpdated: Date.now()
    }
  }

  // Cleanup old entries
  private cleanupOldEntries() {
    const now = Date.now()
    for (const [key, entry] of this.rateLimitMap.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitMap.delete(key)
      }
    }
  }

  // Reset metrics (for testing or periodic reset)
  resetMetrics() {
    this.metrics = {
      requests: 0,
      blockedRequests: 0,
      suspiciousActivities: 0,
      lastUpdated: Date.now()
    }
  }
}

export const securityService = SecurityService.getInstance()

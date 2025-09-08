import bcrypt from 'bcryptjs'
import { z } from 'zod'
import prisma from './database'
import { EmailService } from './email'

// Validation schemas - simplified for community events
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  eventCode: z.string().optional(), // For joining events during registration
  nickname: z.string().optional() // Optional custom nickname
})

export const verifyEmailSchema = z.object({
  email: z.string().email('Invalid email address'),
  pin: z.string().length(6, 'PIN must be 6 digits')
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
})

export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address')
})

export class AuthService {
  /**
   * Generate random 6-digit PIN for email verification
   */
  static generatePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Generate friendly nickname from name or random
   */
  static generateNickname(name?: string): string {
    const adjectives = ['Bright', 'Creative', 'Dynamic', 'Energetic', 'Friendly', 'Happy', 'Inspiring', 'Lively', 'Passionate', 'Thoughtful']
    const nouns = ['Organizer', 'Facilitator', 'Builder', 'Connector', 'Leader', 'Innovator', 'Catalyst', 'Guide', 'Mentor', 'Pioneer']
    
    if (name && name.length > 1) {
      // Use first name + random adjective
      const firstName = name.split(' ')[0]
      const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
      return `${randomAdjective} ${firstName}`
    } else {
      // Generate completely random friendly nickname
      const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)]
      const randomNoun = nouns[Math.floor(Math.random() * nouns.length)]
      return `${randomAdjective} ${randomNoun}`
    }
  }

  /**
   * Hash password for storage (still used for OAuth migration)
   */
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 12)
  }

  /**
   * Verify password against hash (still used for OAuth migration)
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  /**
   * Register new user with email verification
   */
  static async register(data: z.infer<typeof registerSchema>) {
    const validData = registerSchema.parse(data)
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validData.email.toLowerCase() }
    })

    if (existingUser) {
      // If user exists but isn't verified, allow resending PIN
      if (!existingUser.isEmailVerified) {
        return await this.resendVerificationPin(validData.email.toLowerCase())
      }
      throw new Error('User already exists with this email')
    }

    // Generate PIN and nickname
    const pin = this.generatePin()
    const nickname = validData.nickname || this.generateNickname(validData.name)
    
    // Create unverified user
    const user = await prisma.user.create({
      data: {
        email: validData.email.toLowerCase(),
        name: validData.name,
        nickname,
        emailVerifyPin: pin,
        emailVerifyExpires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        isEmailVerified: false,
        globalRole: 'USER',
        subscriptionTier: 'FREE',
        subscriptionStatus: 'ACTIVE',
        participantLimit: 50
      }
    })

    // Send verification PIN
    await EmailService.sendVerificationPin(validData.email, pin, validData.name)

    // Store event code for after verification
    if (validData.eventCode) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          // Store event code temporarily (we'll add this field)
          // For now, we'll handle it after verification
        }
      })
    }

    return {
      email: user.email,
      name: user.name,
      nickname: user.nickname,
      needsVerification: true,
      message: 'Please check your email for a verification PIN'
    }
  }

  /**
   * Verify email with PIN
   */
  static async verifyEmail(data: z.infer<typeof verifyEmailSchema>) {
    const validData = verifyEmailSchema.parse(data)
    
    const user = await prisma.user.findUnique({
      where: { email: validData.email.toLowerCase() }
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.isEmailVerified) {
      throw new Error('Email is already verified')
    }

    if (!user.emailVerifyPin || user.emailVerifyPin !== validData.pin) {
      throw new Error('Invalid PIN')
    }

    if (!user.emailVerifyExpires || user.emailVerifyExpires < new Date()) {
      throw new Error('PIN has expired. Please request a new one.')
    }

    // Verify the user
    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyPin: null,
        emailVerifyExpires: null
      }
    })

    // Send welcome email
    await EmailService.sendWelcomeEmail(user.email, user.name || '', user.nickname || '')

    return this.createSessionUser(verifiedUser)
  }

  /**
   * Resend verification PIN
   */
  static async resendVerificationPin(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      throw new Error('User not found')
    }

    if (user.isEmailVerified) {
      throw new Error('Email is already verified')
    }

    // Generate new PIN
    const pin = this.generatePin()
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyPin: pin,
        emailVerifyExpires: new Date(Date.now() + 15 * 60 * 1000)
      }
    })

    // Send new PIN
    await EmailService.sendVerificationPin(email, pin, user.name || undefined)

    return {
      message: 'New verification PIN sent to your email'
    }
  }

  /**
   * Authenticate user with email/password
   */
  static async authenticate(data: z.infer<typeof loginSchema>) {
    const validData = loginSchema.parse(data)
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validData.email.toLowerCase() }
    })

    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password')
    }

    // Verify password
    const isValid = await this.verifyPassword(validData.password, user.passwordHash)
    
    if (!isValid) {
      throw new Error('Invalid email or password')
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  /**
   * Join event by code during registration
   */
  static async joinEventByCode(userId: string, eventCode: string) {
    const event = await prisma.event.findUnique({
      where: { code: eventCode.toUpperCase() },
      include: { 
        memberships: { where: { status: 'ACTIVE' } },
        owner: true 
      }
    })

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.status !== 'ACTIVE') {
      throw new Error('Event is not active')
    }

    // Check if user is already a member
    const existingMembership = await prisma.eventMembership.findUnique({
      where: {
        userId_eventId: {
          userId: userId,
          eventId: event.id
        }
      }
    })

    if (existingMembership) {
      return // Already a member
    }

    // Check participant limits
    const currentParticipants = event.memberships.length
    const { SubscriptionService } = await import('./subscription')
    const canAdd = await SubscriptionService.canAddParticipants(event.id, 1)
    
    if (!canAdd.allowed) {
      throw new Error(canAdd.reason || 'Cannot join event')
    }

    // Add user to event
    await prisma.eventMembership.create({
      data: {
        userId,
        eventId: event.id,
        role: event.requireApproval ? 'PENDING_APPROVAL' : 'PARTICIPANT',
        status: event.requireApproval ? 'PENDING_APPROVAL' : 'ACTIVE'
      }
    })

    return event
  }

  /**
   * Create or update OAuth user
   */
  static async upsertOAuthUser(provider: 'github' | 'google', profile: any) {
    const email = profile.email?.toLowerCase()
    
    if (!email) {
      throw new Error('Email is required from OAuth provider')
    }

    // Try to find existing user by email first
    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (user) {
      // Update OAuth provider info
      const updateData: any = {
        name: profile.name || user.name,
        avatar: profile.avatar || user.avatar,
        lastLoginAt: new Date()
      }

      if (provider === 'github') {
        updateData.githubId = profile.id?.toString()
      } else if (provider === 'google') {
        updateData.googleId = profile.id?.toString()
      }

      user = await prisma.user.update({
        where: { id: user.id },
        data: updateData
      })
    } else {
      // Create new user
      const createData: any = {
        email,
        name: profile.name || email.split('@')[0],
        avatar: profile.avatar,
        globalRole: 'USER',
        subscriptionTier: 'FREE',
        subscriptionStatus: 'ACTIVE',
        participantLimit: 50,
        lastLoginAt: new Date()
      }

      if (provider === 'github') {
        createData.githubId = profile.id?.toString()
      } else if (provider === 'google') {
        createData.googleId = profile.id?.toString()
      }

      user = await prisma.user.create({
        data: createData
      })
    }

    // Return user without password hash
    const { passwordHash: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  /**
   * Generate session data for user
   */
  static createSessionUser(user: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      globalRole: user.globalRole,
      subscriptionTier: user.subscriptionTier,
      subscriptionStatus: user.subscriptionStatus,
      participantLimit: user.participantLimit
    }
  }

  /**
   * Get user by ID for session validation
   */
  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        globalRole: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        participantLimit: true,
        isActive: true
      }
    })

    if (!user || !user.isActive) {
      return null
    }

    return user
  }

  /**
   * Create guest user for quick event access
   */
  static async createGuestUser(eventCode: string) {
    const event = await prisma.event.findUnique({
      where: { code: eventCode.toUpperCase() }
    })

    if (!event || !event.allowGuestAccess) {
      throw new Error('Event not found or guest access not allowed')
    }

    // Generate guest ID
    const guestId = Math.random().toString(36).substring(2, 8).toUpperCase()
    const guestEmail = `guest_${guestId}@unconference.guest`

    const guestUser = await prisma.user.create({
      data: {
        email: guestEmail,
        name: `Guest ${guestId}`,
        isGuest: true,
        globalRole: 'USER',
        subscriptionTier: 'FREE',
        subscriptionStatus: 'ACTIVE',
        participantLimit: 50
      }
    })

    // Auto-join the event
    await prisma.eventMembership.create({
      data: {
        userId: guestUser.id,
        eventId: event.id,
        role: 'GUEST',
        status: 'ACTIVE'
      }
    })

    return this.createSessionUser(guestUser)
  }
}
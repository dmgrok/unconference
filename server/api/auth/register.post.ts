import { z } from 'zod'
import logger from '../../../utils/logger'
import { promises as fs } from 'fs'
import { join } from 'path'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  eventCode: z.string().optional(),
  redirectTo: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const { email, password, name, firstName, lastName, eventCode, redirectTo } = await readValidatedBody(event, bodySchema.parse)
  const config = useRuntimeConfig()
  const usersFilePath = join(process.cwd(), config.usersFilePath)
  const platformUsersPath = join(process.cwd(), 'data', 'platform', 'users.json')

  logger.info(`Registering new user: ${email}`)
  
  try {
    // Read existing users from both files to check for duplicates
    let existingUsers = []
    let platformUsers = []
    
    try {
      const usersData = await fs.readFile(usersFilePath, 'utf-8')
      existingUsers = JSON.parse(usersData)
    } catch (error) {
      // File doesn't exist, start with empty array
      existingUsers = []
    }

    try {
      const platformData = await fs.readFile(platformUsersPath, 'utf-8')
      platformUsers = JSON.parse(platformData)
    } catch (error) {
      // File doesn't exist, start with empty array
      platformUsers = []
    }

    // Check if user already exists
    const userExists = existingUsers.some((u: any) => u.Email.toLowerCase() === email.toLowerCase()) ||
                     platformUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase())

    if (userExists) {
      throw createError({
        statusCode: 409,
        message: 'User with this email already exists'
      })
    }

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Parse name into first and last names if not provided separately
    const [defaultFirstName, ...lastNameParts] = name.split(' ')
    const finalFirstName = firstName || defaultFirstName
    const finalLastName = lastName || lastNameParts.join(' ') || ''

    // Create user object for legacy system
    const legacyUser = {
      id: userId,
      Email: email,
      Password: password, // In production, this should be hashed!
      Firstname: finalFirstName,
      Lastname: finalLastName,
      Role: 'User', // Default role
      GlobalRole: 'User',
      CreatedAt: new Date().toISOString(),
      IsActive: true
    }

    // Create user object for platform system
    const platformUser = {
      id: userId,
      name: name,
      email: email,
      globalRole: 'User',
      isGuest: false,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      isActive: true
    }

    // Add to existing users arrays
    existingUsers.push(legacyUser)
    platformUsers.push(platformUser)

    // Write back to files
    await fs.mkdir(join(process.cwd(), 'data', 'platform'), { recursive: true })
    await fs.writeFile(usersFilePath, JSON.stringify(existingUsers, null, 2))
    await fs.writeFile(platformUsersPath, JSON.stringify(platformUsers, null, 2))

    logger.info(`New user registered successfully: ${email}`)

    // Automatically log the user in
    await setUserSession(event, {
      user: {
        id: userId,
        name: name,
        email: email,
        role: 'User',
        globalRole: 'User',
        pendingEventCode: eventCode,
        pendingRedirect: redirectTo
      }
    })

    return {
      success: true,
      message: 'Account created successfully',
      user: {
        id: userId,
        name: name,
        email: email,
        role: 'User'
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    logger.error('Error creating user:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create account'
    })
  }
})

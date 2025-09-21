import { promises as fs } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'
import logger from '../../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readBody(event)
  
  // Check if user is super admin
  if ((user as any).globalRole !== 'Admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Super admin access required'
    })
  }

  // Validate input
  if (!body.name || !body.email) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name and email are required'
    })
  }

  try {
    const platformBasePath = join(process.cwd(), 'data', 'platform')
    
    // Ensure platform directory exists
    try {
      await fs.access(platformBasePath)
    } catch {
      await fs.mkdir(platformBasePath, { recursive: true })
    }

    const usersPath = join(platformBasePath, 'users.json')
    
    // Load existing users
    let users = []
    try {
      const usersData = await fs.readFile(usersPath, 'utf-8')
      users = JSON.parse(usersData)
    } catch {
      // No users file yet
    }

    // Check if user already exists
    const existingUser = users.find((u: any) => u.email === body.email)
    if (existingUser) {
      throw createError({
        statusCode: 409,
        statusMessage: 'User with this email already exists'
      })
    }

    // Create new user
    const newUser = {
      id: uuidv4(),
      name: body.name,
      email: body.email,
      globalRole: body.globalRole || 'User',
      isActive: true,
      createdAt: new Date().toISOString(),
      invitedBy: (user as any).email
    }

    users.push(newUser)
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2))

    // TODO: Send invitation email
    // This would integrate with an email service to send an invitation
    
    logger.info(`User ${body.email} invited by super admin ${(user as any).email}`)
    
    return {
      success: true,
      message: 'User invitation sent successfully',
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        globalRole: newUser.globalRole
      }
    }
  } catch (error) {
    logger.error('Error inviting user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to invite user'
    })
  }
})

import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const userId = getRouterParam(event, 'userId')
  
  // Check if user is super admin
  if ((user as any).globalRole !== 'SuperAdmin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Super admin access required'
    })
  }

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required'
    })
  }

  try {
    const platformBasePath = join(process.cwd(), 'data', 'platform')
    const usersPath = join(platformBasePath, 'users.json')
    
    // Load users
    let users = []
    try {
      const usersData = await fs.readFile(usersPath, 'utf-8')
      users = JSON.parse(usersData)
    } catch {
      throw createError({
        statusCode: 404,
        statusMessage: 'Users not found'
      })
    }

    // Find and activate the user
    const userIndex = users.findIndex((u: any) => u.id === userId)
    if (userIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Update user status
    users[userIndex].isActive = true
    users[userIndex].updatedAt = new Date().toISOString()

    // Save updated users
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2))

    logger.info(`User ${userId} activated by super admin ${(user as any).email}`)
    
    return {
      success: true,
      message: 'User activated successfully'
    }
  } catch (error) {
    logger.error('Error activating user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to activate user'
    })
  }
})

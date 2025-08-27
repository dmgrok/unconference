import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const userId = getRouterParam(event, 'userId')
  const body = await readBody(event)
  
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
    
    // Update user's global role
    const usersPath = join(platformBasePath, 'users.json')
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

    const userIndex = users.findIndex((u: any) => u.id === userId)
    if (userIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found'
      })
    }

    // Update global role
    users[userIndex].globalRole = body.globalRole
    users[userIndex].updatedAt = new Date().toISOString()

    await fs.writeFile(usersPath, JSON.stringify(users, null, 2))

    // Update event memberships if provided
    if (body.eventMemberships) {
      const membershipsPath = join(platformBasePath, 'memberships.json')
      let memberships = []
      try {
        const membershipsData = await fs.readFile(membershipsPath, 'utf-8')
        memberships = JSON.parse(membershipsData)
      } catch {
        // No memberships file yet
      }

      // Remove existing memberships for this user
      memberships = memberships.filter((m: any) => m.userId !== userId)

      // Add new memberships
      for (const eventMembership of body.eventMemberships) {
        const existingMembership = memberships.find((m: any) => 
          m.userId === userId && m.eventId === eventMembership.eventId
        )
        
        if (existingMembership) {
          existingMembership.role = eventMembership.role
          existingMembership.updatedAt = new Date().toISOString()
        } else {
          memberships.push({
            userId,
            eventId: eventMembership.eventId,
            role: eventMembership.role,
            joinedAt: eventMembership.joinedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        }
      }

      await fs.writeFile(membershipsPath, JSON.stringify(memberships, null, 2))
    }

    logger.info(`User ${userId} roles updated by super admin ${(user as any).email}`)
    
    return {
      success: true,
      message: 'User roles updated successfully'
    }
  } catch (error) {
    logger.error('Error updating user roles:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update user roles'
    })
  }
})

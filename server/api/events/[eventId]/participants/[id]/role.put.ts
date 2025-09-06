import { promises as fs } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import logger from '~/utils/logger'
import { requireEventPermission } from '~/server/utils/authService'

const roleUpdateSchema = z.object({
  role: z.enum(['Organizer', 'Moderator', 'Participant'])
})

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'eventId')
  const participantId = getRouterParam(event, 'id')
  
  if (!eventId || !participantId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID and participant ID are required'
    })
  }

  // Check if user has permission to manage participants in this event
  await requireEventPermission(event, eventId, 'participants', 'manage')

  const body = await readValidatedBody(event, roleUpdateSchema.parse)

  try {
    const platformPath = join(process.cwd(), 'data', 'platform')
    const membershipsPath = join(platformPath, 'memberships.json')
    
    let memberships = []
    
    try {
      const membershipsData = await fs.readFile(membershipsPath, 'utf-8')
      memberships = JSON.parse(membershipsData)
    } catch {
      throw createError({
        statusCode: 404,
        statusMessage: 'Memberships not found'
      })
    }

    // Find the membership to update
    const membershipIndex = memberships.findIndex((m: any) => 
      m.eventId === eventId && m.userId === participantId
    )
    
    if (membershipIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Participant not found in this event'
      })
    }

    // Update the role
    memberships[membershipIndex].role = body.role
    memberships[membershipIndex].updatedAt = new Date().toISOString()

    // Save updated memberships
    await fs.writeFile(membershipsPath, JSON.stringify(memberships, null, 2))

    return {
      success: true,
      message: `Participant role updated to ${body.role}`
    }

  } catch (error) {
    logger.error('Error updating participant role:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid role data: ' + error.errors.map(e => e.message).join(', ')
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update participant role'
    })
  }
})

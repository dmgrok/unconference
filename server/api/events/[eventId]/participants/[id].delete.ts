import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '~/utils/logger'
import { requireEventPermission } from '~/server/utils/authService'

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

    // Find the membership to remove
    const membershipIndex = memberships.findIndex((m: any) => 
      m.eventId === eventId && m.userId === participantId
    )
    
    if (membershipIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Participant not found in this event'
      })
    }

    // Remove the participant from the event
    memberships.splice(membershipIndex, 1)

    // Save updated memberships
    await fs.writeFile(membershipsPath, JSON.stringify(memberships, null, 2))

    return {
      success: true,
      message: 'Participant removed from event successfully'
    }

  } catch (error) {
    logger.error('Error removing participant:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to remove participant'
    })
  }
})

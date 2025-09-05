import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../../utils/logger'
import { requireEventPermission } from "../../../../utils/authService"
import type { ActiveRound } from '~/types/topic'

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'Event ID is required'
    })
  }

  // Check if user has permission to manage rounds in this event
  await requireEventPermission(event, eventId, 'rounds', 'manage')

  try {
    const eventDir = join(process.cwd(), 'data', 'events', eventId)
    const activeRoundPath = join(eventDir, 'active-round.json')
    
    // Check if active round file exists
    const fileExists = await fs.access(activeRoundPath).then(() => true).catch(() => false)
    
    if (!fileExists) {
      throw createError({
        statusCode: 404,
        message: 'No active round found'
      })
    }

    const activeRoundData = await fs.readFile(activeRoundPath, 'utf-8')
    const activeRound = JSON.parse(activeRoundData) as ActiveRound
    
    // Mark round as inactive
    activeRound.isActive = false
    activeRound.votingDisabled = false
    
    await fs.writeFile(activeRoundPath, JSON.stringify(activeRound, null, 2))
    
    logger.info(`Round ended for event ${eventId}: ${activeRound.id}`)
    
    return { 
      success: true,
      message: 'Round ended successfully' 
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    logger.error('Error ending round:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to end round'
    })
  }
})

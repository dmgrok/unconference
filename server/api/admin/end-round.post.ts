import { promises as fs } from 'fs'
import { join } from 'path'
import type { ActiveRound } from '~/types/topic'
import type { User } from '~/types/user'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  // Verify admin or organizer role
  const userRole = (user as any).Role || (user as any).role
  if (!['Admin', 'Organizer'].includes(userRole) && (user as any).globalRole !== 'Admin') {
    throw createError({
      statusCode: 403,
      message: 'Only administrators and organizers can end a round'
    })
  }

  const activeRoundPath = join(process.cwd(), 'data', 'active-round.json')
  
  try {
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
    
    // Mark round as inactive and re-enable voting
    activeRound.isActive = false
    activeRound.votingDisabled = false
    await fs.writeFile(activeRoundPath, JSON.stringify(activeRound, null, 2))
    
    return { message: 'Round ended successfully' }
  } catch (error) {
    console.error('Error ending round:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to end round'
    })
  }
})

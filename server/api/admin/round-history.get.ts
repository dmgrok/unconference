import { promises as fs } from 'fs'
import { join } from 'path'
import type { RoundHistory } from '~/types/topic'
import type { User } from '~/types/user'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { user } = await requireUserSession(event)
  const query = getQuery(event)
  const eventId = query.eventId as string
  
  // Verify admin or organizer role
  const userRole = (user as any).Role || (user as any).role
  if (!['Admin', 'Organizer'].includes(userRole) && (user as any).globalRole !== 'SuperAdmin') {
    throw createError({
      statusCode: 403,
      message: 'Only administrators and organizers can view round history'
    })
  }

  // Use event-specific data if eventId provided, otherwise fall back to global data
  const roundHistoryPath = eventId 
    ? join(process.cwd(), 'data', 'events', eventId, 'round-history.json')
    : join(process.cwd(), 'data', 'round-history.json')
  
  try {
    // Check if round history file exists
    const fileExists = await fs.access(roundHistoryPath).then(() => true).catch(() => false)
    
    if (!fileExists) {
      // Create empty round history file
      const emptyHistory: RoundHistory[] = []
      await fs.writeFile(roundHistoryPath, JSON.stringify(emptyHistory, null, 2))
      return emptyHistory
    }
    
    const historyData = await fs.readFile(roundHistoryPath, 'utf-8')
    const history = JSON.parse(historyData) as RoundHistory[]
    
    return history.sort((a, b) => b.roundNumber - a.roundNumber) // Most recent first
  } catch (error) {
    console.error('Error reading round history:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to load round history'
    })
  }
})

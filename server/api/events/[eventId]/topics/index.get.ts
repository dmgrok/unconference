import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../../utils/logger'
import { requireEventPermission } from '../../../../utils/authService'

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'Event ID is required'
    })
  }

  // Check if user has permission to read topics in this event
  await requireEventPermission(event, eventId, 'topics', 'read')

  try {
    const topicsPath = join(process.cwd(), 'data', 'events', eventId, 'topics.json')
    
    // Check if topics file exists
    const fileExists = await fs.access(topicsPath).then(() => true).catch(() => false)
    
    if (!fileExists) {
      // Create empty topics file if it doesn't exist
      await fs.mkdir(join(process.cwd(), 'data', 'events', eventId), { recursive: true })
      await fs.writeFile(topicsPath, JSON.stringify([], null, 2))
      return []
    }
    
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData)
    
    logger.debug(`Retrieved ${topics.length} topics for event ${eventId}`)
    return topics
  } catch (error: any) {
    if (error.statusCode) throw error
    
    logger.error('Error reading topics:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch topics'
    })
  }
})

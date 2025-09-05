import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../../utils/logger'
import { requireEventPermission } from "../../../../utils/authService"

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'Event ID is required'
    })
  }

  // Check if user has permission to read rooms in this event
  await requireEventPermission(event, eventId, 'rooms', 'read')

  try {
    const roomsPath = join(process.cwd(), 'data', 'events', eventId, 'rooms.json')
    
    // Check if rooms file exists
    const fileExists = await fs.access(roomsPath).then(() => true).catch(() => false)
    
    if (!fileExists) {
      // Create empty rooms file if it doesn't exist
      await fs.mkdir(join(process.cwd(), 'data', 'events', eventId), { recursive: true })
      await fs.writeFile(roomsPath, JSON.stringify([], null, 2))
      return []
    }
    
    const roomsData = await fs.readFile(roomsPath, 'utf-8')
    const rooms = JSON.parse(roomsData)
    
    logger.debug(`Retrieved ${rooms.length} rooms for event ${eventId}`)
    return rooms
  } catch (error: any) {
    if (error.statusCode) throw error
    
    logger.error('Error reading rooms:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch rooms'
    })
  }
})

import { promises as fs } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import logger from '../../../utils/logger'
import type { Room } from '~/types/room'

const roomSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  capacity: z.number().min(1).max(200),
  location: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  amenities: z.array(z.string()),
  available: z.boolean().default(true)
})

export default defineEventHandler(async (event) => {
  // Require organizer authentication
  const { user } = await requireUserSession(event)
  const userRole = (user as any).Role || (user as any).role
  if (!['Admin', 'Organizer'].includes(userRole) && (user as any).globalRole !== 'Admin') {
    throw createError({
      statusCode: 403,
      message: 'Organizer access required'
    })
  }

  const roomData = await readValidatedBody(event, roomSchema.parse)
  
  try {
    const roomsPath = join(process.cwd(), 'data', 'rooms.json')
    
    let rooms: Room[] = []
    
    // Load existing rooms
    try {
      const roomsFileData = await fs.readFile(roomsPath, 'utf-8')
      rooms = JSON.parse(roomsFileData)
    } catch {
      // File doesn't exist, start with empty array
      rooms = []
    }
    
    if (roomData.id) {
      // Update existing room
      const roomIndex = rooms.findIndex(r => r.id === roomData.id)
      if (roomIndex === -1) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Room not found'
        })
      }
      
      rooms[roomIndex] = {
        ...rooms[roomIndex],
        ...roomData
      }
    } else {
      // Create new room
      const newId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const newRoom: Room = {
        id: newId,
        ...roomData
      }
      rooms.push(newRoom)
    }
    
    // Ensure data directory exists
    await fs.mkdir(join(process.cwd(), 'data'), { recursive: true })
    
    // Save updated rooms
    await fs.writeFile(roomsPath, JSON.stringify(rooms, null, 2))
    
    return {
      success: true,
      message: roomData.id ? 'Room updated successfully' : 'Room created successfully'
    }
    
  } catch (error) {
    logger.error('Error saving room:', error)
    
    if (error instanceof z.ZodError) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid room data: ' + error.errors.map(e => e.message).join(', ')
      })
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to save room'
    })
  }
})

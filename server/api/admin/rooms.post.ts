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
  // Require admin or organizer authentication
  const { user } = await requireUserSession(event)
  const userRole = (user as any).Role || (user as any).role
  if (!['Admin', 'Organizer'].includes(userRole) && (user as any).globalRole !== 'Admin') {
    throw createError({
      statusCode: 403,
      message: 'Admin or organizer access required'
    })
  }

  const roomData = await readValidatedBody(event, roomSchema.parse)
  
  try {
    const roomsPath = join(process.cwd(), 'data', 'rooms.json')
    
    // Read existing rooms
    let rooms: Room[] = []
    try {
      const roomsFileData = await fs.readFile(roomsPath, 'utf-8')
      rooms = JSON.parse(roomsFileData)
    } catch (error) {
      // File doesn't exist, start with empty array
    }
    
    // Generate ID if not provided
    const newRoom: Room = {
      ...roomData,
      id: roomData.id || `room-${Date.now()}`,
    }
    
    // Check if room with this ID already exists
    const existingIndex = rooms.findIndex(r => r.id === newRoom.id)
    if (existingIndex >= 0) {
      // Update existing room
      rooms[existingIndex] = newRoom
      logger.info(`Updated room: ${newRoom.name} (${newRoom.id})`)
    } else {
      // Add new room
      rooms.push(newRoom)
      logger.info(`Created new room: ${newRoom.name} (${newRoom.id})`)
    }
    
    // Save rooms
    await fs.writeFile(roomsPath, JSON.stringify(rooms, null, 2))
    
    return {
      success: true,
      room: newRoom,
      message: existingIndex >= 0 ? 'Room updated successfully' : 'Room created successfully'
    }
    
  } catch (error) {
    if (error.statusCode) throw error
    
    logger.error('Error saving room:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to save room'
    })
  }
})
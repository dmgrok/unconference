import { promises as fs } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import logger from '../../../../../utils/logger'
import { requireEventPermission } from "../../../../utils/authService"
import type { Room } from '~/types/room'
import { randomUUID } from 'crypto'

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
  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'Event ID is required'
    })
  }

  // Check if user has permission to manage rooms in this event
  await requireEventPermission(event, eventId, 'rooms', 'create')

  const roomData = await readValidatedBody(event, roomSchema.parse)
  
  try {
    const roomsPath = join(process.cwd(), 'data', 'events', eventId, 'rooms.json')
    
    // Ensure directory exists
    await fs.mkdir(join(process.cwd(), 'data', 'events', eventId), { recursive: true })
    
    // Read existing rooms or create empty array
    let rooms: Room[] = []
    try {
      const roomsData = await fs.readFile(roomsPath, 'utf-8')
      rooms = JSON.parse(roomsData)
    } catch {
      // File doesn't exist, start with empty array
    }

    let newRoom: Room
    const existingIndex = roomData.id ? rooms.findIndex(r => r.id === roomData.id) : -1

    if (existingIndex >= 0) {
      // Update existing room
      newRoom = {
        ...roomData,
        id: roomData.id!,
        eventId: eventId,
        updatedAt: new Date().toISOString()
      }
      rooms[existingIndex] = newRoom
      logger.info(`Updated room: ${newRoom.name} (${newRoom.id}) in event ${eventId}`)
    } else {
      // Create new room
      newRoom = {
        ...roomData,
        id: roomData.id || randomUUID(),
        eventId: eventId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      rooms.push(newRoom)
      logger.info(`Created new room: ${newRoom.name} (${newRoom.id}) in event ${eventId}`)
    }

    await fs.writeFile(roomsPath, JSON.stringify(rooms, null, 2))

    return {
      success: true,
      room: newRoom,
      message: existingIndex >= 0 ? 'Room updated successfully' : 'Room created successfully'
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    
    logger.error('Error saving room:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to save room'
    })
  }
})

import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'
import type { Room } from '~/types/room'

export default defineEventHandler(async (event) => {
  // Require user session 
  const { user } = await requireUserSession(event)
  
  try {
    const roomsPath = join(process.cwd(), 'data', 'rooms.json')
    
    try {
      const roomsData = await fs.readFile(roomsPath, 'utf-8')
      const rooms = JSON.parse(roomsData) as Room[]
      
      return {
        success: true,
        rooms
      }
    } catch (error) {
      // File doesn't exist, return default rooms
      const defaultRooms: Room[] = [
        {
          id: 'room-a',
          name: 'Conference Room A',
          capacity: 12,
          location: 'First Floor, East Wing',
          description: 'Main conference room with presentation setup',
          amenities: ['projector', 'whiteboard', 'microphone', 'speakers'],
          available: true
        },
        {
          id: 'room-b', 
          name: 'Conference Room B',
          capacity: 8,
          location: 'First Floor, West Wing',
          description: 'Smaller meeting room, ideal for focused discussions',
          amenities: ['whiteboard', 'flipchart', 'natural_light'],
          available: true
        },
        {
          id: 'room-c',
          name: 'Collaboration Space',
          capacity: 15,
          location: 'Second Floor, Open Area',
          description: 'Open collaborative space with flexible seating',
          amenities: ['moveable_furniture', 'whiteboard', 'power_outlets', 'wifi_strong'],
          available: true
        },
        {
          id: 'room-d',
          name: 'Small Meeting Room',
          capacity: 6,
          location: 'Second Floor, Corner',
          description: 'Intimate space for small group discussions',
          amenities: ['whiteboard', 'natural_light'],
          available: true
        }
      ]
      
      // Save default rooms
      await fs.writeFile(roomsPath, JSON.stringify(defaultRooms, null, 2))
      
      return {
        success: true,
        rooms: defaultRooms
      }
    }
  } catch (error) {
    logger.error('Error reading rooms:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to retrieve rooms'
    })
  }
})
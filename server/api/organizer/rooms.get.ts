import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'
import type { Room } from '~/types/room'

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
          name: 'Quiet Room',
          capacity: 6,
          location: 'Third Floor, Corner',
          description: 'Quiet space for intimate discussions',
          amenities: ['natural_light', 'whiteboard'],
          available: true
        }
      ]
      
      // Create the rooms file with default data
      await fs.mkdir(join(process.cwd(), 'data'), { recursive: true })
      await fs.writeFile(roomsPath, JSON.stringify(defaultRooms, null, 2))
      
      return {
        success: true,
        rooms: defaultRooms
      }
    }
  } catch (error) {
    logger.error('Error loading rooms:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to load rooms'
    })
  }
})

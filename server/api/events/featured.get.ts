import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'

export default defineEventHandler(async (event) => {
  try {
    const platformPath = join(process.cwd(), 'data', 'platform')
    const eventsPath = join(platformPath, 'events.json')
    const membershipsPath = join(platformPath, 'memberships.json')
    
    // Load events
    let events = []
    try {
      const eventsData = await fs.readFile(eventsPath, 'utf-8')
      events = JSON.parse(eventsData)
    } catch {
      return {
        success: true,
        events: []
      }
    }

    // Load memberships for participant counts
    let memberships = []
    try {
      const membershipsData = await fs.readFile(membershipsPath, 'utf-8')
      memberships = JSON.parse(membershipsData)
    } catch {
      // No memberships file
    }

    // Filter to show only active or upcoming public events
    const featuredEvents = events
      .filter((e: any) => e.isActive || new Date(e.startDate) > new Date())
      .filter((e: any) => e.isPublic !== false) // Show public events
      .slice(0, 6) // Limit to 6 featured events
      .map((event: any) => {
        // Get participant count
        const eventMemberships = memberships.filter((m: any) => m.eventId === event.id)
        
        return {
          id: event.id,
          code: event.code,
          name: event.name,
          description: event.description || 'Join this exciting unconference event',
          location: event.location || 'Online',
          startDate: event.startDate,
          endDate: event.endDate,
          isActive: event.isActive,
          participantCount: eventMemberships.length,
          imageUrl: event.imageUrl
        }
      })

    return {
      success: true,
      events: featuredEvents
    }

  } catch (error) {
    logger.error('Error getting featured events:', error)
    return {
      success: true,
      events: []
    }
  }
})

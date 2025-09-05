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

    // By default, events are private and only accessible by invitation
    // Featured events section is removed from the public landing page
    // All events require invitation codes to access
    const featuredEvents: any[] = []

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

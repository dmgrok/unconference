import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../../utils/logger'
import { requireEventPermission } from "../../../../utils/authService"
import { requireActiveEvent } from "../../../../utils/eventStatusHelper"
import { z } from 'zod'
import { randomUUID } from 'crypto'

const topicSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3)
})

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      message: 'Event ID is required'
    })
  }

  // Check if the event is active before allowing topic creation
  await requireActiveEvent(eventId)

  // Check if user has permission to create topics in this event
  const user = await requireEventPermission(event, eventId, 'topics', 'create')
  
  const body = await readValidatedBody(event, topicSchema.parse)
  
  try {
    const topicsPath = join(process.cwd(), 'data', 'events', eventId, 'topics.json')
    
    // Ensure directory exists
    await fs.mkdir(join(process.cwd(), 'data', 'events', eventId), { recursive: true })
    
    // Read existing topics or create empty array
    let topics = []
    try {
      const topicsData = await fs.readFile(topicsPath, 'utf-8')
      topics = JSON.parse(topicsData)
    } catch {
      // File doesn't exist, start with empty array
    }
    
    // Create new topic
    const newTopic = {
      id: randomUUID(),
      title: body.title,
      description: body.description,
      createdBy: (user as any).email || (user as any).name,
      votes: 0,
      voters: [],
      eventId: eventId,
      createdAt: new Date().toISOString()
    }
    
    // Add to topics array
    topics.push(newTopic)
    
    // Write back to file
    await fs.writeFile(topicsPath, JSON.stringify(topics, null, 2))
    
    logger.info(`Topic created: ${newTopic.title} in event ${eventId} by ${newTopic.createdBy}`)
    
    return newTopic
  } catch (error: any) {
    if (error.statusCode) throw error
    
    logger.error('Error creating topic:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create topic'
    })
  }
})

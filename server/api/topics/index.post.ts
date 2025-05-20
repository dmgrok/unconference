import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const topicSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3)
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const body = await readValidatedBody(event, topicSchema.parse)
  const config = useRuntimeConfig()
  const topicsPath = join(process.cwd(), config.topicsFilePath)
  
  try {
    // Read existing topics
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData)
    
    // Create new topic
    const newTopic = {
      id: randomUUID(),
      title: body.title,
      description: body.description,
      createdBy: user.email,
      votes: 0,
      voters: []
    }
    
    // Add to topics array
    topics.push(newTopic)
    
    // Write back to file
    await fs.writeFile(topicsPath, JSON.stringify(topics, null, 2))
    
    return newTopic
  } catch (error) {
    logger.error('Error creating topic:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create topic'
    })
  }
})

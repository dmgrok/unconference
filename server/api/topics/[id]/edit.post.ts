import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../utils/logger'
import type { DiscussionTopic } from '~/types/topic'
import { z } from 'zod'

const editSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(3)
})

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const topicId = getRouterParam(event, 'id')
  const body = await readValidatedBody(event, editSchema.parse)
  
  const topicsPath = join(process.cwd(), 'server/api/topics.json')
  
  try {
    // Read existing topics
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData) as DiscussionTopic[]
    
    // Find topic
    const topic = topics.find(t => t.id === topicId)
    if (!topic) {
      throw createError({
        statusCode: 404,
        message: 'Topic not found'
      })
    }
    
    // Check permissions
    const isAdmin = user.role === 'Admin'
    const isAuthor = topic.createdBy === user.email
    
    if (!isAdmin && !isAuthor) {
      throw createError({
        statusCode: 403,
        message: 'Only admins and the topic author can edit this topic'
      })
    }
    
    // Update topic
    const oldTitle = topic.title
    topic.title = body.title
    topic.description = body.description
    
    // Write back to file
    await fs.writeFile(topicsPath, JSON.stringify(topics, null, 2))
    
    logger.debug(`Topic "${oldTitle}" edited by ${user.email}`)
    return topic
  } catch (error) {
    if (error.statusCode) throw error
    
    logger.error('Error editing topic:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to edit topic'
    })
  }
})

import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../utils/logger'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const topicId = getRouterParam(event, 'id')
  
  const topicsPath = join(process.cwd(), 'server/api/topics.json')
  
  try {
    // Read existing topics
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData)
    
    // Find topic
    const topic = topics.find(t => t.id === topicId)
    if (!topic) {
      throw createError({
        statusCode: 404,
        message: 'Topic not found'
      })
    }
    
    // Check if user has voted for this topic
    if (!topic.voters.includes(user.email)) {
      throw createError({
        statusCode: 400,
        message: 'You have not voted for this topic'
      })
    }
    
    // Remove vote
    topic.votes -= 1
    topic.voters = topic.voters.filter(voter => voter !== user.email)
    
    // Write back to file
    await fs.writeFile(topicsPath, JSON.stringify(topics, null, 2))
    
    return topic
  } catch (error) {
    if (error.statusCode) throw error
    
    logger.error('Error canceling vote:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to cancel vote'
    })
  }
})

import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../utils/logger'
import type { DiscussionTopic } from '~/types/topic'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  // Verify admin role
  if (user.role !== 'Admin') {
    throw createError({
      statusCode: 403,
      message: 'Only administrators can freeze topics'
    })
  }

  const topicId = getRouterParam(event, 'id')
  const config = useRuntimeConfig()
  const topicsPath = join(process.cwd(), config.topicsFilePath)
  
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
    
    // Reset votes and mark as frozen
    const previousVoters = [...topic.voters] // Save voters before resetting
    topic.votes = 0
    topic.voters = []
    topic.frozen = true
    topic.selectedForRound = false
    
    // Write back to file
    await fs.writeFile(topicsPath, JSON.stringify(topics, null, 2))
    
    logger.debug(`Topic "${topic.title}" frozen by admin ${user.email}. ${previousVoters.length} votes were reset.`)
    return { 
      topic,
      previousVoters
    }
  } catch (error) {
    logger.error('Error freezing topic:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to freeze topic'
    })
  }
})

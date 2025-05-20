import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'
import type { DiscussionTopic } from '~/types/topic'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const topTopicsCount = config.public.topTopicsCount
  const { user } = await requireUserSession(event)
  
  // Verify admin role
  if (user.role !== 'Admin') {
    throw createError({
      statusCode: 403,
      message: 'Only administrators can start a new round'
    })
  }

  const topicsPath = join(process.cwd(), config.topicsFilePath)
  
  try {
    // Read existing topics
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData) as DiscussionTopic[]
    
    // Sort topics by votes to find top 10
    const sortedTopics = [...topics].sort((a, b) => b.votes - a.votes)
    const topTopics = sortedTopics.slice(0, topTopicsCount)
    
    // Award badges to top topics
    topTopics.forEach((topTopic: DiscussionTopic) => {
      const topic = topics.find(t => t.id === topTopic.id)
      if (topic) {
        // Initialize badges if not exists
        topic.badges = (topic.badges || 0) + 1
      }
    })
    
    // Reset votes, selection status, and frozen status for all topics
    topics.forEach(topic => {
      topic.votes = 0
      topic.voters = []
      topic.selectedForRound = false
      topic.frozen = false
    })
    
    // Write back to file
    await fs.writeFile(topicsPath, JSON.stringify(topics, null, 2))
    
    logger.debug(`New round started by admin ${user.email}. Badges awarded to top 10 topics.`)
    return { message: 'New round started successfully' }
  } catch (error) {
    logger.error('Error starting new round:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to start new round'
    })
  }
})

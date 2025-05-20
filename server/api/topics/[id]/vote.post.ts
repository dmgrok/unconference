import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../utils/logger'

const VOTE_LIMIT = 12

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const topicId = getRouterParam(event, 'id')
  
  const topicsPath = join(process.cwd(), 'server/api/topics.json')
  
  try {
    // Read existing topics
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData)
    
    // Check if user has already voted
    const hasVoted = topics.some(topic => topic.voters.includes(user.email))
    if (hasVoted) {
      throw createError({
        statusCode: 400,
        message: 'You have already voted in this round'
      })
    }
    
    // Find and update topic
    const topic = topics.find(t => t.id === topicId)
    if (!topic) {
      throw createError({
        statusCode: 404,
        message: 'Topic not found'
      })
    }

    // Check vote limit
    if (topic.votes >= VOTE_LIMIT) {
      throw createError({
        statusCode: 400,
        message: 'This topic has reached the maximum number of votes for this round'
      })
    }
    
    // Add vote
    topic.votes += 1
    topic.voters.push(user.email)

    // Check if topic just reached the limit
    if (topic.votes === VOTE_LIMIT) {
      topic.selectedForRound = true
      logger.debug(`Topic "${topic.title}" has reached the vote limit and is selected for the round`)
    }
    
    // Write back to file
    await fs.writeFile(topicsPath, JSON.stringify(topics, null, 2))
    
    return topic
  } catch (error) {
    if (error.statusCode) throw error
    
    logger.error('Error voting for topic:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to vote for topic'
    })
  }
})

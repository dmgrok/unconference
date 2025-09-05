import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../utils/logger'
import { getAdminSettings } from '../../../../utils/adminSettings'
import { monitoringService } from '../../../utils/monitoringService'
import type { DiscussionTopic } from '~/types/topic'
import type { User } from '~/types/user'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const adminSettings = await getAdminSettings()
  const maxVotesPerTopic = adminSettings.maxVotesPerTopic
  const { user } = await requireUserSession(event)
  const topicId = getRouterParam(event, 'id')
  
  // Track request completion for monitoring
  const onRequestEnd = (statusCode: number, error?: string) => {
    monitoringService.trackRequestEnd(event, statusCode, error)
  }
  
  const topicsPath = join(process.cwd(), config.topicsFilePath)
  
  try {
    // Read existing topics
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData)
    
    // Check if user has already voted (either simple vote or preference vote)
    const hasSimpleVote = topics.some((topic: DiscussionTopic) => topic.voters.includes((user as User).email))
    const hasPreferenceVote = topics.some((topic: DiscussionTopic) => 
      topic.firstChoiceVoters?.includes((user as User).email) || 
      topic.secondChoiceVoters?.includes((user as User).email)
    )
    
    if (hasSimpleVote || hasPreferenceVote) {
      throw createError({
        statusCode: 400,
        message: 'You have already voted. Please use the preferences page to change your votes.'
      })
    }
    
    // Find and update topic
    const topic = topics.find((t: DiscussionTopic) => t.id === topicId)
    if (!topic) {
      throw createError({
        statusCode: 404,
        message: 'Topic not found'
      })
    }

    // Check vote limit
    if (topic.votes >= maxVotesPerTopic) {
      throw createError({
        statusCode: 400,
        message: 'This topic has reached the maximum number of votes for this round'
      })
    }
    
    // Add vote
    topic.votes += 1
    topic.voters.push((user as User).email)

    // Check if topic just reached the limit
    if (topic.votes === maxVotesPerTopic) {
      topic.selectedForRound = true
      logger.debug(`Topic "${topic.title}" has reached the vote limit and is selected for the round`)
    }
    
    // Write back to file
    await fs.writeFile(topicsPath, JSON.stringify(topics, null, 2))
    
    // Track successful vote for monitoring
    const userId = (user as User).email || (user as any).id || 'unknown'
    monitoringService.trackUserActivity(userId, 'vote_topic', event, topicId)
    onRequestEnd(200)
    
    return topic
  } catch (error: any) {
    if (error.statusCode) {
      onRequestEnd(error.statusCode, error.statusMessage)
      throw error
    }
    
    logger.error('Error voting for topic:', error)
    onRequestEnd(500, 'Failed to vote for topic')
    throw createError({
      statusCode: 500,
      message: 'Failed to vote for topic'
    })
  }
})

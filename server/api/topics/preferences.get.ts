import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'
import type { DiscussionTopic } from '~/types/topic'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const config = useRuntimeConfig()
  
  const topicsPath = join(process.cwd(), config.topicsFilePath)
  
  try {
    // Read existing topics
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData) as DiscussionTopic[]
    
    // Find user's preferences
    let firstChoice: string | undefined
    let secondChoice: string | undefined
    
    topics.forEach(topic => {
      if (topic.firstChoiceVoters?.includes(user.email)) {
        firstChoice = topic.id
      }
      if (topic.secondChoiceVoters?.includes(user.email)) {
        secondChoice = topic.id
      }
    })
    
    return {
      success: true,
      preferences: {
        firstChoice,
        secondChoice,
        hasVoted: !!(firstChoice || secondChoice)
      }
    }
    
  } catch (error) {
    logger.error('Error getting preferences:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to retrieve voting preferences'
    })
  }
})
import { promises as fs } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import logger from '../../../utils/logger'
import { getAdminSettings } from '../../../utils/adminSettings'
import type { DiscussionTopic } from '~/types/topic'

const preferencesSchema = z.object({
  firstChoice: z.string().optional(),
  secondChoice: z.string().optional()
}).refine(data => data.firstChoice || data.secondChoice, {
  message: "At least one preference must be selected"
}).refine(data => data.firstChoice !== data.secondChoice, {
  message: "First and second choices must be different"
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const adminSettings = await getAdminSettings()
  const { user } = await requireUserSession(event)
  const { firstChoice, secondChoice } = await readValidatedBody(event, preferencesSchema.parse)
  
  const topicsPath = join(process.cwd(), config.topicsFilePath)
  
  try {
    // Read existing topics
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData) as DiscussionTopic[]
    
    // Initialize preference arrays if they don't exist (backward compatibility)
    topics.forEach(topic => {
      if (!topic.firstChoiceVoters) topic.firstChoiceVoters = []
      if (!topic.secondChoiceVoters) topic.secondChoiceVoters = []
      if (topic.totalPreferenceScore === undefined) topic.totalPreferenceScore = 0
    })
    
        // Remove user from all previous votes
    topics.forEach(topic => {
      topic.firstChoiceVoters = topic.firstChoiceVoters.filter(email => email !== (user as any).email)
      topic.secondChoiceVoters = topic.secondChoiceVoters.filter(email => email !== (user as any).email)
      topic.voters = topic.voters.filter(email => email !== (user as any).email)
    })
    
    // Add new preferences
    if (firstChoice) {
      const firstTopic = topics.find(t => t.id === firstChoice)
      if (!firstTopic) {
        throw createError({
          statusCode: 404,
          message: 'First choice topic not found'
        })
      }
      
      if (firstTopic.frozen) {
        throw createError({
          statusCode: 400,
          message: 'Cannot vote for frozen topic'
        })
      }
      
      firstTopic.firstChoiceVoters.push((user as any).email)
      firstTopic.voters.push((user as any).email) // Keep for backward compatibility
    }
    
    if (secondChoice) {
      const secondTopic = topics.find(t => t.id === secondChoice)
      if (!secondTopic) {
        throw createError({
          statusCode: 404,
          message: 'Second choice topic not found'
        })
      }
      
      if (secondTopic.frozen) {
        throw createError({
          statusCode: 400,
          message: 'Cannot vote for frozen topic'
        })
      }
      
      secondTopic.secondChoiceVoters.push((user as any).email)
    }
    
    // Recalculate scores and vote counts for all topics
    topics.forEach(topic => {
      topic.votes = topic.firstChoiceVoters.length + topic.secondChoiceVoters.length
      topic.totalPreferenceScore = (topic.firstChoiceVoters.length * 2) + topic.secondChoiceVoters.length
      
      // Check if topic reaches vote limit based on total votes
      const maxVotes = adminSettings.maxVotesPerTopic
      if (topic.votes >= maxVotes && !topic.selectedForRound) {
        topic.selectedForRound = true
        logger.debug(`Topic "${topic.title}" has reached the vote limit and is selected for the round`)
      }
    })
    
    // Write back to file
    await fs.writeFile(topicsPath, JSON.stringify(topics, null, 2))
    
    logger.info(`User ${(user as any).email} updated preferences: 1st=${firstChoice || 'none'}, 2nd=${secondChoice || 'none'}`)
    
    return {
      success: true,
      preferences: {
        firstChoice,
        secondChoice
      }
    }
    
  } catch (error: any) {
    if (error.statusCode) throw error
    
    logger.error('Error updating preferences:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update voting preferences'
    })
  }
})
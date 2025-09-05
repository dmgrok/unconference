import { promises as fs } from 'fs'
import { join } from 'path'
import type { DiscussionTopic, TopicSelection } from '~/types/topic'
import type { User } from '~/types/user'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { user } = await requireUserSession(event)
  
  // Verify admin or organizer role - check both legacy and new role properties
  const userRole = (user as any)?.Role || (user as any)?.role
  if (!['Admin', 'Organizer'].includes(userRole) && (user as any).globalRole !== 'SuperAdmin') {
    throw createError({
      statusCode: 403,
      message: 'Only administrators and organizers can access topic selection'
    })
  }

  const topicsPath = join(process.cwd(), config.topicsFilePath)
  
  try {
    // Read existing topics
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData) as DiscussionTopic[]
    
    // Sort topics by preference score (weighted voting)
    const sortedTopics = [...topics]
      .filter(topic => !topic.frozen) // Only include non-frozen topics
      .sort((a, b) => (b.totalPreferenceScore || 0) - (a.totalPreferenceScore || 0))
    
    // Convert to TopicSelection format
    const topicSelections: TopicSelection[] = sortedTopics.map(topic => ({
      topicId: topic.id,
      title: topic.title,
      description: topic.description,
      totalPreferenceScore: topic.totalPreferenceScore || 0,
      participantCount: (topic.firstChoiceVoters?.length || 0) + (topic.secondChoiceVoters?.length || 0),
      selected: false // Initially not selected
    }))
    
    return topicSelections
  } catch (error) {
    console.error('Error getting topic selection data:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to load topics for selection'
    })
  }
})

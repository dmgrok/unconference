import { promises as fs } from 'fs'
import { join } from 'path'
import type { DiscussionTopic } from '~/types/topic'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  
  // Only admins and organizers can access voting stats
  const userRole = (user as any).Role || (user as any).role
  if (!['Admin', 'Organizer'].includes(userRole) && (user as any).globalRole !== 'SuperAdmin') {
    throw createError({
      statusCode: 403,
      message: 'Access denied. Admin or organizer role required.'
    })
  }
  
  const config = useRuntimeConfig()
  const topicsPath = join(process.cwd(), config.topicsFilePath)
  
  try {
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData) as DiscussionTopic[]
    
    // Calculate statistics
    const totalVotes = topics.reduce((sum, topic) => sum + topic.votes, 0)
    
    const allVoters = new Set()
    topics.forEach(topic => {
      topic.voters.forEach(voter => allVoters.add(voter))
    })
    const totalVoters = allVoters.size
    
    const topTopics = [...topics]
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 10)
      .map(topic => ({
        id: topic.id,
        title: topic.title,
        votes: topic.votes,
        percentage: totalVotes > 0 ? Math.round((topic.votes / totalVotes) * 100) : 0
      }))
    
    const averageVotesPerTopic = topics.length > 0 ? Math.round(totalVotes / topics.length) : 0
    
    // Voting activity over time (mock data for now - could be enhanced to track real timestamps)
    const votingActivity = {
      lastUpdate: new Date().toISOString(),
      recentActivity: topics.filter(t => t.votes > 0).length
    }
    
    return {
      success: true,
      stats: {
        totalVotes,
        totalVoters,
        totalTopics: topics.length,
        averageVotesPerTopic,
        topTopics,
        votingActivity
      }
    }
    
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: 'Failed to retrieve voting statistics'
    })
  }
})

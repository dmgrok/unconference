import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../../utils/logger'
import type { DiscussionTopic } from '~/types/topic'

export default defineEventHandler(async (event) => {
  const topicId = getRouterParam(event, 'id')
  const { user } = await requireUserSession(event)
  const config = useRuntimeConfig()
  const topicsPath = join(process.cwd(), config.topicsFilePath)
  const activeRoundPath = join(process.cwd(), config.activeRoundFilePath)
  
  // NOTE: This is a legacy endpoint for single-event installations.
  // In multi-event mode, topic deletion should go through event-specific endpoints
  // which include proper event status validation.
  
  if (!topicId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Topic ID is required'
    })
  }

  try {
    // Read existing topics
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData) as DiscussionTopic[]
    
    const topicIndex = topics.findIndex((t: any) => t.id === topicId)
    
    if (topicIndex === -1) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Topic not found'
      })
    }

    const topic = topics[topicIndex]

    // Check permissions: Only Admin/Organizer can delete topics
    const userRole = (user as any).Role || (user as any).role
    const isAdminOrOrganizer = ['Admin', 'Organizer'].includes(userRole)

    if (!isAdminOrOrganizer) {
      throw createError({
        statusCode: 403,
        statusMessage: 'Only organizers and administrators can delete topics'
      })
    }

    // Check if topic is frozen - frozen topics cannot be deleted
    if (topic.frozen) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Frozen topics cannot be deleted'
      })
    }

    // Check if topic is currently selected for an active round
    try {
      const activeRoundData = await fs.readFile(activeRoundPath, 'utf-8')
      const activeRound = JSON.parse(activeRoundData)
      
      if (activeRound?.isActive && activeRound.selectedTopics?.some((st: any) => st.id === topicId)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Cannot delete topic that is currently in an active round'
        })
      }
    } catch (error) {
      // Active round file might not exist, which is fine
      if ((error as any).code !== 'ENOENT') {
        throw error
      }
    }

    // Remove the topic
    topics.splice(topicIndex, 1)
    await fs.writeFile(topicsPath, JSON.stringify(topics, null, 2))

    logger.info(`Topic "${topic.title}" deleted by ${(user as any).email}`)

    return { success: true, message: 'Topic deleted successfully' }
  } catch (error: any) {
    logger.error('Delete topic error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to delete topic'
    })
  }
})

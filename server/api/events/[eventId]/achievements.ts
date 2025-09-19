// Phase 1 API: Achievement System
import prisma from '~/lib/database'

// Type assertion for new Prisma models
const db = prisma as any

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const query = getQuery(event)
  const { eventId } = getRouterParams(event)
  const body = method !== 'GET' ? await readBody(event) : null
  
  // Get current user from session
  const { user } = await requireUserSession(event)
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  const userId = (user as any).id

  switch (method) {
    case 'GET':
      return await handleGet(eventId, userId, query)
    case 'POST':
      return await handlePost(eventId, userId, body)
    default:
      throw createError({
        statusCode: 405,
        statusMessage: 'Method not allowed'
      })
  }
})

// GET handlers
async function handleGet(eventId: string, userId: string, query: any) {
  const { type } = query

  switch (type) {
    case 'user-achievements':
      return await getUserAchievements(userId, eventId)
    
    case 'progress':
      return await getAchievementProgress(userId, eventId)
    
    case 'leaderboard':
      // Removed complex leaderboard - not needed for lean MVP
      return { message: 'Leaderboard feature disabled in lean version' }
    
    default:
      return await getUserAchievements(userId, eventId)
  }
}

// POST handlers
async function handlePost(eventId: string, userId: string, body: any) {
  const { action } = body

  switch (action) {
    case 'grant-achievement':
      return await grantAchievement(eventId, userId, body)
    
    case 'check-triggers':
      return await checkAchievementTriggers(eventId, userId)
    
    default:
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid action'
      })
  }
}

// Simplified Achievement Definitions - Lean MVP (3 essential achievements only)
const ACHIEVEMENT_DEFINITIONS = {
  'first_topic': {
    name: 'Topic Creator',
    description: 'Submitted your first topic',
    icon: 'mdi-lightbulb',
    color: 'success',
    trigger: 'topics_created',
    threshold: 1
  },
  'active_participant': {
    name: 'Active Participant',
    description: 'Voted on topics and joined discussions',
    icon: 'mdi-vote',
    color: 'primary',
    trigger: 'voting_participation',
    threshold: 1
  },
  'event_host': {
    name: 'Event Host',
    description: 'Created and ran an unconference event',
    icon: 'mdi-calendar-star',
    color: 'secondary',
    trigger: 'events_created',
    threshold: 1
  }
}

// Get user achievements
async function getUserAchievements(userId: string, eventId: string) {
  // Get user's earned achievements
  const userAchievements = await db.userAchievement.findMany({
    where: { userId }
  })

  // Get progress for each achievement type
  const progress = await getAchievementProgress(userId, eventId)
  
  // Combine earned achievements with progress data
  const achievements = Object.entries(ACHIEVEMENT_DEFINITIONS).map(([id, def]) => {
    const earned = userAchievements.find((ua: any) => ua.achievementType === id)
    const currentProgress = progress.find((p: any) => p.type === def.trigger)
    
    return {
      id,
      ...def,
      earned: !!earned,
      earnedAt: earned?.earnedAt,
      isNew: earned ? isRecentlyEarned(earned.earnedAt) : false,
      progress: currentProgress?.count || 0,
      maxProgress: def.threshold,
      shareText: def.shareText.replace('{count}', currentProgress?.count || 0)
    }
  })

  return { achievements }
}

// Simplified achievement progress tracking - only 3 essential metrics
async function getAchievementProgress(userId: string, eventId: string) {
  const progress = []

  // Topics created (file-based storage approach)
  const topicsPath = process.env.NUXT_TOPICS_FILE_PATH || './data/topics.json'
  let topicsCreated = 0
  try {
    const { readFile } = await import('fs/promises')
    const topicsData = await readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData)
    topicsCreated = topics.filter((t: any) => t.createdBy === userId || t.submittedBy === userId).length
  } catch (error) {
    // File doesn't exist or parse error, default to 0
  }
  progress.push({ type: 'topics_created', count: topicsCreated })

  // Voting participation (check if user has voted in any topics)
  let votingParticipation = 0
  try {
    const { readFile } = await import('fs/promises')
    const topicsData = await readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData)
    const hasVoted = topics.some((t: any) =>
      t.voters?.includes(userId) ||
      t.firstChoiceVoters?.includes(userId) ||
      t.secondChoiceVoters?.includes(userId)
    )
    votingParticipation = hasVoted ? 1 : 0
  } catch (error) {
    // File doesn't exist or parse error, default to 0
  }
  progress.push({ type: 'voting_participation', count: votingParticipation })

  // Events created (check if user has created any events)
  const eventsPath = process.env.NUXT_EVENTS_FILE_PATH || './data/events.json'
  let eventsCreated = 0
  try {
    const { readFile } = await import('fs/promises')
    const eventsData = await readFile(eventsPath, 'utf-8')
    const events = JSON.parse(eventsData)
    eventsCreated = events.filter((e: any) => e.organizerId === userId || e.createdBy === userId).length
  } catch (error) {
    // File doesn't exist or parse error, default to 0
  }
  progress.push({ type: 'events_created', count: eventsCreated })

  return progress
}

// Check and grant achievements based on triggers
async function checkAchievementTriggers(eventId: string, userId: string) {
  const progress = await getAchievementProgress(userId, eventId)
  const userAchievements = await db.userAchievement.findMany({
    where: { userId },
    select: { achievementType: true }
  })

  const earnedTypes = userAchievements.map((ua: any) => ua.achievementType)
  const newAchievements = []

  // Check each achievement definition
  for (const [id, def] of Object.entries(ACHIEVEMENT_DEFINITIONS)) {
    if (earnedTypes.includes(id)) continue // Already earned

    const currentProgress = progress.find(p => p.type === def.trigger)
    if (currentProgress && currentProgress.count >= def.threshold) {
      // Grant the achievement
      const achievement = await grantAchievement(eventId, userId, {
        achievementType: id,
        metadata: { count: currentProgress.count }
      })
      newAchievements.push(achievement)
    }
  }

  return { newAchievements }
}

// Grant achievement to user
async function grantAchievement(eventId: string, userId: string, body: any) {
  const { achievementType, metadata = {} } = body
  const def = ACHIEVEMENT_DEFINITIONS[achievementType as keyof typeof ACHIEVEMENT_DEFINITIONS]
  
  if (!def) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid achievement type'
    })
  }

  // Check if already earned
  const existing = await db.userAchievement.findFirst({
    where: {
      userId,
      achievementType
    }
  })

  if (existing) {
    return { alreadyEarned: true, id: existing.id }
  }

  // Create achievement record
  const achievement = await db.userAchievement.create({
    data: {
      userId,
      achievementType,
      eventId,
      metadata: JSON.stringify(metadata)
    }
  })

  return { 
    id: achievement.id, 
    granted: true,
    achievement: {
      id: achievementType,
      ...def,
      earnedAt: achievement.earnedAt
    }
  }
}

// Removed complex leaderboard function - not needed for lean MVP
// Simple achievements are about personal recognition, not competition

// Helper function to check if achievement was recently earned (within 24 hours)
function isRecentlyEarned(earnedAt: Date | string): boolean {
  const earned = new Date(earnedAt)
  const now = new Date()
  const diffMs = now.getTime() - earned.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours <= 24
}

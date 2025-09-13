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
      return await getAchievementLeaderboard(eventId)
    
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

// Achievement definitions with trigger logic
const ACHIEVEMENT_DEFINITIONS = {
  'super-connector': {
    name: 'Super Connector',
    description: 'Connected with 10+ people at an event',
    icon: 'mdi-account-group',
    color: 'primary',
    shareText: 'Just earned Super Connector at today\'s unconference! Made amazing connections with {count} incredible people. 🤝 #networking',
    trigger: 'connection_count',
    threshold: 10,
    category: 'NETWORKING'
  },
  'collaboration-catalyst': {
    name: 'Collaboration Catalyst',
    description: 'Started 3+ collaborations from one event',
    icon: 'mdi-handshake',
    color: 'success',
    shareText: 'Started {count} new collaborations at today\'s event! The power of bringing people together 🚀 #collaboration',
    trigger: 'collaboration_count',
    threshold: 3,
    category: 'COLLABORATION'
  },
  'topic-champion': {
    name: 'Topic Champion',
    description: 'Had your topic selected for discussion 5 times',
    icon: 'mdi-lightbulb',
    color: 'warning',
    shareText: 'My topics have been selected {count} times for discussions! Thanks for believing in my ideas 💡',
    trigger: 'topic_selections',
    threshold: 5,
    category: 'CONTRIBUTION'
  },
  'knowledge-sharer': {
    name: 'Knowledge Sharer',
    description: 'Added 25+ resources to collaboration spaces',
    icon: 'mdi-share-variant',
    color: 'info',
    shareText: 'Shared {count}+ helpful resources with the community! Knowledge grows when shared 📚',
    trigger: 'resources_added',
    threshold: 25,
    category: 'CONTRIBUTION'
  },
  'project-launcher': {
    name: 'Project Launcher',
    description: 'Launched a successful project from an event',
    icon: 'mdi-rocket',
    color: 'purple',
    shareText: 'Just launched my first project that started at an unconference! From idea to reality 🚀',
    trigger: 'projects_launched',
    threshold: 1,
    category: 'PROJECT'
  },
  'mentor-matchmaker': {
    name: 'Mentor Matchmaker',
    description: 'Successfully connected 10 mentors with mentees',
    icon: 'mdi-account-switch',
    color: 'orange',
    shareText: 'Helped connect {count} mentors with mentees! Building the next generation 🌟',
    trigger: 'introductions_made',
    threshold: 10,
    category: 'MENTORSHIP'
  },
  'early-adopter': {
    name: 'Early Adopter',
    description: 'One of the first 100 users of the platform',
    icon: 'mdi-star',
    color: 'amber',
    shareText: 'Proud to be an early adopter of this amazing unconference platform! 🌟',
    trigger: 'user_rank',
    threshold: 100,
    category: 'MILESTONE'
  },
  'event-regular': {
    name: 'Event Regular',
    description: 'Attended 5+ events',
    icon: 'mdi-calendar-check',
    color: 'teal',
    shareText: 'Just attended my {count}th unconference event! Loving this community 💙',
    trigger: 'events_attended',
    threshold: 5,
    category: 'PARTICIPATION'
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

// Get achievement progress for user
async function getAchievementProgress(userId: string, eventId: string) {
  const progress = []

  // Connection count (across all events for user)
  const connectionCount = await db.eventConnection.count({
    where: {
      OR: [
        { participantAId: userId },
        { participantBId: userId }
      ]
    }
  })
  progress.push({ type: 'connection_count', count: connectionCount })

  // Collaboration count
  const collaborationCount = await db.collaborationSpace.count({
    where: {
      // Check if user is in contributors JSON array
      contributors: { contains: userId }
    }
  })
  progress.push({ type: 'collaboration_count', count: collaborationCount })

  // Topic selections (topics created by user that were selected for discussion)
  const topicSelections = await db.topic.count({
    where: {
      authorId: userId,
      selected: true
    }
  })
  progress.push({ type: 'topic_selections', count: topicSelections })

  // Resources added
  const resourcesAdded = await db.collaborationResource.count({
    where: { addedBy: userId }
  })
  progress.push({ type: 'resources_added', count: resourcesAdded })

  // Projects launched (work showcases with status COMPLETED or ACTIVE)
  const projectsLaunched = await db.workShowcase.count({
    where: {
      contributors: { contains: userId },
      status: { in: ['ACTIVE', 'COMPLETED'] }
    }
  })
  progress.push({ type: 'projects_launched', count: projectsLaunched })

  // Introductions made
  const introductionsMade = await db.introductionRequest.count({
    where: { requesterId: userId }
  })
  progress.push({ type: 'introductions_made', count: introductionsMade })

  // Events attended
  const eventsAttended = await db.participant.count({
    where: { userId }
  })
  progress.push({ type: 'events_attended', count: eventsAttended })

  // User rank (when they joined)
  const userRank = await db.user.count({
    where: {
      createdAt: { lt: (await db.user.findUnique({ where: { id: userId } }))?.createdAt }
    }
  })
  progress.push({ type: 'user_rank', count: userRank + 1 })

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

// Get achievement leaderboard for event
async function getAchievementLeaderboard(eventId: string) {
  // Get users with most achievements in this event
  const leaderboard = await db.user.findMany({
    include: {
      achievements: {
        where: { eventId }
      },
      _count: {
        select: {
          achievements: {
            where: { eventId }
          }
        }
      }
    },
    orderBy: {
      achievements: {
        _count: 'desc'
      }
    },
    take: 10
  })

  return { 
    leaderboard: leaderboard.map((user: any) => ({
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      achievementCount: user._count.achievements,
      recentAchievements: user.achievements
        .filter((a: any) => isRecentlyEarned(a.earnedAt))
        .map((a: any) => a.achievementType)
    }))
  }
}

// Helper function to check if achievement was recently earned (within 24 hours)
function isRecentlyEarned(earnedAt: Date | string): boolean {
  const earned = new Date(earnedAt)
  const now = new Date()
  const diffMs = now.getTime() - earned.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours <= 24
}

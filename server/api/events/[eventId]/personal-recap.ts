// Enhanced Personal Impact Recap for Viral Growth
import prisma from '~/lib/database'

const db = prisma as any

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const { eventId } = getRouterParams(event)
  const query = getQuery(event)

  if (method !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  const { userId } = query

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'userId is required'
    })
  }

  const personalRecap = await generatePersonalRecap(eventId as string, userId as string)
  return personalRecap
})

async function generatePersonalRecap(eventId: string, userId: string) {
  // Get event details
  const eventDetails = await db.event.findUnique({
    where: { id: eventId },
    select: {
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      maxParticipants: true,
      _count: {
        select: {
          memberships: true,
          topics: true,
          rounds: true
        }
      }
    }
  })

  // Get user's participation metrics
  const userMetrics = await getUserParticipationMetrics(eventId, userId)

  // Get user's connections
  const connections = await getUserConnections(eventId, userId)

  // Get user's collaborations
  const collaborations = await getUserCollaborations(eventId, userId)

  // Get user's achievements
  const achievements = await getUserAchievements(eventId, userId)

  // Calculate impact scores
  const impactScores = calculateImpactScores(userMetrics, connections, collaborations, achievements)

  // Generate insights and highlights
  const insights = generateInsights(userMetrics, connections, collaborations, eventDetails)

  // Create shareable stats
  const shareableStats = createShareableStats(userMetrics, connections, collaborations, achievements)

  return {
    event: {
      id: eventId,
      title: eventDetails?.title || 'Unconference Event',
      date: eventDetails?.startsAt,
      totalParticipants: eventDetails?._count.memberships || 0,
      totalTopics: eventDetails?._count.topics || 0,
      totalRounds: eventDetails?._count.rounds || 0
    },
    personalImpact: {
      participationRate: userMetrics.participationRate,
      contributionScore: impactScores.contributionScore,
      networkingScore: impactScores.networkingScore,
      collaborationScore: impactScores.collaborationScore,
      overallImpact: impactScores.overall
    },
    metrics: {
      topicsProposed: userMetrics.topicsProposed,
      topicsVotedFor: userMetrics.topicsVoted,
      firstChoiceVotes: userMetrics.firstChoiceVotes,
      secondChoiceVotes: userMetrics.secondChoiceVotes,
      sessionsAttended: userMetrics.sessionsAttended,
      connectionsMode: connections.length,
      collaborationsJoined: collaborations.length,
      achievementsEarned: achievements.length,
      actionItemsCreated: userMetrics.actionItemsCreated,
      resourcesShared: userMetrics.resourcesShared
    },
    journey: {
      startTime: userMetrics.firstActivity,
      endTime: userMetrics.lastActivity,
      activeMinutes: userMetrics.activeMinutes,
      peakEngagementTime: userMetrics.peakEngagementTime,
      keyMoments: userMetrics.keyMoments
    },
    connections: connections.map(conn => ({
      person: conn.person,
      strength: conn.connectionStrength,
      sharedTopics: conn.sharedTopics,
      collaboratedOn: conn.collaboratedOn
    })),
    collaborations: collaborations.map(collab => ({
      id: collab.id,
      name: collab.name,
      contributors: collab.contributorCount,
      yourRole: determineUserRole(collab, userId),
      actionItemsAssigned: collab.userActionItems,
      resourcesAdded: collab.userResources
    })),
    achievements: achievements.map(a => ({
      type: a.achievementType,
      name: a.name,
      description: a.description,
      icon: a.icon,
      earnedAt: a.earnedAt
    })),
    insights,
    shareableStats,
    generatedAt: new Date()
  }
}

async function getUserParticipationMetrics(eventId: string, userId: string) {
  // Get topics proposed by user
  const topicsProposed = await db.topic.count({
    where: {
      eventId,
      createdById: userId
    }
  })

  // Get votes by user
  const votes = await db.vote.findMany({
    where: {
      userId,
      topic: {
        eventId
      }
    },
    include: {
      topic: true
    }
  })

  const firstChoiceVotes = votes.filter(v => v.preference === 'FIRST_CHOICE').length
  const secondChoiceVotes = votes.filter(v => v.preference === 'SECOND_CHOICE').length

  // Get sessions attended (round participations)
  const roundParticipations = await db.roundParticipation.findMany({
    where: {
      userId,
      round: {
        eventId
      }
    },
    include: {
      round: true
    },
    orderBy: {
      assignedAt: 'asc'
    }
  })

  // Get action items created
  const actionItems = await db.actionItem.count({
    where: {
      createdBy: userId,
      collaboration: {
        eventId
      }
    }
  })

  // Get resources shared
  const resources = await db.collaborationResource.count({
    where: {
      addedBy: userId,
      collaboration: {
        eventId
      }
    }
  })

  // Calculate activity timeline
  const firstActivity = roundParticipations[0]?.assignedAt || new Date()
  const lastActivity = roundParticipations[roundParticipations.length - 1]?.assignedAt || new Date()
  const activeMinutes = Math.round((lastActivity.getTime() - firstActivity.getTime()) / 60000)

  // Identify key moments
  const keyMoments = []
  if (topicsProposed > 0) {
    keyMoments.push({
      type: 'topic_proposed',
      count: topicsProposed,
      description: `Proposed ${topicsProposed} topic${topicsProposed > 1 ? 's' : ''}`
    })
  }
  if (votes.length > 0) {
    keyMoments.push({
      type: 'voting',
      count: votes.length,
      description: `Voted for ${votes.length} topic${votes.length > 1 ? 's' : ''}`
    })
  }
  if (roundParticipations.length > 0) {
    keyMoments.push({
      type: 'participation',
      count: roundParticipations.length,
      description: `Attended ${roundParticipations.length} session${roundParticipations.length > 1 ? 's' : ''}`
    })
  }

  // Calculate participation rate
  const totalRounds = await db.round.count({
    where: { eventId }
  })
  const participationRate = totalRounds > 0 ? (roundParticipations.length / totalRounds) * 100 : 0

  return {
    topicsProposed,
    topicsVoted: votes.length,
    firstChoiceVotes,
    secondChoiceVotes,
    sessionsAttended: roundParticipations.length,
    actionItemsCreated: actionItems,
    resourcesShared: resources,
    participationRate,
    firstActivity,
    lastActivity,
    activeMinutes,
    peakEngagementTime: determinePeakEngagement(roundParticipations),
    keyMoments
  }
}

async function getUserConnections(eventId: string, userId: string) {
  const connections = await db.eventConnection.findMany({
    where: {
      eventId,
      OR: [
        { participantAId: userId },
        { participantBId: userId }
      ]
    },
    include: {
      participantA: {
        select: {
          id: true,
          name: true,
          avatar: true,
          bio: true,
          skills: true,
          linkedinUrl: true,
          allowContactSharing: true
        }
      },
      participantB: {
        select: {
          id: true,
          name: true,
          avatar: true,
          bio: true,
          skills: true,
          linkedinUrl: true,
          allowContactSharing: true
        }
      }
    }
  })

  return connections.map(conn => {
    const otherPerson = conn.participantAId === userId ? conn.participantB : conn.participantA
    return {
      person: {
        id: otherPerson.id,
        name: otherPerson.name,
        avatar: otherPerson.avatar,
        bio: otherPerson.bio,
        linkedin: otherPerson.allowContactSharing ? otherPerson.linkedinUrl : null
      },
      connectionStrength: conn.connectionStrength,
      sharedTopics: parseJsonField(conn.sharedTopics),
      collaboratedOn: parseJsonField(conn.collaboratedOn)
    }
  })
}

async function getUserCollaborations(eventId: string, userId: string) {
  // Note: Removed collaboration tracking for lean MVP
  return []
}

async function getUserAchievements(eventId: string, userId: string) {
  return await db.userAchievement.findMany({
    where: {
      userId,
      eventId
    },
    orderBy: {
      earnedAt: 'asc'
    }
  })
}

function calculateImpactScores(metrics: any, connections: any[], collaborations: any[], achievements: any[]) {
  // Contribution Score (0-100)
  const contributionScore = Math.min(100,
    (metrics.topicsProposed * 20) +
    (metrics.topicsVoted * 5) +
    (metrics.actionItemsCreated * 10) +
    (metrics.resourcesShared * 10)
  )

  // Networking Score (0-100)
  const networkingScore = Math.min(100,
    (connections.length * 10) +
    (connections.filter(c => c.connectionStrength > 5).length * 15)
  )

  // Collaboration Score (0-100)
  const collaborationScore = Math.min(100,
    (collaborations.length * 15) +
    (collaborations.filter(c => c.userActionItems > 0).length * 20) +
    (collaborations.filter(c => c.userResources > 0).length * 10)
  )

  // Overall Impact (0-100)
  const overall = Math.round(
    (contributionScore * 0.3) +
    (networkingScore * 0.35) +
    (collaborationScore * 0.35)
  )

  return {
    contributionScore,
    networkingScore,
    collaborationScore,
    overall
  }
}

function generateInsights(metrics: any, connections: any[], collaborations: any[], eventDetails: any) {
  const insights = []

  // Participation insights
  if (metrics.participationRate >= 80) {
    insights.push({
      type: 'high_engagement',
      title: 'Super Engaged Participant',
      description: `You attended ${metrics.participationRate.toFixed(0)}% of all sessions!`,
      icon: 'mdi-fire'
    })
  }

  // Connection insights
  if (connections.length >= 5) {
    insights.push({
      type: 'networking_star',
      title: 'Networking Superstar',
      description: `You made ${connections.length} meaningful connections`,
      icon: 'mdi-account-group'
    })
  }

  // Collaboration insights
  if (collaborations.length > 0) {
    const activeCollabs = collaborations.filter(c => c.status === 'ACTIVE').length
    if (activeCollabs > 0) {
      insights.push({
        type: 'active_collaborator',
        title: 'Active Collaborator',
        description: `You're actively working on ${activeCollabs} project${activeCollabs > 1 ? 's' : ''}`,
        icon: 'mdi-handshake'
      })
    }
  }

  // Topic insights
  if (metrics.topicsProposed > 0) {
    insights.push({
      type: 'thought_leader',
      title: 'Thought Leader',
      description: `You proposed ${metrics.topicsProposed} discussion topic${metrics.topicsProposed > 1 ? 's' : ''}`,
      icon: 'mdi-lightbulb'
    })
  }

  // Voting insights
  if (metrics.firstChoiceVotes > 3) {
    insights.push({
      type: 'decision_maker',
      title: 'Decision Influencer',
      description: `Your votes helped shape the event agenda`,
      icon: 'mdi-vote'
    })
  }

  return insights
}

function createShareableStats(metrics: any, connections: any[], collaborations: any[], achievements: any[]) {
  return {
    headline: generateHeadline(metrics, connections),
    stats: [
      {
        label: 'Connections Made',
        value: connections.length,
        emoji: '🤝'
      },
      {
        label: 'Topics Engaged',
        value: metrics.topicsVoted + metrics.topicsProposed,
        emoji: '💡'
      },
      {
        label: 'Sessions Attended',
        value: metrics.sessionsAttended,
        emoji: '🎯'
      },
      {
        label: 'Collaborations',
        value: collaborations.length,
        emoji: '🚀'
      }
    ],
    shareText: generateShareText(metrics, connections, collaborations),
    hashtags: ['unconference', 'networking', 'collaboration', 'innovation']
  }
}

function generateHeadline(metrics: any, connections: any[]) {
  if (connections.length >= 10) {
    return `Made ${connections.length} valuable connections!`
  } else if (metrics.topicsProposed >= 3) {
    return `Sparked ${metrics.topicsProposed} engaging discussions!`
  } else if (metrics.sessionsAttended >= 5) {
    return `Fully engaged across ${metrics.sessionsAttended} sessions!`
  } else {
    return 'Had an amazing unconference experience!'
  }
}

function generateShareText(metrics: any, connections: any[], collaborations: any[]) {
  const parts = []

  parts.push('Just wrapped up an incredible unconference!')

  if (connections.length > 0) {
    parts.push(`✨ Made ${connections.length} meaningful connections`)
  }

  if (metrics.topicsProposed > 0) {
    parts.push(`💡 Proposed ${metrics.topicsProposed} discussion topics`)
  }

  if (collaborations.length > 0) {
    parts.push(`🚀 Joined ${collaborations.length} collaborative projects`)
  }

  parts.push('\nThe power of participant-driven events is real! 🎯')

  return parts.join('\n')
}

function determinePeakEngagement(participations: any[]) {
  if (participations.length === 0) return null

  // Group by hour to find peak engagement time
  const hourCounts: Record<number, number> = {}

  participations.forEach(p => {
    const hour = new Date(p.assignedAt).getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })

  const peakHour = Object.entries(hourCounts).reduce((a, b) =>
    hourCounts[a[0] as any] > hourCounts[b[0] as any] ? a : b
  )[0]

  return `${peakHour}:00 - ${parseInt(peakHour) + 1}:00`
}

function determineUserRole(collaboration: any, userId: string) {
  const contributors = parseJsonField(collaboration.contributors)
  const index = contributors.indexOf(userId)

  if (index === 0) return 'Initiator'
  if (index <= 2) return 'Core Contributor'
  return 'Contributor'
}

function parseJsonField(field: string | null): any[] {
  if (!field) return []
  try {
    return JSON.parse(field)
  } catch {
    return []
  }
}
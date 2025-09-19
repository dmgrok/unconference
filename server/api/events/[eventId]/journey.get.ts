// Event Journey API for Visual Timeline
import prisma from '~/lib/database'

const db = prisma as any

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const { eventId } = getRouterParams(event)

  if (method !== 'GET') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    })
  }

  const journeyData = await generateEventJourney(eventId as string)
  return journeyData
})

async function generateEventJourney(eventId: string) {
  // Get event details
  const eventDetails = await db.event.findUnique({
    where: { id: eventId },
    include: {
      topics: {
        include: {
          votes: true,
          createdBy: {
            select: { name: true, avatar: true, id: true }
          }
        }
      },
      rounds: {
        include: {
          participants: {
            include: {
              user: {
                select: { name: true, avatar: true, id: true }
              }
            }
          },
          roundTopics: {
            include: {
              topic: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      },
      memberships: {
        include: {
          user: {
            select: { name: true, avatar: true, id: true }
          }
        }
      }
    }
  })

  if (!eventDetails) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Event not found'
    })
  }

  // Calculate before metrics
  const beforeMetrics = await calculateBeforeMetrics(eventId, eventDetails)

  // Calculate during metrics
  const duringMetrics = await calculateDuringMetrics(eventId, eventDetails)

  // Calculate after metrics
  const afterMetrics = await calculateAfterMetrics(eventId, eventDetails)

  // Generate timeline events
  const timelineEvents = await generateTimelineEvents(eventId, eventDetails)

  // Calculate transformations
  const transformations = calculateTransformations(beforeMetrics, afterMetrics)

  // Generate engagement data (hourly breakdown)
  const engagementData = await generateEngagementData(eventId, eventDetails)

  return {
    event: {
      id: eventId,
      title: eventDetails.title,
      startTime: eventDetails.startsAt,
      endTime: eventDetails.endsAt
    },
    before: beforeMetrics,
    during: duringMetrics,
    after: afterMetrics,
    timeline: timelineEvents,
    transformations,
    engagement: engagementData,
    generatedAt: new Date()
  }
}

async function calculateBeforeMetrics(eventId: string, eventDetails: any) {
  // Count initial registrations
  const initialParticipants = eventDetails.memberships.length

  // Count existing connections (connections that existed before this event)
  const existingConnections = await db.eventConnection.count({
    where: {
      eventId: { not: eventId },
      OR: [
        { participantAId: { in: eventDetails.memberships.map((m: any) => m.userId) } },
        { participantBId: { in: eventDetails.memberships.map((m: any) => m.userId) } }
      ]
    }
  })

  return {
    ideas: eventDetails.topics.length,
    participants: initialParticipants,
    connections: existingConnections,
    topicsProposed: eventDetails.topics.length,
    votescast: 0,
    collaborations: 0
  }
}

async function calculateDuringMetrics(eventId: string, eventDetails: any) {
  // Count active participants (those who participated in rounds)
  const activeParticipants = await db.roundParticipation.groupBy({
    by: ['userId'],
    where: {
      round: {
        eventId
      }
    }
  })

  // Count votes cast
  const totalVotes = await db.vote.count({
    where: {
      topic: {
        eventId
      }
    }
  })

  // Count topics that received votes (discussed)
  const discussedTopics = await db.topic.count({
    where: {
      eventId,
      totalVotes: {
        gt: 0
      }
    }
  })

  return {
    activeParticipants: activeParticipants.length,
    topicsDiscussed: discussedTopics,
    votescast: totalVotes,
    roundsCompleted: eventDetails.rounds.filter((r: any) => r.status === 'COMPLETED').length,
    peakEngagement: calculatePeakEngagement(eventDetails.rounds)
  }
}

async function calculateAfterMetrics(eventId: string, eventDetails: any) {
  // Count new connections made during this event
  const newConnections = await db.eventConnection.count({
    where: { eventId }
  })

  // Count connections made
  const connections = await db.connection.count({
    where: { eventId }
  })

  // Note: Removed collaboration, action items, and showcase counting for lean MVP

  // Count achievements earned
  const achievements = await db.userAchievement.count({
    where: { eventId }
  })

  return {
    outcomes: actionItems + collaborations + projects,
    newConnections,
    collaborations,
    actionItems,
    projects,
    achievements,
    followUpPlanned: await calculateFollowUpMetrics(eventId)
  }
}

async function generateTimelineEvents(eventId: string, eventDetails: any) {
  const events = []

  // Event start
  if (eventDetails.startsAt) {
    events.push({
      time: eventDetails.startsAt,
      title: 'Event Kickoff',
      description: 'Welcome and introduction to unconference format',
      color: 'primary',
      icon: 'mdi-flag',
      metrics: {
        'Registered': eventDetails.memberships.length
      },
      participants: eventDetails.memberships.slice(0, 5).map((m: any) => m.user)
    })
  }

  // Topic creation phase (estimated 30 minutes after start)
  const topicCreationTime = new Date(eventDetails.startsAt)
  topicCreationTime.setMinutes(topicCreationTime.getMinutes() + 30)

  if (eventDetails.topics.length > 0) {
    events.push({
      time: topicCreationTime,
      title: 'Topic Generation',
      description: 'Participants proposed and pitched their discussion topics',
      color: 'warning',
      icon: 'mdi-lightbulb',
      metrics: {
        'Topics': eventDetails.topics.length,
        'Proposers': new Set(eventDetails.topics.map((t: any) => t.createdById)).size
      },
      participants: eventDetails.topics.slice(0, 5).map((t: any) => t.createdBy)
    })
  }

  // Voting phase (estimated 1 hour after start)
  const votingTime = new Date(eventDetails.startsAt)
  votingTime.setHours(votingTime.getHours() + 1)

  const totalVotes = eventDetails.topics.reduce((sum: number, topic: any) => sum + topic.votes.length, 0)
  if (totalVotes > 0) {
    events.push({
      time: votingTime,
      title: 'Democratic Voting',
      description: 'Participants voted for their preferred discussion topics',
      color: 'success',
      icon: 'mdi-vote',
      metrics: {
        'Votes': totalVotes,
        'Voters': new Set(eventDetails.topics.flatMap((t: any) => t.votes.map((v: any) => v.userId))).size
      }
    })
  }

  // Round events
  eventDetails.rounds.forEach((round: any, index: number) => {
    if (round.startTime) {
      events.push({
        time: round.startTime,
        title: `Round ${round.roundNumber}`,
        description: `Breakout discussions in ${round.roundTopics.length} parallel sessions`,
        color: index % 2 === 0 ? 'primary' : 'secondary',
        icon: 'mdi-account-group',
        metrics: {
          'Sessions': round.roundTopics.length,
          'Participants': round.participants.length
        },
        participants: round.participants.slice(0, 5).map((p: any) => p.user)
      })
    }
  })

  // Note: Removed collaboration formation tracking for lean MVP

  // Event end
  if (eventDetails.endsAt) {
    events.push({
      time: eventDetails.endsAt,
      title: 'Closing & Next Steps',
      description: 'Event concluded with connections made',
      color: 'success',
      icon: 'mdi-calendar-check',
      metrics: {
        'Connections': await db.eventConnection.count({ where: { eventId } })
      }
    })
  }

  return events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
}

function calculateTransformations(beforeMetrics: any, afterMetrics: any) {
  return [
    {
      id: 1,
      from: `${beforeMetrics.ideas} scattered ideas`,
      to: `${afterMetrics.outcomes} concrete outcomes`
    },
    {
      id: 2,
      from: `${beforeMetrics.participants} individuals`,
      to: `${afterMetrics.newConnections} new connections`
    },
    {
      id: 3,
      from: '0 active projects',
      to: `${afterMetrics.collaborations} collaborations`
    },
    {
      id: 4,
      from: 'No clear next steps',
      to: `${afterMetrics.actionItems} action items`
    }
  ]
}

async function generateEngagementData(eventId: string, eventDetails: any) {
  // Create 24-hour engagement timeline
  const engagementData = Array(24).fill(0)

  if (!eventDetails.startsAt) {
    return engagementData
  }

  // Get all activities during the event
  const activities = []

  // Add voting activities
  const votes = await db.vote.findMany({
    where: {
      topic: {
        eventId
      }
    },
    select: {
      createdAt: true
    }
  })
  activities.push(...votes.map(v => ({ time: v.createdAt, type: 'vote', weight: 1 })))

  // Add round participation
  const participations = await db.roundParticipation.findMany({
    where: {
      round: {
        eventId
      }
    },
    select: {
      assignedAt: true
    }
  })
  activities.push(...participations.map(p => ({ time: p.assignedAt, type: 'participation', weight: 2 })))

  // Add topic creation
  activities.push(...eventDetails.topics.map((t: any) => ({
    time: t.createdAt,
    type: 'topic_creation',
    weight: 3
  })))

  // Calculate engagement by hour
  const eventStart = new Date(eventDetails.startsAt)
  activities.forEach(activity => {
    const activityTime = new Date(activity.time)
    const hoursDiff = Math.floor((activityTime.getTime() - eventStart.getTime()) / (1000 * 60 * 60))

    if (hoursDiff >= 0 && hoursDiff < 24) {
      engagementData[hoursDiff] += activity.weight * 10
    }
  })

  // Normalize to 0-100 scale
  const maxEngagement = Math.max(...engagementData)
  if (maxEngagement > 0) {
    return engagementData.map(value => Math.min(100, (value / maxEngagement) * 100))
  }

  return engagementData
}

function calculatePeakEngagement(rounds: any[]) {
  if (rounds.length === 0) return null

  // Find round with most participants
  const roundWithMostParticipants = rounds.reduce((peak, round) => {
    return round.participants.length > (peak?.participants?.length || 0) ? round : peak
  }, null)

  if (roundWithMostParticipants?.startTime) {
    const startTime = new Date(roundWithMostParticipants.startTime)
    return `${startTime.getHours()}:${startTime.getMinutes().toString().padStart(2, '0')}`
  }

  return null
}

async function calculateFollowUpMetrics(eventId: string) {
  // Count planned follow-ups
  const plannedFollowUps = await db.eventConnection.count({
    where: {
      eventId,
      followUpPlanned: true
    }
  })

  // Count pending action items
  const pendingActions = await db.actionItem.count({
    where: {
      collaboration: {
        eventId
      },
      status: 'PENDING'
    }
  })

  return plannedFollowUps + pendingActions
}
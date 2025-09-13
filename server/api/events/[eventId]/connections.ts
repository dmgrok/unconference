// Phase 1 API: Connections and Collaboration
import prisma from '~/lib/database'

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
    case 'connections':
      return await getUserConnections(userId, eventId)
    
    case 'suggestions':
      return await getConnectionSuggestions(userId, eventId)
    
    case 'collaborations':
      return await getUserCollaborations(userId, eventId)
    
    case 'network-stats':
      return await getNetworkStats(eventId)
    
    default:
      return await getConnectionsOverview(userId, eventId)
  }
}

// POST handlers
async function handlePost(eventId: string, userId: string, body: any) {
  const { action } = body

  switch (action) {
    case 'create-connection':
      return await createConnection(eventId, userId, body)
    
    case 'request-introduction':
      return await requestIntroduction(eventId, userId, body)
    
    case 'create-collaboration':
      return await createCollaborationSpace(eventId, userId, body)
    
    case 'add-resource':
      return await addCollaborationResource(userId, body)
    
    case 'add-action-item':
      return await addActionItem(userId, body)
    
    case 'create-showcase':
      return await createWorkShowcase(eventId, userId, body)
    
    default:
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid action'
      })
  }
}

// Helper functions for JSON parsing
function parseJsonField(field: string | null): any[] {
  if (!field) return []
  try {
    return JSON.parse(field)
  } catch {
    return []
  }
}

// Connection management functions
async function getUserConnections(userId: string, eventId: string) {
  const connections = await prisma.eventConnection.findMany({
    where: {
      eventId,
      OR: [
        { participantAId: userId },
        { participantBId: userId }
      ]
    },
    include: {
      participantA: {
        select: { id: true, name: true, avatar: true }
      },
      participantB: {
        select: { id: true, name: true, avatar: true }
      }
    }
  })

  const formattedConnections = connections.map((conn: any) => ({
    connectionId: conn.id,
    otherPerson: conn.participantAId === userId ? conn.participantB : conn.participantA,
    sharedTopics: parseJsonField(conn.sharedTopics),
    collaboratedOn: parseJsonField(conn.collaboratedOn),
    connectionStrength: conn.connectionStrength,
    contactExchanged: conn.contactExchanged
  }))
  
  return {
    connections: formattedConnections,
    totalCount: formattedConnections.length
  }
}

async function getConnectionSuggestions(userId: string, eventId: string) {
  // Find users who voted for similar topics
  const userVotes = await prisma.vote.findMany({
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

  const userTopicIds = userVotes.map(v => v.topicId)

  // Find other users who voted for the same topics
  const similarVotes = await prisma.vote.findMany({
    where: {
      topicId: { in: userTopicIds },
      userId: { not: userId }
    },
    include: {
      user: {
        select: { id: true, name: true, avatar: true, skills: true, interests: true }
      },
      topic: true
    }
  })

  // Group by user and calculate compatibility
  const userCompatibility: Record<string, any> = {}
  
  similarVotes.forEach(vote => {
    const otherUserId = vote.userId
    if (!userCompatibility[otherUserId]) {
      userCompatibility[otherUserId] = {
        user: vote.user,
        sharedTopics: [],
        compatibilityScore: 0
      }
    }
    userCompatibility[otherUserId].sharedTopics.push(vote.topic.title)
    userCompatibility[otherUserId].compatibilityScore += 1
  })

  const suggestions = Object.values(userCompatibility)
    .sort((a: any, b: any) => b.compatibilityScore - a.compatibilityScore)
    .slice(0, 6)

  return { suggestions }
}

async function createConnection(eventId: string, userId: string, body: any) {
  const { otherPersonId, sharedTopics = [], collaboratedOn = [], connectionStrength = 1 } = body
  
  // Check if connection already exists
  const existing = await prisma.eventConnection.findFirst({
    where: {
      eventId,
      OR: [
        { participantAId: userId, participantBId: otherPersonId },
        { participantAId: otherPersonId, participantBId: userId }
      ]
    }
  })
  
  if (existing) {
    // Update existing connection
    const updated = await prisma.eventConnection.update({
      where: { id: existing.id },
      data: {
        sharedTopics: JSON.stringify(sharedTopics),
        collaboratedOn: JSON.stringify(collaboratedOn),
        connectionStrength,
      }
    })
    return { id: updated.id, updated: true }
  } else {
    // Create new connection
    const connection = await prisma.eventConnection.create({
      data: {
        eventId,
        participantAId: userId,
        participantBId: otherPersonId,
        sharedTopics: JSON.stringify(sharedTopics),
        collaboratedOn: JSON.stringify(collaboratedOn),
        connectionStrength
      }
    })
    return { id: connection.id, created: true }
  }
}

async function requestIntroduction(eventId: string, userId: string, body: any) {
  const { targetPersonId, reason, commonInterests = [] } = body
  
  const introduction = await prisma.introductionRequest.create({
    data: {
      eventId,
      requesterId: userId,
      targetPersonId,
      reason,
      commonInterests: JSON.stringify(commonInterests)
    }
  })
  
  return { id: introduction.id }
}

async function getUserCollaborations(userId: string, eventId: string) {
  const collaborations = await prisma.collaborationSpace.findMany({
    where: {
      eventId,
      // Using JSON search for SQLite - this is a simplified approach
      // In production, you might want a separate table for contributors
    },
    include: {
      resources: {
        orderBy: { addedAt: 'desc' }
      },
      actionItems: {
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  // Filter collaborations where user is a contributor
  const userCollaborations = collaborations.filter(collab => {
    const contributors = parseJsonField(collab.contributors)
    return contributors.includes(userId)
  })

  return {
    collaborations: userCollaborations
  }
}

async function createCollaborationSpace(eventId: string, userId: string, body: any) {
  const { name, description, topicId, roomId, contributors = [userId] } = body
  
  const collaboration = await prisma.collaborationSpace.create({
    data: {
      eventId,
      topicId,
      roomId,
      name,
      description,
      contributors: JSON.stringify(contributors)
    }
  })
  
  return { id: collaboration.id }
}

async function addCollaborationResource(userId: string, body: any) {
  const { collaborationId, url, title, description, resourceType = 'LINK' } = body
  
  const resource = await prisma.collaborationResource.create({
    data: {
      collaborationId,
      url,
      title,
      description,
      resourceType,
      addedBy: userId
    }
  })
  
  return { id: resource.id }
}

async function addActionItem(userId: string, body: any) {
  const { collaborationId, task, description, assignedTo, dueDate, priority = 'MEDIUM' } = body
  
  const actionItem = await prisma.actionItem.create({
    data: {
      collaborationId,
      task,
      description,
      assignedTo,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority,
      createdBy: userId
    }
  })
  
  return { id: actionItem.id }
}

async function createWorkShowcase(eventId: string, userId: string, body: any) {
  const { 
    projectName, 
    description, 
    contributors = [userId], 
    skillsUsed = [], 
    skillsNeeded = [],
    status = 'IDEATION',
    contactEmail,
    repositoryUrl,
    demoUrl,
    images = [],
    tags = []
  } = body
  
  const showcase = await prisma.workShowcase.create({
    data: {
      eventId,
      projectName,
      description,
      contributors: JSON.stringify(contributors),
      skillsUsed: JSON.stringify(skillsUsed),
      skillsNeeded: JSON.stringify(skillsNeeded),
      status,
      contactEmail,
      repositoryUrl,
      demoUrl,
      images: JSON.stringify(images),
      tags: JSON.stringify(tags)
    }
  })
  
  return { id: showcase.id }
}

async function getNetworkStats(eventId: string) {
  const connections = await prisma.eventConnection.findMany({
    where: { eventId },
    include: {
      participantA: { select: { id: true, name: true, avatar: true } },
      participantB: { select: { id: true, name: true, avatar: true } }
    }
  })

  const participantConnections: Record<string, number> = {}
  let totalConnectionStrength = 0

  connections.forEach(conn => {
    participantConnections[conn.participantAId] = (participantConnections[conn.participantAId] || 0) + 1
    participantConnections[conn.participantBId] = (participantConnections[conn.participantBId] || 0) + 1
    totalConnectionStrength += conn.connectionStrength
  })

  const topConnectors = Object.entries(participantConnections)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([participantId, connectionCount]) => {
      const connection = connections.find(c => 
        c.participantAId === participantId || c.participantBId === participantId
      )
      const participant = connection?.participantAId === participantId ? 
        connection.participantA : connection?.participantB
      
      return {
        participantId,
        name: participant?.name,
        avatar: participant?.avatar,
        connectionCount
      }
    })

  return {
    totalConnections: connections.length,
    avgConnectionStrength: connections.length > 0 ? totalConnectionStrength / connections.length : 0,
    uniqueParticipants: Object.keys(participantConnections).length,
    topConnectors
  }
}

async function getConnectionsOverview(userId: string, eventId: string) {
  const [connections, suggestions, collaborations, stats] = await Promise.all([
    getUserConnections(userId, eventId),
    getConnectionSuggestions(userId, eventId),
    getUserCollaborations(userId, eventId),
    getNetworkStats(eventId)
  ])
  
  return {
    connections: connections.connections,
    suggestions: suggestions.suggestions,
    collaborations: collaborations.collaborations,
    stats
  }
}
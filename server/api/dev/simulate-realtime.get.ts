/**
 * Real-time Features Test Simulator
 * Simulates event participation for testing connection tracking and achievements
 */
export default defineEventHandler(async (event) => {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Development mode only'
    })
  }

  const query = getQuery(event)
  const action = query.action as string
  const eventId = query.eventId as string || 'test-event-001'

  switch (action) {
    case 'simulate-connections':
      return await simulateConnections(eventId)
    case 'trigger-achievements':
      return await triggerAchievements(eventId)
    case 'add-participants':
      return await addParticipants(eventId)
    case 'simulate-activity':
      return await simulateActivity(eventId)
    case 'reset':
      return await resetSimulation(eventId)
    default:
      return {
        message: 'Real-time features test simulator',
        actions: [
          'simulate-connections - Create test user connections',
          'trigger-achievements - Trigger test achievements',
          'add-participants - Add test participants to event', 
          'simulate-activity - Simulate ongoing event activity',
          'reset - Reset all simulation data'
        ],
        usage: 'Use ?action=simulate-connections&eventId=test-event-001'
      }
  }
})

async function simulateConnections(eventId: string) {
  const connections = [
    {
      id: `conn_${Date.now()}_1`,
      from: 'user-001',
      to: 'user-002', 
      fromName: 'Storm Trooper',
      toName: 'Luke Skywalker',
      strength: 3,
      interactions: 5,
      timestamp: new Date(),
      eventId
    },
    {
      id: `conn_${Date.now()}_2`, 
      from: 'user-002',
      to: 'user-003',
      fromName: 'Luke Skywalker', 
      toName: 'Princess Leia',
      strength: 2,
      interactions: 3,
      timestamp: new Date(),
      eventId
    }
  ]

  // Simulate saving to database/storage
  const fs = await import('fs').then(m => m.promises)
  const path = await import('path')
  
  const dataPath = path.join(process.cwd(), 'data/test-connections.json')
  await fs.writeFile(dataPath, JSON.stringify(connections, null, 2))

  return {
    success: true,
    message: 'Simulated connections created',
    connections: connections.length,
    data: connections
  }
}

async function triggerAchievements(eventId: string) {
  const achievements = [
    {
      id: `ach_${Date.now()}_1`,
      userId: 'user-001',
      userName: 'Storm Trooper',
      type: 'connection_maker',
      title: 'Connection Maker',
      description: 'Made 3+ connections',
      level: 1,
      points: 100,
      timestamp: new Date(),
      eventId
    },
    {
      id: `ach_${Date.now()}_2`,
      userId: 'user-002', 
      userName: 'Luke Skywalker',
      type: 'topic_creator',
      title: 'Topic Creator',
      description: 'Created first topic',
      level: 1,
      points: 50,
      timestamp: new Date(),
      eventId
    }
  ]

  const fs = await import('fs').then(m => m.promises) 
  const path = await import('path')
  
  const dataPath = path.join(process.cwd(), 'data/test-achievements.json')
  await fs.writeFile(dataPath, JSON.stringify(achievements, null, 2))

  return {
    success: true,
    message: 'Achievements triggered',
    achievements: achievements.length,
    data: achievements
  }
}

async function addParticipants(eventId: string) {
  const participants = [
    {
      id: 'user-001',
      name: 'Storm Trooper',
      email: 'storm.trooper@starwars.com',
      online: true,
      joinedAt: new Date(Date.now() - 3600000), // 1 hour ago
      lastActivity: new Date(),
      eventId
    },
    {
      id: 'user-002',
      name: 'Luke Skywalker', 
      email: 'luke@rebellion.com',
      online: true,
      joinedAt: new Date(Date.now() - 1800000), // 30 min ago
      lastActivity: new Date(),
      eventId
    },
    {
      id: 'user-003',
      name: 'Princess Leia',
      email: 'leia@rebellion.com', 
      online: false,
      joinedAt: new Date(Date.now() - 7200000), // 2 hours ago
      lastActivity: new Date(Date.now() - 900000), // 15 min ago
      eventId
    }
  ]

  const fs = await import('fs').then(m => m.promises)
  const path = await import('path')
  
  const dataPath = path.join(process.cwd(), 'data/test-participants.json')
  await fs.writeFile(dataPath, JSON.stringify(participants, null, 2))

  return {
    success: true,
    message: 'Test participants added',
    participants: participants.length,
    online: participants.filter(p => p.online).length,
    data: participants
  }
}

async function simulateActivity(eventId: string) {
  const activities = [
    {
      id: `act_${Date.now()}_1`,
      type: 'user_joined',
      userId: 'user-001',
      userName: 'Storm Trooper',
      timestamp: new Date(),
      eventId
    },
    {
      id: `act_${Date.now()}_2`, 
      type: 'connection_made',
      userId: 'user-001',
      targetUserId: 'user-002',
      userName: 'Storm Trooper',
      targetUserName: 'Luke Skywalker',
      timestamp: new Date(),
      eventId
    },
    {
      id: `act_${Date.now()}_3`,
      type: 'achievement_unlocked',
      userId: 'user-001',
      userName: 'Storm Trooper', 
      achievement: 'Connection Maker',
      timestamp: new Date(),
      eventId
    }
  ]

  const fs = await import('fs').then(m => m.promises)
  const path = await import('path')
  
  const dataPath = path.join(process.cwd(), 'data/test-activity.json')
  await fs.writeFile(dataPath, JSON.stringify(activities, null, 2))

  return {
    success: true,
    message: 'Activity simulation complete',
    activities: activities.length,
    data: activities
  }
}

async function resetSimulation(eventId: string) {
  const fs = await import('fs').then(m => m.promises)
  const path = await import('path')
  
  const files = [
    'test-connections.json',
    'test-achievements.json', 
    'test-participants.json',
    'test-activity.json'
  ]

  for (const file of files) {
    const filePath = path.join(process.cwd(), 'data', file)
    try {
      await fs.unlink(filePath)
    } catch (error) {
      // File doesn't exist, ignore
    }
  }

  return {
    success: true,
    message: 'Simulation data reset',
    cleared: files
  }
}

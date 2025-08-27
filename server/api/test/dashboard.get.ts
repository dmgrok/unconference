export default defineEventHandler(async (event) => {
  // Mock data for testing - bypassing authentication
  
  const mockStats = {
    totalEvents: 12,
    activeEvents: 8,
    totalUsers: 156,
    totalOrganizers: 23
  }

  const mockRecentActivity = [
    {
      id: '1',
      type: 'event_created',
      description: 'New event created: Tech Innovation Summit',
      eventName: 'Tech Innovation Summit',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      type: 'user_joined',
      description: 'New user registered: jane.doe@example.com',
      eventName: 'Platform',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      type: 'event_started',
      description: 'Event started: Startup Founders Unconference',
      eventName: 'Startup Founders Unconference',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
    }
  ]

  const mockRecentEvents = [
    {
      id: 'event-001',
      name: 'Demo Unconference 2024',
      code: 'DEMO24',
      isActive: true,
      organizerName: 'Luke Skywalker',
      participantCount: 45,
      organizerCount: 1,
      moderatorCount: 2
    },
    {
      id: 'event-002',
      name: 'Tech Innovation Unconference 2025',
      code: 'TECH25',
      isActive: false,
      organizerName: 'Darth Vader',
      participantCount: 32,
      organizerCount: 1,
      moderatorCount: 1
    },
    {
      id: 'event-003',
      name: 'Startup Founders Unconference',
      code: 'STARTUP',
      isActive: true,
      organizerName: 'Luke Skywalker',
      participantCount: 67,
      organizerCount: 1,
      moderatorCount: 3
    }
  ]

  const mockAnalytics = {
    eventsLast30Days: 5,
    activeUsersToday: 31
  }

  const mockSystemHealth = {
    server: 'healthy',
    database: 'healthy',
    memoryUsage: 68
  }

  return {
    success: true,
    stats: mockStats,
    recentActivity: mockRecentActivity,
    recentEvents: mockRecentEvents,
    analytics: mockAnalytics,
    systemHealth: mockSystemHealth
  }
})

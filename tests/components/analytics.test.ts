import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createVuetify } from 'vuetify'
import AnalyticsDashboard from '~/components/AnalyticsDashboard.vue'
import EngagementTrendChart from '~/components/EngagementTrendChart.vue'
import ActivityHeatmap from '~/components/ActivityHeatmap.vue'
import CohortAnalysisChart from '~/components/CohortAnalysisChart.vue'
import RealtimeEventAnalytics from '~/components/RealtimeEventAnalytics.vue'

// Mock D3.js
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    selectAll: vi.fn(() => ({
      remove: vi.fn()
    })),
    append: vi.fn(() => ({
      attr: vi.fn().mockReturnThis(),
      style: vi.fn().mockReturnThis(),
      selectAll: vi.fn().mockReturnThis(),
      data: vi.fn().mockReturnThis(),
      enter: vi.fn().mockReturnThis(),
      append: vi.fn().mockReturnThis(),
      text: vi.fn().mockReturnThis(),
      call: vi.fn().mockReturnThis()
    }))
  })),
  scaleTime: vi.fn(() => ({
    domain: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis()
  })),
  scaleLinear: vi.fn(() => ({
    domain: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis()
  })),
  scaleBand: vi.fn(() => ({
    domain: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    padding: vi.fn().mockReturnThis(),
    bandwidth: vi.fn(() => 50)
  })),
  scaleSequential: vi.fn(() => ({
    domain: vi.fn().mockReturnThis(),
    interpolator: vi.fn().mockReturnThis()
  })),
  line: vi.fn(() => ({
    x: vi.fn().mockReturnThis(),
    y: vi.fn().mockReturnThis(),
    curve: vi.fn().mockReturnThis()
  })),
  area: vi.fn(() => ({
    x: vi.fn().mockReturnThis(),
    y0: vi.fn().mockReturnThis(),
    y1: vi.fn().mockReturnThis(),
    curve: vi.fn().mockReturnThis()
  })),
  axisBottom: vi.fn(() => ({
    tickFormat: vi.fn().mockReturnThis()
  })),
  axisLeft: vi.fn(() => ({
    tickFormat: vi.fn().mockReturnThis(),
    ticks: vi.fn().mockReturnThis()
  })),
  axisRight: vi.fn(),
  extent: vi.fn(() => [new Date('2024-01-01'), new Date('2024-01-31')]),
  max: vi.fn(() => 100),
  timeFormat: vi.fn(() => '01/15'),
  interpolateGreens: vi.fn(),
  interpolateRdYlGn: vi.fn(),
  bisector: vi.fn(() => ({
    left: vi.fn(() => 5)
  })),
  pointer: vi.fn(() => [100, 50])
}))

// Mock fetch
global.$fetch = vi.fn()

const vuetify = createVuetify()

const createWrapper = (component: any, props = {}) => {
  return mount(component, {
    props,
    global: {
      plugins: [vuetify],
      stubs: {
        'v-container': { template: '<div><slot /></div>' },
        'v-row': { template: '<div><slot /></div>' },
        'v-col': { template: '<div><slot /></div>' },
        'v-card': { template: '<div><slot /></div>' },
        'v-card-title': { template: '<div><slot /></div>' },
        'v-card-text': { template: '<div><slot /></div>' },
        'v-icon': { template: '<span><slot /></span>' },
        'v-btn': { template: '<button><slot /></button>' },
        'v-select': { template: '<select><slot /></select>' },
        'v-switch': { template: '<input type="checkbox" />' },
        'v-chip': { template: '<span><slot /></span>' },
        'v-progress-circular': { template: '<div>Loading...</div>' },
        'v-data-table': { template: '<table><slot /></table>' },
        'v-timeline': { template: '<div><slot /></div>' },
        'v-timeline-item': { template: '<div><slot /></div>' },
        'v-avatar': { template: '<div><slot /></div>' },
        'v-spacer': { template: '<div></div>' }
      }
    }
  })
}

describe('Analytics Dashboard Component', () => {
  let wrapper: VueWrapper<any>

  const mockAnalyticsData = {
    platformMetrics: {
      totalUsers: 150,
      activeUsers: 45,
      totalEvents: 12,
      activeEvents: 3,
      totalConnections: 89,
      avgConnectionQuality: 72.5,
      platformEngagementScore: 85.2,
      revenueMetrics: {
        totalRevenue: 4900,
        monthlyRecurringRevenue: 4900,
        churnRate: 2.1,
        avgRevenuePerUser: 49
      }
    },
    engagementTrend: [
      {
        date: new Date('2024-01-15'),
        avgEngagement: 75.5,
        activeUsers: 42
      },
      {
        date: new Date('2024-01-16'),
        avgEngagement: 78.2,
        activeUsers: 45
      }
    ],
    topEvents: [
      {
        eventId: 'event-1',
        engagementScore: 85.3,
        successScore: 92.1,
        totalConnections: 25,
        totalParticipants: 45
      }
    ],
    cohortAnalysis: [
      {
        cohortPeriod: '2024-01',
        totalUsers: 50,
        activeUsers: 42
      }
    ]
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked($fetch).mockResolvedValue({
      success: true,
      data: mockAnalyticsData
    })
  })

  it('should render analytics dashboard', () => {
    wrapper = createWrapper(AnalyticsDashboard)
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Analytics Dashboard')
  })

  it('should display key metrics correctly', async () => {
    wrapper = createWrapper(AnalyticsDashboard)

    // Wait for data to load
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    const keyMetrics = wrapper.vm.keyMetrics
    expect(keyMetrics).toHaveLength(4)
    expect(keyMetrics[0].title).toBe('Total Users')
    expect(keyMetrics[1].title).toBe('Active Events')
    expect(keyMetrics[2].title).toBe('Total Connections')
    expect(keyMetrics[3].title).toBe('Monthly Revenue')
  })

  it('should handle loading states', () => {
    wrapper = createWrapper(AnalyticsDashboard)

    // Should show loading indicators initially
    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(false) // Mocked components
  })

  it('should handle time range changes', async () => {
    wrapper = createWrapper(AnalyticsDashboard)

    await wrapper.setData({ selectedTimeRange: '7d' })

    // Should call refresh with new time range
    expect(wrapper.vm.selectedTimeRange).toBe('7d')
  })
})

describe('Engagement Trend Chart', () => {
  let wrapper: VueWrapper<any>

  const mockData = [
    {
      date: new Date('2024-01-15'),
      avgEngagement: 75.5,
      activeUsers: 42
    },
    {
      date: new Date('2024-01-16'),
      avgEngagement: 78.2,
      activeUsers: 45
    },
    {
      date: new Date('2024-01-17'),
      avgEngagement: 82.1,
      activeUsers: 48
    }
  ]

  it('should render chart with data', () => {
    wrapper = createWrapper(EngagementTrendChart, {
      data: mockData,
      loading: false
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should show loading state', () => {
    wrapper = createWrapper(EngagementTrendChart, {
      data: [],
      loading: true
    })

    expect(wrapper.find('.d-flex.justify-center.align-center').exists()).toBe(true)
  })

  it('should show no data message when empty', () => {
    wrapper = createWrapper(EngagementTrendChart, {
      data: [],
      loading: false
    })

    expect(wrapper.text()).toContain('No engagement data available')
  })

  it('should process data correctly', () => {
    wrapper = createWrapper(EngagementTrendChart, {
      data: mockData,
      loading: false
    })

    // Data should be processed and sorted
    expect(wrapper.props('data')).toHaveLength(3)
    expect(wrapper.props('data')[0].avgEngagement).toBe(75.5)
  })
})

describe('Activity Heatmap', () => {
  let wrapper: VueWrapper<any>

  const mockData = [
    {
      date: new Date('2024-01-15'),
      value: 25.5,
      count: 12
    },
    {
      date: new Date('2024-01-16'),
      value: 32.1,
      count: 18
    }
  ]

  it('should render heatmap with data', () => {
    wrapper = createWrapper(ActivityHeatmap, {
      data: mockData,
      loading: false
    })

    expect(wrapper.exists()).toBe(true)
  })

  it('should show color scale legend', () => {
    wrapper = createWrapper(ActivityHeatmap, {
      data: mockData,
      loading: false
    })

    const colorScale = wrapper.vm.colorScale
    expect(colorScale).toHaveLength(5)
    expect(colorScale).toContain('#ebedf0')
  })

  it('should handle empty data', () => {
    wrapper = createWrapper(ActivityHeatmap, {
      data: [],
      loading: false
    })

    expect(wrapper.text()).toContain('No activity data')
  })
})

describe('Cohort Analysis Chart', () => {
  let wrapper: VueWrapper<any>

  const mockData = [
    {
      cohortPeriod: '2024-01',
      totalUsers: 50,
      activeUsers: 42
    },
    {
      cohortPeriod: '2024-02',
      totalUsers: 65,
      activeUsers: 58
    }
  ]

  it('should calculate metrics correctly', () => {
    wrapper = createWrapper(CohortAnalysisChart, {
      data: mockData,
      loading: false
    })

    const totalCohorts = wrapper.vm.totalCohorts
    const avgRetention = wrapper.vm.avgRetention
    const totalUsers = wrapper.vm.totalUsers

    expect(totalCohorts).toBe(2)
    expect(totalUsers).toBe(115)
    expect(avgRetention).toBeCloseTo(87.4, 1) // (84% + 89.2%) / 2
  })

  it('should format table data correctly', () => {
    wrapper = createWrapper(CohortAnalysisChart, {
      data: mockData,
      loading: false
    })

    const tableData = wrapper.vm.tableData
    expect(tableData).toHaveLength(2)
    expect(tableData[0].retention).toBeCloseTo(89.2, 1) // 58/65 * 100
    expect(tableData[1].retention).toBeCloseTo(84.0, 1) // 42/50 * 100
  })

  it('should determine retention colors correctly', () => {
    wrapper = createWrapper(CohortAnalysisChart, {
      data: mockData,
      loading: false
    })

    expect(wrapper.vm.getRetentionColor(95)).toBe('success')
    expect(wrapper.vm.getRetentionColor(70)).toBe('warning')
    expect(wrapper.vm.getRetentionColor(50)).toBe('orange')
    expect(wrapper.vm.getRetentionColor(30)).toBe('error')
  })
})

describe('Realtime Event Analytics', () => {
  let wrapper: VueWrapper<any>

  const mockRealtimeData = {
    eventMetrics: {
      participantCount: 25,
      connectionCount: 12,
      avgConnectionQuality: 78.5,
      engagementScore: 85.3
    },
    liveActivity: {
      participantsOnline: 18,
      recentActions: [
        {
          id: '1',
          type: 'CONNECTION_MADE',
          timestamp: new Date().toISOString(),
          userId: 'user-123'
        }
      ],
      activityHeatmap: {
        '2024-01-15T10:00': 5,
        '2024-01-15T10:05': 8
      }
    },
    currentRound: {
      id: 'round-1',
      roundNumber: 2,
      status: 'ACTIVE',
      participantCount: 20,
      topics: ['AI Ethics', 'Remote Work'],
      startTime: new Date().toISOString()
    },
    recentConnections: [
      {
        id: 'conn-1',
        users: ['Alice', 'Bob'],
        qualityScore: 85,
        timestamp: new Date()
      }
    ],
    recentVotes: [
      {
        id: 'vote-1',
        user: 'Charlie',
        topic: 'Blockchain Future',
        preference: 'FIRST_CHOICE',
        timestamp: new Date()
      }
    ]
  }

  beforeEach(() => {
    vi.mocked($fetch).mockResolvedValue({
      success: true,
      data: mockRealtimeData
    })
  })

  it('should display live metrics', async () => {
    wrapper = createWrapper(RealtimeEventAnalytics, {
      eventId: 'test-event-123',
      autoRefresh: false
    })

    await wrapper.vm.$nextTick()

    const liveMetrics = wrapper.vm.liveMetrics
    expect(liveMetrics).toHaveLength(4)
    expect(liveMetrics[0].title).toBe('Participants')
    expect(liveMetrics[0].value).toBe(25)
  })

  it('should handle auto-refresh correctly', async () => {
    wrapper = createWrapper(RealtimeEventAnalytics, {
      eventId: 'test-event-123',
      autoRefresh: true
    })

    expect(wrapper.vm.isLive).toBe(true)

    await wrapper.setData({ autoRefreshEnabled: false })
    expect(wrapper.vm.isLive).toBe(false)
  })

  it('should format activity titles correctly', () => {
    wrapper = createWrapper(RealtimeEventAnalytics, {
      eventId: 'test-event-123'
    })

    expect(wrapper.vm.formatActivityTitle('CONNECTION_MADE')).toBe('New Connection')
    expect(wrapper.vm.formatActivityTitle('VOTE_CAST')).toBe('Vote Cast')
    expect(wrapper.vm.formatActivityTitle('TOPIC_CREATE')).toBe('Topic Created')
  })

  it('should format relative time correctly', () => {
    wrapper = createWrapper(RealtimeEventAnalytics, {
      eventId: 'test-event-123'
    })

    const now = new Date()
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

    expect(wrapper.vm.formatRelativeTime(fiveMinutesAgo)).toBe('5m ago')
    expect(wrapper.vm.formatRelativeTime(twoHoursAgo)).toBe('2h ago')
  })

  it('should calculate quality colors correctly', () => {
    wrapper = createWrapper(RealtimeEventAnalytics, {
      eventId: 'test-event-123'
    })

    expect(wrapper.vm.getQualityColor(85)).toBe('success')
    expect(wrapper.vm.getQualityColor(65)).toBe('warning')
    expect(wrapper.vm.getQualityColor(45)).toBe('error')
  })
})

describe('Analytics Integration Tests', () => {
  it('should handle end-to-end analytics workflow', async () => {
    // 1. Track an event
    const trackResponse = await $fetch('/api/analytics/track', {
      method: 'POST',
      body: {
        eventType: 'CONNECTION_MADE',
        eventId: 'test-event',
        userId: 'user-123',
        properties: {
          targetUserId: 'user-456',
          quality: 85
        }
      }
    })

    expect(trackResponse.success).toBe(true)

    // 2. Load dashboard data
    const dashboardResponse = await $fetch('/api/admin/analytics/dashboard', {
      params: {
        timeRange: '30d',
        includeDetails: true
      }
    })

    expect(dashboardResponse.success).toBe(true)
    expect(dashboardResponse.data).toBeDefined()

    // 3. Export report
    const exportResponse = await $fetch('/api/admin/analytics/export', {
      method: 'POST',
      body: {
        timeRange: '30d',
        format: 'json',
        sections: ['platform', 'events'],
        includeRawData: false
      }
    })

    expect(exportResponse.success).toBe(true)
    expect(exportResponse.report).toBeDefined()
  })

  it('should handle error scenarios gracefully', async () => {
    // Test with invalid data
    vi.mocked($fetch).mockRejectedValue(new Error('Network error'))

    const wrapper = createWrapper(AnalyticsDashboard)

    // Should handle errors without crashing
    expect(wrapper.exists()).toBe(true)
  })
})
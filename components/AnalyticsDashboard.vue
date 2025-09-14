<template>
  <v-container fluid class="analytics-dashboard">
    <!-- Header Controls -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex flex-wrap justify-space-between align-center gap-3">
          <div class="d-flex align-center gap-3">
            <v-icon color="primary" size="large">mdi-chart-box</v-icon>
            <h1 class="text-h4">Analytics Dashboard</h1>
          </div>

          <div class="d-flex gap-2">
            <v-select
              v-model="selectedTimeRange"
              :items="timeRangeOptions"
              label="Time Range"
              variant="outlined"
              density="compact"
              style="min-width: 180px;"
              @update:model-value="refreshData"
            />

            <v-btn
              variant="outlined"
              prepend-icon="mdi-refresh"
              @click="refreshData"
              :loading="loading"
            >
              Refresh
            </v-btn>

            <v-btn
              variant="outlined"
              prepend-icon="mdi-download"
              @click="exportReport"
              :loading="exporting"
            >
              Export
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Key Metrics Cards -->
    <v-row class="mb-6">
      <v-col cols="6" md="3" v-for="metric in keyMetrics" :key="metric.title">
        <v-card variant="tonal" :color="metric.color" class="pa-4">
          <div class="text-center">
            <v-icon :color="metric.color" size="large" class="mb-2">{{ metric.icon }}</v-icon>
            <div class="text-h4 font-weight-bold">{{ metric.value }}</div>
            <div class="text-body-2">{{ metric.title }}</div>
            <div
              v-if="metric.trend !== undefined"
              class="text-caption d-flex align-center justify-center mt-1"
              :class="getTrendColor(metric.trend)"
            >
              <v-icon size="small" class="mr-1">
                {{ metric.trend >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
              </v-icon>
              {{ formatTrend(metric.trend) }}
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts Row -->
    <v-row class="mb-6">
      <!-- Engagement Trend Chart -->
      <v-col cols="12" lg="8">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-chart-line</v-icon>
            Engagement Trend
          </v-card-title>
          <v-card-text>
            <EngagementTrendChart
              :data="analyticsData?.engagementTrend || []"
              :loading="loading"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Activity Heatmap -->
      <v-col cols="12" lg="4">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-calendar-heat</v-icon>
            Activity Heatmap
          </v-card-title>
          <v-card-text>
            <ActivityHeatmap
              :data="activityHeatmapData"
              :loading="loading"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Performance Tables Row -->
    <v-row class="mb-6">
      <!-- Top Performing Events -->
      <v-col cols="12" lg="6">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-trophy</v-icon>
            Top Performing Events
          </v-card-title>
          <v-card-text>
            <v-data-table
              :items="topEvents"
              :headers="eventHeaders"
              :loading="loading"
              density="compact"
              class="elevation-0"
            >
              <template #item.successScore="{ item }">
                <v-chip
                  :color="getScoreColor(item.successScore)"
                  size="small"
                  class="font-weight-medium"
                >
                  {{ item.successScore.toFixed(1) }}
                </v-chip>
              </template>

              <template #item.totalConnections="{ item }">
                <div class="d-flex align-center">
                  <v-icon size="small" class="mr-1">mdi-account-multiple</v-icon>
                  {{ item.totalConnections }}
                </div>
              </template>

              <template #item.totalParticipants="{ item }">
                <div class="d-flex align-center">
                  <v-icon size="small" class="mr-1">mdi-account-group</v-icon>
                  {{ item.totalParticipants }}
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Cohort Analysis -->
      <v-col cols="12" lg="6">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-chart-gantt</v-icon>
            User Retention by Cohort
          </v-card-title>
          <v-card-text>
            <CohortAnalysisChart
              :data="analyticsData?.cohortAnalysis || []"
              :loading="loading"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Real-time Section (if event is selected) -->
    <v-row v-if="selectedEventId" class="mb-6">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2" color="success">mdi-pulse</v-icon>
            Real-time Event Analytics
            <v-spacer />
            <v-chip color="success" size="small">
              <v-icon size="small" class="mr-1">mdi-circle</v-icon>
              Live
            </v-chip>
          </v-card-title>
          <v-card-text>
            <RealtimeEventAnalytics
              :eventId="selectedEventId"
              :auto-refresh="true"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Revenue Analytics (for Super Admins) -->
    <v-row class="mb-6">
      <v-col cols="12">
        <SubscriptionAnalytics
          :analytics-data="revenueData"
          :loading="loading"
          @refresh="refreshRevenueData"
          @export="exportRevenueData"
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'

interface AnalyticsData {
  platformMetrics: {
    totalUsers: number
    activeUsers: number
    totalEvents: number
    activeEvents: number
    totalConnections: number
    avgConnectionQuality: number
    platformEngagementScore: number
    revenueMetrics: {
      totalRevenue: number
      monthlyRecurringRevenue: number
      churnRate: number
      avgRevenuePerUser: number
    }
  }
  engagementTrend: Array<{
    date: Date
    avgEngagement: number
    activeUsers: number
  }>
  topEvents: Array<{
    eventId: string
    engagementScore: number
    successScore: number
    totalConnections: number
    totalParticipants: number
  }>
  cohortAnalysis: Array<{
    cohortPeriod: string
    totalUsers: number
    activeUsers: number
  }>
}

// Props
interface Props {
  selectedEventId?: string
  autoRefresh?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false
})

// State
const loading = ref(false)
const exporting = ref(false)
const analyticsData = ref<AnalyticsData>()
const revenueData = ref()
const selectedTimeRange = ref('30d')
const refreshInterval = ref<NodeJS.Timeout>()

// Time range options
const timeRangeOptions = [
  { title: 'Last 7 days', value: '7d' },
  { title: 'Last 30 days', value: '30d' },
  { title: 'Last 90 days', value: '90d' },
  { title: 'Last 12 months', value: '12m' }
]

// Event table headers
const eventHeaders = [
  { title: 'Event ID', key: 'eventId', sortable: false },
  { title: 'Success Score', key: 'successScore', sortable: true },
  { title: 'Connections', key: 'totalConnections', sortable: true },
  { title: 'Participants', key: 'totalParticipants', sortable: true }
]

// Computed properties
const keyMetrics = computed(() => {
  if (!analyticsData.value) return []

  const { platformMetrics } = analyticsData.value

  return [
    {
      title: 'Total Users',
      value: platformMetrics.totalUsers.toLocaleString(),
      icon: 'mdi-account-group',
      color: 'primary',
      trend: 8.5
    },
    {
      title: 'Active Events',
      value: platformMetrics.activeEvents.toString(),
      icon: 'mdi-calendar-check',
      color: 'success',
      trend: 12.3
    },
    {
      title: 'Total Connections',
      value: platformMetrics.totalConnections.toLocaleString(),
      icon: 'mdi-account-multiple',
      color: 'info',
      trend: 15.2
    },
    {
      title: 'Monthly Revenue',
      value: `$${(platformMetrics.revenueMetrics.monthlyRecurringRevenue / 100).toLocaleString()}`,
      icon: 'mdi-currency-usd',
      color: 'success',
      trend: 6.8
    }
  ]
})

const topEvents = computed(() => {
  return analyticsData.value?.topEvents || []
})

const activityHeatmapData = computed(() => {
  // Transform engagement trend data for heatmap
  const trend = analyticsData.value?.engagementTrend || []
  return trend.map(item => ({
    date: item.date,
    value: item.avgEngagement,
    count: item.activeUsers
  }))
})

// Methods
const refreshData = async () => {
  loading.value = true
  try {
    const response = await $fetch('/api/admin/analytics/dashboard', {
      params: {
        timeRange: selectedTimeRange.value,
        includeDetails: true
      }
    })

    if (response.success) {
      analyticsData.value = response.data
    }
  } catch (error) {
    console.error('Failed to load analytics data:', error)
    // Show error notification
  } finally {
    loading.value = false
  }
}

const refreshRevenueData = async (timeRange: string) => {
  try {
    const response = await $fetch('/api/admin/subscription-analytics', {
      params: { timeRange }
    })

    if (response.success) {
      revenueData.value = response.data
    }
  } catch (error) {
    console.error('Failed to load revenue data:', error)
  }
}

const exportReport = async () => {
  exporting.value = true
  try {
    // Create comprehensive report
    const response = await $fetch('/api/admin/analytics/export', {
      method: 'POST',
      body: {
        timeRange: selectedTimeRange.value,
        format: 'csv',
        sections: ['platform', 'events', 'engagement', 'revenue']
      }
    })

    // Handle file download
    const blob = new Blob([response], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-report-${selectedTimeRange.value}.csv`
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export report:', error)
  } finally {
    exporting.value = false
  }
}

const exportRevenueData = async (timeRange: string, format: string) => {
  try {
    window.open(`/api/admin/subscription-analytics?timeRange=${timeRange}&format=${format}`)
  } catch (error) {
    console.error('Failed to export revenue data:', error)
  }
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'error'
}

const getTrendColor = (trend: number): string => {
  return trend >= 0 ? 'text-success' : 'text-error'
}

const formatTrend = (trend: number): string => {
  const sign = trend >= 0 ? '+' : ''
  return `${sign}${trend.toFixed(1)}%`
}

// Lifecycle
onMounted(() => {
  refreshData()
  refreshRevenueData(selectedTimeRange.value)

  // Set up auto-refresh if enabled
  if (props.autoRefresh) {
    refreshInterval.value = setInterval(() => {
      refreshData()
    }, 30000) // Refresh every 30 seconds
  }
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})

// Watch for time range changes
watch(selectedTimeRange, () => {
  refreshData()
  refreshRevenueData(selectedTimeRange.value)
})
</script>

<style scoped>
.analytics-dashboard {
  background: linear-gradient(135deg, rgba(25, 118, 210, 0.02) 0%, rgba(156, 39, 176, 0.02) 100%);
  min-height: 100vh;
}

@media (max-width: 960px) {
  .d-flex.flex-wrap.gap-3 {
    flex-direction: column;
    gap: 1rem;
  }

  .d-flex.gap-2 {
    width: 100%;
    flex-direction: column;
    gap: 0.5rem;
  }

  .d-flex.gap-2 .v-select,
  .d-flex.gap-2 .v-btn {
    width: 100%;
  }
}
</style>
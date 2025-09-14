<template>
  <v-card class="subscription-analytics">
    <v-card-title class="text-h5 d-flex align-center">
      <v-icon class="mr-2" color="primary">mdi-chart-line</v-icon>
      Subscription Analytics
    </v-card-title>

    <v-card-text>
      <!-- Summary Stats -->
      <v-row class="mb-6">
        <v-col cols="6" md="3" v-for="stat in summaryStats" :key="stat.title">
          <v-card variant="tonal" :color="stat.color" class="pa-4">
            <div class="text-center">
              <v-icon :color="stat.color" size="large" class="mb-2">{{ stat.icon }}</v-icon>
              <div class="text-h4 font-weight-bold">{{ stat.value }}</div>
              <div class="text-body-2">{{ stat.title }}</div>
              <div
                v-if="stat.change"
                class="text-caption"
                :class="stat.change > 0 ? 'text-success' : 'text-error'"
              >
                {{ stat.change > 0 ? '+' : '' }}{{ stat.change }}% vs last month
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Revenue Chart -->
      <v-row class="mb-6" v-if="showCharts">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-h6">Monthly Revenue</v-card-title>
            <v-card-text>
              <div class="chart-placeholder">
                <v-progress-circular
                  v-if="loading"
                  indeterminate
                  color="primary"
                />
                <div v-else class="text-center pa-8">
                  <v-icon size="48" color="grey-lighten-1">mdi-chart-areaspline</v-icon>
                  <div class="text-body-2 text-medium-emphasis mt-2">
                    Revenue chart would appear here
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Subscription Tier Distribution -->
      <v-row class="mb-6">
        <v-col cols="12" md="6">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-h6">Plan Distribution</v-card-title>
            <v-card-text>
              <div v-for="tier in tierDistribution" :key="tier.name" class="mb-3">
                <div class="d-flex justify-space-between align-center mb-1">
                  <span class="text-body-1">{{ tier.name }}</span>
                  <span class="text-body-2">{{ tier.count }} users ({{ tier.percentage }}%)</span>
                </div>
                <v-progress-linear
                  :model-value="tier.percentage"
                  :color="tier.color"
                  height="8"
                  rounded
                />
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card variant="outlined" class="h-100">
            <v-card-title class="text-h6">Usage Trends</v-card-title>
            <v-card-text>
              <div class="mb-4">
                <div class="text-body-2 text-medium-emphasis mb-2">Average Events per User</div>
                <div class="d-flex align-center">
                  <div class="text-h5 font-weight-bold mr-2">{{ usageTrends.avgEventsPerUser }}</div>
                  <v-chip
                    :color="usageTrends.eventsTrend > 0 ? 'success' : 'error'"
                    size="small"
                  >
                    {{ usageTrends.eventsTrend > 0 ? '+' : '' }}{{ usageTrends.eventsTrend }}%
                  </v-chip>
                </div>
              </div>

              <div class="mb-4">
                <div class="text-body-2 text-medium-emphasis mb-2">Average Participants per Event</div>
                <div class="d-flex align-center">
                  <div class="text-h5 font-weight-bold mr-2">{{ usageTrends.avgParticipantsPerEvent }}</div>
                  <v-chip
                    :color="usageTrends.participantsTrend > 0 ? 'success' : 'error'"
                    size="small"
                  >
                    {{ usageTrends.participantsTrend > 0 ? '+' : '' }}{{ usageTrends.participantsTrend }}%
                  </v-chip>
                </div>
              </div>

              <div>
                <div class="text-body-2 text-medium-emphasis mb-2">Capacity Utilization</div>
                <div class="d-flex align-center">
                  <v-progress-linear
                    :model-value="usageTrends.capacityUtilization"
                    color="info"
                    height="12"
                    rounded
                    class="flex-grow-1 mr-3"
                  />
                  <span class="text-body-1 font-weight-medium">{{ usageTrends.capacityUtilization }}%</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Recent Subscription Activities -->
      <v-row>
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-h6">Recent Subscription Activity</v-card-title>
            <v-card-text>
              <v-timeline density="compact" class="timeline-custom">
                <v-timeline-item
                  v-for="activity in recentActivities"
                  :key="activity.id"
                  :dot-color="activity.color"
                  size="small"
                >
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="text-body-1 font-weight-medium">{{ activity.title }}</div>
                      <div class="text-body-2 text-medium-emphasis">{{ activity.description }}</div>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatRelativeTime(activity.timestamp) }}
                    </div>
                  </div>
                </v-timeline-item>
              </v-timeline>

              <div v-if="recentActivities.length === 0" class="text-center pa-6">
                <v-icon size="48" color="grey-lighten-1">mdi-timeline-clock-outline</v-icon>
                <div class="text-body-2 text-medium-emphasis mt-2">No recent activity</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Export and Filters -->
      <v-row class="mt-4">
        <v-col cols="12">
          <div class="d-flex flex-wrap gap-3 align-center">
            <v-select
              v-model="selectedTimeRange"
              :items="timeRangeOptions"
              label="Time Range"
              variant="outlined"
              density="compact"
              style="max-width: 200px;"
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
              @click="exportData"
              :loading="exporting"
            >
              Export CSV
            </v-btn>

            <v-spacer />

            <v-btn
              variant="text"
              prepend-icon="mdi-chart-box"
              @click="showCharts = !showCharts"
            >
              {{ showCharts ? 'Hide' : 'Show' }} Charts
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface AnalyticsData {
  summaryStats: {
    totalRevenue: number
    activeSubscriptions: number
    churnRate: number
    averageRevenue: number
  }
  tierDistribution: Array<{
    tier: string
    count: number
    percentage: number
  }>
  usageTrends: {
    avgEventsPerUser: number
    avgParticipantsPerEvent: number
    capacityUtilization: number
    eventsTrend: number
    participantsTrend: number
  }
  recentActivities: Array<{
    id: string
    type: string
    title: string
    description: string
    timestamp: Date
    userId?: string
  }>
}

interface Props {
  analyticsData?: AnalyticsData
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  'refresh': [timeRange: string]
  'export': [timeRange: string, format: string]
}>()

// Reactive state
const showCharts = ref(false)
const selectedTimeRange = ref('30d')
const exporting = ref(false)

// Time range options
const timeRangeOptions = [
  { title: 'Last 7 days', value: '7d' },
  { title: 'Last 30 days', value: '30d' },
  { title: 'Last 90 days', value: '90d' },
  { title: 'Last 12 months', value: '12m' }
]

// Computed properties
const summaryStats = computed(() => {
  const data = props.analyticsData?.summaryStats || {
    totalRevenue: 0,
    activeSubscriptions: 0,
    churnRate: 0,
    averageRevenue: 0
  }

  return [
    {
      title: 'Monthly Revenue',
      value: `$${data.totalRevenue.toLocaleString()}`,
      icon: 'mdi-currency-usd',
      color: 'success',
      change: 12.5
    },
    {
      title: 'Active Subscriptions',
      value: data.activeSubscriptions.toString(),
      icon: 'mdi-account-multiple',
      color: 'primary',
      change: 8.3
    },
    {
      title: 'Churn Rate',
      value: `${data.churnRate}%`,
      icon: 'mdi-account-minus',
      color: 'error',
      change: -2.1
    },
    {
      title: 'Average Revenue per User',
      value: `$${data.averageRevenue}`,
      icon: 'mdi-chart-line',
      color: 'info',
      change: 5.7
    }
  ]
})

const tierDistribution = computed(() => {
  const data = props.analyticsData?.tierDistribution || []
  const colors = {
    'FREE': 'grey',
    'COMMUNITY': 'green',
    'ORGANIZER': 'blue',
    'UNLIMITED': 'purple'
  }

  return data.map(tier => ({
    name: tier.tier,
    count: tier.count,
    percentage: tier.percentage,
    color: colors[tier.tier as keyof typeof colors] || 'grey'
  }))
})

const usageTrends = computed(() => {
  return props.analyticsData?.usageTrends || {
    avgEventsPerUser: 0,
    avgParticipantsPerEvent: 0,
    capacityUtilization: 0,
    eventsTrend: 0,
    participantsTrend: 0
  }
})

const recentActivities = computed(() => {
  const activities = props.analyticsData?.recentActivities || []

  return activities.map(activity => ({
    ...activity,
    color: getActivityColor(activity.type)
  }))
})

// Helper functions
const getActivityColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'subscription_upgraded': 'success',
    'subscription_downgraded': 'warning',
    'subscription_canceled': 'error',
    'payment_failed': 'error',
    'payment_recovered': 'success',
    'trial_started': 'info',
    'trial_ending': 'warning'
  }
  return colorMap[type] || 'grey'
}

const formatRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    return `${diffInMinutes}m ago`
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }
}

const refreshData = () => {
  emit('refresh', selectedTimeRange.value)
}

const exportData = async () => {
  exporting.value = true
  try {
    emit('export', selectedTimeRange.value, 'csv')
  } finally {
    exporting.value = false
  }
}

// Lifecycle
onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.subscription-analytics {
  max-width: 100%;
}

.chart-placeholder {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timeline-custom {
  max-height: 400px;
  overflow-y: auto;
}

@media (max-width: 600px) {
  .d-flex.flex-wrap.gap-3 {
    flex-direction: column;
    align-items: stretch;
  }

  .d-flex.flex-wrap.gap-3 .v-btn,
  .d-flex.flex-wrap.gap-3 .v-select {
    margin-bottom: 0.5rem;
    width: 100%;
    max-width: 100% !important;
  }
}
</style>
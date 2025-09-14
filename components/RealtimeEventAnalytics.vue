<template>
  <div class="realtime-event-analytics">
    <!-- Live Status Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="d-flex align-center gap-2">
        <v-icon :color="isLive ? 'success' : 'warning'">
          {{ isLive ? 'mdi-pulse' : 'mdi-pause-circle' }}
        </v-icon>
        <span class="text-body-1 font-weight-medium">
          {{ isLive ? 'Live Analytics' : 'Paused' }}
        </span>
        <v-chip
          :color="isLive ? 'success' : 'warning'"
          size="small"
          class="ml-2"
        >
          {{ isLive ? `${onlineParticipants} online` : 'Offline' }}
        </v-chip>
      </div>

      <div class="d-flex align-center gap-2">
        <span class="text-caption">Auto-refresh:</span>
        <v-switch
          v-model="autoRefreshEnabled"
          density="compact"
          hide-details
        />
        <v-btn
          variant="outlined"
          size="small"
          prepend-icon="mdi-refresh"
          @click="refreshData"
          :loading="loading"
        >
          Refresh
        </v-btn>
      </div>
    </div>

    <!-- Key Metrics Row -->
    <v-row class="mb-4">
      <v-col cols="6" md="3" v-for="metric in liveMetrics" :key="metric.title">
        <v-card variant="tonal" :color="metric.color" class="pa-3 text-center">
          <v-icon :color="metric.color" class="mb-1">{{ metric.icon }}</v-icon>
          <div class="text-h5 font-weight-bold">{{ metric.value }}</div>
          <div class="text-caption">{{ metric.title }}</div>
          <div
            v-if="metric.change !== undefined"
            class="text-caption mt-1"
            :class="metric.change >= 0 ? 'text-success' : 'text-warning'"
          >
            {{ metric.change >= 0 ? '↗' : '↘' }} {{ Math.abs(metric.change) }}
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Activity Timeline and Current Round -->
    <v-row class="mb-4">
      <!-- Activity Timeline -->
      <v-col cols="12" md="8">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-timeline</v-icon>
            Live Activity Feed
          </v-card-title>
          <v-card-text>
            <v-timeline density="compact" class="timeline-feed" style="max-height: 300px; overflow-y: auto;">
              <v-timeline-item
                v-for="activity in recentActivities"
                :key="activity.id"
                :dot-color="getActivityColor(activity.type)"
                size="small"
              >
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="text-body-2 font-weight-medium">{{ formatActivityTitle(activity.type) }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ activity.userId ? 'User action' : 'System event' }}
                    </div>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatRelativeTime(activity.timestamp) }}
                  </div>
                </div>
              </v-timeline-item>

              <div v-if="!recentActivities.length" class="text-center pa-4">
                <v-icon size="48" color="grey-lighten-1">mdi-timeline-clock-outline</v-icon>
                <div class="text-body-2 text-medium-emphasis mt-2">No recent activity</div>
              </div>
            </v-timeline>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Current Round Info -->
      <v-col cols="12" md="4">
        <v-card class="h-100">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-account-group</v-icon>
            Current Round
          </v-card-title>
          <v-card-text>
            <div v-if="currentRound" class="current-round-info">
              <div class="d-flex align-center justify-space-between mb-3">
                <span class="text-h6">Round {{ currentRound.roundNumber }}</span>
                <v-chip
                  :color="getRoundStatusColor(currentRound.status)"
                  size="small"
                >
                  {{ currentRound.status }}
                </v-chip>
              </div>

              <div class="mb-3">
                <div class="text-body-2 mb-1">Participants</div>
                <div class="d-flex align-center">
                  <v-icon size="small" class="mr-1">mdi-account-group</v-icon>
                  <span class="font-weight-medium">{{ currentRound.participantCount }}</span>
                </div>
              </div>

              <div class="mb-3">
                <div class="text-body-2 mb-1">Topics</div>
                <v-chip
                  v-for="topic in currentRound.topics"
                  :key="topic"
                  size="x-small"
                  class="ma-1"
                >
                  {{ topic }}
                </v-chip>
              </div>

              <div v-if="currentRound.startTime">
                <div class="text-body-2 mb-1">Duration</div>
                <div class="d-flex align-center">
                  <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                  <span>{{ formatDuration(currentRound.startTime, currentRound.endTime) }}</span>
                </div>
              </div>
            </div>

            <div v-else class="text-center pa-4">
              <v-icon size="48" color="grey-lighten-1">mdi-account-group-outline</v-icon>
              <div class="text-body-2 text-medium-emphasis mt-2">No active round</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Activity Heatmap and Recent Connections -->
    <v-row class="mb-4">
      <!-- Activity Heatmap -->
      <v-col cols="12" md="7">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-chart-scatter-plot</v-icon>
            Activity Heatmap (Last Hour)
          </v-card-title>
          <v-card-text>
            <div ref="heatmapContainer" class="activity-heatmap-container" style="height: 200px;">
              <div v-if="!activityHeatmapData || Object.keys(activityHeatmapData).length === 0"
                   class="d-flex justify-center align-center h-100">
                <div class="text-center">
                  <v-icon size="48" color="grey-lighten-1">mdi-chart-scatter-plot-hexbin</v-icon>
                  <div class="text-body-2 text-medium-emphasis mt-2">No activity in the last hour</div>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Recent Connections & Votes -->
      <v-col cols="12" md="5">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-account-multiple</v-icon>
            Recent Connections & Votes
          </v-card-title>
          <v-card-text>
            <div class="connections-feed" style="max-height: 200px; overflow-y: auto;">
              <!-- Recent Connections -->
              <div v-if="recentConnections.length" class="mb-3">
                <div class="text-body-2 font-weight-medium mb-2">New Connections</div>
                <div v-for="connection in recentConnections.slice(0, 3)" :key="connection.id" class="mb-2">
                  <div class="d-flex align-center justify-space-between">
                    <div class="d-flex align-center">
                      <v-avatar size="24" class="mr-2" color="primary">
                        <v-icon size="16">mdi-account-multiple</v-icon>
                      </v-avatar>
                      <span class="text-body-2">{{ connection.users.join(' ↔ ') }}</span>
                    </div>
                    <v-chip
                      :color="getQualityColor(connection.qualityScore)"
                      size="x-small"
                    >
                      {{ connection.qualityScore }}
                    </v-chip>
                  </div>
                </div>
              </div>

              <!-- Recent Votes -->
              <div v-if="recentVotes.length">
                <div class="text-body-2 font-weight-medium mb-2">Recent Votes</div>
                <div v-for="vote in recentVotes.slice(0, 3)" :key="vote.id" class="mb-2">
                  <div class="d-flex align-center">
                    <v-avatar size="24" class="mr-2" color="info">
                      <v-icon size="16">mdi-thumb-up</v-icon>
                    </v-avatar>
                    <div class="flex-grow-1">
                      <div class="text-body-2">{{ vote.user }} voted for</div>
                      <div class="text-caption text-medium-emphasis">{{ vote.topic }}</div>
                    </div>
                    <v-chip
                      :color="vote.preference === 'FIRST_CHOICE' ? 'success' : 'info'"
                      size="x-small"
                    >
                      {{ vote.preference === 'FIRST_CHOICE' ? '1st' : '2nd' }}
                    </v-chip>
                  </div>
                </div>
              </div>

              <div v-if="!recentConnections.length && !recentVotes.length" class="text-center pa-4">
                <v-icon size="48" color="grey-lighten-1">mdi-account-network-outline</v-icon>
                <div class="text-body-2 text-medium-emphasis mt-2">No recent activity</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import * as d3 from 'd3'

interface Props {
  eventId: string
  autoRefresh?: boolean
  refreshInterval?: number
}

const props = withDefaults(defineProps<Props>(), {
  autoRefresh: false,
  refreshInterval: 10000 // 10 seconds
})

// State
const loading = ref(false)
const autoRefreshEnabled = ref(props.autoRefresh)
const realtimeData = ref<any>()
const refreshTimer = ref<NodeJS.Timeout>()
const heatmapContainer = ref<HTMLElement>()

// Computed properties
const isLive = computed(() => autoRefreshEnabled.value)
const onlineParticipants = computed(() => realtimeData.value?.liveActivity?.participantsOnline || 0)

const liveMetrics = computed(() => {
  const metrics = realtimeData.value?.eventMetrics
  if (!metrics) return []

  return [
    {
      title: 'Participants',
      value: metrics.participantCount || 0,
      icon: 'mdi-account-group',
      color: 'primary',
      change: undefined
    },
    {
      title: 'Connections',
      value: metrics.connectionCount || 0,
      icon: 'mdi-account-multiple',
      color: 'info',
      change: 2
    },
    {
      title: 'Quality Score',
      value: (metrics.avgConnectionQuality || 0).toFixed(1),
      icon: 'mdi-star',
      color: 'warning',
      change: 0.5
    },
    {
      title: 'Engagement',
      value: (metrics.engagementScore || 0).toFixed(0) + '%',
      icon: 'mdi-chart-line',
      color: 'success',
      change: 3
    }
  ]
})

const recentActivities = computed(() => {
  return realtimeData.value?.liveActivity?.recentActions || []
})

const currentRound = computed(() => {
  return realtimeData.value?.currentRound
})

const recentConnections = computed(() => {
  return realtimeData.value?.recentConnections || []
})

const recentVotes = computed(() => {
  return realtimeData.value?.recentVotes || []
})

const activityHeatmapData = computed(() => {
  return realtimeData.value?.liveActivity?.activityHeatmap || {}
})

// Methods
const refreshData = async () => {
  loading.value = true
  try {
    const response = await $fetch(`/api/events/${props.eventId}/analytics/realtime`, {
      params: { refresh: true }
    })

    if (response.success) {
      realtimeData.value = response.data
      await nextTick()
      drawActivityHeatmap()
    }
  } catch (error) {
    console.error('Failed to load realtime data:', error)
  } finally {
    loading.value = false
  }
}

const startAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }

  if (autoRefreshEnabled.value) {
    refreshTimer.value = setInterval(() => {
      refreshData()
    }, props.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = undefined
  }
}

const getActivityColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    'VOTE_CAST': 'info',
    'CONNECTION_MADE': 'success',
    'TOPIC_CREATE': 'primary',
    'ROUND_JOIN': 'warning',
    'MESSAGE_SENT': 'secondary',
    'PAGE_VIEW': 'grey'
  }
  return colorMap[type] || 'grey'
}

const formatActivityTitle = (type: string): string => {
  const titleMap: Record<string, string> = {
    'VOTE_CAST': 'Vote Cast',
    'CONNECTION_MADE': 'New Connection',
    'TOPIC_CREATE': 'Topic Created',
    'ROUND_JOIN': 'Joined Round',
    'MESSAGE_SENT': 'Message Sent',
    'PAGE_VIEW': 'Page View'
  }
  return titleMap[type] || type.replace(/_/g, ' ')
}

const getRoundStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'ACTIVE': 'success',
    'PLANNED': 'info',
    'COMPLETED': 'secondary',
    'CANCELLED': 'error'
  }
  return colorMap[status] || 'grey'
}

const getQualityColor = (score: number): string => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'error'
}

const formatRelativeTime = (timestamp: string | Date): string => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays}d ago`
}

const formatDuration = (startTime: string, endTime?: string): string => {
  const start = new Date(startTime)
  const end = endTime ? new Date(endTime) : new Date()
  const diffInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))

  if (diffInMinutes < 60) return `${diffInMinutes} min`

  const hours = Math.floor(diffInMinutes / 60)
  const minutes = diffInMinutes % 60
  return `${hours}h ${minutes}m`
}

const drawActivityHeatmap = () => {
  if (!heatmapContainer.value || !activityHeatmapData.value) return

  // Clear previous chart
  d3.select(heatmapContainer.value).selectAll('*').remove()

  const data = Object.entries(activityHeatmapData.value).map(([time, count]) => ({
    time: new Date(time),
    count: count as number
  }))

  if (!data.length) return

  const margin = { top: 20, right: 20, bottom: 30, left: 40 }
  const width = heatmapContainer.value.clientWidth - margin.left - margin.right
  const height = 150 - margin.top - margin.bottom

  const svg = d3.select(heatmapContainer.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  const xScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.time) as [Date, Date])
    .range([0, width])

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.count) || 1])
    .range([height, 0])

  const line = d3.line<{ time: Date, count: number }>()
    .x(d => xScale(d.time))
    .y(d => yScale(d.count))
    .curve(d3.curveMonotoneX)

  g.append('path')
    .datum(data)
    .attr('d', line)
    .style('fill', 'none')
    .style('stroke', 'rgb(var(--v-theme-primary))')
    .style('stroke-width', 2)

  g.selectAll('.activity-dot')
    .data(data)
    .enter().append('circle')
    .attr('class', 'activity-dot')
    .attr('cx', d => xScale(d.time))
    .attr('cy', d => yScale(d.count))
    .attr('r', 3)
    .style('fill', 'rgb(var(--v-theme-primary))')

  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.timeFormat('%H:%M'))

  const yAxis = d3.axisLeft(yScale)
    .ticks(3)

  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)

  g.append('g')
    .call(yAxis)
}

// Lifecycle
onMounted(() => {
  refreshData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

// Watch for auto-refresh changes
watch(autoRefreshEnabled, (newVal) => {
  if (newVal) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})
</script>

<style scoped>
.realtime-event-analytics {
  width: 100%;
}

.timeline-feed {
  max-height: 300px;
}

.current-round-info {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 8px;
  padding: 12px;
}

.connections-feed {
  max-height: 200px;
}

.activity-heatmap-container {
  width: 100%;
}

:deep(.v-timeline-item__body) {
  padding-top: 2px !important;
  padding-bottom: 2px !important;
}
</style>
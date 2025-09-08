<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { User } from '~/types/user'
import type { DiscussionTopic, ActiveRound, RoundHistory } from '~/types/topic'

definePageMeta({
  middleware: 'authenticated'
})

const { user } = useUserSession()
const { eventStatus, isEventActive, isEventInactive, canEditEvent } = useEventStatus()
const { settings: adminSettings, loadSettings } = useAdminSettings()

// Redirect non-admin users
const isOrganizer = computed(() => {
  const userRole = (user.value as any)?.Role || (user.value as any)?.role
  return ['Admin', 'Organizer'].includes(userRole)
})

if (!isOrganizer.value) {
  await navigateTo('/dashboard')
}

// State
const loading = ref(true)
const currentTab = ref('overview')

// Event Data
const eventStats = ref({
  totalParticipants: 0,
  totalTopics: 0,
  totalVotes: 0,
  totalPoints: 0,
  activeRound: null as ActiveRound | null,
  recentActivity: [] as any[],
  upcomingActions: [] as any[]
})

const topics = ref<DiscussionTopic[]>([])
const activeRound = ref<ActiveRound | null>(null)
const roundHistory = ref<RoundHistory[]>([])
const timeRemaining = ref(0)
const timerInterval = ref<NodeJS.Timeout | null>(null)

// UI State
const quickActionsConfig = computed(() => [
  {
    section: 'Event Control',
    actions: [
      {
        title: 'Start Round',
        subtitle: activeRound.value?.isActive ? 'Round in progress' : 'Begin new discussion round',
        icon: activeRound.value?.isActive ? 'mdi-pause-circle' : 'mdi-play-circle',
        color: activeRound.value?.isActive ? 'warning' : 'success',
        to: '/groups',
        disabled: !canEditEvent.value,
        primary: !activeRound.value?.isActive
      },
      {
        title: 'Manage Rooms',
        subtitle: 'Configure discussion spaces and capacity',
        icon: 'mdi-home-city',
        color: 'info',
        to: '/organizer/rooms',
        disabled: false,
        primary: false
      },
      {
        title: 'Event Settings',
        subtitle: 'Configure voting rules and parameters',
        icon: 'mdi-tune',
        color: 'primary',
        to: '/settings',
        disabled: false,
        primary: false
      }
    ]
  },
  {
    section: 'Participant Management',
    actions: [
      {
        title: 'Manage Participants',
        subtitle: 'Invite users and manage roles',
        icon: 'mdi-account-group',
        color: 'secondary',
        to: '/organizer/participants',
        disabled: false,
        primary: false
      },
      {
        title: 'Live Voting Display',
        subtitle: 'Show real-time voting to participants',
        icon: 'mdi-monitor',
        color: 'purple',
        to: '/admin/voting-dashboard',
        disabled: false,
        primary: false
      }
    ]
  },
  {
    section: 'Data & Analysis',
    actions: [
      {
        title: 'Export Data',
        subtitle: 'Download topics and participation data',
        icon: 'mdi-download',
        color: 'teal',
        action: 'export',
        disabled: false,
        primary: false
      },
      {
        title: 'Generate QR Code',
        subtitle: 'Create easy-join link for participants',
        icon: 'mdi-qrcode',
        color: 'orange',
        action: 'qr-code',
        disabled: false,
        primary: false
      },
      {
        title: 'Round History',
        subtitle: 'Review past discussion rounds',
        icon: 'mdi-history',
        color: 'grey',
        action: 'history',
        disabled: false,
        primary: false
      }
    ]
  }
])

// Computed values
const currentRoundInfo = computed(() => {
  if (!activeRound.value?.isActive) return null
  
  return {
    roundNumber: activeRound.value.roundNumber,
    startTime: new Date(activeRound.value.startTime),
    duration: activeRound.value.duration,
    endTime: new Date(new Date(activeRound.value.startTime).getTime() + (activeRound.value.duration * 60 * 1000)),
    topicCount: activeRound.value.selectedTopics?.length || 0,
    participantCount: activeRound.value.groupAssignments?.reduce((sum, group) => sum + group.participants.length, 0) || 0,
    timeRemaining: timeRemaining.value
  }
})

const eventHealthScore = computed(() => {
  const hasTopics = eventStats.value.totalTopics > 0
  const hasVotes = eventStats.value.totalVotes > 0
  const hasParticipants = eventStats.value.totalParticipants > 1
  const isConfigured = true // Could check room config, settings, etc.
  
  const score = [hasTopics, hasVotes, hasParticipants, isConfigured].filter(Boolean).length
  return { score: score * 25, status: score >= 3 ? 'good' : score >= 2 ? 'warning' : 'error' }
})

const criticalIssues = computed(() => {
  const issues = []
  
  if (isEventInactive.value) {
    issues.push({ type: 'warning', text: 'Event is currently inactive', action: 'Activate Event' })
  }
  
  if (eventStats.value.totalTopics === 0) {
    issues.push({ type: 'error', text: 'No topics proposed yet', action: 'Encourage topic submission' })
  }
  
  if (eventStats.value.totalVotes === 0 && eventStats.value.totalTopics > 0) {
    issues.push({ type: 'warning', text: 'No votes cast yet', action: 'Encourage voting' })
  }
  
  if (activeRound.value?.isActive && timeRemaining.value < 300) {
    issues.push({ type: 'info', text: 'Current round ending soon', action: 'Extend or prepare next round' })
  }
  
  return issues
})

const topTopics = computed(() => {
  return topics.value
    .filter(t => !t.frozen)
    .sort((a, b) => (b.totalPreferenceScore || 0) - (a.totalPreferenceScore || 0))
    .slice(0, 5)
})

// Methods
async function loadDashboardData() {
  loading.value = true
  
  try {
    await Promise.all([
      loadEventStats(),
      loadActiveRound(),
      loadTopics(),
      loadRoundHistory(),
      loadSettings()
    ])
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
}

async function loadEventStats() {
  try {
    // Load basic stats
    const topicsData = await $fetch('/api/topics')
    topics.value = topicsData
    
    eventStats.value.totalTopics = topicsData.length
    eventStats.value.totalVotes = topicsData.reduce((sum: number, topic: any) => sum + (topic.votes || 0), 0)
    eventStats.value.totalPoints = topicsData.reduce((sum: number, topic: any) => sum + (topic.totalPreferenceScore || 0), 0)
    
    // TODO: Load participant count when multi-event support is added
    eventStats.value.totalParticipants = 0
  } catch (error) {
    console.error('Failed to load event stats:', error)
  }
}

async function loadActiveRound() {
  try {
    const data = await $fetch('/api/active-round') as ActiveRound | null
    activeRound.value = data
    eventStats.value.activeRound = data
    
    if (activeRound.value?.isActive) {
      startTimer()
    } else {
      stopTimer()
    }
  } catch (error) {
    console.error('Failed to load active round:', error)
    activeRound.value = null
  }
}

async function loadTopics() {
  try {
    const { currentEventId } = useEventContext()
    if (!currentEventId.value) return
    
    const response = await $fetch(`/api/events/${currentEventId.value}/topics`)
    topics.value = response as DiscussionTopic[]
  } catch (error) {
    console.error('Failed to load topics:', error)
  }
}

async function loadRoundHistory() {
  try {
    const data = await $fetch('/api/admin/round-history') as RoundHistory[]
    roundHistory.value = data
  } catch (error) {
    console.error('Failed to load round history:', error)
  }
}

function startTimer() {
  if (!activeRound.value?.isActive) return
  
  const startTime = new Date(activeRound.value.startTime)
  const duration = activeRound.value.duration * 60 * 1000 // Convert to milliseconds
  
  const updateTimer = () => {
    const now = new Date()
    const elapsed = now.getTime() - startTime.getTime()
    const remaining = Math.max(0, duration - elapsed)
    
    timeRemaining.value = Math.floor(remaining / 1000) // Convert to seconds
    
    if (remaining <= 0) {
      clearInterval(timerInterval.value!)
      activeRound.value!.isActive = false
    }
  }
  
  updateTimer()
  timerInterval.value = setInterval(updateTimer, 1000)
}

function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

async function handleQuickAction(action: string) {
  switch (action) {
    case 'qr-code':
      try {
        await $fetch('/api/admin/generate-qr', {
          method: 'POST',
          body: {
            eventCode: 'DEMO2024',
            eventName: 'Current Event'
          }
        })
        alert('QR Code generated successfully!')
      } catch (error) {
        alert('Failed to generate QR code')
      }
      break
      
    case 'export':
      try {
        const topics = await $fetch('/api/topics')
        const blob = new Blob([JSON.stringify(topics, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `event-data-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
      } catch (error) {
        alert('Failed to export data')
      }
      break
      
    case 'history':
      // Show round history dialog or navigate to history page
      currentTab.value = 'history'
      break
  }
}

async function endCurrentRound() {
  const confirmed = confirm('Are you sure you want to end the current round early?')
  if (!confirmed) return
  
  try {
    await $fetch('/api/admin/end-round', { method: 'POST' })
    await loadActiveRound()
    stopTimer()
    alert('Round ended successfully!')
  } catch (error) {
    console.error('Failed to end round:', error)
    alert('Failed to end round')
  }
}

async function extendCurrentRound() {
  const confirmed = confirm('Extend the current round by 5 minutes?')
  if (!confirmed) return
  
  try {
    const response = await $fetch('/api/admin/extend-round', { 
      method: 'POST',
      body: { extensionMinutes: 5 }
    })
    
    if (activeRound.value) {
      activeRound.value.duration = response.newDuration
    }
    
    alert(`Round extended by 5 minutes. New duration: ${response.newDuration} minutes.`)
  } catch (error) {
    console.error('Failed to extend round:', error)
    alert('Failed to extend round')
  }
}

// Lifecycle
onMounted(() => {
  loadDashboardData()
  
  // Set up polling for updates every 10 seconds
  const pollInterval = setInterval(async () => {
    await Promise.all([loadActiveRound(), loadEventStats()])
  }, 10000)
  
  // Store interval reference for cleanup
  ;(window as any).__adminHubPollInterval = pollInterval
})

onBeforeUnmount(() => {
  stopTimer()
  
  if ((window as any).__adminHubPollInterval) {
    clearInterval((window as any).__adminHubPollInterval)
  }
})

const tabs = [
  { key: 'overview', title: 'Event Overview', icon: 'mdi-view-dashboard' },
  { key: 'control', title: 'Control Center', icon: 'mdi-cog' },
  { key: 'insights', title: 'Insights & Data', icon: 'mdi-chart-line' }
]
</script>

<template>
  <v-container fluid>
    <!-- Event Status Alert -->
    <v-alert
      v-if="isEventInactive"
      type="warning"
      class="mb-6"
      prominent
      variant="outlined"
    >
      <template #prepend>
        <v-icon>mdi-alert</v-icon>
      </template>
      <v-alert-title>Event is Currently Inactive</v-alert-title>
      Management actions may be limited. {{ eventStatus.statusReason }}
    </v-alert>

    <!-- Header Section -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Organizer Hub</h1>
        <p class="text-body-1 text-grey-darken-1">
          Unified command center for managing your unconference event
        </p>
      </div>
      
      <div class="d-flex gap-2">
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-refresh"
          @click="loadDashboardData"
          :loading="loading"
        >
          Refresh
        </v-btn>
        <v-btn
          color="success"
          prepend-icon="mdi-view-dashboard"
          to="/dashboard"
        >
          Participant View
        </v-btn>
      </div>
    </div>

    <!-- Critical Issues Alert -->
    <v-alert
      v-if="criticalIssues.length > 0"
      :type="criticalIssues.some(i => i.type === 'error') ? 'error' : 'warning'"
      class="mb-6"
      variant="tonal"
    >
      <v-alert-title>Action Required</v-alert-title>
      <v-list density="compact" class="bg-transparent">
        <v-list-item
          v-for="issue in criticalIssues"
          :key="issue.text"
          class="px-0"
        >
          <template #prepend>
            <v-icon 
              :color="issue.type === 'error' ? 'error' : issue.type === 'warning' ? 'warning' : 'info'"
              size="small"
            >
              {{ issue.type === 'error' ? 'mdi-alert-circle' : issue.type === 'warning' ? 'mdi-alert' : 'mdi-information' }}
            </v-icon>
          </template>
          <v-list-item-title>{{ issue.text }}</v-list-item-title>
          <v-list-item-subtitle>{{ issue.action }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-alert>

    <!-- Main Content Tabs -->
    <v-card class="mb-6">
      <v-tabs v-model="currentTab" color="primary" grow>
        <v-tab
          v-for="tab in tabs"
          :key="tab.key"
          :value="tab.key"
          :prepend-icon="tab.icon"
        >
          {{ tab.title }}
        </v-tab>
      </v-tabs>
    </v-card>

    <!-- Tab Content -->
    <v-window v-model="currentTab">
      <!-- Overview Tab -->
      <v-window-item value="overview">
        <v-row class="mb-6">
          <!-- Real-time Event Status -->
          <v-col cols="12" lg="8">
            <!-- Active Round Status -->
            <v-card v-if="activeRound?.isActive" class="mb-4" color="success" variant="elevated">
              <v-card-title class="d-flex align-center justify-space-between text-white">
                <div class="d-flex align-center">
                  <v-icon class="mr-3" size="large">mdi-play-circle</v-icon>
                  <div>
                    <h3>Round {{ currentRoundInfo?.roundNumber }} Active</h3>
                    <p class="text-caption mb-0 opacity-90">
                      Started: {{ currentRoundInfo?.startTime.toLocaleTimeString() }}
                    </p>
                  </div>
                </div>
                
                <div class="text-center">
                  <v-chip 
                    color="white" 
                    text-color="success" 
                    size="large" 
                    prepend-icon="mdi-timer"
                    class="mb-2"
                  >
                    {{ formatTime(currentRoundInfo?.timeRemaining || 0) }}
                  </v-chip>
                  <br>
                  <small class="opacity-90">{{ currentRoundInfo?.duration }}min total</small>
                </div>
              </v-card-title>
              
              <v-card-text class="text-white">
                <v-row class="align-center">
                  <v-col cols="12" md="8">
                    <div class="d-flex gap-4 mb-3">
                      <div class="text-center">
                        <div class="text-h5 font-weight-bold">{{ currentRoundInfo?.topicCount }}</div>
                        <div class="text-caption opacity-90">Active Topics</div>
                      </div>
                      <v-divider vertical class="opacity-50"></v-divider>
                      <div class="text-center">
                        <div class="text-h5 font-weight-bold">{{ currentRoundInfo?.participantCount }}</div>
                        <div class="text-caption opacity-90">Participants</div>
                      </div>
                      <v-divider vertical class="opacity-50"></v-divider>
                      <div class="text-center">
                        <div class="text-h5 font-weight-bold">{{ Math.ceil((currentRoundInfo?.timeRemaining || 0) / 60) }}</div>
                        <div class="text-caption opacity-90">Min Left</div>
                      </div>
                    </div>
                    
                    <v-progress-linear
                      :model-value="((currentRoundInfo?.duration || 1) * 60 - (currentRoundInfo?.timeRemaining || 0)) / ((currentRoundInfo?.duration || 1) * 60) * 100"
                      color="white"
                      height="8"
                      rounded
                      class="mb-2"
                    ></v-progress-linear>
                    <div class="text-caption opacity-90">Progress: {{ Math.round(((currentRoundInfo?.duration || 1) * 60 - (currentRoundInfo?.timeRemaining || 0)) / ((currentRoundInfo?.duration || 1) * 60) * 100) }}% complete</div>
                  </v-col>
                  
                  <v-col cols="12" md="4" class="text-center">
                    <v-btn
                      color="white"
                      variant="outlined"
                      size="small"
                      @click="extendCurrentRound"
                      class="mr-2 mb-2"
                    >
                      <v-icon left>mdi-timer-plus</v-icon>
                      +5min
                    </v-btn>
                    <v-btn
                      color="error"
                      variant="elevated"
                      size="small"
                      @click="endCurrentRound"
                      class="mb-2"
                    >
                      <v-icon left>mdi-stop</v-icon>
                      End Round
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
            
            <!-- Event Health Dashboard -->
            <v-card>
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-pulse</v-icon>
                Event Health
                <v-spacer></v-spacer>
                <v-chip 
                  :color="eventHealthScore.status === 'good' ? 'success' : eventHealthScore.status === 'warning' ? 'warning' : 'error'"
                  size="small"
                >
                  {{ eventHealthScore.score }}% Ready
                </v-chip>
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="6" md="3" class="text-center">
                    <div class="text-h4 text-primary">{{ eventStats.totalTopics }}</div>
                    <div class="text-caption text-grey">Topics Proposed</div>
                  </v-col>
                  <v-col cols="6" md="3" class="text-center">
                    <div class="text-h4 text-success">{{ eventStats.totalPoints }}</div>
                    <div class="text-caption text-grey">Total Points</div>
                  </v-col>
                  <v-col cols="6" md="3" class="text-center">
                    <div class="text-h4 text-warning">{{ eventStats.totalVotes }}</div>
                    <div class="text-caption text-grey">Votes Cast</div>
                  </v-col>
                  <v-col cols="6" md="3" class="text-center">
                    <div class="text-h4 text-info">{{ roundHistory.length }}</div>
                    <div class="text-caption text-grey">Rounds Completed</div>
                  </v-col>
                </v-row>
                
                <v-progress-linear
                  :model-value="eventHealthScore.score"
                  :color="eventHealthScore.status === 'good' ? 'success' : eventHealthScore.status === 'warning' ? 'warning' : 'error'"
                  height="12"
                  rounded
                  class="mt-4"
                >
                  <template v-slot:default="{ value }">
                    <small class="text-white font-weight-bold">{{ Math.ceil(value) }}%</small>
                  </template>
                </v-progress-linear>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- Quick Stats & Top Topics -->
          <v-col cols="12" lg="4">
            <!-- Top Topics Preview -->
            <v-card class="mb-4">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-trophy</v-icon>
                Top Topics
                <v-spacer></v-spacer>
                <v-btn size="small" variant="text" to="/dashboard?tab=voting">View All</v-btn>
              </v-card-title>
              <v-card-text>
                <v-list density="compact" v-if="topTopics.length > 0">
                  <v-list-item
                    v-for="(topic, index) in topTopics"
                    :key="topic.id"
                    class="px-0"
                  >
                    <template #prepend>
                      <v-avatar :color="index === 0 ? 'warning' : 'grey'" size="32">
                        <span class="text-white font-weight-bold">{{ index + 1 }}</span>
                      </v-avatar>
                    </template>
                    
                    <v-list-item-title>{{ topic.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ topic.totalPreferenceScore || 0 }} points</v-list-item-subtitle>
                    
                    <template #append>
                      <v-chip
                        v-if="topic.selectedForRound"
                        size="small"
                        color="success"
                        variant="flat"
                      >
                        Selected
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
                <v-alert v-else type="info" variant="tonal" class="text-center">
                  No topics proposed yet. Encourage participants to submit topics!
                </v-alert>
              </v-card-text>
            </v-card>
            
            <!-- Recent Activity -->
            <v-card>
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-clock-outline</v-icon>
                Recent Activity
              </v-card-title>
              <v-card-text>
                <v-timeline align="start" side="end" density="compact">
                  <v-timeline-item
                    v-if="activeRound?.isActive"
                    dot-color="success"
                    size="small"
                  >
                    <template #icon>
                      <v-icon size="small">mdi-play</v-icon>
                    </template>
                    <div class="text-caption text-grey">{{ currentRoundInfo?.startTime.toLocaleString() }}</div>
                    <div>Round {{ currentRoundInfo?.roundNumber }} started</div>
                  </v-timeline-item>
                  
                  <v-timeline-item
                    v-for="round in roundHistory.slice(0, 3)"
                    :key="round.id"
                    dot-color="primary"
                    size="small"
                  >
                    <template #icon>
                      <v-icon size="small">mdi-flag-checkered</v-icon>
                    </template>
                    <div class="text-caption text-grey">{{ new Date(round.startTime).toLocaleString() }}</div>
                    <div>Round {{ round.roundNumber }} completed</div>
                    <div class="text-caption">{{ round.selectedTopics?.length || 0 }} topics discussed</div>
                  </v-timeline-item>
                  
                  <v-timeline-item
                    v-if="!activeRound?.isActive && roundHistory.length === 0"
                    dot-color="grey"
                    size="small"
                  >
                    <template #icon>
                      <v-icon size="small">mdi-circle-outline</v-icon>
                    </template>
                    <div class="text-caption text-grey">Waiting for first round</div>
                    <div>Event ready to begin</div>
                  </v-timeline-item>
                </v-timeline>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Control Center Tab -->
      <v-window-item value="control">
        <v-row>
          <v-col
            v-for="section in quickActionsConfig"
            :key="section.section"
            cols="12"
          >
            <h2 class="text-h5 mb-4">{{ section.section }}</h2>
            <v-row>
              <v-col
                v-for="action in section.actions"
                :key="action.title"
                cols="12"
                sm="6"
                md="4"
                lg="3"
              >
                <v-card 
                  class="text-center pa-6 hover-card h-100"
                  :class="{ 'primary-action': action.primary }"
                  :color="action.disabled ? 'grey-lighten-4' : (action.primary ? action.color : 'surface')"
                  :variant="action.disabled ? 'outlined' : (action.primary ? 'elevated' : 'tonal')"
                  @click="action.to ? $router.push(action.to) : handleQuickAction(action.action)"
                  :style="action.disabled ? 'cursor: not-allowed; opacity: 0.6;' : 'cursor: pointer;'"
                >
                  <v-icon 
                    :icon="action.icon" 
                    size="64" 
                    :color="action.disabled ? 'grey' : (action.primary ? 'white' : action.color)" 
                    class="mb-4"
                  ></v-icon>
                  <h3 
                    class="text-h6 mb-2"
                    :class="action.primary ? 'text-white' : ''"
                  >
                    {{ action.title }}
                  </h3>
                  <p 
                    class="text-body-2"
                    :class="action.primary ? 'text-white' : 'text-grey-darken-1'"
                  >
                    {{ action.subtitle }}
                  </p>
                  
                  <v-chip
                    v-if="action.disabled && !canEditEvent"
                    size="small"
                    color="warning"
                    class="mt-2"
                  >
                    Event Inactive
                  </v-chip>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Insights & Data Tab -->
      <v-window-item value="insights">
        <v-row>
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>Topic Performance</v-card-title>
              <v-card-text>
                <v-list v-if="topics.length > 0">
                  <v-list-item
                    v-for="topic in topics.slice(0, 10)"
                    :key="topic.id"
                  >
                    <template #prepend>
                      <v-avatar :color="topic.totalPreferenceScore > 5 ? 'success' : topic.totalPreferenceScore > 2 ? 'warning' : 'grey'" size="32">
                        <span class="text-white font-weight-bold">{{ topic.totalPreferenceScore || 0 }}</span>
                      </v-avatar>
                    </template>
                    
                    <v-list-item-title>{{ topic.title }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ topic.firstChoiceVoters?.length || 0 }} first choices, 
                      {{ topic.secondChoiceVoters?.length || 0 }} second choices
                    </v-list-item-subtitle>
                    
                    <template #append>
                      <v-progress-linear
                        :model-value="Math.min((topic.totalPreferenceScore || 0) / Math.max(...topics.map(t => t.totalPreferenceScore || 0)) * 100, 100)"
                        color="primary"
                        height="4"
                        width="80"
                      ></v-progress-linear>
                    </template>
                  </v-list-item>
                </v-list>
                <v-alert v-else type="info" class="text-center">
                  No topics available for analysis yet.
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>Round History</v-card-title>
              <v-card-text>
                <v-timeline v-if="roundHistory.length > 0" align="start" side="end" density="compact">
                  <v-timeline-item
                    v-for="round in roundHistory"
                    :key="round.id"
                    dot-color="primary"
                    size="small"
                  >
                    <template #icon>
                      <v-icon size="small">mdi-flag-checkered</v-icon>
                    </template>
                    
                    <v-card elevation="2" class="mb-2">
                      <v-card-title class="pb-2 d-flex justify-space-between align-center">
                        <span>Round {{ round.roundNumber }}</span>
                        <v-chip size="small" color="success">
                          {{ round.selectedTopics?.length || 0 }} topics
                        </v-chip>
                      </v-card-title>
                      <v-card-text class="pt-0">
                        <p class="text-caption text-grey mb-2">
                          {{ new Date(round.startTime).toLocaleString() }} - {{ round.duration }} minutes
                        </p>
                        <v-chip-group>
                          <v-chip
                            v-for="topic in (round.selectedTopics || []).slice(0, 3)"
                            :key="topic.topicId"
                            size="small"
                            variant="outlined"
                          >
                            {{ topic.title }}
                          </v-chip>
                          <v-chip
                            v-if="(round.selectedTopics || []).length > 3"
                            size="small"
                            variant="outlined"
                          >
                            +{{ (round.selectedTopics || []).length - 3 }} more
                          </v-chip>
                        </v-chip-group>
                      </v-card-text>
                    </v-card>
                  </v-timeline-item>
                </v-timeline>
                <v-alert v-else type="info" class="text-center">
                  No rounds completed yet. Start your first round to see history here!
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<style scoped>
.hover-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

.primary-action {
  border: 2px solid transparent;
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 1) 0%, rgba(var(--v-theme-success), 0.9) 100%) !important;
}

.primary-action:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2) !important;
}

.v-timeline-item {
  padding-bottom: 16px;
}

/* Enhanced Mobile Responsive Design */
@media (max-width: 1280px) {
  .hover-card:hover {
    transform: translateY(-2px);
  }
}

@media (max-width: 960px) {
  /* Container and Layout */
  .v-container {
    padding: 16px 12px !important;
  }
  
  /* Header Section */
  .text-h4 {
    font-size: 1.75rem !important;
  }
  
  .d-flex.justify-space-between {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start !important;
  }
  
  .d-flex.gap-2 {
    align-self: stretch;
    justify-content: space-between;
  }
  
  /* Tab Navigation */
  .v-tabs {
    margin-bottom: 1rem;
  }
  
  .v-tab {
    min-width: 100px !important;
    font-size: 0.875rem;
  }
  
  /* Overview Tab - Stats Cards */
  .text-h4 {
    font-size: 2rem !important;
  }
  
  .text-h5 {
    font-size: 1.25rem !important;
  }
  
  /* Control Center Tab - Action Cards */
  .primary-action {
    transform: none !important;
  }
  
  .primary-action:hover {
    transform: translateY(-2px) !important;
  }
  
  .hover-card {
    padding: 1.5rem !important;
  }
  
  .hover-card .v-icon {
    font-size: 48px !important;
  }
  
  .hover-card h3 {
    font-size: 1.1rem !important;
  }
  
  .hover-card p {
    font-size: 0.875rem !important;
  }
  
  /* Timeline and Activity */
  .v-timeline-item {
    padding-bottom: 12px;
  }
  
  /* Room Statistics */
  .text-h4 {
    font-size: 1.75rem !important;
  }
  
  /* Chart and Progress Elements */
  .v-progress-linear {
    height: 10px !important;
  }
}

@media (max-width: 600px) {
  /* Container */
  .v-container {
    padding: 12px 8px !important;
  }
  
  /* Header */
  .text-h4 {
    font-size: 1.5rem !important;
    line-height: 1.3 !important;
  }
  
  .text-body-1 {
    font-size: 0.875rem !important;
    margin-top: 0.25rem !important;
  }
  
  .d-flex.justify-space-between.align-center {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 1rem;
  }
  
  .d-flex.gap-2 {
    width: 100%;
    flex-direction: column;
    gap: 0.5rem !important;
  }
  
  .d-flex.gap-2 .v-btn {
    width: 100%;
    justify-content: center;
  }
  
  /* Alert Messages */
  .v-alert {
    font-size: 0.875rem;
    padding: 12px !important;
  }
  
  .v-alert-title {
    font-size: 1rem !important;
  }
  
  .v-list-item {
    padding: 8px 0 !important;
  }
  
  /* Tab Navigation Mobile */
  .v-tabs {
    margin-bottom: 0.75rem;
  }
  
  .v-tab {
    min-width: 85px !important;
    font-size: 0.8125rem;
    padding: 8px 4px !important;
  }
  
  .v-tab .v-icon {
    font-size: 16px;
    margin-right: 4px !important;
  }
  
  /* Overview Tab Mobile */
  .text-h5 {
    font-size: 1.125rem !important;
  }
  
  /* Active Round Card Mobile */
  .v-card-title.d-flex.align-center.justify-space-between {
    flex-direction: column;
    align-items: flex-start !important;
    gap: 1rem;
  }
  
  .v-card-title .text-center {
    align-self: center;
  }
  
  .v-card-text .v-row.align-center {
    flex-direction: column;
    gap: 1rem;
  }
  
  .v-card-text .v-col {
    width: 100% !important;
    max-width: 100% !important;
  }
  
  .v-card-text .text-center {
    width: 100%;
  }
  
  .v-card-text .d-flex.gap-4 {
    justify-content: space-around;
    flex-wrap: wrap;
    gap: 1rem !important;
  }
  
  /* Statistics Cards Mobile */
  .v-row .v-col {
    margin-bottom: 0.5rem;
  }
  
  .text-h4 {
    font-size: 1.5rem !important;
  }
  
  .text-caption {
    font-size: 0.75rem !important;
  }
  
  /* Control Center Mobile */
  .hover-card {
    padding: 1rem !important;
    text-align: center;
  }
  
  .hover-card .v-icon {
    font-size: 40px !important;
    margin-bottom: 0.75rem !important;
  }
  
  .hover-card h3 {
    font-size: 1rem !important;
    margin-bottom: 0.5rem !important;
  }
  
  .hover-card p {
    font-size: 0.8125rem !important;
    line-height: 1.3 !important;
  }
  
  .hover-card:hover {
    transform: none !important;
  }
  
  .primary-action:hover {
    transform: none !important;
  }
  
  /* Action Grid Mobile */
  .v-row .v-col {
    margin-bottom: 0.75rem;
  }
  
  /* Quick Actions Card Mobile */
  .v-card-text .v-btn {
    margin-bottom: 0.5rem !important;
    height: 44px !important;
    font-size: 0.875rem !important;
  }
  
  /* Top Topics Mobile */
  .v-list-item {
    padding: 8px 0 !important;
  }
  
  .v-list-item-title {
    font-size: 0.875rem !important;
    line-height: 1.3 !important;
  }
  
  .v-list-item-subtitle {
    font-size: 0.75rem !important;
  }
  
  .v-avatar {
    width: 28px !important;
    height: 28px !important;
    font-size: 0.75rem !important;
  }
  
  /* Timeline Mobile */
  .v-timeline {
    padding-left: 8px !important;
  }
  
  .v-timeline-item {
    padding-bottom: 12px !important;
  }
  
  .v-timeline-item .v-card {
    font-size: 0.875rem;
  }
  
  .v-timeline-item .v-card-title {
    font-size: 1rem !important;
    padding: 12px 12px 6px !important;
  }
  
  .v-timeline-item .v-card-text {
    padding: 6px 12px 12px !important;
    font-size: 0.8125rem;
  }
  
  .v-chip-group .v-chip {
    font-size: 0.6875rem !important;
    height: 20px !important;
  }
  
  /* Insights Tab Mobile */
  .text-h6 {
    font-size: 1rem !important;
  }
  
  .v-progress-linear {
    height: 6px !important;
  }
  
  /* Chips and Badges */
  .v-chip {
    font-size: 0.75rem !important;
    height: 24px !important;
  }
  
  .v-chip.small {
    font-size: 0.6875rem !important;
    height: 20px !important;
  }
  
  /* Progress and Loading Elements */
  .v-progress-circular {
    width: 48px !important;
    height: 48px !important;
  }
  
  /* Button Groups Mobile */
  .text-center .v-btn {
    margin: 0 0 0.5rem 0 !important;
    width: 100%;
  }
  
  .text-center .v-btn:last-child {
    margin-bottom: 0 !important;
  }
}

/* Ultra-small screens */
@media (max-width: 480px) {
  .v-container {
    padding: 8px !important;
  }
  
  .v-card {
    border-radius: 8px !important;
  }
  
  .text-h4 {
    font-size: 1.375rem !important;
  }
  
  .text-h5 {
    font-size: 1.125rem !important;
  }
  
  .hover-card {
    padding: 0.75rem !important;
  }
  
  .hover-card .v-icon {
    font-size: 36px !important;
  }
  
  .v-tabs .v-tab {
    min-width: 75px !important;
    font-size: 0.75rem;
    padding: 6px 2px !important;
  }
  
  .v-tab .v-icon {
    font-size: 14px;
  }
  
  /* Compact spacing for small screens */
  .v-card-title,
  .v-card-text,
  .v-card-actions {
    padding: 12px !important;
  }
  
  .mb-6 {
    margin-bottom: 1rem !important;
  }
  
  .mb-4 {
    margin-bottom: 0.75rem !important;
  }
}

/* Dark mode mobile optimizations */
@media (max-width: 600px) {
  .v-theme--dark .hover-card {
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .v-theme--dark .primary-action {
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
}
</style>
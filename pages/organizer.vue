<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { User } from '~/types/user'

definePageMeta({
  middleware: 'authenticated'
})

const { user } = useUserSession()
const { eventConfig } = useEventConfig()

// Check if user is admin
const isAdmin = computed(() => (user.value as User)?.role === 'Admin')
if (!isAdmin.value) {
  throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
}

// Dashboard data
const eventStats = ref({
  totalParticipants: 0,
  totalTopics: 0,
  totalVotes: 0,
  activeRound: null as any,
  recentActivity: [] as any[]
})

const quickActions = [
  {
    title: 'Start New Round',
    subtitle: 'Begin discussions with selected topics',
    icon: 'mdi-play-circle',
    color: 'success',
    to: '/admin/round-management',
    action: 'start-round'
  },
  {
    title: 'Live Voting Display',
    subtitle: 'Show real-time voting for participants',
    icon: 'mdi-monitor',
    color: 'primary',
    to: '/admin/voting-dashboard',
    action: 'display'
  },
  {
    title: 'Generate QR Code',
    subtitle: 'Create join code for easy access',
    icon: 'mdi-qrcode',
    color: 'secondary',
    action: 'qr-code'
  },
  {
    title: 'Export Data',
    subtitle: 'Download topics and participation data',
    icon: 'mdi-download',
    color: 'info',
    action: 'export'
  }
]

const checklistItems = ref([
  { id: 'setup', title: 'Complete initial event setup', completed: false, required: true },
  { id: 'rooms', title: 'Configure discussion rooms', completed: false, required: true },
  { id: 'qr', title: 'Generate participant QR code', completed: false, required: false },
  { id: 'test', title: 'Test participant joining process', completed: false, required: false },
  { id: 'announce', title: 'Announce event to participants', completed: false, required: false }
])

const eventPhases = [
  { name: 'Setup', status: 'completed', description: 'Event configuration and preparation' },
  { name: 'Registration', status: 'active', description: 'Participants joining and proposing topics' },
  { name: 'Voting', status: 'pending', description: 'Preference voting on proposed topics' },
  { name: 'Rounds', status: 'pending', description: 'Active discussion rounds' },
  { name: 'Wrap-up', status: 'pending', description: 'Event conclusion and feedback' }
]

// Methods
async function loadDashboardData() {
  try {
    // Load event statistics
    const topics = await $fetch('/api/topics')
    eventStats.value.totalTopics = topics.length
    eventStats.value.totalVotes = topics.reduce((sum: number, topic: any) => sum + (topic.totalPreferenceScore || 0), 0)
    
    // Load active round info
    const activeRound = await $fetch('/api/active-round')
    eventStats.value.activeRound = activeRound
    
    // Load checklist completion status
    await updateChecklistStatus()
    
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

async function updateChecklistStatus() {
  try {
    // Check setup completion
    const setupComplete = localStorage.getItem('organizer-setup-complete')
    checklistItems.value[0].completed = !!setupComplete
    
    // Check rooms configuration
    const rooms = await $fetch('/api/admin/rooms')
    checklistItems.value[1].completed = rooms.rooms && rooms.rooms.length > 0
    
    // Check QR code generation (could check if QR exists)
    // For now, assume it's done if setup is complete
    checklistItems.value[2].completed = !!setupComplete
    
  } catch (error) {
    console.error('Failed to update checklist:', error)
  }
}

function getPhaseColor(status: string) {
  switch (status) {
    case 'completed': return 'success'
    case 'active': return 'primary'
    case 'pending': return 'grey'
    default: return 'grey'
  }
}

function getPhaseIcon(status: string) {
  switch (status) {
    case 'completed': return 'mdi-check-circle'
    case 'active': return 'mdi-play-circle'
    case 'pending': return 'mdi-clock-outline'
    default: return 'mdi-circle-outline'
  }
}

async function handleQuickAction(action: string) {
  switch (action) {
    case 'qr-code':
      // Generate QR code logic
      try {
        await $fetch('/api/admin/generate-qr', {
          method: 'POST',
          body: {
            eventCode: 'DEMO2024', // Would get from settings
            eventName: eventConfig.title
          }
        })
        alert('QR Code generated successfully!')
      } catch (error) {
        alert('Failed to generate QR code')
      }
      break
    case 'export':
      // Export data logic
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
  }
}

const completedTasks = computed(() => checklistItems.value.filter(item => item.completed).length)
const totalTasks = computed(() => checklistItems.value.length)
const requiredTasks = computed(() => checklistItems.value.filter(item => item.required))
const completedRequired = computed(() => requiredTasks.value.filter(item => item.completed).length)

onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Organizer Dashboard</h1>
        <p class="text-body-1 text-grey-darken-1">
          Central hub for managing {{ eventConfig.title }}
        </p>
      </div>
      
      <v-btn
        color="success"
        prepend-icon="mdi-cog"
        to="/setup"
        v-if="completedRequired < requiredTasks.length"
      >
        Complete Setup
      </v-btn>
    </div>

    <!-- Event Status Overview -->
    <v-row class="mb-6">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-timeline</v-icon>
            Event Progress
          </v-card-title>
          <v-card-text>
            <div class="mb-4">
              <div v-for="(phase, index) in eventPhases" :key="phase.name" class="d-flex align-center mb-3">
                <v-icon 
                  :color="getPhaseColor(phase.status)" 
                  :icon="getPhaseIcon(phase.status)"
                  class="mr-3"
                ></v-icon>
                <div class="flex-grow-1">
                  <div class="font-weight-medium">{{ phase.name }}</div>
                  <div class="text-caption text-grey">{{ phase.description }}</div>
                </div>
                <v-chip 
                  :color="getPhaseColor(phase.status)" 
                  size="small" 
                  variant="flat"
                >
                  {{ phase.status }}
                </v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-chart-line</v-icon>
            Live Stats
          </v-card-title>
          <v-card-text>
            <div class="d-flex justify-space-between mb-3">
              <span>Topics</span>
              <strong>{{ eventStats.totalTopics }}</strong>
            </div>
            <div class="d-flex justify-space-between mb-3">
              <span>Total Votes</span>
              <strong>{{ eventStats.totalVotes }}</strong>
            </div>
            <div class="d-flex justify-space-between mb-3">
              <span>Participants</span>
              <strong>{{ eventStats.totalParticipants }}</strong>
            </div>
            <v-divider class="my-3"></v-divider>
            <div class="d-flex justify-space-between">
              <span>Active Round</span>
              <strong>{{ eventStats.activeRound?.isActive ? `Round ${eventStats.activeRound.roundNumber}` : 'None' }}</strong>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Setup Checklist -->
    <v-row class="mb-6" v-if="completedRequired < requiredTasks.length">
      <v-col cols="12">
        <v-card color="warning" variant="tonal">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-clipboard-check</v-icon>
            Setup Checklist
            <v-spacer></v-spacer>
            <v-chip color="warning" size="small">
              {{ completedTasks }}/{{ totalTasks }} completed
            </v-chip>
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item 
                v-for="item in checklistItems" 
                :key="item.id"
                class="px-0"
              >
                <template #prepend>
                  <v-icon 
                    :color="item.completed ? 'success' : (item.required ? 'warning' : 'grey')"
                    :icon="item.completed ? 'mdi-check-circle' : 'mdi-circle-outline'"
                  ></v-icon>
                </template>
                
                <v-list-item-title 
                  :class="{ 'text-decoration-line-through': item.completed }"
                >
                  {{ item.title }}
                  <v-chip v-if="item.required" size="x-small" color="error" class="ml-2">Required</v-chip>
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h2 class="text-h5 mb-4">Quick Actions</h2>
        <v-row>
          <v-col v-for="action in quickActions" :key="action.title" cols="12" sm="6" md="3">
            <v-card 
              class="text-center pa-4 hover-card"
              :color="action.color"
              variant="tonal"
              @click="action.to ? $router.push(action.to) : handleQuickAction(action.action)"
              style="cursor: pointer;"
            >
              <v-icon :icon="action.icon" size="48" :color="action.color" class="mb-3"></v-icon>
              <h3 class="text-h6 mb-2">{{ action.title }}</h3>
              <p class="text-body-2 text-grey-darken-1">{{ action.subtitle }}</p>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Management Links -->
    <v-row>
      <v-col cols="12">
        <h2 class="text-h5 mb-4">Event Management</h2>
        <v-row>
          <v-col cols="12" md="4">
            <v-card>
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" color="primary">mdi-cog</v-icon>
                Round Management
              </v-card-title>
              <v-card-text>
                Start new rounds, select topics, manage timing and participant assignments.
              </v-card-text>
              <v-card-actions>
                <v-btn color="primary" to="/admin/round-management">Manage Rounds</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
          
          <v-col cols="12" md="4">
            <v-card>
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" color="secondary">mdi-home-city</v-icon>
                Room Setup
              </v-card-title>
              <v-card-text>
                Configure discussion rooms, set capacities, and manage physical logistics.
              </v-card-text>
              <v-card-actions>
                <v-btn color="secondary" to="/admin/rooms">Manage Rooms</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
          
          <v-col cols="12" md="4">
            <v-card>
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" color="success">mdi-tune</v-icon>
                Event Settings
              </v-card-title>
              <v-card-text>
                Configure voting parameters, themes, and general event settings.
              </v-card-text>
              <v-card-actions>
                <v-btn color="success" to="/settings">Event Settings</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.hover-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.hover-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
</style>

<template>
  <v-container class="pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Platform Administration</h1>
        <p class="text-body-1 mt-2">Manage the entire unconference platform</p>
      </div>
      
      <div class="d-flex gap-2">
        <v-btn color="primary" prepend-icon="mdi-refresh" @click="loadDashboardData">
          Refresh
        </v-btn>
        <v-btn color="secondary" prepend-icon="mdi-calendar-multiple" to="/super-admin/events">
          All Events
        </v-btn>
        <v-btn color="secondary" prepend-icon="mdi-account-group" to="/super-admin/users">
          User Management
        </v-btn>
        <v-btn color="secondary" prepend-icon="mdi-cog" to="/super-admin/settings">
          Platform Settings
        </v-btn>
      </div>
    </div>

    <!-- Platform Statistics -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card color="primary" variant="elevated">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-calendar-multiple</v-icon>
            <div class="text-h4 font-weight-bold">{{ stats.totalEvents }}</div>
            <div class="text-body-2">Total Events</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="success" variant="elevated">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-calendar-check</v-icon>
            <div class="text-h4 font-weight-bold">{{ stats.activeEvents }}</div>
            <div class="text-body-2">Active Events</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="info" variant="elevated">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-account-group</v-icon>
            <div class="text-h4 font-weight-bold">{{ stats.totalUsers }}</div>
            <div class="text-body-2">Platform Users</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="warning" variant="elevated">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-account-star</v-icon>
            <div class="text-h4 font-weight-bold">{{ stats.totalOrganizers }}</div>
            <div class="text-body-2">Event Organizers</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Activity & Event Management -->
    <v-row>
      <!-- Recent Activity -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-clock-outline</v-icon>
            Recent Platform Activity
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item
                v-for="activity in recentActivity"
                :key="activity.id"
                :prepend-icon="getActivityIcon(activity.type)"
              >
                <v-list-item-title>{{ activity.description }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatDateTime(activity.timestamp) }} • {{ activity.eventName }}
                </v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item v-if="recentActivity.length === 0">
                <v-list-item-title class="text-grey">No recent activity</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Event Management -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-calendar-multiple</v-icon>
              Event Management
            </div>
            <v-btn size="small" color="primary" to="/super-admin/events">
              View All
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item
                v-for="event in recentEvents"
                :key="event.id"
                :to="`/super-admin/events/${event.id}`"
              >
                <template #prepend>
                  <v-avatar
                    :color="event.isActive ? 'success' : 'grey'"
                    size="small"
                  >
                    <v-icon size="16">
                      {{ event.isActive ? 'mdi-calendar-check' : 'mdi-calendar-clock' }}
                    </v-icon>
                  </v-avatar>
                </template>
                
                <v-list-item-title>{{ event.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ event.organizerName }} • {{ event.participantCount }} participants
                </v-list-item-subtitle>
                
                <template #append>
                  <v-menu>
                    <template #activator="{ props }">
                      <v-btn
                        icon="mdi-dots-vertical"
                        size="small"
                        variant="text"
                        v-bind="props"
                      />
                    </template>
                    
                    <v-list density="compact">
                      <v-list-item @click="viewEvent(event.id)">
                        <v-list-item-title>View Details</v-list-item-title>
                      </v-list-item>
                      <v-list-item 
                        v-if="event.isActive"
                        @click="suspendEvent(event.id)"
                        class="text-warning"
                      >
                        <v-list-item-title>Suspend Event</v-list-item-title>
                      </v-list-item>
                      <v-list-item 
                        v-else
                        @click="activateEvent(event.id)"
                        class="text-success"
                      >
                        <v-list-item-title>Activate Event</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- System Health & Analytics -->
    <v-row class="mt-6">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-chart-line</v-icon>
            Platform Analytics
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <div class="text-h6 mb-2">Events Created (Last 30 days)</div>
                <div class="text-h4 text-primary">{{ analytics.eventsLast30Days }}</div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-h6 mb-2">Active Users Today</div>
                <div class="text-h4 text-success">{{ analytics.activeUsersToday }}</div>
              </v-col>
            </v-row>
            
            <v-divider class="my-4" />
            
            <div class="text-h6 mb-3">Most Popular Features</div>
            <div class="d-flex flex-wrap gap-2">
              <v-chip
                v-for="feature in analytics.popularFeatures"
                :key="feature.name"
                :prepend-icon="feature.icon"
                :text="`${feature.name} (${feature.usage})`"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-server</v-icon>
            System Health
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon :color="systemHealth.server === 'healthy' ? 'success' : 'error'">
                    mdi-server
                  </v-icon>
                </template>
                <v-list-item-title>Server Status</v-list-item-title>
                <v-list-item-subtitle>{{ systemHealth.server }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template #prepend>
                  <v-icon :color="systemHealth.database === 'healthy' ? 'success' : 'error'">
                    mdi-database
                  </v-icon>
                </template>
                <v-list-item-title>Database</v-list-item-title>
                <v-list-item-subtitle>{{ systemHealth.database }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template #prepend>
                  <v-icon color="info">mdi-memory</v-icon>
                </template>
                <v-list-item-title>Memory Usage</v-list-item-title>
                <v-list-item-subtitle>{{ systemHealth.memoryUsage }}%</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'authenticated'
})

interface PlatformStats {
  totalEvents: number
  activeEvents: number
  totalUsers: number
  totalOrganizers: number
}

interface Activity {
  id: string
  type: 'event_created' | 'user_joined' | 'event_started' | 'event_ended'
  description: string
  eventName: string
  timestamp: string
}

interface Event {
  id: string
  name: string
  isActive: boolean
  organizerName: string
  participantCount: number
}

const { user } = useUserSession()

// Check if user is super admin
const isSuperAdmin = computed(() => (user.value as any)?.globalRole === 'SuperAdmin')
if (!isSuperAdmin.value) {
  throw createError({ statusCode: 403, statusMessage: 'Super Admin access required' })
}

// Data
const stats = ref<PlatformStats>({
  totalEvents: 0,
  activeEvents: 0,
  totalUsers: 0,
  totalOrganizers: 0
})

const recentActivity = ref<Activity[]>([])
const recentEvents = ref<Event[]>([])

const analytics = ref({
  eventsLast30Days: 0,
  activeUsersToday: 0,
  popularFeatures: [
    { name: 'Topic Voting', icon: 'mdi-vote', usage: '89%' },
    { name: 'Group Assignment', icon: 'mdi-account-group', usage: '76%' },
    { name: 'QR Code Join', icon: 'mdi-qrcode', usage: '65%' },
    { name: 'Live Dashboard', icon: 'mdi-monitor', usage: '54%' }
  ]
})

const systemHealth = ref({
  server: 'healthy',
  database: 'healthy',
  memoryUsage: 68
})

// Methods
async function loadDashboardData() {
  try {
    const response = await $fetch('/api/super-admin/dashboard') as any
    stats.value = response.stats || stats.value
    recentActivity.value = response.recentActivity || []
    recentEvents.value = response.recentEvents || []
    if (response.analytics) {
      analytics.value = { ...analytics.value, ...response.analytics }
    }
    systemHealth.value = response.systemHealth || systemHealth.value
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

function getActivityIcon(type: string) {
  const icons: Record<string, string> = {
    event_created: 'mdi-calendar-plus',
    user_joined: 'mdi-account-plus',
    event_started: 'mdi-play',
    event_ended: 'mdi-stop'
  }
  return icons[type] || 'mdi-information'
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString()
}

function viewEvent(eventId: string) {
  navigateTo(`/super-admin/events/${eventId}`)
}

async function suspendEvent(eventId: string) {
  const confirmed = confirm('Are you sure you want to suspend this event?')
  if (!confirmed) return
  
  try {
    await $fetch(`/api/super-admin/events/${eventId}/suspend`, {
      method: 'POST'
    })
    await loadDashboardData()
  } catch (error) {
    console.error('Failed to suspend event:', error)
    alert('Failed to suspend event')
  }
}

async function activateEvent(eventId: string) {
  try {
    await $fetch(`/api/super-admin/events/${eventId}/activate`, {
      method: 'POST'
    })
    await loadDashboardData()
  } catch (error) {
    console.error('Failed to activate event:', error)
    alert('Failed to activate event')
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<template>
  <v-container class="pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Super Admin Dashboard - Live API Demo</h1>
        <p class="text-body-1 mt-2">Real-time demonstration using live API data</p>
      </div>
      
      <div class="d-flex gap-2">
        <v-btn color="primary" prepend-icon="mdi-refresh" @click="loadDashboardData" :loading="loading">
          Refresh Data
        </v-btn>
        <v-btn color="secondary" prepend-icon="mdi-calendar-multiple" @click="showEventsDemo">
          Events Demo
        </v-btn>
        <v-btn color="info" prepend-icon="mdi-account-supervisor" @click="showUsersDemo">
          Users Demo
        </v-btn>
      </div>
    </div>

    <!-- Platform Statistics -->
    <v-row class="mb-6" v-if="dashboardData">
      <v-col cols="12" md="3">
        <v-card color="primary" variant="elevated">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-calendar-multiple</v-icon>
            <div class="text-h4 font-weight-bold">{{ dashboardData.stats?.totalEvents || 0 }}</div>
            <div class="text-body-2">Total Events</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="success" variant="elevated">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-calendar-check</v-icon>
            <div class="text-h4 font-weight-bold">{{ dashboardData.stats?.activeEvents || 0 }}</div>
            <div class="text-body-2">Active Events</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="info" variant="elevated">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-account-group</v-icon>
            <div class="text-h4 font-weight-bold">{{ dashboardData.stats?.totalUsers || 0 }}</div>
            <div class="text-body-2">Platform Users</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="warning" variant="elevated">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-account-star</v-icon>
            <div class="text-h4 font-weight-bold">{{ dashboardData.stats?.totalOrganizers || 0 }}</div>
            <div class="text-body-2">Event Organizers</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Activity & Events -->
    <v-row v-if="dashboardData">
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
                v-for="activity in dashboardData.recentActivity"
                :key="activity.id"
                :prepend-icon="getActivityIcon(activity.type)"
              >
                <v-list-item-title>{{ activity.description }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ formatDateTime(activity.timestamp) }} • {{ activity.eventName }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Recent Events -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-calendar-multiple</v-icon>
              Recent Events
            </div>
            <v-btn size="small" color="primary" @click="showEventsDemo">
              View All
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item
                v-for="event in dashboardData.recentEvents"
                :key="event.id"
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
                  <v-chip
                    :color="event.isActive ? 'success' : 'warning'"
                    :text="event.isActive ? 'Active' : 'Inactive'"
                    size="small"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- System Health & Analytics -->
    <v-row class="mt-6" v-if="dashboardData">
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
                <div class="text-h4 text-primary">{{ dashboardData.analytics?.eventsLast30Days || 0 }}</div>
              </v-col>
              <v-col cols="12" md="6">
                <div class="text-h6 mb-2">Active Users Today</div>
                <div class="text-h4 text-success">{{ dashboardData.analytics?.activeUsersToday || 0 }}</div>
              </v-col>
            </v-row>
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
                  <v-icon :color="dashboardData.systemHealth?.server === 'healthy' ? 'success' : 'error'">
                    mdi-server
                  </v-icon>
                </template>
                <v-list-item-title>Server Status</v-list-item-title>
                <v-list-item-subtitle>{{ dashboardData.systemHealth?.server || 'Unknown' }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template #prepend>
                  <v-icon :color="dashboardData.systemHealth?.database === 'healthy' ? 'success' : 'error'">
                    mdi-database
                  </v-icon>
                </template>
                <v-list-item-title>Database</v-list-item-title>
                <v-list-item-subtitle>{{ dashboardData.systemHealth?.database || 'Unknown' }}</v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item>
                <template #prepend>
                  <v-icon color="info">mdi-memory</v-icon>
                </template>
                <v-list-item-title>Memory Usage</v-list-item-title>
                <v-list-item-subtitle>{{ dashboardData.systemHealth?.memoryUsage || 0 }}%</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Demo Modal -->
    <v-dialog v-model="showDemo" max-width="1200">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ demoTitle }}</span>
          <v-btn icon="mdi-close" variant="text" @click="closeDemo" />
        </v-card-title>
        <v-card-text>
          <div v-if="demoType === 'events'">
            <v-alert type="info" class="mb-4">
              This demonstrates the Events Management interface where super admins can view, manage, suspend, and delete all events across the platform.
            </v-alert>
            <v-data-table
              :headers="eventHeaders"
              :items="dashboardData?.recentEvents || []"
              class="elevation-1"
            >
              <template #item.isActive="{ item }">
                <v-chip
                  :color="item.isActive ? 'success' : 'warning'"
                  :text="item.isActive ? 'Active' : 'Inactive'"
                  size="small"
                />
              </template>
              <template #item.actions="{ item }">
                <v-btn icon="mdi-eye" size="small" variant="text" title="View Details" />
                <v-btn 
                  :icon="item.isActive ? 'mdi-pause' : 'mdi-play'" 
                  :color="item.isActive ? 'warning' : 'success'"
                  size="small" 
                  variant="text" 
                  :title="item.isActive ? 'Suspend' : 'Activate'"
                />
                <v-btn icon="mdi-delete" color="error" size="small" variant="text" title="Delete" />
              </template>
            </v-data-table>
          </div>
          
          <div v-if="demoType === 'users'">
            <v-alert type="info" class="mb-4">
              This demonstrates the User Management interface where super admins can manage user roles, suspend accounts, and invite new users.
            </v-alert>
            <v-data-table
              :headers="userHeaders"
              :items="mockUsers"
              class="elevation-1"
            >
              <template #item.globalRole="{ item }">
                <v-chip
                  :color="item.globalRole === 'SuperAdmin' ? 'error' : 'primary'"
                  :text="item.globalRole"
                  size="small"
                />
              </template>
              <template #item.isActive="{ item }">
                <v-chip
                  :color="item.isActive ? 'success' : 'error'"
                  :text="item.isActive ? 'Active' : 'Suspended'"
                  size="small"
                />
              </template>
              <template #item.actions="{ item }">
                <v-btn icon="mdi-eye" size="small" variant="text" title="View Details" />
                <v-btn icon="mdi-account-cog" size="small" variant="text" title="Manage Roles" />
                <v-btn icon="mdi-account-off" size="small" variant="text" color="warning" title="Suspend/Activate" />
              </template>
            </v-data-table>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Loading Overlay -->
    <v-overlay v-model="loading" class="align-center justify-center">
      <v-progress-circular indeterminate size="64" />
    </v-overlay>
  </v-container>
</template>

<script setup lang="ts">
// No authentication middleware - this is a demo page

const loading = ref(false)
const dashboardData = ref<any>(null)
const showDemo = ref(false)
const demoType = ref('')
const demoTitle = ref('')

const mockUsers = ref([
  {
    id: 'super-admin-001',
    name: 'Super Admin',
    email: 'superadmin@unconference.com',
    globalRole: 'SuperAdmin',
    isActive: true,
    eventCount: 0,
    lastLoginAt: '2024-08-27'
  },
  {
    id: 'admin-001',
    name: 'Darth Vader',
    email: 'darth.vader@starwars.com',
    globalRole: 'User',
    isActive: true,
    eventCount: 1,
    lastLoginAt: '2024-08-27'
  },
  {
    id: 'organizer-001',
    name: 'Luke Skywalker',
    email: 'organizer@example.com',
    globalRole: 'User',
    isActive: true,
    eventCount: 2,
    lastLoginAt: '2024-08-27'
  }
])

const eventHeaders = [
  { title: 'Event Name', key: 'name' },
  { title: 'Code', key: 'code' },
  { title: 'Organizer', key: 'organizerName' },
  { title: 'Status', key: 'isActive' },
  { title: 'Participants', key: 'participantCount' },
  { title: 'Actions', key: 'actions', sortable: false }
]

const userHeaders = [
  { title: 'Name', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Global Role', key: 'globalRole' },
  { title: 'Status', key: 'isActive' },
  { title: 'Events', key: 'eventCount' },
  { title: 'Last Login', key: 'lastLoginAt' },
  { title: 'Actions', key: 'actions', sortable: false }
]

async function loadDashboardData() {
  loading.value = true
  try {
    const response = await $fetch('/api/test/dashboard')
    dashboardData.value = response
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
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

function showEventsDemo() {
  demoType.value = 'events'
  demoTitle.value = 'Events Management Demo'
  showDemo.value = true
}

function showUsersDemo() {
  demoType.value = 'users'
  demoTitle.value = 'User Management Demo'
  showDemo.value = true
}

function closeDemo() {
  showDemo.value = false
}

// Load data on component mount
onMounted(() => {
  loadDashboardData()
})
</script>

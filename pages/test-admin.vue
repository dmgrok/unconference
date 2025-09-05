<template>
  <v-container class="pa-6">
    <div class="text-center mb-6">
      <h1 class="text-h3 font-weight-bold mb-4">Super Admin UI Demo</h1>
      <p class="text-h6 text-grey-darken-1">
        Interactive demonstration of the Super Admin interface
      </p>
    </div>
    
    <!-- Mock Platform Statistics -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card color="primary" variant="elevated">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-calendar-multiple</v-icon>
            <div class="text-h4 font-weight-bold">{{ mockStats.totalEvents }}</div>
            <div class="text-body-2">Total Events</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="success" variant="elevated">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-calendar-check</v-icon>
            <div class="text-h4 font-weight-bold">{{ mockStats.activeEvents }}</div>
            <div class="text-body-2">Active Events</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="info" variant="elevated">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-account-group</v-icon>
            <div class="text-h4 font-weight-bold">{{ mockStats.totalUsers }}</div>
            <div class="text-body-2">Platform Users</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="warning" variant="elevated">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-account-star</v-icon>
            <div class="text-h4 font-weight-bold">{{ mockStats.totalOrganizers }}</div>
            <div class="text-body-2">Event Organizers</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Demo Navigation -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card>
          <v-card-title>Super Admin Features Demo</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="3">
                <v-btn 
                  block 
                  color="primary" 
                  size="large"
                  prepend-icon="mdi-view-dashboard"
                  @click="showDashboard"
                >
                  Dashboard
                </v-btn>
              </v-col>
              <v-col cols="12" md="3">
                <v-btn 
                  block 
                  color="secondary" 
                  size="large"
                  prepend-icon="mdi-calendar-multiple"
                  @click="showEvents"
                >
                  Events
                </v-btn>
              </v-col>
              <v-col cols="12" md="3">
                <v-btn 
                  block 
                  color="info" 
                  size="large"
                  prepend-icon="mdi-account-supervisor"
                  @click="showUsers"
                >
                  Users
                </v-btn>
              </v-col>
              <v-col cols="12" md="3">
                <v-btn 
                  block 
                  color="warning" 
                  size="large"
                  prepend-icon="mdi-cog"
                  @click="showSettings"
                >
                  Settings
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Demo Content Area -->
    <v-row v-if="activeDemo">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center justify-space-between">
            <span>{{ activeDemo.title }}</span>
            <v-btn icon="mdi-close" variant="text" @click="closeDemo" />
          </v-card-title>
          
          <v-card-text>
            <!-- Dashboard Demo -->
            <div v-if="activeDemo.type === 'dashboard'">
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="outlined">
                    <v-card-title>Recent Platform Activity</v-card-title>
                    <v-card-text>
                      <v-list density="compact">
                        <v-list-item
                          v-for="activity in mockActivity"
                          :key="activity.id"
                          :prepend-icon="activity.icon"
                        >
                          <v-list-item-title>{{ activity.description }}</v-list-item-title>
                          <v-list-item-subtitle>{{ activity.timestamp }}</v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card variant="outlined">
                    <v-card-title>System Health</v-card-title>
                    <v-card-text>
                      <v-list density="compact">
                        <v-list-item prepend-icon="mdi-server" title="Server Status" subtitle="Healthy" />
                        <v-list-item prepend-icon="mdi-database" title="Database" subtitle="Healthy" />
                        <v-list-item prepend-icon="mdi-memory" title="Memory Usage" subtitle="68%" />
                      </v-list>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>

            <!-- Events Demo -->
            <div v-if="activeDemo.type === 'events'">
              <v-data-table
                :headers="eventHeaders"
                :items="mockEvents"
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
                  <v-btn icon="mdi-eye" size="small" variant="text" />
                  <v-btn icon="mdi-pencil" size="small" variant="text" />
                  <v-btn icon="mdi-delete" size="small" variant="text" color="error" />
                </template>
              </v-data-table>
            </div>

            <!-- Users Demo -->
            <div v-if="activeDemo.type === 'users'">
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
                  <v-btn icon="mdi-eye" size="small" variant="text" />
                  <v-btn icon="mdi-account-cog" size="small" variant="text" />
                  <v-btn icon="mdi-account-off" size="small" variant="text" color="warning" />
                </template>
              </v-data-table>
            </div>

            <!-- Settings Demo -->
            <div v-if="activeDemo.type === 'settings'">
              <v-row>
                <v-col cols="12" md="6">
                  <v-card variant="outlined">
                    <v-card-title>General Settings</v-card-title>
                    <v-card-text>
                      <v-text-field
                        label="Platform Name"
                        value="Unconference Platform"
                        variant="outlined"
                        readonly
                      />
                      <v-text-field
                        label="Support Email"
                        value="support@unconference.com"
                        variant="outlined"
                        readonly
                      />
                      <v-text-field
                        label="Max Events per Organizer"
                        value="10"
                        variant="outlined"
                        readonly
                      />
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card variant="outlined">
                    <v-card-title>Feature Flags</v-card-title>
                    <v-card-text>
                      <v-switch
                        label="Multi-Event Support"
                        model-value="true"
                        readonly
                      />
                      <v-switch
                        label="QR Code Joining"
                        model-value="true"
                        readonly
                      />
                      <v-switch
                        label="Real-time Updates"
                        model-value="true"
                        readonly
                      />
                      <v-switch
                        label="Analytics Dashboard"
                        model-value="true"
                        readonly
                      />
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
// No authentication required for this demo page

const activeDemo = ref<{ type: string; title: string } | null>(null)

const mockStats = ref({
  totalEvents: 12,
  activeEvents: 8,
  totalUsers: 156,
  totalOrganizers: 23
})

const mockActivity = ref([
  {
    id: '1',
    icon: 'mdi-calendar-plus',
    description: 'New event created: Tech Innovation Summit',
    timestamp: '2 hours ago'
  },
  {
    id: '2',
    icon: 'mdi-account-plus',
    description: 'New user registered: jane.doe@example.com',
    timestamp: '4 hours ago'
  },
  {
    id: '3',
    icon: 'mdi-play',
    description: 'Event started: Startup Founders Unconference',
    timestamp: '6 hours ago'
  }
])

const mockEvents = ref([
  {
    id: 'event-001',
    name: 'Demo Unconference 2024',
    code: 'DEMO24',
    organizerName: 'Luke Skywalker',
    isActive: true,
    participantCount: 45,
    createdAt: '2024-08-20'
  },
  {
    id: 'event-002',
    name: 'Tech Innovation Unconference 2025',
    code: 'TECH25',
    organizerName: 'Darth Vader',
    isActive: false,
    participantCount: 32,
    createdAt: '2024-08-15'
  },
  {
    id: 'event-003',
    name: 'Startup Founders Unconference',
    code: 'STARTUP',
    organizerName: 'Luke Skywalker',
    isActive: true,
    participantCount: 67,
    createdAt: '2024-08-01'
  }
])

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
  { title: 'Created', key: 'createdAt' },
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

function showDashboard() {
  activeDemo.value = { type: 'dashboard', title: 'Super Admin Dashboard' }
}

function showEvents() {
  activeDemo.value = { type: 'events', title: 'Event Management' }
}

function showUsers() {
  activeDemo.value = { type: 'users', title: 'User Management' }
}

function showSettings() {
  activeDemo.value = { type: 'settings', title: 'Platform Settings' }
}

function closeDemo() {
  activeDemo.value = null
}
</script>

<template>
  <v-container class="pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Platform Event Management</h1>
        <p class="text-body-1 mt-2">Comprehensive oversight and management of all events across the platform</p>
      </div>
      
      <div class="d-flex gap-2">
        <v-btn color="primary" prepend-icon="mdi-refresh" @click="loadEvents">
          Refresh
        </v-btn>
        <v-btn color="secondary" prepend-icon="mdi-arrow-left" to="/super-admin/dashboard">
          Back to Dashboard
        </v-btn>
      </div>
    </div>

    <!-- Filters -->
    <v-row class="mb-4">
      <v-col cols="12" md="4">
        <v-text-field
          v-model="search"
          label="Search events"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          clearable
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          label="Status Filter"
          variant="outlined"
          density="compact"
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-select
          v-model="dateFilter"
          :items="dateOptions"
          label="Date Range"
          variant="outlined"
          density="compact"
        />
      </v-col>
    </v-row>

    <!-- Events Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="filteredEvents"
        :loading="loading"
        :search="search"
        item-value="id"
      >
        <template #item.isActive="{ item }">
          <v-chip
            :color="item.isActive ? 'success' : 'warning'"
            :text="item.isActive ? 'Active' : 'Inactive'"
            size="small"
          />
        </template>
        
        <template #item.participantCount="{ item }">
          <div class="d-flex align-center">
            <v-icon size="16" class="mr-1">mdi-account-group</v-icon>
            {{ item.participantCount }}
          </div>
        </template>
        
        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
        
        <template #item.actions="{ item }">
          <div class="d-flex gap-1">
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              @click="viewEvent(item)"
              title="View Details"
            />
            <v-btn
              :icon="item.isActive ? 'mdi-pause' : 'mdi-play'"
              :color="item.isActive ? 'warning' : 'success'"
              size="small"
              variant="text"
              @click="toggleEventStatus(item)"
              :title="item.isActive ? 'Suspend Event' : 'Activate Event'"
            />
            <v-btn
              icon="mdi-delete"
              color="error"
              size="small"
              variant="text"
              @click="deleteEvent(item)"
              title="Delete Event"
            />
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Event Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="800">
      <v-card v-if="selectedEvent">
        <v-card-title class="d-flex align-center justify-space-between">
          <span>{{ selectedEvent.name }}</span>
          <v-btn icon="mdi-close" variant="text" @click="detailsDialog = false" />
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <div class="mb-4">
                <strong>Event ID:</strong> {{ selectedEvent.id }}
              </div>
              <div class="mb-4">
                <strong>Event Code:</strong> {{ selectedEvent.code }}
              </div>
              <div class="mb-4">
                <strong>Organizer:</strong> {{ selectedEvent.organizerName }}
              </div>
              <div class="mb-4">
                <strong>Status:</strong>
                <v-chip
                  :color="selectedEvent.isActive ? 'success' : 'warning'"
                  :text="selectedEvent.isActive ? 'Active' : 'Inactive'"
                  size="small"
                  class="ml-2"
                />
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="mb-4">
                <strong>Participants:</strong> {{ selectedEvent.participantCount }}
              </div>
              <div class="mb-4">
                <strong>Created:</strong> {{ formatDateTime(selectedEvent.createdAt) }}
              </div>
              <div class="mb-4">
                <strong>Last Updated:</strong> {{ formatDateTime(selectedEvent.updatedAt) }}
              </div>
              <div class="mb-4">
                <strong>Location:</strong> {{ selectedEvent.location || 'Not specified' }}
              </div>
            </v-col>
          </v-row>
          
          <v-divider class="my-4" />
          
          <div class="mb-4">
            <strong>Description:</strong>
            <p class="mt-2">{{ selectedEvent.description || 'No description provided' }}</p>
          </div>
          
          <!-- Event Statistics -->
          <div class="mb-4">
            <strong>Statistics:</strong>
            <v-row class="mt-2">
              <v-col cols="6" md="3">
                <v-card variant="outlined">
                  <v-card-text class="text-center">
                    <div class="text-h6">{{ selectedEvent.organizerCount || 0 }}</div>
                    <div class="text-caption">Organizers</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" md="3">
                <v-card variant="outlined">
                  <v-card-text class="text-center">
                    <div class="text-h6">{{ selectedEvent.moderatorCount || 0 }}</div>
                    <div class="text-caption">Moderators</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" md="3">
                <v-card variant="outlined">
                  <v-card-text class="text-center">
                    <div class="text-h6">{{ selectedEvent.participantCount || 0 }}</div>
                    <div class="text-caption">Participants</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" md="3">
                <v-card variant="outlined">
                  <v-card-text class="text-center">
                    <div class="text-h6">{{ selectedEvent.topicCount || 0 }}</div>
                    <div class="text-caption">Topics</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn
            :color="selectedEvent.isActive ? 'warning' : 'success'"
            :text="selectedEvent.isActive ? 'Suspend Event' : 'Activate Event'"
            @click="toggleEventStatus(selectedEvent)"
          />
          <v-btn color="primary" text="View Event" @click="navigateToEvent(selectedEvent)" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'authenticated'
})

interface Event {
  id: string
  code: string
  name: string
  description?: string
  organizerId: string
  organizerName: string
  location?: string
  isActive: boolean
  participantCount: number
  organizerCount?: number
  moderatorCount?: number
  topicCount?: number
  createdAt: string
  updatedAt: string
}

const { user } = useUserSession()
const route = useRoute()

// Check if user is super admin
const isSuperAdmin = computed(() => (user.value as any)?.globalRole === 'SuperAdmin')
if (!isSuperAdmin.value) {
  throw createError({ statusCode: 403, statusMessage: 'Super Admin access required' })
}

// Data
const loading = ref(false)
const events = ref<Event[]>([])
const search = ref('')
const statusFilter = ref('all')
const dateFilter = ref('all')
const detailsDialog = ref(false)
const selectedEvent = ref<Event | null>(null)

const statusOptions = [
  { title: 'All Events', value: 'all' },
  { title: 'Active Only', value: 'active' },
  { title: 'Inactive Only', value: 'inactive' }
]

const dateOptions = [
  { title: 'All Time', value: 'all' },
  { title: 'Last 7 Days', value: '7d' },
  { title: 'Last 30 Days', value: '30d' },
  { title: 'Last 90 Days', value: '90d' }
]

const headers = [
  { title: 'Event Name', key: 'name', sortable: true },
  { title: 'Code', key: 'code', sortable: true },
  { title: 'Organizer', key: 'organizerName', sortable: true },
  { title: 'Status', key: 'isActive', sortable: true },
  { title: 'Participants', key: 'participantCount', sortable: true },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Computed
const filteredEvents = computed(() => {
  let filtered = events.value

  // Status filter
  if (statusFilter.value === 'active') {
    filtered = filtered.filter(event => event.isActive)
  } else if (statusFilter.value === 'inactive') {
    filtered = filtered.filter(event => !event.isActive)
  }

  // Date filter
  if (dateFilter.value !== 'all') {
    const days = parseInt(dateFilter.value)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    filtered = filtered.filter(event => new Date(event.createdAt) > cutoffDate)
  }

  return filtered
})

// Methods
async function loadEvents() {
  loading.value = true
  try {
    const response = await $fetch('/api/super-admin/events') as any
    events.value = response.events || []
  } catch (error) {
    console.error('Failed to load events:', error)
  } finally {
    loading.value = false
  }
}

function viewEvent(event: Event) {
  selectedEvent.value = event
  detailsDialog.value = true
}

async function toggleEventStatus(event: Event) {
  const action = event.isActive ? 'suspend' : 'activate'
  const confirmed = confirm(`Are you sure you want to ${action} this event?`)
  if (!confirmed) return

  try {
    await $fetch(`/api/super-admin/events/${event.id}/${action}`, {
      method: 'POST'
    })
    await loadEvents()
    if (selectedEvent.value?.id === event.id) {
      selectedEvent.value = events.value.find(e => e.id === event.id) || null
    }
  } catch (error) {
    console.error(`Failed to ${action} event:`, error)
    alert(`Failed to ${action} event`)
  }
}

async function deleteEvent(event: Event) {
  const confirmed = confirm(`Are you sure you want to permanently delete "${event.name}"? This action cannot be undone.`)
  if (!confirmed) return

  try {
    await $fetch(`/api/super-admin/events/${event.id}`, {
      method: 'DELETE'
    })
    await loadEvents()
    if (selectedEvent.value?.id === event.id) {
      detailsDialog.value = false
      selectedEvent.value = null
    }
  } catch (error) {
    console.error('Failed to delete event:', error)
    alert('Failed to delete event')
  }
}

async function navigateToEvent(event: Event) {
  console.log('Navigating to event:', event.id)
  
  try {
    // Close current dialog
    detailsDialog.value = false
    
    // Navigate with query parameter to show event details
    await navigateTo(`/super-admin/events?eventId=${event.id}`)
  } catch (error) {
    console.error('Navigation failed:', error)
    alert('Failed to navigate to event details: ' + error)
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString()
}

onMounted(async () => {
  await loadEvents()
  
  // Check if eventId is in query parameters
  const eventId = route.query.eventId as string
  if (eventId) {
    const event = events.value.find(e => e.id === eventId)
    if (event) {
      viewEvent(event)
    }
  }
})
</script>

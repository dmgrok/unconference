<template>
  <v-container class="pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Event Details</h1>
        <p class="text-body-1 mt-2" v-if="event">{{ event.name }}</p>
      </div>
      
      <div class="d-flex gap-2">
        <v-btn color="primary" prepend-icon="mdi-refresh" @click="loadEvent">
          Refresh
        </v-btn>
        <v-btn color="secondary" prepend-icon="mdi-arrow-left" to="/admin/events">
          Back to All Events
        </v-btn>
      </div>
    </div>

    <v-row v-if="loading">
      <v-col cols="12">
        <v-card>
          <v-card-text class="text-center">
            <v-progress-circular indeterminate color="primary" />
            <div class="mt-2">Loading event details...</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <div v-else-if="event">
      <!-- Event Information -->
      <v-row class="mb-6">
        <v-col cols="12" md="8">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-calendar</v-icon>
              Event Information
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <div class="mb-3">
                    <strong>Event Code:</strong> {{ event.code }}
                  </div>
                  <div class="mb-3">
                    <strong>Location:</strong> {{ event.location || 'Not specified' }}
                  </div>
                  <div class="mb-3">
                    <strong>Organizer:</strong> {{ event.organizerName }}
                  </div>
                  <div class="mb-3">
                    <strong>Status:</strong>
                    <v-chip
                      :color="event.isActive ? 'success' : 'error'"
                      :text="event.isActive ? 'Active' : 'Inactive'"
                      size="small"
                      class="ml-2"
                    />
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="mb-3">
                    <strong>Start Date:</strong> {{ formatDateTime(event.startDate) }}
                  </div>
                  <div class="mb-3">
                    <strong>End Date:</strong> {{ formatDateTime(event.endDate) }}
                  </div>
                  <div class="mb-3">
                    <strong>Created:</strong> {{ formatDateTime(event.createdAt) }}
                  </div>
                  <div class="mb-3">
                    <strong>Participants:</strong> {{ event.participantCount || 0 }}
                  </div>
                </v-col>
              </v-row>
              
              <v-divider class="my-4" />
              
              <div class="mb-3">
                <strong>Description:</strong>
                <div class="mt-1">{{ event.description || 'No description provided' }}</div>
              </div>
            </v-card-text>
            
            <v-card-actions>
              <v-btn
                v-if="event.isActive"
                color="warning"
                prepend-icon="mdi-pause"
                @click="suspendEvent"
              >
                Suspend Event
              </v-btn>
              <v-btn
                v-else
                color="success"
                prepend-icon="mdi-play"
                @click="activateEvent"
              >
                Activate Event
              </v-btn>
              
              <v-btn
                color="error"
                prepend-icon="mdi-delete"
                @click="confirmDelete = true"
              >
                Delete Event
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-chart-pie</v-icon>
              Quick Stats
            </v-card-title>
            <v-card-text>
              <v-list density="compact">
                <v-list-item>
                  <template #prepend>
                    <v-icon color="primary">mdi-account-group</v-icon>
                  </template>
                  <v-list-item-title>Total Participants</v-list-item-title>
                  <v-list-item-subtitle>{{ event.participantCount || 0 }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template #prepend>
                    <v-icon color="success">mdi-account-star</v-icon>
                  </template>
                  <v-list-item-title>Organizers</v-list-item-title>
                  <v-list-item-subtitle>{{ event.organizerCount || 1 }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template #prepend>
                    <v-icon color="info">mdi-account-tie</v-icon>
                  </template>
                  <v-list-item-title>Moderators</v-list-item-title>
                  <v-list-item-subtitle>{{ event.moderatorCount || 0 }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Event Activity -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-history</v-icon>
              Recent Activity
            </v-card-title>
            <v-card-text>
              <v-list v-if="activities.length > 0" density="compact">
                <v-list-item
                  v-for="activity in activities"
                  :key="activity.id"
                  :prepend-icon="getActivityIcon(activity.type)"
                >
                  <v-list-item-title>{{ activity.description }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatDateTime(activity.timestamp) }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
              
              <div v-else class="text-center text-grey py-4">
                No recent activity for this event
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <v-row v-else>
      <v-col cols="12">
        <v-card>
          <v-card-text class="text-center">
            <v-icon size="48" color="error">mdi-alert-circle</v-icon>
            <div class="text-h6 mt-2">Event Not Found</div>
            <div class="text-body-2">The requested event could not be found.</div>
            <v-btn color="primary" class="mt-4" to="/admin/events">
              Return to Events List
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="confirmDelete" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Confirm Deletion</v-card-title>
        <v-card-text>
          Are you sure you want to delete this event? This action cannot be undone and will remove all associated data.
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancel" @click="confirmDelete = false" />
          <v-btn color="error" text="Delete" @click="deleteEvent" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

interface Event {
  id: string
  code: string
  name: string
  description?: string
  organizerId: string
  organizerName: string
  location?: string
  startDate: string
  endDate: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  participantCount?: number
  organizerCount?: number
  moderatorCount?: number
}

interface Activity {
  id: string
  type: string
  description: string
  timestamp: string
}

const route = useRoute()
const { user } = useUserSession()

// Check if user is super admin
const isAdmin = computed(() => (user.value as any)?.globalRole === 'Admin')
if (!isAdmin.value) {
  throw createError({ statusCode: 403, statusMessage: 'Super Admin access required' })
}

// Data
const loading = ref(true)
const event = ref<Event | null>(null)
const activities = ref<Activity[]>([])
const confirmDelete = ref(false)

const eventId = computed(() => route.params.eventId as string)

// Methods
async function loadEvent() {
  loading.value = true
  try {
    const response = await $fetch(`/api/admin/events/${eventId.value}`) as any
    event.value = response.event
    activities.value = response.activities || []
  } catch (error) {
    console.error('Failed to load event:', error)
    event.value = null
  } finally {
    loading.value = false
  }
}

async function suspendEvent() {
  const confirmed = confirm('Are you sure you want to suspend this event?')
  if (!confirmed) return
  
  try {
    await $fetch(`/api/admin/events/${eventId.value}/suspend`, {
      method: 'POST'
    })
    await loadEvent()
  } catch (error) {
    console.error('Failed to suspend event:', error)
    alert('Failed to suspend event')
  }
}

async function activateEvent() {
  try {
    await $fetch(`/api/admin/events/${eventId.value}/activate`, {
      method: 'POST'
    })
    await loadEvent()
  } catch (error) {
    console.error('Failed to activate event:', error)
    alert('Failed to activate event')
  }
}

async function deleteEvent() {
  try {
    await $fetch(`/api/admin/events/${eventId.value}`, {
      method: 'DELETE'
    })
    confirmDelete.value = false
    navigateTo('/admin/events')
  } catch (error) {
    console.error('Failed to delete event:', error)
    alert('Failed to delete event')
  }
}

function getActivityIcon(type: string) {
  const icons: Record<string, string> = {
    event_created: 'mdi-calendar-plus',
    user_joined: 'mdi-account-plus',
    event_started: 'mdi-play',
    event_ended: 'mdi-stop',
    event_suspended: 'mdi-pause',
    event_activated: 'mdi-play'
  }
  return icons[type] || 'mdi-information'
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString()
}

onMounted(() => {
  loadEvent()
})
</script>

<template>
  <div class="event-detail-page">
    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center align-center py-12">
      <v-progress-circular indeterminate color="primary" size="64" />
      <span class="ml-4 text-h6">Loading event details...</span>
    </div>

    <!-- Error State -->
    <v-alert v-else-if="error" type="error" class="ma-4" variant="outlined">
      {{ error }}
      <v-btn color="error" variant="text" class="mt-2" @click="navigateTo('/events')">
        Back to Events
      </v-btn>
    </v-alert>

    <!-- Event Details -->
    <div v-else-if="event" class="pa-4">
      <v-container>
        <!-- Header -->
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h1 class="text-h3 font-weight-bold mb-2">{{ event.name }}</h1>
            <div class="d-flex align-center gap-2 mb-2">
              <v-chip
                :color="event.isActive ? 'success' : 'warning'"
                size="small"
                variant="tonal"
              >
                <v-icon start size="14">
                  {{ event.isActive ? 'mdi-calendar-check' : 'mdi-calendar-clock' }}
                </v-icon>
                {{ event.isActive ? 'Active' : 'Inactive' }}
              </v-chip>
              <v-chip size="small" variant="outlined">
                Code: {{ event.code }}
              </v-chip>
            </div>
            <p class="text-body-1 text-medium-emphasis">{{ event.description || 'No description provided' }}</p>
          </div>
          <v-btn
            color="primary"
            size="large"
            prepend-icon="mdi-arrow-left"
            variant="outlined"
            @click="navigateTo('/events')"
          >
            Back to Events
          </v-btn>
        </div>

        <!-- Action Buttons -->
        <v-row class="mb-6">
          <v-col cols="12">
            <div class="d-flex gap-3 flex-wrap">
              <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-vote"
                @click="navigateTo('/voting')"
              >
                Voting & Topics
              </v-btn>
              
              <v-btn
                color="secondary"
                size="large"
                prepend-icon="mdi-view-dashboard"
                variant="outlined"
                @click="navigateTo('/dashboard')"
              >
                Dashboard
              </v-btn>
              
              <v-btn
                v-if="isOrganizer"
                color="info"
                size="large"
                prepend-icon="mdi-account-star"
                variant="outlined"
                @click="navigateTo('/organizer')"
              >
                Organizer Hub
              </v-btn>
              
              <v-btn
                color="success"
                size="large"
                prepend-icon="mdi-account-group"
                variant="outlined"
                @click="navigateTo('/participants')"
              >
                Participants
              </v-btn>
              
              <v-btn
                v-if="isOrganizer"
                color="warning"
                size="large"
                prepend-icon="mdi-cog"
                variant="outlined"
                @click="navigateTo('/settings')"
              >
                Settings
              </v-btn>
            </div>
          </v-col>
        </v-row>

        <!-- Event Stats Cards -->
        <v-row class="mb-6">
          <v-col cols="12" md="3">
            <v-card class="text-center pa-4" variant="tonal" color="primary">
              <v-icon size="32" class="mb-2">mdi-account-group</v-icon>
              <div class="text-h4 font-weight-bold">{{ eventStats?.participantCount || 0 }}</div>
              <div class="text-body-2">Participants</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="text-center pa-4" variant="tonal" color="secondary">
              <v-icon size="32" class="mb-2">mdi-lightbulb</v-icon>
              <div class="text-h4 font-weight-bold">{{ eventStats?.topicCount || 0 }}</div>
              <div class="text-body-2">Topics</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="text-center pa-4" variant="tonal" color="success">
              <v-icon size="32" class="mb-2">mdi-timer</v-icon>
              <div class="text-h4 font-weight-bold">{{ eventStats?.roundCount || 0 }}</div>
              <div class="text-body-2">Rounds</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card class="text-center pa-4" variant="tonal" color="info">
              <v-icon size="32" class="mb-2">mdi-account-star</v-icon>
              <div class="text-h4 font-weight-bold">{{ eventStats?.organizerCount || 0 }}</div>
              <div class="text-body-2">Organizers</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Event Information -->
        <v-row>
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>
                <v-icon class="mr-2">mdi-information</v-icon>
                Event Information
              </v-card-title>
              <v-card-text>
                <div class="mb-3">
                  <strong>Location:</strong> {{ event.location || 'Not specified' }}
                </div>
                <div class="mb-3">
                  <strong>Start Date:</strong> {{ formatDateTime(event.startDate) || 'Not set' }}
                </div>
                <div class="mb-3">
                  <strong>End Date:</strong> {{ formatDateTime(event.endDate) || 'Not set' }}
                </div>
                <div class="mb-3">
                  <strong>Created:</strong> {{ formatDateTime(event.createdAt) }}
                </div>
                <div class="mb-3">
                  <strong>Your Role:</strong> 
                  <v-chip size="small" :color="getRoleColor(userRole || undefined)" variant="tonal">
                    {{ userRole || 'Participant' }}
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-card>
              <v-card-title>
                <v-icon class="mr-2">mdi-share</v-icon>
                Share Event
              </v-card-title>
              <v-card-text>
                <v-text-field
                  :value="event.code"
                  label="Event Code"
                  readonly
                  append-inner-icon="mdi-content-copy"
                  @click:append-inner="copyToClipboard(event.code)"
                />
                <p class="text-caption text-medium-emphasis mt-2">
                  Share this code with participants to let them join the event.
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const { user } = useUserSession()

// Get event ID from route
const eventId = computed(() => route.params.eventId as string)

// Event data
const event = ref<any>(null)
const eventStats = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// User role in this event
const userRole = ref<string | null>(null)

// Check if user is organizer
const isOrganizer = computed(() => {
  return ['Admin', 'Organizer'].includes(userRole.value || '')
})

// Load event details
const loadEventDetails = async () => {
  if (!eventId.value) {
    error.value = 'Invalid event ID'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = null

    // Load event details
    const eventResponse = await $fetch(`/api/events/${eventId.value}/details`) as any
    event.value = eventResponse.event

    // Load event statistics
    try {
      const statsResponse = await $fetch(`/api/events/${eventId.value}/stats`) as any
      eventStats.value = statsResponse
    } catch (statsError) {
      console.warn('Failed to load event stats:', statsError)
      eventStats.value = {
        participantCount: 0,
        organizerCount: 0,
        topicCount: 0,
        roundCount: 0
      }
    }

    // Load user role in this event
    try {
      const roleResponse = await $fetch(`/api/events/${eventId.value}/my-role`) as any
      userRole.value = roleResponse.role
    } catch (roleError) {
      console.warn('Failed to load user role:', roleError)
      userRole.value = 'Participant'
    }

    // Update user's current event context
    try {
      await $fetch('/api/auth/set-current-event', {
        method: 'POST',
        body: { eventId: eventId.value }
      })
    } catch (contextError) {
      console.warn('Failed to set current event context:', contextError)
    }

  } catch (loadError: any) {
    console.error('Failed to load event details:', loadError)
    error.value = loadError.message || 'Failed to load event details'
    event.value = null
    eventStats.value = null
  } finally {
    loading.value = false
  }
}

// Utility functions
const formatDateTime = (dateString?: string) => {
  if (!dateString) return null
  return new Date(dateString).toLocaleString()
}

const getRoleColor = (role?: string) => {
  switch (role) {
    case 'Admin':
    case 'Organizer':
      return 'primary'
    case 'Moderator':
      return 'secondary'
    default:
      return 'grey'
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    // You could add a toast notification here
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
  }
}

// Load event on mount
onMounted(() => {
  loadEventDetails()
})
</script>

<style scoped>
.event-detail-page {
  min-height: 100vh;
}
</style>

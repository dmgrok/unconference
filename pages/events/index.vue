<template>
  <div class="pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">My Events</h1>
        <p class="text-body-1 mt-2">Manage your unconference events</p>
      </div>
      
      <div class="d-flex gap-3">
        <v-btn 
          color="secondary" 
          size="large" 
          @click="showJoinDialog = true"
          prepend-icon="mdi-account-plus"
          variant="outlined"
        >
          Join Event
        </v-btn>
        
        <v-btn 
          color="primary" 
          size="large" 
          @click="showCreateDialog = true"
          prepend-icon="mdi-plus"
        >
          Create Event
        </v-btn>
      </div>
    </div>

    <!-- Events Grid -->
    <v-row v-if="events.length > 0">
      <v-col 
        v-for="event in events" 
        :key="event.id" 
        cols="12" 
        md="6" 
        lg="4"
      >
        <v-card class="h-100" elevation="2" :class="{ 'border-primary': event.role === 'Organizer' }">
          <v-card-title class="d-flex justify-space-between align-start">
            <div class="flex-grow-1">
              <div class="text-truncate">{{ event.name }}</div>
              <v-chip
                :color="getRoleColor(event.role)"
                size="small"
                variant="flat"
                class="mt-1"
              >
                <v-icon start size="small">{{ getRoleIcon(event.role) }}</v-icon>
                {{ event.role || 'Participant' }}
              </v-chip>
            </div>
            <v-chip
              :color="event.isActive ? 'success' : 'warning'"
              size="small"
              variant="tonal"
              :prepend-icon="event.isActive ? 'mdi-check-circle' : 'mdi-pause-circle'"
            >
              {{ event.isActive ? 'Active' : 'Inactive' }}
            </v-chip>
          </v-card-title>
          
          <v-card-subtitle>
            Code: {{ event.code }}
          </v-card-subtitle>
          
          <v-card-text>
            <p v-if="event.description" class="text-body-2 mb-2">
              {{ event.description }}
            </p>
            
            <!-- Inactive Event Notice for Organizers -->
            <v-alert 
              v-if="!event.isActive && event.role === 'Organizer'"
              type="info"
              variant="tonal"
              density="compact"
              class="mb-3"
              prepend-icon="mdi-information"
            >
              <span class="text-caption">This event is inactive. You can still access settings and reactivate it.</span>
            </v-alert>
            
            <div class="d-flex align-center mb-2">
              <v-icon size="small" class="mr-2">mdi-calendar</v-icon>
              <span class="text-caption">
                {{ formatDate(event.startDate) }}
              </span>
            </div>
            
            <div v-if="event.location" class="d-flex align-center mb-2">
              <v-icon size="small" class="mr-2">mdi-map-marker</v-icon>
              <span class="text-caption">{{ event.location }}</span>
            </div>
            
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-account-group</v-icon>
              <span class="text-caption">
                {{ event.participantCount || 0 }} participants
              </span>
            </div>
          </v-card-text>
          
          <v-card-actions>
            <!-- Primary Enter/Manage Button -->
            <v-btn 
              v-if="event.role === 'Organizer'"
              :to="`/settings?eventId=${event.id}`"
              color="primary"
              variant="flat"
              size="small"
              :prepend-icon="event.isActive ? 'mdi-cog' : 'mdi-settings'"
            >
              {{ event.isActive ? 'Manage Event' : 'View Settings' }}
            </v-btn>
            
            <v-btn 
              v-else
              :to="`/voting?eventId=${event.id}`"
              color="primary"
              variant="flat"
              size="small"
              prepend-icon="mdi-play"
              :disabled="!event.isActive"
            >
              {{ event.isActive ? 'Enter Event' : 'Event Closed' }}
            </v-btn>

            <!-- Secondary Action for Organizers -->
            <v-btn 
              v-if="event.role === 'Organizer' && event.isActive"
              :to="`/voting?eventId=${event.id}`"
              color="secondary"
              variant="tonal"
              size="small"
              prepend-icon="mdi-vote"
            >
              Join Voting
            </v-btn>

            <!-- Event Status Controls for Organizers -->
            <v-btn
              v-if="event.role === 'Organizer'"
              :color="event.isActive ? 'warning' : 'success'"
              :variant="event.isActive ? 'outlined' : 'flat'"
              size="small"
              :prepend-icon="event.isActive ? 'mdi-pause' : 'mdi-play'"
              @click="toggleEventStatus(event)"
              :loading="event._statusLoading"
            >
              {{ event.isActive ? 'Close' : 'Reactivate' }}
            </v-btn>
            
            <v-spacer />

            <!-- Join Date Info -->
            <v-tooltip location="top">
              <template #activator="{ props }">
                <v-chip
                  v-bind="props"
                  size="small"
                  variant="text"
                  prepend-icon="mdi-calendar-clock"
                >
                  {{ formatJoinDate(event.joinedAt) }}
                </v-chip>
              </template>
              <span>Joined: {{ formatDateTime(event.joinedAt) }}</span>
            </v-tooltip>
            
            <v-btn
              icon="mdi-share-variant"
              size="small"
              variant="text"
              @click="shareEvent(event)"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Empty State -->
    <v-card v-else class="text-center pa-8">
      <v-icon size="64" color="grey-lighten-1">mdi-calendar-plus</v-icon>
      <h3 class="text-h6 mt-4 mb-2">No Events Yet</h3>
      <p class="text-body-2 mb-4">Create your first unconference event or join an existing one</p>
      
      <div class="d-flex justify-center gap-3 flex-wrap">
        <v-btn 
          color="secondary" 
          @click="showJoinDialog = true"
          prepend-icon="mdi-account-plus"
          variant="outlined"
        >
          Join Event
        </v-btn>
        
        <v-btn 
          color="primary" 
          @click="showCreateDialog = true"
          prepend-icon="mdi-plus"
        >
          Create Event
        </v-btn>
      </div>
    </v-card>

    <!-- Create Event Dialog -->
    <v-dialog v-model="showCreateDialog" max-width="600">
      <v-card>
        <v-card-title>Create New Event</v-card-title>
        
        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <v-text-field
              v-model="newEvent.name"
              label="Event Name *"
              :rules="[v => !!v || 'Event name is required']"
              required
            />
            
            <v-textarea
              v-model="newEvent.description"
              label="Description"
              rows="3"
            />
            
            <v-text-field
              v-model="newEvent.location"
              label="Location"
              prepend-inner-icon="mdi-map-marker"
            />
            
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="newEvent.startDate"
                  label="Start Date"
                  type="datetime-local"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="newEvent.endDate"
                  label="End Date"
                  type="datetime-local"
                />
              </v-col>
            </v-row>
            
            <v-switch
              v-model="newEvent.allowGuestAccess"
              label="Allow guest access"
              color="primary"
            />
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showCreateDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            :disabled="!formValid"
            :loading="creating"
            @click="createEvent"
          >
            Create Event
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Join Event Dialog -->
    <v-dialog v-model="showJoinDialog" max-width="500">
      <v-card>
        <v-card-title>Join Event</v-card-title>
        
        <v-card-text>
          <v-form ref="joinForm" v-model="joinFormValid">
            <v-text-field
              v-model="joinEvent.eventCode"
              label="Event Code *"
              :rules="[v => !!v || 'Event code is required', v => v.length >= 4 || 'Event code must be at least 4 characters']"
              hint="Enter the event code provided by the organizer"
              persistent-hint
              required
              variant="outlined"
              prepend-inner-icon="mdi-ticket-confirmation"
              @keyup.enter="joinEventByCode"
            />
            
            <v-alert type="info" class="mt-4" variant="tonal">
              <v-alert-title>Need an event code?</v-alert-title>
              <p class="text-body-2">Ask the event organizer for the unique event code to join their unconference.</p>
            </v-alert>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showJoinDialog = false; resetJoinForm()">Cancel</v-btn>
          <v-btn 
            color="primary" 
            :disabled="!joinFormValid"
            :loading="joining"
            @click="joinEventByCode"
          >
            Join Event
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Share Dialog -->
    <v-dialog v-model="showShareDialog" max-width="500">
      <v-card v-if="selectedEvent">
        <v-card-title>Share Event</v-card-title>
        
        <v-card-text>
          <p class="mb-4">Share this event code with participants:</p>
          
          <v-text-field
            :value="selectedEvent.code"
            label="Event Code"
            readonly
            append-icon="mdi-content-copy"
            @click:append="copyToClipboard(selectedEvent.code)"
          />
          
          <p class="text-caption text-grey">
            Participants can join using this code on the login page
          </p>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showShareDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'multi-event'
})

// Check if user is super admin and redirect if needed
const { user } = useUserSession()
const isSuperAdmin = computed(() => (user.value as any)?.globalRole === 'SuperAdmin')

// Redirect super admins to the admin events page
if (isSuperAdmin.value) {
  await navigateTo('/super-admin/events')
}

interface Event {
  id: string
  code: string
  name: string
  description?: string
  location?: string
  startDate: string
  endDate: string
  isActive: boolean
  participantCount?: number
  role?: string
  joinedAt?: string
  _statusLoading?: boolean
}

// Data
const events = ref<Event[]>([])
const showCreateDialog = ref(false)
const showJoinDialog = ref(false)
const showShareDialog = ref(false)
const selectedEvent = ref<Event | null>(null)
const formValid = ref(false)
const joinFormValid = ref(false)
const creating = ref(false)
const joining = ref(false)

const newEvent = ref({
  name: '',
  description: '',
  location: '',
  startDate: '',
  endDate: '',
  allowGuestAccess: true
})

const joinEvent = ref({
  eventCode: ''
})

// Load events
async function loadEvents() {
  try {
    const response = await $fetch('/api/events/my-events') as any
    events.value = response.events || []
  } catch (error) {
    console.error('Failed to load events:', error)
  }
}

// Create event
async function createEvent() {
  if (!formValid.value) return
  
  creating.value = true
  try {
    const response = await $fetch('/api/events/create', {
      method: 'POST',
      body: {
        ...newEvent.value,
        settings: {
          allowGuestAccess: newEvent.value.allowGuestAccess
        }
      }
    }) as any
    
    if (response.success) {
      showCreateDialog.value = false
      resetForm()
      await loadEvents()
      
      // Navigate to the new event
      await navigateTo(`/dashboard?eventId=${response.event.id}`)
    }
  } catch (error) {
    console.error('Failed to create event:', error)
  } finally {
    creating.value = false
  }
}

// Join event by code
async function joinEventByCode() {
  if (!joinFormValid.value) return

  joining.value = true
  try {
    // Use the direct join route
    await navigateTo(`/join/${joinEvent.value.eventCode.toUpperCase()}`)
  } catch (error) {
    console.error('Failed to join event:', error)
  } finally {
    joining.value = false
  }
}

// Share event
function shareEvent(event: Event) {
  selectedEvent.value = event
  showShareDialog.value = true
}

// Copy to clipboard
async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    // Show success toast
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

// Get role color
function getRoleColor(role?: string) {
  switch (role) {
    case 'Organizer':
      return 'primary'
    case 'Moderator':
      return 'info'
    case 'Participant':
      return 'success'
    case 'Guest':
      return 'warning'
    default:
      return 'grey'
  }
}

// Get role icon
function getRoleIcon(role?: string) {
  switch (role) {
    case 'Organizer':
      return 'mdi-crown'
    case 'Moderator':
      return 'mdi-shield-account'
    case 'Participant':
      return 'mdi-account'
    case 'Guest':
      return 'mdi-account-question'
    default:
      return 'mdi-account'
  }
}

// Toggle event status (for organizers)
async function toggleEventStatus(event: Event) {
  if (!event.role || event.role !== 'Organizer') return
  
  const action = event.isActive ? 'close' : 'activate'
  const actionText = event.isActive ? 'close' : 'start'
  
  const confirmed = confirm(`Are you sure you want to ${actionText} this event?`)
  if (!confirmed) return

  // Set loading state
  event._statusLoading = true

  try {
    const response = await $fetch(`/api/events/${event.id}/${action}`, {
      method: 'POST'
    }) as any
    
    if (response.success) {
      // Update local event status
      event.isActive = !event.isActive
      
      // Show success message
      console.log(`Event ${actionText}ed successfully`)
    }
  } catch (error: any) {
    console.error(`Failed to ${actionText} event:`, error)
    alert(`Failed to ${actionText} event: ${error.data?.message || 'Unknown error'}`)
  } finally {
    event._statusLoading = false
  }
}

// Format join date (relative)
function formatJoinDate(dateString?: string) {
  if (!dateString) return 'Unknown'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return formatDate(dateString)
}

// Format date and time
function formatDateTime(dateString?: string) {
  if (!dateString) return 'Unknown'
  return new Date(dateString).toLocaleString()
}

// Format date
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

// Reset form
function resetForm() {
  newEvent.value = {
    name: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
    allowGuestAccess: true
  }
}

// Reset join form
function resetJoinForm() {
  joinEvent.value = {
    eventCode: ''
  }
}

// Load events on mount
onMounted(() => {
  loadEvents()
})
</script>

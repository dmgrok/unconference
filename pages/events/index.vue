<template>
  <div class="pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">My Events</h1>
        <p class="text-body-1 mt-2">Manage your unconference events</p>
      </div>
      
      <v-btn 
        color="primary" 
        size="large" 
        @click="showCreateDialog = true"
        prepend-icon="mdi-plus"
      >
        Create Event
      </v-btn>
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
        <v-card class="h-100" elevation="2">
          <v-card-title class="d-flex justify-space-between">
            <span class="text-truncate">{{ event.name }}</span>
            <v-chip
              :color="event.isActive ? 'success' : 'warning'"
              size="small"
              variant="tonal"
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
            <v-btn 
              :to="`/dashboard?eventId=${event.id}`"
              color="primary"
              variant="tonal"
              size="small"
            >
              Manage
            </v-btn>
            
            <v-btn 
              :to="`/events/${event.id}/settings`"
              color="secondary"
              variant="text"
              size="small"
            >
              Settings
            </v-btn>
            
            <v-spacer />
            
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
      <p class="text-body-2 mb-4">Create your first unconference event to get started</p>
      <v-btn 
        color="primary" 
        @click="showCreateDialog = true"
        prepend-icon="mdi-plus"
      >
        Create Your First Event
      </v-btn>
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
}

// Data
const events = ref<Event[]>([])
const showCreateDialog = ref(false)
const showShareDialog = ref(false)
const selectedEvent = ref<Event | null>(null)
const formValid = ref(false)
const creating = ref(false)

const newEvent = ref({
  name: '',
  description: '',
  location: '',
  startDate: '',
  endDate: '',
  allowGuestAccess: true
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

// Load events on mount
onMounted(() => {
  loadEvents()
})
</script>

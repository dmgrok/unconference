<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { User } from '~/types/user'

definePageMeta({
  middleware: 'authenticated'
})

const { user } = useUserSession()
const { updateEventConfig } = useEventConfig()

// Check if user is admin
const isAdmin = computed(() => (user.value as User)?.role === 'Admin')
if (!isAdmin.value) {
  throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
}

// Wizard state
const currentStep = ref(0)
const wizardComplete = ref(false)
const saving = ref(false)

// Form data
const eventData = ref({
  // Step 1: Basic Info
  title: '',
  description: '',
  dates: '',
  location: '',
  expectedParticipants: 20,
  
  // Step 2: Voting Settings
  maxVotesPerTopic: 12,
  topTopicsCount: 10,
  roundDurationMinutes: 20,
  maxTopicsPerRound: 8,
  
  // Step 3: Access & Communication
  eventCode: '',
  eventName: '',
  allowGuests: true,
  enableQRCode: true,
  
  // Step 4: Rooms & Logistics
  rooms: [
    { name: 'Main Room', capacity: 15, location: 'Building A, Room 101' },
    { name: 'Breakout 1', capacity: 10, location: 'Building A, Room 102' },
    { name: 'Breakout 2', capacity: 10, location: 'Building A, Room 103' }
  ]
})

const steps = [
  {
    title: 'Event Details',
    subtitle: 'Basic information about your event',
    icon: 'mdi-calendar-text'
  },
  {
    title: 'Voting & Rounds',
    subtitle: 'Configure how discussions work',
    icon: 'mdi-vote'
  },
  {
    title: 'Access & Sharing',
    subtitle: 'Set up participant access',
    icon: 'mdi-qrcode'
  },
  {
    title: 'Rooms & Logistics',
    subtitle: 'Physical setup and capacity',
    icon: 'mdi-home-city'
  },
  {
    title: 'Review & Launch',
    subtitle: 'Final check and activation',
    icon: 'mdi-rocket-launch'
  }
]

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0: // Basic Info
      return eventData.value.title && eventData.value.description && eventData.value.location
    case 1: // Voting Settings
      return true // All have defaults
    case 2: // Access & Communication  
      return eventData.value.eventCode && eventData.value.eventName
    case 3: // Rooms
      return eventData.value.rooms.length > 0
    case 4: // Review
      return true
    default:
      return false
  }
})

// Auto-generate event code from title
function generateEventCode() {
  const title = eventData.value.title
  if (!title) return
  
  const words = title.split(' ').slice(0, 2)
  const year = new Date().getFullYear().toString().slice(-2)
  eventData.value.eventCode = (words.join('') + year).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
  eventData.value.eventName = eventData.value.title
}

function addRoom() {
  eventData.value.rooms.push({
    name: '',
    capacity: 10,
    location: ''
  })
}

function removeRoom(index: number) {
  eventData.value.rooms.splice(index, 1)
}

async function completeSetup() {
  saving.value = true
  
  try {
    // Save event configuration
    await updateEventConfig({
      title: eventData.value.title,
      description: eventData.value.description,
      dates: eventData.value.dates,
      location: eventData.value.location
    })
    
    // Save admin settings
    await $fetch('/api/admin/settings', {
      method: 'POST',
      body: {
        maxVotesPerTopic: eventData.value.maxVotesPerTopic,
        topTopicsCount: eventData.value.topTopicsCount,
        allowTopicSubmission: true,
        autoStartNewRound: false,
        roundDurationMinutes: eventData.value.roundDurationMinutes,
        maxTopicsPerRound: eventData.value.maxTopicsPerRound,
        showVoterNames: true
      }
    })
    
    // Save rooms
    for (const room of eventData.value.rooms) {
      if (room.name && room.location) {
        await $fetch('/api/admin/rooms', {
          method: 'POST',
          body: room
        })
      }
    }
    
    // Generate QR code if enabled
    if (eventData.value.enableQRCode) {
      await $fetch('/api/admin/generate-qr', {
        method: 'POST',
        body: {
          eventCode: eventData.value.eventCode,
          eventName: eventData.value.eventName
        }
      })
    }
    
    // Mark wizard as complete
    wizardComplete.value = true
    
    // Set completion flag in localStorage
    localStorage.setItem('organizer-setup-complete', 'true')
    
  } catch (error) {
    console.error('Setup failed:', error)
    alert('Setup failed. Please try again.')
  } finally {
    saving.value = false
  }
}

// Check if setup was already completed
onMounted(() => {
  const setupComplete = localStorage.getItem('organizer-setup-complete')
  if (setupComplete) {
    wizardComplete.value = true
  }
  
  // Auto-generate initial event code
  generateEventCode()
})
</script>

<template>
  <v-container class="fill-height">
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        
        <!-- Completion State -->
        <div v-if="wizardComplete" class="text-center py-16">
          <v-icon size="120" color="success" class="mb-6">mdi-check-circle</v-icon>
          <h1 class="text-h3 mb-4">🎉 Your Event is Ready!</h1>
          <p class="text-h6 text-grey-darken-1 mb-6">
            Everything is configured and participants can now join your unconference.
          </p>
          
          <div class="d-flex flex-column align-center gap-4">
            <v-btn 
              color="primary" 
              size="x-large" 
              to="/voting"
              prepend-icon="mdi-view-dashboard"
            >
              Go to Dashboard
            </v-btn>
            
            <v-btn 
              color="secondary" 
              variant="outlined"
              to="/admin/voting-dashboard"
              prepend-icon="mdi-monitor"
            >
              Open Live Voting Display
            </v-btn>
            
            <v-btn 
              color="success" 
              variant="text"
              to="/settings"
              prepend-icon="mdi-cog"
            >
              Fine-tune Settings
            </v-btn>
          </div>
        </div>

        <!-- Setup Wizard -->
        <div v-else>
          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-h3 mb-2">Event Setup Wizard</h1>
            <p class="text-h6 text-grey-darken-1">
              Let's get your unconference ready in 5 easy steps
            </p>
          </div>

          <!-- Progress Stepper -->
          <v-stepper 
            v-model="currentStep" 
            :items="steps"
            color="primary"
            hide-actions
            class="mb-6"
          ></v-stepper>

          <!-- Step Content -->
          <v-card class="pa-6 mb-6">
            
            <!-- Step 1: Event Details -->
            <div v-if="currentStep === 0">
              <h2 class="text-h5 mb-4">📅 Tell us about your event</h2>
              
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="eventData.title"
                    label="Event Title"
                    placeholder="e.g., Tech Innovation Summit 2025"
                    variant="outlined"
                    @input="generateEventCode"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12">
                  <v-textarea
                    v-model="eventData.description"
                    label="Event Description"
                    placeholder="Brief description of your event's purpose and goals"
                    variant="outlined"
                    rows="3"
                  ></v-textarea>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="eventData.dates"
                    label="Event Dates"
                    placeholder="e.g., March 15-16, 2025"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="eventData.location"
                    label="Location"
                    placeholder="e.g., Downtown Conference Center"
                    variant="outlined"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-slider
                    v-model="eventData.expectedParticipants"
                    label="Expected Participants"
                    min="5"
                    max="200"
                    step="5"
                    thumb-label
                    variant="outlined"
                  ></v-slider>
                </v-col>
              </v-row>
            </div>

            <!-- Step 2: Voting & Rounds -->
            <div v-if="currentStep === 1">
              <h2 class="text-h5 mb-4">🗳️ Configure voting and discussions</h2>
              
              <v-alert type="info" variant="tonal" class="mb-4">
                <v-alert-title>How it works</v-alert-title>
                Participants vote for topics (1st choice = 2 points, 2nd choice = 1 point). 
                You then select the most popular topics for discussion rounds.
              </v-alert>
              
              <v-row>
                <v-col cols="12" md="6">
                  <v-slider
                    v-model="eventData.maxVotesPerTopic"
                    label="Max Votes Per Topic"
                    min="1"
                    max="50"
                    step="1"
                    thumb-label
                    hint="Prevents topics from getting too many votes"
                  ></v-slider>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-slider
                    v-model="eventData.topTopicsCount"
                    label="Show Top Topics"
                    min="3"
                    max="20"
                    step="1"
                    thumb-label
                    hint="How many top topics to highlight"
                  ></v-slider>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-slider
                    v-model="eventData.roundDurationMinutes"
                    label="Round Duration (minutes)"
                    min="5"
                    max="60"
                    step="5"
                    thumb-label
                    hint="How long each discussion round lasts"
                  ></v-slider>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-slider
                    v-model="eventData.maxTopicsPerRound"
                    label="Max Topics Per Round"
                    min="1"
                    max="15"
                    step="1"
                    thumb-label
                    hint="Maximum parallel discussions"
                  ></v-slider>
                </v-col>
              </v-row>
            </div>

            <!-- Step 3: Access & Communication -->
            <div v-if="currentStep === 2">
              <h2 class="text-h5 mb-4">🎫 Set up participant access</h2>
              
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="eventData.eventCode"
                    label="Event Code"
                    placeholder="e.g., TECH25"
                    variant="outlined"
                    hint="Short code participants use to join"
                    style="text-transform: uppercase;"
                    @input="eventData.eventCode = eventData.eventCode.toUpperCase()"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="eventData.eventName"
                    label="Event Name (for QR codes)"
                    variant="outlined"
                    hint="Displayed on QR codes and join pages"
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12">
                  <v-switch
                    v-model="eventData.allowGuests"
                    label="Allow Guest Participants"
                    hint="Lets people join without creating accounts"
                    color="primary"
                  ></v-switch>
                </v-col>
                
                <v-col cols="12">
                  <v-switch
                    v-model="eventData.enableQRCode"
                    label="Generate QR Code"
                    hint="Creates QR code for easy event access"
                    color="primary"
                  ></v-switch>
                </v-col>
              </v-row>
              
              <v-alert type="success" variant="tonal" class="mt-4">
                <v-alert-title>Join URL Preview</v-alert-title>
                Participants will access: <strong>/quick-join?code={{ eventData.eventCode }}</strong>
              </v-alert>
            </div>

            <!-- Step 4: Rooms & Logistics -->
            <div v-if="currentStep === 3">
              <h2 class="text-h5 mb-4">🏢 Configure discussion spaces</h2>
              
              <v-alert type="info" variant="tonal" class="mb-4">
                <v-alert-title>Room Planning</v-alert-title>
                Set up rooms where discussions will happen. You can assign topics to specific rooms during rounds.
              </v-alert>
              
              <div class="mb-4">
                <h3 class="text-h6 mb-3">Discussion Rooms</h3>
                
                <v-row v-for="(room, index) in eventData.rooms" :key="index" class="mb-2">
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="room.name"
                      label="Room Name"
                      variant="outlined"
                      density="compact"
                    ></v-text-field>
                  </v-col>
                  
                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model.number="room.capacity"
                      label="Capacity"
                      type="number"
                      variant="outlined"
                      density="compact"
                    ></v-text-field>
                  </v-col>
                  
                  <v-col cols="12" md="4">
                    <v-text-field
                      v-model="room.location"
                      label="Location/Directions"
                      variant="outlined"
                      density="compact"
                    ></v-text-field>
                  </v-col>
                  
                  <v-col cols="12" md="2" class="d-flex align-center">
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      @click="removeRoom(index)"
                      :disabled="eventData.rooms.length <= 1"
                    ></v-btn>
                  </v-col>
                </v-row>
                
                <v-btn
                  @click="addRoom"
                  prepend-icon="mdi-plus"
                  variant="outlined"
                  color="primary"
                >
                  Add Room
                </v-btn>
              </div>
              
              <v-alert type="warning" variant="tonal">
                <v-alert-title>Capacity Check</v-alert-title>
                Total room capacity: <strong>{{ eventData.rooms.reduce((sum, room) => sum + (room.capacity || 0), 0) }}</strong>
                | Expected participants: <strong>{{ eventData.expectedParticipants }}</strong>
              </v-alert>
            </div>

            <!-- Step 5: Review & Launch -->
            <div v-if="currentStep === 4">
              <h2 class="text-h5 mb-4">🚀 Review and launch your event</h2>
              
              <v-card variant="outlined" class="mb-4">
                <v-card-title>Event Overview</v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <strong>{{ eventData.title }}</strong><br>
                      {{ eventData.dates }}<br>
                      {{ eventData.location }}<br>
                      Expected: {{ eventData.expectedParticipants }} participants
                    </v-col>
                    <v-col cols="12" md="6">
                      <strong>Access:</strong> {{ eventData.eventCode }}<br>
                      <strong>Voting:</strong> Max {{ eventData.maxVotesPerTopic }} votes per topic<br>
                      <strong>Rounds:</strong> {{ eventData.roundDurationMinutes }} min, max {{ eventData.maxTopicsPerRound }} topics<br>
                      <strong>Rooms:</strong> {{ eventData.rooms.length }} configured
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
              
              <v-alert type="success" variant="tonal" class="mb-4">
                <v-alert-title>Ready to Launch!</v-alert-title>
                Your event is configured and ready. Participants can start joining immediately after launch.
              </v-alert>
              
              <div class="text-center">
                <v-btn
                  color="success"
                  size="x-large"
                  prepend-icon="mdi-rocket-launch"
                  @click="completeSetup"
                  :loading="saving"
                >
                  Launch Event
                </v-btn>
              </div>
            </div>
          </v-card>

          <!-- Navigation -->
          <div class="d-flex justify-space-between">
            <v-btn
              variant="text"
              prepend-icon="mdi-arrow-left"
              @click="currentStep--"
              :disabled="currentStep === 0"
            >
              Previous
            </v-btn>
            
            <v-btn
              color="primary"
              append-icon="mdi-arrow-right"
              @click="currentStep++"
              :disabled="!canProceed || currentStep === 4"
            >
              {{ currentStep === 3 ? 'Review' : 'Next' }}
            </v-btn>
          </div>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.v-stepper :deep(.v-stepper-header) {
  box-shadow: none;
}
</style>

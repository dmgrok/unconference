<template>
  <div class="events-page">
    <v-container class="py-8">
      <!-- Success Message -->
      <v-alert
        v-if="showSuccessMessage"
        type="success"
        variant="tonal"
        class="mb-6"
        closable
        @click:close="$router.replace({ query: {} })"
      >
        <div class="text-h6 mb-2">
          {{ $route.query.upgrade === 'success' ? 'Subscription Upgraded!' : 'Payment Successful!' }}
        </div>
        <p class="mb-0">
          {{ $route.query.upgrade === 'success' 
            ? 'Your subscription has been upgraded successfully. You can now create more events!' 
            : 'Your event payment has been processed successfully!' 
          }}
        </p>
      </v-alert>

      <!-- Header -->
      <div class="d-flex justify-space-between align-center mb-8">
        <div>
          <h1 class="text-h3 font-weight-bold text-primary mb-2">
            My Events
          </h1>
          <p class="text-h6 text-medium-emphasis">
            Manage your unconference events and track engagement
          </p>
        </div>
        
        <div class="d-flex gap-3">
          <v-btn
            color="secondary"
            size="large"
            prepend-icon="mdi-account-plus"
            variant="outlined"
            @click="showJoinDialog = true"
          >
            Join Event
          </v-btn>
          
          <v-btn
            color="primary"
            size="large"
            prepend-icon="mdi-plus"
            to="/events/create"
          >
            Create Event
          </v-btn>
        </div>
      </div>

      <!-- Subscription Status -->
      <v-card v-if="subscription" class="mb-6" elevation="2">
        <v-card-text class="pa-6">
          <div class="d-flex justify-space-between align-center">
            <div>
              <h3 class="text-h5 mb-2">
                {{ subscription.tier.charAt(0) + subscription.tier.slice(1).toLowerCase() }} Plan
                <v-chip 
                  :color="subscription.isActive ? 'success' : 'warning'" 
                  size="small" 
                  class="ml-2"
                >
                  {{ subscription.status }}
                </v-chip>
              </h3>
              <p class="text-body-1 mb-1">
                <strong>Events this month:</strong> {{ subscription.usage.eventsThisMonth }} / 
                {{ subscription.limits.maxEventsPerMonth === -1 ? '∞' : subscription.limits.maxEventsPerMonth }}
              </p>
              <p class="text-body-1 mb-0">
                <strong>Max participants per event:</strong> 
                {{ subscription.limits.maxParticipants === -1 ? 'Unlimited' : subscription.limits.maxParticipants }}
              </p>
            </div>
            
            <v-btn
              v-if="subscription.tier === 'FREE' || subscription.needsUpgrade"
              color="primary"
              variant="outlined"
              to="/pricing"
            >
              {{ subscription.tier === 'FREE' ? 'Upgrade Plan' : 'View Plans' }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Events List -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-h6 mt-4">Loading your events...</p>
      </div>

      <div v-else-if="events.length === 0" class="text-center py-12">
        <v-icon size="120" color="grey-lighten-2" class="mb-4">
          mdi-calendar-plus
        </v-icon>
        <h2 class="text-h4 text-medium-emphasis mb-4">No Events Yet</h2>
        <p class="text-h6 text-medium-emphasis mb-6">
          Create your first unconference event to start building community discussions.
        </p>
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-plus"
          to="/events/create"
        >
          Create Your First Event
        </v-btn>
      </div>

      <v-row v-else>
        <v-col
          v-for="event in events"
          :key="event.id"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card
            class="event-card h-100"
            elevation="4"
            :to="`/events/${event.id}`"
            hover
          >
            <v-card-title class="pb-2">
              <div class="d-flex justify-space-between align-start w-100">
                <div class="flex-grow-1">
                  <h3 class="text-h5 mb-1">{{ event.title }}</h3>
                  <p class="text-caption text-medium-emphasis mb-0">
                    Code: {{ event.code }}
                  </p>
                </div>
                
                <div class="text-right">
                  <v-chip
                    :color="getStatusColor(event.status)"
                    size="small"
                    class="mb-1"
                  >
                    {{ event.status }}
                  </v-chip>
                  <br>
                  <v-chip
                    v-if="event.paymentStatus !== 'FREE'"
                    :color="getPaymentStatusColor(event.paymentStatus)"
                    size="x-small"
                    variant="outlined"
                  >
                    {{ event.paymentStatus }}
                  </v-chip>
                </div>
              </div>
            </v-card-title>

            <v-card-text>
              <p class="text-body-2 text-medium-emphasis mb-3">
                {{ event.description || 'No description provided' }}
              </p>

              <div class="event-stats mb-3">
                <div class="d-flex justify-space-between mb-2">
                  <span>Participants:</span>
                  <span class="font-weight-medium">
                    {{ event.memberships?.length || 0 }} / {{ event.maxParticipants }}
                  </span>
                </div>
                
                <div class="d-flex justify-space-between mb-2">
                  <span>Topics:</span>
                  <span class="font-weight-medium">{{ event._count?.topics || 0 }}</span>
                </div>

                <div v-if="event.startsAt" class="d-flex justify-space-between">
                  <span>Starts:</span>
                  <span class="font-weight-medium">{{ formatDate(event.startsAt) }}</span>
                </div>
              </div>

              <div class="d-flex gap-2">
                <v-chip
                  v-if="event.allowGuestAccess"
                  color="blue"
                  size="x-small"
                  variant="outlined"
                >
                  Guest Access
                </v-chip>
                
                <v-chip
                  v-if="event.requireApproval"
                  color="orange"
                  size="x-small"
                  variant="outlined"
                >
                  Requires Approval
                </v-chip>
                
                <v-chip
                  v-if="event.paymentType === 'PAY_PER_EVENT' && event.paymentStatus === 'PAID'"
                  color="green"
                  size="x-small"
                  variant="outlined"
                >
                  Paid Event
                </v-chip>
              </div>
            </v-card-text>

            <v-card-actions>
              <v-spacer />
              <v-btn
                color="primary"
                variant="text"
                prepend-icon="mdi-arrow-right"
              >
                Manage Event
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

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
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const route = useRoute()

// State
const loading = ref(true)
const events = ref([])
const subscription = ref(null)
const showJoinDialog = ref(false)
const showShareDialog = ref(false)
const selectedEvent = ref(null)
const joining = ref(false)

// Join form
const joinEvent = ref({
  eventCode: ''
})

// Success message from payment
const showSuccessMessage = computed(() => route.query.upgrade === 'success' || route.query.payment === 'success')

// Fetch user's events and subscription info
async function fetchEvents() {
  loading.value = true
  
  try {
    const [eventsResponse, subscriptionResponse] = await Promise.all([
      $fetch('/api/events'),
      $fetch('/api/subscription/details')
    ])
    
    events.value = eventsResponse.events || []
    subscription.value = subscriptionResponse
  } catch (error) {
    console.error('Failed to fetch events:', error)
  } finally {
    loading.value = false
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE': return 'success'
    case 'DRAFT': return 'warning'
    case 'COMPLETED': return 'info'
    case 'PAUSED': return 'warning'
    case 'ARCHIVED': return 'grey'
    default: return 'grey'
  }
}

function getPaymentStatusColor(status: string) {
  switch (status) {
    case 'FREE': return 'success'
    case 'PAID': return 'success'
    case 'PENDING': return 'warning'
    case 'FAILED': return 'error'
    default: return 'grey'
  }
}

function formatDate(dateString: string) {
  if (!dateString) return 'Not set'
  return new Date(dateString).toLocaleDateString()
}

// Join event by code
async function joinEventByCode() {
  if (!joinEvent.value.eventCode) return

  joining.value = true
  try {
    await navigateTo(`/join/${joinEvent.value.eventCode.toUpperCase()}`)
  } catch (error) {
    console.error('Failed to join event:', error)
  } finally {
    joining.value = false
  }
}

// Share event
function shareEvent(event: any) {
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

onMounted(() => {
  fetchEvents()
})

useSeoMeta({
  title: 'My Events - Unconference',
  description: 'Manage your unconference events and track participant engagement.',
})
</script>

<style scoped>
.events-page {
  background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%);
  min-height: 100vh;
}

.event-card {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.event-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%);
}

.event-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.event-stats {
  font-size: 0.875rem;
}

.v-card--hover {
  cursor: pointer;
}
</style>

<template>
  <v-container class="pa-6">
    <h1 class="text-h4 mb-6">Event Read-Only Mode Demo</h1>
    
    <!-- Demo Instructions -->
    <v-card class="mb-6">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-information</v-icon>
        Demo Instructions
      </v-card-title>
      <v-card-text>
        <p class="mb-4">
          This demo showcases the new Event Read-Only Mode feature. When an event is inactive, 
          the sidebar automatically switches to show a comprehensive event summary instead of the 
          regular navigation.
        </p>
        
        <v-alert type="info" class="mb-4">
          <v-alert-title>What to test:</v-alert-title>
          <ol class="mt-2">
            <li>Click "Deactivate Event" below to simulate an inactive event</li>
            <li>Notice how the sidebar changes to show event summary instead of navigation</li>
            <li>See how management features are hidden while read-only links remain</li>
            <li>Click "Reactivate Event" to restore normal navigation</li>
          </ol>
        </v-alert>
      </v-card-text>
    </v-card>

    <!-- Event Status Controls -->
    <v-card class="mb-6">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-toggle-switch</v-icon>
        Event Status Control
        <v-spacer />
        <v-chip
          :color="isEventActive ? 'success' : 'warning'"
          :prepend-icon="isEventActive ? 'mdi-check-circle' : 'mdi-pause-circle'"
        >
          {{ isEventActive ? 'Active' : 'Inactive' }}
        </v-chip>
      </v-card-title>
      <v-card-text>
        <div class="d-flex align-center mb-4">
          <div class="flex-grow-1">
            <p class="text-body-1 mb-2">
              Current Status: <strong>{{ isEventActive ? 'Active' : 'Inactive' }}</strong>
            </p>
            <p class="text-body-2 text-grey-darken-1">
              {{ isEventActive 
                ? 'The event is active and fully functional. All features are available.' 
                : 'The event is inactive. Only read-only features are available.' 
              }}
            </p>
          </div>
        </div>
        
        <div class="d-flex gap-2">
          <v-btn
            v-if="isEventActive"
            color="warning"
            prepend-icon="mdi-pause"
            @click="handleDeactivateEvent"
            :loading="loading"
          >
            Deactivate Event (Demo)
          </v-btn>
          <v-btn
            v-else
            color="success"
            prepend-icon="mdi-play"
            @click="handleReactivateEvent"
            :loading="loading"
          >
            Reactivate Event
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Current Event Information -->
    <v-card class="mb-6" v-if="currentEvent">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-calendar</v-icon>
        Current Event Information
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Event Name</v-list-item-title>
                <v-list-item-subtitle>{{ currentEvent.name }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Event Code</v-list-item-title>
                <v-list-item-subtitle>{{ currentEvent.code }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Description</v-list-item-title>
                <v-list-item-subtitle>{{ currentEvent.description || 'No description' }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>
          <v-col cols="12" md="6">
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Location</v-list-item-title>
                <v-list-item-subtitle>{{ currentEvent.location || 'No location set' }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Your Role</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip size="small" :color="getRoleColor(userRole)">
                    {{ userRole || 'Participant' }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="eventStats">
                <v-list-item-title>Statistics</v-list-item-title>
                <v-list-item-subtitle>
                  {{ eventStats.participantCount }} participants, 
                  {{ eventStats.topicCount }} topics, 
                  {{ eventStats.roundCount }} rounds
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Feature Explanation -->
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-lightbulb</v-icon>
        How It Works
      </v-card-title>
      <v-card-text>
        <p class="mb-4">
          The Event Read-Only Mode automatically activates when an event becomes inactive. Here's what happens:
        </p>
        
        <v-row>
          <v-col cols="12" md="6">
            <h4 class="text-h6 mb-2">🚫 When Event is Inactive:</h4>
            <ul class="mb-4">
              <li>Sidebar shows event summary instead of navigation</li>
              <li>Management features are hidden (not disabled)</li>
              <li>All data remains viewable in read-only mode</li>
              <li>Clear status indicators throughout the app</li>
              <li>Organizers see reactivation options</li>
            </ul>
          </v-col>
          <v-col cols="12" md="6">
            <h4 class="text-h6 mb-2">✅ When Event is Active:</h4>
            <ul class="mb-4">
              <li>Normal sidebar navigation is displayed</li>
              <li>All management features are accessible</li>
              <li>Users can vote, create topics, start rounds</li>
              <li>Full functionality is available</li>
              <li>No restrictions on user actions</li>
            </ul>
          </v-col>
        </v-row>

        <v-alert type="success" class="mt-4">
          <v-alert-title>Key Benefits</v-alert-title>
          <p class="mt-2">
            This feature prevents accidental changes to inactive events while maintaining 
            full visibility of event data. Users get immediate context about the event 
            status and appropriate actions are clearly presented.
          </p>
        </v-alert>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Event Read-Only Mode Demo',
  middleware: 'authenticated'
})

const { isEventActive, isEventInactive, toggleEventStatus } = useEventStatus()
const { currentEvent, eventStats, userRole } = useCurrentEvent()

const loading = ref(false)

async function handleDeactivateEvent() {
  const confirmed = confirm('This will deactivate the current event for demonstration purposes. Continue?')
  if (!confirmed) return
  
  loading.value = true
  try {
    await toggleEventStatus()
  } catch (error) {
    console.error('Failed to deactivate event:', error)
  } finally {
    loading.value = false
  }
}

async function handleReactivateEvent() {
  loading.value = true
  try {
    await toggleEventStatus()
  } catch (error) {
    console.error('Failed to reactivate event:', error)
  } finally {
    loading.value = false
  }
}

function getRoleColor(role: string | null) {
  const colors: Record<string, string> = {
    'Organizer': 'primary',
    'Admin': 'primary',
    'Moderator': 'secondary',
    'Participant': 'success',
    'Guest': 'info'
  }
  return colors[role || 'Participant'] || 'grey'
}
</script>

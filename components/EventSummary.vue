<template>
  <div class="event-summary">
    <!-- Loading State -->
    <v-card v-if="loading" variant="outlined" class="mb-4">
      <v-card-text class="pa-4 text-center">
        <v-progress-circular indeterminate size="32" class="mb-2" />
        <div class="text-body-2">Loading event details...</div>
      </v-card-text>
    </v-card>

    <!-- Event Summary -->
    <v-card v-else variant="outlined" class="mb-4">
      <!-- Event Header -->
      <v-card-title class="d-flex align-center pa-4 bg-surface-variant">
        <v-icon class="mr-2" color="warning">mdi-calendar-clock</v-icon>
        <div class="flex-grow-1">
          <div class="text-h6">{{ event?.name || 'Event Details' }}</div>
          <v-chip
            color="warning"
            size="small"
            prepend-icon="mdi-pause-circle"
            class="mt-1"
          >
            Inactive Event
          </v-chip>
        </div>
      </v-card-title>

      <!-- Event Information -->
      <v-card-text class="pa-4">
        <v-list density="compact" class="bg-transparent">
          <!-- Event Code -->
          <v-list-item
            v-if="event?.code"
            prepend-icon="mdi-qrcode"
            class="px-0"
          >
            <v-list-item-title class="text-body-2 font-weight-medium">
              Event Code
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ event.code }}
            </v-list-item-subtitle>
          </v-list-item>

          <!-- Description -->
          <v-list-item
            v-if="event?.description"
            prepend-icon="mdi-text"
            class="px-0"
          >
            <v-list-item-title class="text-body-2 font-weight-medium">
              Description
            </v-list-item-title>
            <v-list-item-subtitle class="text-wrap">
              {{ event.description }}
            </v-list-item-subtitle>
          </v-list-item>

          <!-- Location -->
          <v-list-item
            v-if="event?.location"
            prepend-icon="mdi-map-marker"
            class="px-0"
          >
            <v-list-item-title class="text-body-2 font-weight-medium">
              Location
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ event.location }}
            </v-list-item-subtitle>
          </v-list-item>

          <!-- Event Dates -->
          <v-list-item
            v-if="event?.startDate"
            prepend-icon="mdi-calendar"
            class="px-0"
          >
            <v-list-item-title class="text-body-2 font-weight-medium">
              Event Date
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ formatEventDate(event.startDate, event.endDate) }}
            </v-list-item-subtitle>
          </v-list-item>

          <!-- Your Role -->
          <v-list-item
            v-if="userRole"
            prepend-icon="mdi-account-star"
            class="px-0"
          >
            <v-list-item-title class="text-body-2 font-weight-medium">
              Your Role
            </v-list-item-title>
            <v-list-item-subtitle>
              <v-chip
                :color="getRoleColor(userRole)"
                size="small"
              >
                {{ userRole }}
              </v-chip>
            </v-list-item-subtitle>
          </v-list-item>

          <!-- Participant Stats -->
          <v-list-item
            v-if="eventStats"
            prepend-icon="mdi-account-group"
            class="px-0"
          >
            <v-list-item-title class="text-body-2 font-weight-medium">
              Participants
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ eventStats.participantCount || 0 }} total
              <span v-if="eventStats.organizerCount">
                • {{ eventStats.organizerCount }} organizers
              </span>
            </v-list-item-subtitle>
          </v-list-item>

          <!-- Topics Count -->
          <v-list-item
            v-if="eventStats?.topicCount !== undefined"
            prepend-icon="mdi-lightbulb"
            class="px-0"
          >
            <v-list-item-title class="text-body-2 font-weight-medium">
              Topics Submitted
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ eventStats.topicCount }} topics
            </v-list-item-subtitle>
          </v-list-item>

          <!-- Round History -->
          <v-list-item
            v-if="eventStats?.roundCount !== undefined"
            prepend-icon="mdi-history"
            class="px-0"
          >
            <v-list-item-title class="text-body-2 font-weight-medium">
              Rounds Completed
            </v-list-item-title>
            <v-list-item-subtitle>
              {{ eventStats.roundCount }} rounds
            </v-list-item-subtitle>
          </v-list-item>

          <!-- Event Status Reason -->
          <v-list-item
            v-if="statusReason"
            prepend-icon="mdi-information"
            class="px-0"
          >
            <v-list-item-title class="text-body-2 font-weight-medium">
              Status
            </v-list-item-title>
            <v-list-item-subtitle class="text-wrap">
              {{ statusReason }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>

      <!-- Organizer Actions (if user is organizer) -->
      <v-card-actions v-if="canReactivate" class="pa-4 pt-0">
        <v-btn
          color="success"
          variant="elevated"
          prepend-icon="mdi-play"
          @click="$emit('reactivate-event')"
          :loading="loading"
          block
        >
          Reactivate Event
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Limited Actions -->
    <v-card variant="outlined">
      <v-card-title class="d-flex align-center pa-4">
        <v-icon class="mr-2">mdi-eye</v-icon>
        <span class="text-subtitle-1">Available Actions</span>
      </v-card-title>
      
      <v-card-text class="pa-2">
        <v-list density="compact" class="bg-transparent">
          <!-- View Data -->
          <v-list-item
            to="/voting"
            prepend-icon="mdi-vote"
            class="read-only-action"
          >
            <v-list-item-title>View Topics & Votes</v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              Browse submitted topics (read-only)
            </v-list-item-subtitle>
          </v-list-item>

          <!-- View Groups -->
          <v-list-item
            to="/groups"
            prepend-icon="mdi-account-group"
            class="read-only-action"
          >
            <v-list-item-title>View Round History</v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              See past discussion rounds
            </v-list-item-subtitle>
          </v-list-item>

          <!-- View Settings (organizers only) -->
          <v-list-item
            v-if="isOrganizer"
            to="/settings"
            prepend-icon="mdi-cog"
            class="read-only-action"
          >
            <v-list-item-title>Event Settings</v-list-item-title>
            <v-list-item-subtitle class="text-caption">
              View/edit event configuration
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
interface EventSummaryProps {
  event?: {
    id: string
    code: string
    name: string
    description?: string
    location?: string
    startDate?: string
    endDate?: string
    isActive: boolean
  }
  userRole?: string
  eventStats?: {
    participantCount: number
    organizerCount?: number
    topicCount?: number
    roundCount?: number
  }
  statusReason?: string
  canReactivate?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<EventSummaryProps>(), {
  canReactivate: false,
  loading: false
})

const emit = defineEmits<{
  'reactivate-event': []
}>()

const isOrganizer = computed(() => 
  ['Organizer', 'Admin'].includes(props.userRole || '')
)

function formatEventDate(startDate?: string, endDate?: string) {
  if (!startDate) return 'No date set'
  
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : null
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  
  if (end && start.toDateString() !== end.toDateString()) {
    return `${start.toLocaleDateString('en-US', formatOptions)} - ${end.toLocaleDateString('en-US', formatOptions)}`
  } else {
    return start.toLocaleDateString('en-US', formatOptions)
  }
}

function getRoleColor(role: string) {
  const colors: Record<string, string> = {
    'Organizer': 'primary',
    'Admin': 'primary',
    'Moderator': 'secondary',
    'Participant': 'success',
    'Guest': 'info'
  }
  return colors[role] || 'grey'
}
</script>

<style scoped>
.event-summary {
  max-width: 280px;
}

.read-only-action:hover {
  background: rgba(99, 102, 241, 0.05);
}

.text-wrap {
  white-space: normal !important;
  word-wrap: break-word;
}
</style>

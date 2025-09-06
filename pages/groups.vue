<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import type { User } from '~/types/user'
import type { RoundHistory, ActiveRound } from '~/types/topic'

interface GroupAssignment {
  topicId: string
  topicTitle: string
  participants: string[]  // participant emails
  roomAssignment?: string
}

interface TopicSelection {
  topicId: string
  title: string
  description: string
  totalPreferenceScore: number
  participantCount: number
  selected: boolean
}

const { user } = useUserSession()

// Redirect super admins to their admin dashboard
const isSuperAdmin = computed(() => (user.value as any)?.globalRole === 'SuperAdmin')
if (isSuperAdmin.value) {
  await navigateTo('/super-admin/dashboard')
}

const { settings: adminSettings, loadSettings } = useAdminSettings()
const { eventStatus, isEventActive, isEventInactive, canEditEvent } = useEventStatus()
const groups = ref<GroupAssignment[]>([])
const activeRound = ref<ActiveRound | null>(null)
const roundHistory = ref<RoundHistory[]>([])
const loading = ref(true)
const error = ref('')

// Topic selection for organizers
const topicSelections = ref<TopicSelection[]>([])
const newRoundDialog = ref(false)
const roundHistoryDialog = ref(false)
const quickRoundDialog = ref(false)
const roundDuration = ref(20)
const startingRound = ref(false)
const extendingRound = ref(false)
const allParticipantsDialog = ref(false)
const selectedGroupForParticipants = ref<GroupAssignment | null>(null)

// Timer states for active round
const timeRemaining = ref(0)
const timerInterval = ref<NodeJS.Timeout | null>(null)

const userEmail = computed(() => (user.value as User)?.email || '')

const userGroup = computed(() => {
  if (!userEmail.value || !groups.value.length) return null
  return groups.value.find(group => group.participants.includes(userEmail.value))
})

// Check if user is organizer/admin
const isOrganizer = computed(() => {
  const userRole = (user.value as any)?.Role || (user.value as any)?.role
  return ['Admin', 'Organizer'].includes(userRole)
})

const selectedTopics = computed(() => 
  topicSelections.value.filter(topic => topic.selected)
)

const canStartRound = computed(() => 
  selectedTopics.value.length > 0 && selectedTopics.value.length <= adminSettings.value.maxTopicsPerRound
)

async function loadGroups() {
  loading.value = true
  error.value = ''
  
  try {
    const response = await $fetch('/api/active-round') as ActiveRound | null
    activeRound.value = response
    
    if (response?.isActive && response.groupAssignments) {
      groups.value = response.groupAssignments
      startTimer()
    } else {
      groups.value = []
      stopTimer()
    }
  } catch (err: any) {
    // Only set error for actual API failures, not missing active rounds
    const errorMessage = err.data?.message || 'Failed to load group assignments'
    if (errorMessage.includes('No active round')) {
      // This is a normal state, not an error
      activeRound.value = null
      groups.value = []
    } else {
      error.value = errorMessage
    }
  } finally {
    loading.value = false
  }
}

async function loadRoundHistory() {
  try {
    const data = await $fetch('/api/admin/round-history') as RoundHistory[]
    roundHistory.value = data
  } catch (error) {
    console.error('Failed to load round history:', error)
  }
}

function startTimer() {
  if (!activeRound.value?.isActive) return
  
  const startTime = new Date(activeRound.value.startTime)
  const duration = activeRound.value.duration * 60 * 1000 // Convert to milliseconds
  
  const updateTimer = () => {
    const now = new Date()
    const elapsed = now.getTime() - startTime.getTime()
    const remaining = Math.max(0, duration - elapsed)
    
    timeRemaining.value = Math.floor(remaining / 1000) // Convert to seconds
    
    if (remaining <= 0) {
      clearInterval(timerInterval.value!)
      activeRound.value!.isActive = false
    }
  }
  
  updateTimer()
  timerInterval.value = setInterval(updateTimer, 1000)
}

function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString()
}

async function loadTopicSelections() {
  try {
    const data = await $fetch('/api/admin/topic-selection') as TopicSelection[]
    topicSelections.value = data
  } catch (error) {
    console.error('Failed to load topic selections:', error)
  }
}

function toggleTopicSelection(topicId: string) {
  const topic = topicSelections.value.find(t => t.topicId === topicId)
  if (topic) {
    if (topic.selected) {
      topic.selected = false
    } else if (selectedTopics.value.length < adminSettings.value.maxTopicsPerRound) {
      topic.selected = true
    }
  }
}

async function startNewRound() {
  if (!canStartRound.value) return
  
  startingRound.value = true
  try {
    const selectedTopicIds = selectedTopics.value.map(t => t.topicId)
    const result = await $fetch('/api/admin/start-round', {
      method: 'POST',
      body: {
        selectedTopicIds,
        roundDuration: roundDuration.value
      }
    }) as { roundNumber: number; selectedTopics: any[]; message: string }
    
    newRoundDialog.value = false
    await loadGroups()
    
    // Show success message
    alert(`Round ${result.roundNumber} started successfully with ${selectedTopics.value.length} topics!`)
  } catch (error) {
    console.error('Failed to start new round:', error)
    alert('Failed to start new round. Please try again.')
  } finally {
    startingRound.value = false
  }
}

async function startQuickRound() {
  try {
    startingRound.value = true
    await $fetch('/api/topics/new-round', {
      method: 'POST'
    })
    quickRoundDialog.value = false
    await loadGroups()
    alert('Quick round started with top voted topics!')
  } catch (error) {
    console.error('Failed to start quick round:', error)
    alert('Failed to start quick round. Please try again.')
  } finally {
    startingRound.value = false
  }
}

async function endCurrentRound() {
  const confirmed = confirm('Are you sure you want to end the current round early?')
  if (!confirmed) return
  
  try {
    loading.value = true
    await $fetch('/api/admin/end-round', { method: 'POST' })
    await loadGroups()
    stopTimer()
    alert('Round ended successfully!')
  } catch (error) {
    console.error('Failed to end round:', error)
    alert('Failed to end round')
  } finally {
    loading.value = false
  }
}

async function extendCurrentRound() {
  const confirmed = confirm('Extend the current round by 5 minutes?')
  if (!confirmed) return
  
  try {
    extendingRound.value = true
    const response = await $fetch('/api/admin/extend-round', { 
      method: 'POST',
      body: { extensionMinutes: 5 }
    })
    
    // Update active round duration
    if (activeRound.value) {
      activeRound.value.duration = response.newDuration
    }
    
    alert(`Round extended by 5 minutes. New duration: ${response.newDuration} minutes.`)
  } catch (error) {
    console.error('Failed to extend round:', error)
    alert('Failed to extend round')
  } finally {
    extendingRound.value = false
  }
}

async function openNewRoundDialog() {
  newRoundDialog.value = true
  await loadTopicSelections()
  roundDuration.value = adminSettings.value.roundDurationMinutes
}

async function openRoundHistoryDialog() {
  roundHistoryDialog.value = true
  await loadRoundHistory()
}

function showAllParticipants(group: GroupAssignment) {
  selectedGroupForParticipants.value = group
  allParticipantsDialog.value = true
}

function formatParticipantName(participantEmail: string) {
  if (participantEmail.includes('@unconference.guest')) {
    return `Guest ${participantEmail.split('_')[1]?.substring(0, 6).toUpperCase() || 'User'}`
  }
  return participantEmail.split('@')[0] || participantEmail
}

onMounted(() => {
  loadSettings()
  loadGroups()
  
  // Set up polling for group updates every 5 seconds
  const pollInterval = setInterval(async () => {
    await loadGroups()
  }, 5000)
  
  // Store interval reference for cleanup
  ;(window as any).__groupsPollInterval = pollInterval
})

// Cleanup polling on unmount
onBeforeUnmount(() => {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
  }
  
  // Clear polling interval
  if ((window as any).__groupsPollInterval) {
    clearInterval((window as any).__groupsPollInterval)
  }
})
</script>

<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Discussion Groups & Round Management</h1>
        <p class="text-body-1 text-grey-darken-1 mt-2">
          Manage rounds, select topics, and view current group assignments
        </p>
      </div>
      
      <div class="d-flex gap-2 flex-wrap">
        <!-- For Organizers - Round Management Actions -->
        <template v-if="isOrganizer">
          <!-- Active Round Controls -->
          <template v-if="activeRound?.isActive">
            <v-btn
              color="warning"
              prepend-icon="mdi-timer-plus"
              variant="outlined"
              :loading="extendingRound"
              @click="extendCurrentRound"
            >
              Extend Round
            </v-btn>
            <v-btn
              color="error"
              prepend-icon="mdi-stop-circle"
              variant="outlined"
              @click="endCurrentRound"
            >
              End Round
            </v-btn>
          </template>
          
          <!-- No Active Round Controls -->
          <template v-else>
            <v-btn
              color="secondary"
              prepend-icon="mdi-lightning-bolt"
              variant="outlined"
              @click="quickRoundDialog = true"
              :disabled="!canEditEvent"
            >
              Quick Round
            </v-btn>
            <v-btn
              color="success"
              prepend-icon="mdi-play-circle"
              @click="openNewRoundDialog"
              :disabled="!canEditEvent"
            >
              Start Custom Round
            </v-btn>
          </template>
          
          <!-- Always Available Actions -->
          <v-btn
            color="info"
            prepend-icon="mdi-history"
            variant="outlined"
            @click="openRoundHistoryDialog"
          >
            Round History
          </v-btn>
          <v-btn
            color="info"
            prepend-icon="mdi-home-city"
            variant="outlined"
            to="/admin/rooms"
          >
            Configure Rooms
          </v-btn>
        </template>
        
        <!-- For all users -->
        <v-btn
          color="primary"
          prepend-icon="mdi-refresh"
          variant="outlined"
          @click="loadGroups"
        >
          Refresh
        </v-btn>
      </div>
    </div>

    <!-- Event Inactive Alert -->
    <v-row v-if="isEventInactive" class="mb-4">
      <v-col>
        <v-alert
          type="warning"
          prominent
          variant="tonal"
          prepend-icon="mdi-pause-circle"
        >
          <v-alert-title>Event is Inactive</v-alert-title>
          This event is currently inactive. You can view discussion groups and data, but round management is disabled.
          {{ eventStatus?.statusReason }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
      <p class="mt-4 text-body-1">Loading group assignments...</p>
    </div>

    <!-- Error State -->
    <v-alert
      v-else-if="error"
      type="error"
      prominent
      border="start"
      class="mb-6"
    >
      <v-alert-title>Error Loading Groups</v-alert-title>
      <div>{{ error }}</div>
    </v-alert>

    <!-- Round Status Card -->
    <v-card v-else-if="activeRound?.isActive" class="mb-6" elevation="4">
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon color="success" class="mr-3" size="large">mdi-play-circle</v-icon>
          <div>
            <h3>Round {{ activeRound.roundNumber }} Active</h3>
            <p class="text-caption text-grey mb-0">
              Started: {{ new Date(activeRound.startTime).toLocaleString() }}
            </p>
          </div>
        </div>
        
        <div class="text-center">
          <v-chip 
            :color="timeRemaining > 300 ? 'success' : timeRemaining > 60 ? 'warning' : 'error'"
            size="large"
            prepend-icon="mdi-timer"
          >
            {{ formatTime(timeRemaining) }} remaining
          </v-chip>
          <br>
          <small class="text-grey">{{ activeRound.duration }} min total</small>
        </div>
      </v-card-title>
      
      <v-card-text>
        <div class="d-flex align-center justify-space-between">
          <div>
            <v-chip-group>
              <v-chip 
                v-for="group in activeRound.groupAssignments" 
                :key="group.topicId"
                size="small"
                color="primary"
                variant="outlined"
              >
                {{ group.topicTitle }}
                <v-badge 
                  v-if="group.participants.length > 0"
                  :content="group.participants.length"
                  color="success"
                  inline
                />
              </v-chip>
            </v-chip-group>
          </div>
          
          <div v-if="isOrganizer" class="d-flex gap-2">
            <v-btn
              color="warning"
              size="small"
              prepend-icon="mdi-timer-plus"
              variant="outlined"
              :loading="extendingRound"
              @click="extendCurrentRound"
            >
              +5min
            </v-btn>
            <v-btn
              color="error"
              size="small"
              prepend-icon="mdi-stop"
              variant="outlined"
              @click="endCurrentRound"
            >
              End
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- No Active Round -->
    <v-card v-else-if="!activeRound?.isActive" class="text-center py-8" variant="outlined">
      <v-card-text>
        <v-icon size="64" color="grey" class="mb-4">mdi-account-group-outline</v-icon>
        <h2 class="text-h5 mb-2">No Active Round</h2>
        <p class="text-body-1 text-grey-darken-1 mb-4">
          Discussion groups are created when an organizer starts a new round. 
          <br>Check back when a round is active, or start voting on topics to influence the next round.
        </p>
        
        <!-- Room Setup Info for Organizers -->
        <v-alert v-if="isOrganizer" type="info" variant="outlined" class="mb-4 text-left">
          <v-alert-title>🏢 Room Setup</v-alert-title>
          <div>
            <p class="mb-2">Before starting a round, make sure you have configured discussion rooms:</p>
            <ul class="text-left">
              <li>Go to <strong>Configure Rooms</strong> to set up available discussion spaces</li>
              <li>Each topic will be automatically assigned to a room when you start a round</li>
              <li>Participants will be distributed based on their voting preferences and room capacity</li>
            </ul>
          </div>
        </v-alert>
        
        <div class="d-flex gap-3 justify-center flex-wrap">
          <v-btn color="primary" to="/voting">
            <v-icon class="mr-2">mdi-vote</v-icon>
            Vote on Topics
          </v-btn>
          <v-btn 
            v-if="isOrganizer" 
            color="success" 
            @click="openNewRoundDialog"
            variant="elevated"
            :disabled="!canEditEvent"
          >
            <v-icon class="mr-2">mdi-play-circle</v-icon>
            Start New Round
          </v-btn>
          <v-btn 
            v-if="isOrganizer" 
            color="secondary" 
            to="/organizer"
            variant="outlined"
          >
            <v-icon class="mr-2">mdi-cog</v-icon>
            Organizer Hub
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- User's Assignment -->
    <v-card v-if="userGroup" color="primary" variant="elevated" class="mb-6">
      <v-card-title class="text-white">
        <v-icon class="mr-2">mdi-account-check</v-icon>
        Your Assignment
      </v-card-title>
      <v-card-text class="text-white">
        <h3 class="text-h6 mb-2">{{ userGroup.topicTitle }}</h3>
        <p class="mb-2">
          <v-icon class="mr-1">mdi-account-group</v-icon>
          {{ userGroup.participants.length }} participants in this group
        </p>
        <v-chip v-if="userGroup.roomAssignment" color="white" text-color="primary" prepend-icon="mdi-map-marker">
          {{ userGroup.roomAssignment }}
        </v-chip>
        <v-chip v-else color="orange" prepend-icon="mdi-alert">
          Room assignment pending
        </v-chip>
      </v-card-text>
    </v-card>

    <!-- No Assignment -->
    <v-alert v-else-if="activeRound?.isActive" type="info" prominent class="mb-6">
      <v-alert-title>No Group Assignment</v-alert-title>
      <div>Neither of your voted topics was selected for this round. You can join any available discussion group.</div>
    </v-alert>

    <!-- All Groups -->
    <div v-if="groups.length > 0">
      <h2 class="text-h5 mb-4">All Discussion Groups</h2>
      
      <v-row>
        <v-col
          v-for="(group, index) in groups"
          :key="group.topicId"
          cols="12"
          md="6"
          lg="4"
        >
          <v-card 
            elevation="3" 
            :class="{'border-primary': userGroup?.topicId === group.topicId}"
            class="h-100"
          >
            <v-card-title class="d-flex align-center">
              <v-avatar
                :color="userGroup?.topicId === group.topicId ? 'primary' : 'grey'"
                size="32"
                class="mr-3"
              >
                <span class="text-white font-weight-bold">{{ index + 1 }}</span>
              </v-avatar>
              <div class="flex-grow-1">
                <div class="text-h6">Group {{ index + 1 }}</div>
                <div v-if="userGroup?.topicId === group.topicId" class="text-caption text-primary">
                  Your Group
                </div>
              </div>
            </v-card-title>

            <v-card-text>
              <h3 class="text-h6 mb-3">{{ group.topicTitle }}</h3>
              
              <!-- Room Assignment -->
              <div v-if="group.roomAssignment" class="d-flex align-center gap-2 mb-3">
                <v-icon color="primary">mdi-map-marker</v-icon>
                <strong>{{ group.roomAssignment }}</strong>
              </div>
              <div v-else class="d-flex align-center gap-2 mb-3">
                <v-icon color="orange">mdi-alert</v-icon>
                <span class="text-orange">Room assignment pending</span>
              </div>

              <!-- Participants -->
              <div class="mb-3">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center">
                    <v-icon class="mr-1">mdi-account-group</v-icon>
                    <span class="font-weight-medium">{{ group.participants.length }} participants</span>
                  </div>
                  <v-btn
                    v-if="group.participants.length > 6"
                    size="small"
                    color="info"
                    variant="outlined"
                    @click="showAllParticipants(group)"
                  >
                    View All
                  </v-btn>
                </div>
                
                <div class="d-flex flex-wrap gap-1">
                  <v-chip
                    v-for="participant in group.participants.slice(0, 6)"
                    :key="participant"
                    size="small"
                    :color="participant === userEmail ? 'primary' : 'grey-lighten-1'"
                    :text-color="participant === userEmail ? 'white' : 'black'"
                  >
                    {{ participant === userEmail ? 'You' : formatParticipantName(participant) }}
                  </v-chip>
                  <v-chip
                    v-if="group.participants.length > 6"
                    size="small"
                    color="grey-lighten-2"
                    variant="outlined"
                  >
                    +{{ group.participants.length - 6 }} more
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- New Round Dialog for Topic Selection -->
    <v-dialog v-model="newRoundDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-plus-circle</v-icon>
          Start New Round - Select Topics
        </v-card-title>
        
        <v-card-text>
          <!-- Round Configuration -->
          <v-row class="mb-4">
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="roundDuration"
                label="Round Duration (minutes)"
                type="number"
                min="5"
                max="60"
                prepend-icon="mdi-timer"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-chip
                :color="selectedTopics.length > 0 ? 'success' : 'default'"
                size="large"
                prepend-icon="mdi-check-circle"
              >
                {{ selectedTopics.length }}/{{ adminSettings.maxTopicsPerRound }} topics selected
              </v-chip>
            </v-col>
          </v-row>
          
          <!-- Topic Selection -->
          <h3 class="mb-3">Select Topics for Discussion</h3>
          <p class="text-caption mb-4">Click on topics to select them for the round. Topics are sorted by preference score.</p>
          
          <v-row v-if="topicSelections.length > 0">
            <v-col
              v-for="topic in topicSelections"
              :key="topic.topicId"
              cols="12"
              md="6"
            >
              <v-card
                :color="topic.selected ? 'primary' : 'default'"
                :variant="topic.selected ? 'elevated' : 'outlined'"
                class="cursor-pointer"
                @click="toggleTopicSelection(topic.topicId)"
                :disabled="!topic.selected && selectedTopics.length >= adminSettings.maxTopicsPerRound"
              >
                <v-card-title class="d-flex align-center">
                  <v-checkbox
                    :model-value="topic.selected"
                    class="mr-2"
                    hide-details
                    readonly
                  ></v-checkbox>
                  {{ topic.title }}
                </v-card-title>
                <v-card-text>
                  <p class="mb-3">{{ topic.description }}</p>
                  
                  <!-- Voting Details -->
                  <div class="voting-details mb-3">
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="text-h6 font-weight-bold text-primary">
                        {{ topic.totalPreferenceScore }} points
                      </span>
                      <span class="text-caption">
                        <v-icon size="small">mdi-account-group</v-icon>
                        {{ topic.participantCount }} voters
                      </span>
                    </div>
                    
                    <!-- Vote Breakdown -->
                    <div class="vote-breakdown">
                      <div class="d-flex gap-4">
                        <div class="text-caption">
                          <v-icon size="small" color="primary">mdi-star</v-icon>
                          1st choices: {{ Math.floor(topic.totalPreferenceScore / 2) || 0 }}
                          <span class="text-grey">({{ (Math.floor(topic.totalPreferenceScore / 2) || 0) * 2 }} pts)</span>
                        </div>
                        <div class="text-caption">
                          <v-icon size="small" color="secondary">mdi-star-half-full</v-icon>
                          2nd choices: {{ topic.totalPreferenceScore % 2 || (topic.participantCount - Math.floor(topic.totalPreferenceScore / 2)) }}
                          <span class="text-grey">({{ topic.totalPreferenceScore % 2 || (topic.participantCount - Math.floor(topic.totalPreferenceScore / 2)) }} pts)</span>
                        </div>
                      </div>
                      
                      <!-- Progress bar showing relative popularity -->
                      <v-progress-linear
                        :model-value="topic.totalPreferenceScore"
                        :max="Math.max(...topicSelections.map(t => t.totalPreferenceScore))"
                        color="primary"
                        height="4"
                        rounded
                        class="mt-2"
                      ></v-progress-linear>
                    </div>
                  </div>
                  
                  <!-- Selection Status -->
                  <v-chip
                    v-if="topic.selected"
                    color="success"
                    size="small"
                    prepend-icon="mdi-check"
                    class="mt-2"
                  >
                    Selected for Round
                  </v-chip>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
          
          <v-alert v-else type="info" class="mt-4">
            No topics available for selection. Users need to propose and vote on topics first.
          </v-alert>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="outlined"
            @click="newRoundDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!canStartRound || startingRound"
            :loading="startingRound"
            @click="startNewRound"
          >
            Start Round
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Quick Round Dialog -->
    <v-dialog v-model="quickRoundDialog" max-width="500px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="warning">mdi-lightning-bolt</v-icon>
          Quick Round Start
        </v-card-title>
        
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">
            <v-alert-title>Quick Round Features</v-alert-title>
            <ul class="mt-2">
              <li>Automatically selects top voted topics</li>
              <li>Awards badges to current top 10 topics</li>
              <li>Resets all voting counters</li>
              <li>Creates balanced discussion groups</li>
            </ul>
          </v-alert>
          
          <p>Are you sure you want to start a quick round with the highest voted topics?</p>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" @click="quickRoundDialog = false">Cancel</v-btn>
          <v-btn
            color="warning"
            @click="startQuickRound"
            :loading="startingRound"
          >
            Start Quick Round
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Round History Dialog -->
    <v-dialog v-model="roundHistoryDialog" max-width="800px">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-history</v-icon>
          Round History
        </v-card-title>
        
        <v-card-text>
          <div v-if="roundHistory.length === 0" class="text-center py-8">
            <v-icon size="64" color="grey">mdi-history</v-icon>
            <p class="text-h6 mt-4 text-grey">No rounds completed yet</p>
            <p class="text-body-2 text-grey">Round history will appear here after completing discussions</p>
          </div>
          
          <v-timeline v-else align="start" side="end">
            <v-timeline-item
              v-for="round in roundHistory"
              :key="round.id"
              :dot-color="(round.roundNumber || 0) % 2 === 0 ? 'primary' : 'secondary'"
              size="small"
            >
              <template #icon>
                <v-icon size="small">mdi-flag-checkered</v-icon>
              </template>
              
              <v-card elevation="2" class="mb-2">
                <v-card-title class="pb-2">
                  <div class="d-flex justify-space-between align-center w-100">
                    <span>Round {{ round.roundNumber || 'N/A' }}</span>
                    <v-chip size="small" color="success">
                      {{ round.selectedTopics?.length || round.topicIds?.length || 0 }} topics
                    </v-chip>
                  </div>
                </v-card-title>
                
                <v-card-text class="pt-0">
                  <p class="text-caption text-grey mb-2">
                    {{ new Date(round.startTime).toLocaleString() }} - {{ round.duration }} minutes
                  </p>
                  
                  <div class="selected-topics">
                    <strong>Topics Discussed:</strong>
                    <v-chip-group class="mt-1">
                      <v-chip
                        v-for="(topic, idx) in (round.selectedTopics || [])"
                        :key="topic.topicId || idx"
                        size="small"
                        variant="outlined"
                      >
                        {{ topic.title }}
                      </v-chip>
                      <v-chip
                        v-if="!round.selectedTopics && round.topicTitles"
                        v-for="(title, idx) in round.topicTitles"
                        :key="idx"
                        size="small"
                        variant="outlined"
                      >
                        {{ title }}
                      </v-chip>
                    </v-chip-group>
                  </div>
                  
                  <div v-if="round.participantCount" class="mt-3">
                    <strong>Participants:</strong> {{ round.participantCount }}
                  </div>
                </v-card-text>
              </v-card>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="roundHistoryDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- All Participants Dialog -->
    <v-dialog v-model="allParticipantsDialog" max-width="600px">
      <v-card v-if="selectedGroupForParticipants">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-account-group</v-icon>
          All Participants in Group {{ selectedGroupForParticipants ? groups.findIndex(g => g.topicId === selectedGroupForParticipants!.topicId) + 1 : '' }}
        </v-card-title>
        
        <v-card-text>
          <div class="mb-4">
            <h3 class="text-h6 mb-2">{{ selectedGroupForParticipants.topicTitle }}</h3>
            <div class="d-flex gap-2 mb-3">
              <v-chip 
                color="primary" 
                variant="elevated" 
                prepend-icon="mdi-account-multiple"
              >
                {{ selectedGroupForParticipants.participants.length }} Total Participants
              </v-chip>
              <v-chip 
                v-if="selectedGroupForParticipants.roomAssignment"
                color="info" 
                variant="outlined" 
                prepend-icon="mdi-map-marker"
              >
                {{ selectedGroupForParticipants.roomAssignment }}
              </v-chip>
            </div>
          </div>
          
          <h4 class="mb-3">Participants:</h4>
          <div class="participants-grid">
            <v-chip
              v-for="participant in selectedGroupForParticipants.participants"
              :key="participant"
              :color="participant === userEmail ? 'primary' : 'grey-lighten-1'"
              :text-color="participant === userEmail ? 'white' : 'black'"
              class="ma-1"
              prepend-icon="mdi-account"
            >
              {{ participant === userEmail ? 'You' : formatParticipantName(participant) }}
            </v-chip>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="allParticipantsDialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.border-primary {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
}

.voting-details {
  background: rgba(var(--v-theme-surface), 0.5);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(var(--v-border-color), 0.2);
}

.vote-breakdown {
  font-size: 0.875rem;
}
</style>

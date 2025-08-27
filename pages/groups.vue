<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import type { User } from '~/types/user'

interface GroupAssignment {
  topicId: string
  topicTitle: string
  participants: string[]  // participant emails
  roomAssignment?: string
}

interface ActiveRound {
  roundNumber: number
  startTime: string
  duration: number
  selectedTopics: string[]
  isActive: boolean
  groupAssignments: GroupAssignment[]
  votingDisabled: boolean
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
const { settings: adminSettings, loadSettings } = useAdminSettings()
const groups = ref<GroupAssignment[]>([])
const activeRound = ref<ActiveRound | null>(null)
const loading = ref(true)
const error = ref('')

// Topic selection for organizers
const topicSelections = ref<TopicSelection[]>([])
const newRoundDialog = ref(false)
const roundDuration = ref(20)
const startingRound = ref(false)

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
    } else {
      groups.value = []
      // Don't set error for no active round - this is a normal state
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

async function openNewRoundDialog() {
  newRoundDialog.value = true
  await loadTopicSelections()
  roundDuration.value = adminSettings.value.roundDurationMinutes
}

onMounted(() => {
  loadSettings()
  loadGroups()
})
</script>

<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Discussion Groups</h1>
        <p class="text-body-1 text-grey-darken-1 mt-2">
          View current round group assignments and room locations
        </p>
      </div>
      
      <div class="d-flex gap-2">
        <v-btn
          v-if="isOrganizer"
          color="info"
          prepend-icon="mdi-home-city"
          variant="outlined"
          to="/admin/rooms"
        >
          Configure Rooms
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-refresh"
          variant="outlined"
          @click="loadGroups"
        >
          Refresh
        </v-btn>
        <v-btn
          v-if="isOrganizer && !activeRound?.isActive"
          color="success"
          prepend-icon="mdi-play-circle"
          @click="openNewRoundDialog"
        >
          Start New Round
        </v-btn>
      </div>
    </div>

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

    <!-- Active Round Info -->
    <v-card v-else-if="activeRound?.isActive" color="success" variant="elevated" class="mb-6">
      <v-card-title class="text-white">
        <v-icon class="mr-2">mdi-account-group</v-icon>
        Round {{ activeRound.roundNumber }} - Group Assignments
      </v-card-title>
      <v-card-text class="text-white">
        <p>Discussion groups have been automatically created based on voting preferences.</p>
        <p class="text-caption mt-2">
          Started: {{ formatDate(activeRound.startTime) }} | Duration: {{ activeRound.duration }} minutes
        </p>
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
      <div>You're not assigned to a specific group for this round. You can join any available discussion.</div>
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
                <div class="d-flex align-center mb-2">
                  <v-icon class="mr-1">mdi-account-group</v-icon>
                  <span class="font-weight-medium">{{ group.participants.length }} participants</span>
                </div>
                
                <div class="d-flex flex-wrap gap-1">
                  <v-chip
                    v-for="participant in group.participants"
                    :key="participant"
                    size="small"
                    :color="participant === userEmail ? 'primary' : 'grey-lighten-1'"
                    :text-color="participant === userEmail ? 'white' : 'black'"
                  >
                    {{ participant === userEmail ? 'You' : participant.split('@')[0] }}
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
                  <p class="mb-2">{{ topic.description }}</p>
                  <div class="d-flex justify-space-between">
                    <span class="text-caption">
                      <v-icon size="small">mdi-account-group</v-icon>
                      {{ topic.participantCount }} participants
                    </span>
                    <span class="text-caption font-weight-bold">
                      {{ topic.totalPreferenceScore }} points
                    </span>
                  </div>
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
  </v-container>
</template>

<style scoped>
.border-primary {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
}

.cursor-pointer {
  cursor: pointer;
}
</style>

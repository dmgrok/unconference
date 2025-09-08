<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useDisplay } from 'vuetify'
import type { User } from '~/types/user'
import type { DiscussionTopic, ActiveRound } from '~/types/topic'

interface UserAssignment {
  hasAssignment: boolean
  assignment?: {
    topicId: string
    topicTitle: string
    roomAssignment?: string
    participants: string[]
    participantCount: number
  }
  message?: string
  roundInfo?: {
    roundNumber: number
    startTime: string
    duration: number
    isActive: boolean
  }
}

const config = useRuntimeConfig()
const { user } = useUserSession()

// Redirect super admins to their admin dashboard  
const isSuperAdmin = computed(() => (user.value as any)?.globalRole === 'SuperAdmin')
if (isSuperAdmin.value) {
  await navigateTo('/super-admin/dashboard')
}

const { settings: adminSettings, loadSettings } = useAdminSettings()
const { shouldHideAdminFeatures, getEffectiveRole } = useViewerMode()
const { eventStatus, isEventActive, isEventInactive, canEditEvent } = useEventStatus()
const VOTE_LIMIT = computed(() => adminSettings.value.maxVotesPerTopic)

// UI State
const currentTab = ref('voting')
const topicDialog = ref(false)
const editDialog = ref(false)
const freezeConfirmDialog = ref(false)
const showOnboardingTour = ref(false)
const tourStep = ref(0)

// Topic Management
const topicToFreeze = ref<DiscussionTopic | null>(null)
const topicToEdit = ref<DiscussionTopic | null>(null)
const editedTopic = ref({
  title: '',
  description: ''
})
const newTopic = ref({
  title: '',
  description: ''
})

// Data
const topics = ref<DiscussionTopic[]>([])
const activeRound = ref<ActiveRound | null>(null)
const userAssignment = ref<UserAssignment | null>(null)
const timeRemaining = ref(0)
const timerInterval = ref<NodeJS.Timeout | null>(null)

// User permissions
const isAdmin = computed(() => {
  const userRole = (user.value as any)?.Role || (user.value as any)?.role
  return ['Admin', 'Organizer'].includes(userRole) && !shouldHideAdminFeatures(userRole)
})

// Get user's preference votes
const userFirstChoice = computed(() => {
  return topics.value.find(topic => topic.firstChoiceVoters?.includes((user.value as User)?.email || ''))
})

const userSecondChoice = computed(() => {
  return topics.value.find(topic => topic.secondChoiceVoters?.includes((user.value as User)?.email || ''))
})

const hasVotedPreferences = computed(() => !!(userFirstChoice.value || userSecondChoice.value))

// Get user's current topic (if round is active)
const userCurrentTopic = computed(() => {
  if (!activeRound.value?.isActive || !userAssignment.value?.hasAssignment) return null
  
  return topics.value.find(topic => topic.id === userAssignment.value?.assignment?.topicId)
})

// Check if voting is disabled during active round
const isVotingDisabled = computed(() => {
  return activeRound.value?.isActive && activeRound.value?.votingDisabled
})

// Quick stats for overview
const eventStats = computed(() => ({
  totalTopics: topics.value.length,
  totalVotes: topics.value.reduce((sum, topic) => sum + (topic.votes || 0), 0),
  totalPoints: topics.value.reduce((sum, topic) => sum + (topic.totalPreferenceScore || 0), 0),
  myVotes: hasVotedPreferences.value ? (userFirstChoice.value ? 2 : 0) + (userSecondChoice.value ? 1 : 0) : 0,
  activeRoundNumber: activeRound.value?.roundNumber || null,
  nextRoundTopics: topics.value.filter(t => t.selectedForRound).length
}))

const canEditTopic = (topic: DiscussionTopic) => {
  return isAdmin.value || topic.createdBy === (user.value as User)?.email
}

const canDeleteTopic = (topic: DiscussionTopic) => {
  return isAdmin.value // Only admins/organizers can delete topics
}

const topicRules = {
  required: (v: string) => !!v || 'Field is required',
  minLength: (v: string) => (v && v.length >= 3) || 'Minimum 3 characters'
}

// Tab configuration
const tabs = computed(() => {
  const baseTabs = [
    { key: 'overview', title: 'Overview', icon: 'mdi-view-dashboard' },
    { key: 'voting', title: 'Vote & Topics', icon: 'mdi-vote' },
  ]
  
  // Add groups tab if there's an active round or user has assignment
  if (activeRound.value?.isActive || userAssignment.value?.hasAssignment) {
    baseTabs.push({ key: 'groups', title: 'My Group', icon: 'mdi-account-group' })
  }
  
  return baseTabs
})

// Core API functions
async function createTopic() {
  if (!newTopic.value.title || !newTopic.value.description) return
  if (!canEditEvent.value) {
    alert('Topic creation is disabled when the event is not active')
    return
  }

  const { currentEventId } = useEventContext()
  if (!currentEventId.value) {
    alert('No event selected')
    return
  }

  const response = await $fetch(`/api/events/${currentEventId.value}/topics`, {
    method: 'POST',
    body: {
      title: newTopic.value.title,
      description: newTopic.value.description
    }
  })

  // Reset form and close dialog
  newTopic.value = { title: '', description: '' }
  topicDialog.value = false
  
  // Refresh topics
  await fetchTopics()
}

async function fetchTopics() {
  const { currentEventId } = useEventContext()
  if (!currentEventId.value) {
    topics.value = []
    return
  }
  
  try {
    const response = await $fetch(`/api/events/${currentEventId.value}/topics`)
    topics.value = response as DiscussionTopic[]
  } catch (error) {
    console.error('Failed to fetch topics:', error)
    topics.value = []
  }
}

async function loadActiveRound() {
  try {
    const data = await $fetch('/api/active-round') as ActiveRound | null
    activeRound.value = data
    if (activeRound.value?.isActive) {
      startTimer()
      await loadUserAssignment()
    } else {
      stopTimer()
      userAssignment.value = null
    }
  } catch (error) {
    console.error('Failed to load active round:', error)
  }
}

async function loadUserAssignment() {
  try {
    const data = await $fetch('/api/my-assignment') as UserAssignment
    userAssignment.value = data
  } catch (error) {
    console.error('Failed to load user assignment:', error)
  }
}

function startTimer() {
  if (!activeRound.value) return
  
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

async function voteForTopic(topicId: string) {
  if (isVotingDisabled.value) {
    alert('Voting is disabled during active rounds')
    return
  }
  
  if (!canEditEvent.value) {
    alert('Voting is disabled when the event is not active')
    return
  }
  
  try {
    if (userFirstChoice.value && userFirstChoice.value.id === topicId) {
      // If clicking on their first choice, remove it
      await $fetch('/api/topics/preferences', {
        method: 'POST',
        body: {
          firstChoice: undefined,
          secondChoice: userSecondChoice.value?.id
        }
      })
    } else if (userSecondChoice.value && userSecondChoice.value.id === topicId) {
      // If clicking on their second choice, remove it
      await $fetch('/api/topics/preferences', {
        method: 'POST',
        body: {
          firstChoice: userFirstChoice.value?.id,
          secondChoice: undefined
        }
      })
    } else if (!userFirstChoice.value) {
      // No votes yet, make this first choice
      await $fetch('/api/topics/preferences', {
        method: 'POST',
        body: {
          firstChoice: topicId,
          secondChoice: userSecondChoice.value?.id
        }
      })
    } else if (!userSecondChoice.value) {
      // Has first choice, make this second choice
      await $fetch('/api/topics/preferences', {
        method: 'POST',
        body: {
          firstChoice: userFirstChoice.value.id,
          secondChoice: topicId
        }
      })
    } else {
      // Both choices are taken, replace first choice and move it to second
      await $fetch('/api/topics/preferences', {
        method: 'POST',
        body: {
          firstChoice: topicId,
          secondChoice: userFirstChoice.value.id
        }
      })
    }
    
    // Refresh topics to get updated votes
    await fetchTopics()
  } catch (error: any) {
    console.error('Voting failed:', error)
  }
}

async function resetVotes() {
  if (!canEditEvent.value) {
    alert('Vote resetting is disabled when the event is not active')
    return
  }
  
  const confirmed = confirm('Are you sure you want to reset all your votes?')
  if (!confirmed) return
  
  try {
    await $fetch('/api/topics/preferences', {
      method: 'POST',
      body: {
        firstChoice: undefined,
        secondChoice: undefined
      }
    })
    
    // Refresh topics to get updated votes
    await fetchTopics()
  } catch (error: any) {
    console.error('Reset votes failed:', error)
  }
}

async function freezeTopic() {
  if (!topicToFreeze.value) return
  if (!canEditEvent.value) {
    alert('Topic freezing is disabled when the event is not active')
    return
  }

  try {
    await $fetch(`/api/topics/${topicToFreeze.value.id}/freeze`, {
      method: 'POST'
    })
    freezeConfirmDialog.value = false
    topicToFreeze.value = null
    await fetchTopics()
  } catch (error) {
    console.error('Failed to freeze topic:', error)
  }
}

function startEdit(topic: DiscussionTopic) {
  topicToEdit.value = topic
  editedTopic.value = {
    title: topic.title,
    description: topic.description
  }
  editDialog.value = true
}

async function saveTopic() {
  if (!topicToEdit.value || !editedTopic.value.title || !editedTopic.value.description) return
  if (!canEditEvent.value) {
    alert('Topic editing is disabled when the event is not active')
    return
  }

  try {
    await $fetch(`/api/topics/${topicToEdit.value.id}/edit`, {
      method: 'POST',
      body: editedTopic.value
    })
    editDialog.value = false
    topicToEdit.value = null
    await fetchTopics()
  } catch (error) {
    console.error('Failed to update topic:', error)
  }
}

async function deleteTopic(topic: DiscussionTopic) {
  if (!canEditEvent.value) {
    alert('Topic deletion is disabled when the event is not active')
    return
  }

  const confirmed = confirm(`Are you sure you want to delete the topic "${topic.title}"? This action cannot be undone.`)
  if (!confirmed) return

  try {
    await $fetch(`/api/topics/${topic.id}/delete`, {
      method: 'POST'
    })
    await fetchTopics()
  } catch (error: any) {
    console.error('Failed to delete topic:', error)
    const errorMessage = error.data?.statusMessage || error.message || 'Failed to delete topic'
    alert(`Error: ${errorMessage}`)
  }
}

function getVoteStatus(topic: DiscussionTopic) {
  // Check if event is inactive
  if (isEventInactive.value) {
    return { status: 'disabled', text: 'Event Inactive', color: 'grey', variant: 'outlined' as const, disabled: true, icon: 'mdi-pause-circle' }
  }
  
  // Check if voting is disabled during active rounds
  if (isVotingDisabled.value) {
    return { status: 'disabled', text: 'Voting Disabled', color: 'grey', variant: 'outlined' as const, disabled: true, icon: 'mdi-vote-off' }
  }
  
  if (userFirstChoice.value && userFirstChoice.value.id === topic.id) {
    return { status: 'first', text: '1st Choice', color: 'warning', variant: 'elevated' as const, icon: 'mdi-star' }
  }
  if (userSecondChoice.value && userSecondChoice.value.id === topic.id) {
    return { status: 'second', text: '2nd Choice', color: 'info', variant: 'elevated' as const, icon: 'mdi-star-half-full' }
  }
  if (topic.frozen) {
    return { status: 'frozen', text: 'Topic Frozen', color: 'error', variant: 'outlined' as const, disabled: true, icon: 'mdi-snowflake' }
  }
  if (topic.votes >= VOTE_LIMIT.value) {
    return { status: 'full', text: `Full (${VOTE_LIMIT.value}/${VOTE_LIMIT.value})`, color: 'grey', variant: 'outlined' as const, disabled: true, icon: 'mdi-block-helper' }
  }
  
  // Determine what happens if they vote
  if (!userFirstChoice.value) {
    return { status: 'vote-first', text: 'Vote as 1st Choice', color: 'primary', variant: 'elevated' as const, icon: 'mdi-star' }
  } else if (!userSecondChoice.value) {
    return { status: 'vote-second', text: 'Vote as 2nd Choice', color: 'secondary', variant: 'elevated' as const, icon: 'mdi-star-half-full' }
  } else {
    return { status: 'vote-replace', text: 'Replace 1st Choice', color: 'primary', variant: 'outlined' as const, icon: 'mdi-swap-horizontal' }
  }
}

function closeTour() {
  showOnboardingTour.value = false
  if (process.client) {
    localStorage.setItem('unconference-tour-seen', 'true')
  }
}

// Fetch topics when component mounts
onMounted(async () => {
  // Handle auto-join if eventId is provided in URL
  const route = useRoute()
  const eventId = route.query.eventId as string
  const autoJoin = route.query.autoJoin === 'true'
  
  if (eventId && autoJoin) {
    try {
      // Try to join the event
      const { user } = useUserSession()
      const userId = (user.value as any)?.id || (user.value as any)?.email
      
      if (userId) {
        // Check if user is already a member
        const membershipResponse = await $fetch(`/api/events/${eventId}/my-role`)
        
        if (!membershipResponse.role) {
          // Add user as participant
          await $fetch(`/api/events/${eventId}/join`, {
            method: 'POST'
          })
        }
        
        // Update session with current event
        await $fetch('/api/auth/set-current-event', {
          method: 'POST',
          body: { eventId }
        })
      }
    } catch (error) {
      console.warn('Failed to auto-join event:', error)
    }
  }
  
  await loadSettings()
  await Promise.all([fetchTopics(), loadActiveRound()])
  
  // Set up polling for active round updates every 5 seconds
  const pollInterval = setInterval(async () => {
    await loadActiveRound()
    // Also refresh topics to get updated voting status
    await fetchTopics()
  }, 5000)
  
  // Store interval reference for cleanup
  ;(window as any).__votingPollInterval = pollInterval
  
  // Check if user is new and should see onboarding
  const hasSeenTour = localStorage.getItem('unconference-tour-seen')
  if (!hasSeenTour && topics.value.length > 0) {
    showOnboardingTour.value = true
  }
})

// Cleanup timer and polling on unmount
onBeforeUnmount(() => {
  stopTimer()
  
  // Clear polling interval
  if ((window as any).__votingPollInterval) {
    clearInterval((window as any).__votingPollInterval)
  }
})

const { lgAndUp, mdAndDown } = useDisplay()

const placeholderCount = computed(() => {
  const itemCount = 4 // Using a sample count for grid layout
  
  if (lgAndUp.value) {
    // On large screens (3 columns), calculate padding to next multiple of 3
    const remainder = itemCount % 3
    return remainder === 0 ? 0 : 3 - remainder
  } else if (mdAndDown.value) {
    // On medium and smaller screens (2 columns), add 1 if odd number
    return itemCount % 2 === 0 ? 0 : 1
  }
  return 0
})

const placeholders = computed(() => Array(placeholderCount.value).fill(null))

function formatParticipantName(participantEmail: string) {
  if (participantEmail.includes('@unconference.guest')) {
    return `Guest ${participantEmail.split('_')[1]?.substring(0, 6).toUpperCase() || 'User'}`
  }
  return participantEmail.split('@')[0] || participantEmail
}
</script>

<template>
  <v-container>
    <!-- Active Round Alert Banner -->
    <v-row v-if="activeRound?.isActive" class="mb-4">
      <v-col>
        <v-alert color="success" variant="elevated" prominent>
          <template #prepend>
            <v-icon size="large">mdi-account-group</v-icon>
          </template>
          
          <v-alert-title class="d-flex align-center justify-space-between">
            <span>Round {{ activeRound.roundNumber }} in Progress</span>
            <v-chip color="white" text-color="success" size="large">
              {{ formatTime(timeRemaining) }} remaining
            </v-chip>
          </v-alert-title>
          
          <div class="mt-3">
            <div v-if="userAssignment?.hasAssignment" class="d-flex align-center gap-4">
              <div>
                <strong>Your Topic:</strong> {{ userAssignment.assignment?.topicTitle }}
              </div>
              <div>
                <v-icon class="mr-1">mdi-account-group</v-icon>
                {{ userAssignment.assignment?.participantCount }} participants
              </div>
              <div v-if="userAssignment.assignment?.roomAssignment">
                <v-icon class="mr-1">mdi-map-marker</v-icon>
                {{ userAssignment.assignment?.roomAssignment }}
              </div>
            </div>
            <div v-else class="text-white">
              No topic assignment for this round - join any available discussion
            </div>
            
            <v-progress-linear
              :model-value="((activeRound.duration * 60 - timeRemaining) / (activeRound.duration * 60)) * 100"
              color="white"
              height="6"
              class="mt-3"
              rounded
            ></v-progress-linear>
          </div>
        </v-alert>
      </v-col>
    </v-row>

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
          This event is currently inactive. You can view topics and data, but voting and topic creation are disabled.
          {{ eventStatus?.statusReason }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- Main Navigation Tabs -->
    <v-card class="mb-6">
      <v-tabs v-model="currentTab" color="primary" grow>
        <v-tab
          v-for="tab in tabs"
          :key="tab.key"
          :value="tab.key"
          :prepend-icon="tab.icon"
        >
          {{ tab.title }}
        </v-tab>
      </v-tabs>
    </v-card>

    <!-- Tab Content -->
    <v-window v-model="currentTab">
      <!-- Overview Tab -->
      <v-window-item value="overview">
        <v-row class="mb-6">
          <!-- Event Status Card -->
          <v-col cols="12" md="8">
            <v-card elevation="3">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" color="primary">mdi-chart-line</v-icon>
                Event Overview
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="6" md="3" class="text-center">
                    <div class="text-h3 text-primary">{{ eventStats.totalTopics }}</div>
                    <div class="text-caption text-grey">Total Topics</div>
                  </v-col>
                  <v-col cols="6" md="3" class="text-center">
                    <div class="text-h3 text-success">{{ eventStats.totalPoints }}</div>
                    <div class="text-caption text-grey">Total Points</div>
                  </v-col>
                  <v-col cols="6" md="3" class="text-center">
                    <div class="text-h3 text-warning">{{ eventStats.myVotes }}</div>
                    <div class="text-caption text-grey">My Vote Points</div>
                  </v-col>
                  <v-col cols="6" md="3" class="text-center">
                    <div class="text-h3 text-info">{{ eventStats.activeRoundNumber || 0 }}</div>
                    <div class="text-caption text-grey">Current Round</div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Your Status Card -->
          <v-col cols="12" md="4">
            <v-card elevation="3" :color="hasVotedPreferences ? 'success' : 'warning'" variant="tonal">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">{{ hasVotedPreferences ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
                Your Status
              </v-card-title>
              <v-card-text>
                <div class="mb-3">
                  <div class="d-flex justify-space-between mb-2">
                    <span>Voting Status:</span>
                    <strong>{{ hasVotedPreferences ? 'Complete' : 'Pending' }}</strong>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>1st Choice:</span>
                    <span>{{ userFirstChoice?.title || 'None' }}</span>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>2nd Choice:</span>
                    <span>{{ userSecondChoice?.title || 'None' }}</span>
                  </div>
                  <div v-if="activeRound?.isActive" class="d-flex justify-space-between">
                    <span>Current Group:</span>
                    <span>{{ userAssignment?.hasAssignment ? 'Assigned' : 'Free agent' }}</span>
                  </div>
                </div>
                
                <v-btn
                  v-if="!hasVotedPreferences"
                  color="primary"
                  block
                  @click="currentTab = 'voting'"
                  prepend-icon="mdi-vote"
                >
                  Start Voting
                </v-btn>
                <v-btn
                  v-else-if="activeRound?.isActive && userAssignment?.hasAssignment"
                  color="success"
                  block
                  @click="currentTab = 'groups'"
                  prepend-icon="mdi-account-group"
                >
                  View My Group
                </v-btn>
                <v-btn
                  v-else
                  color="info"
                  block
                  @click="currentTab = 'voting'"
                  prepend-icon="mdi-pencil"
                >
                  Update Votes
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Quick Actions -->
        <v-row class="mb-6">
          <v-col cols="12">
            <h2 class="text-h5 mb-4">Quick Actions</h2>
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-card 
                  class="text-center pa-4 hover-card"
                  color="primary"
                  variant="tonal"
                  @click="currentTab = 'voting'"
                  style="cursor: pointer;"
                >
                  <v-icon icon="mdi-vote" size="48" color="primary" class="mb-3"></v-icon>
                  <h3 class="text-h6 mb-2">Vote on Topics</h3>
                  <p class="text-body-2 text-grey-darken-1">Select your preferred discussion topics</p>
                </v-card>
              </v-col>
              
              <v-col cols="12" sm="6" md="3" v-if="canEditEvent && adminSettings.allowTopicSubmission">
                <v-card 
                  class="text-center pa-4 hover-card"
                  color="success"
                  variant="tonal"
                  @click="topicDialog = true"
                  style="cursor: pointer;"
                >
                  <v-icon icon="mdi-plus-circle" size="48" color="success" class="mb-3"></v-icon>
                  <h3 class="text-h6 mb-2">Propose Topic</h3>
                  <p class="text-body-2 text-grey-darken-1">Suggest a new discussion topic</p>
                </v-card>
              </v-col>
              
              <v-col cols="12" sm="6" md="3" v-if="activeRound?.isActive || userAssignment?.hasAssignment">
                <v-card 
                  class="text-center pa-4 hover-card"
                  color="info"
                  variant="tonal"
                  @click="currentTab = 'groups'"
                  style="cursor: pointer;"
                >
                  <v-icon icon="mdi-account-group" size="48" color="info" class="mb-3"></v-icon>
                  <h3 class="text-h6 mb-2">View Groups</h3>
                  <p class="text-body-2 text-grey-darken-1">See current discussion groups</p>
                </v-card>
              </v-col>
              
              <v-col cols="12" sm="6" md="3" v-if="isAdmin">
                <v-card 
                  class="text-center pa-4 hover-card"
                  color="warning"
                  variant="tonal"
                  @click="$router.push('/groups')"
                  style="cursor: pointer;"
                >
                  <v-icon icon="mdi-cog" size="48" color="warning" class="mb-3"></v-icon>
                  <h3 class="text-h6 mb-2">Manage Rounds</h3>
                  <p class="text-body-2 text-grey-darken-1">Start rounds and manage topics</p>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Voting Tab -->
      <v-window-item value="voting">
        <!-- Voting Status Section -->
        <v-row class="mb-6">
          <v-col>
            <v-card 
              elevation="2" 
              :color="hasVotedPreferences ? 'surface' : 'surface'"
              variant="outlined"
              class="voting-status-card"
              :class="{ 'voting-status-card--voted': hasVotedPreferences }"
            >
              <v-card-title class="text-center py-3">
                <v-icon 
                  :color="hasVotedPreferences ? 'success' : 'primary'" 
                  class="mr-2" 
                  size="default"
                >
                  {{ hasVotedPreferences ? 'mdi-check-circle' : 'mdi-vote' }}
                </v-icon>
                <span 
                  :class="hasVotedPreferences ? 'text-success' : 'text-primary'" 
                  class="text-h6 font-weight-bold"
                >
                  {{ hasVotedPreferences ? 'Your Voting Preferences' : 'Ready to Vote' }}
                </span>
              </v-card-title>
              
              <v-card-text class="text-center py-3">
                <div v-if="hasVotedPreferences" class="voting-summary">
                  <v-row justify="center">
                    <v-col v-if="userFirstChoice" cols="12" sm="6" class="d-flex flex-column align-center">
                      <v-chip
                        color="warning"
                        size="large"
                        prepend-icon="mdi-star"
                        class="mb-3 elevation-2"
                        variant="elevated"
                      >
                        1st Choice
                      </v-chip>
                      <v-card 
                        class="pa-3 mb-2 choice-card first-choice" 
                        elevation="2"
                        width="100%"
                        max-width="320"
                      >
                        <h3 class="text-subtitle-1 text-center mb-2">{{ userFirstChoice.title }}</h3>
                        <p class="text-body-2 text-center text-grey">{{ userFirstChoice.description }}</p>
                      </v-card>
                      <v-chip size="small" color="warning" variant="outlined">
                        Worth 2 points
                      </v-chip>
                    </v-col>
                    
                    <v-col v-if="userSecondChoice" cols="12" sm="6" class="d-flex flex-column align-center">
                      <v-chip
                        color="info"
                        size="large"
                        prepend-icon="mdi-star-half-full"
                        class="mb-3 elevation-2"
                        variant="elevated"
                      >
                        2nd Choice
                      </v-chip>
                      <v-card 
                        class="pa-3 mb-2 choice-card second-choice" 
                        elevation="2"
                        width="100%"
                        max-width="320"
                      >
                        <h3 class="text-subtitle-1 text-center mb-2">{{ userSecondChoice.title }}</h3>
                        <p class="text-body-2 text-center text-grey">{{ userSecondChoice.description }}</p>
                      </v-card>
                      <v-chip size="small" color="info" variant="outlined">
                        Worth 1 point
                      </v-chip>
                    </v-col>
                  </v-row>
                </div>
                
                <div v-else class="text-grey voting-instructions">
                  <div class="instruction-card pa-6 ma-auto" style="max-width: 600px;">
                    <h3 class="text-h6 mb-4 text-center text-primary">
                      <v-icon class="mr-2">mdi-information</v-icon>
                      How to Vote
                    </h3>
                    <v-row class="instruction-steps">
                      <v-col cols="12" sm="6" md="3" class="text-center">
                        <v-avatar color="primary" size="48" class="mb-2">
                          <span class="text-h6 font-weight-bold">1</span>
                        </v-avatar>
                        <div class="text-body-2">
                          <strong>First click</strong><br>
                          1st Choice (⭐⭐)<br>
                          <span class="text-grey">2 points</span>
                        </div>
                      </v-col>
                      <v-col cols="12" sm="6" md="3" class="text-center">
                        <v-avatar color="secondary" size="48" class="mb-2">
                          <span class="text-h6 font-weight-bold">2</span>
                        </v-avatar>
                        <div class="text-body-2">
                          <strong>Second click</strong><br>
                          2nd Choice (⭐)<br>
                          <span class="text-grey">1 point</span>
                        </div>
                      </v-col>
                      <v-col cols="12" sm="6" md="3" class="text-center">
                        <v-avatar color="warning" size="48" class="mb-2">
                          <span class="text-h6 font-weight-bold">3</span>
                        </v-avatar>
                        <div class="text-body-2">
                          <strong>Third click</strong><br>
                          Remove vote<br>
                          <span class="text-grey">0 points</span>
                        </div>
                      </v-col>
                      <v-col cols="12" sm="6" md="3" class="text-center">
                        <v-avatar color="info" size="48" class="mb-2">
                          <span class="text-h6 font-weight-bold">∞</span>
                        </v-avatar>
                        <div class="text-body-2">
                          <strong>Keep voting</strong><br>
                          Update choices<br>
                          <span class="text-grey">Anytime</span>
                        </div>
                      </v-col>
                    </v-row>
                    <v-alert color="info" variant="tonal" class="mt-4 text-left">
                      <v-icon class="mr-2">mdi-lightbulb</v-icon>
                      <strong>Tip:</strong> You can change your votes anytime. Click on any topic below to start!
                    </v-alert>
                  </div>
                </div>
              </v-card-text>
              
              <v-card-actions v-if="hasVotedPreferences && canEditEvent" class="justify-center py-3">
                <v-btn
                  color="white"
                  variant="outlined"
                  @click="resetVotes"
                  prepend-icon="mdi-refresh"
                  size="default"
                  style="text-transform: none; letter-spacing: normal;"
                >
                  Reset All Votes
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- Admin Actions -->
        <v-row class="mb-4">
          <v-col class="d-flex justify-end gap-4">
            <v-btn
              v-if="isAdmin && canEditEvent"
              color="success"
              prepend-icon="mdi-cog"
              :to="'/groups'"
            >
              Manage Rounds
            </v-btn>
            <v-btn
              v-if="canEditEvent && adminSettings.allowTopicSubmission"
              color="primary"
              prepend-icon="mdi-plus"
              @click="topicDialog = true"
            >
              Propose Topic
            </v-btn>
          </v-col>
        </v-row>

        <!-- Voting Disabled Alert -->
        <v-row v-if="isVotingDisabled" class="mb-4">
          <v-col>
            <v-alert
              type="info"
              prominent
              border="start"
              variant="tonal"
              prepend-icon="mdi-vote-off"
            >
              <div class="d-flex align-center">
                <div>
                  <v-alert-title>Voting Disabled</v-alert-title>
                  <div>Voting is disabled during active rounds. You can vote again when the round ends.</div>
                </div>
              </div>
            </v-alert>
          </v-col>
        </v-row>

        <!-- Topics List -->
        <v-row>
          <v-col
            v-for="topic in topics"
            :key="topic.id"
            cols="12"
            sm="6"
            lg="4"
            class="d-flex"
          >
            <v-card 
              class="flex-grow-1 topic-card"
              :class="{
                'border-warning border-lg': userFirstChoice && userFirstChoice.id === topic.id,
                'border-info border-lg': userSecondChoice && userSecondChoice.id === topic.id,
                'first-choice-glow': userFirstChoice && userFirstChoice.id === topic.id,
                'second-choice-glow': userSecondChoice && userSecondChoice.id === topic.id,
                'topic-card--frozen': topic.frozen,
                'topic-card--selected': topic.selectedForRound
              }"
              :elevation="(userFirstChoice && userFirstChoice.id === topic.id) || (userSecondChoice && userSecondChoice.id === topic.id) ? 12 : 3"
            >
              <!-- Topic Header -->
              <v-card-title class="pa-4 pb-2">
                <div class="topic-title-container w-100">
                  <h3 class="text-h6 font-weight-bold mb-1 topic-title">{{ topic.title }}</h3>
                  <div class="topic-chips d-flex flex-wrap gap-1">
                    <!-- User's Choice Indicators -->
                    <v-chip
                      v-if="userFirstChoice && userFirstChoice.id === topic.id"
                      size="small"
                      color="warning"
                      prepend-icon="mdi-star"
                      variant="elevated"
                      class="choice-indicator"
                    >
                      Your 1st Choice
                    </v-chip>
                    <v-chip
                      v-else-if="userSecondChoice && userSecondChoice.id === topic.id"
                      size="small"
                      color="info"
                      prepend-icon="mdi-star-half-full"
                      variant="elevated"
                      class="choice-indicator"
                    >
                      Your 2nd Choice
                    </v-chip>
                    
                    <!-- Status Chips -->
                    <v-chip
                      v-if="topic.badges > 0"
                      size="small"
                      color="success"
                      prepend-icon="mdi-medal"
                      variant="tonal"
                    >
                      {{ topic.badges }} Badge{{ topic.badges > 1 ? 's' : '' }}
                    </v-chip>
                    <v-chip
                      v-if="topic.selectedForRound"
                      size="small"
                      color="success"
                      prepend-icon="mdi-check-circle"
                      variant="tonal"
                    >
                      Selected for round
                    </v-chip>
                    <v-chip
                      v-if="topic.frozen"
                      size="small"
                      color="error"
                      prepend-icon="mdi-snowflake"
                      variant="tonal"
                    >
                      Frozen
                    </v-chip>
                  </div>
                </div>
              </v-card-title>

              <!-- Topic Description -->
              <v-card-text class="px-4 py-2">
                <p class="text-body-1 mb-3 topic-description">{{ topic.description }}</p>
                
                <!-- Voting Score Display -->
                <div class="voting-score-section">
                  <div class="d-flex align-center justify-space-between mb-3">
                    <div class="score-display">
                      <v-chip
                        :color="topic.frozen ? 'error' : 'primary'"
                        size="large"
                        prepend-icon="mdi-trophy"
                        variant="elevated"
                      >
                        {{ topic.totalPreferenceScore || 0 }} points
                      </v-chip>
                    </div>
                    <div class="vote-count text-caption text-grey">
                      {{ topic.votes || 0 }} total votes
                    </div>
                  </div>
                  
                  <!-- Progress Bar -->
                  <v-progress-linear
                    :model-value="Math.min(((topic.totalPreferenceScore || 0) / (VOTE_LIMIT * 2)) * 100, 100)"
                    :color="topic.frozen ? 'error' : 'primary'"
                    height="12"
                    rounded
                    class="mb-3"
                  >
                    <template v-slot:default="{ value }">
                      <small class="text-white font-weight-bold">{{ Math.ceil(value) }}%</small>
                    </template>
                  </v-progress-linear>
                  
                  <!-- Vote Breakdown -->
                  <div class="d-flex justify-space-between">
                    <div class="vote-breakdown">
                      <v-icon size="small" color="warning" class="mr-1">mdi-star</v-icon>
                      <span class="text-caption">
                        {{ topic.firstChoiceVoters?.length || 0 }} × 2pts = {{ (topic.firstChoiceVoters?.length || 0) * 2 }}
                      </span>
                    </div>
                    <div class="vote-breakdown">
                      <v-icon size="small" color="info" class="mr-1">mdi-star-half-full</v-icon>
                      <span class="text-caption">
                        {{ topic.secondChoiceVoters?.length || 0 }} × 1pt = {{ topic.secondChoiceVoters?.length || 0 }}
                      </span>
                    </div>
                  </div>
                </div>
                
                <!-- Voter Names Section (if enabled by admin) -->
                <div v-if="adminSettings.showVoterNames && ((topic.firstChoiceVoters?.length || 0) + (topic.secondChoiceVoters?.length || 0) > 0)" class="mt-4">
                  <v-divider class="mb-3"></v-divider>
                  
                  <!-- First Choice Voters -->
                  <div v-if="topic.firstChoiceVoters?.length" class="mb-3">
                    <div class="text-caption text-grey-darken-1 mb-2 d-flex align-center">
                      <v-icon size="small" color="warning" class="mr-1">mdi-star</v-icon>
                      <strong>1st Choice Voters:</strong>
                    </div>
                    <v-chip-group>
                      <v-chip
                        v-for="voterEmail in topic.firstChoiceVoters"
                        :key="`first-${voterEmail}`"
                        size="small"
                        :color="voterEmail === (user as User)?.email ? 'warning' : 'default'"
                        :variant="voterEmail === (user as User)?.email ? 'elevated' : 'outlined'"
                        prepend-icon="mdi-star"
                      >
                        {{ voterEmail.includes('@unconference.guest') ? 
                             `Guest ${voterEmail.split('_')[1]?.substring(0, 6).toUpperCase()}` :
                             voterEmail.split('@')[0] }}
                      </v-chip>
                    </v-chip-group>
                  </div>
                  
                  <!-- Second Choice Voters -->
                  <div v-if="topic.secondChoiceVoters?.length">
                    <div class="text-caption text-grey-darken-1 mb-2 d-flex align-center">
                      <v-icon size="small" color="info" class="mr-1">mdi-star-half-full</v-icon>
                      <strong>2nd Choice Voters:</strong>
                    </div>
                    <v-chip-group>
                      <v-chip
                        v-for="voterEmail in topic.secondChoiceVoters"
                        :key="`second-${voterEmail}`"
                        size="small"
                        :color="voterEmail === (user as User)?.email ? 'info' : 'default'"
                        :variant="voterEmail === (user as User)?.email ? 'elevated' : 'outlined'"
                        prepend-icon="mdi-star-half-full"
                      >
                        {{ voterEmail.includes('@unconference.guest') ? 
                             `Guest ${voterEmail.split('_')[1]?.substring(0, 6).toUpperCase()}` :
                             voterEmail.split('@')[0] }}
                      </v-chip>
                    </v-chip-group>
                  </div>
                </div>
              </v-card-text>

              <!-- Topic Actions -->
              <v-card-actions class="px-4 pt-0 pb-4">
                <div class="d-flex justify-space-between align-center w-100">
                  <!-- Edit/Delete Actions -->
                  <div class="topic-management-actions">
                    <v-btn
                      v-if="canEditTopic(topic) && canEditEvent"
                      color="primary"
                      variant="text"
                      size="small"
                      prepend-icon="mdi-pencil"
                      @click="startEdit(topic)"
                    >
                      Edit
                    </v-btn>
                    <v-btn
                      v-if="canDeleteTopic(topic) && canEditEvent"
                      color="error"
                      variant="text"
                      size="small"
                      prepend-icon="mdi-delete"
                      @click="deleteTopic(topic)"
                    >
                      Delete
                    </v-btn>
                    <v-btn
                      v-if="isAdmin && !topic.frozen && canEditEvent"
                      color="error"
                      variant="text"
                      size="small"
                      prepend-icon="mdi-snowflake"
                      @click="topicToFreeze = topic; freezeConfirmDialog = true"
                    >
                      Freeze
                    </v-btn>
                  </div>

                  <!-- Vote Button -->
                  <v-btn
                    :color="getVoteStatus(topic).color"
                    :variant="getVoteStatus(topic).variant"
                    :disabled="getVoteStatus(topic).disabled"
                    @click="voteForTopic(topic.id)"
                    class="vote-btn-enhanced"
                    size="large"
                    elevation="4"
                  >
                    <template v-slot:prepend>
                      <v-icon>{{ getVoteStatus(topic).icon }}</v-icon>
                    </template>
                    {{ getVoteStatus(topic).text }}
                  </v-btn>
                </div>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Groups Tab -->
      <v-window-item value="groups">
        <div v-if="userAssignment?.hasAssignment">
          <!-- User's Assignment -->
          <v-card color="primary" variant="elevated" class="mb-6">
            <v-card-title class="text-white">
              <v-icon class="mr-2">mdi-account-check</v-icon>
              Your Assignment
            </v-card-title>
            <v-card-text class="text-white">
              <h3 class="text-h6 mb-2">{{ userAssignment.assignment?.topicTitle }}</h3>
              <p class="mb-2">
                <v-icon class="mr-1">mdi-account-group</v-icon>
                {{ userAssignment.assignment?.participantCount }} participants in this group
              </p>
              <v-chip v-if="userAssignment.assignment?.roomAssignment" color="white" text-color="primary" prepend-icon="mdi-map-marker">
                {{ userAssignment.assignment?.roomAssignment }}
              </v-chip>
              <v-chip v-else color="orange" prepend-icon="mdi-alert">
                Room assignment pending
              </v-chip>
            </v-card-text>
          </v-card>

          <!-- Group Members -->
          <v-card class="mb-6">
            <v-card-title>
              <v-icon class="mr-2">mdi-account-multiple</v-icon>
              Group Members
            </v-card-title>
            <v-card-text>
              <div class="d-flex flex-wrap gap-2">
                <v-chip
                  v-for="participant in userAssignment.assignment?.participants || []"
                  :key="participant"
                  :color="participant === (user as User)?.email ? 'primary' : 'default'"
                  :variant="participant === (user as User)?.email ? 'elevated' : 'outlined'"
                  prepend-icon="mdi-account"
                >
                  {{ participant === (user as User)?.email ? 'You' : formatParticipantName(participant) }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </div>

        <div v-else-if="activeRound?.isActive">
          <v-alert type="info" prominent class="mb-6">
            <v-alert-title>No Group Assignment</v-alert-title>
            <div>Neither of your voted topics was selected for this round. You can join any available discussion group.</div>
          </v-alert>
        </div>

        <div v-else>
          <v-alert type="info" prominent class="text-center">
            <v-alert-title>No Active Groups</v-alert-title>
            <div>Discussion groups are created when an organizer starts a new round. Check back when a round is active!</div>
          </v-alert>
        </div>

        <!-- All Active Groups -->
        <div v-if="activeRound?.isActive && activeRound?.groupAssignments?.length">
          <h2 class="text-h5 mb-4">All Discussion Groups</h2>
          
          <v-row>
            <v-col
              v-for="(group, index) in activeRound.groupAssignments"
              :key="group.topicId"
              cols="12"
              md="6"
              lg="4"
            >
              <v-card 
                elevation="3" 
                :class="{'border-primary': userAssignment?.hasAssignment && userAssignment.assignment?.topicId === group.topicId}"
                class="h-100"
              >
                <v-card-title class="d-flex align-center">
                  <v-avatar
                    :color="userAssignment?.hasAssignment && userAssignment.assignment?.topicId === group.topicId ? 'primary' : 'grey'"
                    size="32"
                    class="mr-3"
                  >
                    <span class="text-white font-weight-bold">{{ index + 1 }}</span>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="text-h6">Group {{ index + 1 }}</div>
                    <div v-if="userAssignment?.hasAssignment && userAssignment.assignment?.topicId === group.topicId" class="text-caption text-primary">
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
                    </div>
                    
                    <div class="d-flex flex-wrap gap-1">
                      <v-chip
                        v-for="participant in group.participants.slice(0, 6)"
                        :key="participant"
                        size="small"
                        :color="participant === (user as User)?.email ? 'primary' : 'grey-lighten-1'"
                        :text-color="participant === (user as User)?.email ? 'white' : 'black'"
                      >
                        {{ participant === (user as User)?.email ? 'You' : formatParticipantName(participant) }}
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
      </v-window-item>
    </v-window>

    <!-- Create Topic Dialog -->
    <v-dialog v-model="topicDialog" max-width="500px">
      <v-card>
        <v-card-title>Propose Discussion Topic</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="createTopic">
            <v-text-field
              v-model="newTopic.title"
              label="Title"
              :rules="[topicRules.required, topicRules.minLength]"
            />
            <v-textarea
              v-model="newTopic.description"
              label="Description"
              :rules="[topicRules.required, topicRules.minLength]"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="error" @click="topicDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            @click="createTopic"
            :disabled="!newTopic.title || !newTopic.description"
          >
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Topic Dialog -->
    <v-dialog v-model="editDialog" max-width="500px">
      <v-card>
        <v-card-title>Edit Topic</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="saveTopic">
            <v-text-field
              v-model="editedTopic.title"
              label="Title"
              :rules="[topicRules.required, topicRules.minLength]"
            />
            <v-textarea
              v-model="editedTopic.description"
              label="Description"
              :rules="[topicRules.required, topicRules.minLength]"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" @click="editDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            @click="saveTopic"
            :disabled="!editedTopic.title || !editedTopic.description"
          >
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Freeze Topic Confirmation Dialog -->
    <v-dialog v-model="freezeConfirmDialog" max-width="400px">
      <v-card>
        <v-card-title>Freeze Topic</v-card-title>
        <v-card-text>
          Are you sure you want to freeze "{{ topicToFreeze?.title }}"? This will:
          <ul class="mt-2">
            <li>Reset all votes to zero</li>
            <li>Allow voters to vote for other topics</li>
            <li>Prevent new votes for this topic</li>
          </ul>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" @click="freezeConfirmDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            @click="freezeTopic"
          >
            Freeze Topic
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Onboarding Tour Dialog -->
    <v-dialog v-model="showOnboardingTour" max-width="600" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="primary">mdi-map-marker-path</v-icon>
          Welcome to the Unconference Dashboard!
        </v-card-title>
        
        <v-card-text>
          <div v-if="tourStep === 0">
            <h3 class="mb-3">🎉 Your New Unified Dashboard</h3>
            <p class="mb-3">
              Everything you need is now in one place! This dashboard combines voting, group management, and event overview into a single, easy-to-navigate interface.
            </p>
            <v-list>
              <v-list-item prepend-icon="mdi-view-dashboard">
                <v-list-item-title><strong>Overview:</strong> See your status and quick stats at a glance</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-vote">
                <v-list-item-title><strong>Vote & Topics:</strong> All voting functionality in one organized tab</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-account-group">
                <v-list-item-title><strong>My Group:</strong> See your discussion group when rounds are active</v-list-item-title>
              </v-list-item>
            </v-list>
            <v-alert color="success" variant="tonal" class="mt-3">
              <div class="text-caption">
                <strong>New:</strong> No more jumping between different pages - everything flows naturally from here!
              </div>
            </v-alert>
          </div>
          
          <div v-if="tourStep === 1">
            <h3 class="mb-3">🗳️ Streamlined Voting Experience</h3>
            <p class="mb-3">
              The voting interface is now cleaner and more intuitive:
            </p>
            <v-alert color="info" variant="tonal" class="mb-3">
              <div><strong>Overview Tab:</strong> Quickly see your voting status and jump to voting</div>
              <div><strong>Vote & Topics Tab:</strong> All topics with clear voting instructions</div>
              <div><strong>Visual Feedback:</strong> Your choices are clearly highlighted</div>
            </v-alert>
            <p>
              Click the "Vote & Topics" tab above to start voting on the topics you want to discuss!
            </p>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-btn 
            v-if="tourStep > 0" 
            color="grey" 
            variant="text" 
            @click="tourStep--"
          >
            Back
          </v-btn>
          
          <v-spacer></v-spacer>
          
          <v-btn 
            color="grey" 
            variant="text" 
            @click="closeTour"
          >
            Skip Tour
          </v-btn>
          
          <v-btn 
            v-if="tourStep < 1" 
            color="primary" 
            @click="tourStep++"
          >
            Next
          </v-btn>
          
          <v-btn 
            v-if="tourStep === 1" 
            color="success" 
            @click="closeTour"
          >
            Get Started!
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
/* Voting Status Card */
.voting-status-card {
  border-radius: 12px !important;
  border-width: 2px !important;
}

.voting-status-card--voted {
  border-color: rgb(var(--v-theme-success)) !important;
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.05) 0%, rgba(var(--v-theme-success), 0.02) 100%) !important;
}

.voting-summary .choice-card {
  border-radius: 8px;
  transition: all 0.3s ease;
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgba(var(--v-theme-outline), 0.2) !important;
}

.voting-summary .choice-card:hover {
  transform: translateY(-1px);
}

.voting-summary .first-choice {
  border: 1px solid rgb(var(--v-theme-warning)) !important;
  background: linear-gradient(135deg, rgba(var(--v-theme-warning), 0.08) 0%, rgba(var(--v-theme-warning), 0.03) 100%) !important;
}

.voting-summary .second-choice {
  border: 1px solid rgb(var(--v-theme-info)) !important;
  background: linear-gradient(135deg, rgba(var(--v-theme-info), 0.08) 0%, rgba(var(--v-theme-info), 0.03) 100%) !important;
}

.instruction-card {
  background: linear-gradient(135deg, rgba(var(--v-theme-surface), 0.8) 0%, rgba(var(--v-theme-surface), 0.4) 100%);
  border-radius: 16px;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.instruction-steps .v-avatar {
  margin-bottom: 8px;
}

/* Topic Cards */
.topic-card {
  border-radius: 16px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, rgba(var(--v-theme-surface), 1) 0%, rgba(var(--v-theme-surface), 0.95) 100%);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.topic-card .v-card-title {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.topic-card .v-card-text {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.topic-title-container {
  min-width: 0; /* Allows flexbox item to shrink below content size */
  max-width: 100%;
}

.topic-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.12) !important;
}

.topic-card--frozen {
  opacity: 0.7;
  background: linear-gradient(135deg, rgba(var(--v-theme-error), 0.05) 0%, rgba(var(--v-theme-surface), 0.95) 100%);
}

.topic-card--selected {
  background: linear-gradient(135deg, rgba(var(--v-theme-success), 0.1) 0%, rgba(var(--v-theme-surface), 0.95) 100%);
  border: 2px solid rgba(var(--v-theme-success), 0.3);
}

.topic-title-container h3 {
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface));
}

.topic-title {
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
  line-height: 1.4 !important;
  max-width: 100%;
  overflow-wrap: break-word;
}

.topic-description {
  word-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
  line-height: 1.5 !important;
  max-width: 100%;
  overflow-wrap: break-word;
  white-space: normal;
}

.topic-chips {
  margin-top: 8px;
}

.choice-indicator {
  font-weight: bold !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* Voting Score Section */
.voting-score-section {
  background: rgba(var(--v-theme-primary), 0.03);
  border-radius: 12px;
  padding: 16px;
  margin: 16px 0;
  border: 1px solid rgba(var(--v-theme-primary), 0.1);
}

.score-display .v-chip {
  font-weight: bold;
  font-size: 0.875rem;
}

.vote-breakdown {
  display: flex;
  align-items: center;
  font-weight: 500;
}

/* Vote Button Enhanced */
.vote-btn-enhanced {
  min-width: 180px;
  font-weight: bold;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 24px !important;
}

.vote-btn-enhanced:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
}

.vote-btn-enhanced:active {
  transform: translateY(0);
}

/* Topic Management Actions */
.topic-management-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

/* Enhanced glow effects */
.first-choice-glow {
  box-shadow: 0 0 32px rgba(255, 193, 7, 0.4), 0 8px 32px rgba(0,0,0,0.12) !important;
  border-width: 3px !important;
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.08) 0%, rgba(var(--v-theme-surface), 0.95) 100%) !important;
}

.second-choice-glow {
  box-shadow: 0 0 32px rgba(33, 150, 243, 0.4), 0 8px 32px rgba(0,0,0,0.12) !important;
  border-width: 3px !important;
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.08) 0%, rgba(var(--v-theme-surface), 0.95) 100%) !important;
}

.border-lg {
  border-width: 3px !important;
}

.border-primary {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
}

.hover-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.hover-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Enhanced Mobile Responsive Design */
@media (max-width: 1280px) {
  .topic-card:hover {
    transform: translateY(-2px); /* Reduced hover effect on tablets */
  }
}

@media (max-width: 960px) {
  /* Tab Navigation */
  .v-tabs {
    margin-bottom: 1rem;
  }
  
  .v-tab {
    min-width: 90px !important;
    font-size: 0.875rem;
  }
  
  /* Overview Tab Mobile Optimizations */
  .hover-card:hover {
    transform: translateY(-2px); /* Reduced hover on mobile */
  }
  
  /* Voting Tab Mobile Optimizations */
  .voting-status-card {
    margin-bottom: 1rem;
  }
  
  .voting-summary .v-col {
    margin-bottom: 16px;
  }
  
  .instruction-card {
    padding: 1rem !important;
  }
  
  .instruction-steps .v-col {
    margin-bottom: 12px;
  }
  
  /* Topic Cards Mobile */
  .topic-management-actions {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: flex-start;
  }
  
  .topic-management-actions .v-btn {
    min-width: 60px;
    font-size: 0.75rem;
    padding: 0 8px;
  }
  
  .vote-btn-enhanced {
    min-width: 140px;
    font-size: 0.875rem;
  }
  
  .topic-title {
    font-size: 1.1rem !important;
    line-height: 1.3 !important;
  }
  
  .topic-description {
    font-size: 0.9rem !important;
  }
  
  /* Groups Tab Mobile */
  .d-flex.gap-2 {
    flex-wrap: wrap;
    gap: 0.5rem !important;
  }
}

@media (max-width: 600px) {
  /* Container and Layout */
  .v-container {
    padding: 12px !important;
  }
  
  /* Alert Banners */
  .v-alert {
    font-size: 0.875rem;
  }
  
  .v-alert .v-chip {
    font-size: 0.75rem;
  }
  
  /* Tab Navigation Mobile */
  .v-tabs {
    margin-bottom: 0.5rem;
  }
  
  .v-tab {
    min-width: 80px !important;
    font-size: 0.8125rem;
    padding: 8px 4px !important;
  }
  
  .v-tab .v-icon {
    margin-right: 4px !important;
    font-size: 16px;
  }
  
  /* Overview Tab Mobile */
  .text-h4 {
    font-size: 1.5rem !important;
  }
  
  .hover-card {
    padding: 1rem !important;
  }
  
  .hover-card .v-icon {
    font-size: 40px !important;
    margin-bottom: 0.75rem !important;
  }
  
  .hover-card h3 {
    font-size: 1rem !important;
    margin-bottom: 0.5rem !important;
  }
  
  .hover-card p {
    font-size: 0.8125rem !important;
    line-height: 1.3 !important;
  }
  
  /* Voting Instructions Mobile */
  .instruction-card {
    padding: 0.75rem !important;
  }
  
  .instruction-steps .v-col {
    margin-bottom: 16px;
    text-align: center;
  }
  
  .instruction-steps .v-avatar {
    width: 36px !important;
    height: 36px !important;
    font-size: 0.875rem;
  }
  
  .instruction-steps .text-body-2 {
    font-size: 0.8125rem !important;
  }
  
  /* Voting Summary Mobile */
  .voting-summary .choice-card {
    max-width: 100% !important;
    margin-bottom: 12px;
  }
  
  .voting-summary .text-subtitle-1 {
    font-size: 1rem !important;
  }
  
  .voting-summary .text-body-2 {
    font-size: 0.8125rem !important;
  }
  
  /* Topic Cards Mobile */
  .topic-card {
    margin-bottom: 1rem;
  }
  
  .topic-card .v-card-title {
    padding: 12px !important;
    padding-bottom: 8px !important;
  }
  
  .topic-card .v-card-text {
    padding: 12px !important;
    padding-top: 8px !important;
  }
  
  .topic-card .v-card-actions {
    padding: 12px !important;
    padding-top: 8px !important;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .topic-management-actions {
    order: 2;
    align-self: stretch;
    justify-content: space-around;
    margin-bottom: 8px;
  }
  
  .topic-management-actions .v-btn {
    flex: 1;
    min-width: unset;
    font-size: 0.75rem;
    padding: 4px 8px;
  }
  
  .vote-btn-enhanced {
    order: 1;
    width: 100%;
    min-width: unset;
    font-size: 0.875rem;
    margin-bottom: 8px;
  }
  
  .topic-title {
    font-size: 1rem !important;
    line-height: 1.3 !important;
    margin-bottom: 8px !important;
  }
  
  .topic-description {
    font-size: 0.85rem !important;
    line-height: 1.4 !important;
    margin-bottom: 12px !important;
  }
  
  .topic-chips {
    margin-top: 4px;
    gap: 4px !important;
  }
  
  .topic-chips .v-chip {
    font-size: 0.6875rem !important;
    height: 20px !important;
  }
  
  /* Voting Score Section Mobile */
  .voting-score-section {
    padding: 12px !important;
    margin: 12px 0 !important;
  }
  
  .score-display .v-chip {
    font-size: 0.75rem !important;
  }
  
  .vote-breakdown {
    font-size: 0.6875rem !important;
  }
  
  .vote-breakdown .v-icon {
    font-size: 12px !important;
  }
  
  /* Groups Tab Mobile */
  .v-card .text-h6 {
    font-size: 1rem !important;
  }
  
  .v-avatar {
    width: 28px !important;
    height: 28px !important;
  }
  
  .v-avatar span {
    font-size: 0.75rem !important;
  }
  
  /* Dialog Mobile Optimizations */
  .v-dialog .v-card {
    margin: 12px;
    max-height: calc(100vh - 48px);
    overflow-y: auto;
  }
  
  .v-dialog .v-card-title {
    padding: 16px 16px 8px !important;
    font-size: 1.125rem !important;
  }
  
  .v-dialog .v-card-text {
    padding: 8px 16px !important;
  }
  
  .v-dialog .v-card-actions {
    padding: 8px 16px 16px !important;
    flex-direction: row;
    justify-content: space-between;
  }
  
  .v-dialog .v-btn {
    min-width: 80px;
  }
  
  /* Form Elements Mobile */
  .v-text-field,
  .v-textarea {
    margin-bottom: 12px !important;
  }
  
  /* Progress Elements */
  .v-progress-linear {
    height: 8px !important;
    margin: 8px 0 !important;
  }
  
  /* Chip Groups Mobile */
  .v-chip-group {
    column-gap: 4px !important;
    row-gap: 4px !important;
  }
  
  .v-chip-group .v-chip {
    font-size: 0.75rem !important;
    height: 24px !important;
  }
  
  /* Remove hover effects on touch devices */
  .topic-card:hover {
    transform: none !important;
  }
  
  .hover-card:hover {
    transform: none !important;
  }
  
  .voting-summary .choice-card:hover {
    transform: none !important;
  }
}

/* Ultra-small screens (phones in landscape or small phones) */
@media (max-width: 480px) {
  .v-container {
    padding: 8px !important;
  }
  
  .v-card {
    border-radius: 8px !important;
  }
  
  .topic-card {
    border-radius: 8px !important;
  }
  
  .v-tabs .v-tab {
    min-width: 70px !important;
    font-size: 0.75rem;
    padding: 6px 2px !important;
  }
  
  .v-tab .v-icon {
    font-size: 14px;
    margin-right: 2px !important;
  }
  
  .hover-card {
    padding: 0.75rem !important;
  }
  
  .topic-card .v-card-title,
  .topic-card .v-card-text,
  .topic-card .v-card-actions {
    padding: 8px !important;
  }
  
  .voting-score-section {
    padding: 8px !important;
  }
}

/* High DPI/Retina displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .topic-card,
  .voting-status-card,
  .hover-card {
    box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  }
}

/* Dark mode mobile optimizations */
@media (max-width: 600px) {
  .v-theme--dark .topic-card {
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .v-theme--dark .voting-status-card {
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .v-theme--dark .instruction-card {
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
}
</style>
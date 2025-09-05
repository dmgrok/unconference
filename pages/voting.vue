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
const VOTE_LIMIT = computed(() => adminSettings.value.maxVotesPerTopic)
const dialog = ref(false)
const editDialog = ref(false)
const freezeConfirmDialog = ref(false)
const showOnboardingTour = ref(false)
const tourStep = ref(0)
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

const isAdmin = computed(() => {
  const userRole = (user.value as any)?.Role || (user.value as any)?.role
  return ['Admin', 'Organizer'].includes(userRole) && !shouldHideAdminFeatures(userRole)
})
const topics = ref<DiscussionTopic[]>([])
const activeRound = ref<ActiveRound | null>(null)
const userAssignment = ref<UserAssignment | null>(null)
const timeRemaining = ref(0)
const timerInterval = ref<NodeJS.Timeout | null>(null)

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

async function createTopic() {
  if (!newTopic.value.title || !newTopic.value.description) return

  const response = await $fetch('/api/topics', {
    method: 'POST',
    body: {
      title: newTopic.value.title,
      description: newTopic.value.description
    }
  })

  // Reset form and close dialog
  newTopic.value = { title: '', description: '' }
  dialog.value = false
  
  // Refresh topics
  await fetchTopics()
}

async function fetchTopics() {
  const response = await $fetch('/api/topics')
  topics.value = response as DiscussionTopic[]
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

const data = ref([
  {
    title: 'Global 1',
    drilldownRoute: 'dashboard-team',
    drilldownParams: {}
  },
  {
    title: 'Global 2',
    drilldownRoute: 'dashboard-team',
    drilldownParams: {}
  },
  {
    title: 'Global 3',
    drilldownRoute: 'dashboard-team',
    drilldownParams: {}
  },
  {
    title: 'Global 4',
    drilldownRoute: 'dashboard-team',
    drilldownParams: {}
  }
])

const { lgAndUp, mdAndDown } = useDisplay()

const placeholderCount = computed(() => {
  const itemCount = data.value.length
  
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

function getVoteStatus(topic: DiscussionTopic) {
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
</script>

<template>
  <v-container>
    <!-- Active Round Display -->
    <v-row v-if="activeRound?.isActive" class="mb-4">
      <v-col>
        <v-card color="success" variant="elevated" class="mb-4">
          <v-card-title class="d-flex align-center text-white">
            <v-icon class="mr-2">mdi-account-group</v-icon>
            Round {{ activeRound.roundNumber }} in Progress
          </v-card-title>
          <v-card-text class="text-white">
            <div class="d-flex align-center justify-space-between">
              <div>
                <h2 class="text-h3 font-weight-bold">
                  {{ formatTime(timeRemaining) }}
                </h2>
                <p class="text-caption">Time Remaining</p>
              </div>
              <div class="text-right">
                <p><strong>{{ activeRound.selectedTopics?.length || 0 }}</strong> topics discussing</p>
                <p class="text-caption">{{ activeRound.duration }} minute round</p>
              </div>
            </div>
            
            <v-progress-linear
              :model-value="((activeRound.duration * 60 - timeRemaining) / (activeRound.duration * 60)) * 100"
              color="white"
              height="6"
              class="mt-3"
            ></v-progress-linear>
          </v-card-text>
        </v-card>
        
        <!-- User's Current Topic Assignment -->
        <v-card v-if="userAssignment?.hasAssignment" color="primary" variant="elevated" class="mb-4">
          <v-card-title class="d-flex align-center text-white">
            <v-icon class="mr-2">mdi-chat</v-icon>
            Your Discussion Topic
          </v-card-title>
          <v-card-text class="text-white">
            <h3 class="text-h5 mb-2">{{ userAssignment.assignment?.topicTitle }}</h3>
            <p class="mb-2">
              <v-icon class="mr-1">mdi-account-group</v-icon>
              {{ userAssignment.assignment?.participantCount }} participants assigned
            </p>
            <div class="d-flex gap-2">
              <v-chip color="white" text-color="primary" prepend-icon="mdi-map-marker">
                {{ userAssignment.assignment?.roomAssignment || 'Check Groups page for room' }}
              </v-chip>
              <v-btn 
                color="white" 
                variant="outlined" 
                size="small" 
                prepend-icon="mdi-account-group"
                to="/groups"
              >
                View Group Details
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
        
        <!-- No Assignment Message -->
        <v-card v-else-if="activeRound?.isActive" color="orange" variant="elevated" class="mb-4">
          <v-card-title class="d-flex align-center text-white">
            <v-icon class="mr-2">mdi-alert</v-icon>
            No Topic Assignment
          </v-card-title>
          <v-card-text class="text-white">
            <p>{{ userAssignment?.message || 'You don\'t have a topic assignment for this round. You can join any available discussion or wait for the next round.' }}</p>
            <v-btn 
              color="white" 
              variant="outlined" 
              size="small" 
              prepend-icon="mdi-account-group"
              to="/groups"
              class="mt-2"
            >
              View All Groups
            </v-btn>
          </v-card-text>
        </v-card>
        
        <!-- Active Discussion Groups Overview -->
        <v-card v-if="activeRound?.isActive && activeRound?.groupAssignments?.length" class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-forum</v-icon>
            Active Discussion Groups
          </v-card-title>
          <v-card-text>
            <div class="mb-3">
              <v-chip 
                color="success" 
                variant="flat" 
                prepend-icon="mdi-clock"
                class="mr-2"
              >
                {{ formatTime(timeRemaining) }} remaining
              </v-chip>
              <v-chip 
                color="info" 
                variant="outlined" 
                prepend-icon="mdi-account-group"
              >
                {{ activeRound.groupAssignments.reduce((sum, group) => sum + group.participants.length, 0) }} participants
              </v-chip>
            </div>
            
            <v-row>
              <v-col
                v-for="group in activeRound.groupAssignments"
                :key="group.topicId"
                cols="12"
                sm="6"
                md="4"
              >
                <v-card 
                  variant="outlined" 
                  :color="userAssignment?.hasAssignment && userAssignment.assignment?.topicId === group.topicId ? 'primary' : 'default'"
                  class="h-100"
                >
                  <v-card-title class="text-body-1 pa-3">
                    <div class="d-flex align-center">
                      <v-icon 
                        :color="userAssignment?.hasAssignment && userAssignment.assignment?.topicId === group.topicId ? 'primary' : 'default'" 
                        class="mr-2"
                        size="small"
                      >
                        {{ userAssignment?.hasAssignment && userAssignment.assignment?.topicId === group.topicId ? 'mdi-account-check' : 'mdi-chat' }}
                      </v-icon>
                      <span class="text-truncate">{{ group.topicTitle }}</span>
                    </div>
                  </v-card-title>
                  <v-card-text class="pa-3 pt-0">
                    <div class="d-flex align-center mb-2">
                      <v-icon size="small" class="mr-1">mdi-account-group</v-icon>
                      <span class="text-caption">{{ group.participants.length }} participants</span>
                    </div>
                    <div v-if="group.roomAssignment" class="d-flex align-center">
                      <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                      <span class="text-caption">{{ group.roomAssignment }}</span>
                    </div>
                    <div v-if="userAssignment?.hasAssignment && userAssignment.assignment?.topicId === group.topicId" class="mt-2">
                      <v-chip size="small" color="primary" variant="flat">
                        Your Group
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            
            <div class="mt-3 text-center">
              <v-btn 
                color="primary" 
                variant="outlined" 
                size="small" 
                prepend-icon="mdi-account-group"
                to="/groups"
              >
                View Detailed Group Information
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Admin Actions -->
    <v-row class="mb-4">
      <v-col class="d-flex justify-end gap-4">
        <v-btn
          v-if="isAdmin"
          color="success"
          prepend-icon="mdi-cog"
          :to="'/groups'"
        >
          Manage Rounds
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="dialog = true"
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

    <!-- Current Vote Status - More Prominent Display -->
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
          
          <v-card-actions v-if="hasVotedPreferences" class="justify-center py-3">
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
                  v-if="canEditTopic(topic)"
                  color="primary"
                  variant="text"
                  size="small"
                  prepend-icon="mdi-pencil"
                  @click="startEdit(topic)"
                >
                  Edit
                </v-btn>
                <v-btn
                  v-if="canDeleteTopic(topic)"
                  color="error"
                  variant="text"
                  size="small"
                  prepend-icon="mdi-delete"
                  @click="deleteTopic(topic)"
                >
                  Delete
                </v-btn>
                <v-btn
                  v-if="isAdmin && !topic.frozen"
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

    <!-- Create Topic Dialog -->
    <v-dialog v-model="dialog" max-width="500px">
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
          <v-btn color="error" @click="dialog = false">Cancel</v-btn>
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
          Welcome to the Unconference!
        </v-card-title>
        
        <v-card-text>
          <div v-if="tourStep === 0">
            <h3 class="mb-3">🎉 Welcome to the Unconference Platform!</h3>
            <p class="mb-3">
              You're now connected to <strong>your specific event</strong>. This dashboard is your home base where you can:
            </p>
            <v-list>
              <v-list-item prepend-icon="mdi-lightbulb">
                <v-list-item-title>Propose discussion topics you're passionate about</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-vote">
                <v-list-item-title>Vote for topics you want to discuss (1st & 2nd choice)</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-account-group">
                <v-list-item-title>Join assigned discussion groups when rounds start</v-list-item-title>
              </v-list-item>
            </v-list>
            <v-alert color="info" variant="tonal" class="mt-3">
              <div class="text-caption">
                <strong>Remember:</strong> You're part of a specific event community. All topics and discussions are for your event only.
              </div>
            </v-alert>
          </div>
          
          <div v-if="tourStep === 1">
            <h3 class="mb-3">🗳️ Voting Made Simple</h3>
            <p class="mb-3">
              Each topic card has a <strong>Vote</strong> button. Here's how it works:
            </p>
            <v-alert color="info" variant="tonal" class="mb-3">
              <div><strong>1st click:</strong> Makes it your 1st Choice (⭐⭐) - Worth 2 points</div>
              <div><strong>2nd click:</strong> Makes it your 2nd Choice (⭐) - Worth 1 point</div>
              <div><strong>3rd click:</strong> Removes your vote</div>
            </v-alert>
            <p>
              You can only have one 1st choice and one 2nd choice at a time. 
              The topics with the most points get selected for discussion rounds!
            </p>
          </div>
          
          <div v-if="tourStep === 2">
            <h3 class="mb-3">🧭 Navigation Tour</h3>
            <p class="mb-3">Use the menu (☰) to explore:</p>
            <v-list density="compact">
              <v-list-item>
                <template #prepend>
                  <v-icon color="primary">mdi-view-dashboard</v-icon>
                </template>
                <v-list-item-title><strong>Dashboard:</strong> Main hub - propose topics, vote, see rounds</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon color="secondary">mdi-vote</v-icon>
                </template>
                <v-list-item-title><strong>Vote Preferences:</strong> Detailed voting page with descriptions</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon color="warning">mdi-trophy</v-icon>
                </template>
                <v-list-item-title><strong>Top Topics:</strong> Leaderboard of highest-voted topics</v-list-item-title>
              </v-list-item>
              <v-list-item>
                <template #prepend>
                  <v-icon color="success">mdi-account-group</v-icon>
                </template>
                <v-list-item-title><strong>Groups:</strong> See your discussion group assignments</v-list-item-title>
              </v-list-item>
            </v-list>
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
            v-if="tourStep < 2" 
            color="primary" 
            @click="tourStep++"
          >
            Next
          </v-btn>
          
          <v-btn 
            v-if="tourStep === 2" 
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

/* Legacy vote button (fallback) */
.vote-btn {
  min-width: 140px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.vote-btn:hover {
  transform: scale(1.05);
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .topic-management-actions {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .vote-btn-enhanced {
    min-width: 140px;
    font-size: 0.875rem;
  }
  
  .voting-summary .v-col {
    margin-bottom: 16px;
  }
  
  .topic-title {
    font-size: 1.1rem !important;
    line-height: 1.3 !important;
  }
  
  .topic-description {
    font-size: 0.9rem !important;
  }
}

@media (max-width: 600px) {
  .instruction-steps .v-col {
    margin-bottom: 16px;
  }
  
  .score-display .v-chip {
    font-size: 0.75rem;
  }
  
  .vote-btn-enhanced {
    width: 100%;
    min-width: unset;
  }
  
  .topic-title {
    font-size: 1rem !important;
    line-height: 1.3 !important;
  }
  
  .topic-description {
    font-size: 0.85rem !important;
    line-height: 1.4 !important;
  }
  
  .topic-card .v-card-title {
    padding: 12px !important;
    padding-bottom: 8px !important;
  }
  
  .topic-card .v-card-text {
    padding: 12px !important;
    padding-top: 8px !important;
  }
}
</style>

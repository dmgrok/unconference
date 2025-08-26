<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
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
const { settings: adminSettings, loadSettings } = useAdminSettings()
const { shouldHideAdminFeatures, getEffectiveRole } = useViewerMode()
const VOTE_LIMIT = computed(() => adminSettings.value.maxVotesPerTopic)
const dialog = ref(false)
const editDialog = ref(false)
const newRoundConfirmDialog = ref(false)
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

const isAdmin = computed(() => (user.value as User)?.role === 'Admin' && !shouldHideAdminFeatures((user.value as User)?.role))
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

async function startNewRound() {
  try {
    await $fetch('/api/topics/new-round', {
      method: 'POST'
    })
    newRoundConfirmDialog.value = false
    await Promise.all([fetchTopics(), loadActiveRound()])
  } catch (error) {
    console.error('Failed to start new round:', error)
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
    console.error('Failed to edit topic:', error)
  }
}

// Fetch topics when component mounts
onMounted(async () => {
  await loadSettings()
  await Promise.all([fetchTopics(), loadActiveRound()])
  
  // Check if user is new and should see onboarding
  const hasSeenTour = localStorage.getItem('unconference-tour-seen')
  if (!hasSeenTour && topics.value.length > 0) {
    showOnboardingTour.value = true
  }
})

// Cleanup timer on unmount
onBeforeUnmount(() => {
  stopTimer()
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
    return { status: 'disabled', text: 'Voting Disabled', color: 'grey', variant: 'outlined' as const, disabled: true }
  }
  
  if (userFirstChoice.value && userFirstChoice.value.id === topic.id) {
    return { status: 'first', text: '1st Choice ⭐', color: 'warning', variant: 'elevated' as const }
  }
  if (userSecondChoice.value && userSecondChoice.value.id === topic.id) {
    return { status: 'second', text: '2nd Choice ⭐', color: 'info', variant: 'elevated' as const }
  }
  if (topic.frozen) {
    return { status: 'frozen', text: 'Topic Frozen', color: 'error', variant: 'outlined' as const, disabled: true }
  }
  if (topic.votes >= VOTE_LIMIT.value) {
    return { status: 'full', text: `Full (${VOTE_LIMIT.value}/${VOTE_LIMIT.value})`, color: 'grey', variant: 'outlined' as const, disabled: true }
  }
  
  // Determine what happens if they vote
  if (!userFirstChoice.value) {
    return { status: 'vote-first', text: 'Vote (1st Choice)', color: 'primary', variant: 'elevated' as const }
  } else if (!userSecondChoice.value) {
    return { status: 'vote-second', text: 'Vote (2nd Choice)', color: 'secondary', variant: 'elevated' as const }
  } else {
    return { status: 'vote-replace', text: 'Vote (Replace 1st)', color: 'primary', variant: 'outlined' as const }
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
                <p><strong>{{ activeRound.selectedTopics.length }}</strong> topics discussing</p>
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
      </v-col>
    </v-row>

    <!-- Admin Actions -->
    <v-row class="mb-4">
      <v-col class="d-flex justify-end gap-4">
        <v-btn
          v-if="isAdmin"
          color="success"
          prepend-icon="mdi-cog"
          :to="'/admin/round-management'"
        >
          Manage Rounds
        </v-btn>
        <v-btn
          v-if="isAdmin && !activeRound?.isActive"
          color="error"
          prepend-icon="mdi-refresh"
          @click="newRoundConfirmDialog = true"
        >
          Quick New Round
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
          elevation="4" 
          :color="hasVotedPreferences ? 'primary' : 'grey-lighten-4'"
          :variant="hasVotedPreferences ? 'elevated' : 'outlined'"
        >
          <v-card-title class="text-center">
            <v-icon :color="hasVotedPreferences ? 'white' : 'grey'" class="mr-2">
              {{ hasVotedPreferences ? 'mdi-check-circle' : 'mdi-vote' }}
            </v-icon>
            <span :class="hasVotedPreferences ? 'text-white' : 'text-grey'">
              {{ hasVotedPreferences ? 'Your Voting Preferences' : 'Ready to Vote' }}
            </span>
          </v-card-title>
          
          <v-card-text class="text-center">
            <div v-if="hasVotedPreferences" class="d-flex justify-center align-center flex-wrap gap-4">
              <div v-if="userFirstChoice" class="d-flex flex-column align-center">
                <v-chip
                  color="warning"
                  size="large"
                  prepend-icon="mdi-star"
                  class="mb-2"
                >
                  1st Choice
                </v-chip>
                <h3 class="text-white text-center">{{ userFirstChoice.title }}</h3>
              </div>
              
              <v-divider v-if="userFirstChoice && userSecondChoice" vertical class="mx-4"></v-divider>
              
              <div v-if="userSecondChoice" class="d-flex flex-column align-center">
                <v-chip
                  color="info"
                  size="large"
                  prepend-icon="mdi-star-half-full"
                  class="mb-2"
                >
                  2nd Choice
                </v-chip>
                <h3 class="text-white text-center">{{ userSecondChoice.title }}</h3>
              </div>
            </div>
            
            <div v-else class="text-grey">
              <p class="mb-2 text-center">
                <strong>Direct Voting Instructions:</strong>
              </p>
              <ul class="text-left">
                <li>🥇 <strong>First click</strong> = 1st Choice (2 points)</li>
                <li>🥈 <strong>Second click</strong> = 2nd Choice (1 point)</li>
                <li>🔄 <strong>Click again</strong> = Remove vote</li>
                <li>📝 <strong>Third click</strong> = Replace 1st choice</li>
              </ul>
              <p class="text-center mt-3 text-caption">
                Click on any topic below to start voting!
              </p>
            </div>
          </v-card-text>
          
          <v-card-actions v-if="hasVotedPreferences" class="justify-center">
            <v-btn
              color="white"
              variant="outlined"
              :to="'/preferences'"
              prepend-icon="mdi-pencil"
              class="mr-2"
            >
              Advanced Voting
            </v-btn>
            <v-btn
              color="warning"
              variant="outlined"
              @click="resetVotes"
              prepend-icon="mdi-refresh"
            >
              Reset Votes
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
          class="flex-grow-1"
          :class="{
            'border-warning border-lg': userFirstChoice && userFirstChoice.id === topic.id,
            'border-info border-lg': userSecondChoice && userSecondChoice.id === topic.id,
            'first-choice-glow': userFirstChoice && userFirstChoice.id === topic.id,
            'second-choice-glow': userSecondChoice && userSecondChoice.id === topic.id
          }"
          :elevation="(userFirstChoice && userFirstChoice.id === topic.id) || (userSecondChoice && userSecondChoice.id === topic.id) ? 8 : 2"
        >
          <v-card-title class="d-flex align-center">
            {{ topic.title }}
            
            <!-- User's Choice Indicators -->
            <v-chip
              v-if="userFirstChoice && userFirstChoice.id === topic.id"
              size="small"
              color="warning"
              class="ml-2"
              prepend-icon="mdi-star"
              variant="elevated"
            >
              Your 1st Choice
            </v-chip>
            <v-chip
              v-else-if="userSecondChoice && userSecondChoice.id === topic.id"
              size="small"
              color="info"
              class="ml-2"
              prepend-icon="mdi-star-half-full"
              variant="elevated"
            >
              Your 2nd Choice
            </v-chip>
            
            <!-- Other Status Chips -->
            <v-chip
              v-if="topic.badges > 0"
              size="small"
              color="success"
              class="ml-2"
              prepend-icon="mdi-medal"
            >
              {{ topic.badges }} Badge{{ topic.badges > 1 ? 's' : '' }}
            </v-chip>
            <v-chip
              v-if="topic.selectedForRound"
              size="small"
              color="success"
              class="ml-2"
              prepend-icon="mdi-check-circle"
            >
              Selected for round
            </v-chip>
            <v-chip
              v-if="topic.frozen"
              size="small"
              color="error"
              class="ml-2"
              prepend-icon="mdi-snowflake"
            >
              Frozen
            </v-chip>
          </v-card-title>
          <v-card-text>
            <p>{{ topic.description }}</p>
            
            <!-- Preference Voting Display -->
            <div class="mt-3">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption font-weight-bold">Preference Score: {{ topic.totalPreferenceScore || 0 }} points</span>
                <span class="text-caption">{{ topic.votes || 0 }} total votes</span>
              </div>
              <div class="d-flex align-center mt-2 gap-2">
                <v-progress-linear
                  :model-value="((topic.totalPreferenceScore || 0) / (VOTE_LIMIT * 2)) * 100"
                  :color="topic.frozen ? 'error' : 'primary'"
                  height="8"
                  rounded
                ></v-progress-linear>
                <span class="text-caption">{{ topic.totalPreferenceScore || 0 }}/{{ VOTE_LIMIT * 2 }}</span>
              </div>
              
              <!-- Breakdown of votes -->
              <div class="d-flex gap-4 mt-2">
                <div class="text-caption">
                  <v-icon size="small" color="primary">mdi-star</v-icon>
                  1st choices: {{ topic.firstChoiceVoters?.length || 0 }} ({{ (topic.firstChoiceVoters?.length || 0) * 2 }} pts)
                </div>
                <div class="text-caption">
                  <v-icon size="small" color="secondary">mdi-star-half-full</v-icon>
                  2nd choices: {{ topic.secondChoiceVoters?.length || 0 }} ({{ topic.secondChoiceVoters?.length || 0 }} pts)
                </div>
              </div>
            </div>
            
            <!-- Voter Names Section (if enabled by admin) -->
            <div v-if="adminSettings.showVoterNames && ((topic.firstChoiceVoters?.length || 0) + (topic.secondChoiceVoters?.length || 0) > 0)" class="mt-3">
              <v-divider class="mb-2"></v-divider>
              
              <!-- First Choice Voters -->
              <div v-if="topic.firstChoiceVoters?.length" class="mb-2">
                <div class="text-caption text-grey-darken-1 mb-1">
                  <v-icon size="small" color="primary">mdi-star</v-icon>
                  1st Choice Voters:
                </div>
                <v-chip-group>
                  <v-chip
                    v-for="voterEmail in topic.firstChoiceVoters"
                    :key="`first-${voterEmail}`"
                    size="small"
                    :color="voterEmail === (user as User)?.email ? 'primary' : 'default'"
                    variant="outlined"
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
                <div class="text-caption text-grey-darken-1 mb-1">
                  <v-icon size="small" color="secondary">mdi-star-half-full</v-icon>
                  2nd Choice Voters:
                </div>
                <v-chip-group>
                  <v-chip
                    v-for="voterEmail in topic.secondChoiceVoters"
                    :key="`second-${voterEmail}`"
                    size="small"
                    :color="voterEmail === (user as User)?.email ? 'secondary' : 'default'"
                    variant="outlined"
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
          <v-card-actions>
            <v-btn
              v-if="canEditTopic(topic)"
              color="primary"
              variant="text"
              prepend-icon="mdi-pencil"
              @click="startEdit(topic)"
            >
              Edit
            </v-btn>
            <v-btn
              v-if="isAdmin && !topic.frozen"
              color="error"
              variant="text"
              prepend-icon="mdi-snowflake"
              @click="topicToFreeze = topic; freezeConfirmDialog = true"
            >
              Freeze
            </v-btn>
            <v-spacer />
            <v-btn
              :color="getVoteStatus(topic).color"
              :variant="getVoteStatus(topic).variant"
              :disabled="getVoteStatus(topic).disabled"
              @click="voteForTopic(topic.id)"
              class="vote-btn"
            >
              {{ getVoteStatus(topic).text }}
            </v-btn>
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

    <!-- New Round Confirmation Dialog -->
    <v-dialog v-model="newRoundConfirmDialog" max-width="400px">
      <v-card>
        <v-card-title>Quick Start New Round</v-card-title>
        <v-card-text>
          Are you sure you want to start a new round? This will:
          <ul class="mt-2">
            <li>Award badges to top 10 topics</li>
            <li>Reset all vote counters</li>
            <li>Allow users to vote again</li>
          </ul>
          <v-alert type="info" class="mt-3">
            For advanced round management with topic selection, use the "Manage Rounds" button.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="grey" @click="newRoundConfirmDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            @click="startNewRound"
          >
            Start New Round
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
.vote-btn {
  min-width: 140px;
  font-weight: bold;
  transition: all 0.3s ease;
}

.vote-btn:hover {
  transform: scale(1.05);
}

.first-choice-glow {
  box-shadow: 0 0 20px rgba(255, 193, 7, 0.5) !important;
  border-width: 3px !important;
}

.second-choice-glow {
  box-shadow: 0 0 20px rgba(33, 150, 243, 0.5) !important;
  border-width: 3px !important;
}

.border-lg {
  border-width: 3px !important;
}
</style>

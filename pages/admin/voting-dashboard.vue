<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { DiscussionTopic } from '~/types/topic'

definePageMeta({
  middleware: 'authenticated'
})

const { user } = useUserSession()

// Check if user is admin or organizer - defensive approach with reactivity
const hasAccess = ref(false)

// Watch user changes and update access
watch(user, (newUser) => {
  const userRole = (newUser as any)?.Role || (newUser as any)?.role
  hasAccess.value = ['Admin', 'Organizer'].includes(userRole)
}, { immediate: true })
const config = useRuntimeConfig()
const VOTE_LIMIT = config.public.maxVotesPerTopic

const topics = ref<DiscussionTopic[]>([])
const refreshInterval = ref<NodeJS.Timeout | null>(null)
const isFullscreen = ref(false)
const showRoomAssignments = ref(false)
const previousVoteCounts = ref<Record<string, number>>({})
const showNewVoteAnimation = ref<Record<string, boolean>>({})
const rooms = ref<any[]>([])
const roomAssignments = ref<any[]>([])
const qrCodeUrl = ref<string>('')
const joinUrl = ref<string>('')
const loadingQR = ref(false)
const newRoundDialog = ref(false)
const roundDuration = ref(20)
const startingRound = ref(false)
const topicSelections = ref<any[]>([])
const participantDetailsDialog = ref(false)
const selectedGroupForDetails = ref<any>(null)

// Active round management
const activeRound = ref<any>(null)
const timeRemaining = ref(0)
const timerInterval = ref<NodeJS.Timeout | null>(null)
const users = ref<any[]>([]) // Store user data for participant name formatting
const endedRounds = ref<Set<string>>(new Set()) // Track which rounds have ended

interface TopicSelection {
  topicId: string
  title: string
  description: string
  totalPreferenceScore: number
  participantCount: number
  selected: boolean
}

// Sound for new votes (using Web Audio API)
const playVoteSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1)
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  } catch (error) {
    // Silently fail if audio context is not available
    console.log('Audio not available')
  }
}

// Sound for round ending (using Web Audio API)
const playRoundEndSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Create a more prominent sound for round ending
    const oscillator1 = audioContext.createOscillator()
    const oscillator2 = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator1.connect(gainNode)
    oscillator2.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Two-tone chime
    oscillator1.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator2.frequency.setValueAtTime(600, audioContext.currentTime)
    
    oscillator1.frequency.setValueAtTime(1000, audioContext.currentTime + 0.3)
    oscillator2.frequency.setValueAtTime(750, audioContext.currentTime + 0.3)
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6)
    
    oscillator1.start(audioContext.currentTime)
    oscillator1.stop(audioContext.currentTime + 0.6)
    oscillator2.start(audioContext.currentTime)
    oscillator2.stop(audioContext.currentTime + 0.6)
  } catch (error) {
    // Silently fail if audio context is not available
    console.log('Audio not available')
  }
}

// Colors for the pixel art bars - improved contrast and retro palette
const pixelColors = [
  '#FF0080', '#00FFFF', '#FFFF00', '#FF8000', '#8000FF',
  '#FF4080', '#40FF80', '#8040FF', '#FF0040', '#00FF40',
  '#4080FF', '#FF4000', '#80FF00', '#0080FF', '#FF8040'
]

// Retro background colors for ranks
const rankColors = [
  '#FFD700', // Gold for #1
  '#C0C0C0', // Silver for #2  
  '#CD7F32', // Bronze for #3
  '#FF6B6B', // Others
  '#4ECDC4'
]

const sortedTopics = computed(() => {
  return [...topics.value]
    .sort((a, b) => (b.totalPreferenceScore || 0) - (a.totalPreferenceScore || 0))
    .slice(0, 15) // Show top 15 topics
})

const maxScore = computed(() => {
  return Math.max(...sortedTopics.value.map(t => t.totalPreferenceScore || 0), 1)
})

const getBarWidth = (score: number) => {
  return Math.max((score / maxScore.value) * 100, 2) // Minimum 2% width
}

const getPixelColor = (index: number) => {
  return pixelColors[index % pixelColors.length]
}

const getRankColor = (index: number) => {
  if (index === 0) return rankColors[0] // Gold
  if (index === 1) return rankColors[1] // Silver
  if (index === 2) return rankColors[2] // Bronze
  return rankColors[3 + (index % 2)] // Alternate between remaining colors
}

const getRegistrationCount = (topic: DiscussionTopic) => {
  return (topic.firstChoiceVoters?.length || 0) + (topic.secondChoiceVoters?.length || 0)
}

const getPixelStickFigures = (count: number) => {
  return '🚶'.repeat(Math.min(count, 20)) + (count > 20 ? `+${count - 20}` : '')
}

const getTruncatedTitle = (title: string, maxLength: number = 45) => {
  return title.length > maxLength ? title.substring(0, maxLength) + '...' : title
}

const getTruncatedDescription = (description: string, maxLength: number = 80) => {
  if (!description) return ''
  return description.length > maxLength ? description.substring(0, maxLength) + '...' : description
}

const totalVotes = computed(() => {
  return topics.value.reduce((sum, topic) => sum + (topic.totalPreferenceScore || 0), 0)
})

const totalVoters = computed(() => {
  const allVoters = new Set()
  topics.value.forEach(topic => {
    topic.firstChoiceVoters?.forEach(voter => allVoters.add(voter))
    topic.secondChoiceVoters?.forEach(voter => allVoters.add(voter))
  })
  return allVoters.size
})

const totalRegistrations = computed(() => {
  return topics.value.reduce((sum, topic) => sum + (topic.firstChoiceVoters?.length || 0) + (topic.secondChoiceVoters?.length || 0), 0)
})

async function fetchTopics() {
  try {
    const response = await $fetch('/api/topics')
    const newTopics = response as DiscussionTopic[]
    
    // Check for new votes and trigger animations/sounds
    if (topics.value.length > 0) {
      newTopics.forEach(topic => {
        const previousScore = previousVoteCounts.value[topic.id] || 0
        const currentScore = topic.totalPreferenceScore || 0
        if (currentScore > previousScore) {
          // New vote detected!
          playVoteSound()
          showNewVoteAnimation.value[topic.id] = true
          
          // Clear animation after 2 seconds
          setTimeout(() => {
            showNewVoteAnimation.value[topic.id] = false
          }, 2000)
        }
        previousVoteCounts.value[topic.id] = currentScore
      })
    } else {
      // Initial load - just store the scores
      newTopics.forEach(topic => {
        previousVoteCounts.value[topic.id] = topic.totalPreferenceScore || 0
      })
    }
    
    topics.value = newTopics
  } catch (error) {
    console.error('Error fetching topics:', error)
  }
}

async function generateQRCodeForDashboard() {
  loadingQR.value = true
  try {
    // Try to get admin settings to use existing event code
    const adminSettings = await $fetch('/api/admin/settings')
    
    let eventCode = 'CONF2025'
    let eventName = 'Unconference Event'
    
    if (adminSettings?.eventCode) {
      eventCode = adminSettings.eventCode
    }
    if (adminSettings?.eventName) {
      eventName = adminSettings.eventName
    }
    
    const response = await $fetch('/api/admin/generate-qr', {
      method: 'POST',
      body: {
        eventCode,
        eventName
      }
    })
    
    qrCodeUrl.value = (response as any).qrCode
    joinUrl.value = (response as any).joinUrl
  } catch (error) {
    console.error('Error generating QR code for dashboard:', error)
    // Create a fallback join URL
    const protocol = window.location.protocol
    const host = window.location.host
    joinUrl.value = `${protocol}//${host}/quick-join`
  } finally {
    loadingQR.value = false
  }
}

async function fetchRoomAssignments() {
  try {
    const [roomsResponse, groupsResponse] = await Promise.all([
      $fetch('/api/admin/rooms'),
      $fetch('/api/admin/groups')
    ])
    
    rooms.value = (roomsResponse as any)?.rooms || []
    roomAssignments.value = (groupsResponse as any)?.groups || []
  } catch (error) {
    console.error('Error fetching room assignments:', error)
    // Create mock data for demonstration
    roomAssignments.value = topics.value
      .filter(topic => topic.selectedForRound)
      .slice(0, 5)
      .map((topic, index) => ({
        topicId: topic.id,
        topicTitle: topic.title,
        roomName: `Room ${String.fromCharCode(65 + index)}`, // Room A, B, C, etc.
        participants: [
          ...(topic.firstChoiceVoters || []).slice(0, 4),
          ...(topic.secondChoiceVoters || []).slice(0, 2)
        ].map(email => email.includes('@unconference.guest') ? 
          `Guest ${email.split('_')[1]?.substring(0, 6).toUpperCase()}` :
          email.split('@')[0])
      }))
  }
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

function startAutoRefresh() {
  refreshInterval.value = setInterval(() => {
    fetchTopics()
    loadActiveRound()
  }, 2000) // Refresh every 2 seconds
}

function stopAutoRefresh() {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

// Active round management functions
async function loadActiveRound() {
  try {
    const data = await $fetch('/api/active-round')
    activeRound.value = data
    
    if (activeRound.value) {
      // Check if this round has been marked as ended
      if (endedRounds.value.has(activeRound.value.id)) {
        activeRound.value.hasEnded = true
      }
      
      // Check if round has naturally expired (server-side logic marks it as inactive)
      if (!activeRound.value.isActive && !activeRound.value.hasEnded) {
        const startTime = new Date(activeRound.value.startTime)
        const now = new Date()
        const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60)
        
        if (elapsedMinutes >= activeRound.value.duration) {
          activeRound.value.hasEnded = true
          endedRounds.value.add(activeRound.value.id)
        }
      }
      
      if (activeRound.value.isActive && !activeRound.value.hasEnded) {
        startTimer()
        // Clean up old ended rounds when a new active round starts
        endedRounds.value.clear()
      } else {
        stopTimer()
      }
    } else {
      stopTimer()
    }
  } catch (error) {
    console.error('Failed to load active round:', error)
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
    
    if (remaining <= 0 && activeRound.value!.isActive) {
      // Round just ended - play sound and mark as ended but keep displaying
      playRoundEndSound()
      activeRound.value!.isActive = false
      activeRound.value!.hasEnded = true
      endedRounds.value.add(activeRound.value!.id) // Track this round as ended
      // Keep the timer running to show 00:00
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

// Helper function for participant count
const getTotalParticipants = (groupAssignments: any[]) => {
  return groupAssignments.reduce((sum: number, group: any) => sum + group.participants.length, 0)
}

// Load user data for participant name formatting
async function loadUsers() {
  try {
    // For now, we'll populate users data when we get the active round that has participants
    // This will be loaded server-side in the group assignments API
    users.value = []
  } catch (error) {
    console.error('Failed to load users data:', error)
    users.value = []
  }
}

// Helper function to get participant details (name, not role)
const getParticipantDetails = (participantEmail: string) => {
  const userDetail = users.value.find((u: any) => 
    u.Email?.toLowerCase() === participantEmail.toLowerCase()
  )
  
  if (userDetail) {
    return {
      name: `${userDetail.Firstname || ''} ${userDetail.Lastname || ''}`.trim(),
      email: userDetail.Email,
      role: userDetail.Role
    }
  }
  
  if (participantEmail.includes('@unconference.guest')) {
    return {
      name: `Guest ${participantEmail.split('_')[1]?.substring(0, 4).toUpperCase() || 'User'}`,
      email: participantEmail,
      role: 'Guest'
    }
  }
  
  return {
    name: participantEmail.split('@')[0] || participantEmail,
    email: participantEmail,
    role: 'User'
  }
}

// Format participant name for display
const formatParticipantName = (participantEmail: string) => {
  const details = getParticipantDetails(participantEmail)
  return details.name || details.email.split('@')[0]
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
    } else if (selectedTopics.value.length < 8) { // Max 8 topics
      topic.selected = true
    }
  }
}

const selectedTopics = computed(() => 
  topicSelections.value.filter(topic => topic.selected)
)

const canStartRound = computed(() => 
  selectedTopics.value.length > 0 && selectedTopics.value.length <= 8
)

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
    await Promise.all([fetchTopics(), loadActiveRound()])
    
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
  roundDuration.value = 20
}

function showParticipantDetailsDialog(group: any) {
  selectedGroupForDetails.value = group
  participantDetailsDialog.value = true
}

onMounted(() => {
  fetchTopics()
  fetchRoomAssignments()
  generateQRCodeForDashboard()
  loadActiveRound()
  loadUsers()
  startAutoRefresh()
  
  // Listen for fullscreen changes
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  stopAutoRefresh()
  stopTimer()
})
</script>

<template>
  <div v-if="!hasAccess" class="d-flex justify-center align-center fill-height">
    <v-card class="pa-8 text-center" max-width="500">
      <v-card-title class="text-h4 mb-4">
        <v-icon size="48" color="warning" class="mr-2">mdi-shield-alert</v-icon>
        Access Restricted
      </v-card-title>
      <v-card-text>
        <p class="text-body-1 mb-4">
          This voting dashboard is only accessible to event organizers and administrators.
        </p>
        <p class="text-body-2 text-grey">
          If you believe you should have access, please contact an administrator.
        </p>
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn color="primary" to="/voting">
          Return to Voting & Topics
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
  <div v-else class="voting-dashboard" :class="{ 'fullscreen-mode': isFullscreen }">
    <v-container fluid class="pa-4">
          <!-- Header -->
          <v-row class="mb-2">
            <v-col cols="12" md="10" class="text-center">
              <div class="header-animation">
                <h1 class="text-h4 font-weight-bold text-white mb-2 pixel-text">
                  🗳️ LIVE VOTING DASHBOARD
                </h1>
                <div class="subtitle-text pixel-subtitle">REAL-TIME UPDATES • PERFECT FOR SCREEN SHARING</div>
              </div>
            </v-col>
            
            <!-- QR Code Section -->
            <v-col cols="12" md="2" class="d-flex justify-center align-center">
              <v-card class="qr-code-card pa-4 text-center" variant="outlined" color="primary">
                <div class="text-caption mb-2 text-primary font-weight-bold">JOIN EVENT</div>
                <div id="qr-code-container" class="mb-2">
                  <v-progress-circular v-if="loadingQR" indeterminate size="80" color="primary"></v-progress-circular>
                  <img v-else-if="qrCodeUrl" :src="qrCodeUrl" alt="Join QR Code" style="width: 80px; height: 80px;" />
                  <v-icon v-else size="80" color="grey">mdi-qrcode</v-icon>
                </div>
                <div class="text-caption text-grey">Scan to Join</div>
                <div v-if="joinUrl" class="text-caption mt-1" style="font-size: 10px; word-break: break-all;">
                  {{ joinUrl.replace(/^https?:\/\//, '') }}
                </div>
              </v-card>
            </v-col>
          </v-row>
          
          <v-row class="mb-4">
            <v-col cols="12" class="text-center">
              
              <!-- Stats -->
              <div class="d-flex justify-center gap-8 mb-2">
                <v-card variant="outlined" class="px-4 py-2 stat-card pixel-card">
                  <div class="text-h5 font-weight-bold stat-number">{{ totalRegistrations }}</div>
                  <div class="text-caption stat-label">REGISTRATIONS</div>
                </v-card>
                <v-card variant="outlined" class="px-4 py-2 stat-card pixel-card">
                  <div class="text-h5 font-weight-bold stat-number">{{ totalVoters }}</div>
                  <div class="text-caption stat-label">ACTIVE VOTERS</div>
                </v-card>
                <v-card variant="outlined" class="px-4 py-2 stat-card pixel-card">
                  <div class="text-h5 font-weight-bold stat-number">{{ sortedTopics.length }}</div>
                  <div class="text-caption stat-label">TOPICS</div>
                </v-card>
              </div>
          
          <!-- Controls -->
          <div class="d-flex justify-center gap-4 mb-2">
            <v-btn
              @click="fetchTopics"
              color="#00FFFF"
              prepend-icon="mdi-refresh"
              variant="outlined"
              class="pixel-btn"
              size="small"
            >
              REFRESH
            </v-btn>
            <v-btn
              @click="openNewRoundDialog"
              color="#00FF00"
              prepend-icon="mdi-play-circle"
              variant="outlined"
              class="pixel-btn"
              size="small"
            >
              START ROUND
            </v-btn>
            <v-btn
              @click="showRoomAssignments = !showRoomAssignments; if (showRoomAssignments) fetchRoomAssignments()"
              :color="showRoomAssignments ? '#00FF00' : '#FFFF00'"
              :prepend-icon="showRoomAssignments ? 'mdi-view-dashboard' : 'mdi-account-group'"
              variant="outlined"
              class="pixel-btn"
              size="small"
            >
              {{ showRoomAssignments ? 'SHOW VOTING' : 'SHOW ROOMS' }}
            </v-btn>
            <v-btn
              @click="toggleFullscreen"
              color="#FF00FF"
              :prepend-icon="isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'"
              variant="outlined"
              class="pixel-btn"
              size="small"
            >
              {{ isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN' }}
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Active Round Display -->
      <v-row v-if="activeRound && (activeRound.isActive || activeRound.hasEnded)" class="mb-6">
        <v-col cols="12">
          <v-card :color="activeRound.hasEnded ? 'error' : 'success'" class="pixel-main-card" elevation="8">
            <v-card-title class="text-center text-white text-h4 py-4">
              <v-icon size="large" class="mr-3">{{ activeRound.hasEnded ? 'mdi-timer-off' : 'mdi-timer' }}</v-icon>
              ROUND {{ activeRound.roundNumber }} {{ activeRound.hasEnded ? 'ENDED' : 'ACTIVE' }}
            </v-card-title>
            <v-card-text class="text-white">
              <!-- Timer Display -->
              <div class="text-center mb-6">
                <div class="timer-display text-h2 font-weight-black mb-2" style="font-family: 'Courier New', monospace;">
                  {{ formatTime(timeRemaining) }}
                </div>
                <v-progress-linear
                  :model-value="activeRound.hasEnded ? 0 : (timeRemaining / (activeRound.duration * 60)) * 100"
                  :color="activeRound.hasEnded ? 'red' : 'white'"
                  height="8"
                  rounded
                  class="mx-auto"
                  style="max-width: 400px;"
                ></v-progress-linear>
                <div class="text-body-1 mt-2">
                  {{ activeRound.hasEnded ? 'Round completed' : `${activeRound.duration} minutes total` }}
                </div>
              </div>

              <!-- Discussion Groups Grid -->
              <div v-if="activeRound.groupAssignments?.length" class="discussion-groups">
                <h3 class="text-center text-h5 mb-4">
                  {{ activeRound.hasEnded ? 'FINAL DISCUSSION GROUPS' : 'ACTIVE DISCUSSION GROUPS' }}
                </h3>
                <v-row justify="center">
                  <v-col
                    v-for="(group, index) in activeRound.groupAssignments"
                    :key="group.topicId"
                    cols="12"
                    sm="6"
                    md="4"
                    lg="3"
                  >
                    <v-card 
                      class="group-card h-100 text-center"
                      color="rgba(255,255,255,0.1)"
                      variant="outlined"
                    >
                      <v-card-title class="text-body-1 pa-3 white--text">
                        <div class="group-letter text-h4 mb-2" :style="{ color: pixelColors[index % pixelColors.length] }">
                          {{ String.fromCharCode(65 + index) }}
                        </div>
                        <div class="group-title text-wrap text-white">{{ group.topicTitle }}</div>
                      </v-card-title>
                      <v-card-text class="text-white pa-3">
                        <div class="group-stats mb-3">
                          <v-chip 
                            :color="pixelColors[index % pixelColors.length]" 
                            size="small" 
                            class="mb-2"
                            prepend-icon="mdi-account-group"
                          >
                            {{ group.participants.length }} participants
                          </v-chip>
                        </div>
                        <div v-if="group.roomAssignment" class="room-assignment">
                          <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                          <span class="text-caption">{{ group.roomAssignment }}</span>
                        </div>
                        <!-- Participant List for smaller groups -->
                        <div v-if="group.participants.length <= 8 && group.participants.length > 0" class="participant-list mt-2">
                          <div class="text-caption mb-1">Participants:</div>
                          <div class="participants-chips">
                            <v-chip
                              v-for="participant in (group.participantDetails || group.participants)"
                              :key="typeof participant === 'string' ? participant : participant.email"
                              size="x-small"
                              class="ma-1"
                              style="font-size: 9px;"
                            >
                              {{ typeof participant === 'string' ? formatParticipantName(participant) : participant.name }}
                            </v-chip>
                          </div>
                        </div>
                        <!-- Show participant count for larger groups -->
                        <div v-else-if="group.participants.length > 8" class="participant-list mt-2">
                          <div class="text-caption mb-1">{{ group.participants.length }} participants assigned</div>
                          <v-btn
                            size="x-small"
                            color="primary"
                            variant="outlined"
                            @click="showParticipantDetailsDialog(group)"
                          >
                            View All Participants
                          </v-btn>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
                
                <!-- Total Stats -->
                <div class="text-center mt-4">
                  <v-chip 
                    color="white" 
                    :text-color="activeRound.hasEnded ? 'error' : 'success'" 
                    size="large" 
                    prepend-icon="mdi-account-multiple"
                    class="mx-2"
                  >
                    Total: {{ getTotalParticipants(activeRound.groupAssignments) }} Participants
                  </v-chip>
                  <v-chip 
                    color="white" 
                    :text-color="activeRound.hasEnded ? 'error' : 'success'" 
                    size="large" 
                    prepend-icon="mdi-forum"
                    class="mx-2"
                  >
                    {{ activeRound.groupAssignments.length }} Discussion Groups
                  </v-chip>
                  
                  <!-- Round Ended Message -->
                  <div v-if="activeRound.hasEnded" class="mt-4">
                    <v-alert
                      color="warning"
                      variant="elevated"
                      class="mx-auto"
                      style="max-width: 600px;"
                      prominent
                    >
                      <template #prepend>
                        <v-icon size="large">mdi-timer-off</v-icon>
                      </template>
                      <v-alert-title class="text-h6">Discussion Round Complete</v-alert-title>
                      <div>Thank you for participating! Please wrap up your discussions and return to the main area.</div>
                    </v-alert>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Pixel Art Bar Chart -->
      <v-row v-if="!showRoomAssignments">
        <v-col cols="12">
          <v-card class="pa-6 pixel-main-card" elevation="0">
            <div class="chart-container">
              <div
                v-for="(topic, index) in sortedTopics"
                :key="topic.id"
                class="chart-row mb-3"
                :class="{ 'new-vote': showNewVoteAnimation[topic.id] }"
                :style="{ animationDelay: `${index * 100}ms` }"
              >
                <!-- Topic Info -->
                <div class="topic-info">
                  <div class="topic-rank pixel-rank" :style="{ backgroundColor: getRankColor(index) }">#{{ index + 1 }}</div>
                  <div class="topic-details">
                    <div class="topic-title pixel-title">{{ getTruncatedTitle(topic.title) }}</div>
                    <div v-if="topic.description" class="topic-description pixel-description">{{ getTruncatedDescription(topic.description) }}</div>
                    <div class="topic-votes pixel-subtitle">{{ getRegistrationCount(topic) }} PEOPLE • {{ topic.totalPreferenceScore || 0 }} PTS</div>
                  </div>
                </div>
                
                <!-- Emoji Cloud Visualization -->
                <div v-if="getRegistrationCount(topic) > 0" class="emoji-cloud-section">
                  <EmojiCloud 
                    :voters="[...(topic.firstChoiceVoters || []), ...(topic.secondChoiceVoters || [])]" 
                    :container-height="120"
                  />
                </div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Room Assignment Display -->
      <v-row v-if="showRoomAssignments">
        <v-col cols="12">
          <v-card class="pa-6 pixel-main-card" elevation="0">
            <h2 class="text-center mb-6 pixel-text" style="color: #00FF00 !important;">
              🏢 ROOM ASSIGNMENTS
            </h2>
            
            <div class="room-assignments-grid">
              <div
                v-for="(assignment, index) in roomAssignments"
                :key="assignment.topicId"
                class="room-assignment-card mb-4"
                :style="{ animationDelay: `${index * 200}ms` }"
              >
                <v-card
                  class="pixel-room-card pa-4"
                  :style="{ borderColor: getPixelColor(index) }"
                  elevation="0"
                >
                  <!-- Room Header -->
                  <div class="room-header mb-3">
                    <div class="d-flex align-center justify-space-between">
                      <v-chip
                        :color="getPixelColor(index)"
                        size="large"
                        class="pixel-chip"
                        prepend-icon="mdi-door"
                      >
                        {{ assignment.roomName || `Room ${String.fromCharCode(65 + index)}` }}
                      </v-chip>
                      <v-chip
                        color="info"
                        size="small"
                        class="pixel-chip"
                        prepend-icon="mdi-account-group"
                      >
                        {{ assignment.participants?.length || 0 }} People
                      </v-chip>
                    </div>
                  </div>

                  <!-- Topic Title -->
                  <h3 class="room-topic-title mb-4 pixel-title">
                    {{ assignment.topicTitle }}
                  </h3>

                  <!-- Participants -->
                  <div class="participants-section">
                    <h4 class="participants-header pixel-subtitle mb-3">
                      <v-icon color="primary" class="mr-2">mdi-account-multiple</v-icon>
                      PARTICIPANTS:
                    </h4>
                    
                    <div v-if="assignment.participants?.length" class="participants-grid">
                      <v-chip
                        v-for="participant in assignment.participants"
                        :key="participant"
                        :color="getPixelColor(Math.floor(Math.random() * pixelColors.length))"
                        size="small"
                        class="participant-chip mb-2 mr-2"
                        variant="outlined"
                      >
                        <v-icon start size="small">mdi-account</v-icon>
                        {{ participant }}
                      </v-chip>
                    </div>
                    
                    <div v-else class="text-center py-4">
                      <v-icon color="grey" size="large">mdi-account-question</v-icon>
                      <p class="pixel-subtitle mt-2" style="color: #666;">
                        NO PARTICIPANTS ASSIGNED YET
                      </p>
                    </div>
                  </div>
                </v-card>
              </div>
            </div>

            <!-- No Assignments Message -->
            <div v-if="!roomAssignments.length" class="text-center py-8">
              <v-icon color="grey" size="64">mdi-home-search</v-icon>
              <h3 class="pixel-title mt-4" style="color: #666;">
                NO ROOM ASSIGNMENTS YET
              </h3>
              <p class="pixel-subtitle mt-2" style="color: #888;">
                Use the admin panel to create room assignments
              </p>
            </div>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Real-time indicator -->
      <v-row class="mt-4">
        <v-col cols="12" class="text-center">
          <v-chip color="success" variant="elevated" class="pulse">
            <v-icon start>mdi-circle</v-icon>
            Live Updates Every 2 Seconds
          </v-chip>
        </v-col>
      </v-row>
    </v-container>

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
                {{ selectedTopics.length }}/8 topics selected
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
                :disabled="!topic.selected && selectedTopics.length >= 8"
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

    <!-- Participant Details Dialog -->
    <v-dialog v-model="participantDetailsDialog" max-width="600px">
      <v-card v-if="selectedGroupForDetails">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-account-group</v-icon>
          Group Participants: {{ selectedGroupForDetails.topicTitle }}
        </v-card-title>
        
        <v-card-text>
          <div class="mb-3">
            <v-chip 
              color="primary" 
              variant="elevated" 
              prepend-icon="mdi-account-multiple"
              class="mr-2"
            >
              {{ selectedGroupForDetails.participants.length }} Total Participants
            </v-chip>
            <v-chip 
              v-if="selectedGroupForDetails.roomAssignment"
              color="info" 
              variant="outlined" 
              prepend-icon="mdi-map-marker"
            >
              {{ selectedGroupForDetails.roomAssignment }}
            </v-chip>
          </div>
          
          <h4 class="mb-3">All Participants:</h4>
          <div class="participants-grid">
            <v-chip
              v-for="participant in selectedGroupForDetails.participants"
              :key="participant"
              class="ma-1"
              color="primary"
              variant="outlined"
              prepend-icon="mdi-account"
            >
              {{ formatParticipantName(participant) }}
            </v-chip>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="participantDetailsDialog = false">
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.voting-dashboard {
  min-height: 100vh;
  background: 
    radial-gradient(circle at 20% 20%, #1a1a2e 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, #16213e 0%, transparent 50%),
    linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  font-family: 'Press Start 2P', monospace;
  position: relative;
}

.voting-dashboard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(0, 255, 255, 0.1) 2px, transparent 2px),
    radial-gradient(circle at 75% 75%, rgba(255, 0, 255, 0.1) 2px, transparent 2px);
  background-size: 40px 40px;
  pointer-events: none;
  animation: pixelShift 4s infinite linear;
}

.fullscreen-mode {
  padding: 2rem;
}

.pixel-text {
  color: #00FFFF !important;
  text-shadow: 
    4px 4px 0px #FF00FF,
    8px 8px 0px #000000;
  font-family: 'Press Start 2P', monospace !important;
  letter-spacing: 2px;
}

.pixel-subtitle {
  font-size: 1rem !important;
  color: #FFFF00 !important;
  text-shadow: 2px 2px 0px #000000;
  margin-bottom: 2rem;
  animation: neonGlow 2s ease-in-out infinite alternate;
  letter-spacing: 1px;
}

.pixel-card {
  background: linear-gradient(45deg, #2a2a4a, #1e1e3e) !important;
  border: 4px solid #00FFFF !important;
  border-radius: 0px !important;
  box-shadow: 
    0 0 20px rgba(0, 255, 255, 0.5),
    inset 0 0 20px rgba(255, 255, 255, 0.1) !important;
  position: relative;
}

.pixel-card::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  background: 
    linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
  pointer-events: none;
}

.stat-number {
  color: #00FF00 !important;
  text-shadow: 2px 2px 0px #000000;
  font-family: 'Press Start 2P', monospace !important;
  font-size: 2rem !important;
}

.stat-label {
  color: #FFFF00 !important;
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.6rem !important;
  letter-spacing: 1px;
  text-shadow: 1px 1px 0px #000000;
}

.header-animation {
  animation: slideInDown 1s ease-out;
}

.stat-card {
  transition: all 0.3s ease;
  animation: slideInUp 0.8s ease-out;
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.05);
  box-shadow: 
    0 0 30px rgba(0, 255, 255, 0.8),
    0 15px 25px rgba(0,0,0,0.3);
}

.chart-container {
  max-width: 100%;
  overflow-x: auto;
  background: linear-gradient(45deg, #1a1a2e, #16213e);
  border: 4px solid #FF00FF;
  border-radius: 0px;
  padding: 2rem;
  box-shadow: 
    0 0 30px rgba(255, 0, 255, 0.3),
    inset 0 0 30px rgba(0, 0, 0, 0.5);
}

.pixel-main-card {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.chart-row {
  display: flex;
  align-items: center;
  min-height: 80px;
  opacity: 0;
  animation: pixelSlideIn 0.8s ease-out forwards;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem !important;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.05), transparent);
  border-radius: 0px;
  padding: 1rem;
}

.chart-row:hover {
  transform: translateX(8px) scale(1.02);
  background: linear-gradient(90deg, rgba(0, 255, 255, 0.1), transparent);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
}

.chart-row.new-vote {
  animation: pixelGlow 2s ease-out;
}

.new-vote-icon {
  animation: pixelBounce 0.8s ease-out;
  margin-left: 8px;
}

.topic-info {
  display: flex;
  align-items: center;
  min-width: 350px;
  margin-right: 2rem;
}

.topic-rank {
  width: 60px;
  height: 60px;
  border-radius: 0px !important;
  color: #000000 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 1.5rem;
  border: 3px solid #000000;
  font-family: 'Press Start 2P', monospace;
  font-size: 1rem;
  text-shadow: none;
  box-shadow: 
    4px 4px 0px #000000,
    0 0 20px rgba(255, 255, 255, 0.3);
}

.pixel-rank {
  position: relative;
}

.pixel-rank::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  background: 
    linear-gradient(45deg, rgba(255, 255, 255, 0.3), transparent 50%);
  pointer-events: none;
}

.topic-details {
  flex: 1;
}

.pixel-title {
  font-weight: 600;
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: #FFFFFF;
  text-shadow: 2px 2px 0px #000000;
  font-family: 'Press Start 2P', monospace;
  line-height: 1.4;
}

.pixel-subtitle {
  font-size: 0.7rem;
  color: #00FFFF;
  font-family: 'Press Start 2P', monospace;
  text-shadow: 1px 1px 0px #000000;
  letter-spacing: 1px;
}

.pixel-bar-container {
  flex: 1;
  position: relative;
  height: 60px;
  background: 
    linear-gradient(45deg, #000000, #1a1a1a);
  border: 3px solid #333333;
  border-radius: 0px;
  overflow: hidden;
  box-shadow: 
    inset 0 0 20px rgba(0,0,0,0.8),
    0 0 10px rgba(255, 255, 255, 0.1);
}

/* Pixel Figures Container */
.pixel-figures-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  flex: 1;
  min-width: 300px;
  padding: 0.5rem;
}

.pixel-figures {
  font-size: 1.2rem;
  line-height: 1.4;
  text-align: right;
  word-wrap: break-word;
  overflow-wrap: break-word;
  max-width: 100%;
  animation: pixelGlow 2s infinite alternate;
}

@keyframes pixelGlow {
  0% { text-shadow: 0 0 5px rgba(255, 255, 255, 0.5); }
  100% { text-shadow: 0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.4); }
}

.cursor-pointer {
  cursor: pointer;
}

.pixel-bar {
  height: 100%;
  border-radius: 0px;
  position: relative;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  animation: pixelGrowBar 1.5s ease-out;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 0 20px currentColor,
    inset 0 0 20px rgba(255, 255, 255, 0.2);
}

.pixel-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 8px,
      rgba(255, 255, 255, 0.1) 8px,
      rgba(255, 255, 255, 0.1) 12px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 8px,
      rgba(255, 255, 255, 0.1) 8px,
      rgba(255, 255, 255, 0.1) 12px
    );
  animation: pixelScan 3s infinite linear;
}

.pixel-label {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  font-weight: bold;
  color: #FFFF00;
  background: 
    linear-gradient(45deg, #000000, #1a1a1a);
  padding: 8px 12px;
  border: 2px solid #FFFF00;
  border-radius: 0px;
  font-size: 1rem;
  font-family: 'Press Start 2P', monospace;
  text-shadow: 1px 1px 0px #000000;
  box-shadow: 
    0 0 15px rgba(255, 255, 0, 0.5),
    inset 0 0 10px rgba(255, 255, 255, 0.1);
}

.pulse {
  animation: pixelPulse 2s infinite;
}

.pixel-btn {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.7rem !important;
  border-radius: 0px !important;
  border-width: 3px !important;
  text-shadow: 1px 1px 0px #000000 !important;
  letter-spacing: 1px !important;
  padding: 16px 24px !important;
  background: linear-gradient(45deg, #1a1a2e, #16213e) !important;
  box-shadow: 
    0 0 15px currentColor,
    inset 0 0 15px rgba(255, 255, 255, 0.1) !important;
  transition: all 0.3s ease !important;
}

.pixel-btn:hover {
  transform: translateY(-3px) scale(1.05) !important;
  box-shadow: 
    0 0 25px currentColor,
    0 8px 16px rgba(0, 0, 0, 0.3) !important;
}

/* Pixel Art Animations */
@keyframes pixelShift {
  0% { background-position: 0 0, 0 0; }
  100% { background-position: 40px 40px, -40px -40px; }
}

@keyframes neonGlow {
  0% { text-shadow: 2px 2px 0px #000000, 0 0 10px #FFFF00; }
  100% { text-shadow: 2px 2px 0px #000000, 0 0 20px #FFFF00, 0 0 30px #FFFF00; }
}

@keyframes pixelSlideIn {
  from {
    opacity: 0;
    transform: translateX(-50px) rotateY(-10deg);
  }
  to {
    opacity: 1;
    transform: translateX(0) rotateY(0deg);
  }
}

@keyframes pixelGrowBar {
  from {
    width: 0% !important;
    filter: hue-rotate(180deg);
  }
  to {
    filter: hue-rotate(0deg);
  }
}

@keyframes pixelScan {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

@keyframes pixelGlow {
  0% {
    box-shadow: 0 0 0 rgba(0, 255, 0, 0.8);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 30px rgba(0, 255, 0, 0.8);
    transform: scale(1.03);
  }
  100% {
    box-shadow: 0 0 0 rgba(0, 255, 0, 0);
    transform: scale(1);
  }
}

@keyframes pixelBounce {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(-180deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.2) rotate(0deg);
  }
  70% {
    transform: scale(0.9) rotate(10deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes pixelPulse {
  0%, 100% {
    opacity: 1;
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.8);
  }
  50% {
    opacity: 0.7;
    box-shadow: 0 0 25px rgba(0, 255, 0, 1);
  }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Fullscreen optimizations */
.fullscreen-mode .pixel-text {
  font-size: 4rem !important;
}

.fullscreen-mode .chart-row {
  min-height: 100px;
  margin-bottom: 2rem !important;
}

.fullscreen-mode .pixel-title {
  font-size: 1.5rem;
}

.fullscreen-mode .pixel-subtitle {
  font-size: 1rem;
}

.fullscreen-mode .topic-rank {
  width: 80px;
  height: 80px;
  font-size: 1.3rem;
}

.fullscreen-mode .pixel-bar-container {
  height: 80px;
}

.fullscreen-mode .pixel-label {
  font-size: 1.3rem;
  padding: 10px 16px;
}

/* Responsive design */
@media (max-width: 768px) {
  .topic-info {
    min-width: 250px;
  }
  
  .pixel-title {
    font-size: 0.8rem;
  }
  
  .chart-row {
    min-height: 60px;
  }
  
  .topic-rank {
    width: 45px;
    height: 45px;
    font-size: 0.7rem;
  }
  
  .pixel-subtitle {
    font-size: 0.6rem;
  }
}

/* Custom scrollbar for pixel theme */
.chart-container::-webkit-scrollbar {
  height: 12px;
}

.chart-container::-webkit-scrollbar-track {
  background: #1a1a1a;
  border: 2px solid #333333;
}

.chart-container::-webkit-scrollbar-thumb {
  background: linear-gradient(45deg, #00FFFF, #FF00FF);
  border: 1px solid #000000;
}

.chart-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(45deg, #FF00FF, #FFFF00);
}

/* QR Code Card Styles */
.qr-code-card {
  background: linear-gradient(45deg, #0a0a0a, #1a1a2e) !important;
  border: 3px solid #00FFFF !important;
  border-radius: 8px !important;
  box-shadow: 
    0 0 20px rgba(0, 255, 255, 0.4),
    inset 0 0 10px rgba(0, 255, 255, 0.1);
  animation: pulse-glow 3s infinite;
  max-width: 120px;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 
      0 0 20px rgba(0, 255, 255, 0.4),
      inset 0 0 10px rgba(0, 255, 255, 0.1);
  }
  50% {
    box-shadow: 
      0 0 30px rgba(0, 255, 255, 0.8),
      inset 0 0 15px rgba(0, 255, 255, 0.2);
  }
}

/* Topic Description Style */
.topic-description {
  color: #CCCCCC !important;
  font-size: 0.7rem !important;
  margin: 0.3rem 0;
  line-height: 1.3;
  text-shadow: 1px 1px 0px #000000;
}

.pixel-description {
  font-family: 'Courier New', monospace !important;
}

/* Room Assignment Styles */
.room-assignments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 2rem;
  max-height: 80vh;
  overflow-y: auto;
}

.room-assignment-card {
  animation: slideInUp 0.6s ease-out;
}

.pixel-room-card {
  background: linear-gradient(45deg, #1a1a2e, #16213e) !important;
  border: 4px solid !important;
  border-radius: 0px !important;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.pixel-room-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 
    0 0 25px rgba(0, 255, 255, 0.6),
    0 10px 20px rgba(0,0,0,0.3);
}

.pixel-room-card::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  right: 2px;
  bottom: 2px;
  background: 
    linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
  pointer-events: none;
}

.room-header {
  border-bottom: 2px solid #333;
  padding-bottom: 1rem;
}

.room-topic-title {
  color: #FFFF00 !important;
  text-shadow: 2px 2px 0px #000000;
  font-family: 'Press Start 2P', monospace !important;
  font-size: 1.1rem !important;
  line-height: 1.4;
  word-wrap: break-word;
}

.participants-header {
  color: #00FFFF !important;
  text-shadow: 1px 1px 0px #000000;
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.7rem !important;
  letter-spacing: 1px;
}

.participants-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.participant-chip {
  background: linear-gradient(45deg, #2a2a4a, #1e1e3e) !important;
  border: 2px solid !important;
  border-radius: 0px !important;
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.6rem !important;
  transition: all 0.2s ease;
}

.participant-chip:hover {
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.pixel-chip {
  background: linear-gradient(45deg, #2a2a4a, #1e1e3e) !important;
  border: 2px solid !important;
  border-radius: 0px !important;
  font-family: 'Press Start 2P', monospace !important;
  text-shadow: 1px 1px 0px #000000;
  box-shadow: 
    0 0 10px rgba(0, 255, 255, 0.3),
    inset 0 0 10px rgba(255, 255, 255, 0.1);
}

/* Responsive room assignments */
@media (max-width: 768px) {
  .room-assignments-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .room-topic-title {
    font-size: 0.9rem !important;
  }
  
  .participants-header {
    font-size: 0.6rem !important;
  }
  
  .participant-chip {
    font-size: 0.5rem !important;
  }
}

@media (min-width: 1200px) {
  .room-assignments-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Emoji Cloud for Live Dashboard */
.emoji-cloud-section {
  margin-left: 2rem;
  width: 300px;
  min-height: 120px;
}

.emoji-cloud-section .emoji-cloud-container {
  background: transparent !important;
  border: none !important;
  border-radius: 0px !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  position: relative;
  overflow: visible !important;
}

.emoji-cloud-section .emoji-cloud {
  position: relative !important;
  width: 100% !important;
  height: calc(100% - 60px) !important;
  overflow: visible !important;
  z-index: 10 !important;
}

.emoji-cloud-section .emoji-cloud-header h4 {
  color: #00FFFF !important;
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.7rem !important;
  text-shadow: 1px 1px 0px #000000;
  letter-spacing: 1px;
}

.emoji-cloud-section .emoji-cloud-header p {
  color: #FFFF00 !important;
  font-family: 'Press Start 2P', monospace !important;
  font-size: 0.5rem !important;
  text-shadow: 1px 1px 0px #000000;
}

/* Make emojis more prominent in the retro theme */
.emoji-cloud-section .voter-emoji {
  position: absolute !important;
  z-index: 100 !important;
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  filter: 
    drop-shadow(0 0 3px rgba(255, 255, 255, 0.8))
    drop-shadow(0 0 6px rgba(0, 255, 255, 0.4)) !important;
  font-size: 1.5em !important;
  line-height: 1 !important;
  pointer-events: auto !important;
  color: transparent !important;
  text-shadow: none !important;
}

.emoji-cloud-section .voter-emoji:hover {
  filter: 
    drop-shadow(0 0 5px rgba(255, 255, 255, 1))
    drop-shadow(0 0 10px rgba(0, 255, 255, 0.8))
    drop-shadow(0 0 15px rgba(255, 0, 255, 0.6)) !important;
  transform: scale(1.3) !important;
  z-index: 200 !important;
}

.emoji-cloud-section .no-voters {
  color: #666 !important;
}

.emoji-cloud-section .no-voters .v-icon {
  filter: grayscale(1);
}

@media (min-width: 1800px) {
  .room-assignments-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Active Round Styles */
.timer-display {
  text-shadow: 
    2px 2px 0px rgba(0, 0, 0, 0.5),
    0 0 10px rgba(255, 255, 255, 0.3);
  letter-spacing: 4px;
}

.discussion-groups {
  animation: slideInUp 0.5s ease-out;
}

.group-card {
  transition: all 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.2) !important;
}

.group-card:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.5) !important;
  box-shadow: 0 8px 25px rgba(0, 255, 255, 0.2);
}

.group-letter {
  font-family: 'Press Start 2P', monospace;
  text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.7);
}

.group-title {
  font-size: 0.9rem !important;
  line-height: 1.2 !important;
  font-family: 'Roboto', sans-serif !important;
  color: white !important;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8) !important;
  font-weight: 500 !important;
}

.participant-list {
  max-height: 80px;
  overflow-y: auto;
}

.participants-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  justify-content: center;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

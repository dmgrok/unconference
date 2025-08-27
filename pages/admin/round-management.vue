<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { RoundHistory, TopicSelection, ActiveRound } from '~/types/topic'
import type { User } from '~/types/user'

definePageMeta({
  middleware: 'authenticated'
})

const { user } = useUserSession()
const { settings: adminSettings, loadSettings } = useAdminSettings()

const hasAccess = computed(() => {
  const userRole = (user.value as any)?.Role || (user.value as any)?.role
  return ['Admin', 'Organizer'].includes(userRole)
})

// Redirect if no access
if (!hasAccess.value) {
  throw createError({ statusCode: 403, statusMessage: 'Admin or Organizer access required' })
}

const roundHistory = ref<RoundHistory[]>([])
const topicSelections = ref<TopicSelection[]>([])
const activeRound = ref<ActiveRound | null>(null)
const loading = ref(false)
const extendingRound = ref(false)

// Dialog states
const newRoundDialog = ref(false)
const roundHistoryDialog = ref(false)

// Timer states
const timeRemaining = ref(0)
const timerInterval = ref<NodeJS.Timeout | null>(null)

// Round configuration
const roundDuration = ref(20)

const selectedTopics = computed(() => 
  topicSelections.value.filter(topic => topic.selected)
)

const canStartRound = computed(() => 
  selectedTopics.value.length > 0 && selectedTopics.value.length <= adminSettings.value.maxTopicsPerRound
)

async function loadRoundHistory() {
  try {
    const data = await $fetch('/api/admin/round-history') as RoundHistory[]
    roundHistory.value = data
  } catch (error) {
    console.error('Failed to load round history:', error)
  }
}

async function loadTopicSelections() {
  try {
    const data = await $fetch('/api/admin/topic-selection') as TopicSelection[]
    topicSelections.value = data
  } catch (error) {
    console.error('Failed to load topic selections:', error)
  }
}

async function loadActiveRound() {
  try {
    const data = await $fetch('/api/active-round') as ActiveRound | null
    activeRound.value = data
    if (activeRound.value?.isActive) {
      startTimer()
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
  
  loading.value = true
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
    await Promise.all([loadActiveRound(), loadRoundHistory()])
    
    // Show success message
    alert(`Round ${result.roundNumber} started successfully with ${selectedTopics.value.length} topics!`)
  } catch (error) {
    console.error('Failed to start new round:', error)
    alert('Failed to start new round. Please try again.')
  } finally {
    loading.value = false
  }
}

async function endCurrentRound() {
  const confirmed = confirm('Are you sure you want to end the current round early?')
  if (!confirmed) return
  
  try {
    loading.value = true
    await $fetch('/api/admin/end-round', { method: 'POST' })
    await loadActiveRound()
    stopTimer()
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

onMounted(async () => {
  await loadSettings()
  await Promise.all([loadRoundHistory(), loadActiveRound()])
})

// Cleanup timer on unmount
onBeforeUnmount(() => {
  stopTimer()
})
</script>

<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4 mb-4">Round Management</h1>
        
        <!-- Active Round Status -->
        <v-card v-if="activeRound?.isActive" class="mb-6" color="success" variant="outlined">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-play-circle</v-icon>
            Round {{ activeRound.roundNumber }} Active
          </v-card-title>
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div>
                <h3 class="text-h2 font-weight-bold text-success">
                  {{ formatTime(timeRemaining) }}
                </h3>
                <p class="text-caption">Time Remaining</p>
              </div>
              <div class="text-right">
                <p><strong>{{ activeRound.selectedTopics.length }}</strong> topics selected</p>
                <p class="text-caption">Duration: {{ activeRound.duration }} minutes</p>
              </div>
            </div>
            
            <v-progress-linear
              :model-value="((activeRound.duration * 60 - timeRemaining) / (activeRound.duration * 60)) * 100"
              color="success"
              height="8"
              class="mt-3"
            ></v-progress-linear>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              variant="outlined"
              prepend-icon="mdi-clock-plus"
              @click="extendCurrentRound"
              :loading="extendingRound"
              class="mr-2"
            >
              Extend +5 min
            </v-btn>
            <v-btn
              color="error"
              variant="outlined"
              prepend-icon="mdi-stop"
              @click="endCurrentRound"
              :loading="loading"
            >
              End Round
            </v-btn>
          </v-card-actions>
        </v-card>
        
        <!-- No Active Round -->
        <v-card v-else class="mb-6" variant="outlined">
          <v-card-title>
            <v-icon class="mr-2">mdi-pause-circle</v-icon>
            No Active Round
          </v-card-title>
          <v-card-text>
            <p>Start a new round to begin discussions with selected topics.</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Action Buttons -->
    <v-row class="mb-6">
      <v-col class="d-flex gap-4">
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-play"
          @click="openNewRoundDialog"
          :disabled="activeRound?.isActive"
        >
          Start New Round
        </v-btn>
        <v-btn
          color="secondary"
          variant="outlined"
          prepend-icon="mdi-history"
          @click="roundHistoryDialog = true"
        >
          View History
        </v-btn>
      </v-col>
    </v-row>

    <!-- New Round Dialog -->
    <v-dialog v-model="newRoundDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-plus-circle</v-icon>
          Start New Round
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
            :disabled="!canStartRound || loading"
            :loading="loading"
            @click="startNewRound"
          >
            Start Round
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Round History Dialog -->
    <v-dialog v-model="roundHistoryDialog" max-width="900px">
      <v-card>
        <v-card-title>
          <v-icon class="mr-2">mdi-history</v-icon>
          Round History
        </v-card-title>
        
        <v-card-text>
          <v-data-table
            v-if="roundHistory.length > 0"
            :headers="[
              { title: 'Round', key: 'roundNumber', width: '100px' },
              { title: 'Date & Time', key: 'timestamp' },
              { title: 'Topics', key: 'selectedTopics' },
              { title: 'Participants', key: 'totalParticipants', width: '120px' }
            ]"
            :items="roundHistory"
            items-per-page="10"
          >
            <template #item.timestamp="{ item }">
              {{ new Date(item.timestamp).toLocaleString() }}
            </template>
            
            <template #item.selectedTopics="{ item }">
              <v-chip-group>
                <v-chip
                  v-for="topic in item.selectedTopics"
                  :key="topic.topicId"
                  size="small"
                  color="primary"
                  variant="outlined"
                >
                  {{ topic.title }} ({{ topic.finalScore }} pts)
                </v-chip>
              </v-chip-group>
            </template>
          </v-data-table>
          
          <v-alert v-else type="info">
            No round history available yet.
          </v-alert>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="roundHistoryDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { DiscussionTopic } from '~/types/topic'

const { user } = useUserSession()
const { settings: adminSettings } = useAdminSettings()
const { shouldHideAdminFeatures } = useViewerMode()
const config = useRuntimeConfig()

const topics = ref<DiscussionTopic[]>([])
const preferences = ref({
  firstChoice: '',
  secondChoice: ''
})
const loading = ref(false)
const saving = ref(false)
const autoSaving = ref(false)
const error = ref('')
const success = ref('')

const availableTopics = computed(() => 
  topics.value.filter(topic => !topic.frozen)
)

const firstChoiceOptions = computed(() => 
  availableTopics.value.map(topic => ({
    title: topic.title,
    value: topic.id,
    subtitle: `${topic.totalPreferenceScore || topic.votes || 0} points • ${topic.description ? topic.description.substring(0, 60) + '...' : 'No description'}`
  }))
)

const secondChoiceOptions = computed(() => 
  availableTopics.value
    .filter(topic => topic.id !== preferences.value.firstChoice)
    .map(topic => ({
      title: topic.title,
      value: topic.id,
      subtitle: `${topic.totalPreferenceScore || topic.votes || 0} points • ${topic.description ? topic.description.substring(0, 60) + '...' : 'No description'}`
    }))
)

const hasVoted = computed(() => !!(preferences.value.firstChoice || preferences.value.secondChoice))

async function loadTopics() {
  loading.value = true
  try {
    const [topicsResponse, prefsResponse] = await Promise.all([
      $fetch('/api/topics'),
      $fetch('/api/topics/preferences')
    ])
    
    topics.value = topicsResponse as DiscussionTopic[]
    
    // Initialize preference arrays for backward compatibility
    topics.value.forEach(topic => {
      if (!topic.firstChoiceVoters) topic.firstChoiceVoters = []
      if (!topic.secondChoiceVoters) topic.secondChoiceVoters = []
      if (topic.totalPreferenceScore === undefined) {
        topic.totalPreferenceScore = (topic.firstChoiceVoters.length * 2) + topic.secondChoiceVoters.length
      }
    })
    
    preferences.value.firstChoice = prefsResponse.preferences.firstChoice || ''
    preferences.value.secondChoice = prefsResponse.preferences.secondChoice || ''
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to load topics'
  } finally {
    loading.value = false
  }
}

async function savePreferences() {
  if (!preferences.value.firstChoice && !preferences.value.secondChoice) {
    error.value = 'Please select at least one preference'
    return
  }
  
  if (preferences.value.firstChoice === preferences.value.secondChoice) {
    error.value = 'First and second choices must be different'
    return
  }
  
  saving.value = true
  error.value = ''
  success.value = ''
  
  try {
    await $fetch('/api/topics/preferences', {
      method: 'POST',
      body: {
        firstChoice: preferences.value.firstChoice || undefined,
        secondChoice: preferences.value.secondChoice || undefined
      }
    })
    
    success.value = 'Preferences saved successfully!'
    await loadTopics()
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to save preferences'
  } finally {
    saving.value = false
  }
}

async function clearPreferences() {
  saving.value = true
  try {
    await $fetch('/api/topics/preferences', {
      method: 'POST',
      body: {
        firstChoice: undefined,
        secondChoice: undefined
      }
    })
    
    preferences.value.firstChoice = ''
    preferences.value.secondChoice = ''
    success.value = 'Preferences cleared!'
    await loadTopics()
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to clear preferences'
  } finally {
    saving.value = false
  }
}

function getTopicById(id: string) {
  return topics.value.find(t => t.id === id)
}

// Auto-save when preferences change via quick buttons
let saveTimeout: NodeJS.Timeout | null = null

function debouncedSave() {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  autoSaving.value = true
  saveTimeout = setTimeout(async () => {
    if (preferences.value.firstChoice || preferences.value.secondChoice) {
      try {
        await $fetch('/api/topics/preferences', {
          method: 'POST',
          body: {
            firstChoice: preferences.value.firstChoice || undefined,
            secondChoice: preferences.value.secondChoice || undefined
          }
        })
        // Don't show success message for auto-save to avoid clutter
        await loadTopics()
      } catch (err: any) {
        error.value = err.data?.message || 'Failed to auto-save preferences'
      }
    }
    autoSaving.value = false
  }, 1000) // Save after 1 second of no changes
}

function quickVoteFirst(topicId: string) {
  preferences.value.firstChoice = preferences.value.firstChoice === topicId ? '' : topicId
  if (preferences.value.secondChoice === topicId) {
    preferences.value.secondChoice = ''
  }
  debouncedSave()
}

function quickVoteSecond(topicId: string) {
  preferences.value.secondChoice = preferences.value.secondChoice === topicId ? '' : topicId
  debouncedSave()
}

onMounted(() => {
  loadTopics()
})

definePageMeta({
  middleware: 'authenticated'
})
</script>

<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 text-primary">Vote for Discussion Topics</h1>
      <div class="d-flex align-center gap-2">
        <v-progress-circular 
          v-if="autoSaving" 
          indeterminate 
          size="20" 
          color="primary"
          class="mr-2"
        ></v-progress-circular>
        <v-chip v-if="autoSaving" color="primary" variant="outlined" size="small">
          Auto-saving...
        </v-chip>
        <v-btn
          color="primary"
          prepend-icon="mdi-refresh"
          @click="loadTopics"
          :loading="loading"
        >
          Refresh
        </v-btn>
      </div>
    </div>

    <!-- Instructions -->
    <v-alert type="info" class="mb-6" prepend-icon="mdi-information">
      <v-alert-title>How Preference Voting Works</v-alert-title>
      <p class="mt-2">
        This page lets you vote for discussion topics using a preference system. Browse all topics below to see their full descriptions, 
        then select your <strong>1st choice</strong> (most interested, worth 2 points) and <strong>2nd choice</strong> (also interested, worth 1 point). 
        The topics with the highest scores will be selected for discussion rounds. If your first choice topic doesn't have enough people, 
        you'll be assigned to your second choice if it has space available.
      </p>
      <p class="mt-2">
        <strong>Tip:</strong> Use the quick vote buttons on each topic card below, or use the detailed selectors above for a more organized approach.
      </p>
    </v-alert>

    <!-- Error/Success Messages -->
    <v-alert v-if="error" type="error" class="mb-4" dismissible @click:close="error = ''">
      {{ error }}
    </v-alert>

    <v-alert v-if="success" type="success" class="mb-4" dismissible @click:close="success = ''">
      {{ success }}
    </v-alert>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-h6">Loading topics...</p>
    </div>

    <!-- Preference Selection -->
    <v-row v-else>
      <v-col cols="12" md="6">
        <v-card class="pa-6" elevation="2">
          <v-card-title class="d-flex align-center mb-4">
            <v-icon color="primary" class="mr-2">mdi-star</v-icon>
            First Choice (2 points)
          </v-card-title>
          
          <v-select
            v-model="preferences.firstChoice"
            :items="firstChoiceOptions"
            label="Select your top preference"
            item-title="title"
            item-value="value"
            clearable
            persistent-hint
            hint="This is your most preferred topic"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #subtitle>
                  {{ item.raw.subtitle }}
                </template>
              </v-list-item>
            </template>
          </v-select>
          
          <!-- First Choice Preview -->
          <div v-if="preferences.firstChoice" class="mt-4">
            <v-card variant="tonal" color="primary">
              <v-card-text>
                <div class="text-subtitle-1 font-weight-bold">
                  {{ getTopicById(preferences.firstChoice)?.title }}
                </div>
                <div class="text-body-2 mt-1">
                  {{ getTopicById(preferences.firstChoice)?.description }}
                </div>
                <div class="text-caption text-grey-darken-1 mt-2">
                  Current score: {{ getTopicById(preferences.firstChoice)?.totalPreferenceScore || 0 }} points
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="pa-6" elevation="2">
          <v-card-title class="d-flex align-center mb-4">
            <v-icon color="secondary" class="mr-2">mdi-star-half-full</v-icon>
            Second Choice (1 point)
          </v-card-title>
          
          <v-select
            v-model="preferences.secondChoice"
            :items="secondChoiceOptions"
            label="Select your backup preference"
            item-title="title"
            item-value="value"
            clearable
            persistent-hint
            hint="Fallback if your first choice is under capacity"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props">
                <template #subtitle>
                  {{ item.raw.subtitle }}
                </template>
              </v-list-item>
            </template>
          </v-select>
          
          <!-- Second Choice Preview -->
          <div v-if="preferences.secondChoice" class="mt-4">
            <v-card variant="tonal" color="secondary">
              <v-card-text>
                <div class="text-subtitle-1 font-weight-bold">
                  {{ getTopicById(preferences.secondChoice)?.title }}
                </div>
                <div class="text-body-2 mt-1">
                  {{ getTopicById(preferences.secondChoice)?.description }}
                </div>
                <div class="text-caption text-grey-darken-1 mt-2">
                  Current score: {{ getTopicById(preferences.secondChoice)?.totalPreferenceScore || 0 }} points
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Action Buttons -->
    <div class="text-center mt-6">
      <v-btn
        color="primary"
        size="large"
        prepend-icon="mdi-content-save"
        @click="savePreferences"
        :loading="saving"
        :disabled="!preferences.firstChoice && !preferences.secondChoice"
        class="mr-4"
      >
        Save Preferences
      </v-btn>
      
      <v-btn
        v-if="hasVoted"
        color="error"
        variant="outlined"
        prepend-icon="mdi-delete"
        @click="clearPreferences"
        :loading="saving"
      >
        Clear Votes
      </v-btn>
    </div>

    <!-- Current Status -->
    <v-card v-if="hasVoted" class="mt-6" color="success" variant="tonal">
      <v-card-text>
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-check-circle</v-icon>
          <strong>Your preferences have been recorded!</strong>
        </div>
        <div class="mt-2">
          <p v-if="preferences.firstChoice">
            <strong>1st Choice:</strong> {{ getTopicById(preferences.firstChoice)?.title }}
          </p>
          <p v-if="preferences.secondChoice">
            <strong>2nd Choice:</strong> {{ getTopicById(preferences.secondChoice)?.title }}
          </p>
        </div>
      </v-card-text>
    </v-card>

    <!-- Topics Overview -->
    <v-card class="mt-6">
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" color="primary">mdi-view-list</v-icon>
        All Topics Overview
        <v-spacer></v-spacer>
        <v-chip variant="outlined" color="primary">{{ topics.length }} Topics</v-chip>
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col
            v-for="(topic, index) in topics.slice().sort((a, b) => (b.totalPreferenceScore || 0) - (a.totalPreferenceScore || 0))"
            :key="topic.id"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card 
              variant="outlined" 
              class="h-100 topic-preview-card"
              :class="{ 
                'selected-first': preferences.firstChoice === topic.id,
                'selected-second': preferences.secondChoice === topic.id,
                'frozen-topic': topic.frozen
              }"
            >
              <v-card-title class="text-subtitle-1 d-flex align-center">
                <span class="topic-rank-badge mr-2">#{{ index + 1 }}</span>
                <span class="flex-grow-1">{{ topic.title }}</span>
                <v-chip
                  v-if="topic.frozen"
                  size="x-small"
                  color="error"
                  class="ml-2"
                >
                  Frozen
                </v-chip>
                <v-chip
                  v-if="preferences.firstChoice === topic.id"
                  size="x-small"
                  color="primary"
                  class="ml-1"
                >
                  1st Choice
                </v-chip>
                <v-chip
                  v-if="preferences.secondChoice === topic.id"
                  size="x-small"
                  color="secondary"
                  class="ml-1"
                >
                  2nd Choice
                </v-chip>
              </v-card-title>
              
              <v-card-text>
                <div v-if="topic.description" class="topic-description mb-3">
                  {{ topic.description }}
                </div>
                <div v-else class="text-grey text-caption mb-3">
                  No description provided
                </div>
                
                <v-divider class="mb-2"></v-divider>
                
                <div class="d-flex justify-space-between align-center">
                  <div class="text-caption">
                    <strong>{{ topic.totalPreferenceScore || topic.votes || 0 }}</strong> points
                  </div>
                  <div class="text-caption text-grey">
                    1st: {{ topic.firstChoiceVoters?.length || 0 }} | 2nd: {{ topic.secondChoiceVoters?.length || 0 }}
                  </div>
                </div>
                
                <!-- Quick vote buttons -->
                <div class="mt-2">
                  <v-btn
                    v-if="!topic.frozen"
                    size="x-small"
                    variant="outlined"
                    :color="preferences.firstChoice === topic.id ? 'primary' : 'grey'"
                    @click="quickVoteFirst(topic.id)"
                    class="mr-1"
                  >
                    1st Choice
                  </v-btn>
                  <v-btn
                    v-if="!topic.frozen && preferences.firstChoice !== topic.id"
                    size="x-small"
                    variant="outlined"
                    :color="preferences.secondChoice === topic.id ? 'secondary' : 'grey'"
                    @click="quickVoteSecond(topic.id)"
                  >
                    2nd Choice
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
.topic-preview-card {
  transition: all 0.3s ease;
}

.topic-preview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.12);
}

.selected-first {
  border-color: rgb(var(--v-theme-primary)) !important;
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.selected-second {
  border-color: rgb(var(--v-theme-secondary)) !important;
  background-color: rgba(var(--v-theme-secondary), 0.05);
}

.frozen-topic {
  opacity: 0.6;
  border-color: rgb(var(--v-theme-error)) !important;
}

.topic-rank-badge {
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: bold;
  min-width: 24px;
  text-align: center;
}

.topic-description {
  color: rgba(var(--v-theme-on-surface), 0.8);
  font-size: 0.875rem;
  line-height: 1.4;
}
</style>
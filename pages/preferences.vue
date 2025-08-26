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
const error = ref('')
const success = ref('')

const isAdmin = computed(() => user.value?.role === 'Admin' && !shouldHideAdminFeatures(user.value?.role))

const availableTopics = computed(() => 
  topics.value.filter(topic => !topic.frozen)
)

const firstChoiceOptions = computed(() => 
  availableTopics.value.map(topic => ({
    title: topic.title,
    value: topic.id,
    subtitle: `${topic.totalPreferenceScore || topic.votes || 0} points`
  }))
)

const secondChoiceOptions = computed(() => 
  availableTopics.value
    .filter(topic => topic.id !== preferences.value.firstChoice)
    .map(topic => ({
      title: topic.title,
      value: topic.id,
      subtitle: `${topic.totalPreferenceScore || topic.votes || 0} points`
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
      <v-btn
        color="primary"
        prepend-icon="mdi-refresh"
        @click="loadTopics"
        :loading="loading"
      >
        Refresh
      </v-btn>
    </div>

    <!-- Instructions -->
    <v-alert type="info" class="mb-6" prepend-icon="mdi-information">
      <v-alert-title>How Preference Voting Works</v-alert-title>
      <p class="mt-2">
        Select your <strong>1st choice</strong> (most interested) and <strong>2nd choice</strong> (also interested) topics. 
        First choices get 2 points, second choices get 1 point. If your first choice topic doesn't have enough people, 
        you'll be assigned to your second choice if it has space available.
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
      <v-card-title>All Topics Overview</v-card-title>
      <v-card-text>
        <v-row>
          <v-col
            v-for="topic in topics"
            :key="topic.id"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card variant="outlined" class="h-100">
              <v-card-title class="text-subtitle-1">
                {{ topic.title }}
                <v-chip
                  v-if="topic.frozen"
                  size="x-small"
                  color="error"
                  class="ml-2"
                >
                  Frozen
                </v-chip>
              </v-card-title>
              <v-card-text>
                <div class="text-caption">
                  Score: {{ topic.totalPreferenceScore || topic.votes || 0 }} points
                </div>
                <div class="text-caption">
                  1st choices: {{ topic.firstChoiceVoters?.length || 0 }} |
                  2nd choices: {{ topic.secondChoiceVoters?.length || 0 }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>
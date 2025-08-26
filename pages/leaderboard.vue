<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { User } from '~/types/user'
import type { DiscussionTopic } from '~/types/topic'

const config = useRuntimeConfig()
const { user } = useUserSession()
const VOTE_LIMIT = config.public.maxVotesPerTopic
const topics = ref<DiscussionTopic[]>([])

// Get user's preference votes
const userFirstChoice = computed(() => {
  return topics.value.find(topic => topic.firstChoiceVoters?.includes((user.value as User)?.email || ''))
})

const userSecondChoice = computed(() => {
  return topics.value.find(topic => topic.secondChoiceVoters?.includes((user.value as User)?.email || ''))
})

const hasVotedPreferences = computed(() => !!(userFirstChoice.value || userSecondChoice.value))

// Sort topics by preference score (descending) and get top N
const topTopics = computed(() => {
  return [...topics.value]
    .sort((a, b) => (b.totalPreferenceScore || 0) - (a.totalPreferenceScore || 0))
    .slice(0, config.public.topTopicsCount)
})

async function fetchTopics() {
  const response = await $fetch('/api/topics')
  topics.value = response as DiscussionTopic[]
}

async function cancelVote(topicId: string) {
  await $fetch(`/api/topics/${topicId}/cancel-vote`, {
    method: 'POST'
  })
  
  // Refresh topics to get updated votes
  await fetchTopics()
}

onMounted(() => {
  fetchTopics()
})
</script>

<template>
  <v-container>
    <v-row>
      <v-col>
        <div class="d-flex align-center justify-space-between mb-6">
          <div>
            <h1 class="text-h4 mb-2 text-primary">🏆 Topic Leaderboard</h1>
            <p class="text-body-1 text-grey-darken-1">
              Top {{ config.public.topTopicsCount }} most popular discussion topics
            </p>
          </div>
          <v-btn
            color="primary"
            prepend-icon="mdi-refresh"
            variant="outlined"
            @click="fetchTopics"
          >
            Refresh
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Current Vote Status -->
    <v-row class="mb-4">
      <v-col>
        <v-card v-if="!hasVotedPreferences" color="warning" variant="tonal">
          <v-card-text class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon class="mr-3" size="24">mdi-vote-outline</v-icon>
              <div>
                <strong>Haven't voted yet?</strong>
                <div class="text-caption">Choose your 1st and 2nd preference topics to influence the leaderboard!</div>
              </div>
            </div>
            <v-btn
              color="warning"
              variant="elevated"
              :to="'/preferences'"
              prepend-icon="mdi-vote"
            >
              Vote Now
            </v-btn>
          </v-card-text>
        </v-card>
        
        <v-alert
          v-else
          type="success"
          variant="tonal"
        >
          <div class="d-flex align-center justify-space-between">
            <div>
              <strong>Your Voting Preferences:</strong>
              <div class="mt-2">
                <v-chip
                  v-if="userFirstChoice"
                  color="primary"
                  size="small"
                  class="mr-2 mb-1"
                  prepend-icon="mdi-star"
                  closable
                  @click:close="cancelVote(userFirstChoice.id)"
                >
                  1st: {{ userFirstChoice.title }}
                </v-chip>
                <v-chip
                  v-if="userSecondChoice"
                  color="secondary"
                  size="small"
                  class="mr-2 mb-1"
                  prepend-icon="mdi-star-half-full"
                  closable
                  @click:close="cancelVote(userSecondChoice.id)"
                >
                  2nd: {{ userSecondChoice.title }}
                </v-chip>
              </div>
            </div>
            <v-btn
              color="primary"
              variant="text"
              :to="'/preferences'"
            >
              Change Preferences
            </v-btn>
          </div>
        </v-alert>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="12">
        <v-list>
          <v-list-item
            v-for="(topic, index) in topTopics"
            :key="topic.id"
            :border="true"
            :elevation="(topic.firstChoiceVoters?.includes((user as User)?.email || '') || topic.secondChoiceVoters?.includes((user as User)?.email || '')) ? 3 : (index === 0 ? 3 : 1)"
            :class="{
              'bg-primary-lighten-4': index === 0,
              'border-primary border': topic.firstChoiceVoters?.includes((user as User)?.email || ''),
              'border-secondary border': !topic.firstChoiceVoters?.includes((user as User)?.email || '') && topic.secondChoiceVoters?.includes((user as User)?.email || '')
            }"
            class="mb-2"
          >
            <template v-slot:prepend>
              <div 
                class="text-h5 font-weight-bold mr-4"
                :class="index === 0 ? 'text-primary' : ''"
              >
                #{{ index + 1 }}
              </div>
            </template>
            
            <v-list-item-title class="text-h6 mb-1 d-flex align-center gap-2">
              {{ topic.title }}
              <v-chip
                v-if="topic.badges > 0"
                size="small"
                color="warning"
                prepend-icon="mdi-star"
              >
                {{ topic.badges }}
              </v-chip>
              <v-chip
                v-if="topic.selectedForRound"
                size="small"
                color="success"
                prepend-icon="mdi-check-circle"
              >
                Selected
              </v-chip>
            </v-list-item-title>
            
            <v-list-item-subtitle>
              {{ topic.description }}
              <div class="d-flex align-center mt-2 gap-2">
                <v-progress-linear
                  :model-value="((topic.totalPreferenceScore || 0) / (VOTE_LIMIT * 2)) * 100"
                  color="primary"
                  height="8"
                  rounded
                ></v-progress-linear>
                <span class="text-caption">{{ topic.totalPreferenceScore || 0 }}/{{ VOTE_LIMIT * 2 }} pts</span>
              </div>
              <div class="d-flex gap-4 mt-1">
                <span class="text-caption">
                  <v-icon size="small" color="primary">mdi-star</v-icon>
                  1st: {{ topic.firstChoiceVoters?.length || 0 }}
                </span>
                <span class="text-caption">
                  <v-icon size="small" color="secondary">mdi-star-half-full</v-icon>
                  2nd: {{ topic.secondChoiceVoters?.length || 0 }}
                </span>
              </div>
            </v-list-item-subtitle>
            
            <template v-slot:append>
              <div class="d-flex align-center gap-4">
                <v-chip color="primary" size="large" class="px-4">
                  {{ topic.totalPreferenceScore || 0 }} points
                </v-chip>
                <v-btn
                  v-if="topic.firstChoiceVoters?.includes((user as User)?.email || '') || topic.secondChoiceVoters?.includes((user as User)?.email || '')"
                  color="error"
                  variant="text"
                  :to="'/preferences'"
                >
                  Change Vote
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { User } from '~/types/user'
import type { DiscussionTopic } from '~/types/topic'

const config = useRuntimeConfig()
const { user } = useUserSession()
const VOTE_LIMIT = config.public.maxVotesPerTopic
const topics = ref<DiscussionTopic[]>([])

// Get the topic the user voted for
const votedTopic = computed(() => {
  return topics.value.find(topic => topic.voters.includes(user.value?.email || ''))
})

// Sort topics by votes (descending) and get top N
const topTopics = computed(() => {
  return [...topics.value]
    .sort((a, b) => b.votes - a.votes)
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
        <h1 class="text-h4 mb-6 text-primary">Top {{ config.public.topTopicsCount }} Discussion Topics</h1>
      </v-col>
    </v-row>

    <!-- Current Vote Status -->
    <v-row v-if="votedTopic" class="mb-4">
      <v-col>
        <v-alert
          type="info"
          variant="tonal"
          class="d-flex align-center"
        >
          <div class="flex-grow-1">
            You have voted for: <strong>{{ votedTopic.title }}</strong>
          </div>
          <v-btn
            color="primary"
            variant="text"
            @click="cancelVote(votedTopic.id)"
          >
            Cancel Vote
          </v-btn>
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
            :elevation="topic.voters.includes(user?.email || '') ? 3 : (index === 0 ? 3 : 1)"
            :class="{
              'bg-primary-lighten-4': index === 0,
              'border-primary border': topic.voters.includes(user?.email || '')
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
                  :model-value="(topic.votes / VOTE_LIMIT) * 100"
                  color="primary"
                  height="8"
                  rounded
                ></v-progress-linear>
                <span class="text-caption">{{ topic.votes }}/{{ VOTE_LIMIT }}</span>
              </div>
            </v-list-item-subtitle>
            
            <template v-slot:append>
              <div class="d-flex align-center gap-4">
                <v-chip color="primary" size="large" class="px-4">
                  {{ topic.votes }} votes
                </v-chip>
                <v-btn
                  v-if="topic.voters.includes(user?.email || '')"
                  color="error"
                  variant="text"
                  @click="cancelVote(topic.id)"
                >
                  Cancel Vote
                </v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>
  </v-container>
</template>

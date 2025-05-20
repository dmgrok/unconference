<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import type { User } from '~/types/user'
import type { DiscussionTopic } from '~/types/topic'

const config = useRuntimeConfig()
const { user } = useUserSession()
const VOTE_LIMIT = config.public.maxVotesPerTopic
const dialog = ref(false)
const editDialog = ref(false)
const newRoundConfirmDialog = ref(false)
const freezeConfirmDialog = ref(false)
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

const isAdmin = computed(() => user.value?.role === 'Admin')
const topics = ref<DiscussionTopic[]>([])

// Get the topic the user voted for
const votedTopic = computed(() => {
  return topics.value.find(topic => topic.voters.includes(user.value?.email || ''))
})

const hasVoted = computed(() => !!votedTopic.value)

const canEditTopic = (topic: DiscussionTopic) => {
  return isAdmin.value || topic.createdBy === user.value?.email
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

async function voteForTopic(topicId: string) {
  if (hasVoted.value) return

  await $fetch(`/api/topics/${topicId}/vote`, {
    method: 'POST'
  })
  
  // Refresh topics to get updated votes
  await fetchTopics()
}

async function cancelVote(topicId: string) {
  await $fetch(`/api/topics/${topicId}/cancel-vote`, {
    method: 'POST'
  })
  
  // Refresh topics to get updated votes
  await fetchTopics()
}

async function startNewRound() {
  try {
    await $fetch('/api/topics/new-round', {
      method: 'POST'
    })
    newRoundConfirmDialog.value = false
    await fetchTopics()
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
onMounted(() => {
  fetchTopics()
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

const isVoteDisabled = (topic: DiscussionTopic) => {
  return hasVoted.value || topic.votes >= VOTE_LIMIT || topic.frozen
}

const voteButtonText = (topic: DiscussionTopic) => {
  if (topic.frozen) {
    return 'Topic frozen'
  }
  if (topic.votes >= VOTE_LIMIT) {
    return `Max votes reached (${VOTE_LIMIT})`
  }
  return `Vote (${topic.votes}/${VOTE_LIMIT})`
}
</script>

<template>
  <v-container>
    <!-- Admin Actions -->
    <v-row class="mb-4">
      <v-col class="d-flex justify-end gap-4">
        <v-btn
          v-if="isAdmin"
          color="error"
          prepend-icon="mdi-refresh"
          @click="newRoundConfirmDialog = true"
        >
          New Round
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

    <!-- Current Vote Status -->
    <v-row v-if="hasVoted" class="mb-4">
      <v-col>
        <v-alert
          type="info"
          variant="tonal"
          class="d-flex align-center"
        >
          <div class="flex-grow-1">
            You have voted for: <strong>{{ votedTopic?.title }}</strong>
          </div>
          <v-btn
            color="primary"
            variant="text"
            @click="cancelVote(votedTopic?.id)"
          >
            Cancel Vote
          </v-btn>
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
          class="flex-grow-1"
          :class="{'border-primary border': topic.voters.includes(user?.email || '')}"
          :elevation="topic.voters.includes(user?.email || '') ? 3 : 1"
        >
          <v-card-title class="d-flex align-center">
            {{ topic.title }}
            <v-chip
              v-if="topic.badges > 0"
              size="small"
              color="warning"
              class="ml-2"
              prepend-icon="mdi-star"
            >
              {{ topic.badges }}
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
            <div class="d-flex align-center mt-2 gap-2">
              <v-progress-linear
                :model-value="(topic.votes / VOTE_LIMIT) * 100"
                :color="topic.frozen ? 'error' : 'primary'"
                height="8"
                rounded
              ></v-progress-linear>
              <span class="text-caption">{{ topic.votes }}/{{ VOTE_LIMIT }}</span>
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
            <template v-if="topic.voters.includes(user?.email || '')">
              <v-btn
                color="error"
                variant="text"
                @click="cancelVote(topic.id)"
              >
                Cancel Vote
              </v-btn>
            </template>
            <template v-else>
              <v-btn
                color="primary"
                variant="tonal"
                :disabled="isVoteDisabled(topic)"
                @click="voteForTopic(topic.id)"
              >
                {{ voteButtonText(topic) }}
              </v-btn>
            </template>
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
        <v-card-title>Start New Round</v-card-title>
        <v-card-text>
          Are you sure you want to start a new round? This will:
          <ul class="mt-2">
            <li>Award badges to top 10 topics</li>
            <li>Reset all vote counters</li>
            <li>Allow users to vote again</li>
          </ul>
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
  </v-container>
</template>

<template>
  <v-card class="ideas-collection-panel" elevation="6">
    <v-card-title class="text-h6 font-weight-bold primary white--text">
      <v-icon left color="white">mdi-lightbulb-multiple</v-icon>
      Ideas & Insights Hub
      <v-spacer />
      <v-chip v-if="ideas.length > 0" color="white" text-color="primary" small>
        {{ ideas.length }} ideas collected
      </v-chip>
    </v-card-title>

    <v-card-text class="pa-6">
      <!-- Add New Idea Form -->
      <v-card v-if="canAddIdeas" outlined class="mb-6">
        <v-card-subtitle class="d-flex align-center">
          <v-icon color="success" class="mr-2">mdi-plus-circle</v-icon>
          <span class="font-weight-medium">Capture a New Idea</span>
        </v-card-subtitle>
        
        <v-card-text>
          <v-form ref="ideaForm" v-model="formValid" @submit.prevent="submitIdea">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="newIdea.topicId"
                  :items="topicOptions"
                  item-text="title"
                  item-value="id"
                  label="Related Topic"
                  outlined
                  dense
                  required
                  :rules="[v => !!v || 'Please select a topic']"
                >
                  <template #prepend-inner>
                    <v-icon color="primary">mdi-forum</v-icon>
                  </template>
                </v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="newIdea.category"
                  :items="ideaCategories"
                  label="Idea Type"
                  outlined
                  dense
                  required
                  :rules="[v => !!v || 'Please select a category']"
                >
                  <template #prepend-inner>
                    <v-icon color="secondary">mdi-tag</v-icon>
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <v-text-field
              v-model="newIdea.title"
              label="Idea Title"
              outlined
              dense
              counter="100"
              maxlength="100"
              required
              :rules="titleRules"
              class="mb-3"
            >
              <template #prepend-inner>
                <v-icon color="warning">mdi-lightbulb-outline</v-icon>
              </template>
            </v-text-field>

            <v-textarea
              v-model="newIdea.description"
              label="Describe your idea or insight"
              outlined
              rows="3"
              counter="500"
              maxlength="500"
              required
              :rules="descriptionRules"
              class="mb-3"
            />

            <v-row>
              <v-col cols="12" md="6">
                <v-combobox
                  v-model="newIdea.tags"
                  :items="suggestedTags"
                  label="Tags (press Enter to add)"
                  outlined
                  dense
                  multiple
                  chips
                  deletable-chips
                  small-chips
                >
                  <template #prepend-inner>
                    <v-icon color="info">mdi-tag-multiple</v-icon>
                  </template>
                </v-combobox>
              </v-col>
              <v-col cols="12" md="6">
                <v-slider
                  v-model="newIdea.promisingScore"
                  label="How promising is this idea?"
                  min="1"
                  max="5"
                  step="0.5"
                  ticks
                  tick-labels
                  :tick-size="4"
                  color="amber"
                  track-color="grey lighten-2"
                  class="mt-4"
                />
                <div class="text-center text-caption mt-2">
                  <v-rating
                    :value="newIdea.promisingScore"
                    color="amber"
                    background-color="grey lighten-2"
                    small
                    readonly
                    half-increments
                    dense
                  />
                </div>
              </v-col>
            </v-row>

            <v-switch
              v-model="newIdea.needsFollowUp"
              label="I'd like to follow up on this idea"
              color="success"
              inset
              dense
              class="mt-2 mb-4"
            />

            <v-row>
              <v-col cols="12" class="d-flex justify-end">
                <v-btn
                  type="submit"
                  color="success"
                  :disabled="!formValid"
                  :loading="submitting"
                  large
                >
                  <v-icon left>mdi-check-circle</v-icon>
                  Add Idea
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
      </v-card>

      <!-- Ideas Display -->
      <div v-if="ideas.length > 0">
        <!-- Filters -->
        <v-row class="mb-4">
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.topic"
              :items="topicFilterOptions"
              label="Filter by Topic"
              outlined
              dense
              clearable
              prepend-inner-icon="mdi-filter"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="filters.category"
              :items="categoryFilterOptions"
              label="Filter by Type"
              outlined
              dense
              clearable
              prepend-inner-icon="mdi-tag"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-select
              v-model="sortBy"
              :items="sortOptions"
              label="Sort by"
              outlined
              dense
              prepend-inner-icon="mdi-sort"
            />
          </v-col>
        </v-row>

        <!-- Ideas Grid -->
        <v-row>
          <v-col
            v-for="idea in filteredAndSortedIdeas"
            :key="idea.id"
            cols="12"
            md="6"
            lg="4"
          >
            <v-card outlined class="idea-card h-100" :class="getIdeaCardClass(idea)">
              <v-card-subtitle class="pb-2">
                <div class="d-flex align-center justify-space-between">
                  <v-chip :color="getCategoryColor(idea.category)" text-color="white" x-small>
                    {{ idea.category }}
                  </v-chip>
                  <v-chip outlined x-small>
                    {{ getTopicTitle(idea.topicId) }}
                  </v-chip>
                </div>
              </v-card-subtitle>
              
              <v-card-text class="pt-0">
                <div class="text-h6 font-weight-medium mb-2">{{ idea.title }}</div>
                <div class="text-body-2 text--secondary mb-3">{{ idea.description }}</div>
                
                <div class="d-flex align-center justify-space-between mb-3">
                  <v-rating
                    :value="idea.promisingScore"
                    color="amber"
                    background-color="grey lighten-2"
                    small
                    readonly
                    half-increments
                    dense
                  />
                  <div class="text-caption text--secondary">
                    <v-icon small>mdi-account</v-icon>
                    {{ idea.author }}
                  </div>
                </div>

                <div v-if="idea.tags.length > 0" class="mb-3">
                  <v-chip
                    v-for="tag in idea.tags"
                    :key="tag"
                    x-small
                    outlined
                    class="ma-1"
                  >
                    {{ tag }}
                  </v-chip>
                </div>

                <div class="d-flex align-center justify-space-between">
                  <div class="text-caption">
                    <v-icon small :color="idea.needsFollowUp ? 'success' : 'grey'">
                      {{ idea.needsFollowUp ? 'mdi-check-circle' : 'mdi-circle-outline' }}
                    </v-icon>
                    {{ idea.needsFollowUp ? 'Follow-up planned' : 'No follow-up' }}
                  </div>
                  <div class="text-caption text--secondary">
                    {{ formatTime(idea.createdAt) }}
                  </div>
                </div>
              </v-card-text>

              <v-card-actions>
                <v-btn text small @click="likeIdea(idea.id)">
                  <v-icon small :color="idea.liked ? 'red' : 'grey'">
                    {{ idea.liked ? 'mdi-heart' : 'mdi-heart-outline' }}
                  </v-icon>
                  {{ idea.likes }}
                </v-btn>
                
                <v-btn text small @click="showIdeaDetails(idea)">
                  <v-icon small>mdi-information-outline</v-icon>
                  Details
                </v-btn>
                
                <v-spacer />
                
                <v-btn
                  v-if="idea.needsFollowUp"
                  text
                  small
                  color="success"
                  @click="expressInterest(idea.id)"
                >
                  <v-icon small>mdi-hand-heart</v-icon>
                  Interested
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Empty State -->
      <v-card v-else outlined class="text-center pa-8">
        <v-icon size="64" color="grey lighten-1">mdi-lightbulb-outline</v-icon>
        <h3 class="text-h6 mt-4 mb-2 grey--text">No ideas captured yet</h3>
        <p class="text-body-2 grey--text">
          {{ canAddIdeas 
            ? 'Start by sharing the first insight or idea from your discussions!' 
            : 'Ideas and insights will appear here as participants share them during the event.' 
          }}
        </p>
      </v-card>
    </v-card-text>

    <!-- Floating Action Button -->
    <v-btn
      v-if="canAddIdeas && ideas.length > 0"
      fab
      fixed
      bottom
      right
      color="success"
      @click="scrollToForm"
    >
      <v-icon>mdi-plus</v-icon>
    </v-btn>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Idea {
  id: string
  topicId: string
  title: string
  description: string
  category: string
  tags: string[]
  promisingScore: number
  needsFollowUp: boolean
  author: string
  likes: number
  liked: boolean
  interestedUsers: string[]
  createdAt: string
}

interface NewIdea {
  topicId: string
  title: string
  description: string
  category: string
  tags: string[]
  promisingScore: number
  needsFollowUp: boolean
}

const props = defineProps<{
  eventData?: any
  canAddIdeas?: boolean
  userId?: string
}>()

const emit = defineEmits<{
  ideaAdded: [idea: Idea]
  ideaLiked: [ideaId: string]
  interestExpressed: [ideaId: string, userId: string]
}>()

// Form state
const ideaForm = ref()
const formValid = ref(false)
const submitting = ref(false)

// New idea data
const newIdea = ref<NewIdea>({
  topicId: '',
  title: '',
  description: '',
  category: 'insight',
  tags: [],
  promisingScore: 3,
  needsFollowUp: false
})

// Ideas data
const ideas = ref<Idea[]>([])

// Filters and sorting
const filters = ref({
  topic: null,
  category: null
})

const sortBy = ref('newest')

// Form validation rules
const titleRules = [
  (v: string) => !!v || 'Title is required',
  (v: string) => v.length <= 100 || 'Title must be less than 100 characters'
]

const descriptionRules = [
  (v: string) => !!v || 'Description is required',
  (v: string) => v.length <= 500 || 'Description must be less than 500 characters'
]

// Options and data
const ideaCategories = [
  'insight',
  'solution',
  'opportunity',
  'challenge',
  'resource',
  'connection',
  'next-step'
]

const topicOptions = computed(() => {
  // In real implementation, this would come from props.eventData
  return [
    { id: 'topic1', title: 'AI Ethics & Governance' },
    { id: 'topic2', title: 'Climate Technology Solutions' },
    { id: 'topic3', title: 'Remote Work Innovation' },
    { id: 'topic4', title: 'Community Building' },
    { id: 'topic5', title: 'Digital Wellness' }
  ]
})

const suggestedTags = [
  'actionable', 'research-needed', 'funding-required', 'collaboration',
  'technical', 'policy', 'community', 'innovation', 'startup-idea',
  'open-source', 'social-impact', 'scalable', 'experimental'
]

const sortOptions = [
  { text: 'Newest First', value: 'newest' },
  { text: 'Most Promising', value: 'promising' },
  { text: 'Most Liked', value: 'likes' },
  { text: 'Follow-up Priority', value: 'followup' }
]

// Computed properties
const topicFilterOptions = computed(() => [
  { text: 'All Topics', value: null },
  ...topicOptions.value.map(topic => ({
    text: topic.title,
    value: topic.id
  }))
])

const categoryFilterOptions = computed(() => [
  { text: 'All Types', value: null },
  ...ideaCategories.map(cat => ({
    text: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: cat
  }))
])

const filteredAndSortedIdeas = computed(() => {
  let filtered = ideas.value

  if (filters.value.topic) {
    filtered = filtered.filter(idea => idea.topicId === filters.value.topic)
  }

  if (filters.value.category) {
    filtered = filtered.filter(idea => idea.category === filters.value.category)
  }

  // Sort ideas
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'promising':
        return b.promisingScore - a.promisingScore
      case 'likes':
        return b.likes - a.likes
      case 'followup':
        return (b.needsFollowUp ? 1 : 0) - (a.needsFollowUp ? 1 : 0)
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  return filtered
})

// Methods
const submitIdea = async () => {
  if (!formValid.value) return

  submitting.value = true
  
  try {
    const idea: Idea = {
      id: generateId(),
      ...newIdea.value,
      author: props.userId || 'Anonymous',
      likes: 0,
      liked: false,
      interestedUsers: [],
      createdAt: new Date().toISOString()
    }

    ideas.value.unshift(idea)
    emit('ideaAdded', idea)

    // Reset form
    newIdea.value = {
      topicId: '',
      title: '',
      description: '',
      category: 'insight',
      tags: [],
      promisingScore: 3,
      needsFollowUp: false
    }

    ideaForm.value?.reset()
    
  } finally {
    submitting.value = false
  }
}

const likeIdea = (ideaId: string) => {
  const idea = ideas.value.find(i => i.id === ideaId)
  if (idea) {
    if (idea.liked) {
      idea.likes--
      idea.liked = false
    } else {
      idea.likes++
      idea.liked = true
    }
    emit('ideaLiked', ideaId)
  }
}

const expressInterest = (ideaId: string) => {
  const idea = ideas.value.find(i => i.id === ideaId)
  if (idea && props.userId && !idea.interestedUsers.includes(props.userId)) {
    idea.interestedUsers.push(props.userId)
    emit('interestExpressed', ideaId, props.userId)
  }
}

const showIdeaDetails = (idea: Idea) => {
  // Implementation for showing detailed view
  console.log('Show details for idea:', idea)
}

const scrollToForm = () => {
  ideaForm.value?.$el.scrollIntoView({ behavior: 'smooth' })
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    insight: 'blue',
    solution: 'green',
    opportunity: 'orange',
    challenge: 'red',
    resource: 'purple',
    connection: 'teal',
    'next-step': 'indigo'
  }
  return colors[category] || 'grey'
}

const getIdeaCardClass = (idea: Idea) => {
  return {
    'border-l-4': true,
    'border-l-success': idea.promisingScore >= 4,
    'border-l-warning': idea.promisingScore >= 3 && idea.promisingScore < 4,
    'border-l-grey': idea.promisingScore < 3
  }
}

const getTopicTitle = (topicId: string) => {
  return topicOptions.value.find(topic => topic.id === topicId)?.title || 'Unknown Topic'
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

const generateId = () => {
  return 'idea_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

const loadSampleData = () => {
  // Load sample ideas for demonstration
  ideas.value = [
    {
      id: '1',
      topicId: 'topic1',
      title: 'AI Bias Detection Framework',
      description: 'A comprehensive framework for automatically detecting and mitigating bias in AI systems before deployment.',
      category: 'solution',
      tags: ['technical', 'actionable', 'scalable'],
      promisingScore: 4.5,
      needsFollowUp: true,
      author: 'Sarah Chen',
      likes: 8,
      liked: false,
      interestedUsers: ['user1', 'user2', 'user3'],
      createdAt: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
    },
    {
      id: '2',
      topicId: 'topic2',
      title: 'Community Solar Sharing Platform',
      description: 'A blockchain-based platform that allows neighborhoods to share solar energy resources and trade excess power.',
      category: 'opportunity',
      tags: ['blockchain', 'community', 'funding-required'],
      promisingScore: 4.2,
      needsFollowUp: true,
      author: 'Marcus Johnson',
      likes: 12,
      liked: true,
      interestedUsers: ['user4', 'user5'],
      createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    },
    {
      id: '3',
      topicId: 'topic3',
      title: 'Async Meeting Best Practices',
      description: 'Discovered that rotating meeting leadership and using structured templates increases async meeting effectiveness by 40%.',
      category: 'insight',
      tags: ['research-needed', 'actionable'],
      promisingScore: 3.8,
      needsFollowUp: false,
      author: 'Alex Rivera',
      likes: 5,
      liked: false,
      interestedUsers: [],
      createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
    }
  ]
}

onMounted(() => {
  loadSampleData()
})
</script>

<style scoped>
.idea-card {
  transition: all 0.3s ease;
  border-left: 4px solid transparent;
}

.idea-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.border-l-success {
  border-left-color: #4caf50 !important;
}

.border-l-warning {
  border-left-color: #ff9800 !important;
}

.border-l-grey {
  border-left-color: #9e9e9e !important;
}
</style>

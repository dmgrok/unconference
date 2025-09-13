<template>
  <div class="drag-drop-voting">
    <!-- Instructions Card -->
    <v-card variant="outlined" class="mb-4" :class="{ 'pulse-border': !hasVotedPreferences }">
      <v-card-text class="text-center py-3">
        <v-icon :color="hasVotedPreferences ? 'success' : 'primary'" class="mr-2">
          {{ hasVotedPreferences ? 'mdi-check-circle' : 'mdi-hand-pointing-right' }}
        </v-icon>
        <span class="text-body-1 font-weight-medium">
          {{ hasVotedPreferences 
            ? 'Great! You\'ve cast your votes.' 
            : 'Drag topics to your preference zones below' }}
        </span>
      </v-card-text>
    </v-card>

    <!-- Drop Zones -->
    <v-row class="mb-6">
      <!-- First Choice Zone -->
      <v-col cols="12" md="6">
        <div 
          class="drop-zone first-choice"
          :class="{ 
            'drop-zone--active': isDragging && !draggedTopic?.isFirstChoice,
            'drop-zone--filled': firstChoice,
            'drop-zone--over': dragOverZone === 'first'
          }"
          @drop="onDrop($event, 'first')"
          @dragover="onDragOver($event, 'first')"
          @dragleave="onDragLeave"
        >
          <div class="drop-zone-header">
            <v-icon color="primary" size="large">mdi-trophy</v-icon>
            <h3 class="text-h6 mt-2 mb-1">First Choice</h3>
            <p class="text-caption text-grey">Worth 2 points</p>
          </div>
          
          <div class="drop-zone-content">
            <div v-if="firstChoice" class="voted-topic">
              <TopicCard
                :topic="firstChoice"
                :draggable="!isVotingDisabled"
                :is-voted="true"
                vote-type="first"
                @dragstart="onDragStart"
                @click="!isVotingDisabled && removeVote(firstChoice.id)"
              >
                <template #actions>
                  <v-btn
                    v-if="!isVotingDisabled"
                    icon="mdi-close"
                    size="small"
                    color="error"
                    variant="text"
                    @click.stop="removeVote(firstChoice.id)"
                  />
                </template>
              </TopicCard>
            </div>
            <div v-else class="drop-placeholder">
              <v-icon color="grey-lighten-1" size="48">mdi-trophy-outline</v-icon>
              <p class="text-caption text-grey mt-2">Drop your top choice here</p>
            </div>
          </div>
        </div>
      </v-col>

      <!-- Second Choice Zone -->
      <v-col cols="12" md="6">
        <div 
          class="drop-zone second-choice"
          :class="{ 
            'drop-zone--active': isDragging && !draggedTopic?.isSecondChoice,
            'drop-zone--filled': secondChoice,
            'drop-zone--over': dragOverZone === 'second'
          }"
          @drop="onDrop($event, 'second')"
          @dragover="onDragOver($event, 'second')"
          @dragleave="onDragLeave"
        >
          <div class="drop-zone-header">
            <v-icon color="secondary" size="large">mdi-medal</v-icon>
            <h3 class="text-h6 mt-2 mb-1">Second Choice</h3>
            <p class="text-caption text-grey">Worth 1 point</p>
          </div>
          
          <div class="drop-zone-content">
            <div v-if="secondChoice" class="voted-topic">
              <TopicCard
                :topic="secondChoice"
                :draggable="!isVotingDisabled"
                :is-voted="true"
                vote-type="second"
                @dragstart="onDragStart"
                @click="!isVotingDisabled && removeVote(secondChoice.id)"
              >
                <template #actions>
                  <v-btn
                    v-if="!isVotingDisabled"
                    icon="mdi-close"
                    size="small"
                    color="error"
                    variant="text"
                    @click.stop="removeVote(secondChoice.id)"
                  />
                </template>
              </TopicCard>
            </div>
            <div v-else class="drop-placeholder">
              <v-icon color="grey-lighten-1" size="48">mdi-medal-outline</v-icon>
              <p class="text-caption text-grey mt-2">Drop your second choice here</p>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Available Topics -->
    <div class="topics-section">
      <h3 class="text-h6 mb-4 d-flex align-center">
        <v-icon class="mr-2">mdi-lightbulb-multiple</v-icon>
        Available Topics
        <v-chip class="ml-2" size="small" color="info">{{ availableTopics.length }}</v-chip>
      </h3>

      <div v-if="availableTopics.length === 0" class="text-center py-8">
        <v-icon size="64" color="grey-lighten-2">mdi-check-all</v-icon>
        <h4 class="text-h6 text-grey mt-2">All topics have your votes!</h4>
        <p class="text-body-2 text-grey">You can drag voted topics around to change your preferences.</p>
      </div>

      <div v-else class="topics-grid">
        <TopicCard
          v-for="topic in availableTopics"
          :key="topic.id"
          :topic="topic"
          :draggable="!isVotingDisabled"
          :is-voted="false"
          @dragstart="onDragStart"
          @click="!isVotingDisabled && quickVote(topic)"
        >
          <template #actions>
            <v-btn
              v-if="!isVotingDisabled"
              icon="mdi-plus"
              size="small"
              color="primary"
              variant="text"
              @click.stop="quickVote(topic)"
            />
          </template>
        </TopicCard>
      </div>
    </div>

    <!-- Success Animation -->
    <div 
      v-if="showVoteSuccess"
      class="vote-success-overlay"
      @animationend="showVoteSuccess = false"
    >
      <div class="vote-success-content">
        <v-icon size="100" color="success" class="animate-bounce">mdi-check-circle</v-icon>
        <h3 class="text-h6 mt-2 font-weight-bold text-success">Vote Recorded!</h3>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { DiscussionTopic } from '~/types/topic'

interface Props {
  topics: DiscussionTopic[]
  firstChoice?: DiscussionTopic | null
  secondChoice?: DiscussionTopic | null
  isVotingDisabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  firstChoice: null,
  secondChoice: null,
  isVotingDisabled: false
})

const emit = defineEmits<{
  vote: [{ topicId: string; position: 'first' | 'second' }]
  removeVote: [string]
  updatePreferences: [{ firstChoice?: string; secondChoice?: string }]
}>()

// Reactive state
const isDragging = ref(false)
const draggedTopic = ref<DiscussionTopic & { isFirstChoice?: boolean; isSecondChoice?: boolean } | null>(null)
const dragOverZone = ref<'first' | 'second' | null>(null)
const showVoteSuccess = ref(false)

// Computed properties
const hasVotedPreferences = computed(() => !!(props.firstChoice || props.secondChoice))

const availableTopics = computed(() => {
  return props.topics.filter(topic => 
    topic.id !== props.firstChoice?.id && 
    topic.id !== props.secondChoice?.id
  )
})

// Drag and drop handlers
const onDragStart = (event: DragEvent, topic: DiscussionTopic) => {
  if (props.isVotingDisabled) return
  
  isDragging.value = true
  draggedTopic.value = {
    ...topic,
    isFirstChoice: topic.id === props.firstChoice?.id,
    isSecondChoice: topic.id === props.secondChoice?.id
  }
  
  event.dataTransfer!.setData('text/plain', topic.id)
  event.dataTransfer!.effectAllowed = 'move'
  
  // Add drag effect
  const target = event.target as HTMLElement
  target.style.opacity = '0.5'
  
  setTimeout(() => {
    if (target) target.style.opacity = '1'
  }, 100)
}

const onDragOver = (event: DragEvent, zone: 'first' | 'second') => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'move'
  dragOverZone.value = zone
}

const onDragLeave = () => {
  dragOverZone.value = null
}

const onDrop = async (event: DragEvent, zone: 'first' | 'second') => {
  event.preventDefault()
  
  if (!draggedTopic.value || props.isVotingDisabled) return
  
  const topicId = draggedTopic.value.id
  
  // Determine new preferences
  let newFirstChoice = props.firstChoice?.id
  let newSecondChoice = props.secondChoice?.id
  
  if (zone === 'first') {
    // If dropping on first choice zone
    if (draggedTopic.value.isSecondChoice) {
      // Move from second to first
      newFirstChoice = topicId
      newSecondChoice = props.firstChoice?.id
    } else {
      // New topic to first choice
      if (props.firstChoice) {
        // Push existing first choice to second
        newSecondChoice = props.firstChoice.id
      }
      newFirstChoice = topicId
    }
  } else {
    // If dropping on second choice zone
    if (draggedTopic.value.isFirstChoice) {
      // Move from first to second
      newSecondChoice = topicId
      newFirstChoice = props.secondChoice?.id
    } else {
      // New topic to second choice
      newSecondChoice = topicId
    }
  }
  
  // Clean up state
  isDragging.value = false
  draggedTopic.value = null
  dragOverZone.value = null
  
  // Update preferences
  await updatePreferences(newFirstChoice, newSecondChoice)
}

// Quick vote (click to add to first available slot)
const quickVote = async (topic: DiscussionTopic) => {
  if (props.isVotingDisabled) return
  
  if (!props.firstChoice) {
    await updatePreferences(topic.id, props.secondChoice?.id)
  } else if (!props.secondChoice) {
    await updatePreferences(props.firstChoice.id, topic.id)
  } else {
    // Both slots taken, replace first and move old first to second
    await updatePreferences(topic.id, props.firstChoice.id)
  }
}

// Remove vote
const removeVote = async (topicId: string) => {
  if (props.isVotingDisabled) return
  
  let newFirstChoice = props.firstChoice?.id
  let newSecondChoice = props.secondChoice?.id
  
  if (topicId === props.firstChoice?.id) {
    newFirstChoice = undefined
  } else if (topicId === props.secondChoice?.id) {
    newSecondChoice = undefined
  }
  
  await updatePreferences(newFirstChoice, newSecondChoice)
}

// Update preferences API call
const updatePreferences = async (firstChoiceId?: string, secondChoiceId?: string) => {
  try {
    emit('updatePreferences', {
      firstChoice: firstChoiceId,
      secondChoice: secondChoiceId
    })
    
    // Show success animation
    showVoteSuccess.value = true
  } catch (error) {
    console.error('Error updating preferences:', error)
  }
}

// Clean up drag state on component unmount
watch(isDragging, (newValue) => {
  if (!newValue) {
    draggedTopic.value = null
    dragOverZone.value = null
  }
})
</script>

<style scoped>
.drag-drop-voting {
  position: relative;
}

.pulse-border {
  animation: pulse-border 2s infinite;
}

@keyframes pulse-border {
  0%, 100% { border-color: var(--v-primary-base); }
  50% { border-color: var(--v-primary-lighten2); }
}

.drop-zone {
  min-height: 200px;
  border: 2px dashed #ccc;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(145deg, #fafafa, #f5f5f5);
  position: relative;
  overflow: hidden;
}

.drop-zone--active {
  border-color: #2196f3;
  background: linear-gradient(145deg, #e3f2fd, #f1f8ff);
  transform: scale(1.02);
  box-shadow: 0 4px 20px rgba(33, 150, 243, 0.2);
}

.drop-zone--over {
  border-color: #4caf50;
  background: linear-gradient(145deg, #e8f5e8, #f1f8e9);
  box-shadow: 0 8px 24px rgba(76, 175, 80, 0.3);
}

.drop-zone--filled {
  border-color: #4caf50;
  background: linear-gradient(145deg, #fff, #fafafa);
}

.drop-zone.first-choice--active {
  border-color: #ff9800;
  background: linear-gradient(145deg, #fff3e0, #fef7e6);
}

.drop-zone.second-choice--active {
  border-color: #9c27b0;
  background: linear-gradient(145deg, #f3e5f5, #f8f0fa);
}

.drop-zone-header {
  text-align: center;
  margin-bottom: 16px;
}

.drop-zone-content {
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drop-placeholder {
  text-align: center;
  opacity: 0.6;
}

.voted-topic {
  width: 100%;
}

.topics-section {
  margin-top: 2rem;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.vote-success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: success-fade 2s ease-out forwards;
}

.vote-success-content {
  text-align: center;
  color: white;
  animation: success-scale 0.6s ease-out;
}

.animate-bounce {
  animation: bounce 1s infinite;
}

@keyframes success-fade {
  0% { opacity: 1; }
  70% { opacity: 1; }
  100% { opacity: 0; pointer-events: none; }
}

@keyframes success-scale {
  0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
  50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
  40%, 43% { transform: translateY(-8px); }
  70% { transform: translateY(-4px); }
  90% { transform: translateY(-2px); }
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .topics-grid {
    grid-template-columns: 1fr;
  }
  
  .drop-zone {
    min-height: 150px;
    padding: 12px;
  }
  
  .vote-success-content .v-icon {
    font-size: 80px !important;
  }
}
</style>
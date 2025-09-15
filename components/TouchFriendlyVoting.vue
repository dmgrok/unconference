<template>
  <div class="touch-voting" ref="containerRef">
    <!-- Mobile Instructions -->
    <v-card variant="outlined" class="mb-4 mobile-instructions" :class="{ 'pulse-border': !hasVotedPreferences }">
      <v-card-text class="text-center py-3">
        <v-icon :color="hasVotedPreferences ? 'success' : 'primary'" class="mr-2">
          {{ hasVotedPreferences ? 'mdi-check-circle' : 'mdi-gesture-swipe-horizontal' }}
        </v-icon>
        <span class="text-body-1 font-weight-medium">
          {{ hasVotedPreferences
            ? 'Great! You\'ve cast your votes.'
            : isMobile ? 'Swipe right for 1st choice, left for 2nd choice' : 'Drag topics to your preference zones below' }}
        </span>
        <div v-if="!hasVotedPreferences && isMobile" class="mt-2">
          <v-chip size="small" color="warning" class="mr-2">
            <v-icon start size="small">mdi-arrow-right</v-icon>
            1st Choice
          </v-chip>
          <v-chip size="small" color="info">
            <v-icon start size="small">mdi-arrow-left</v-icon>
            2nd Choice
          </v-chip>
        </div>
      </v-card-text>
    </v-card>

    <!-- Drop Zones for Desktop/Tablet -->
    <v-row v-if="!isMobile" class="mb-6">
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

    <!-- Mobile Choice Display -->
    <div v-if="isMobile && hasVotedPreferences" class="mobile-choices mb-4">
      <v-row>
        <v-col v-if="firstChoice" cols="12" sm="6">
          <v-card class="choice-card first-choice-mobile" elevation="4">
            <v-card-title class="text-center py-2">
              <v-chip color="warning" size="small" prepend-icon="mdi-star">1st Choice</v-chip>
            </v-card-title>
            <v-card-text class="text-center py-2">
              <h3 class="text-subtitle-1 mb-1">{{ firstChoice.title }}</h3>
              <p class="text-caption text-grey">{{ firstChoice.description }}</p>
              <v-btn
                v-if="!isVotingDisabled"
                size="small"
                color="error"
                variant="outlined"
                @click="removeVote(firstChoice.id)"
                class="mt-2"
              >
                Remove
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col v-if="secondChoice" cols="12" sm="6">
          <v-card class="choice-card second-choice-mobile" elevation="4">
            <v-card-title class="text-center py-2">
              <v-chip color="info" size="small" prepend-icon="mdi-star-half-full">2nd Choice</v-chip>
            </v-card-title>
            <v-card-text class="text-center py-2">
              <h3 class="text-subtitle-1 mb-1">{{ secondChoice.title }}</h3>
              <p class="text-caption text-grey">{{ secondChoice.description }}</p>
              <v-btn
                v-if="!isVotingDisabled"
                size="small"
                color="error"
                variant="outlined"
                @click="removeVote(secondChoice.id)"
                class="mt-2"
              >
                Remove
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

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
        <p class="text-body-2 text-grey">You can change your preferences by removing votes above.</p>
      </div>

      <div v-else class="topics-grid">
        <div
          v-for="topic in availableTopics"
          :key="topic.id"
          class="topic-item-wrapper"
          :class="{ 'topic-item--swiping': swipingTopicId === topic.id }"
          @touchstart="onTouchStart($event, topic)"
          @touchmove="onTouchMove($event, topic)"
          @touchend="onTouchEnd($event, topic)"
          @touchcancel="onTouchCancel"
        >
          <!-- Swipe Indicators for Mobile -->
          <div v-if="isMobile" class="swipe-indicators">
            <div class="swipe-indicator swipe-left" :class="{ 'active': swipeDirection === 'left' && swipingTopicId === topic.id }">
              <v-icon color="info" size="large">mdi-star-half-full</v-icon>
              <span>2nd Choice</span>
            </div>
            <div class="swipe-indicator swipe-right" :class="{ 'active': swipeDirection === 'right' && swipingTopicId === topic.id }">
              <v-icon color="warning" size="large">mdi-star</v-icon>
              <span>1st Choice</span>
            </div>
          </div>

          <TopicCard
            :topic="topic"
            :draggable="!isVotingDisabled && !isMobile"
            :is-voted="false"
            @dragstart="onDragStart"
            @click="!isVotingDisabled && quickVote(topic)"
            :style="getTopicCardStyle(topic.id)"
            class="swipeable-topic-card"
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

    <!-- Haptic Feedback Helper (invisible) -->
    <div ref="hapticHelper" class="haptic-helper"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useDisplay } from 'vuetify'
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

const { mobile } = useDisplay()
const isMobile = computed(() => mobile.value)

// Reactive state
const containerRef = ref<HTMLElement>()
const hapticHelper = ref<HTMLElement>()
const isDragging = ref(false)
const draggedTopic = ref<DiscussionTopic & { isFirstChoice?: boolean; isSecondChoice?: boolean } | null>(null)
const dragOverZone = ref<'first' | 'second' | null>(null)
const showVoteSuccess = ref(false)

// Touch/Swipe state
const swipingTopicId = ref<string | null>(null)
const swipeDirection = ref<'left' | 'right' | null>(null)
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchCurrentX = ref(0)
const touchCurrentY = ref(0)
const swipeThreshold = 100
const swipeVelocityThreshold = 0.5

// Computed properties
const hasVotedPreferences = computed(() => !!(props.firstChoice || props.secondChoice))

const availableTopics = computed(() => {
  return props.topics.filter(topic =>
    topic.id !== props.firstChoice?.id &&
    topic.id !== props.secondChoice?.id
  )
})

// Haptic feedback function
const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
  if ('vibrate' in navigator) {
    // Fallback vibration for devices without haptic feedback API
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30, 10, 30]
    }
    navigator.vibrate(patterns[type])
  }

  // Modern Haptic Feedback API (iOS Safari)
  if ('ontouchstart' in window && (window as any).DeviceMotionEvent) {
    try {
      // Create a subtle visual feedback as well
      if (hapticHelper.value) {
        hapticHelper.value.style.transform = 'scale(1.1)'
        setTimeout(() => {
          if (hapticHelper.value) {
            hapticHelper.value.style.transform = 'scale(1)'
          }
        }, 100)
      }
    } catch (e) {
      // Silently fail if haptic feedback is not available
    }
  }
}

// Touch handlers for swipe gestures
const onTouchStart = (event: TouchEvent, topic: DiscussionTopic) => {
  if (!isMobile.value || props.isVotingDisabled) return

  const touch = event.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  touchCurrentX.value = touch.clientX
  touchCurrentY.value = touch.clientY
  swipingTopicId.value = topic.id

  triggerHapticFeedback('light')
}

const onTouchMove = (event: TouchEvent, topic: DiscussionTopic) => {
  if (!isMobile.value || props.isVotingDisabled || swipingTopicId.value !== topic.id) return

  event.preventDefault()
  const touch = event.touches[0]
  touchCurrentX.value = touch.clientX
  touchCurrentY.value = touch.clientY

  const deltaX = touchCurrentX.value - touchStartX.value
  const deltaY = Math.abs(touchCurrentY.value - touchStartY.value)

  // Only process horizontal swipes (ignore vertical scrolling)
  if (Math.abs(deltaX) > deltaY && Math.abs(deltaX) > 20) {
    if (deltaX > 30) {
      swipeDirection.value = 'right'
    } else if (deltaX < -30) {
      swipeDirection.value = 'left'
    } else {
      swipeDirection.value = null
    }
  }
}

const onTouchEnd = async (event: TouchEvent, topic: DiscussionTopic) => {
  if (!isMobile.value || props.isVotingDisabled || swipingTopicId.value !== topic.id) return

  const deltaX = touchCurrentX.value - touchStartX.value
  const deltaY = Math.abs(touchCurrentY.value - touchStartY.value)
  const distance = Math.abs(deltaX)

  // Calculate velocity (distance over time)
  const touchDuration = Date.now() - (event.timeStamp || Date.now())
  const velocity = distance / Math.max(touchDuration, 1)

  // Determine if swipe was successful
  const isSwipe = distance > swipeThreshold || velocity > swipeVelocityThreshold
  const isHorizontalSwipe = Math.abs(deltaX) > deltaY

  if (isSwipe && isHorizontalSwipe) {
    if (deltaX > 0) {
      // Swipe right - first choice
      triggerHapticFeedback('heavy')
      await updatePreferences(topic.id, props.secondChoice?.id)
    } else {
      // Swipe left - second choice
      triggerHapticFeedback('heavy')
      await updatePreferences(props.firstChoice?.id, topic.id)
    }
  }

  // Reset swipe state
  onTouchCancel()
}

const onTouchCancel = () => {
  swipingTopicId.value = null
  swipeDirection.value = null
  touchStartX.value = 0
  touchStartY.value = 0
  touchCurrentX.value = 0
  touchCurrentY.value = 0
}

// Get dynamic styles for topic cards during swipe
const getTopicCardStyle = (topicId: string) => {
  if (swipingTopicId.value !== topicId) return {}

  const deltaX = touchCurrentX.value - touchStartX.value
  const rotation = Math.min(Math.max(deltaX / 10, -15), 15)
  const scale = 1 + Math.min(Math.abs(deltaX) / 1000, 0.1)

  return {
    transform: `translateX(${deltaX * 0.3}px) rotate(${rotation}deg) scale(${scale})`,
    zIndex: 1000,
    transition: swipingTopicId.value ? 'none' : 'transform 0.3s ease',
  }
}

// Drag and drop handlers (for desktop/tablet)
const onDragStart = (event: DragEvent, topic: DiscussionTopic) => {
  if (props.isVotingDisabled || isMobile.value) return

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

  triggerHapticFeedback('medium')

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

  triggerHapticFeedback('light')

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
    triggerHapticFeedback('heavy')
  } catch (error) {
    console.error('Error updating preferences:', error)
  }
}

// Clean up touch state on component unmount
onBeforeUnmount(() => {
  onTouchCancel()
})

// Clean up drag state on changes
watch(isDragging, (newValue) => {
  if (!newValue) {
    draggedTopic.value = null
    dragOverZone.value = null
  }
})
</script>

<style scoped>
.touch-voting {
  position: relative;
}

.pulse-border {
  animation: pulse-border 2s infinite;
}

@keyframes pulse-border {
  0%, 100% { border-color: var(--v-primary-base); }
  50% { border-color: var(--v-primary-lighten2); }
}

/* Mobile Instructions */
.mobile-instructions .v-chip {
  margin: 0 4px;
}

/* Drop Zones (Desktop/Tablet) */
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

/* Mobile Choice Display */
.mobile-choices .choice-card {
  border-radius: 12px;
  background: linear-gradient(145deg, #fff, #fafafa);
}

.first-choice-mobile {
  border: 2px solid #ff9800;
  background: linear-gradient(145deg, #fff3e0, #fef7e6);
}

.second-choice-mobile {
  border: 2px solid #2196f3;
  background: linear-gradient(145deg, #e3f2fd, #f1f8ff);
}

/* Topics Grid */
.topics-section {
  margin-top: 2rem;
}

.topics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

/* Swipe Gestures */
.topic-item-wrapper {
  position: relative;
  touch-action: pan-y; /* Allow vertical scrolling */
}

.topic-item--swiping {
  z-index: 1000;
}

.swipeable-topic-card {
  transition: transform 0.3s ease;
  user-select: none;
}

.swipe-indicators {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.swipe-indicator {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 12px;
  margin: 8px;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s ease;
  padding: 20px;
}

.swipe-indicator.active {
  opacity: 0.95;
  transform: scale(1);
}

.swipe-indicator span {
  font-weight: bold;
  font-size: 0.875rem;
  margin-top: 8px;
}

.swipe-left {
  margin-right: 50%;
}

.swipe-right {
  margin-left: 50%;
}

/* Success Animation */
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

/* Haptic Helper */
.haptic-helper {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
  transition: transform 0.1s ease;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .topics-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .drop-zone {
    min-height: 150px;
    padding: 12px;
  }

  .vote-success-content .v-icon {
    font-size: 80px !important;
  }

  .swipe-indicator {
    padding: 16px;
    margin: 4px;
  }

  .swipe-indicator span {
    font-size: 0.75rem;
  }
}

@media (max-width: 480px) {
  .topics-grid {
    gap: 8px;
  }

  .mobile-choices .v-col {
    padding: 8px;
  }

  .choice-card .v-card-title,
  .choice-card .v-card-text {
    padding: 12px;
  }

  .swipe-indicator {
    padding: 12px;
    margin: 2px;
  }
}

/* Touch Feedback */
@media (hover: none) and (pointer: coarse) {
  .swipeable-topic-card:active {
    transform: scale(0.98);
  }

  .topic-item-wrapper {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .swipeable-topic-card,
  .swipe-indicator,
  .vote-success-content {
    animation: none !important;
    transition: none !important;
  }

  .pulse-border {
    animation: none !important;
  }
}
</style>
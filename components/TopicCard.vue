<template>
  <v-card
    :class="cardClasses"
    :draggable="draggable"
    variant="elevated"
    @dragstart="handleDragStart"
    @click="$emit('click')"
    @keydown.enter="$emit('click')"
    @keydown.space="$emit('click')"
    class="topic-card"
    :elevation="isVoted ? 4 : 2"
    role="article"
    :tabindex="draggable ? 0 : undefined"
    :aria-label="`Topic: ${topic.title}. ${topic.votes || 0} votes. Created by ${getCreatorName(topic.createdBy)}. ${isVoted ? `You have voted for this topic with your ${voteType} choice` : 'Click to interact with this topic'}`"
    :aria-grabbed="isDragging"
  >
    <div v-if="isVoted" class="vote-badge">
      <v-chip
        :color="voteType === 'first' ? 'primary' : 'secondary'"
        size="small"
        class="vote-chip"
      >
        <v-icon start size="small">
          {{ voteType === 'first' ? 'mdi-trophy' : 'mdi-medal' }}
        </v-icon>
        {{ voteType === 'first' ? '1st Choice' : '2nd Choice' }}
      </v-chip>
    </div>

    <v-card-title class="d-flex align-start justify-space-between">
      <header class="flex-grow-1">
        <h3 class="text-h6 mb-2">{{ topic.title }}</h3>
        <p class="text-body-2 text-grey-darken-1">{{ topic.description }}</p>
      </header>

      <div class="card-actions ml-2" role="group" aria-label="Topic actions">
        <slot name="actions" />

        <!-- Drag handle for touch devices -->
        <v-btn
          v-if="draggable && isTouchDevice"
          icon="mdi-drag"
          size="small"
          color="grey"
          variant="text"
          class="drag-handle"
          aria-label="Drag to reorder topic"
          @click.stop
        />
      </div>
    </v-card-title>

    <v-card-text v-if="showDetails" class="pt-0">
      <v-divider class="mb-3" />
      
      <footer class="topic-meta d-flex flex-wrap gap-2 align-center" role="contentinfo" aria-label="Topic statistics">
        <!-- Vote counts -->
        <v-chip size="small" color="success" variant="outlined" :aria-label="`${topic.votes || 0} people voted for this topic`">
          <v-icon start size="small" aria-hidden="true">mdi-thumb-up</v-icon>
          {{ topic.votes || 0 }} votes
        </v-chip>

        <!-- Points from preferences -->
        <v-chip v-if="topic.totalPreferenceScore" size="small" color="info" variant="outlined" :aria-label="`${topic.totalPreferenceScore} preference points from voting`">
          <v-icon start size="small" aria-hidden="true">mdi-star</v-icon>
          {{ topic.totalPreferenceScore }} points
        </v-chip>

        <!-- Created by -->
        <v-chip size="small" color="grey" variant="outlined" :aria-label="`Created by ${getCreatorName(topic.createdBy)}`">
          <v-icon start size="small" aria-hidden="true">mdi-account</v-icon>
          {{ getCreatorName(topic.createdBy) }}
        </v-chip>
      </footer>
    </v-card-text>

    <!-- Loading overlay for actions -->
    <v-overlay
      :model-value="isLoading"
      contained
      class="d-flex align-center justify-center"
    >
      <v-progress-circular indeterminate color="primary" />
    </v-overlay>

    <!-- Drag preview -->
    <div
      v-if="isDragging"
      class="drag-preview"
      ref="dragPreview"
    >
      {{ topic.title }}
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { DiscussionTopic } from '~/types/topic'

interface Props {
  topic: DiscussionTopic
  draggable?: boolean
  isVoted?: boolean
  voteType?: 'first' | 'second'
  showDetails?: boolean
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  draggable: true,
  isVoted: false,
  showDetails: true,
  isLoading: false
})

const emit = defineEmits<{
  dragstart: [event: DragEvent, topic: DiscussionTopic]
  click: []
}>()

// Reactive state
const isDragging = ref(false)
const isTouchDevice = ref(false)
const dragPreview = ref<HTMLElement>()

// Computed properties
const cardClasses = computed(() => ({
  'topic-card--voted': props.isVoted,
  'topic-card--first-choice': props.isVoted && props.voteType === 'first',
  'topic-card--second-choice': props.isVoted && props.voteType === 'second',
  'topic-card--draggable': props.draggable,
  'topic-card--dragging': isDragging.value,
  'cursor-pointer': !props.draggable,
  'cursor-grab': props.draggable && !isDragging.value,
  'cursor-grabbing': props.draggable && isDragging.value
}))

// Drag handlers
const handleDragStart = (event: DragEvent) => {
  if (!props.draggable) return
  
  isDragging.value = true
  emit('dragstart', event, props.topic)
  
  // Create custom drag image
  if (dragPreview.value) {
    event.dataTransfer?.setDragImage(dragPreview.value, 100, 20)
  }
  
  // Reset dragging state after a delay
  setTimeout(() => {
    isDragging.value = false
  }, 100)
}

// Helper functions
const getCreatorName = (email: string): string => {
  if (!email) return 'Unknown'
  
  // Extract name from email (before @)
  const name = email.split('@')[0]
  return name.charAt(0).toUpperCase() + name.slice(1)
}

// Detect touch device
onMounted(() => {
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
})
</script>

<style scoped>
.topic-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  border-radius: 12px;
  overflow: visible;
}

.topic-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.topic-card--draggable:hover {
  cursor: grab;
}

.topic-card--dragging {
  opacity: 0.7;
  transform: rotate(2deg) scale(1.05);
  cursor: grabbing;
  z-index: 1000;
}

.topic-card--voted {
  border: 2px solid transparent;
  background: linear-gradient(145deg, #fff, #fafafa);
}

.topic-card--first-choice {
  border-color: #2196f3;
  box-shadow: 0 4px 20px rgba(33, 150, 243, 0.2);
}

.topic-card--second-choice {
  border-color: #9c27b0;
  box-shadow: 0 4px 20px rgba(156, 39, 176, 0.2);
}

.vote-badge {
  position: absolute;
  top: -8px;
  right: 12px;
  z-index: 10;
}

.vote-chip {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.topic-meta {
  margin-top: 8px;
}

.drag-handle {
  opacity: 0.6;
  transition: opacity 0.3s ease;
}

.topic-card:hover .drag-handle {
  opacity: 1;
}

.drag-preview {
  position: absolute;
  top: -1000px;
  left: -1000px;
  padding: 8px 16px;
  background: #2196f3;
  color: white;
  border-radius: 20px;
  font-weight: 500;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: none;
  z-index: 1000;
}

/* Responsive design */
@media (max-width: 600px) {
  .topic-card {
    margin-bottom: 12px;
  }
  
  .card-actions {
    flex-direction: row;
    align-items: center;
  }
}

/* Touch-friendly drag indicators */
@media (pointer: coarse) {
  .topic-card--draggable::before {
    content: '';
    position: absolute;
    top: 8px;
    left: 8px;
    width: 20px;
    height: 3px;
    background: repeating-linear-gradient(
      90deg,
      #ccc 0px,
      #ccc 3px,
      transparent 3px,
      transparent 6px
    );
    border-radius: 2px;
  }
  
  .topic-card--draggable::after {
    content: '';
    position: absolute;
    top: 14px;
    left: 8px;
    width: 20px;
    height: 3px;
    background: repeating-linear-gradient(
      90deg,
      #ccc 0px,
      #ccc 3px,
      transparent 3px,
      transparent 6px
    );
    border-radius: 2px;
  }
}

/* Animation for vote success */
@keyframes vote-success {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.topic-card--voted {
  animation: vote-success 0.6s ease-out;
}

/* Accessibility improvements */
.topic-card:focus-visible {
  outline: 2px solid #2196f3;
  outline-offset: 2px;
}

/* Cursor states */
.cursor-grab {
  cursor: grab;
}

.cursor-grabbing {
  cursor: grabbing;
}

.cursor-pointer {
  cursor: pointer;
}
</style>
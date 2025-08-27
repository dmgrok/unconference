<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { User } from '~/types/user'

interface VoterEmoji {
  id: string
  email: string
  emoji: string
  x: number
  y: number
  size: number
  animation: string
}

const props = defineProps<{
  voters: string[] // Array of voter emails
  containerHeight?: number
}>()

const voterEmojis = ref<VoterEmoji[]>([])
const containerRef = ref<HTMLElement>()

// Pool of emojis to choose from
const emojiPool = [
  '😀', '😃', '😄', '😁', '😆', '😊', '😇', '🙂', '🙃', '😉',
  '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞',
  '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺',
  '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶',
  '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤐',
  '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌',
  '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧',
  '🥴', '😵', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😇', '😈',
  '👿', '👹', '👺', '💀', '☠️', '👻', '👽', '👾', '🤖', '🎃'
]

// Animation classes
const animationClasses = [
  'bounce', 'pulse', 'wobble', 'float', 'spin-slow'
]

const containerHeight = computed(() => props.containerHeight || 200)

// Generate a random emoji for a user
function getEmojiForUser(email: string): string {
  // Use email hash to get consistent emoji for same user
  let hash = 0
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash + email.charCodeAt(i)) & 0xffffffff
  }
  return emojiPool[Math.abs(hash) % emojiPool.length]
}

// Generate random position and animation
function generateVoterEmoji(email: string, index: number): VoterEmoji {
  const container = containerRef.value
  const maxWidth = container ? container.clientWidth - 50 : 250
  const maxHeight = containerHeight.value - 50
  
  return {
    id: `voter-${index}`,
    email,
    emoji: getEmojiForUser(email),
    x: 10 + Math.random() * maxWidth,
    y: 10 + Math.random() * maxHeight,
    size: 24 + Math.random() * 16, // 24-40px
    animation: animationClasses[Math.floor(Math.random() * animationClasses.length)]
  }
}

// Update emojis when voters change
function updateEmojis() {
  if (!props.voters || props.voters.length === 0) {
    voterEmojis.value = []
    return
  }
  
  voterEmojis.value = props.voters.map((email, index) => 
    generateVoterEmoji(email, index)
  )
}

// Format email for display (shorter version)
function formatVoterName(email: string): string {
  if (email.includes('@unconference.guest')) {
    return `Guest ${email.split('_')[1]?.substring(0, 6).toUpperCase()}`
  }
  return email.split('@')[0]
}

onMounted(() => {
  updateEmojis()
  // Watch for prop changes
  watch(() => props.voters, updateEmojis, { deep: true })
})
</script>

<template>
  <div 
    ref="containerRef"
    class="emoji-cloud-container"
    :style="{ height: `${containerHeight}px` }"
  >
    <div class="emoji-cloud" v-if="voterEmojis.length > 0">
      <transition-group name="emoji-fade" tag="div">
        <div
          v-for="voterEmoji in voterEmojis"
          :key="voterEmoji.id"
          class="voter-emoji"
          :class="voterEmoji.animation"
          :style="{
            left: `${voterEmoji.x}px`,
            top: `${voterEmoji.y}px`,
            fontSize: `${voterEmoji.size}px`
          }"
          :title="formatVoterName(voterEmoji.email)"
        >
          {{ voterEmoji.emoji }}
        </div>
      </transition-group>
    </div>
    
    <div v-else class="no-voters">
      <v-icon size="48" color="grey-lighten-2">mdi-emoticon-neutral</v-icon>
    </div>
  </div>
</template>

<style scoped>
.emoji-cloud-container {
  position: relative;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 8px;
  padding: 16px;
  background: rgba(var(--v-theme-surface), 0.5);
  backdrop-filter: blur(4px);
  overflow: hidden;
}

.emoji-cloud {
  position: relative;
  width: 100%;
  height: 100%;
}

.voter-emoji {
  position: absolute;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s ease;
  z-index: 1;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
}

.voter-emoji:hover {
  transform: scale(1.2);
  z-index: 10;
}

.no-voters {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* Animations */
.bounce {
  animation: bounce 2s infinite;
}

.pulse {
  animation: pulse 2s infinite;
}

.wobble {
  animation: wobble 3s infinite;
}

.float {
  animation: float 3s ease-in-out infinite;
}

.spin-slow {
  animation: spin-slow 4s linear infinite;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes wobble {
  0% { transform: translateX(0%); }
  15% { transform: translateX(-10px) rotate(-5deg); }
  30% { transform: translateX(8px) rotate(3deg); }
  45% { transform: translateX(-6px) rotate(-3deg); }
  60% { transform: translateX(4px) rotate(2deg); }
  75% { transform: translateX(-2px) rotate(-1deg); }
  100% { transform: translateX(0%); }
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
  100% {
    transform: translateY(0px);
  }
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Transition effects */
.emoji-fade-enter-active,
.emoji-fade-leave-active {
  transition: all 0.5s ease;
}

.emoji-fade-enter-from {
  opacity: 0;
  transform: scale(0) rotate(180deg);
}

.emoji-fade-leave-to {
  opacity: 0;
  transform: scale(0) rotate(-180deg);
}
</style>

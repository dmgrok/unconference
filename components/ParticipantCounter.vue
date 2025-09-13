<template>
  <div class="participant-counter">
    <!-- Compact view for smaller screens -->
    <v-card 
      v-if="compact"
      :color="getStatusColor()"
      :variant="participantCount >= 45 ? 'elevated' : 'outlined'"
      class="participant-counter-card"
      :class="{ 'animate-pulse': participantCount >= 45 && participantCount < 49 }"
    >
      <v-card-text class="py-2 px-3">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon :color="getIconColor()" class="mr-2">{{ getStatusIcon() }}</v-icon>
            <div>
              <div class="text-body-2 font-weight-bold">
                {{ participantCount }}{{ maxParticipants ? `/${maxParticipants}` : '' }}
              </div>
              <div class="text-caption">{{ getStatusText() }}</div>
            </div>
          </div>
          
          <!-- Upgrade button for near-limit -->
          <v-btn 
            v-if="showUpgradePrompt"
            size="small"
            :color="participantCount >= 49 ? 'error' : 'warning'"
            @click="$emit('upgrade')"
            class="ml-2"
          >
            {{ participantCount >= 49 ? 'Upgrade Now' : 'Upgrade' }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Full view for larger displays -->
    <v-card 
      v-else
      :color="getStatusColor()"
      :variant="participantCount >= 45 ? 'elevated' : 'outlined'"
      class="participant-counter-card"
      :class="{ 'animate-pulse': participantCount >= 45 && participantCount < 49 }"
    >
      <v-card-text class="text-center py-4">
        <div class="participant-icon mb-2">
          <v-icon 
            :size="participantCount >= getMilestoneThreshold() ? 64 : 48"
            :color="getIconColor()"
            class="participant-main-icon"
            :class="{ 'animate-bounce': recentlyHitMilestone }"
          >
            {{ getStatusIcon() }}
          </v-icon>
        </div>

        <div class="participant-count mb-2">
          <div 
            class="text-h4 font-weight-bold"
            :class="{ 'text-success animate-scale': recentlyHitMilestone }"
          >
            {{ participantCount }}
          </div>
          <div class="text-body-2" :class="getStatusColorClass()">
            {{ getStatusText() }}
          </div>
        </div>

        <!-- Progress bar to next milestone -->
        <div v-if="maxParticipants" class="progress-section mb-3">
          <v-progress-linear
            :model-value="(participantCount / maxParticipants) * 100"
            :color="getProgressColor()"
            height="8"
            rounded
            class="mb-1"
          >
            <template v-slot:default="{ value }">
              <small class="text-white font-weight-bold">{{ Math.ceil(value) }}%</small>
            </template>
          </v-progress-linear>
          <div class="text-caption text-center">
            {{ maxParticipants - participantCount }} spots remaining
          </div>
        </div>

        <!-- Milestone celebrations -->
        <div v-if="showMilestone" class="milestone-celebration mb-3">
          <v-chip
            :color="getMilestoneColor()"
            size="small"
            class="animate-bounce"
          >
            <v-icon start>{{ getMilestoneIcon() }}</v-icon>
            {{ getMilestoneText() }}
          </v-chip>
        </div>

        <!-- Upgrade prompt -->
        <div v-if="showUpgradePrompt" class="upgrade-section">
          <v-alert
            :type="participantCount >= 49 ? 'error' : 'warning'"
            variant="tonal"
            class="mb-3"
            density="compact"
          >
            <div class="text-caption">
              <strong v-if="participantCount >= 49">Participant limit reached!</strong>
              <strong v-else-if="participantCount >= 47">Almost at limit!</strong>
              <strong v-else>Approaching limit</strong>
            </div>
            <div class="text-caption mt-1">
              {{ getUpgradeMessage() }}
            </div>
          </v-alert>
          
          <v-btn
            :color="participantCount >= 49 ? 'error' : 'warning'"
            :variant="participantCount >= 49 ? 'elevated' : 'outlined'"
            @click="$emit('upgrade')"
            block
            class="text-body-2"
          >
            <v-icon start>mdi-arrow-up-bold</v-icon>
            {{ participantCount >= 49 ? 'Upgrade Now - Remove Limits' : 'Upgrade for More Participants' }}
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Celebration animation overlay -->
    <div 
      v-if="showCelebration"
      class="celebration-overlay"
      @animationend="showCelebration = false"
    >
      <div class="celebration-content">
        <v-icon size="100" color="success" class="animate-bounce">mdi-party-popper</v-icon>
        <div class="text-h6 mt-2 font-weight-bold text-success">
          {{ celebrationMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

interface Props {
  participantCount: number
  maxParticipants?: number
  compact?: boolean
  showUpgrade?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  maxParticipants: 49,
  compact: false,
  showUpgrade: true
})

const emit = defineEmits<{
  upgrade: []
  milestone: [number]
}>()

// Reactive state
const showCelebration = ref(false)
const celebrationMessage = ref('')
const recentlyHitMilestone = ref(false)
const lastMilestone = ref(0)

// Milestone thresholds
const milestones = [5, 10, 20, 30, 40, 45]

const showUpgradePrompt = computed(() => {
  return props.showUpgrade && props.participantCount >= 45
})

const showMilestone = computed(() => {
  return props.participantCount > 0 && milestones.includes(props.participantCount)
})

const getMilestoneThreshold = () => {
  return milestones.find(m => props.participantCount >= m) || 5
}

const getStatusColor = () => {
  if (props.participantCount >= 49) return 'error'
  if (props.participantCount >= 47) return 'warning'
  if (props.participantCount >= 45) return 'orange'
  if (props.participantCount >= 30) return 'success'
  if (props.participantCount >= 10) return 'primary'
  return 'grey-lighten-3'
}

const getStatusColorClass = () => {
  if (props.participantCount >= 49) return 'text-error'
  if (props.participantCount >= 47) return 'text-warning'
  if (props.participantCount >= 45) return 'text-orange'
  if (props.participantCount >= 30) return 'text-success'
  if (props.participantCount >= 10) return 'text-primary'
  return 'text-grey'
}

const getIconColor = () => {
  if (props.participantCount >= 49) return 'error'
  if (props.participantCount >= 45) return 'warning'
  if (props.participantCount >= 30) return 'success'
  if (props.participantCount >= 10) return 'primary'
  return 'grey'
}

const getStatusIcon = () => {
  if (props.participantCount >= 49) return 'mdi-alert-circle'
  if (props.participantCount >= 45) return 'mdi-account-alert'
  if (props.participantCount >= 30) return 'mdi-account-group'
  if (props.participantCount >= 10) return 'mdi-account-multiple'
  return 'mdi-account-plus'
}

const getStatusText = () => {
  if (props.participantCount === 0) return 'No participants yet'
  if (props.participantCount === 1) return 'participant'
  if (props.participantCount >= 49) return 'Limit reached!'
  if (props.participantCount >= 45) return 'participants (near limit)'
  return 'participants'
}

const getProgressColor = () => {
  if (props.participantCount >= 47) return 'error'
  if (props.participantCount >= 45) return 'warning'
  if (props.participantCount >= 30) return 'success'
  return 'primary'
}

const getMilestoneColor = () => {
  if (props.participantCount >= 40) return 'success'
  if (props.participantCount >= 20) return 'primary'
  return 'info'
}

const getMilestoneIcon = () => {
  if (props.participantCount >= 40) return 'mdi-trophy'
  if (props.participantCount >= 20) return 'mdi-star'
  return 'mdi-heart'
}

const getMilestoneText = () => {
  if (props.participantCount >= 40) return 'Amazing turnout!'
  if (props.participantCount >= 30) return 'Great engagement!'
  if (props.participantCount >= 20) return 'Getting popular!'
  if (props.participantCount >= 10) return 'Growing strong!'
  return 'Great start!'
}

const getUpgradeMessage = () => {
  if (props.participantCount >= 49) {
    return 'Upgrade to commercial license to allow unlimited participants.'
  }
  if (props.participantCount >= 47) {
    return 'Only 2 spots left! Consider upgrading for unlimited capacity.'
  }
  return 'Consider upgrading for unlimited participants and premium features.'
}

// Watch for milestone achievements
watch(() => props.participantCount, (newCount, oldCount) => {
  // Check if we hit a new milestone
  const newMilestone = milestones.find(m => newCount >= m && (oldCount < m || oldCount === undefined))
  
  if (newMilestone && newMilestone > lastMilestone.value) {
    lastMilestone.value = newMilestone
    triggerCelebration(newMilestone)
    emit('milestone', newMilestone)
  }
})

const triggerCelebration = (milestone: number) => {
  recentlyHitMilestone.value = true
  showCelebration.value = true
  
  if (milestone >= 40) {
    celebrationMessage.value = '🎉 Amazing Event!'
  } else if (milestone >= 30) {
    celebrationMessage.value = '🌟 Great Turnout!'
  } else if (milestone >= 20) {
    celebrationMessage.value = '🚀 Growing Fast!'
  } else if (milestone >= 10) {
    celebrationMessage.value = '💪 Building Momentum!'
  } else {
    celebrationMessage.value = '🎯 Great Start!'
  }
  
  // Reset animation state after a delay
  setTimeout(() => {
    recentlyHitMilestone.value = false
  }, 2000)
}

onMounted(() => {
  // Set initial milestone if already achieved
  const currentMilestone = milestones.filter(m => props.participantCount >= m).pop()
  if (currentMilestone) {
    lastMilestone.value = currentMilestone
  }
})
</script>

<style scoped>
.participant-counter-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.participant-main-icon {
  transition: all 0.3s ease;
}

.animate-pulse {
  animation: pulse 2s infinite;
}

.animate-bounce {
  animation: bounce 1s infinite;
}

.animate-scale {
  animation: scale 0.6s ease-out;
}

.celebration-overlay {
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
  animation: celebrationFade 3s ease-out forwards;
}

.celebration-content {
  text-align: center;
  color: white;
  animation: celebrationScale 0.8s ease-out;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.02); opacity: 0.9; }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
  40%, 43% { transform: translateY(-8px); }
  70% { transform: translateY(-4px); }
  90% { transform: translateY(-2px); }
}

@keyframes scale {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes celebrationFade {
  0% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; pointer-events: none; }
}

@keyframes celebrationScale {
  0% { transform: scale(0.5) rotate(-10deg); opacity: 0; }
  50% { transform: scale(1.1) rotate(5deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}

.progress-section {
  max-width: 200px;
  margin: 0 auto;
}

.milestone-celebration {
  animation: milestoneSlide 0.5s ease-out;
}

@keyframes milestoneSlide {
  0% { transform: translateY(10px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

/* Mobile responsiveness */
@media (max-width: 600px) {
  .celebration-content {
    padding: 1rem;
  }
  
  .celebration-content .v-icon {
    font-size: 80px !important;
  }
}
</style>
<template>
  <div class="mobile-onboarding" v-if="showOnboarding">
    <!-- Onboarding Overlay -->
    <v-overlay
      :model-value="showOnboarding"
      class="onboarding-overlay"
      persistent
    >
      <!-- Onboarding Card -->
      <v-card
        class="onboarding-card"
        :class="cardClasses"
        max-width="380"
        elevation="24"
      >
        <!-- Progress Indicator -->
        <div class="progress-section pa-4 pb-2">
          <v-progress-linear
            :model-value="progressPercentage"
            color="primary"
            height="6"
            rounded
            class="mb-3"
          />
          <div class="d-flex justify-space-between align-center">
            <span class="text-caption text-grey">
              Step {{ currentStep + 1 }} of {{ steps.length }}
            </span>
            <v-btn
              icon="mdi-close"
              size="small"
              variant="text"
              @click="skipOnboarding"
              v-if="!steps[currentStep]?.required"
            />
          </div>
        </div>

        <!-- Step Content -->
        <v-card-text class="pa-4">
          <div class="step-content" :key="currentStep">
            <!-- Step Icon/Animation -->
            <div class="step-icon-container text-center mb-4">
              <v-avatar
                :color="steps[currentStep]?.color || 'primary'"
                size="80"
                class="step-avatar"
              >
                <v-icon
                  :icon="steps[currentStep]?.icon"
                  size="40"
                  color="white"
                />
              </v-avatar>

              <!-- Animated elements for visual appeal -->
              <div class="floating-elements">
                <div
                  v-for="n in 3"
                  :key="n"
                  class="floating-dot"
                  :style="getFloatingDotStyle(n)"
                />
              </div>
            </div>

            <!-- Step Title -->
            <h2 class="step-title text-center mb-3">
              {{ steps[currentStep]?.title }}
            </h2>

            <!-- Step Description -->
            <p class="step-description text-center mb-4">
              {{ steps[currentStep]?.description }}
            </p>

            <!-- Interactive Elements -->
            <div class="interactive-section mb-4">
              <!-- Permission Request -->
              <v-card
                v-if="steps[currentStep]?.type === 'permission'"
                variant="tonal"
                color="info"
                class="pa-3 mb-3"
              >
                <div class="d-flex align-center">
                  <v-icon class="mr-3" color="info">mdi-shield-check</v-icon>
                  <div>
                    <h4 class="text-subtitle-2">{{ steps[currentStep]?.permissionTitle }}</h4>
                    <p class="text-caption text-grey mb-0">{{ steps[currentStep]?.permissionDescription }}</p>
                  </div>
                </div>
              </v-card>

              <!-- Feature Demo -->
              <div v-if="steps[currentStep]?.type === 'demo'" class="demo-section">
                <v-card
                  class="demo-card pa-3 mb-3"
                  variant="outlined"
                  @click="triggerDemo"
                >
                  <div class="d-flex align-center justify-center">
                    <v-icon class="mr-2" color="primary">{{ steps[currentStep]?.demoIcon }}</v-icon>
                    <span class="text-body-2">{{ steps[currentStep]?.demoText }}</span>
                  </div>
                </v-card>
              </div>

              <!-- Swipe Tutorial -->
              <div v-if="steps[currentStep]?.type === 'swipe'" class="swipe-tutorial">
                <div class="swipe-demo-card" ref="swipeDemoCard">
                  <v-card class="pa-3" elevation="4">
                    <div class="d-flex align-center">
                      <v-icon class="mr-3" color="primary">mdi-lightbulb</v-icon>
                      <div>
                        <h4 class="text-subtitle-2">Sample Topic</h4>
                        <p class="text-caption text-grey mb-0">Try swiping me!</p>
                      </div>
                    </div>
                  </v-card>

                  <!-- Swipe Indicators -->
                  <div class="swipe-indicators">
                    <div class="swipe-arrow swipe-left">
                      <v-icon color="info">mdi-arrow-left</v-icon>
                      <span>2nd Choice</span>
                    </div>
                    <div class="swipe-arrow swipe-right">
                      <v-icon color="warning">mdi-arrow-right</v-icon>
                      <span>1st Choice</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Tips List -->
              <div v-if="steps[currentStep]?.tips?.length" class="tips-section">
                <h4 class="text-subtitle-2 mb-2">💡 Quick Tips:</h4>
                <v-list class="tips-list" density="compact">
                  <v-list-item
                    v-for="(tip, index) in steps[currentStep].tips"
                    :key="index"
                    class="pa-2"
                  >
                    <template #prepend>
                      <v-icon size="small" color="success">mdi-check</v-icon>
                    </template>
                    <v-list-item-title class="text-body-2">{{ tip }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </div>
            </div>
          </div>
        </v-card-text>

        <!-- Navigation Actions -->
        <v-card-actions class="pa-4 pt-0">
          <v-btn
            v-if="currentStep > 0"
            variant="text"
            @click="previousStep"
            prepend-icon="mdi-arrow-left"
          >
            Back
          </v-btn>

          <v-spacer />

          <div class="action-buttons">
            <v-btn
              v-if="!isLastStep"
              color="primary"
              variant="elevated"
              @click="nextStep"
              :append-icon="steps[currentStep]?.nextIcon || 'mdi-arrow-right'"
            >
              {{ steps[currentStep]?.nextText || 'Next' }}
            </v-btn>

            <v-btn
              v-else
              color="success"
              variant="elevated"
              @click="completeOnboarding"
              prepend-icon="mdi-check"
            >
              Get Started!
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>

      <!-- Skip Button (Bottom) -->
      <div class="skip-section text-center mt-4">
        <v-btn
          v-if="allowSkip && !steps[currentStep]?.required"
          variant="text"
          color="white"
          @click="skipOnboarding"
          size="small"
        >
          Skip Tutorial
        </v-btn>
      </div>
    </v-overlay>

    <!-- Welcome Pulse Animation (for first-time users) -->
    <div v-if="showWelcomePulse" class="welcome-pulse" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useDisplay } from 'vuetify'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: string
  color?: string
  type?: 'intro' | 'permission' | 'demo' | 'swipe' | 'feature'
  required?: boolean
  permissionTitle?: string
  permissionDescription?: string
  demoIcon?: string
  demoText?: string
  nextText?: string
  nextIcon?: string
  tips?: string[]
}

interface Props {
  modelValue: boolean
  steps?: OnboardingStep[]
  allowSkip?: boolean
  autoStart?: boolean
  storageKey?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  steps: () => [],
  allowSkip: true,
  autoStart: true,
  storageKey: 'onboarding-completed'
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'step-change': [step: number]
  'complete': []
  'skip': []
  'permission-request': [permission: string]
}>()

const { mobile } = useDisplay()

// Reactive state
const currentStep = ref(0)
const showWelcomePulse = ref(false)
const swipeDemoCard = ref<HTMLElement>()

// Default onboarding steps for unconference platform
const defaultSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: '🎉 Welcome to Unconference!',
    description: 'Join engaging discussions and connect with like-minded people in your community.',
    icon: 'mdi-forum',
    color: 'primary',
    type: 'intro'
  },
  {
    id: 'voting',
    title: '🗳️ Vote for Topics',
    description: 'Choose topics you\'re passionate about. Your votes help shape the discussion agenda.',
    icon: 'mdi-vote',
    color: 'success',
    type: 'feature',
    tips: [
      'Tap any topic to vote',
      'First click = 1st choice (2 points)',
      'Second click = 2nd choice (1 point)',
      'Click again to remove vote'
    ]
  },
  {
    id: 'swipe',
    title: '👆 Swipe to Vote',
    description: 'On mobile, you can swipe topics left or right to vote quickly!',
    icon: 'mdi-gesture-swipe-horizontal',
    color: 'info',
    type: 'swipe',
    tips: [
      'Swipe right for 1st choice',
      'Swipe left for 2nd choice',
      'Works on any topic card'
    ]
  },
  {
    id: 'groups',
    title: '👥 Join Discussions',
    description: 'Get assigned to discussion groups based on your voting preferences.',
    icon: 'mdi-account-group',
    color: 'warning',
    type: 'feature',
    tips: [
      'Groups form automatically',
      'Based on your votes',
      'Check the Groups page for details'
    ]
  },
  {
    id: 'notifications',
    title: '🔔 Stay Updated',
    description: 'Get notified about round starts, group assignments, and important updates.',
    icon: 'mdi-bell',
    color: 'orange',
    type: 'permission',
    permissionTitle: 'Enable Notifications',
    permissionDescription: 'Stay informed about discussion rounds and events',
    nextText: 'Enable Notifications'
  },
  {
    id: 'complete',
    title: '🚀 You\'re Ready!',
    description: 'Start exploring topics, voting, and joining discussions. Have fun!',
    icon: 'mdi-rocket-launch',
    color: 'success',
    type: 'intro'
  }
]

// Computed properties
const steps = computed(() => props.steps.length > 0 ? props.steps : defaultSteps)

const showOnboarding = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isLastStep = computed(() => currentStep.value === steps.value.length - 1)

const progressPercentage = computed(() => {
  return ((currentStep.value + 1) / steps.value.length) * 100
})

const cardClasses = computed(() => ({
  'onboarding-card--mobile': mobile.value,
  'onboarding-card--desktop': !mobile.value
}))

// Methods
const nextStep = async () => {
  const step = steps.value[currentStep.value]

  // Handle permission requests
  if (step.type === 'permission') {
    await handlePermissionRequest(step)
  }

  if (currentStep.value < steps.value.length - 1) {
    currentStep.value++
    emit('step-change', currentStep.value)

    // Add haptic feedback
    if (mobile.value && 'vibrate' in navigator) {
      navigator.vibrate([10])
    }
  }
}

const previousStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
    emit('step-change', currentStep.value)
  }
}

const completeOnboarding = () => {
  // Store completion status
  if (process.client) {
    localStorage.setItem(props.storageKey, 'true')
    localStorage.setItem(`${props.storageKey}-date`, new Date().toISOString())
  }

  showOnboarding.value = false
  emit('complete')

  // Celebratory haptic feedback
  if (mobile.value && 'vibrate' in navigator) {
    navigator.vibrate([50, 50, 50])
  }
}

const skipOnboarding = () => {
  // Store skip status
  if (process.client) {
    localStorage.setItem(props.storageKey, 'skipped')
    localStorage.setItem(`${props.storageKey}-date`, new Date().toISOString())
  }

  showOnboarding.value = false
  emit('skip')
}

const handlePermissionRequest = async (step: OnboardingStep) => {
  try {
    if (step.id === 'notifications') {
      // Request notification permission
      if ('Notification' in window) {
        const permission = await Notification.requestPermission()
        emit('permission-request', permission)
      }
    }
  } catch (error) {
    console.warn('Permission request failed:', error)
  }
}

const triggerDemo = () => {
  const step = steps.value[currentStep.value]

  // Add visual feedback
  if (mobile.value && 'vibrate' in navigator) {
    navigator.vibrate([25])
  }

  // Could trigger specific demo animations here
  console.log('Demo triggered for step:', step.id)
}

const getFloatingDotStyle = (index: number) => {
  const positions = [
    { top: '20%', right: '20%', delay: '0s' },
    { bottom: '20%', left: '20%', delay: '0.5s' },
    { top: '50%', right: '10%', delay: '1s' }
  ]

  return {
    ...positions[index - 1],
    animationDelay: positions[index - 1].delay
  }
}

// Check if onboarding should be shown
const shouldShowOnboarding = () => {
  if (!process.client) return false

  const completed = localStorage.getItem(props.storageKey)
  return !completed || completed === 'false'
}

// Auto-start onboarding for new users
onMounted(async () => {
  await nextTick()

  if (props.autoStart && shouldShowOnboarding()) {
    showWelcomePulse.value = true

    // Show welcome animation briefly
    setTimeout(() => {
      showWelcomePulse.value = false
      showOnboarding.value = true
    }, 1500)
  }
})

// Expose methods for external control
defineExpose({
  start: () => { showOnboarding.value = true },
  complete: completeOnboarding,
  skip: skipOnboarding,
  goToStep: (step: number) => { currentStep.value = step },
  reset: () => {
    currentStep.value = 0
    if (process.client) {
      localStorage.removeItem(props.storageKey)
    }
  }
})
</script>

<style scoped>
.mobile-onboarding {
  position: relative;
}

.onboarding-overlay {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%);
  backdrop-filter: blur(10px);
}

.onboarding-card {
  border-radius: 20px;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.onboarding-card--mobile {
  margin: 16px;
  max-width: calc(100vw - 32px);
}

.progress-section {
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.step-icon-container {
  position: relative;
  margin-bottom: 24px;
}

.step-avatar {
  position: relative;
  z-index: 2;
  animation: stepAppear 0.6s ease-out;
}

.floating-elements {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.floating-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: rgba(99, 102, 241, 0.4);
  border-radius: 50%;
  animation: float 3s ease-in-out infinite;
}

.step-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.3;
  animation: slideUp 0.5s ease-out 0.2s both;
}

.step-description {
  font-size: 0.95rem;
  color: #64748b;
  line-height: 1.5;
  animation: slideUp 0.5s ease-out 0.3s both;
}

.interactive-section {
  animation: slideUp 0.5s ease-out 0.4s both;
}

.demo-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.demo-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.swipe-tutorial {
  position: relative;
  margin: 16px 0;
}

.swipe-demo-card {
  position: relative;
}

.swipe-indicators {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  pointer-events: none;
}

.swipe-arrow {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  opacity: 0.8;
  font-size: 0.75rem;
  font-weight: 600;
  animation: swipeHint 2s ease-in-out infinite;
}

.swipe-arrow.swipe-left {
  border-radius: 0 0 0 12px;
  margin-right: 50%;
}

.swipe-arrow.swipe-right {
  border-radius: 0 0 12px 0;
  margin-left: 50%;
}

.tips-list {
  background: rgba(76, 175, 80, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.skip-section {
  animation: fadeIn 0.5s ease-out 0.5s both;
}

.welcome-pulse {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: welcomePulse 1.5s ease-out;
  z-index: 9999;
}

/* Animations */
@keyframes stepAppear {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes slideUp {
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes swipeHint {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

@keyframes welcomePulse {
  0% {
    transform: translate(-50%, -50%) scale(0);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.7;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.5);
    opacity: 0;
  }
}

/* Dark mode support */
.v-theme--dark .onboarding-card {
  background: linear-gradient(145deg, #1e293b 0%, #0f172a 100%);
  border-color: rgba(71, 85, 105, 0.3);
}

.v-theme--dark .step-title {
  color: #f1f5f9;
}

.v-theme--dark .step-description {
  color: #cbd5e1;
}

.v-theme--dark .progress-section {
  border-bottom-color: rgba(71, 85, 105, 0.2);
}

.v-theme--dark .tips-list {
  background: rgba(76, 175, 80, 0.1);
  border-color: rgba(76, 175, 80, 0.3);
}

/* Mobile optimizations */
@media (max-width: 480px) {
  .onboarding-card {
    margin: 8px;
    max-width: calc(100vw - 16px);
  }

  .step-title {
    font-size: 1.1rem;
  }

  .step-description {
    font-size: 0.875rem;
  }

  .step-avatar {
    width: 64px !important;
    height: 64px !important;
  }

  .step-avatar .v-icon {
    font-size: 32px !important;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }

  .action-buttons .v-btn {
    width: 100%;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .step-avatar,
  .step-title,
  .step-description,
  .interactive-section,
  .skip-section,
  .floating-dot,
  .swipe-arrow,
  .welcome-pulse {
    animation: none !important;
    transition: none !important;
  }
}

/* Touch feedback */
@media (hover: none) and (pointer: coarse) {
  .demo-card:active {
    transform: scale(0.98);
  }
}
</style>
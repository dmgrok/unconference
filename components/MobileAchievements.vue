<template>
  <div class="mobile-achievements">
    <!-- Achievement Toast Notifications -->
    <Teleport to="body">
      <div class="achievement-notifications">
        <transition-group name="achievement-slide" tag="div">
          <div
            v-for="notification in visibleNotifications"
            :key="notification.id"
            class="achievement-notification"
            :class="notificationClasses(notification)"
            @click="dismissNotification(notification.id)"
          >
            <div class="notification-content">
              <div class="notification-icon">
                <v-avatar :color="notification.color" size="48">
                  <v-icon color="white" size="24">{{ notification.icon }}</v-icon>
                </v-avatar>
                <div class="achievement-glow" :style="{ background: notification.glowColor }" />
              </div>

              <div class="notification-text">
                <h4 class="notification-title">{{ notification.title }}</h4>
                <p class="notification-description">{{ notification.description }}</p>
                <div v-if="notification.points" class="points-earned">
                  <v-chip size="small" color="warning" variant="elevated">
                    <v-icon start size="small">mdi-star</v-icon>
                    +{{ notification.points }} points
                  </v-chip>
                </div>
              </div>

              <div class="notification-actions">
                <v-btn
                  icon="mdi-close"
                  size="small"
                  variant="text"
                  @click.stop="dismissNotification(notification.id)"
                />
              </div>
            </div>

            <!-- Progress indicator for auto-dismiss -->
            <div
              class="auto-dismiss-progress"
              :style="{
                width: `${(notification.remainingTime / notification.duration) * 100}%`,
                background: notification.color
              }"
            />
          </div>
        </transition-group>
      </div>
    </Teleport>

    <!-- Achievement Display Grid -->
    <div class="achievements-grid" :class="gridClasses">
      <MobileCard
        v-for="achievement in achievements"
        :key="achievement.id"
        :title="achievement.title"
        :subtitle="achievement.description"
        :avatar="true"
        :avatar-icon="achievement.icon"
        :avatar-color="achievement.unlocked ? achievement.color : 'grey'"
        :status="achievement.unlocked ? 'Unlocked' : getProgressText(achievement)"
        :status-color="achievement.unlocked ? 'success' : 'grey'"
        :status-icon="achievement.unlocked ? 'mdi-check' : 'mdi-lock'"
        :clickable="achievement.unlocked"
        :elevation="achievement.unlocked ? 4 : 2"
        :variant="achievement.unlocked ? 'elevated' : 'outlined'"
        class="achievement-card"
        :class="{ 'achievement-card--unlocked': achievement.unlocked }"
        @click="showAchievementDetails(achievement)"
      >
        <template #headerActions>
          <v-chip
            v-if="achievement.rarity"
            :color="getRarityColor(achievement.rarity)"
            size="x-small"
            variant="elevated"
          >
            {{ achievement.rarity }}
          </v-chip>
        </template>

        <!-- Progress Bar for Locked Achievements -->
        <div v-if="!achievement.unlocked && achievement.progress !== undefined" class="achievement-progress pa-3">
          <div class="d-flex justify-space-between mb-2">
            <span class="text-caption text-grey">Progress</span>
            <span class="text-caption text-grey">{{ achievement.current }}/{{ achievement.target }}</span>
          </div>
          <v-progress-linear
            :model-value="achievement.progress"
            :color="achievement.color"
            height="8"
            rounded
          />
        </div>

        <!-- Achievement Stats -->
        <template #stats>
          <div v-if="achievement.unlocked" class="achievement-stats">
            <div class="stat-item">
              <div class="stat-value">{{ achievement.points }}</div>
              <div class="stat-label">Points</div>
            </div>
            <div v-if="achievement.unlockedDate" class="stat-item">
              <div class="stat-value">{{ formatDate(achievement.unlockedDate) }}</div>
              <div class="stat-label">Unlocked</div>
            </div>
          </div>
        </template>

        <!-- Achievement Actions -->
        <template #actions>
          <v-btn
            v-if="achievement.unlocked && achievement.sharable"
            variant="text"
            color="primary"
            size="small"
            @click.stop="shareAchievement(achievement)"
          >
            <v-icon start>mdi-share</v-icon>
            Share
          </v-btn>
        </template>
      </MobileCard>
    </div>

    <!-- Achievement Details Modal -->
    <MobileBottomSheet
      v-model="showDetailsModal"
      :title="selectedAchievement?.title"
      :icon="selectedAchievement?.icon"
      :icon-color="selectedAchievement?.color"
      variant="success"
    >
      <div v-if="selectedAchievement" class="achievement-details">
        <!-- Achievement Visual -->
        <div class="achievement-visual text-center mb-4">
          <v-avatar :color="selectedAchievement.color" size="80" class="mb-3">
            <v-icon color="white" size="40">{{ selectedAchievement.icon }}</v-icon>
          </v-avatar>
          <div class="achievement-badge">
            <v-chip
              :color="selectedAchievement.color"
              size="large"
              variant="elevated"
              class="achievement-badge-chip"
            >
              <v-icon start>mdi-medal</v-icon>
              {{ selectedAchievement.title }}
            </v-chip>
          </div>
        </div>

        <!-- Achievement Info -->
        <v-card variant="tonal" color="surface" class="mb-4">
          <v-card-text>
            <p class="text-body-1 mb-3">{{ selectedAchievement.description }}</p>

            <div class="achievement-meta">
              <div class="meta-row">
                <v-icon class="mr-2" color="warning">mdi-star</v-icon>
                <span>{{ selectedAchievement.points }} points earned</span>
              </div>

              <div v-if="selectedAchievement.rarity" class="meta-row">
                <v-icon class="mr-2" color="primary">mdi-diamond-stone</v-icon>
                <span>{{ selectedAchievement.rarity }} achievement</span>
              </div>

              <div v-if="selectedAchievement.unlockedDate" class="meta-row">
                <v-icon class="mr-2" color="success">mdi-calendar-check</v-icon>
                <span>Unlocked {{ formatFullDate(selectedAchievement.unlockedDate) }}</span>
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Related Achievements -->
        <div v-if="getRelatedAchievements(selectedAchievement).length > 0" class="related-achievements">
          <h4 class="text-subtitle-1 mb-3">Related Achievements</h4>
          <div class="related-grid">
            <v-card
              v-for="related in getRelatedAchievements(selectedAchievement)"
              :key="related.id"
              variant="outlined"
              class="related-card pa-2"
              @click="selectAchievement(related)"
            >
              <div class="d-flex align-center">
                <v-avatar :color="related.unlocked ? related.color : 'grey'" size="32" class="mr-2">
                  <v-icon color="white" size="16">{{ related.icon }}</v-icon>
                </v-avatar>
                <div class="flex-grow-1 min-width-0">
                  <div class="text-body-2 text-truncate">{{ related.title }}</div>
                  <div class="text-caption text-grey">
                    {{ related.unlocked ? 'Unlocked' : 'Locked' }}
                  </div>
                </div>
              </div>
            </v-card>
          </div>
        </div>
      </div>

      <template #actions>
        <v-btn
          v-if="selectedAchievement?.sharable"
          color="primary"
          variant="elevated"
          @click="shareAchievement(selectedAchievement)"
          class="mr-2"
        >
          <v-icon start>mdi-share</v-icon>
          Share Achievement
        </v-btn>
        <v-btn variant="text" @click="showDetailsModal = false">
          Close
        </v-btn>
      </template>
    </MobileBottomSheet>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useDisplay } from 'vuetify'

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  color: string
  points: number
  rarity?: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  category?: string
  unlocked: boolean
  unlockedDate?: Date
  sharable?: boolean
  progress?: number // 0-100
  current?: number
  target?: number
  requirements?: string[]
}

interface AchievementNotification extends Achievement {
  remainingTime: number
  duration: number
  glowColor: string
}

interface Props {
  achievements?: Achievement[]
  gridLayout?: 'compact' | 'comfortable' | 'spacious'
  showCategories?: boolean
  enableNotifications?: boolean
  autoShare?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  achievements: () => [],
  gridLayout: 'comfortable',
  showCategories: true,
  enableNotifications: true,
  autoShare: false
})

const emit = defineEmits<{
  'achievement-unlock': [achievement: Achievement]
  'achievement-share': [achievement: Achievement]
  'achievement-click': [achievement: Achievement]
}>()

const { mobile } = useDisplay()

// Reactive state
const visibleNotifications = ref<AchievementNotification[]>([])
const showDetailsModal = ref(false)
const selectedAchievement = ref<Achievement | null>(null)
const notificationTimers = new Map<string, NodeJS.Timeout>()

// Sample achievements data
const defaultAchievements: Achievement[] = [
  {
    id: 'first-vote',
    title: 'First Vote',
    description: 'Cast your first vote on a topic',
    icon: 'mdi-vote',
    color: 'primary',
    points: 10,
    rarity: 'Common',
    category: 'Participation',
    unlocked: true,
    unlockedDate: new Date('2024-01-15'),
    sharable: true
  },
  {
    id: 'topic-creator',
    title: 'Topic Creator',
    description: 'Create your first discussion topic',
    icon: 'mdi-lightbulb',
    color: 'warning',
    points: 25,
    rarity: 'Common',
    category: 'Contribution',
    unlocked: true,
    unlockedDate: new Date('2024-01-16'),
    sharable: true
  },
  {
    id: 'super-voter',
    title: 'Super Voter',
    description: 'Vote on 10 different topics',
    icon: 'mdi-vote-outline',
    color: 'success',
    points: 50,
    rarity: 'Rare',
    category: 'Participation',
    unlocked: false,
    progress: 70,
    current: 7,
    target: 10,
    sharable: true
  },
  {
    id: 'connector',
    title: 'Connector',
    description: 'Make 5 meaningful connections',
    icon: 'mdi-account-group',
    color: 'info',
    points: 40,
    rarity: 'Rare',
    category: 'Social',
    unlocked: false,
    progress: 40,
    current: 2,
    target: 5,
    sharable: true
  },
  {
    id: 'discussion-leader',
    title: 'Discussion Leader',
    description: 'Lead a discussion group session',
    icon: 'mdi-account-tie',
    color: 'purple',
    points: 75,
    rarity: 'Epic',
    category: 'Leadership',
    unlocked: false,
    progress: 0,
    current: 0,
    target: 1,
    sharable: true
  }
]

// Computed properties
const achievements = computed(() => props.achievements.length > 0 ? props.achievements : defaultAchievements)

const gridClasses = computed(() => ({
  'achievements-grid--compact': props.gridLayout === 'compact',
  'achievements-grid--comfortable': props.gridLayout === 'comfortable',
  'achievements-grid--spacious': props.gridLayout === 'spacious',
  'achievements-grid--mobile': mobile.value
}))

// Methods
const showAchievementNotification = (achievement: Achievement) => {
  if (!props.enableNotifications) return

  const notification: AchievementNotification = {
    ...achievement,
    remainingTime: 5000,
    duration: 5000,
    glowColor: `${achievement.color}40`
  }

  visibleNotifications.value.push(notification)

  // Haptic feedback
  if (mobile.value && 'vibrate' in navigator) {
    navigator.vibrate([50, 50, 100])
  }

  // Auto-dismiss timer
  const timer = setInterval(() => {
    notification.remainingTime -= 100
    if (notification.remainingTime <= 0) {
      dismissNotification(notification.id)
    }
  }, 100)

  notificationTimers.set(notification.id, timer)

  // Auto-dismiss after duration
  setTimeout(() => {
    dismissNotification(notification.id)
  }, notification.duration)
}

const dismissNotification = (notificationId: string) => {
  const index = visibleNotifications.value.findIndex(n => n.id === notificationId)
  if (index > -1) {
    visibleNotifications.value.splice(index, 1)
  }

  const timer = notificationTimers.get(notificationId)
  if (timer) {
    clearInterval(timer)
    notificationTimers.delete(notificationId)
  }
}

const notificationClasses = (notification: AchievementNotification) => ({
  'achievement-notification--mobile': mobile.value,
  'achievement-notification--desktop': !mobile.value,
  [`achievement-notification--${notification.rarity?.toLowerCase()}`]: notification.rarity
})

const showAchievementDetails = (achievement: Achievement) => {
  if (!achievement.unlocked) return

  selectedAchievement.value = achievement
  showDetailsModal.value = true
  emit('achievement-click', achievement)
}

const selectAchievement = (achievement: Achievement) => {
  selectedAchievement.value = achievement
}

const shareAchievement = async (achievement: Achievement) => {
  try {
    if (navigator.share) {
      await navigator.share({
        title: `Achievement Unlocked: ${achievement.title}`,
        text: `I just unlocked "${achievement.title}" - ${achievement.description}`,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      const text = `🏆 Achievement Unlocked: ${achievement.title} - ${achievement.description}`
      await navigator.clipboard.writeText(text)

      // Show feedback
      showAchievementNotification({
        id: 'share-copied',
        title: 'Copied to Clipboard',
        description: 'Achievement details copied to clipboard',
        icon: 'mdi-content-copy',
        color: 'success',
        points: 0,
        unlocked: true
      })
    }

    emit('achievement-share', achievement)
  } catch (error) {
    console.warn('Share failed:', error)
  }
}

const getRarityColor = (rarity: string) => {
  const colors = {
    Common: 'grey',
    Rare: 'blue',
    Epic: 'purple',
    Legendary: 'orange'
  }
  return colors[rarity as keyof typeof colors] || 'grey'
}

const getProgressText = (achievement: Achievement) => {
  if (achievement.current !== undefined && achievement.target !== undefined) {
    return `${achievement.current}/${achievement.target}`
  }
  if (achievement.progress !== undefined) {
    return `${Math.round(achievement.progress)}%`
  }
  return 'Locked'
}

const getRelatedAchievements = (achievement: Achievement) => {
  return achievements.value.filter(a =>
    a.id !== achievement.id &&
    a.category === achievement.category
  ).slice(0, 3)
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date)
}

const formatFullDate = (date: Date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// Simulate achievement unlock (for demo purposes)
const simulateAchievementUnlock = () => {
  const lockedAchievements = achievements.value.filter(a => !a.unlocked)
  if (lockedAchievements.length > 0) {
    const achievement = lockedAchievements[0]
    achievement.unlocked = true
    achievement.unlockedDate = new Date()
    showAchievementNotification(achievement)
    emit('achievement-unlock', achievement)
  }
}

// Cleanup timers
onBeforeUnmount(() => {
  notificationTimers.forEach(timer => clearInterval(timer))
  notificationTimers.clear()
})

// Expose methods for external use
defineExpose({
  showNotification: showAchievementNotification,
  simulateUnlock: simulateAchievementUnlock
})
</script>

<style scoped>
.mobile-achievements {
  position: relative;
}

/* Achievement Notifications */
.achievement-notifications {
  position: fixed;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  width: 90%;
  max-width: 400px;
  pointer-events: none;
}

.achievement-notification {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  margin-bottom: 12px;
  pointer-events: auto;
  cursor: pointer;
  overflow: hidden;
  position: relative;
  backdrop-filter: blur(10px);
}

.achievement-notification--mobile {
  margin: 0 8px 12px;
}

.notification-content {
  display: flex;
  align-items: center;
  padding: 16px;
  position: relative;
  z-index: 2;
}

.notification-icon {
  position: relative;
  margin-right: 16px;
}

.achievement-glow {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  border-radius: 50%;
  opacity: 0.6;
  animation: achievementGlow 2s ease-in-out infinite;
  z-index: -1;
}

.notification-text {
  flex-grow: 1;
  min-width: 0;
}

.notification-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 4px;
  line-height: 1.2;
}

.notification-description {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0 0 8px;
  line-height: 1.3;
}

.points-earned {
  margin-top: 4px;
}

.notification-actions {
  margin-left: 8px;
}

.auto-dismiss-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  transition: width 0.1s linear;
  border-radius: 0 0 16px 16px;
}

/* Achievement Grid */
.achievements-grid {
  display: grid;
  gap: 16px;
}

.achievements-grid--compact {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.achievements-grid--comfortable {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.achievements-grid--spacious {
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.achievements-grid--mobile {
  grid-template-columns: 1fr;
  gap: 12px;
}

.achievement-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.achievement-card--unlocked {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(255, 255, 255, 1) 100%);
}

.achievement-card--unlocked::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
  transform: translateX(-100%);
  animation: shimmer 3s ease-in-out infinite;
  pointer-events: none;
}

.achievement-progress {
  border-top: 1px solid rgba(var(--v-theme-outline), 0.1);
}

/* Achievement Details */
.achievement-details {
  padding: 0;
}

.achievement-visual {
  position: relative;
}

.achievement-badge {
  position: relative;
}

.achievement-badge-chip {
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.achievement-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-row {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: #64748b;
}

.related-achievements {
  margin-top: 24px;
}

.related-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.related-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.related-card:hover {
  background: rgba(var(--v-theme-primary), 0.05);
}

/* Animations */
.achievement-slide-enter-active,
.achievement-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.achievement-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}

.achievement-slide-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

@keyframes achievementGlow {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Dark Mode */
.v-theme--dark .achievement-notification {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-color: rgba(71, 85, 105, 0.3);
}

.v-theme--dark .notification-title {
  color: #f1f5f9;
}

.v-theme--dark .notification-description {
  color: #cbd5e1;
}

.v-theme--dark .meta-row {
  color: #cbd5e1;
}

.v-theme--dark .achievement-card--unlocked {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(30, 41, 59, 1) 100%);
}

/* Mobile Optimizations */
@media (max-width: 768px) {
  .achievement-notifications {
    top: 70px;
    width: 95%;
  }

  .notification-content {
    padding: 12px;
  }

  .notification-icon {
    margin-right: 12px;
  }

  .notification-title {
    font-size: 0.9rem;
  }

  .notification-description {
    font-size: 0.75rem;
  }

  .related-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .achievement-notifications {
    width: 98%;
    top: 65px;
  }

  .notification-content {
    padding: 10px;
  }

  .achievements-grid {
    gap: 8px;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .achievement-card,
  .achievement-glow,
  .achievement-card--unlocked::before,
  .achievement-slide-enter-active,
  .achievement-slide-leave-active {
    animation: none !important;
    transition: none !important;
  }
}

/* Touch Feedback */
@media (hover: none) and (pointer: coarse) {
  .achievement-notification:active,
  .related-card:active {
    transform: scale(0.98);
  }
}
</style>
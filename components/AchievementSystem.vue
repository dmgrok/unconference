<template>
  <v-card class="achievement-system" elevation="2">
    <v-card-title class="d-flex align-center">
      <v-icon color="warning" class="mr-2">mdi-trophy</v-icon>
      Your Achievements
      <v-spacer></v-spacer>
      <v-chip color="primary" size="small">
        {{ achievements.length }} earned
      </v-chip>
    </v-card-title>

    <v-card-text>
      <v-row>
        <v-col
          v-for="achievement in achievements"
          :key="achievement.id"
          cols="12" sm="6" md="4"
        >
          <v-card
            :class="{
              'achievement-card': true,
              'achievement-card--earned': achievement.earned,
              'achievement-card--new': achievement.isNew
            }"
            :color="achievement.earned ? achievement.color : 'grey-lighten-4'"
            variant="outlined"
          >
            <v-card-text class="text-center pa-4">
              <div class="achievement-icon-container mb-3">
                <v-avatar
                  size="64"
                  :color="achievement.earned ? achievement.color : 'grey-lighten-2'"
                  :class="{ 'achievement-icon--earned': achievement.earned }"
                >
                  <v-icon
                    size="32"
                    :color="achievement.earned ? 'white' : 'grey'"
                  >
                    {{ achievement.icon }}
                  </v-icon>
                </v-avatar>
                <v-chip
                  v-if="achievement.isNew"
                  size="x-small"
                  color="success"
                  class="achievement-new-badge"
                >
                  NEW!
                </v-chip>
              </div>

              <h3 
                class="text-h6 mb-2"
                :class="{ 'text-white': achievement.earned && achievement.color === 'primary' }"
              >
                {{ achievement.name }}
              </h3>
              
              <p 
                class="text-body-2 mb-3"
                :class="{ 
                  'text-white': achievement.earned && achievement.color === 'primary',
                  'text-medium-emphasis': !achievement.earned 
                }"
              >
                {{ achievement.description }}
              </p>

              <!-- Progress Bar (if not fully earned) -->
              <div v-if="achievement.progress !== undefined && achievement.maxProgress !== undefined && achievement.progress < achievement.maxProgress" class="mb-3">
                <v-progress-linear
                  :model-value="(achievement.progress / achievement.maxProgress) * 100"
                  :color="achievement.color"
                  height="8"
                  rounded
                ></v-progress-linear>
                <div class="text-caption mt-1 text-center">
                  {{ achievement.progress }} / {{ achievement.maxProgress }}
                </div>
              </div>

              <!-- Share Button (if earned) -->
              <v-btn
                v-if="achievement.earned"
                size="small"
                :color="achievement.color"
                variant="outlined"
                prepend-icon="mdi-share"
                @click="shareAchievement(achievement)"
                class="mt-2"
              >
                Share
              </v-btn>

              <!-- Earned Date -->
              <div v-if="achievement.earned && achievement.earnedAt" class="text-caption text-medium-emphasis mt-2">
                Earned {{ formatDate(achievement.earnedAt) }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- No Achievements Yet -->
      <div v-if="achievements.length === 0" class="text-center py-8">
        <v-icon size="64" color="grey-lighten-2" class="mb-4">mdi-trophy-outline</v-icon>
        <h3 class="text-h6 mb-2 text-medium-emphasis">No achievements yet</h3>
        <p class="text-body-2 text-medium-emphasis">
          Keep participating in events to earn achievements!
        </p>
      </div>
    </v-card-text>

    <!-- Share Achievement Dialog -->
    <v-dialog v-model="shareDialog" max-width="500">
      <v-card v-if="selectedAchievement">
        <v-card-title class="d-flex align-center">
          <v-icon :color="selectedAchievement.color" class="mr-2">{{ selectedAchievement.icon }}</v-icon>
          Share Achievement
        </v-card-title>
        
        <v-card-text>
          <div class="share-preview pa-4 mb-4" style="background: #f5f5f5; border-radius: 8px;">
            <div class="d-flex align-center mb-2">
              <v-avatar size="32" :color="selectedAchievement.color" class="mr-2">
                <v-icon size="16" color="white">{{ selectedAchievement.icon }}</v-icon>
              </v-avatar>
              <strong>{{ selectedAchievement.name }}</strong>
            </div>
            <p class="mb-2">{{ selectedAchievement.shareText }}</p>
            <div class="text-caption text-medium-emphasis">
              #UnconferencePlatform #{{ selectedAchievement.name.replace(/\s+/g, '') }}
            </div>
          </div>

          <div class="share-options">
            <v-btn
              color="blue"
              variant="outlined"
              prepend-icon="mdi-twitter"
              @click="shareToTwitter"
              class="mr-2 mb-2"
            >
              Twitter
            </v-btn>
            <v-btn
              color="blue-darken-4"
              variant="outlined"
              prepend-icon="mdi-linkedin"
              @click="shareToLinkedIn"
              class="mr-2 mb-2"
            >
              LinkedIn
            </v-btn>
            <v-btn
              color="grey"
              variant="outlined"
              prepend-icon="mdi-content-copy"
              @click="copyToClipboard"
              class="mb-2"
            >
              Copy Text
            </v-btn>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="shareDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  color: string
  earned: boolean
  earnedAt?: Date | string
  shareText: string
  isNew?: boolean
  progress?: number
  maxProgress?: number
}

const props = defineProps<{
  eventId?: string
  userId?: string
}>()

// Composables
const { getUserAchievements, checkAchievements } = useAchievements()

// Reactive data
const shareDialog = ref(false)
const selectedAchievement = ref<Achievement | null>(null)
const loading = ref(true)
const achievements = ref<Achievement[]>([])

// Auto-check for new achievements when component loads
const checkForNewAchievements = async () => {
  try {
    const result = await checkAchievements()
    if (result?.newAchievements?.length > 0) {
      console.log('New achievements earned:', result.newAchievements)
      // Show notification for new achievements
      result.newAchievements.forEach((achievement: any) => {
        showAchievementNotification(achievement)
      })
      // Reload achievements to show updated data
      await loadAchievements()
    }
  } catch (error) {
    console.debug('No new achievements to grant')
  }
}

// Show achievement notification
const showAchievementNotification = (achievement: any) => {
  // You could integrate with a notification system here
  console.log('Achievement unlocked:', achievement.achievement?.name)
}

// Computed
const earnedAchievements = computed(() => 
  achievements.value.filter(a => a.earned)
)

const inProgressAchievements = computed(() =>
  achievements.value.filter(a => !a.earned && a.progress !== undefined)
)

// Methods
const shareAchievement = (achievement: Achievement) => {
  selectedAchievement.value = achievement
  shareDialog.value = true
}

const shareToTwitter = () => {
  if (!selectedAchievement.value) return
  
  const text = encodeURIComponent(selectedAchievement.value.shareText)
  const url = `https://twitter.com/intent/tweet?text=${text}`
  window.open(url, '_blank')
}

const shareToLinkedIn = () => {
  if (!selectedAchievement.value) return
  
  const text = encodeURIComponent(selectedAchievement.value.shareText)
  const url = `https://www.linkedin.com/sharing/share-offsite/?url=https://unconference.app&summary=${text}`
  window.open(url, '_blank')
}

const copyToClipboard = async () => {
  if (!selectedAchievement.value) return
  
  try {
    await navigator.clipboard.writeText(selectedAchievement.value.shareText)
    console.log('Achievement text copied to clipboard')
  } catch (err) {
    console.error('Failed to copy: ', err)
  }
}

const formatDate = (date: Date | string) => {
  const d = new Date(date)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - d.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 1) return 'yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString()
}

const loadAchievements = async () => {
  loading.value = true
  try {
    const result = await getUserAchievements() as any
    if (result?.achievements) {
      achievements.value = result.achievements
    }
  } catch (error) {
    console.error('Error loading achievements:', error)
    // Fallback to empty array
    achievements.value = []
  } finally {
    loading.value = false
  }
}

// Load achievements on mount and check for new ones
onMounted(async () => {
  await Promise.all([
    loadAchievements(),
    checkForNewAchievements()
  ])
})
</script>

<style scoped>
.achievement-system {
  max-width: 100%;
}

.achievement-card {
  transition: all 0.3s ease;
  position: relative;
  height: 100%;
}

.achievement-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.achievement-card--earned {
  animation: pulse 2s infinite;
}

.achievement-card--new::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, gold, orange);
  border-radius: inherit;
  z-index: -1;
  animation: glow 2s ease-in-out infinite alternate;
}

.achievement-icon-container {
  position: relative;
}

.achievement-icon--earned {
  animation: bounce 1s ease-in-out;
}

.achievement-new-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  animation: pulse 2s infinite;
}

.share-preview {
  border: 1px solid #ddd;
}

.share-options .v-btn {
  text-transform: none;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(255, 193, 7, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 193, 7, 0); }
}

@keyframes glow {
  0% { opacity: 1; }
  100% { opacity: 0.8; }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0,0,0);
  }
  40%, 43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}
</style>

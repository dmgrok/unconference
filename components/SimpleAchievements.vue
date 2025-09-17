<template>
  <div class="simple-achievements">
    <!-- Show achievements if user has any -->
    <div v-if="achievements.length > 0" class="achievements-earned">
      <h4 class="text-subtitle-2 mb-2">Your Achievements</h4>
      <div class="d-flex gap-2 flex-wrap">
        <v-chip
          v-for="achievement in achievements"
          :key="achievement.id"
          :color="achievement.color"
          size="small"
          variant="outlined"
        >
          <v-icon start size="16">{{ achievement.icon }}</v-icon>
          {{ achievement.title }}
        </v-chip>
      </div>
    </div>

    <!-- Show achievement notification if there's a new one -->
    <v-snackbar
      v-model="showNewAchievement"
      timeout="4000"
      color="success"
      location="top"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-trophy</v-icon>
        <div>
          <strong>Achievement Unlocked!</strong><br>
          <span class="text-caption">{{ newAchievement?.title }}</span>
        </div>
      </div>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  earnedAt?: Date;
  isNew?: boolean;
}

// Props
const props = defineProps<{
  eventId?: string;
  userId?: string;
}>();

// State
const achievements = ref<Achievement[]>([]);
const showNewAchievement = ref(false);
const newAchievement = ref<Achievement | null>(null);

// Composables
const { getUserAchievements, checkAchievements } = useAchievements();

// Load user achievements
const loadAchievements = async () => {
  try {
    const response = await getUserAchievements();
    if (response?.achievements) {
      achievements.value = response.achievements.filter((a: Achievement) => a.earned);

      // Check for new achievements
      const newlyEarned = response.achievements.find((a: Achievement) => a.isNew);
      if (newlyEarned) {
        newAchievement.value = newlyEarned;
        showNewAchievement.value = true;
      }
    }
  } catch (error) {
    console.error('Failed to load achievements:', error);
  }
};

// Check for new achievements (called after user actions)
const triggerAchievementCheck = async () => {
  try {
    const response = await checkAchievements();
    if (response?.newAchievements?.length > 0) {
      // Show notification for new achievement
      const newest = response.newAchievements[0];
      newAchievement.value = newest.achievement;
      showNewAchievement.value = true;

      // Reload achievements to show the new one
      await loadAchievements();
    }
  } catch (error) {
    console.error('Failed to check achievements:', error);
  }
};

// Expose methods for parent components
defineExpose({
  triggerAchievementCheck,
  loadAchievements
});

// Load achievements on mount
onMounted(async () => {
  if (props.eventId) {
    await loadAchievements();
  }
});
</script>

<style scoped>
.simple-achievements {
  /* Keep it minimal and unobtrusive */
}

.achievements-earned {
  padding: 12px;
  background: rgba(var(--v-theme-surface), 0.5);
  border-radius: 8px;
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
}

.achievements-earned h4 {
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.8;
}
</style>
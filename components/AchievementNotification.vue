<template>
  <v-snackbar
    v-model="show"
    :timeout="6000"
    location="top"
    color="success"
    multi-line
    class="achievement-notification"
  >
    <template #prepend>
      <v-avatar size="40" :color="achievement?.color || 'success'" class="mr-3">
        <v-icon color="white">{{ achievement?.icon || 'mdi-trophy' }}</v-icon>
      </v-avatar>
    </template>

    <div>
      <div class="text-h6 mb-1">🎉 Achievement Unlocked!</div>
      <div class="text-body-1 font-weight-bold">{{ achievement?.name }}</div>
      <div class="text-body-2">{{ achievement?.description }}</div>
    </div>

    <template #actions>
      <v-btn
        size="small"
        variant="text"
        @click="shareAchievement"
        prepend-icon="mdi-share"
      >
        Share
      </v-btn>
      <v-btn
        size="small"
        variant="text"
        @click="show = false"
        icon="mdi-close"
      ></v-btn>
    </template>
  </v-snackbar>
</template>

<script setup lang="ts">
interface Achievement {
  name: string
  description: string
  icon: string
  color: string
  shareText?: string
}

const props = defineProps<{
  modelValue: boolean
  achievement?: Achievement
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  share: [achievement: Achievement]
}>()

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const shareAchievement = () => {
  if (props.achievement) {
    emit('share', props.achievement)
  }
}
</script>

<style scoped>
.achievement-notification {
  animation: slide-in 0.5s ease-out;
}

@keyframes slide-in {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>

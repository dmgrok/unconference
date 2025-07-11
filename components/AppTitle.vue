<script setup lang="ts">
  const { eventConfig } = useEventConfig()

  async function goHome() {
    await navigateTo('/')  
  }
</script>

<template>
  <v-btn data-testid="home-button" @click="goHome()">{{ eventConfig.title }}</v-btn>
</template>

<style scoped></style>

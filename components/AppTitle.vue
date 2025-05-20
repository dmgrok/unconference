<script setup lang="ts">
  const title = ref('Eurocats Unconference')

  async function goHome() {
    await navigateTo('/')  
  }
</script>

<template>
  <v-btn data-testid="home-button" @click="goHome()">{{ title }}</v-btn>
</template>

<style scoped></style>

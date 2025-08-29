<script setup lang="ts">
  const { getFullTitle } = useSiteConfig()

  async function goHome() {
    await navigateTo('/')  
  }
</script>

<template>
  <v-btn 
    data-testid="home-button" 
    @click="goHome()"
    variant="text"
    class="app-title-btn"
    size="large"
  >
    {{ getFullTitle() }}
  </v-btn>
</template>

<style scoped>
.app-title-btn {
  text-transform: none !important;
  font-weight: 800 !important;
  font-size: 1.4rem !important;
  letter-spacing: normal !important;
  color: #1E293B !important;
  padding: 0 !important;
  min-width: auto !important;
  height: auto !important;
}

.app-title-btn:hover {
  background: rgba(99, 102, 241, 0.1) !important;
  color: #6366F1 !important;
  transform: scale(1.02);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark mode support */
.v-theme--dark .app-title-btn {
  color: #F1F5F9 !important;
}

.v-theme--dark .app-title-btn:hover {
  color: #818CF8 !important;
}
</style>

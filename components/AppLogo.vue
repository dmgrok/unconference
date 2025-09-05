<script setup lang="ts">
const { getTitle } = useSiteConfig()

async function goHome() {
  await navigateTo('/')  
}
</script>

<template>
  <v-btn 
    @click="goHome()"
    variant="text"
    class="logo-container"
    size="large"
    data-testid="logo-button"
  >
    <div class="logo-content">
      <!-- Logo Icon -->
      <div class="logo-icon">
        <v-icon size="32" color="primary">mdi-account-group</v-icon>
      </div>
      <!-- Brand Text -->
      <div class="brand-text">
        <div class="brand-title">{{ getTitle() }}</div>
        <div class="brand-year">2025</div>
      </div>
    </div>
  </v-btn>
</template>

<style scoped>
.logo-container {
  padding: 8px 12px !important;
  min-width: auto !important;
  height: 56px !important;
  text-transform: none !important;
  border-radius: 16px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.logo-container:hover {
  background: rgba(99, 102, 241, 0.1) !important;
  transform: scale(1.02);
}

.logo-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.logo-icon .v-icon {
  color: white !important;
}

.brand-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1;
}

.brand-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1E293B;
  letter-spacing: -0.025em;
}

.brand-year {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6366F1;
  margin-top: -2px;
  letter-spacing: 0.05em;
}

/* Dark mode support */
.v-theme--dark .brand-title {
  color: #F1F5F9;
}

.v-theme--dark .brand-year {
  color: #818CF8;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .logo-content {
    gap: 8px;
  }
  
  .logo-icon {
    width: 36px;
    height: 36px;
  }
  
  .logo-icon .v-icon {
    font-size: 20px !important;
  }
  
  .brand-title {
    font-size: 1.1rem;
  }
  
  .brand-year {
    font-size: 0.7rem;
  }
}

@media (max-width: 480px) {
  .brand-text {
    display: none;
  }
  
  .logo-content {
    gap: 0;
  }
}
</style>

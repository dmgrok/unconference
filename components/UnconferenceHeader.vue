<script setup lang="ts">
const { eventConfig } = useEventConfig()
const { user, loggedIn } = useUserSession()

const isOrganizer = computed(() => {
  const userRole = (user.value as any)?.Role || (user.value as any)?.role
  return ['Admin', 'Organizer'].includes(userRole)
})
</script>

<template>
  <header class="unconference-header">
    <v-app-bar 
      :elevation="2"
      color="surface"
      height="70"
      flat
    >
      <v-container class="d-flex align-center">
        <div class="d-flex align-items-center">
          <v-btn
            variant="text"
            :to="loggedIn ? '/dashboard' : '/'"
            class="header-logo"
          >
            <v-icon class="mr-2" size="28">mdi-forum</v-icon>
            <span class="logo-text">{{ eventConfig.title || 'Unconference Platform' }}</span>
          </v-btn>
        </div>

        <v-spacer />

        <div class="header-actions">
          <template v-if="loggedIn">
            <v-btn
              variant="text"
              to="/voting"
              prepend-icon="mdi-vote"
            >
              Voting & Topics
            </v-btn>
            
            <v-btn
              v-if="isOrganizer"
              variant="text"
              to="/organizer"
              prepend-icon="mdi-cog"
            >
              Organizer Hub
            </v-btn>
            
            <v-btn
              variant="outlined"
              color="error"
              @click="$router.push('/login')"
              prepend-icon="mdi-logout"
            >
              Logout
            </v-btn>
          </template>
          
          <template v-else>
            <v-btn
              variant="text"
              to="/login"
              prepend-icon="mdi-login"
            >
              Sign In
            </v-btn>
            
            <v-btn
              color="primary"
              to="/quick-join"
              prepend-icon="mdi-ticket-confirmation"
            >
              Join Event
            </v-btn>
          </template>
        </div>
      </v-container>
    </v-app-bar>
  </header>
</template>

<style scoped>
.unconference-header {
  position: sticky;
  top: 0;
  z-index: 100;
}

.v-app-bar {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.95) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.header-logo {
  font-size: 1.4rem;
  font-weight: 800;
  text-transform: none;
  color: #1E293B !important;
  border-radius: 12px;
  padding: 8px 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
}

.header-logo:hover {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
  transform: translateY(-1px);
}

.header-logo .v-icon {
  color: #6366F1 !important;
}

.logo-text {
  font-weight: 800;
  background: linear-gradient(135deg, #1E293B 0%, #6366F1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-actions .v-btn {
  text-transform: none;
  font-weight: 600;
  border-radius: 12px;
  letter-spacing: 0.3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.header-actions .v-btn[variant="text"] {
  color: #64748B;
}

.header-actions .v-btn[variant="text"]:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #6366F1;
}

.header-actions .v-btn[color="primary"] {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.header-actions .v-btn[color="primary"]:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.header-actions .v-btn[color="error"] {
  border-color: rgba(239, 68, 68, 0.3);
  color: #EF4444;
}

.header-actions .v-btn[color="error"]:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.5);
}

@media (max-width: 768px) {
  .logo-text {
    display: none;
  }
  
  .header-actions .v-btn {
    min-width: auto;
    padding: 0 12px;
  }
  
  .header-actions .v-btn .v-btn__content {
    font-size: 0.875rem;
  }
  
  .header-logo {
    font-size: 1.1rem;
    padding: 6px 12px;
  }
}

/* Dark mode support */
.v-theme--dark .v-app-bar {
  background: rgba(15, 23, 42, 0.95) !important;
  border-bottom-color: rgba(71, 85, 105, 0.2);
}

.v-theme--dark .header-logo {
  color: #F1F5F9 !important;
  background: linear-gradient(135deg, rgba(129, 140, 248, 0.15) 0%, rgba(167, 139, 250, 0.1) 100%);
}

.v-theme--dark .logo-text {
  background: linear-gradient(135deg, #F1F5F9 0%, #818CF8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.v-theme--dark .header-actions .v-btn[variant="text"] {
  color: #CBD5E1;
}

.v-theme--dark .header-actions .v-btn[variant="text"]:hover {
  background: rgba(129, 140, 248, 0.15);
  color: #818CF8;
}
</style>

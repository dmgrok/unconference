<script setup lang="ts">
import { ref } from 'vue'

const runtimeConfig = useRuntimeConfig()

const { user, clear: clearSession, openInPopup } = useUserSession()

const authUrl = ref(
  runtimeConfig.public.authUrl
);

async function goToDashboard() {
  await navigateTo('/dashboard')  
}

async function signIn() {
  await navigateTo(authUrl.value, { external: true })  
}
  
async function signOut() {
  await clearSession()
  await navigateTo('/')
}
</script>

<template>
  <v-app id="app">
    <v-app-bar elevation="0" height="80" class="app-bar-enhanced">
      <v-container class="d-flex align-center">
        <v-app-bar-title data-testid="app-bar-title" class="app-title-enhanced">
          <template #text>
            <AppTitle/>
          </template>
        </v-app-bar-title>
        <v-spacer></v-spacer>
        <div class="auth-actions">
          <AuthState>
            <template #default="{ loggedIn, clear }">
              <v-btn 
                v-if="loggedIn" 
                data-testid="workspace-button" 
                @click="goToDashboard()" 
                prepend-icon="mdi-view-dashboard"
                variant="text"
                class="action-btn"
              >
                Dashboard
              </v-btn>
              <v-btn 
                v-if="loggedIn" 
                data-testid="logout-button" 
                @click="signOut()" 
                prepend-icon="mdi-logout"
                variant="outlined"
                color="error"
                class="action-btn"
              >
                Logout
              </v-btn>
              <v-btn 
                v-else  
                data-testid="login-button" 
                @click="signIn()" 
                prepend-icon="mdi-login"
                color="primary"
                class="action-btn action-btn-primary"
              >
                Login
              </v-btn>
            </template>
            <template #placeholder>
              <v-btn disabled variant="text" class="action-btn">
                <v-progress-circular indeterminate size="16" class="mr-2"></v-progress-circular>
                Loading...
              </v-btn>
            </template>
          </AuthState>
        </div>
      </v-container>
    </v-app-bar>
    <v-main class="main-content-enhanced">
      <slot/>
    </v-main>
  </v-app>
</template>

<style scoped>
.app-bar-enhanced {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.95) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.app-title-enhanced {
  font-weight: 800;
  font-size: 1.4rem;
}

.auth-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.action-btn {
  text-transform: none;
  font-weight: 600;
  border-radius: 12px;
  letter-spacing: 0.3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn[variant="text"] {
  color: #64748B;
}

.action-btn[variant="text"]:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #6366F1;
}

.action-btn-primary {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.action-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.action-btn[color="error"] {
  border-color: rgba(239, 68, 68, 0.3);
  color: #EF4444;
}

.action-btn[color="error"]:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.5);
}

.main-content-enhanced {
  background: linear-gradient(135deg, #FEFEFE 0%, #F8FAFC 100%);
  min-height: calc(100vh - 80px);
}

/* Dark mode support */
.v-theme--dark .app-bar-enhanced {
  background: rgba(15, 23, 42, 0.95) !important;
  border-bottom-color: rgba(71, 85, 105, 0.2);
}

.v-theme--dark .action-btn[variant="text"] {
  color: #CBD5E1;
}

.v-theme--dark .action-btn[variant="text"]:hover {
  background: rgba(129, 140, 248, 0.15);
  color: #818CF8;
}

.v-theme--dark .main-content-enhanced {
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
}

@media (max-width: 768px) {
  .auth-actions {
    gap: 0.5rem;
  }
  
  .action-btn {
    min-width: auto;
    padding: 0 12px;
    font-size: 0.875rem;
  }
  
  .app-title-enhanced {
    font-size: 1.2rem;
  }
}
</style>

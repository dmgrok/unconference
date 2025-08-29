<script setup lang="ts">
import { ref } from 'vue'

const runtimeConfig = useRuntimeConfig()
const { user, clear: clearSession, openInPopup } = useUserSession()

// Use type assertion to access authUrl property
const authUrl = ref((runtimeConfig.public as any).authUrl || '/login')
const drawer = ref(false)

// Debug drawer state
watch(drawer, (newVal) => {
  console.log('Drawer state changed:', newVal)
})

// Navigation items for different user states
const publicNavItems = [
  { title: 'How It Works', href: '#how-it-works', icon: 'mdi-help-circle' },
  { title: 'Demo', to: '/organizer', icon: 'mdi-play-circle' },
  { title: 'Browse Events', to: '/events', icon: 'mdi-calendar-multiple' }
]

const quickActions = [
  { title: 'Join Event', to: '/quick-join', icon: 'mdi-ticket-confirmation', color: 'primary' },
  { title: 'Create Event', to: '/register', icon: 'mdi-plus', color: 'success' }
]

async function goToDashboard() {
  await navigateTo('/voting')  
}

async function signIn() {
  await navigateTo(authUrl.value, { external: true })  
}
  
async function signOut() {
  await clearSession()
  await navigateTo('/')
}

function scrollToSection(href: string) {
  if (href.startsWith('#')) {
    const element = document.querySelector(href)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }
}
</script>

<template>
  <v-app id="app">
    <!-- Enhanced Navigation Bar -->
    <v-app-bar elevation="0" height="80" class="app-bar-enhanced">
      <v-container class="d-flex align-center" fluid>
        <!-- Logo/Brand Section -->
        <div class="brand-section">
          <AppLogo/>
        </div>

        <!-- Desktop Navigation -->
        <div class="desktop-nav d-none d-lg-flex ml-8">
          <v-btn
            v-for="item in publicNavItems"
            :key="item.title"
            :to="item.to"
            :href="item.href"
            @click="item.href ? scrollToSection(item.href) : null"
            variant="text"
            class="nav-item"
            :prepend-icon="item.icon"
          >
            {{ item.title }}
          </v-btn>
        </div>

        <v-spacer></v-spacer>

        <!-- Quick Actions -->
        <div class="quick-actions d-none d-lg-flex">
          <v-btn
            v-for="action in quickActions"
            :key="action.title"
            :to="action.to"
            :color="action.color"
            variant="outlined"
            class="action-btn"
            :prepend-icon="action.icon"
            size="small"
          >
            {{ action.title }}
          </v-btn>
        </div>

        <!-- Auth Actions -->
        <div class="auth-actions">
          <AuthState>
            <template #default="{ loggedIn, clear }">
              <v-btn 
                v-if="loggedIn" 
                data-testid="workspace-button" 
                @click="goToDashboard()" 
                prepend-icon="mdi-view-dashboard"
                color="primary"
                variant="flat"
                class="action-btn"
              >
                Dashboard
              </v-btn>
              <v-menu v-if="loggedIn" location="bottom end">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-account-circle"
                    variant="text"
                    class="user-menu-btn"
                  ></v-btn>
                </template>
                <v-list>
                  <v-list-item @click="goToDashboard()" prepend-icon="mdi-view-dashboard">
                    <v-list-item-title>Dashboard</v-list-item-title>
                  </v-list-item>
                  <v-list-item to="/settings" prepend-icon="mdi-cog">
                    <v-list-item-title>Settings</v-list-item-title>
                  </v-list-item>
                  <v-divider></v-divider>
                  <v-list-item @click="signOut()" prepend-icon="mdi-logout" class="text-error">
                    <v-list-item-title>Sign Out</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
              <v-btn 
                v-else  
                data-testid="login-button" 
                @click="signIn()" 
                prepend-icon="mdi-login"
                color="primary"
                variant="flat"
                class="action-btn action-btn-primary"
              >
                Sign In
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

        <!-- Mobile Menu Button -->
        <v-btn
          @click="drawer = !drawer"
          icon="mdi-menu"
          variant="text"
          class="d-lg-none ml-2 mobile-menu-btn"
          size="large"
        ></v-btn>
      </v-container>
    </v-app-bar>

    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      location="right"
      temporary
      class="mobile-drawer"
      width="280"
    >
      <div class="drawer-content">
        <v-list>
          <v-list-item class="drawer-header">
            <template v-slot:prepend>
              <v-icon color="white">mdi-menu</v-icon>
            </template>
            <v-list-item-title class="text-h6 font-weight-bold">Navigation</v-list-item-title>
            <template v-slot:append>
              <v-btn 
                @click="drawer = false"
                icon="mdi-close"
                variant="text"
                color="white"
                size="small"
              ></v-btn>
            </template>
          </v-list-item>
        </v-list>
        
        <v-divider></v-divider>
        
        <v-list class="drawer-list">
          <!-- Quick Actions in Mobile -->
          <v-list-subheader class="drawer-subheader">Quick Actions</v-list-subheader>
          <v-list-item
            v-for="action in quickActions"
            :key="action.title"
            :to="action.to"
            :prepend-icon="action.icon"
            @click="drawer = false"
            class="drawer-item"
          >
            <v-list-item-title>{{ action.title }}</v-list-item-title>
          </v-list-item>
          
          <v-divider class="my-2"></v-divider>
          
          <!-- Navigation Items in Mobile -->
          <v-list-subheader class="drawer-subheader">Explore</v-list-subheader>
          <v-list-item
            v-for="item in publicNavItems"
            :key="item.title"
            :to="item.to"
            :href="item.href"
            :prepend-icon="item.icon"
            @click="item.href ? scrollToSection(item.href) : null; drawer = false"
            class="drawer-item"
          >
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </div>
    </v-navigation-drawer>

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
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.app-title-enhanced {
  font-weight: 800;
  font-size: 1.4rem;
  /* Removed gradient that was making text invisible */
}

.app-title-enhanced .v-btn {
  color: #1E293B !important;
  text-decoration: none;
}

.app-title-enhanced:hover .v-btn {
  color: #6366F1 !important;
}

.brand-section {
  display: flex;
  align-items: center;
  min-width: 200px;
  flex-shrink: 0;
}

.desktop-nav {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.nav-item {
  text-transform: none;
  font-weight: 500;
  color: #64748B;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.nav-item:hover {
  background: rgba(99, 102, 241, 0.1);
  color: #6366F1;
  transform: translateY(-1px);
}

.quick-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-right: 1rem;
}

.auth-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.action-btn {
  text-transform: none;
  font-weight: 600;
  border-radius: 12px;
  letter-spacing: 0.3px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 40px;
}

.action-btn[variant="outlined"] {
  border-width: 1.5px;
}

.action-btn[variant="outlined"]:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.action-btn-primary {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.action-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.user-menu-btn {
  color: #6366F1;
}

.user-menu-btn:hover {
  background: rgba(99, 102, 241, 0.1);
}

.mobile-menu-btn {
  color: #6366F1 !important;
  border-radius: 12px;
}

.mobile-menu-btn:hover {
  background: rgba(99, 102, 241, 0.1);
  transform: scale(1.05);
}

.mobile-drawer {
  z-index: 2000 !important;
}

.mobile-drawer :deep(.v-overlay__scrim) {
  background: rgba(0, 0, 0, 0.5);
  z-index: 1999;
}

.mobile-drawer :deep(.v-navigation-drawer__content) {
  background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%);
  height: 100%;
  overflow-y: auto;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
}

.drawer-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.drawer-header {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%) !important;
  color: white !important;
  min-height: 64px !important;
  padding: 12px 16px !important;
  margin: 0 !important;
}

.drawer-header .v-list-item-title {
  color: white !important;
  font-weight: 700 !important;
}

.drawer-list {
  flex: 1;
  padding: 0;
}

.drawer-subheader {
  background: rgba(99, 102, 241, 0.05);
  color: #6366F1 !important;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.75rem;
  padding: 12px 16px;
  margin: 0;
}

.drawer-item {
  margin: 0 8px;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.drawer-item:hover {
  background: rgba(99, 102, 241, 0.1) !important;
  transform: translateX(4px);
}

.drawer-item .v-list-item-title {
  font-weight: 500;
  color: #374151;
}

.drawer-item:hover .v-list-item-title {
  color: #6366F1;
  font-weight: 600;
}

.drawer-item .v-icon {
  color: #6B7280;
  transition: all 0.3s ease;
}

.drawer-item:hover .v-icon {
  color: #6366F1;
  transform: scale(1.1);
}

.main-content-enhanced {
  background: linear-gradient(135deg, #FEFEFE 0%, #F8FAFC 100%);
  min-height: calc(100vh - 80px);
}

/* Enhanced hover states */
.v-list-item:hover {
  background: rgba(99, 102, 241, 0.05);
  color: #6366F1;
}

.v-list-item .v-icon {
  transition: transform 0.2s ease;
}

.v-list-item:hover .v-icon {
  transform: scale(1.1);
}

/* Dark mode support */
.v-theme--dark .app-bar-enhanced {
  background: rgba(15, 23, 42, 0.95) !important;
  border-bottom-color: rgba(71, 85, 105, 0.2);
}

.v-theme--dark .nav-item {
  color: #CBD5E1;
}

.v-theme--dark .nav-item:hover {
  background: rgba(129, 140, 248, 0.15);
  color: #818CF8;
}

.v-theme--dark .main-content-enhanced {
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
}

.v-theme--dark .app-title-enhanced .v-btn {
  color: #F1F5F9 !important;
}

.v-theme--dark .app-title-enhanced:hover .v-btn {
  color: #818CF8 !important;
}

.v-theme--dark .drawer-header {
  background: linear-gradient(135deg, #4C1D95 0%, #5B21B6 100%);
}

/* Responsive Design */
@media (max-width: 1280px) {
  .desktop-nav {
    margin-left: 1rem;
    gap: 0.25rem;
  }
  
  .nav-item {
    font-size: 0.875rem;
    padding: 0 12px;
  }
}

@media (max-width: 1024px) {
  .desktop-nav {
    display: none !important;
  }
  
  .brand-section {
    min-width: 180px;
  }
}

@media (max-width: 960px) {
  .quick-actions {
    margin-right: 0.5rem;
    gap: 0.5rem;
  }
  
  .action-btn {
    min-width: auto;
    padding: 0 12px;
    font-size: 0.875rem;
  }
}

@media (max-width: 768px) {
  .auth-actions {
    gap: 0.5rem;
  }
  
  .action-btn-primary {
    padding: 0 16px;
  }
  
  .brand-section {
    min-width: 150px;
  }
}

@media (max-width: 480px) {
  .brand-section {
    min-width: 60px;
  }
  
  .quick-actions {
    display: none !important;
  }
}

/* Loading state improvements */
.v-progress-circular {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Focus states for accessibility */
.nav-item:focus-visible,
.action-btn:focus-visible {
  outline: 2px solid #6366F1;
  outline-offset: 2px;
}

/* Enhanced visual feedback */
.v-btn:active {
  transform: scale(0.98);
}
</style>

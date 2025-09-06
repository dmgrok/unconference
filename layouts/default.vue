<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue'
  import { reactive, computed } from 'vue'
  import { useDisplay } from 'vuetify'

  interface NavItem {
    icon: string
    title: string
    to: string
    adminOnly: boolean
    organizerAccess?: boolean
    superAdminOnly?: boolean
  }

  const { user, clear: clearSession } = useUserSession()
  const { initializeTheme, setupAutoThemeWatcher } = useAppTheme()
  const { shouldHideAdminFeatures, isViewerMode } = useViewerMode()
  
  // Get user role directly from session for now (until multi-event is fully implemented)
  const userRole = computed(() => (user.value as any)?.Role || (user.value as any)?.role || null)
  const globalRole = computed(() => (user.value as any)?.globalRole || null)
  const isAdmin = computed(() => userRole.value === 'Admin')
  const isSuperAdmin = computed(() => globalRole.value === 'SuperAdmin')

  // Initialize theme on app load
  onMounted(() => {
    initializeTheme()
    setupAutoThemeWatcher()
    
    // Fix: Ensure drawer state is properly initialized based on screen size
    if (process.client) {
      drawer.value = !window.matchMedia('(max-width: 960px)').matches
    }
  })

  const drawer = ref(true)
  
  // Fix: Watch for screen size changes and update drawer behavior
  const { mobile } = useDisplay()
  watch(mobile, (isMobile) => {
    if (isMobile) {
      drawer.value = false // Close drawer on mobile
    } else {
      drawer.value = true // Open drawer on desktop
    }
  })
  const navItems = reactive<NavItem[]>([
      {
      icon: 'mdi-account-star',
      title: 'Dashboard',
      to: '/organizer',
      adminOnly: true,
      organizerAccess: true
    },
    {
      icon: 'mdi-vote',
      title: 'Voting & Topics',
      to: '/voting',
      adminOnly: false
    },
    {
      icon: 'mdi-account-group',
      title: 'Groups',
      to: '/groups',
      adminOnly: false
    },
    {
      icon: 'mdi-chart-bar',
      title: 'Screen share',
      to: '/admin/voting-dashboard',
      adminOnly: true,
      organizerAccess: true
    },
    {
      icon: 'mdi-home-city',
      title: 'Room Management',
      to: '/organizer/rooms',
      adminOnly: true,
      organizerAccess: true
    },
    {
      icon: 'mdi-cog',
      title: 'Settings',
      to: '/settings',
      adminOnly: true,
      organizerAccess: true
    },
    {
      icon: 'mdi-shield-crown',
      title: 'Platform Admin',
      to: '/super-admin/dashboard',
      adminOnly: false,
      superAdminOnly: true
    },
    {
      icon: 'mdi-calendar-multiple',
      title: 'All Events',
      to: '/super-admin/events',
      adminOnly: false,
      superAdminOnly: true
    },
    {
      icon: 'mdi-account-supervisor',
      title: 'User Management',
      to: '/super-admin/users',
      adminOnly: false,
      superAdminOnly: true
    },
    {
      icon: 'mdi-server-security',
      title: 'Platform Settings',
      to: '/super-admin/settings',
      adminOnly: false,
      superAdminOnly: true
    }
  ])

  const filteredNavItems = computed<NavItem[]>(() => 
    navItems.filter(item => {
      // Super admin users should ONLY see super admin items
      if (isSuperAdmin.value) {
        return item.superAdminOnly
      }
      
      // Super admin items are only for super admins
      if (item.superAdminOnly) {
        return false
      }
      
      // Regular admin items
      if (!item.adminOnly) return true
      
      const currentUserRole = userRole.value
      const isCurrentUserAdmin = currentUserRole === 'Admin'
      const isCurrentUserOrganizer = currentUserRole === 'Organizer'
      
      // If item has organizer access, show to both admin and organizer
      if (item.organizerAccess) {
        return (isCurrentUserAdmin || isCurrentUserOrganizer) && !shouldHideAdminFeatures(currentUserRole || '')
      }
      
      // Otherwise, admin only
      return isCurrentUserAdmin && !shouldHideAdminFeatures(currentUserRole || '')
    })
  )

  const toggleDrawer = () => {
    drawer.value = !drawer.value
  }

  const signOut = async (callbackUrl: string) => {
    await clearSession()
    await navigateTo(callbackUrl)
  }
</script>

<template>
  <v-app id="app" class="app-enhanced">
    <v-app-bar elevation="0" height="80" class="app-bar-modern">
      <v-container class="d-flex align-center">
        <v-app-bar-nav-icon 
          id="app-bar-nav-icon" 
          @click.stop="toggleDrawer"
          class="nav-icon-modern"
        />
        
        <!-- Logo and App Title (moved from sidebar) -->
        <div class="header-logo d-flex align-center ml-4">
          <v-icon size="32" color="primary">mdi-forum</v-icon>
          <div class="header-logo-text ml-3">
            <h3 class="app-title-modern">Unconference</h3>
            <p class="user-role-text">{{ globalRole === 'SuperAdmin' ? 'Super Admin' : (userRole || 'Participant') }}</p>
          </div>
        </div>
        
        <v-spacer></v-spacer>

        <!-- Event Quick Access (for multi-event users) -->
        <div v-if="user" class="header-event-access mr-4">
          <v-btn
            v-if="!isSuperAdmin"
            color="primary"
            variant="outlined"
            prepend-icon="mdi-calendar-multiple"
            to="/events"
            size="small"
          >
            My Events
          </v-btn>
          <v-btn
            v-else
            color="primary"
            variant="outlined"
            prepend-icon="mdi-calendar-multiple"
            to="/super-admin/events"
            size="small"
          >
            All Events
          </v-btn>
        </div>
        
        <!-- Viewer Mode Toggle -->
        <v-btn
          v-if="isAdmin"
          :color="isViewerMode ? 'purple' : 'default'"
          :variant="isViewerMode ? 'elevated' : 'text'"
          :prepend-icon="isViewerMode ? 'mdi-eye-off' : 'mdi-eye'"
          @click="() => { const { toggleViewerMode } = useViewerMode(); toggleViewerMode() }"
          class="viewer-toggle-btn"
        >
          {{ isViewerMode ? 'Exit Viewer' : 'View as User' }}
        </v-btn>
        
        <div class="auth-section">
          <AuthState>
            <template #default="{ loggedIn, clear }">
              <v-btn 
                v-if="loggedIn" 
                data-testid="logout-button" 
                @click="signOut('/')" 
                prepend-icon="mdi-logout"
                variant="outlined"
                color="error"
                class="logout-btn"
              >
                Logout
              </v-btn>
            </template>
          </AuthState>
        </div>
      </v-container>
    </v-app-bar>
    
    <v-navigation-drawer 
      id="nav-drawer" 
      data-testid="nav-drawer"
      v-model="drawer"
      class="nav-drawer-modern"
      width="280"
      :temporary="mobile"
      :permanent="!mobile"
    >
      <v-list class="nav-list">
        <v-list-item
          v-for="(item, i) in filteredNavItems"
          :key="i"
          :to="item.to"
          :title="item.title"
          :prepend-icon="item.icon"
          class="nav-item"
          :class="{ 
            'nav-item--organizer': item.organizerAccess,
            'nav-item--super-admin': item.superAdminOnly
          }"
        />
      </v-list>
    </v-navigation-drawer>
    
    <v-main class="main-content-modern">
      <div class="content-wrapper">
        <slot/>
      </div>
    </v-main>
  </v-app>
</template>

<style scoped>
.app-enhanced {
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
}

/* App Bar Styles */
.app-bar-modern {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.95) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  z-index: 1006 !important; /* Ensure app bar is above navigation drawer */
}

.nav-icon-modern {
  color: #6366F1 !important;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.nav-icon-modern:hover {
  background: rgba(99, 102, 241, 0.1);
  transform: scale(1.05);
}

/* Header Logo Styles */
.header-logo {
  display: flex;
  align-items: center;
}

.header-logo-text h3 {
  font-size: 1.4rem;
  font-weight: 800;
  color: #1E293B;
  margin: 0;
  background: linear-gradient(135deg, #1E293B 0%, #6366F1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.user-role-text {
  font-size: 0.85rem;
  color: #64748B;
  margin: 0;
  font-weight: 500;
}

.app-title-modern {
  font-weight: 800;
  font-size: 1.4rem;
}

.viewer-toggle-btn {
  text-transform: none;
  font-weight: 600;
  border-radius: 12px;
  margin-right: 1rem;
  transition: all 0.3s ease;
}

.viewer-toggle-btn:hover {
  transform: translateY(-1px);
}

.auth-section {
  display: flex;
  align-items: center;
}

.logout-btn {
  text-transform: none;
  font-weight: 600;
  border-radius: 12px;
  border-color: rgba(239, 68, 68, 0.3);
  color: #EF4444;
  transition: all 0.3s ease;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.5);
  transform: translateY(-1px);
}

/* Navigation Drawer Styles */
.nav-drawer-modern {
  background: linear-gradient(135deg, #FFFFFF 0%, #FEFEFE 100%) !important;
  border-right: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 4px 0 20px rgba(0,0,0,0.08);
  z-index: 1005 !important; /* Ensure navigation drawer is above content but below overlays */
}

.nav-drawer-modern :deep(.v-navigation-drawer__content) {
  overflow-y: auto;
  height: 100%;
}

/* Fix: Prevent nav drawer overlay from interfering with page interaction */
.nav-drawer-modern :deep(.v-overlay) {
  z-index: 1004 !important;
  pointer-events: none !important; /* Critical fix: Allow clicks to pass through */
}

/* Fix: Specifically target the scrim element that's blocking interactions */
.nav-drawer-modern :deep(.v-navigation-drawer__scrim) {
  pointer-events: none !important; /* Critical fix: Disable scrim pointer events */
  opacity: 0 !important; /* Hide scrim visually */
  display: none !important; /* Completely remove scrim for permanent drawer */
}

/* Fix: Ensure scrim doesn't block interactions when drawer is permanent */
.nav-drawer-modern.v-navigation-drawer--permanent :deep(.v-overlay) {
  display: none !important; /* Hide overlay completely for permanent drawer */
}

/* Fix: Only show overlay scrim on mobile/temporary drawer */
.nav-drawer-modern.v-navigation-drawer--temporary :deep(.v-overlay) {
  pointer-events: auto !important; /* Allow overlay interaction only on mobile */
}

/* Fix: For temporary drawer on mobile, allow scrim interaction for closing */
.nav-drawer-modern.v-navigation-drawer--temporary :deep(.v-navigation-drawer__scrim) {
  pointer-events: auto !important; /* Allow scrim interaction on mobile to close drawer */
  opacity: 0.2 !important; /* Show scrim on mobile */
  display: block !important; /* Show scrim on mobile */
}

.nav-list {
  padding: 1rem 0.5rem;
}

.nav-item {
  margin-bottom: 0.5rem;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-weight: 600;
}

.nav-item:hover {
  background: rgba(99, 102, 241, 0.1);
  transform: translateX(4px);
}

.nav-item--organizer {
  border-left: 3px solid transparent;
}

.nav-item--organizer:hover {
  border-left-color: #8B5CF6;
}

.nav-item--super-admin {
  border-left: 3px solid transparent;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.05) 0%, rgba(220, 38, 38, 0.03) 100%);
}

.nav-item--super-admin:hover {
  border-left-color: #DC2626;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%);
}

.nav-item--super-admin.v-list-item--active {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.08) 100%);
  color: #DC2626;
}

.nav-item--super-admin.v-list-item--active :deep(.v-icon) {
  color: #DC2626 !important;
}

.nav-item.v-list-item--active {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
  color: #6366F1;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.nav-item.v-list-item--active :deep(.v-icon) {
  color: #6366F1 !important;
}

/* Main Content Styles */
.main-content-modern {
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
  min-height: calc(100vh - 80px);
}

.content-wrapper {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Dark mode support */
.v-theme--dark .app-enhanced {
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
}

.v-theme--dark .app-bar-modern {
  background: rgba(15, 23, 42, 0.95) !important;
  border-bottom-color: rgba(71, 85, 105, 0.2);
}

.v-theme--dark .nav-drawer-modern {
  background: linear-gradient(135deg, #1E293B 0%, #334155 100%) !important;
  border-right-color: rgba(71, 85, 105, 0.3);
}

.v-theme--dark .nav-logo-text h3 {
  background: linear-gradient(135deg, #F1F5F9 0%, #818CF8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.v-theme--dark .nav-logo-text p {
  color: #CBD5E1;
}

.v-theme--dark .nav-divider {
  border-color: rgba(71, 85, 105, 0.4);
}

.v-theme--dark .nav-item:hover {
  background: rgba(129, 140, 248, 0.15);
}

.v-theme--dark .nav-item.v-list-item--active {
  background: linear-gradient(135deg, rgba(129, 140, 248, 0.2) 0%, rgba(167, 139, 250, 0.1) 100%);
  color: #818CF8;
}

.v-theme--dark .nav-item.v-list-item--active :deep(.v-icon) {
  color: #818CF8 !important;
}

.v-theme--dark .main-content-modern {
  background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
}

/* Responsive Design */
@media (max-width: 960px) {
  .nav-drawer-modern {
    width: 240px !important;
  }
  
  .nav-header {
    padding: 1.5rem 1rem 0.75rem;
  }
  
  .nav-logo-text h3 {
    font-size: 1.1rem;
  }
  
  .content-wrapper {
    padding: 1.5rem;
  }
}

@media (max-width: 600px) {
  .viewer-toggle-btn {
    display: none;
  }
  
  .content-wrapper {
    padding: 1rem;
  }
  
  .nav-list {
    padding: 0.5rem 0.25rem;
  }
}
</style>

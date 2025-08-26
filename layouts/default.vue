<script setup lang="ts">
  import { ref } from 'vue'
  import { reactive, computed } from 'vue'
  import type { User } from '~/types/user'

  interface NavItem {
    icon: string
    title: string
    to: string
    adminOnly: boolean
  }

  const { user, clear: clearSession } = useUserSession()
  const { initializeTheme, setupAutoThemeWatcher } = useAppTheme()
  const { shouldHideAdminFeatures, isViewerMode } = useViewerMode()

  // Initialize theme on app load
  onMounted(() => {
    initializeTheme()
    setupAutoThemeWatcher()
  })

  const drawer = ref(true)
  const navItems = reactive<NavItem[]>([
    {
      icon: 'mdi-view-dashboard',
      title: 'Dashboard',
      to: '/dashboard',
      adminOnly: false
    },
    {
      icon: 'mdi-vote',
      title: 'Vote Preferences',
      to: '/preferences',
      adminOnly: false
    },
    {
      icon: 'mdi-trophy',
      title: 'Top Topics',
      to: '/leaderboard',
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
      title: 'Live Voting',
      to: '/admin/voting-dashboard',
      adminOnly: true
    },
    {
      icon: 'mdi-timer',
      title: 'Round Management',
      to: '/admin/round-management',
      adminOnly: true
    },
    {
      icon: 'mdi-home-city',
      title: 'Room Management',
      to: '/admin/rooms',
      adminOnly: true
    },
    {
      icon: 'mdi-cog',
      title: 'Settings',
      to: '/settings',
      adminOnly: true
    }
  ])

  const filteredNavItems = computed<NavItem[]>(() => 
    navItems.filter(item => !item.adminOnly || ((user.value as User)?.role === 'Admin' && !shouldHideAdminFeatures((user.value as User)?.role)))
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
  <v-app id="app">
    <v-app-bar id="app-bar">
      <v-app-bar-nav-icon id="app-bar-nav-icon" @click.stop="toggleDrawer"/>
      <v-app-bar-title data-testid="app-bar-title">
        <template #text>
          <AppTitle/>
        </template>
      </v-app-bar-title>
      <v-spacer></v-spacer>
      
      <!-- Viewer Mode Toggle -->
      <v-btn
        v-if="(user as User)?.role === 'Admin'"
        :color="isViewerMode ? 'purple' : 'default'"
        :variant="isViewerMode ? 'elevated' : 'text'"
        :prepend-icon="isViewerMode ? 'mdi-eye-off' : 'mdi-eye'"
        @click="() => { const { toggleViewerMode } = useViewerMode(); toggleViewerMode() }"
        class="mr-2"
      >
        {{ isViewerMode ? 'Exit Viewer' : 'View as User' }}
      </v-btn>
      
      <AuthState>
        <template #default="{ loggedIn, clear }">
          <v-btn v-if="loggedIn" data-testid="logout-button" @click="signOut('/')" append-icon="mdi-logout">Logout</v-btn>
        </template>
      </AuthState>
    </v-app-bar>
    <v-navigation-drawer 
      id="nav-drawer" 
      data-testid="nav-drawer"
      v-model="drawer"
    >
    <v-list-item
      v-for="(item, i) in filteredNavItems"
      :key="i"
      :to="item.to"
      :title="item.title"
      :prepend-icon="item.icon"
    />
    </v-navigation-drawer>
    <v-main class="d-flex align-center justify-center" style="min-height: 300px;">
      <slot/>
    </v-main>
  </v-app>
</template>

<template>
  <div class="mobile-navigation">
    <!-- Mobile Header Bar -->
    <v-app-bar
      v-if="isMobile"
      :elevation="2"
      color="surface"
      height="64"
      flat
      class="mobile-header"
    >
      <v-container class="d-flex align-center pa-2">
        <!-- Hamburger Menu Button -->
        <v-btn
          icon="mdi-menu"
          size="large"
          color="primary"
          variant="text"
          @click="showDrawer = !showDrawer"
          class="mr-2"
        />

        <!-- App Logo/Title -->
        <v-btn
          variant="text"
          :to="loggedIn ? '/events' : '/'"
          class="mobile-logo flex-grow-1 justify-start"
        >
          <v-icon class="mr-2" size="24">mdi-forum</v-icon>
          <span class="logo-text text-truncate">
            {{ eventConfig.name || 'Unconference' }}
          </span>
        </v-btn>

        <!-- Quick Actions -->
        <div class="quick-actions">
          <!-- Notifications Badge -->
          <v-btn
            v-if="loggedIn && hasNotifications"
            icon="mdi-bell"
            size="small"
            color="warning"
            variant="tonal"
            @click="showNotificationSheet = true"
            class="mr-1"
          >
            <v-badge
              :content="notificationCount"
              color="error"
              floating
            >
              <v-icon>mdi-bell</v-icon>
            </v-badge>
          </v-btn>

          <!-- Quick Vote Button -->
          <v-btn
            v-if="loggedIn && currentEventId"
            icon="mdi-heart-plus"
            size="small"
            color="primary"
            variant="tonal"
            @click="showQuickVoteSheet = true"
          />
        </div>
      </v-container>
    </v-app-bar>

    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer
      v-model="showDrawer"
      location="left"
      temporary
      width="320"
      class="mobile-drawer"
    >
      <!-- User Profile Section -->
      <div v-if="loggedIn" class="user-profile-section pa-4">
        <div class="d-flex align-center mb-3">
          <v-avatar color="primary" size="48" class="mr-3">
            <v-icon color="white">mdi-account</v-icon>
          </v-avatar>
          <div class="flex-grow-1">
            <h3 class="text-subtitle-1 font-weight-bold">
              {{ (user as any)?.name?.split(' ')[0] || 'User' }}
            </h3>
            <p class="text-caption text-grey">
              {{ (user as any)?.email }}
            </p>
          </div>
        </div>

        <!-- Current Event Info -->
        <v-card v-if="currentEvent" variant="tonal" color="primary" class="mb-3">
          <v-card-text class="pa-3">
            <div class="d-flex align-center mb-2">
              <v-icon class="mr-2" size="small">mdi-calendar-check</v-icon>
              <span class="text-body-2 font-weight-medium">{{ currentEvent.name }}</span>
            </div>
            <v-chip size="small" :color="currentEvent.isActive ? 'success' : 'warning'">
              {{ currentEvent.isActive ? 'Active' : 'Inactive' }}
            </v-chip>
          </v-card-text>
        </v-card>
      </div>

      <!-- Navigation Menu -->
      <v-list nav class="navigation-list">
        <!-- Guest Actions -->
        <template v-if="!loggedIn">
          <v-list-item
            prepend-icon="mdi-ticket-confirmation"
            title="Join Event"
            to="/quick-join"
            @click="closeDrawer"
          />
          <v-list-item
            prepend-icon="mdi-login"
            title="Sign In"
            to="/login"
            @click="closeDrawer"
          />
          <v-list-item
            prepend-icon="mdi-account-plus"
            title="Create Account"
            to="/register"
            @click="closeDrawer"
          />
          <v-list-item
            prepend-icon="mdi-plus"
            title="Create Event"
            to="/events"
            @click="closeDrawer"
          />
        </template>

        <!-- Authenticated User Actions -->
        <template v-else>
          <!-- Main Navigation -->
          <v-list-subheader>Main</v-list-subheader>

          <v-list-item
            prepend-icon="mdi-view-dashboard"
            title="Dashboard"
            to="/dashboard"
            @click="closeDrawer"
          />

          <v-list-item
            prepend-icon="mdi-calendar-multiple"
            title="My Events"
            to="/events"
            @click="closeDrawer"
          />

          <v-list-item
            v-if="currentEventId"
            prepend-icon="mdi-vote"
            title="Voting & Topics"
            to="/voting"
            @click="closeDrawer"
          />

          <v-list-item
            v-if="currentEventId"
            prepend-icon="mdi-account-group"
            title="Discussion Groups"
            to="/groups"
            @click="closeDrawer"
          />

          <v-list-item
            prepend-icon="mdi-account-group-outline"
            title="Participants"
            to="/participants"
            @click="closeDrawer"
          />

          <v-list-item
            v-if="currentEventId"
            prepend-icon="mdi-trophy"
            title="Top Topics"
            to="/top-topics"
            @click="closeDrawer"
          />

          <!-- Social Features -->
          <v-list-subheader>Social</v-list-subheader>

          <v-list-item
            v-if="currentEventId"
            prepend-icon="mdi-account-heart"
            title="Connections"
            to="/connections"
            @click="closeDrawer"
          />

          <v-list-item
            v-if="currentEventId"
            prepend-icon="mdi-medal"
            title="Achievements"
            @click="showAchievementSheet = true"
          />

          <!-- Admin/Organizer -->
          <template v-if="isAdmin">
            <v-list-subheader>Organizer</v-list-subheader>

            <v-list-item
              prepend-icon="mdi-cog"
              title="Organizer Hub"
              to="/organizer"
              @click="closeDrawer"
            />

          </template>

          <!-- Super Admin -->
          <template v-if="(user as any)?.globalRole === 'Admin'">
            <v-list-subheader>Super Admin</v-list-subheader>

            <v-list-item
              prepend-icon="mdi-shield-crown"
              title="Super Admin"
              to="/admin/dashboard"
              @click="closeDrawer"
            />
          </template>

          <!-- Settings -->
          <v-divider class="my-3" />

          <v-list-item
            prepend-icon="mdi-cog"
            title="Settings"
            to="/settings"
            @click="closeDrawer"
          />

          <v-list-item
            prepend-icon="mdi-logout"
            title="Sign Out"
            @click="logout"
            class="text-error"
          />
        </template>
      </v-list>

      <!-- App Version Info -->
      <div class="app-info pa-3 text-center">
        <p class="text-caption text-grey">
          Unconference Platform v2.0
        </p>
      </div>
    </v-navigation-drawer>

    <!-- Mobile Bottom Navigation -->
    <v-bottom-navigation
      v-if="loggedIn && currentEventId && isMobile"
      v-model="activeTab"
      grow
      height="70"
      class="mobile-bottom-nav"
      color="primary"
    >
      <v-btn
        value="voting"
        @click="navigateTo('/voting')"
        class="bottom-nav-btn"
      >
        <v-icon>mdi-vote</v-icon>
        <span>Vote</span>
      </v-btn>

      <v-btn
        value="groups"
        @click="navigateTo('/groups')"
        class="bottom-nav-btn"
      >
        <v-icon>mdi-account-group</v-icon>
        <span>Groups</span>
      </v-btn>

      <v-btn
        value="topics"
        @click="navigateTo('/top-topics')"
        class="bottom-nav-btn"
      >
        <v-icon>mdi-trophy</v-icon>
        <span>Topics</span>
      </v-btn>

      <v-btn
        value="connections"
        @click="navigateTo('/connections')"
        class="bottom-nav-btn"
      >
        <v-icon>mdi-account-heart</v-icon>
        <span>Connect</span>
      </v-btn>
    </v-bottom-navigation>

    <!-- Quick Vote Bottom Sheet -->
    <v-bottom-sheet
      v-model="showQuickVoteSheet"
      inset
      max-width="500"
      class="quick-vote-sheet"
    >
      <v-card class="px-4 py-6">
        <v-card-title class="text-center">
          <v-icon class="mr-2" color="primary">mdi-heart-plus</v-icon>
          Quick Vote
        </v-card-title>

        <v-card-text>
          <p class="text-body-2 text-center mb-4">
            Tap to quickly vote for trending topics
          </p>

          <!-- Quick voting options would go here -->
          <div class="quick-vote-grid">
            <v-btn
              v-for="topic in trendingTopics.slice(0, 4)"
              :key="topic.id"
              @click="quickVote(topic.id)"
              variant="outlined"
              color="primary"
              size="large"
              class="quick-vote-option mb-2"
              block
            >
              <div class="text-left">
                <div class="text-subtitle-2">{{ topic.title }}</div>
                <div class="text-caption text-grey">{{ topic.votes }} votes</div>
              </div>
            </v-btn>
          </div>

          <v-btn
            variant="text"
            color="primary"
            @click="navigateTo('/voting'); showQuickVoteSheet = false"
            class="mt-4"
            block
          >
            View All Topics
          </v-btn>
        </v-card-text>
      </v-card>
    </v-bottom-sheet>

    <!-- Achievement Bottom Sheet -->
    <v-bottom-sheet
      v-model="showAchievementSheet"
      inset
      max-width="500"
      class="achievement-sheet"
    >
      <v-card class="px-4 py-6">
        <v-card-title class="text-center">
          <v-icon class="mr-2" color="warning">mdi-medal</v-icon>
          Your Achievements
        </v-card-title>

        <v-card-text>
          <div class="achievement-grid">
            <div
              v-for="achievement in userAchievements"
              :key="achievement.id"
              class="achievement-item d-flex align-center mb-3 pa-3 rounded-lg"
              :class="{ 'bg-success-lighten4': achievement.unlocked }"
            >
              <v-avatar :color="achievement.unlocked ? 'success' : 'grey'" class="mr-3">
                <v-icon color="white">{{ achievement.icon }}</v-icon>
              </v-avatar>
              <div class="flex-grow-1">
                <h4 class="text-subtitle-2">{{ achievement.title }}</h4>
                <p class="text-caption text-grey">{{ achievement.description }}</p>
              </div>
              <v-chip
                v-if="achievement.unlocked"
                size="small"
                color="success"
                variant="flat"
              >
                ✓
              </v-chip>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-bottom-sheet>

    <!-- Notification Bottom Sheet -->
    <v-bottom-sheet
      v-model="showNotificationSheet"
      inset
      max-width="500"
      class="notification-sheet"
    >
      <v-card class="px-4 py-6">
        <v-card-title class="text-center">
          <v-icon class="mr-2" color="warning">mdi-bell</v-icon>
          Notifications
        </v-card-title>

        <v-card-text>
          <div class="notification-list">
            <div
              v-for="notification in notifications"
              :key="notification.id"
              class="notification-item pa-3 mb-2 rounded-lg border"
            >
              <div class="d-flex align-center">
                <v-icon :color="notification.color" class="mr-3">{{ notification.icon }}</v-icon>
                <div class="flex-grow-1">
                  <p class="text-body-2 mb-1">{{ notification.message }}</p>
                  <p class="text-caption text-grey">{{ notification.timestamp }}</p>
                </div>
              </div>
            </div>
          </div>

          <v-btn
            v-if="notifications.length === 0"
            variant="text"
            disabled
            class="mt-4"
            block
          >
            No new notifications
          </v-btn>
        </v-card-text>
      </v-card>
    </v-bottom-sheet>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useRoute } from 'vue-router'

// Composables
const { user, loggedIn, clear: clearSession } = useUserSession()
const { eventConfig } = useEventConfig()
const { currentEvent } = useCurrentEvent()
const { currentEventId } = useEventContext()
const { mobile } = useDisplay()
const route = useRoute()

// Reactive state
const showDrawer = ref(false)
const showQuickVoteSheet = ref(false)
const showAchievementSheet = ref(false)
const showNotificationSheet = ref(false)
const activeTab = ref('voting')

// Computed properties
const isMobile = computed(() => mobile.value)

const isAdmin = computed(() => {
  const userRole = (user.value as any)?.Role || (user.value as any)?.role
  return ['Admin', 'Organizer'].includes(userRole)
})

// Mock data - these would come from your actual data sources
const trendingTopics = ref([
  { id: '1', title: 'Future of Remote Work', votes: 15 },
  { id: '2', title: 'Sustainable Technology', votes: 12 },
  { id: '3', title: 'AI Ethics Discussion', votes: 10 },
  { id: '4', title: 'Web3 Applications', votes: 8 }
])

const userAchievements = ref([
  {
    id: '1',
    title: 'First Vote',
    description: 'Cast your first vote',
    icon: 'mdi-vote',
    unlocked: true
  },
  {
    id: '2',
    title: 'Topic Creator',
    description: 'Create your first topic',
    icon: 'mdi-lightbulb',
    unlocked: true
  },
  {
    id: '3',
    title: 'Connector',
    description: 'Make 5 connections',
    icon: 'mdi-account-group',
    unlocked: false
  },
  {
    id: '4',
    title: 'Discussion Leader',
    description: 'Lead a discussion group',
    icon: 'mdi-account-tie',
    unlocked: false
  }
])

const notifications = ref([
  {
    id: '1',
    message: 'New discussion round starting in 5 minutes',
    timestamp: '2 minutes ago',
    icon: 'mdi-clock',
    color: 'warning'
  },
  {
    id: '2',
    message: 'Your topic "AI Ethics" was selected for discussion',
    timestamp: '1 hour ago',
    icon: 'mdi-trophy',
    color: 'success'
  }
])

const hasNotifications = computed(() => notifications.value.length > 0)
const notificationCount = computed(() => notifications.value.length)

// Methods
const closeDrawer = () => {
  showDrawer.value = false
}

const quickVote = async (topicId: string) => {
  // Implement quick voting logic
  console.log('Quick vote for topic:', topicId)
  showQuickVoteSheet.value = false
  // Add haptic feedback
  if ('vibrate' in navigator) {
    navigator.vibrate([50])
  }
}

const logout = async () => {
  await clearSession()
  await navigateTo('/login')
}

// Watch route changes to update active tab
watch(() => route.path, (newPath) => {
  if (newPath.includes('/voting')) {
    activeTab.value = 'voting'
  } else if (newPath.includes('/groups')) {
    activeTab.value = 'groups'
  } else if (newPath.includes('/top-topics')) {
    activeTab.value = 'topics'
  } else if (newPath.includes('/connections')) {
    activeTab.value = 'connections'
  }
}, { immediate: true })

// Close drawer when clicking outside on mobile
watch(showDrawer, (isOpen) => {
  if (isOpen && isMobile.value) {
    // Add a slight delay to prevent immediate closing
    setTimeout(() => {
      const handleClick = (event: Event) => {
        const drawer = document.querySelector('.v-navigation-drawer')
        if (drawer && !drawer.contains(event.target as Node)) {
          showDrawer.value = false
          document.removeEventListener('click', handleClick)
        }
      }
      document.addEventListener('click', handleClick)
    }, 100)
  }
})
</script>

<style scoped>
/* Mobile Header */
.mobile-header {
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.95) !important;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.mobile-logo {
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: none;
  justify-content: flex-start !important;
  max-width: calc(100% - 120px);
}

.logo-text {
  font-weight: 700;
  color: #1E293B;
}

.quick-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Mobile Drawer */
.mobile-drawer .v-navigation-drawer__content {
  display: flex;
  flex-direction: column;
}

.user-profile-section {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.navigation-list {
  flex-grow: 1;
  padding-top: 8px;
}

.navigation-list .v-list-item {
  border-radius: 8px;
  margin: 0 8px 4px 8px;
  transition: all 0.3s ease;
}

.navigation-list .v-list-item:hover {
  background: rgba(99, 102, 241, 0.1);
}

.navigation-list .v-list-item.router-link-active {
  background: rgba(99, 102, 241, 0.15);
  color: #6366F1;
}

.app-info {
  margin-top: auto;
  border-top: 1px solid rgba(148, 163, 184, 0.1);
}

/* Bottom Navigation */
.mobile-bottom-nav {
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  backdrop-filter: blur(20px);
  background: rgba(255, 255, 255, 0.95) !important;
}

.bottom-nav-btn {
  flex-direction: column !important;
  height: 100% !important;
  min-width: 0 !important;
  padding: 8px 4px !important;
}

.bottom-nav-btn .v-icon {
  margin-bottom: 4px;
  font-size: 20px;
}

.bottom-nav-btn span {
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1;
  text-transform: none;
}

/* Bottom Sheets */
.quick-vote-sheet .v-card,
.achievement-sheet .v-card,
.notification-sheet .v-card {
  border-radius: 20px 20px 0 0;
}

.quick-vote-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quick-vote-option {
  text-align: left !important;
  justify-content: flex-start !important;
  padding: 16px;
  border-radius: 12px;
}

.achievement-grid {
  max-height: 400px;
  overflow-y: auto;
}

.achievement-item {
  border: 1px solid rgba(148, 163, 184, 0.2);
  transition: all 0.3s ease;
}

.achievement-item:hover {
  background: rgba(99, 102, 241, 0.05) !important;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(248, 250, 252, 0.5);
  transition: all 0.3s ease;
}

.notification-item:hover {
  background: rgba(99, 102, 241, 0.05);
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .mobile-logo {
    font-size: 1rem;
  }

  .user-profile-section {
    padding: 16px;
  }

  .quick-vote-option {
    padding: 12px;
  }

  .achievement-item,
  .notification-item {
    padding: 12px;
  }
}

/* Dark mode support */
.v-theme--dark .mobile-header {
  background: rgba(15, 23, 42, 0.95) !important;
  border-bottom-color: rgba(71, 85, 105, 0.2);
}

.v-theme--dark .logo-text {
  color: #F1F5F9;
}

.v-theme--dark .user-profile-section {
  background: linear-gradient(135deg, rgba(129, 140, 248, 0.15) 0%, rgba(167, 139, 250, 0.1) 100%);
  border-bottom-color: rgba(71, 85, 105, 0.2);
}

.v-theme--dark .mobile-bottom-nav {
  background: rgba(15, 23, 42, 0.95) !important;
  border-top-color: rgba(71, 85, 105, 0.2);
}

.v-theme--dark .notification-item {
  background: rgba(30, 41, 59, 0.5);
  border-color: rgba(71, 85, 105, 0.3);
}

/* Touch feedback */
@media (hover: none) and (pointer: coarse) {
  .v-list-item:active,
  .bottom-nav-btn:active,
  .quick-vote-option:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .navigation-list .v-list-item,
  .achievement-item,
  .notification-item,
  .quick-vote-option {
    transition: none !important;
  }
}
</style>
<script setup lang="ts">
const { eventConfig } = useEventConfig()
const { user, loggedIn, clear: clearSession } = useUserSession()
const { currentEvent, loading: eventLoading } = useCurrentEvent()

const isOrganizer = computed(() => {
  const userRole = (user.value as any)?.Role || (user.value as any)?.role
  return ['Admin', 'Organizer'].includes(userRole)
})

// Load user's events for event switching
const userEvents = ref<any[]>([])
const loadingEvents = ref(false)

const loadUserEvents = async () => {
  if (!loggedIn.value) return
  
  loadingEvents.value = true
  try {
    const response = await $fetch('/api/events/my-events') as any
    userEvents.value = response?.events || []
  } catch (error) {
    console.error('Failed to load user events:', error)
    userEvents.value = []
  } finally {
    loadingEvents.value = false
  }
}

// Show current event info when user is in an event context
const showCurrentEvent = computed(() => {
  return loggedIn.value && currentEvent.value && !eventLoading.value
})

// Show event selector when user has multiple events
const showEventSelector = computed(() => {
  return loggedIn.value && userEvents.value.length > 1 && currentEvent.value
})

// Switch to different event
const switchEvent = async (eventId: string) => {
  if (eventId && eventId !== currentEvent.value?.id) {
    await navigateTo(`/events/${eventId}`)
  }
}

// Copy event code to clipboard
const copyEventCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    // Could add a toast notification here in the future
  } catch (error) {
    console.error('Failed to copy event code:', error)
  }
}

// Load events on component mount
onMounted(() => {
  if (loggedIn.value) {
    loadUserEvents()
  }
})

// Watch for login status changes
watch(loggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    loadUserEvents()
  } else {
    userEvents.value = []
  }
})

// Logout function
async function logout() {
  await clearSession()
  await navigateTo('/login')
}
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
            :to="loggedIn ? '/events' : '/'"
            class="header-logo"
          >
            <v-icon class="mr-2" size="28">mdi-forum</v-icon>
            <span class="logo-text">
              {{ isOrganizer ? 'Unconference Organizer' : (eventConfig.name || 'Unconference Platform') }}
            </span>
          </v-btn>
          
          <!-- Current Event Display or Event Selector -->
          <div v-if="loggedIn" class="ml-6 d-flex align-center">
            <v-divider vertical class="mx-3" />
            
            <!-- Show current event when one is selected -->
            <div v-if="showCurrentEvent && currentEvent" class="event-info">
              <div class="d-flex align-center">
                <v-chip
                  :color="currentEvent.isActive ? 'success' : 'warning'"
                  size="small"
                  variant="tonal"
                  class="mr-2"
                >
                  <v-icon start size="14">
                    {{ currentEvent.isActive ? 'mdi-calendar-check' : 'mdi-calendar-clock' }}
                  </v-icon>
                  {{ currentEvent.isActive ? 'Active' : 'Inactive' }}
                </v-chip>
                <div>
                  <div class="text-body-2 font-weight-medium">{{ currentEvent.name }}</div>
                  <div 
                    class="text-caption text-medium-emphasis cursor-pointer" 
                    @click="copyEventCode(currentEvent.code)"
                    :title="`Click to copy: ${currentEvent.code}`"
                  >
                    {{ currentEvent.code }}
                    <v-icon size="12" class="ml-1">mdi-content-copy</v-icon>
                  </div>
                </div>
                
                <!-- Event Selector for Multiple Events -->
                <v-menu v-if="showEventSelector" offset-y>
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-chevron-down"
                      size="small"
                      variant="text"
                      class="ml-2"
                      title="Switch Event"
                    />
                  </template>
                  <v-list class="event-selector-list">
                    <v-list-subheader>Switch to Event</v-list-subheader>
                    <v-list-item
                      v-for="event in userEvents"
                      :key="event.id"
                      :active="event.id === currentEvent.id"
                      @click="switchEvent(event.id)"
                    >
                      <template #prepend>
                        <v-icon>
                          {{ event.isActive ? 'mdi-calendar-check' : 'mdi-calendar-clock' }}
                        </v-icon>
                      </template>
                      <v-list-item-title>{{ event.name }}</v-list-item-title>
                      <v-list-item-subtitle>{{ event.code }}</v-list-item-subtitle>
                      <template #append>
                        <v-chip
                          :color="event.isActive ? 'success' : 'warning'"
                          size="x-small"
                          variant="outlined"
                        >
                          {{ event.isActive ? 'Active' : 'Inactive' }}
                        </v-chip>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </div>
            
            <!-- Show event selector when no event is selected but user has events -->
            <div v-else-if="userEvents.length > 0 && !eventLoading" class="event-selector">
              <v-menu offset-y>
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    variant="outlined"
                    color="primary"
                    size="small"
                    prepend-icon="mdi-calendar-multiple"
                    append-icon="mdi-chevron-down"
                  >
                    Select Event
                  </v-btn>
                </template>
                <v-list class="event-selector-list">
                  <v-list-subheader>Choose an Event</v-list-subheader>
                  <v-list-item
                    v-for="event in userEvents"
                    :key="event.id"
                    @click="switchEvent(event.id)"
                  >
                    <template #prepend>
                      <v-icon>
                        {{ event.isActive ? 'mdi-calendar-check' : 'mdi-calendar-clock' }}
                      </v-icon>
                    </template>
                    <v-list-item-title>{{ event.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ event.code }}</v-list-item-subtitle>
                    <template #append>
                      <v-chip
                        :color="event.isActive ? 'success' : 'warning'"
                        size="x-small"
                        variant="outlined"
                      >
                        {{ event.isActive ? 'Active' : 'Inactive' }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
            
            <!-- Show message when user has no events -->
            <div v-else-if="!eventLoading && userEvents.length === 0" class="no-events">
              <v-chip
                color="info"
                size="small"
                variant="tonal"
                prepend-icon="mdi-information"
              >
                No events yet
              </v-chip>
            </div>
          </div>
        </div>

        <v-spacer />

        <div class="header-actions">
          <template v-if="loggedIn">
            <!-- Logged-in User Actions -->
            <v-btn
              variant="text"
              to="/events"
              prepend-icon="mdi-calendar-multiple"
            >
              My Events
            </v-btn>
            
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
            
            <!-- User Menu -->
            <v-menu>
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="text"
                  prepend-icon="mdi-account-circle"
                >
                  {{ (user as any)?.name?.split(' ')[0] || 'User' }}
                  <v-icon end>mdi-chevron-down</v-icon>
                </v-btn>
              </template>
              
              <v-list>
                <v-list-item to="/settings" prepend-icon="mdi-cog">
                  <v-list-item-title>Settings</v-list-item-title>
                </v-list-item>
                
                <v-list-item 
                  v-if="(user as any)?.globalRole === 'SuperAdmin'"
                  to="/super-admin/dashboard" 
                  prepend-icon="mdi-shield-crown"
                >
                  <v-list-item-title>Super Admin</v-list-item-title>
                </v-list-item>
                
                <v-divider />
                
                <v-list-item 
                  @click="logout"
                  prepend-icon="mdi-logout"
                  class="text-error"
                >
                  <v-list-item-title>Sign Out</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </template>
          
          <template v-else>
            <!-- Non-authenticated User Actions -->
            <v-btn
              variant="text"
              to="/quick-join"
              prepend-icon="mdi-ticket-confirmation"
            >
              Join Event
            </v-btn>
            
            <v-btn
              variant="text"
              to="/login"
              prepend-icon="mdi-login"
            >
              Sign In
            </v-btn>
            
            <v-btn
              color="primary"
              to="/register"
              prepend-icon="mdi-account-plus"
            >
              Create Account
            </v-btn>
            
            <v-btn
              color="secondary"
              variant="outlined"
              to="/events"
              prepend-icon="mdi-plus"
            >
              Create Event
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

.event-info {
  max-width: 250px;
}

.event-info .v-chip {
  font-size: 0.75rem;
  height: 24px;
}

.event-selector-list {
  min-width: 280px;
  max-width: 320px;
}

.event-selector-list .v-list-item {
  padding: 12px 16px;
}

.event-selector-list .v-list-item:hover {
  background-color: rgba(99, 102, 241, 0.1);
}

.cursor-pointer {
  cursor: pointer;
}

.cursor-pointer:hover {
  opacity: 0.8;
}

.event-selector, .no-events {
  display: flex;
  align-items: center;
}

.event-selector .v-btn {
  text-transform: none;
  font-weight: 500;
}

.no-events .v-chip {
  font-size: 0.75rem;
}

@media (max-width: 768px) {
  .logo-text {
    display: none;
  }
  
  .event-info, .event-selector, .no-events {
    display: none !important;
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

<template>
  <div class="d-flex flex-column min-height-screen">
    <!-- App Header -->
    <UnconferenceHeader />
    
    <!-- Event Selection Bar (if user has multiple events) -->
    <v-app-bar v-if="userEvents.length > 1" color="surface-variant" dense>
      <v-container class="d-flex align-center">
        <v-select
          v-model="selectedEventId"
          :items="userEvents"
          item-title="name"
          item-value="id"
          label="Select Event"
          variant="outlined"
          density="compact"
          class="max-width-300"
          @update:model-value="switchEvent"
        >
          <template #item="{ props, item }">
            <v-list-item v-bind="props">
              <template #prepend>
                <v-icon>
                  {{ item.raw.isActive ? 'mdi-calendar-check' : 'mdi-calendar-clock' }}
                </v-icon>
              </template>
              <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ item.raw.code }}</v-list-item-subtitle>
            </v-list-item>
          </template>
        </v-select>
        
        <v-spacer />
        
        <!-- Current Event Info -->
        <div v-if="currentEvent" class="text-caption">
          <v-chip
            :color="currentEvent.isActive ? 'success' : 'warning'"
            size="small"
            variant="tonal"
          >
            {{ currentEvent.isActive ? 'Active' : 'Inactive' }}
          </v-chip>
          <span class="ml-2">{{ currentEvent.code }}</span>
        </div>
      </v-container>
    </v-app-bar>
    
    <!-- Main Content -->
    <v-main class="flex-grow-1">
      <slot />
    </v-main>
  </div>
</template>

<script setup lang="ts">
interface Event {
  id: string
  code: string
  name: string
  isActive: boolean
}

const { user } = useUserSession()
const route = useRoute()
const router = useRouter()

// Get user's events on client side
const userEvents = ref<Event[]>([])

// Load events function
async function loadUserEvents() {
  try {
    const response = await $fetch('/api/events/my-events') as any
    userEvents.value = response?.events || []
  } catch (error) {
    console.error('Failed to load user events:', error)
    userEvents.value = []
  }
}

// Current event handling
const selectedEventId = ref<string>()
const currentEvent = computed(() => 
  userEvents.value.find(e => e.id === selectedEventId.value)
)

// Initialize selected event from route or first event
onMounted(async () => {
  await loadUserEvents()
  
  const routeEventId = route.query.eventId as string
  if (routeEventId && userEvents.value.find(e => e.id === routeEventId)) {
    selectedEventId.value = routeEventId
  } else if (userEvents.value.length > 0) {
    selectedEventId.value = userEvents.value[0].id
  }
})

// Switch event and update route
async function switchEvent(eventId: string) {
  selectedEventId.value = eventId
  
  // Update route with event context
  await router.push({
    ...route,
    query: {
      ...route.query,
      eventId
    }
  })
}

// Provide event context to child components
provide('currentEventId', selectedEventId)
provide('currentEvent', currentEvent)
</script>

<style scoped>
.min-height-screen {
  min-height: 100vh;
}

.max-width-300 {
  max-width: 300px;
}
</style>

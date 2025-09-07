<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({
  middleware: 'authenticated'
})

const { user } = useUserSession()
const loading = ref(true)
const error = ref('')
const events = ref<any[]>([])

// Fetch all events for current user (organizer or participant)
async function loadEvents() {
  loading.value = true
  error.value = ''
  try {
    const response = await $fetch('/api/events/my-events') as any
    events.value = response.events || []
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to load events'
  } finally {
    loading.value = false
  }
}

const pastEvents = computed(() => events.value.filter(e => e.isActive === false))

onMounted(loadEvents)

function viewEvent(evt: any) {
  navigateTo({ path: '/event-viewer', query: { eventId: evt.id } })
}

const isOrganizer = computed(() => {
  const role = (user.value as any)?.role || (user.value as any)?.Role
  return ['Organizer', 'Admin'].includes(role)
})
</script>

<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Past Events</h1>
        <p class="text-body-1 text-grey-darken-1">Browse inactive (closed) events in read-only mode.</p>
      </div>
    </div>

    <v-alert v-if="error" type="error" class="mb-4" variant="outlined">{{ error }}</v-alert>
    <v-skeleton-loader v-if="loading" type="table" class="mb-4" />

    <v-alert v-if="!loading && !pastEvents.length" type="info" variant="outlined">
      No past (inactive) events found.
    </v-alert>

    <v-row v-if="!loading">
      <v-col v-for="evt in pastEvents" :key="evt.id" cols="12" md="6" lg="4">
        <v-card variant="outlined" :disabled="!isOrganizer" class="h-100 d-flex flex-column">
          <v-card-title class="pb-1">
            <div class="d-flex align-center justify-space-between w-100">
              <span class="text-truncate" style="max-width: 75%" :title="evt.name || evt.title">{{ evt.name || evt.title || 'Untitled Event' }}</span>
              <v-chip size="small" color="grey" variant="flat">Inactive</v-chip>
            </div>
          </v-card-title>
          <v-card-subtitle class="pb-0">
            Role: {{ evt.role || 'Participant' }}
          </v-card-subtitle>
          <v-card-text class="pt-2 pb-0 flex-grow-1 text-body-2">
            <div class="mb-2">Created: {{ new Date(evt.createdAt || evt.joinedAt).toLocaleDateString() }}</div>
            <div v-if="evt.closedAt">Closed: {{ new Date(evt.closedAt).toLocaleDateString() }}</div>
            <div class="text-grey-darken-1 mt-2">Read-only access. Data is frozen.</div>
          </v-card-text>
          <v-divider class="my-2" />
          <v-card-actions class="pt-0">
            <v-btn color="primary" variant="outlined" block @click="viewEvent(evt)">
              View Data
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
</style>

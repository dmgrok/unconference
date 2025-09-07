<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { DiscussionTopic } from '~/types/topic'

definePageMeta({
  middleware: 'authenticated'
})

// Use route query eventId to set context (handled by useEventContext composable)
const route = useRoute()
const eventId = computed(() => route.query.eventId as string | undefined)

const { eventStatus, isEventInactive } = useEventStatus()
const { userRole } = useEventContext()

// Data sets
const loading = ref(true)
const loadError = ref('')
const topics = ref<DiscussionTopic[]>([])
const participants = ref<any[]>([])
const roundHistory = ref<any[]>([])
const activeTab = ref('topics')

async function loadAll() {
  if (!eventId.value) return
  loading.value = true
  loadError.value = ''
  try {
    // Event-specific endpoints
    topics.value = await $fetch(`/api/events/${eventId.value}/topics`) as DiscussionTopic[]
    const participantsResp: any = await $fetch(`/api/events/${eventId.value}/participants`)
    participants.value = participantsResp.participants || []
    roundHistory.value = await $fetch(`/api/admin/round-history?eventId=${eventId.value}`)
  } catch (e: any) {
    loadError.value = e?.data?.message || 'Failed to load event data'
  } finally {
    loading.value = false
  }
}

const isOrganizer = computed(() => ['Organizer', 'Admin'].includes(userRole.value || ''))

onMounted(loadAll)

// Derived metrics
const totalVotes = computed(() => topics.value.reduce((s, t: any) => s + (t.totalPreferenceScore || 0), 0))
const totalParticipants = computed(() => participants.value.length)

function formatDate(val?: string) {
  if (!val) return '—'
  try { return new Date(val).toLocaleString() } catch { return val }
}
</script>

<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold mb-1">Event Data Viewer</h1>
        <p class="text-body-2 text-grey-darken-1 mb-0">
          Read-only access to inactive event data. Event ID: <code>{{ eventId }}</code>
        </p>
      </div>
      <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="navigateTo('/past-events')">Back</v-btn>
    </div>

    <v-alert v-if="isEventInactive" type="warning" variant="outlined" class="mb-4">
      This event is inactive and frozen. No changes are allowed.
      <span v-if="eventStatus.statusReason" class="ml-1">({{ eventStatus.statusReason }})</span>
    </v-alert>
    <v-alert v-if="loadError" type="error" class="mb-4" variant="outlined">{{ loadError }}</v-alert>

    <v-skeleton-loader v-if="loading" type="card, table" />

    <template v-else>
      <v-row class="mb-4" dense>
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="pa-3">
            <div class="text-subtitle-2 text-grey">Participants</div>
            <div class="text-h5 font-weight-bold">{{ totalParticipants }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="pa-3">
            <div class="text-subtitle-2 text-grey">Topics</div>
            <div class="text-h5 font-weight-bold">{{ topics.length }}</div>
          </v-card>
        </v-col>
        <v-col cols="12" md="4">
          <v-card variant="outlined" class="pa-3">
            <div class="text-subtitle-2 text-grey">Total Votes</div>
            <div class="text-h5 font-weight-bold">{{ totalVotes }}</div>
          </v-card>
        </v-col>
      </v-row>

      <v-tabs v-model="activeTab" bg-color="transparent" class="mb-4" density="comfortable">
        <v-tab value="topics">Topics</v-tab>
        <v-tab value="participants">Participants</v-tab>
        <v-tab value="rounds">Round History</v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="elevation-0">
        <v-window-item value="topics">
          <v-card variant="outlined">
            <v-data-table :items="topics" :headers="[
              { title: 'Title', value: 'title' },
              { title: 'Description', value: 'description', width: 400 },
              { title: 'Votes', value: 'totalPreferenceScore' },
              { title: 'Created By', value: 'createdBy' }
            ]" density="comfortable" :items-per-page="25">
              <template #item.description="{ item }">
                <span class="text-truncate" style="max-width: 380px" :title="item.description">{{ item.description }}</span>
              </template>
              <template #bottom></template>
            </v-data-table>
          </v-card>
        </v-window-item>

        <v-window-item value="participants">
          <v-card variant="outlined">
            <v-data-table :items="participants" :headers="[
              { title: 'Name', value: 'name' },
              { title: 'Email', value: 'email' },
              { title: 'Role', value: 'role' },
              { title: 'Joined', value: 'joinedAt' },
              { title: 'Last Active', value: 'lastActive' }
            ]" density="comfortable" :items-per-page="25">
              <template #item.joinedAt="{ item }">{{ formatDate(item.joinedAt) }}</template>
              <template #item.lastActive="{ item }">{{ formatDate(item.lastActive) }}</template>
              <template #bottom></template>
            </v-data-table>
          </v-card>
        </v-window-item>

        <v-window-item value="rounds">
          <v-card variant="outlined">
            <v-data-table :items="roundHistory" :headers="[
              { title: '#', value: 'roundNumber' },
              { title: 'Started', value: 'startTime' },
              { title: 'Duration (min)', value: 'duration' },
              { title: 'Topics', value: 'topicsCount' },
              { title: 'Ended', value: 'endTime' }
            ]" :items-length="roundHistory.length" density="comfortable" :items-per-page="25" item-value="roundNumber">
              <template #item.startTime="{ item }">{{ formatDate(item.startTime) }}</template>
              <template #item.endTime="{ item }">{{ formatDate(item.endTime) }}</template>
              <template #item.topicsCount="{ item }">{{ (item.topics || []).length }}</template>
              <template #bottom></template>
              <template #expanded-row="{ columns, item }">
                <td :colspan="columns.length" class="pa-4">
                  <div class="text-subtitle-2 mb-2">Topics in Round {{ item.roundNumber }}</div>
                  <v-chip-group column>
                    <v-chip v-for="t in item.topics" :key="t.topicId" size="small" class="ma-1" variant="outlined">
                      {{ t.topicTitle }}
                    </v-chip>
                  </v-chip-group>
                </td>
              </template>
            </v-data-table>
          </v-card>
        </v-window-item>
      </v-window>
    </template>
  </v-container>
</template>

<style scoped>
.text-truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>

<template>
  <div class="showcase-admin">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h2 class="text-h4 mb-2">Showcase Administration</h2>
        <p class="text-subtitle-1 text-medium-emphasis">
          Manage and moderate project showcases for this event
        </p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-refresh"
        @click="refreshData"
      >
        Refresh
      </v-btn>
    </div>

    <!-- Statistics Cards -->
    <v-row v-if="stats" class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h3 text-primary mb-2">{{ stats.total }}</div>
            <div class="text-subtitle-1">Total Projects</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h3 text-success mb-2">{{ stats.timeline.completedProjects }}</div>
            <div class="text-subtitle-1">Completed</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h3 text-orange mb-2">{{ stats.collaborationStats.projectsSeekingHelp }}</div>
            <div class="text-subtitle-1">Seeking Help</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="text-center">
            <div class="text-h3 text-info mb-2">{{ stats.timeline.projectsThisWeek }}</div>
            <div class="text-subtitle-1">This Week</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Status Distribution Chart -->
    <v-row v-if="stats" class="mb-6">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Project Status Distribution</v-card-title>
          <v-card-text>
            <div class="d-flex flex-column gap-3">
              <div
                v-for="(count, status) in stats.byStatus"
                :key="status"
                class="d-flex justify-space-between align-center"
              >
                <div class="d-flex align-center gap-2">
                  <v-chip
                    :color="getStatusColor(status)"
                    size="small"
                    variant="outlined"
                  >
                    {{ formatStatus(status) }}
                  </v-chip>
                </div>
                <div class="text-h6">{{ count }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Top Skills</v-card-title>
          <v-card-text>
            <div class="d-flex flex-column gap-2">
              <div
                v-for="skill in stats.topSkills.slice(0, 6)"
                :key="skill.skill"
                class="d-flex justify-space-between align-center"
              >
                <span>{{ skill.skill }}</span>
                <v-chip size="small">{{ skill.count }}</v-chip>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Moderation Tools -->
    <v-card class="mb-6">
      <v-card-title>
        <div class="d-flex justify-space-between align-center w-100">
          <span>Moderation Tools</span>
          <div class="d-flex gap-2">
            <v-btn
              v-if="selectedShowcases.length > 0"
              color="success"
              size="small"
              @click="moderateSelected('approve')"
            >
              Approve ({{ selectedShowcases.length }})
            </v-btn>
            <v-btn
              v-if="selectedShowcases.length > 0"
              color="error"
              size="small"
              @click="showModerationDialog = true"
            >
              Actions ({{ selectedShowcases.length }})
            </v-btn>
          </div>
        </div>
      </v-card-title>
      <v-card-text>
        <!-- Search and Filters -->
        <div class="d-flex gap-4 mb-4">
          <v-text-field
            v-model="searchQuery"
            placeholder="Search projects..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            class="flex-grow-1"
          />
          <v-select
            v-model="statusFilter"
            :items="statusOptions"
            placeholder="Filter by status"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            style="min-width: 200px;"
          />
        </div>

        <!-- Showcases Table -->
        <v-data-table
          v-model="selectedShowcases"
          :headers="tableHeaders"
          :items="filteredShowcases"
          :loading="loading"
          show-select
          item-key="id"
          density="compact"
        >
          <template #item.projectName="{ item }">
            <div class="font-weight-medium">{{ item.projectName }}</div>
            <div class="text-caption text-medium-emphasis text-truncate" style="max-width: 300px;">
              {{ item.description }}
            </div>
          </template>

          <template #item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              size="small"
              variant="outlined"
            >
              {{ formatStatus(item.status) }}
            </v-chip>
          </template>

          <template #item.contributors="{ item }">
            <div class="d-flex -space-x-1">
              <v-avatar
                v-for="(contributor, index) in getContributorInfo(item.contributors).slice(0, 3)"
                :key="contributor.id"
                size="24"
                :style="{ zIndex: 10 - index, marginLeft: index > 0 ? '-8px' : '0' }"
              >
                <img v-if="contributor.avatar" :src="contributor.avatar">
                <span v-else class="text-caption">{{ contributor.name?.[0] }}</span>
              </v-avatar>
              <v-chip
                v-if="getContributorInfo(item.contributors).length > 3"
                size="small"
                variant="text"
              >
                +{{ getContributorInfo(item.contributors).length - 3 }}
              </v-chip>
            </div>
          </template>

          <template #item.createdAt="{ item }">
            <div class="text-caption">
              {{ formatDate(item.createdAt) }}
            </div>
          </template>

          <template #item.actions="{ item }">
            <v-menu>
              <template #activator="{ props: menuProps }">
                <v-btn
                  icon="mdi-dots-vertical"
                  variant="text"
                  size="small"
                  v-bind="menuProps"
                />
              </template>
              <v-list density="compact">
                <v-list-item
                  prepend-icon="mdi-eye"
                  title="View Details"
                  @click="viewShowcase(item)"
                />
                <v-list-item
                  prepend-icon="mdi-pencil"
                  title="Edit"
                  @click="editShowcase(item)"
                />
                <v-divider />
                <v-list-item
                  prepend-icon="mdi-delete"
                  title="Delete"
                  base-color="error"
                  @click="deleteShowcase(item)"
                />
              </v-list>
            </v-menu>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

    <!-- Moderation Dialog -->
    <v-dialog
      v-model="showModerationDialog"
      max-width="500px"
    >
      <v-card>
        <v-card-title>Moderate Selected Projects</v-card-title>
        <v-card-text>
          <p class="mb-4">
            You have selected {{ selectedShowcases.length }} project(s) for moderation.
          </p>

          <v-select
            v-model="moderationAction"
            :items="moderationActions"
            label="Action"
            variant="outlined"
            class="mb-4"
          />

          <v-textarea
            v-model="moderationReason"
            label="Reason (optional)"
            placeholder="Provide a reason for this moderation action..."
            variant="outlined"
            rows="3"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="outlined"
            @click="showModerationDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="moderating"
            @click="performModeration"
          >
            Apply Action
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbars -->
    <v-snackbar
      v-model="showSuccess"
      color="success"
      timeout="3000"
    >
      {{ successMessage }}
    </v-snackbar>

    <v-snackbar
      v-model="showError"
      color="error"
      timeout="5000"
    >
      {{ errorMessage }}
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Props {
  eventId: string
}

const props = defineProps<Props>()

// State
const showcases = ref([])
const stats = ref(null)
const eventParticipants = ref([])
const loading = ref(true)
const moderating = ref(false)
const selectedShowcases = ref([])
const searchQuery = ref('')
const statusFilter = ref(null)
const showModerationDialog = ref(false)
const moderationAction = ref('')
const moderationReason = ref('')
const showSuccess = ref(false)
const showError = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Table configuration
const tableHeaders = [
  { title: 'Project', key: 'projectName', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Contributors', key: 'contributors', sortable: false },
  { title: 'Created', key: 'createdAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

const statusOptions = [
  { title: 'Idea Stage', value: 'IDEATION' },
  { title: 'In Progress', value: 'ACTIVE' },
  { title: 'Looking for Help', value: 'SEEKING_COLLABORATORS' },
  { title: 'Completed', value: 'COMPLETED' }
]

const moderationActions = [
  { title: 'Delete Projects', value: 'delete' },
  { title: 'Hide Projects', value: 'hide' },
  { title: 'Feature Projects', value: 'feature' }
]

// Computed properties
const filteredShowcases = computed(() => {
  let result = showcases.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter((showcase: any) =>
      showcase.projectName.toLowerCase().includes(query) ||
      showcase.description.toLowerCase().includes(query)
    )
  }

  if (statusFilter.value) {
    result = result.filter((showcase: any) => showcase.status === statusFilter.value)
  }

  return result
})

// Methods
const loadData = async () => {
  loading.value = true
  try {
    const [showcasesResponse, statsResponse, participantsResponse] = await Promise.all([
      $fetch(`/api/events/${props.eventId}/showcases`),
      $fetch(`/api/admin/events/${props.eventId}/showcases/stats`),
      $fetch(`/api/events/${props.eventId}/participants`)
    ])

    showcases.value = showcasesResponse.showcases || []
    stats.value = statsResponse.stats
    eventParticipants.value = participantsResponse.participants || []
  } catch (error) {
    console.error('Error loading admin data:', error)
    errorMessage.value = 'Failed to load showcase data. Please try again.'
    showError.value = true
  } finally {
    loading.value = false
  }
}

const refreshData = async () => {
  await loadData()
  successMessage.value = 'Data refreshed successfully'
  showSuccess.value = true
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'IDEATION': return 'orange'
    case 'ACTIVE': return 'blue'
    case 'COMPLETED': return 'success'
    case 'SEEKING_COLLABORATORS': return 'purple'
    default: return 'grey'
  }
}

const formatStatus = (status: string) => {
  switch (status) {
    case 'IDEATION': return 'Idea Stage'
    case 'ACTIVE': return 'In Progress'
    case 'COMPLETED': return 'Completed'
    case 'SEEKING_COLLABORATORS': return 'Looking for Help'
    default: return status
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString()
}

const getContributorInfo = (contributorIds: string[]) => {
  if (!contributorIds || contributorIds.length === 0) return []
  return contributorIds
    .map(id => eventParticipants.value.find((p: any) => p.id === id))
    .filter(Boolean)
}

const moderateSelected = async (action: string) => {
  moderationAction.value = action
  await performModeration()
}

const performModeration = async () => {
  if (selectedShowcases.value.length === 0) return

  moderating.value = true
  try {
    const response = await $fetch(`/api/admin/events/${props.eventId}/showcases/moderate`, {
      method: 'POST',
      body: {
        showcaseIds: selectedShowcases.value.map((s: any) => s.id),
        action: moderationAction.value,
        reason: moderationReason.value
      }
    })

    if (response.success) {
      successMessage.value = response.message
      showSuccess.value = true
      showModerationDialog.value = false
      selectedShowcases.value = []
      moderationReason.value = ''
      await loadData() // Refresh data
    }
  } catch (error: any) {
    console.error('Error performing moderation:', error)
    errorMessage.value = error.data?.message || 'Failed to perform moderation action'
    showError.value = true
  } finally {
    moderating.value = false
  }
}

const viewShowcase = (showcase: any) => {
  // Implement view logic
  console.log('View showcase:', showcase)
}

const editShowcase = (showcase: any) => {
  // Implement edit logic
  console.log('Edit showcase:', showcase)
}

const deleteShowcase = async (showcase: any) => {
  selectedShowcases.value = [showcase]
  moderationAction.value = 'delete'
  await performModeration()
}

// Initialize
onMounted(loadData)
</script>

<style scoped>
.showcase-admin {
  max-width: 1200px;
  margin: 0 auto;
}

.text-truncate {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
<template>
  <div class="work-showcase-manager">
    <!-- Header with Actions -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h2 class="text-h4 mb-2">Project Showcase</h2>
        <p class="text-subtitle-1 text-medium-emphasis">
          Discover projects, share your work, and find collaboration opportunities
        </p>
      </div>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showCreateForm = true"
      >
        Create Project
      </v-btn>
    </div>

    <!-- Search and Filters -->
    <v-card class="mb-6" elevation="1">
      <v-card-text>
        <div class="d-flex flex-column flex-md-row gap-4">
          <!-- Search -->
          <v-text-field
            v-model="filters.search"
            placeholder="Search projects..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            class="flex-grow-1"
            clearable
          />

          <!-- Status Filter -->
          <v-select
            v-model="filters.status"
            :items="statusOptions"
            placeholder="Filter by status"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            style="min-width: 200px;"
          />

          <!-- Skills Filter -->
          <v-combobox
            v-model="filters.skills"
            :items="allSkills"
            placeholder="Filter by skills"
            variant="outlined"
            density="compact"
            multiple
            chips
            hide-details
            clearable
            style="min-width: 250px;"
          >
            <template #chip="{ props, item }">
              <v-chip v-bind="props" size="small" :text="item.raw" />
            </template>
          </v-combobox>
        </div>

        <!-- Quick Filter Buttons -->
        <div class="d-flex gap-2 mt-4 flex-wrap">
          <v-chip
            :color="filters.status === 'SEEKING_COLLABORATORS' ? 'primary' : 'default'"
            :variant="filters.status === 'SEEKING_COLLABORATORS' ? 'elevated' : 'outlined'"
            size="small"
            clickable
            @click="toggleStatusFilter('SEEKING_COLLABORATORS')"
          >
            <v-icon start>mdi-account-search</v-icon>
            Looking for Help
          </v-chip>

          <v-chip
            :color="filters.status === 'ACTIVE' ? 'primary' : 'default'"
            :variant="filters.status === 'ACTIVE' ? 'elevated' : 'outlined'"
            size="small"
            clickable
            @click="toggleStatusFilter('ACTIVE')"
          >
            <v-icon start>mdi-play-circle</v-icon>
            Active Projects
          </v-chip>

          <v-chip
            :color="filters.status === 'COMPLETED' ? 'primary' : 'default'"
            :variant="filters.status === 'COMPLETED' ? 'elevated' : 'outlined'"
            size="small"
            clickable
            @click="toggleStatusFilter('COMPLETED')"
          >
            <v-icon start>mdi-check-circle</v-icon>
            Completed
          </v-chip>
        </div>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate size="64" />
      <p class="mt-4 text-medium-emphasis">Loading projects...</p>
    </div>

    <!-- Empty State -->
    <v-card v-else-if="filteredShowcases.length === 0" class="text-center py-8">
      <v-card-text>
        <v-icon size="64" color="medium-emphasis" class="mb-4">mdi-folder-open-outline</v-icon>
        <h3 class="text-h6 mb-2">No projects found</h3>
        <p class="text-medium-emphasis mb-4">
          {{ hasFilters ? 'Try adjusting your search criteria.' : 'Be the first to showcase a project!' }}
        </p>
        <v-btn
          v-if="!hasFilters"
          color="primary"
          prepend-icon="mdi-plus"
          @click="showCreateForm = true"
        >
          Create First Project
        </v-btn>
        <v-btn
          v-else
          variant="outlined"
          @click="clearFilters"
        >
          Clear Filters
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Showcases Grid -->
    <div v-else class="showcase-grid">
      <WorkShowcase
        v-for="showcase in filteredShowcases"
        :key="showcase.id"
        :showcase="showcase"
        :participants="eventParticipants"
        class="showcase-item"
        @join-project="handleJoinProject"
        @edit-project="handleEditProject"
        @delete-project="handleDeleteProject"
      />
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="d-flex justify-center mt-6">
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        :total-visible="7"
      />
    </div>

    <!-- Create/Edit Form Dialog -->
    <v-dialog
      v-model="showCreateForm"
      max-width="900px"
      persistent
      scrollable
    >
      <WorkShowcaseForm
        :event-id="eventId"
        :showcase="editingShowcase"
        :available-participants="eventParticipants"
        @success="handleFormSuccess"
        @cancel="closeForm"
      />
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="showDeleteConfirm"
      max-width="500px"
    >
      <v-card>
        <v-card-title>
          <h3>Delete Project</h3>
        </v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete <strong>{{ deletingShowcase?.projectName }}</strong>?</p>
          <p class="text-caption text-error mt-2">This action cannot be undone.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="outlined"
            @click="showDeleteConfirm = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="showSuccess"
      color="success"
      timeout="3000"
    >
      {{ successMessage }}
    </v-snackbar>

    <!-- Error Snackbar -->
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
import { ref, computed, watch, onMounted } from 'vue'
import { useDebounceFn } from '@vueuse/core'

interface Props {
  eventId: string
}

const props = defineProps<Props>()

// State
const showcases = ref([])
const eventParticipants = ref([])
const loading = ref(true)
const deleting = ref(false)
const showCreateForm = ref(false)
const showDeleteConfirm = ref(false)
const showSuccess = ref(false)
const showError = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const editingShowcase = ref(null)
const deletingShowcase = ref(null)
const currentPage = ref(1)
const itemsPerPage = 12

// Filters
const filters = ref({
  search: '',
  status: null,
  skills: [],
  tags: []
})

// Status options for filter
const statusOptions = [
  { title: 'Idea Stage', value: 'IDEATION' },
  { title: 'In Progress', value: 'ACTIVE' },
  { title: 'Looking for Help', value: 'SEEKING_COLLABORATORS' },
  { title: 'Completed', value: 'COMPLETED' }
]

// Computed properties
const hasFilters = computed(() =>
  filters.value.search ||
  filters.value.status ||
  filters.value.skills.length > 0 ||
  filters.value.tags.length > 0
)

const allSkills = computed(() => {
  const skills = new Set()
  showcases.value.forEach((showcase: any) => {
    if (showcase.skillsUsed) {
      showcase.skillsUsed.forEach((skill: string) => skills.add(skill))
    }
    if (showcase.skillsNeeded) {
      showcase.skillsNeeded.forEach((skill: string) => skills.add(skill))
    }
  })
  return Array.from(skills)
})

const filteredShowcases = computed(() => {
  let result = showcases.value

  // Text search
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter((showcase: any) =>
      showcase.projectName.toLowerCase().includes(search) ||
      showcase.description.toLowerCase().includes(search)
    )
  }

  // Status filter
  if (filters.value.status) {
    result = result.filter((showcase: any) => showcase.status === filters.value.status)
  }

  // Skills filter
  if (filters.value.skills.length > 0) {
    result = result.filter((showcase: any) => {
      const showcaseSkills = [...(showcase.skillsUsed || []), ...(showcase.skillsNeeded || [])]
      return filters.value.skills.some((skill: string) =>
        showcaseSkills.some((s: string) => s.toLowerCase().includes(skill.toLowerCase()))
      )
    })
  }

  // Pagination
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return result.slice(start, end)
})

const totalPages = computed(() =>
  Math.ceil(showcases.value.length / itemsPerPage)
)

// Methods
const loadShowcases = async () => {
  loading.value = true
  try {
    const response = await $fetch(`/api/events/${props.eventId}/showcases`)
    showcases.value = response.showcases || []
  } catch (error) {
    console.error('Error loading showcases:', error)
    errorMessage.value = 'Failed to load projects. Please try again.'
    showError.value = true
  } finally {
    loading.value = false
  }
}

const loadEventParticipants = async () => {
  try {
    const response = await $fetch(`/api/events/${props.eventId}/participants`)
    eventParticipants.value = response.participants || []
  } catch (error) {
    console.error('Error loading participants:', error)
  }
}

const toggleStatusFilter = (status: string) => {
  filters.value.status = filters.value.status === status ? null : status
  currentPage.value = 1
}

const clearFilters = () => {
  filters.value = {
    search: '',
    status: null,
    skills: [],
    tags: []
  }
  currentPage.value = 1
}

const handleJoinProject = async (showcaseId: string) => {
  try {
    const response = await $fetch(`/api/events/${props.eventId}/showcases/${showcaseId}/join`, {
      method: 'POST'
    })

    if (response.success) {
      successMessage.value = response.message
      showSuccess.value = true
      await loadShowcases() // Refresh the list
    }
  } catch (error: any) {
    console.error('Error joining project:', error)
    errorMessage.value = error.data?.message || 'Failed to join project. Please try again.'
    showError.value = true
  }
}

const handleEditProject = (showcase: any) => {
  editingShowcase.value = showcase
  showCreateForm.value = true
}

const handleDeleteProject = (showcase: any) => {
  deletingShowcase.value = showcase
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  if (!deletingShowcase.value) return

  deleting.value = true
  try {
    await $fetch(`/api/events/${props.eventId}/showcases/${deletingShowcase.value.id}`, {
      method: 'DELETE'
    })

    successMessage.value = 'Project deleted successfully'
    showSuccess.value = true
    showDeleteConfirm.value = false
    await loadShowcases()
  } catch (error: any) {
    console.error('Error deleting showcase:', error)
    errorMessage.value = error.data?.message || 'Failed to delete project. Please try again.'
    showError.value = true
  } finally {
    deleting.value = false
    deletingShowcase.value = null
  }
}

const handleFormSuccess = async (showcase: any) => {
  const action = editingShowcase.value ? 'updated' : 'created'
  successMessage.value = `Project ${action} successfully!`
  showSuccess.value = true
  closeForm()
  await loadShowcases()
}

const closeForm = () => {
  showCreateForm.value = false
  editingShowcase.value = null
}

// Debounced search
const debouncedSearch = useDebounceFn(() => {
  currentPage.value = 1
}, 300)

// Watchers
watch(() => filters.value.search, debouncedSearch)
watch(() => [filters.value.status, filters.value.skills], () => {
  currentPage.value = 1
}, { deep: true })

// Initialize
onMounted(async () => {
  await Promise.all([
    loadShowcases(),
    loadEventParticipants()
  ])
})
</script>

<style scoped>
.showcase-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.showcase-item {
  height: 100%;
}

@media (max-width: 960px) {
  .showcase-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .showcase-grid {
    gap: 16px;
  }
}
</style>
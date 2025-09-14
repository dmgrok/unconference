<template>
  <v-card class="work-showcase" elevation="3">
    <!-- Project Header -->
    <v-card-title class="pb-2">
      <div class="d-flex align-center w-100">
        <div class="flex-grow-1">
          <h3>{{ showcase.projectName }}</h3>
          <div class="text-subtitle-2 text-medium-emphasis">
            {{ showcase.contributors.length }} contributor{{ showcase.contributors.length !== 1 ? 's' : '' }}
          </div>
        </div>
        <v-chip 
          :color="getStatusColor(showcase.status)" 
          variant="outlined"
          size="small"
        >
          {{ formatStatus(showcase.status) }}
        </v-chip>
      </div>
    </v-card-title>

    <!-- Project Images -->
    <div v-if="showcase.images?.length > 0" class="mb-3">
      <v-carousel
        v-if="showcase.images.length > 1"
        height="200"
        hide-delimiter-background
        hide-delimiters
        show-arrows="hover"
      >
        <v-carousel-item
          v-for="(image, index) in showcase.images"
          :key="index"
          :src="image"
          cover
        ></v-carousel-item>
      </v-carousel>
      <v-img
        v-else
        :src="showcase.images[0]"
        height="200"
        cover
        class="mx-4"
      ></v-img>
    </div>

    <v-card-text>
      <!-- Description -->
      <p class="mb-4">{{ showcase.description }}</p>

      <!-- Contributors -->
      <div class="mb-4">
        <h4 class="text-subtitle-1 mb-2">Team</h4>
        <div class="d-flex align-center gap-2 flex-wrap">
          <v-chip
            v-for="contributor in contributorNames"
            :key="contributor.id"
            size="small"
            prepend-avatar
          >
            <template #prepend>
              <v-avatar>
                <img v-if="contributor.avatar" :src="contributor.avatar">
                <v-icon v-else>mdi-account</v-icon>
              </v-avatar>
            </template>
            {{ contributor.name }}
          </v-chip>
        </div>
      </div>

      <!-- Skills Used & Needed -->
      <div class="row mb-4">
        <div class="col-md-6">
          <h4 class="text-subtitle-1 mb-2">Skills Used</h4>
          <div class="d-flex flex-wrap gap-1">
            <v-chip
              v-for="skill in showcase.skillsUsed"
              :key="skill"
              size="small"
              color="success"
              variant="outlined"
            >
              {{ skill }}
            </v-chip>
            <div v-if="!showcase.skillsUsed?.length" class="text-medium-emphasis">
              None specified
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <h4 class="text-subtitle-1 mb-2">
            <v-icon color="orange" size="small" class="mr-1">mdi-account-search</v-icon>
            Skills Needed
          </h4>
          <div class="d-flex flex-wrap gap-1">
            <v-chip
              v-for="skill in showcase.skillsNeeded"
              :key="skill"
              size="small"
              color="orange"
              variant="outlined"
            >
              {{ skill }}
            </v-chip>
            <div v-if="!showcase.skillsNeeded?.length" class="text-medium-emphasis">
              None needed
            </div>
          </div>
        </div>
      </div>

      <!-- Tags -->
      <div v-if="showcase.tags?.length > 0" class="mb-4">
        <h4 class="text-subtitle-1 mb-2">Tags</h4>
        <div class="d-flex flex-wrap gap-1">
          <v-chip
            v-for="tag in showcase.tags"
            :key="tag"
            size="small"
            color="primary"
            variant="text"
          >
            #{{ tag }}
          </v-chip>
        </div>
      </div>

      <!-- Links -->
      <div class="d-flex gap-2 flex-wrap">
        <v-btn
          v-if="showcase.demoUrl"
          :href="showcase.demoUrl"
          target="_blank"
          color="primary"
          prepend-icon="mdi-open-in-new"
          size="small"
        >
          View Demo
        </v-btn>
        <v-btn
          v-if="showcase.repositoryUrl"
          :href="showcase.repositoryUrl"
          target="_blank"
          color="grey-darken-2"
          prepend-icon="mdi-github"
          size="small"
        >
          Source Code
        </v-btn>
      </div>
    </v-card-text>

    <!-- Action Footer -->
    <v-card-actions class="pt-0">
      <v-btn
        v-if="showcase.status === 'SEEKING_COLLABORATORS'"
        color="success"
        prepend-icon="mdi-account-plus"
        @click="joinProject"
      >
        Join Project
      </v-btn>
      <v-btn
        v-if="showcase.contactEmail"
        :href="`mailto:${showcase.contactEmail}`"
        color="primary"
        variant="outlined"
        prepend-icon="mdi-email"
      >
        Contact Team
      </v-btn>
      <v-spacer></v-spacer>

      <!-- Action Menu -->
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
            prepend-icon="mdi-pencil"
            title="Edit Project"
            @click="editProject"
          />
          <v-list-item
            prepend-icon="mdi-delete"
            title="Delete Project"
            base-color="error"
            @click="deleteProject"
          />
        </v-list>
      </v-menu>

      <div class="text-caption text-medium-emphasis ml-2">
        Created {{ formatDate(showcase.createdAt) }}
      </div>
    </v-card-actions>

    <!-- Achievement Overlay -->
    <div
      v-if="showcase.status === 'COMPLETED'"
      class="achievement-overlay"
    >
      <v-icon color="success" size="48">mdi-check-circle</v-icon>
      <div class="text-h6 text-success">Project Complete!</div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  showcase: {
    id: string
    projectName: string
    description: string
    contributors: string[]
    skillsUsed: string[]
    skillsNeeded: string[]
    status: 'IDEATION' | 'ACTIVE' | 'COMPLETED' | 'SEEKING_COLLABORATORS'
    contactEmail?: string
    repositoryUrl?: string
    demoUrl?: string
    images?: string[]
    tags?: string[]
    createdAt: string | Date
  }
  participants?: Array<{ id: string; name: string; avatar?: string }>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  joinProject: [showcaseId: string]
  contactTeam: [showcaseId: string]
  editProject: [showcase: any]
  deleteProject: [showcase: any]
}>()

// Computed
const contributorNames = computed(() => {
  if (!props.participants) return []
  return props.showcase.contributors
    .map(id => props.participants?.find(p => p.id === id))
    .filter(Boolean)
})

// Methods
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

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString()
}

const joinProject = () => {
  emit('joinProject', props.showcase.id)
}

const contactTeam = () => {
  emit('contactTeam', props.showcase.id)
}

const editProject = () => {
  emit('editProject', props.showcase)
}

const deleteProject = () => {
  emit('deleteProject', props.showcase)
}
</script>

<style scoped>
.work-showcase {
  position: relative;
  height: 100%;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.work-showcase:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.achievement-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  background: rgba(255,255,255,0.95);
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

@media (max-width: 768px) {
  .row {
    flex-direction: column;
  }
  
  .col-md-6 {
    width: 100%;
    margin-bottom: 1rem;
  }
}
</style>

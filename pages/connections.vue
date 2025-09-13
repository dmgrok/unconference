<template>
  <div class="connections-page">
    <!-- Hero Section -->
    <v-container class="py-8">
      <div class="text-center mb-8">
        <h1 class="text-h3 font-weight-bold mb-4">
          Event Connections & Collaborations
        </h1>
        <p class="text-h6 text-medium-emphasis max-width-600 mx-auto">
          Transform your event participation into lasting relationships and meaningful work
        </p>
      </div>

      <!-- Stats Overview -->
      <v-row v-if="stats" class="mb-8">
        <v-col cols="12" md="3">
          <v-card color="primary" variant="flat">
            <v-card-text class="text-center">
              <v-icon size="48" color="white" class="mb-2">mdi-account-group</v-icon>
              <div class="text-h4 text-white font-weight-bold">{{ stats.totalConnections }}</div>
              <div class="text-white">New Connections</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card color="success" variant="flat">
            <v-card-text class="text-center">
              <v-icon size="48" color="white" class="mb-2">mdi-handshake</v-icon>
              <div class="text-h4 text-white font-weight-bold">{{ activeCollaborations.length }}</div>
              <div class="text-white">Active Projects</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card color="orange" variant="flat">
            <v-card-text class="text-center">
              <v-icon size="48" color="white" class="mb-2">mdi-lightbulb</v-icon>
              <div class="text-h4 text-white font-weight-bold">{{ suggestions.length }}</div>
              <div class="text-white">Suggested Connections</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card color="purple" variant="flat">
            <v-card-text class="text-center">
              <v-icon size="48" color="white" class="mb-2">mdi-rocket</v-icon>
              <div class="text-h4 text-white font-weight-bold">{{ workShowcases.length }}</div>
              <div class="text-white">Projects Launched</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Main Content Tabs -->
      <v-tabs v-model="activeTab" class="mb-4">
        <v-tab value="overview">Overview</v-tab>
        <v-tab value="connections">My Connections</v-tab>
        <v-tab value="collaborations">Active Projects</v-tab>
        <v-tab value="showcases">Work Gallery</v-tab>
        <v-tab value="suggestions">Meet People</v-tab>
      </v-tabs>

      <!-- Tab Content -->
      <v-window v-model="activeTab">
        <!-- Overview Tab -->
        <v-window-item value="overview">
          <div class="overview-content">
            <!-- Connection Tracker Component -->
            <ConnectionTracker 
              v-if="currentEventId"
              :event-id="currentEventId"
            />

            <!-- Recent Activity Feed -->
            <v-card class="mt-6" elevation="2">
              <v-card-title>
                <v-icon color="blue" class="mr-2">mdi-timeline</v-icon>
                Recent Activity
              </v-card-title>
              <v-card-text>
                <v-timeline density="compact">
                  <v-timeline-item
                    v-for="activity in recentActivity"
                    :key="activity.id"
                    :icon="getActivityIcon(activity.type)"
                    :color="getActivityColor(activity.type)"
                    size="small"
                  >
                    <div class="d-flex justify-space-between">
                      <div>
                        <div class="font-weight-medium">{{ activity.title }}</div>
                        <div class="text-caption text-medium-emphasis">{{ activity.description }}</div>
                      </div>
                      <div class="text-caption">{{ formatTime(activity.timestamp) }}</div>
                    </div>
                  </v-timeline-item>
                </v-timeline>
              </v-card-text>
            </v-card>
          </div>
        </v-window-item>

        <!-- Connections Tab -->
        <v-window-item value="connections">
          <div class="connections-grid">
            <v-row>
              <v-col
                v-for="connection in connections"
                :key="connection.connectionId"
                cols="12" sm="6" lg="4"
              >
                <v-card elevation="2" class="connection-card h-100">
                  <v-card-text>
                    <div class="d-flex align-center mb-3">
                      <v-avatar size="48" class="mr-3">
                        <img v-if="connection.otherPerson?.avatar" :src="connection.otherPerson.avatar">
                        <v-icon v-else>mdi-account</v-icon>
                      </v-avatar>
                      <div class="flex-grow-1">
                        <div class="font-weight-bold">{{ connection.otherPerson?.name }}</div>
                        <div class="text-caption text-medium-emphasis">
                          Connection strength: {{ connection.connectionStrength }}/5
                        </div>
                      </div>
                      <v-btn
                        icon="mdi-message"
                        size="small"
                        variant="text"
                        @click="contactPerson(connection)"
                      ></v-btn>
                    </div>

                    <div v-if="connection.sharedTopics.length" class="mb-2">
                      <div class="text-caption font-weight-medium mb-1">Shared interests:</div>
                      <div class="d-flex flex-wrap gap-1">
                        <v-chip
                          v-for="topic in connection.sharedTopics.slice(0, 3)"
                          :key="topic"
                          size="x-small"
                          color="primary"
                        >
                          {{ topic }}
                        </v-chip>
                      </div>
                    </div>

                    <div v-if="connection.collaboratedOn.length" class="mb-2">
                      <div class="text-caption font-weight-medium">Worked together on:</div>
                      <div class="text-caption">{{ connection.collaboratedOn.join(', ') }}</div>
                    </div>

                    <v-btn
                      v-if="!connection.contactExchanged"
                      color="success"
                      size="small"
                      variant="outlined"
                      @click="exchangeContact(connection)"
                    >
                      Exchange Contact
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-window-item>

        <!-- Collaborations Tab -->
        <v-window-item value="collaborations">
          <div class="collaborations-section">
            <div class="d-flex justify-space-between align-center mb-4">
              <h2 class="text-h5">Active Collaborations</h2>
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="createNewCollaboration"
              >
                Start New Project
              </v-btn>
            </div>

            <v-row>
              <v-col
                v-for="collab in activeCollaborations"
                :key="collab.id"
                cols="12" lg="6"
              >
                <CollaborationWorkspace :workspace-id="collab.id" />
              </v-col>
            </v-row>
          </div>
        </v-window-item>

        <!-- Work Showcases Tab -->
        <v-window-item value="showcases">
          <div class="showcases-section">
            <div class="d-flex justify-space-between align-center mb-4">
              <h2 class="text-h5">Project Gallery</h2>
              <v-btn
                color="purple"
                prepend-icon="mdi-rocket"
                @click="createNewShowcase"
              >
                Share Your Work
              </v-btn>
            </div>

            <v-row>
              <v-col
                v-for="showcase in workShowcases"
                :key="showcase.id"
                cols="12" md="6" lg="4"
              >
                <WorkShowcase 
                  :showcase="showcase"
                  @join-project="joinProject"
                  @contact-team="contactTeam"
                />
              </v-col>
            </v-row>
          </div>
        </v-window-item>

        <!-- Suggestions Tab -->
        <v-window-item value="suggestions">
          <div class="suggestions-section">
            <h2 class="text-h5 mb-4">People You Should Meet</h2>
            
            <v-row>
              <v-col
                v-for="suggestion in suggestions"
                :key="suggestion.person?.id"
                cols="12" sm="6" md="4"
              >
                <v-card elevation="2" hover>
                  <v-card-text>
                    <div class="d-flex align-center mb-3">
                      <v-avatar size="40" class="mr-3">
                        <img v-if="suggestion.person?.avatar" :src="suggestion.person.avatar">
                        <v-icon v-else>mdi-account</v-icon>
                      </v-avatar>
                      <div>
                        <div class="font-weight-medium">{{ suggestion.person?.name }}</div>
                        <div class="text-caption text-medium-emphasis">{{ suggestion.matchType }}</div>
                      </div>
                    </div>
                    
                    <div class="text-caption mb-2">
                      <strong>Common interests:</strong> {{ suggestion.commonInterests.join(', ') }}
                    </div>
                    
                    <div class="text-caption mb-3">{{ suggestion.reason }}</div>
                    
                    <v-btn
                      color="orange"
                      size="small"
                      variant="outlined"
                      @click="requestIntroduction(suggestion)"
                    >
                      Request Introduction
                    </v-btn>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </v-window-item>
      </v-window>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// Define page meta
definePageMeta({
  title: 'Event Connections',
  requiresAuth: true
})

// Reactive data
const activeTab = ref('overview')
const loading = ref(false)
const connectionsData = ref<any>(null)

// Mock data for demonstration
const recentActivity = ref([
  {
    id: 1,
    type: 'connection',
    title: 'New connection made',
    description: 'Connected with Sarah from the AI discussion',
    timestamp: new Date()
  },
  {
    id: 2,
    type: 'collaboration',
    title: 'Collaboration started',
    description: 'Began working on "Sustainable Tech Initiative"',
    timestamp: new Date(Date.now() - 3600000)
  },
  {
    id: 3,
    type: 'showcase',
    title: 'Project showcased',
    description: 'Published your climate app project',
    timestamp: new Date(Date.now() - 7200000)
  }
])

// Get context and connections
const { currentEventId } = useEventContext()
const { 
  getConnectionsOverview,
  requestIntroduction: requestIntro,
  createCollaboration,
  createShowcase
} = useConnections()

// Computed
const stats = computed(() => connectionsData.value?.stats)
const connections = computed(() => connectionsData.value?.connections || [])
const suggestions = computed(() => connectionsData.value?.suggestions || [])
const activeCollaborations = computed(() => connectionsData.value?.collaborations || [])
const workShowcases = ref([]) // Would be loaded from API

// Methods
const loadData = async () => {
  loading.value = true
  try {
    connectionsData.value = await getConnectionsOverview()
  } catch (error) {
    console.error('Failed to load connections data:', error)
  } finally {
    loading.value = false
  }
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'connection': return 'mdi-account-plus'
    case 'collaboration': return 'mdi-handshake'
    case 'showcase': return 'mdi-rocket'
    default: return 'mdi-circle'
  }
}

const getActivityColor = (type: string) => {
  switch (type) {
    case 'connection': return 'blue'
    case 'collaboration': return 'green'
    case 'showcase': return 'purple'
    default: return 'grey'
  }
}

const formatTime = (timestamp: Date) => {
  const now = new Date()
  const diff = now.getTime() - timestamp.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return 'Just now'
  if (hours === 1) return '1 hour ago'
  return `${hours} hours ago`
}

const contactPerson = (connection: any) => {
  console.log('Contacting person:', connection.otherPerson?.name)
}

const exchangeContact = async (connection: any) => {
  console.log('Exchanging contact with:', connection.otherPerson?.name)
  // Implementation would update the connection to mark contact as exchanged
}

const requestIntroduction = async (suggestion: any) => {
  try {
    await requestIntro({
      targetPersonId: suggestion.person.id,
      reason: suggestion.reason,
      commonInterests: suggestion.commonInterests
    })
    console.log('Introduction requested successfully')
  } catch (error) {
    console.error('Failed to request introduction:', error)
  }
}

const createNewCollaboration = () => {
  console.log('Creating new collaboration')
  // Implementation would open a dialog to create new collaboration
}

const createNewShowcase = () => {
  console.log('Creating new showcase')
  // Implementation would open a dialog to create new work showcase
}

const joinProject = (showcaseId: string) => {
  console.log('Joining project:', showcaseId)
}

const contactTeam = (showcaseId: string) => {
  console.log('Contacting team for project:', showcaseId)
}

onMounted(() => {
  if (currentEventId.value) {
    loadData()
  }
})
</script>

<style scoped>
.connections-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.max-width-600 {
  max-width: 600px;
}

.connection-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.connection-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.15);
}

.overview-content,
.connections-grid,
.collaborations-section,
.showcases-section,
.suggestions-section {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

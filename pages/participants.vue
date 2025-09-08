<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { User } from '~/types/user'
import type { DiscussionTopic, ActiveRound } from '~/types/topic'

definePageMeta({
  middleware: 'authenticated'
})

const { user } = useUserSession()
const { eventStatus, isEventActive, isEventInactive } = useEventStatus()

// State
const loading = ref(true)
const searchQuery = ref('')
const currentTab = ref('directory')
const filterRole = ref('all')
const filterStatus = ref('all')

// Data
const participants = ref<User[]>([])
const topics = ref<DiscussionTopic[]>([])
const activeRound = ref<ActiveRound | null>(null)
const userInterests = ref<Record<string, string[]>>({}) // user email -> topic interests
const userConnections = ref<Record<string, string[]>>({}) // user email -> connected users

// Check if current user is admin/organizer
const isAdmin = computed(() => {
  const userRole = (user.value as any)?.Role || (user.value as any)?.role
  return ['Admin', 'Organizer'].includes(userRole)
})

// Filter and search participants
const filteredParticipants = computed(() => {
  let filtered = participants.value

  // Role filter
  if (filterRole.value !== 'all') {
    filtered = filtered.filter(p => {
      const role = (p as any).Role || (p as any).role || 'User'
      return role === filterRole.value
    })
  }

  // Status filter
  if (filterStatus.value !== 'all') {
    filtered = filtered.filter(p => {
      if (filterStatus.value === 'active') {
        // User has voted or submitted topics
        const hasVoted = topics.value.some(t => 
          t.firstChoiceVoters?.includes(p.email) || 
          t.secondChoiceVoters?.includes(p.email)
        )
        const hasSubmitted = topics.value.some(t => t.createdBy === p.email)
        return hasVoted || hasSubmitted
      } else if (filterStatus.value === 'inactive') {
        const hasVoted = topics.value.some(t => 
          t.firstChoiceVoters?.includes(p.email) || 
          t.secondChoiceVoters?.includes(p.email)
        )
        const hasSubmitted = topics.value.some(t => t.createdBy === p.email)
        return !hasVoted && !hasSubmitted
      }
      return true
    })
  }

  // Search filter
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => {
      const name = getDisplayName(p).toLowerCase()
      const email = p.email.toLowerCase()
      return name.includes(query) || email.includes(query)
    })
  }

  return filtered.sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)))
})

// Participant statistics
const participantStats = computed(() => {
  const total = participants.value.length
  const active = participants.value.filter(p => {
    const hasVoted = topics.value.some(t => 
      t.firstChoiceVoters?.includes(p.email) || 
      t.secondChoiceVoters?.includes(p.email)
    )
    const hasSubmitted = topics.value.some(t => t.createdBy === p.email)
    return hasVoted || hasSubmitted
  }).length
  
  const admins = participants.value.filter(p => {
    const role = (p as any).Role || (p as any).role
    return ['Admin', 'Organizer'].includes(role)
  }).length

  const withTopics = participants.value.filter(p => 
    topics.value.some(t => t.createdBy === p.email)
  ).length

  return { total, active, inactive: total - active, admins, withTopics }
})

// Connection network data
const connectionNetwork = computed(() => {
  const connections = []
  
  // Create connections based on shared topic interests
  for (const [userEmail, interests] of Object.entries(userInterests.value)) {
    for (const [otherEmail, otherInterests] of Object.entries(userInterests.value)) {
      if (userEmail !== otherEmail) {
        const sharedInterests = interests.filter(interest => otherInterests.includes(interest))
        if (sharedInterests.length > 0) {
          connections.push({
            from: userEmail,
            to: otherEmail,
            strength: sharedInterests.length,
            topics: sharedInterests
          })
        }
      }
    }
  }
  
  return connections
})

// Methods
function getDisplayName(participant: User) {
  if (participant.name) return participant.name
  if (participant.email.includes('@unconference.guest')) {
    return `Guest ${participant.email.split('_')[1]?.substring(0, 6).toUpperCase() || 'User'}`
  }
  return participant.email.split('@')[0] || participant.email
}

function getParticipantRole(participant: User) {
  const role = (participant as any).Role || (participant as any).role || 'Participant'
  return role
}

function getParticipantStatus(participant: User) {
  const hasVoted = topics.value.some(t => 
    t.firstChoiceVoters?.includes(participant.email) || 
    t.secondChoiceVoters?.includes(participant.email)
  )
  const hasSubmitted = topics.value.some(t => t.createdBy === participant.email)
  
  if (hasVoted && hasSubmitted) return 'Very Active'
  if (hasVoted || hasSubmitted) return 'Active'
  return 'Inactive'
}

function getParticipantStatusColor(participant: User) {
  const status = getParticipantStatus(participant)
  switch (status) {
    case 'Very Active': return 'success'
    case 'Active': return 'primary'
    default: return 'grey'
  }
}

function getParticipantTopics(participant: User) {
  return topics.value.filter(t => t.createdBy === participant.email)
}

function getParticipantVotes(participant: User) {
  const firstChoices = topics.value.filter(t => t.firstChoiceVoters?.includes(participant.email))
  const secondChoices = topics.value.filter(t => t.secondChoiceVoters?.includes(participant.email))
  return { firstChoices, secondChoices, total: firstChoices.length + secondChoices.length }
}

function getCurrentGroup(participant: User) {
  if (!activeRound.value?.isActive || !activeRound.value.groupAssignments) return null
  
  return activeRound.value.groupAssignments.find(group => 
    group.participants.includes(participant.email)
  )
}

function getSharedInterests(participantEmail: string) {
  const currentUserEmail = (user.value as User)?.email || ''
  const currentUserInterests = userInterests.value[currentUserEmail] || []
  const participantInterests = userInterests.value[participantEmail] || []
  
  return currentUserInterests.filter(interest => 
    participantInterests.includes(interest)
  )
}

async function loadParticipants() {
  loading.value = true
  
  try {
    // Load participants - this would be an API call in real implementation
    const response = await $fetch('/api/participants')
    participants.value = response.participants || []
  } catch (error) {
    console.error('Failed to load participants:', error)
    // Mock data for demo purposes
    participants.value = [
      { 
        email: 'organizer@example.com', 
        name: 'Event Organizer',
        Role: 'Admin'
      },
      { 
        email: 'participant1@example.com', 
        name: 'Alice Johnson'
      },
      { 
        email: 'participant2@example.com', 
        name: 'Bob Smith'
      },
      { 
        email: 'guest_123456@unconference.guest', 
        name: null
      }
    ] as User[]
  }
}

async function loadTopics() {
  try {
    const { currentEventId } = useEventContext()
    if (!currentEventId.value) return
    
    const response = await $fetch(`/api/events/${currentEventId.value}/topics`)
    topics.value = response as DiscussionTopic[]
    
    // Build user interests based on voting patterns
    buildUserInterests()
  } catch (error) {
    console.error('Failed to load topics:', error)
  }
}

async function loadActiveRound() {
  try {
    const data = await $fetch('/api/active-round') as ActiveRound | null
    activeRound.value = data
  } catch (error) {
    console.error('Failed to load active round:', error)
  }
}

function buildUserInterests() {
  const interests: Record<string, string[]> = {}
  
  for (const topic of topics.value) {
    // First choice voters
    for (const voterEmail of topic.firstChoiceVoters || []) {
      if (!interests[voterEmail]) interests[voterEmail] = []
      interests[voterEmail].push(topic.title)
    }
    
    // Second choice voters
    for (const voterEmail of topic.secondChoiceVoters || []) {
      if (!interests[voterEmail]) interests[voterEmail] = []
      if (!interests[voterEmail].includes(topic.title)) {
        interests[voterEmail].push(topic.title)
      }
    }
    
    // Topic creators
    if (topic.createdBy) {
      if (!interests[topic.createdBy]) interests[topic.createdBy] = []
      if (!interests[topic.createdBy].includes(topic.title)) {
        interests[topic.createdBy].push(topic.title)
      }
    }
  }
  
  userInterests.value = interests
}

function exportParticipantData() {
  const data = participants.value.map(p => ({
    name: getDisplayName(p),
    email: p.email,
    role: getParticipantRole(p),
    status: getParticipantStatus(p),
    topicsSubmitted: getParticipantTopics(p).length,
    votescast: getParticipantVotes(p).total,
    currentGroup: getCurrentGroup(p)?.topicTitle || 'None'
  }))
  
  const csv = [
    Object.keys(data[0]).join(','),
    ...data.map(row => Object.values(row).join(','))
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `participants-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// Lifecycle
onMounted(() => {
  Promise.all([
    loadParticipants(),
    loadTopics(),
    loadActiveRound()
  ]).finally(() => {
    loading.value = false
  })
})

const tabs = [
  { key: 'directory', title: 'Directory', icon: 'mdi-account-group' },
  { key: 'network', title: 'Connections', icon: 'mdi-graph' },
  { key: 'insights', title: 'Insights', icon: 'mdi-chart-line' }
]

const roleOptions = [
  { value: 'all', title: 'All Roles' },
  { value: 'Admin', title: 'Organizers' },
  { value: 'User', title: 'Participants' }
]

const statusOptions = [
  { value: 'all', title: 'All Participants' },
  { value: 'active', title: 'Active' },
  { value: 'inactive', title: 'Inactive' }
]
</script>

<template>
  <v-container fluid>
    <!-- Header Section -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Participant Directory</h1>
        <p class="text-body-1 text-grey-darken-1">
          Connect with fellow participants and explore shared interests
        </p>
      </div>
      
      <div class="d-flex gap-2" v-if="isAdmin">
        <v-btn
          color="secondary"
          variant="outlined"
          prepend-icon="mdi-download"
          @click="exportParticipantData"
        >
          Export Data
        </v-btn>
      </div>
    </div>

    <!-- Event Status Alert -->
    <v-alert
      v-if="isEventInactive"
      type="info"
      class="mb-6"
      variant="tonal"
    >
      <template #prepend>
        <v-icon>mdi-information</v-icon>
      </template>
      <v-alert-title>Event is Inactive</v-alert-title>
      Participant data shown reflects the current state. Some features may be limited.
    </v-alert>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-h6">Loading participants...</p>
    </div>

    <div v-else>
      <!-- Stats Overview -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h4 text-primary">{{ participantStats.total }}</div>
              <div class="text-caption text-grey">Total Participants</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h4 text-success">{{ participantStats.active }}</div>
              <div class="text-caption text-grey">Active Participants</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h4 text-info">{{ participantStats.withTopics }}</div>
              <div class="text-caption text-grey">Topic Contributors</div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card>
            <v-card-text class="text-center">
              <div class="text-h4 text-warning">{{ participantStats.admins }}</div>
              <div class="text-caption text-grey">Organizers</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Main Content Tabs -->
      <v-card class="mb-6">
        <v-tabs v-model="currentTab" color="primary" grow>
          <v-tab
            v-for="tab in tabs"
            :key="tab.key"
            :value="tab.key"
            :prepend-icon="tab.icon"
          >
            {{ tab.title }}
          </v-tab>
        </v-tabs>
      </v-card>

      <!-- Tab Content -->
      <v-window v-model="currentTab">
        <!-- Directory Tab -->
        <v-window-item value="directory">
          <!-- Search and Filters -->
          <v-row class="mb-4">
            <v-col cols="12" md="6">
              <v-text-field
                v-model="searchQuery"
                label="Search participants..."
                prepend-inner-icon="mdi-magnify"
                clearable
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="filterRole"
                :items="roleOptions"
                label="Filter by Role"
                variant="outlined"
                density="compact"
              ></v-select>
            </v-col>
            
            <v-col cols="12" sm="6" md="3">
              <v-select
                v-model="filterStatus"
                :items="statusOptions"
                label="Filter by Status"
                variant="outlined"
                density="compact"
              ></v-select>
            </v-col>
          </v-row>

          <!-- Participants Grid -->
          <v-row>
            <v-col
              v-for="participant in filteredParticipants"
              :key="participant.email"
              cols="12"
              sm="6"
              md="4"
              lg="3"
            >
              <v-card class="h-100 participant-card">
                <v-card-title class="d-flex align-center">
                  <v-avatar
                    :color="getParticipantStatusColor(participant)"
                    size="36"
                    class="mr-3"
                  >
                    <v-icon color="white">
                      {{ getParticipantRole(participant) === 'Admin' ? 'mdi-crown' : 'mdi-account' }}
                    </v-icon>
                  </v-avatar>
                  
                  <div class="flex-grow-1">
                    <div class="text-h6">{{ getDisplayName(participant) }}</div>
                    <div class="text-caption text-grey">{{ getParticipantRole(participant) }}</div>
                  </div>
                  
                  <v-chip
                    :color="getParticipantStatusColor(participant)"
                    size="small"
                    variant="flat"
                  >
                    {{ getParticipantStatus(participant) }}
                  </v-chip>
                </v-card-title>

                <v-card-text>
                  <div class="mb-3">
                    <v-chip size="small" color="info" variant="outlined" class="mr-1 mb-1">
                      <v-icon size="small" class="mr-1">mdi-email</v-icon>
                      {{ participant.email.length > 20 ? participant.email.substring(0, 20) + '...' : participant.email }}
                    </v-chip>
                  </div>

                  <!-- Participation Summary -->
                  <div class="participation-summary">
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-caption">Topics Submitted:</span>
                      <strong>{{ getParticipantTopics(participant).length }}</strong>
                    </div>
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-caption">Votes Cast:</span>
                      <strong>{{ getParticipantVotes(participant).total }}</strong>
                    </div>
                    <div v-if="getCurrentGroup(participant)" class="d-flex justify-space-between mb-2">
                      <span class="text-caption">Current Group:</span>
                      <v-chip size="x-small" color="success">
                        {{ getCurrentGroup(participant)?.topicTitle?.substring(0, 15) }}{{ getCurrentGroup(participant)?.topicTitle && getCurrentGroup(participant)?.topicTitle.length > 15 ? '...' : '' }}
                      </v-chip>
                    </div>
                  </div>

                  <!-- Shared Interests -->
                  <div v-if="participant.email !== (user as User)?.email && getSharedInterests(participant.email).length > 0" class="mt-3">
                    <div class="text-caption text-primary mb-1">
                      <v-icon size="small" class="mr-1">mdi-heart</v-icon>
                      Shared Interests ({{ getSharedInterests(participant.email).length }})
                    </div>
                    <div class="d-flex flex-wrap gap-1">
                      <v-chip
                        v-for="interest in getSharedInterests(participant.email).slice(0, 2)"
                        :key="interest"
                        size="x-small"
                        color="primary"
                        variant="tonal"
                      >
                        {{ interest.length > 15 ? interest.substring(0, 15) + '...' : interest }}
                      </v-chip>
                      <v-chip
                        v-if="getSharedInterests(participant.email).length > 2"
                        size="x-small"
                        color="primary"
                        variant="outlined"
                      >
                        +{{ getSharedInterests(participant.email).length - 2 }} more
                      </v-chip>
                    </div>
                  </div>

                  <!-- Topics Created -->
                  <div v-if="getParticipantTopics(participant).length > 0" class="mt-3">
                    <div class="text-caption text-success mb-1">
                      <v-icon size="small" class="mr-1">mdi-lightbulb</v-icon>
                      Topics Created
                    </div>
                    <div class="d-flex flex-wrap gap-1">
                      <v-chip
                        v-for="topic in getParticipantTopics(participant).slice(0, 2)"
                        :key="topic.id"
                        size="x-small"
                        color="success"
                        variant="tonal"
                      >
                        {{ topic.title.length > 15 ? topic.title.substring(0, 15) + '...' : topic.title }}
                      </v-chip>
                      <v-chip
                        v-if="getParticipantTopics(participant).length > 2"
                        size="x-small"
                        color="success"
                        variant="outlined"
                      >
                        +{{ getParticipantTopics(participant).length - 2 }} more
                      </v-chip>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- No Results -->
          <v-alert v-if="filteredParticipants.length === 0" type="info" class="text-center mt-6">
            No participants match your search criteria.
          </v-alert>
        </v-window-item>

        <!-- Connections Tab -->
        <v-window-item value="network">
          <div class="text-center py-8">
            <v-icon size="64" color="primary" class="mb-4">mdi-graph</v-icon>
            <h3 class="text-h5 mb-2">Connection Network</h3>
            <p class="text-body-1 text-grey-darken-1 mb-4">
              Discover participants with shared interests and voting patterns.
            </p>
            
            <!-- Connection Insights -->
            <v-row justify="center" class="mb-6">
              <v-col cols="12" md="8">
                <v-card>
                  <v-card-title>Connection Insights</v-card-title>
                  <v-card-text>
                    <v-row>
                      <v-col cols="12" sm="4" class="text-center">
                        <div class="text-h5 text-primary">{{ connectionNetwork.length }}</div>
                        <div class="text-caption">Total Connections</div>
                      </v-col>
                      <v-col cols="12" sm="4" class="text-center">
                        <div class="text-h5 text-success">{{ Math.round(connectionNetwork.length / participantStats.total) }}</div>
                        <div class="text-caption">Avg Connections/Person</div>
                      </v-col>
                      <v-col cols="12" sm="4" class="text-center">
                        <div class="text-h5 text-info">{{ Math.max(...connectionNetwork.map(c => c.strength), 0) }}</div>
                        <div class="text-caption">Strongest Connection</div>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Top Connections -->
            <div v-if="connectionNetwork.length > 0">
              <h4 class="text-h6 mb-4">Strongest Connections</h4>
              <v-row>
                <v-col
                  v-for="connection in connectionNetwork.slice(0, 6)"
                  :key="`${connection.from}-${connection.to}`"
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <v-card>
                    <v-card-text class="text-center">
                      <div class="d-flex align-center justify-center mb-2">
                        <v-chip size="small" color="primary" class="mr-2">
                          {{ getDisplayName(participants.find(p => p.email === connection.from) || {} as User) }}
                        </v-chip>
                        <v-icon>mdi-arrow-right</v-icon>
                        <v-chip size="small" color="secondary" class="ml-2">
                          {{ getDisplayName(participants.find(p => p.email === connection.to) || {} as User) }}
                        </v-chip>
                      </div>
                      <v-chip size="small" color="success" variant="tonal">
                        {{ connection.strength }} shared interests
                      </v-chip>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
            
            <v-alert v-else type="info" class="mt-6">
              No connections found yet. Connections are based on shared topic interests and voting patterns.
            </v-alert>
          </div>
        </v-window-item>

        <!-- Insights Tab -->
        <v-window-item value="insights">
          <v-row>
            <!-- Participation Breakdown -->
            <v-col cols="12" md="6">
              <v-card>
                <v-card-title>Participation Breakdown</v-card-title>
                <v-card-text>
                  <div class="mb-4">
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span>Very Active</span>
                      <v-chip size="small" color="success">
                        {{ participants.filter(p => getParticipantStatus(p) === 'Very Active').length }}
                      </v-chip>
                    </div>
                    <v-progress-linear
                      :model-value="(participants.filter(p => getParticipantStatus(p) === 'Very Active').length / participantStats.total) * 100"
                      color="success"
                      height="8"
                      rounded
                    ></v-progress-linear>
                  </div>
                  
                  <div class="mb-4">
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span>Active</span>
                      <v-chip size="small" color="primary">
                        {{ participants.filter(p => getParticipantStatus(p) === 'Active').length }}
                      </v-chip>
                    </div>
                    <v-progress-linear
                      :model-value="(participants.filter(p => getParticipantStatus(p) === 'Active').length / participantStats.total) * 100"
                      color="primary"
                      height="8"
                      rounded
                    ></v-progress-linear>
                  </div>
                  
                  <div>
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span>Inactive</span>
                      <v-chip size="small" color="grey">
                        {{ participants.filter(p => getParticipantStatus(p) === 'Inactive').length }}
                      </v-chip>
                    </div>
                    <v-progress-linear
                      :model-value="(participants.filter(p => getParticipantStatus(p) === 'Inactive').length / participantStats.total) * 100"
                      color="grey"
                      height="8"
                      rounded
                    ></v-progress-linear>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Top Contributors -->
            <v-col cols="12" md="6">
              <v-card>
                <v-card-title>Top Contributors</v-card-title>
                <v-card-text>
                  <v-list>
                    <v-list-item
                      v-for="(participant, index) in participants
                        .filter(p => getParticipantTopics(p).length > 0)
                        .sort((a, b) => getParticipantTopics(b).length - getParticipantTopics(a).length)
                        .slice(0, 5)"
                      :key="participant.email"
                    >
                      <template #prepend>
                        <v-avatar :color="index === 0 ? 'warning' : 'grey'" size="32">
                          <span class="text-white font-weight-bold">{{ index + 1 }}</span>
                        </v-avatar>
                      </template>
                      
                      <v-list-item-title>{{ getDisplayName(participant) }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ getParticipantTopics(participant).length }} topics submitted
                      </v-list-item-subtitle>
                      
                      <template #append>
                        <v-chip size="small" color="success">
                          {{ getParticipantVotes(participant).total }} votes
                        </v-chip>
                      </template>
                    </v-list-item>
                  </v-list>
                  
                  <v-alert v-if="participantStats.withTopics === 0" type="info" class="text-center">
                    No topics have been submitted yet.
                  </v-alert>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>
      </v-window>
    </div>
  </v-container>
</template>

<style scoped>
.participant-card {
  transition: all 0.3s ease;
}

.participant-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.participation-summary {
  background: rgba(var(--v-theme-surface), 0.5);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
}

/* Mobile Responsive Design */
@media (max-width: 960px) {
  .participant-card:hover {
    transform: translateY(-1px);
  }
}

@media (max-width: 600px) {
  .v-container {
    padding: 12px !important;
  }
  
  .text-h4 {
    font-size: 1.5rem !important;
  }
  
  .participant-card:hover {
    transform: none;
  }
  
  .v-card-title {
    padding: 12px !important;
    padding-bottom: 8px !important;
  }
  
  .v-card-text {
    padding: 12px !important;
    padding-top: 8px !important;
  }
  
  .participation-summary {
    padding: 8px !important;
    font-size: 0.875rem;
  }
  
  .v-chip {
    font-size: 0.75rem !important;
  }
  
  .v-tabs .v-tab {
    min-width: 90px !important;
    font-size: 0.875rem;
    padding: 8px 4px !important;
  }
}

@media (max-width: 480px) {
  .v-container {
    padding: 8px !important;
  }
  
  .v-card-title .text-h6 {
    font-size: 1rem !important;
  }
  
  .participation-summary {
    padding: 6px !important;
    font-size: 0.8125rem;
  }
}
</style>
<template>
  <v-card class="connections-tracker" elevation="2">
    <v-card-title class="d-flex align-center">
      <v-icon color="primary" class="mr-2">mdi-account-group</v-icon>
      Event Connections
      <v-spacer></v-spacer>
      <v-chip color="success" size="small">
        {{ totalConnections }} connections made
      </v-chip>
    </v-card-title>

    <v-card-text>
      <!-- Connection Opportunities -->
      <div v-if="suggestedConnections.length > 0" class="mb-4">
        <h3 class="text-h6 mb-2">
          <v-icon color="orange" class="mr-1">mdi-lightbulb</v-icon>
          People You Should Meet
        </h3>
        <v-row>
          <v-col 
            v-for="suggestion in suggestedConnections" 
            :key="suggestion.person.id"
            cols="12" sm="6" md="4"
          >
            <v-card 
              class="connection-suggestion" 
              variant="outlined"
              hover
              @click="requestIntroduction(suggestion)"
            >
              <v-card-text class="py-3">
                <div class="d-flex align-center mb-2">
                  <v-avatar size="32" class="mr-2">
                    <img v-if="suggestion.person.avatar" :src="suggestion.person.avatar">
                    <v-icon v-else>mdi-account</v-icon>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">{{ suggestion.person.name }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ suggestion.matchType }}
                    </div>
                  </div>
                </div>
                <div class="text-caption mb-2">
                  <strong>Common interests:</strong> {{ suggestion.commonInterests.join(', ') }}
                </div>
                <div class="text-caption">
                  {{ suggestion.reason }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Active Collaborations -->
      <div v-if="activeCollaborations.length > 0" class="mb-4">
        <h3 class="text-h6 mb-2">
          <v-icon color="blue" class="mr-1">mdi-handshake</v-icon>
          Active Collaborations
        </h3>
        <v-expansion-panels>
          <v-expansion-panel
            v-for="collab in activeCollaborations"
            :key="collab.id"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-avatar-group class="mr-3">
                  <v-avatar 
                    v-for="contributor in collab.contributors.slice(0, 3)"
                    :key="contributor.id"
                    size="24"
                  >
                    <img v-if="contributor.avatar" :src="contributor.avatar">
                    <v-icon v-else size="16">mdi-account</v-icon>
                  </v-avatar>
                  <v-avatar v-if="collab.contributors.length > 3" size="24">
                    <span class="text-caption">+{{ collab.contributors.length - 3 }}</span>
                  </v-avatar>
                </v-avatar-group>
                <div>
                  <div class="font-weight-medium">{{ collab.name }}</div>
                  <div class="text-caption">{{ collab.contributors.length }} collaborators</div>
                </div>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="mb-3">
                <p>{{ collab.description }}</p>
              </div>
              
              <!-- Shared Notes -->
              <div class="mb-3">
                <v-textarea
                  v-model="collab.sharedNotes"
                  label="Shared Notes"
                  variant="outlined"
                  rows="3"
                  @blur="updateCollaboration(collab)"
                ></v-textarea>
              </div>

              <!-- Action Items -->
              <div class="mb-3">
                <div class="d-flex align-center justify-space-between mb-2">
                  <h4 class="text-subtitle-1">Action Items</h4>
                  <v-btn
                    size="small"
                    color="primary"
                    prepend-icon="mdi-plus"
                    @click="addActionItem(collab)"
                  >
                    Add Task
                  </v-btn>
                </div>
                <v-list density="compact">
                  <v-list-item
                    v-for="item in collab.actionItems"
                    :key="item.id"
                  >
                    <template #prepend>
                      <v-checkbox
                        :model-value="item.status === 'completed'"
                        @update:model-value="toggleActionItem(item)"
                      ></v-checkbox>
                    </template>
                    <v-list-item-title :class="{ 'text-decoration-line-through': item.status === 'completed' }">
                      {{ item.task }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      Assigned to: {{ getParticipantName(item.assignedTo) }}
                      <span v-if="item.dueDate"> • Due: {{ formatDate(item.dueDate) }}</span>
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </div>

              <!-- Resources -->
              <div class="mb-3">
                <div class="d-flex align-center justify-space-between mb-2">
                  <h4 class="text-subtitle-1">Shared Resources</h4>
                  <v-btn
                    size="small"
                    color="success"
                    prepend-icon="mdi-link"
                    @click="addResource(collab)"
                  >
                    Add Link
                  </v-btn>
                </div>
                <v-list density="compact">
                  <v-list-item
                    v-for="resource in collab.resources"
                    :key="resource.id"
                    :href="resource.url"
                    target="_blank"
                  >
                    <template #prepend>
                      <v-icon>mdi-open-in-new</v-icon>
                    </template>
                    <v-list-item-title>{{ resource.title }}</v-list-item-title>
                    <v-list-item-subtitle>
                      Added by {{ getParticipantName(resource.addedBy) }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </div>

              <!-- Collaboration Actions -->
              <div class="d-flex gap-2">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-slack"
                  size="small"
                  @click="createSlackChannel(collab)"
                >
                  Create Slack Channel
                </v-btn>
                <v-btn
                  color="secondary"
                  prepend-icon="mdi-calendar"
                  size="small"
                  @click="scheduleFollowUp(collab)"
                >
                  Schedule Follow-up
                </v-btn>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <!-- My Connections -->
      <div v-if="myConnections.length > 0">
        <h3 class="text-h6 mb-2">
          <v-icon color="green" class="mr-1">mdi-account-multiple</v-icon>
          My Connections ({{ myConnections.length }})
        </h3>
        <v-row>
          <v-col 
            v-for="connection in myConnections" 
            :key="connection.id"
            cols="12" sm="6" md="4"
          >
            <v-card variant="outlined" class="connection-card">
              <v-card-text class="py-3">
                <div class="d-flex align-center mb-2">
                  <v-avatar size="32" class="mr-2">
                    <img v-if="connection.person.avatar" :src="connection.person.avatar">
                    <v-icon v-else>mdi-account</v-icon>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="font-weight-medium">{{ connection.person.name }}</div>
                    <div class="text-caption">
                      <v-icon size="12" :color="getConnectionStrengthColor(connection.strength)">
                        mdi-circle
                      </v-icon>
                      {{ getConnectionStrengthText(connection.strength) }}
                    </div>
                  </div>
                  <v-menu>
                    <template #activator="{ props }">
                      <v-btn size="small" icon variant="text" v-bind="props">
                        <v-icon>mdi-dots-vertical</v-icon>
                      </v-btn>
                    </template>
                    <v-list>
                      <v-list-item @click="shareContact(connection)">
                        <v-list-item-title>Share Contact</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="addToLinkedIn(connection)">
                        <v-list-item-title>Connect on LinkedIn</v-list-item-title>
                      </v-list-item>
                      <v-list-item @click="scheduleFollowUp(connection)">
                        <v-list-item-title>Schedule Follow-up</v-list-item-title>
                      </v-list-item>
                    </v-list>
                  </v-menu>
                </div>
                
                <div v-if="connection.sharedTopics.length > 0" class="mb-2">
                  <div class="text-caption mb-1">Shared interests:</div>
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

                <div v-if="connection.collaboratedOn.length > 0" class="text-caption">
                  <strong>Worked together on:</strong> {{ connection.collaboratedOn.join(', ') }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { 
  EventConnection, 
  CollaborationSpace, 
  Participant, 
  IntroductionRequest,
  SkillMatch 
} from '~/types/connections'

// Props
interface Props {
  eventId: string
  currentUserId: string
}
const props = defineProps<Props>()

// Reactive data
const connections = ref<EventConnection[]>([])
const collaborations = ref<CollaborationSpace[]>([])
const participants = ref<Participant[]>([])
const skillMatches = ref<SkillMatch[]>([])

// Computed
const totalConnections = computed(() => connections.value.length)

const myConnections = computed(() => {
  return connections.value
    .filter(conn => 
      conn.participantA === props.currentUserId || 
      conn.participantB === props.currentUserId
    )
    .map(conn => {
      const otherPersonId = conn.participantA === props.currentUserId 
        ? conn.participantB 
        : conn.participantA
      const person = participants.value.find(p => p.id === otherPersonId)
      return {
        id: conn.id,
        person,
        sharedTopics: conn.sharedTopics,
        collaboratedOn: conn.collaboratedOn,
        strength: conn.connectionStrength,
        contactExchanged: conn.contactExchanged
      }
    })
    .filter(conn => conn.person)
})

const suggestedConnections = computed(() => {
  return skillMatches.value
    .filter(match => 
      match.personA === props.currentUserId || 
      match.personB === props.currentUserId
    )
    .slice(0, 6) // Show top 6 suggestions
    .map(match => {
      const otherPersonId = match.personA === props.currentUserId 
        ? match.personB 
        : match.personA
      const person = participants.value.find(p => p.id === otherPersonId)
      return {
        person,
        matchType: match.matchType,
        commonInterests: match.skills,
        reason: match.reason,
        score: match.compatibilityScore
      }
    })
    .filter(suggestion => suggestion.person)
})

const activeCollaborations = computed(() => {
  return collaborations.value
    .filter(collab => 
      collab.contributors.includes(props.currentUserId) && 
      collab.status === 'active'
    )
    .map(collab => ({
      ...collab,
      contributors: collab.contributors
        .map(id => participants.value.find(p => p.id === id))
        .filter(Boolean)
    }))
})

// Methods
const getParticipantName = (participantId: string) => {
  const participant = participants.value.find(p => p.id === participantId)
  return participant?.name || 'Unknown'
}

const getConnectionStrengthColor = (strength: number) => {
  if (strength >= 4) return 'success'
  if (strength >= 3) return 'warning'
  return 'grey'
}

const getConnectionStrengthText = (strength: number) => {
  if (strength >= 4) return 'Strong connection'
  if (strength >= 3) return 'Good connection'
  return 'New connection'
}

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString()
}

const requestIntroduction = async (suggestion: any) => {
  // Implementation for requesting introductions
  console.log('Requesting introduction to:', suggestion.person.name)
}

const updateCollaboration = async (collab: CollaborationSpace) => {
  // Save collaboration updates
  console.log('Updating collaboration:', collab.id)
}

const addActionItem = (collab: CollaborationSpace) => {
  // Add new action item
  console.log('Adding action item to:', collab.name)
}

const toggleActionItem = (item: any) => {
  item.status = item.status === 'completed' ? 'pending' : 'completed'
}

const addResource = (collab: CollaborationSpace) => {
  // Add new resource
  console.log('Adding resource to:', collab.name)
}

const createSlackChannel = async (collab: CollaborationSpace) => {
  // Create Slack channel for collaboration
  console.log('Creating Slack channel for:', collab.name)
}

const scheduleFollowUp = (item: any) => {
  // Schedule follow-up meeting
  console.log('Scheduling follow-up for:', item)
}

const shareContact = (connection: any) => {
  // Share contact information
  console.log('Sharing contact for:', connection.person.name)
}

const addToLinkedIn = (connection: any) => {
  // Generate LinkedIn connection URL
  console.log('Adding to LinkedIn:', connection.person.name)
}

// Load data on mount
onMounted(async () => {
  // Load connections, collaborations, participants, and skill matches
  // This would typically come from API calls
})
</script>

<style scoped>
.connections-tracker {
  max-width: 100%;
}

.connection-suggestion {
  cursor: pointer;
  transition: all 0.3s ease;
}

.connection-suggestion:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.connection-card {
  height: 100%;
}

.connection-card .v-card-text {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>

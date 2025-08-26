<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Participant {
  name: string
  email: string
  role?: string
}

interface GroupAssignment {
  topicId: string
  topicTitle: string
  participants: Participant[]
  groupNumber: number
  // Room management fields
  roomId?: string
  roomName?: string
  roomCapacity?: number
  roomLocation?: string
  isOvercapacity: boolean
  waitlist: Participant[]
  actualCapacity: number
}

interface GroupsData {
  success: boolean
  hasGroups: boolean
  createdAt?: string
  createdBy?: string
  eventRound?: number
  groups?: GroupAssignment[]
  roomConstraints?: {
    totalRoomsAvailable: number
    totalRoomsUsed: number
    hasWaitlists: boolean
    warnings: string[]
  }
  statistics?: {
    totalAssignedParticipants: number
    totalWaitlistedParticipants: number
    utilizationRate: number
  }
}

const { user } = useUserSession()
const groups = ref<GroupAssignment[]>([])
const groupsInfo = ref<GroupsData | null>(null)
const loading = ref(true)
const error = ref('')
const rebalanceDialog = ref(false)
const minParticipants = ref(4)
const rebalancing = ref(false)

const isAdmin = computed(() => user.value?.role === 'Admin')

const underCapacityGroups = computed(() => 
  groups.value.filter(group => group.participants.length < minParticipants.value)
)

async function loadGroups() {
  loading.value = true
  error.value = ''
  
  try {
    const response = await $fetch('/api/admin/groups') as GroupsData
    groupsInfo.value = response
    groups.value = response.groups || []
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to load group assignments'
  } finally {
    loading.value = false
  }
}

async function createGroups() {
  const confirmed = confirm('Create new group assignments? This will assign participants to groups based on their votes on selected topics.')
  if (!confirmed) return
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await $fetch('/api/admin/create-groups', {
      method: 'POST'
    })
    
    await loadGroups() // Reload to get the new groups
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to create group assignments'
  } finally {
    loading.value = false
  }
}

async function rebalanceGroups() {
  rebalancing.value = true
  error.value = ''
  
  try {
    const response = await $fetch('/api/admin/rebalance-groups', {
      method: 'POST',
      body: {
        minParticipantsPerTable: minParticipants.value
      }
    })
    
    rebalanceDialog.value = false
    await loadGroups() // Reload to get the rebalanced groups
    
    // Show success message with changes
    if (response.changes && response.changes.length > 0) {
      alert(`Rebalancing completed!\n\nChanges made:\n${response.changes.join('\n')}`)
    }
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to rebalance groups'
  } finally {
    rebalancing.value = false
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString()
}

function getRoleColor(role?: string) {
  switch (role) {
    case 'Admin': return 'warning'
    case 'Guest': return 'info'
    default: return 'primary'
  }
}

onMounted(() => {
  loadGroups()
})

definePageMeta({
  middleware: 'authenticated'
})
</script>

<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 text-primary">Group Assignments</h1>
      
      <div class="d-flex gap-2">
        <v-btn
          @click="loadGroups"
          :loading="loading"
          color="primary"
          variant="outlined"
          prepend-icon="mdi-refresh"
        >
          Refresh
        </v-btn>
        
        <v-btn
          v-if="isAdmin && !groupsInfo?.hasGroups"
          @click="createGroups"
          :loading="loading"
          color="success"
          prepend-icon="mdi-account-group"
        >
          Create Groups
        </v-btn>
        
        <v-btn
          v-if="isAdmin && groupsInfo?.hasGroups"
          @click="rebalanceDialog = true"
          :loading="loading"
          color="warning"
          prepend-icon="mdi-shuffle-variant"
        >
          Rebalance Groups
        </v-btn>
      </div>
    </div>

    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      class="mb-6"
      dismissible
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
      <p class="mt-4 text-h6">Loading group assignments...</p>
    </div>

    <!-- No Groups State -->
    <div v-else-if="!groupsInfo?.hasGroups" class="text-center py-8">
      <v-icon size="64" color="grey" class="mb-4">mdi-account-group-outline</v-icon>
      <h2 class="text-h5 mb-2">No Group Assignments Yet</h2>
      <p class="text-body-1 text-grey-darken-1 mb-6">
        Groups will be created automatically based on topic votes when topics reach the voting limit.
      </p>
      
      <v-btn
        v-if="isAdmin"
        @click="createGroups"
        color="primary"
        size="large"
        prepend-icon="mdi-account-group"
      >
        Create Groups Now
      </v-btn>
    </div>

    <!-- Groups Display -->
    <div v-else>
      <!-- Groups Info with Room Statistics -->
      <v-row class="mb-6">
        <v-col cols="12" md="8">
          <v-card variant="tonal" color="info">
            <v-card-text>
              <div class="d-flex align-center mb-2">
                <v-icon class="mr-2">mdi-information</v-icon>
                <strong>Group Session Information</strong>
              </div>
              <div class="text-body-2">
                <p><strong>Created:</strong> {{ formatDate(groupsInfo.createdAt!) }}</p>
                <p><strong>Created by:</strong> {{ groupsInfo.createdBy }}</p>
                <p><strong>Total Groups:</strong> {{ groups.length }}</p>
                <p><strong>Total Participants:</strong> {{ groups.reduce((sum, g) => sum + g.participants.length, 0) }}</p>
                <p v-if="groupsInfo.statistics">
                  <strong>Waitlisted:</strong> {{ groupsInfo.statistics.totalWaitlistedParticipants }}
                </p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card variant="tonal" :color="groupsInfo?.roomConstraints?.hasWaitlists ? 'warning' : 'success'">
            <v-card-text>
              <div class="d-flex align-center mb-2">
                <v-icon class="mr-2">mdi-home-city</v-icon>
                <strong>Room Utilization</strong>
              </div>
              <div class="text-body-2" v-if="groupsInfo?.roomConstraints">
                <p><strong>Rooms Used:</strong> {{ groupsInfo.roomConstraints.totalRoomsUsed }}/{{ groupsInfo.roomConstraints.totalRoomsAvailable }}</p>
                <p v-if="groupsInfo.statistics">
                  <strong>Utilization:</strong> {{ groupsInfo.statistics.utilizationRate }}%
                </p>
                <v-chip 
                  :color="groupsInfo.roomConstraints.hasWaitlists ? 'error' : 'success'" 
                  size="small"
                  class="mt-1"
                >
                  {{ groupsInfo.roomConstraints.hasWaitlists ? 'Over Capacity' : 'Within Capacity' }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Capacity Warnings -->
      <v-alert
        v-if="groupsInfo?.roomConstraints?.warnings && groupsInfo.roomConstraints.warnings.length > 0"
        type="warning"
        class="mb-6"
        prepend-icon="mdi-alert"
      >
        <v-alert-title>Room Capacity Warnings</v-alert-title>
        <ul class="mt-2">
          <li v-for="warning in groupsInfo.roomConstraints.warnings" :key="warning">
            {{ warning }}
          </li>
        </ul>
      </v-alert>

      <!-- Groups Grid -->
      <v-row>
        <v-col
          v-for="group in groups"
          :key="group.topicId"
          cols="12"
          md="6"
          lg="4"
          class="d-flex"
        >
          <v-card class="flex-grow-1" elevation="3" :class="{'border-error': group.isOvercapacity}">
            <v-card-title class="d-flex align-center">
              <div class="d-flex align-center">
                <v-avatar
                  :color="group.isOvercapacity ? 'error' : 'primary'"
                  class="mr-3"
                  size="36"
                >
                  {{ group.groupNumber }}
                </v-avatar>
                <div>
                  <div class="text-h6 d-flex align-center">
                    Group {{ group.groupNumber }}
                    <v-chip 
                      v-if="group.isOvercapacity" 
                      color="error" 
                      size="x-small" 
                      class="ml-2"
                    >
                      Over Capacity
                    </v-chip>
                  </div>
                  <div class="text-caption text-grey-darken-1">
                    {{ group.participants.length }} participant{{ group.participants.length !== 1 ? 's' : '' }}
                    <span v-if="group.waitlist.length > 0">
                      + {{ group.waitlist.length }} waitlisted
                    </span>
                  </div>
                </div>
              </div>
            </v-card-title>
            
            <!-- Room Information -->
            <v-card-subtitle class="pb-2">
              <div class="mb-2">
                <strong>Topic:</strong> {{ group.topicTitle }}
              </div>
              <div v-if="group.roomId" class="d-flex align-center gap-2">
                <v-icon size="small">mdi-map-marker</v-icon>
                <span class="text-body-2">
                  <strong>{{ group.roomName }}</strong> - {{ group.roomLocation }}
                </span>
              </div>
              <div v-else class="d-flex align-center gap-2 text-error">
                <v-icon size="small">mdi-alert</v-icon>
                <span class="text-body-2">No room assigned</span>
              </div>
              <div v-if="group.roomCapacity" class="text-caption text-grey-darken-1 mt-1">
                Room capacity: {{ group.actualCapacity }}/{{ group.roomCapacity }}
                <v-progress-linear
                  :model-value="(group.actualCapacity / group.roomCapacity) * 100"
                  :color="group.isOvercapacity ? 'error' : 'success'"
                  height="4"
                  class="mt-1"
                ></v-progress-linear>
              </div>
            </v-card-subtitle>
            
            <v-card-text>
              <v-list density="compact">
                <v-list-item
                  v-for="participant in group.participants"
                  :key="participant.email"
                  class="px-0"
                >
                  <template #prepend>
                    <v-avatar
                      :color="getRoleColor(participant.role)"
                      size="32"
                      class="mr-3"
                    >
                      <v-icon size="16">
                        {{ participant.role === 'Admin' ? 'mdi-crown' : 
                           participant.role === 'Guest' ? 'mdi-account-question' : 
                           'mdi-account' }}
                      </v-icon>
                    </v-avatar>
                  </template>
                  
                  <v-list-item-title>{{ participant.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip 
                      :color="getRoleColor(participant.role)"
                      size="x-small"
                      variant="outlined"
                    >
                      {{ participant.role || 'User' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
              
              <!-- Waitlist Section -->
              <div v-if="group.waitlist.length > 0" class="mt-4">
                <v-divider class="mb-2"></v-divider>
                <div class="d-flex align-center mb-2">
                  <v-icon size="small" color="warning" class="mr-1">mdi-clock-outline</v-icon>
                  <span class="text-subtitle-2 text-warning">Waitlist ({{ group.waitlist.length }})</span>
                </div>
                <v-chip-group>
                  <v-chip
                    v-for="participant in group.waitlist"
                    :key="participant.email"
                    size="small"
                    color="warning"
                    variant="outlined"
                  >
                    {{ participant.name }}
                  </v-chip>
                </v-chip-group>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Export/Print Actions -->
      <v-card v-if="isAdmin" class="mt-6">
        <v-card-title>Admin Actions</v-card-title>
        <v-card-text>
          <v-btn
            color="primary"
            prepend-icon="mdi-download"
            class="mr-2"
            @click="() => {
              const dataStr = JSON.stringify(groupsInfo, null, 2)
              const dataBlob = new Blob([dataStr], { type: 'application/json' })
              const url = URL.createObjectURL(dataBlob)
              const link = document.createElement('a')
              link.href = url
              link.download = `group-assignments-${new Date().toISOString().split('T')[0]}.json`
              link.click()
              URL.revokeObjectURL(url)
            }"
          >
            Export JSON
          </v-btn>
          
          <v-btn
            color="info"
            prepend-icon="mdi-printer"
            @click="window.print()"
          >
            Print Groups
          </v-btn>
        </v-card-text>
      </v-card>
    </div>

    <!-- Rebalance Groups Dialog -->
    <v-dialog v-model="rebalanceDialog" max-width="600px">
      <v-card>
        <v-card-title>Rebalance Groups</v-card-title>
        
        <v-card-text>
          <v-alert type="info" class="mb-4">
            <v-alert-title>Group Rebalancing Process</v-alert-title>
            <p class="mt-2">
              This will dissolve groups with fewer than the minimum participants and reassign people to other groups based on their 2nd choice preferences.
            </p>
          </v-alert>

          <v-text-field
            v-model.number="minParticipants"
            label="Minimum Participants per Table"
            type="number"
            min="3"
            max="10"
            hint="Groups with fewer participants will be dissolved"
            class="mb-4"
          ></v-text-field>

          <!-- Current under-capacity groups preview -->
          <div v-if="underCapacityGroups.length > 0" class="mb-4">
            <div class="text-subtitle-1 mb-2">
              Groups that will be dissolved ({{ underCapacityGroups.length }}):
            </div>
            <v-chip-group>
              <v-chip
                v-for="group in underCapacityGroups"
                :key="group.topicId"
                color="warning"
                variant="outlined"
                size="small"
              >
                {{ group.topicTitle }} ({{ group.participants.length }})
              </v-chip>
            </v-chip-group>
          </div>

          <div v-else class="mb-4">
            <v-alert type="success" variant="tonal" density="compact">
              All groups meet the minimum participant requirement. No rebalancing needed.
            </v-alert>
          </div>

          <v-alert type="warning" class="mb-4">
            <strong>Warning:</strong> This action cannot be undone. Participants will be moved from their original topics to alternative topics based on their 2nd choice preferences.
          </v-alert>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="rebalanceDialog = false">Cancel</v-btn>
          <v-btn
            color="warning"
            @click="rebalanceGroups"
            :loading="rebalancing"
            :disabled="underCapacityGroups.length === 0"
          >
            Rebalance Groups
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style>
@media print {
  .v-btn, .v-app-bar, .v-navigation-drawer {
    display: none !important;
  }
  
  .v-card {
    box-shadow: none !important;
    border: 1px solid #ccc !important;
    break-inside: avoid;
    margin-bottom: 1rem;
  }
  
  .v-card-title {
    font-size: 1.2rem !important;
    font-weight: bold !important;
  }
}
</style>
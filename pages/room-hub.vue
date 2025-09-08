<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { Room, SessionAssignment, RoomAvailability } from '~/types/room'
import { AMENITIES } from '~/types/room'
import type { ActiveRound } from '~/types/topic'

definePageMeta({
  middleware: 'authenticated',
  requiresAdmin: true
})

const { user } = useUserSession()
const { eventStatus, isEventActive, isEventInactive, canEditEvent } = useEventStatus()

// State
const loading = ref(true)
const error = ref('')
const currentTab = ref('overview')

// Room Management
const rooms = ref<Room[]>([])
const activeRound = ref<ActiveRound | null>(null)
const roomAvailability = ref<Record<string, RoomAvailability>>({})

// UI State
const roomDialog = ref(false)
const assignmentDialog = ref(false)
const bulkSetupDialog = ref(false)
const editingRoom = ref<Room | null>(null)

// Form data
const newRoom = ref({
  name: '',
  capacity: 8,
  location: '',
  description: '',
  amenities: [] as string[],
  available: true
})

const bulkRooms = ref({
  prefix: 'Room',
  startNumber: 1,
  count: 5,
  baseCapacity: 8,
  location: 'Main Building',
  amenities: ['whiteboard', 'projector'] as string[]
})

// Computed values
const roomStats = computed(() => {
  const total = rooms.value.length
  const available = rooms.value.filter(r => r.available).length
  const occupied = rooms.value.filter(r => r.currentSession).length
  const totalCapacity = rooms.value.reduce((sum, r) => sum + r.capacity, 0)
  const usedCapacity = rooms.value.reduce((sum, r) => sum + (r.currentSession?.actualAttendance || 0), 0)
  
  return {
    total,
    available,
    occupied,
    free: available - occupied,
    totalCapacity,
    usedCapacity,
    utilizationRate: totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0
  }
})

const roomsByStatus = computed(() => ({
  available: rooms.value.filter(r => r.available && !r.currentSession),
  occupied: rooms.value.filter(r => r.currentSession),
  unavailable: rooms.value.filter(r => !r.available)
}))

const roomIssues = computed(() => {
  const issues = []
  
  const overcapacityRooms = rooms.value.filter(r => 
    r.currentSession && r.currentSession.participants.length > r.capacity
  )
  
  if (overcapacityRooms.length > 0) {
    issues.push({
      type: 'warning',
      text: `${overcapacityRooms.length} room(s) over capacity`,
      action: 'redistribute',
      rooms: overcapacityRooms
    })
  }
  
  if (rooms.value.length === 0) {
    issues.push({
      type: 'error',
      text: 'No rooms configured',
      action: 'setup',
      rooms: []
    })
  }
  
  if (activeRound.value?.isActive && roomStats.value.free === 0) {
    issues.push({
      type: 'warning',
      text: 'No available rooms for additional sessions',
      action: 'review',
      rooms: []
    })
  }
  
  return issues
})

const amenityIcons = {
  projector: 'mdi-projector',
  whiteboard: 'mdi-whiteboard',
  flipchart: 'mdi-clipboard-text',
  microphone: 'mdi-microphone',
  speakers: 'mdi-speaker',
  video_conference: 'mdi-video',
  natural_light: 'mdi-weather-sunny',
  moveable_furniture: 'mdi-table-furniture',
  power_outlets: 'mdi-power-plug',
  wifi_strong: 'mdi-wifi'
}

const rules = {
  required: (v: string) => !!v || 'This field is required',
  minCapacity: (v: number) => v >= 1 || 'Capacity must be at least 1',
  maxCapacity: (v: number) => v <= 200 || 'Capacity cannot exceed 200'
}

// Methods
async function loadRooms() {
  loading.value = true
  error.value = ''
  
  try {
    const response = await $fetch('/api/organizer/rooms')
    rooms.value = response.rooms || []
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to load rooms'
  } finally {
    loading.value = false
  }
}

async function loadActiveRound() {
  try {
    const data = await $fetch('/api/active-round') as ActiveRound | null
    activeRound.value = data
  } catch (error) {
    console.error('Failed to load active round:', error)
    activeRound.value = null
  }
}

async function loadRoomAvailability() {
  if (!activeRound.value?.isActive) return
  
  try {
    // This would be an API call to get real-time room availability
    // For now, we'll compute it from the active round data
    const availability: Record<string, RoomAvailability> = {}
    
    rooms.value.forEach(room => {
      const session = room.currentSession
      availability[room.id] = {
        roomId: room.id,
        availableSpots: session ? Math.max(0, room.capacity - session.participants.length) : room.capacity,
        isOvercapacity: session ? session.participants.length > room.capacity : false,
        waitlistCount: 0 // Would come from API
      }
    })
    
    roomAvailability.value = availability
  } catch (error) {
    console.error('Failed to load room availability:', error)
  }
}

function startEdit(room?: Room) {
  if (room) {
    editingRoom.value = room
    newRoom.value = {
      name: room.name,
      capacity: room.capacity,
      location: room.location,
      description: room.description || '',
      amenities: [...room.amenities],
      available: room.available
    }
  } else {
    editingRoom.value = null
    newRoom.value = {
      name: '',
      capacity: 8,
      location: '',
      description: '',
      amenities: [],
      available: true
    }
  }
  roomDialog.value = true
}

async function saveRoom() {
  if (!newRoom.value.name || !newRoom.value.location || newRoom.value.capacity < 1) {
    return
  }

  try {
    await $fetch('/api/organizer/rooms', {
      method: 'POST',
      body: {
        ...newRoom.value,
        id: editingRoom.value?.id
      }
    })
    
    roomDialog.value = false
    await loadRooms()
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to save room'
  }
}

async function deleteRoom(room: Room) {
  if (!confirm(`Are you sure you want to delete "${room.name}"?`)) return
  
  try {
    await $fetch(`/api/organizer/rooms/${room.id}`, {
      method: 'DELETE'
    })
    await loadRooms()
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to delete room'
  }
}

async function createBulkRooms() {
  try {
    const roomsToCreate = []
    
    for (let i = 0; i < bulkRooms.value.count; i++) {
      roomsToCreate.push({
        name: `${bulkRooms.value.prefix} ${bulkRooms.value.startNumber + i}`,
        capacity: bulkRooms.value.baseCapacity,
        location: `${bulkRooms.value.location}, Floor ${Math.ceil((i + 1) / 5)}`,
        description: `Auto-generated room ${bulkRooms.value.startNumber + i}`,
        amenities: bulkRooms.value.amenities,
        available: true
      })
    }
    
    await $fetch('/api/organizer/rooms/bulk', {
      method: 'POST',
      body: { rooms: roomsToCreate }
    })
    
    bulkSetupDialog.value = false
    await loadRooms()
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to create bulk rooms'
  }
}

async function toggleRoomAvailability(room: Room) {
  try {
    await $fetch(`/api/organizer/rooms/${room.id}`, {
      method: 'PATCH',
      body: { available: !room.available }
    })
    await loadRooms()
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to update room availability'
  }
}

function getAmenityIcon(amenity: string) {
  return amenityIcons[amenity as keyof typeof amenityIcons] || 'mdi-check'
}

function getAmenityLabel(amenity: string) {
  return amenity.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

function getRoomStatusColor(room: Room) {
  if (!room.available) return 'error'
  if (room.currentSession) {
    const availability = roomAvailability.value[room.id]
    if (availability?.isOvercapacity) return 'warning'
    return 'success'
  }
  return 'info'
}

function getRoomStatusText(room: Room) {
  if (!room.available) return 'Unavailable'
  if (room.currentSession) {
    const availability = roomAvailability.value[room.id]
    if (availability?.isOvercapacity) return 'Over Capacity'
    return `In Use (${room.currentSession.participants.length}/${room.capacity})`
  }
  return 'Available'
}

// Lifecycle
onMounted(() => {
  Promise.all([
    loadRooms(),
    loadActiveRound()
  ]).then(() => {
    loadRoomAvailability()
  })
  
  // Set up polling for active round updates
  const pollInterval = setInterval(async () => {
    await Promise.all([loadActiveRound(), loadRoomAvailability()])
  }, 10000)
  
  ;(window as any).__roomHubPollInterval = pollInterval
})

onBeforeUnmount(() => {
  if ((window as any).__roomHubPollInterval) {
    clearInterval((window as any).__roomHubPollInterval)
  }
})

const tabs = [
  { key: 'overview', title: 'Room Overview', icon: 'mdi-view-dashboard' },
  { key: 'manage', title: 'Manage Rooms', icon: 'mdi-cog' },
  { key: 'assignments', title: 'Live Assignments', icon: 'mdi-account-group' }
]
</script>

<template>
  <v-container fluid>
    <!-- Event Status Alert -->
    <v-alert
      v-if="isEventInactive"
      type="warning"
      class="mb-6"
      prominent
      variant="outlined"
    >
      <template #prepend>
        <v-icon>mdi-alert</v-icon>
      </template>
      <v-alert-title>Event is Currently Inactive</v-alert-title>
      Room management may be limited. {{ eventStatus.statusReason }}
    </v-alert>

    <!-- Header Section -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Room Management Hub</h1>
        <p class="text-body-1 text-grey-darken-1">
          Configure and monitor discussion spaces for your unconference
        </p>
      </div>
      
      <div class="d-flex gap-2">
        <v-btn
          color="secondary"
          variant="outlined"
          prepend-icon="mdi-plus-box-multiple"
          @click="bulkSetupDialog = true"
          :disabled="!canEditEvent"
        >
          Bulk Setup
        </v-btn>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="startEdit()"
          :disabled="!canEditEvent"
        >
          Add Room
        </v-btn>
      </div>
    </div>

    <!-- Room Issues Alert -->
    <v-alert
      v-if="roomIssues.length > 0"
      :type="roomIssues.some(i => i.type === 'error') ? 'error' : 'warning'"
      class="mb-6"
      variant="tonal"
    >
      <v-alert-title>Room Management Issues</v-alert-title>
      <v-list density="compact" class="bg-transparent">
        <v-list-item
          v-for="issue in roomIssues"
          :key="issue.text"
          class="px-0"
        >
          <template #prepend>
            <v-icon 
              :color="issue.type === 'error' ? 'error' : 'warning'"
              size="small"
            >
              {{ issue.type === 'error' ? 'mdi-alert-circle' : 'mdi-alert' }}
            </v-icon>
          </template>
          <v-list-item-title>{{ issue.text }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-alert>

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
      <!-- Overview Tab -->
      <v-window-item value="overview">
        <v-row class="mb-6">
          <!-- Room Statistics -->
          <v-col cols="12" lg="8">
            <v-card>
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-chart-bar</v-icon>
                Room Statistics
                <v-spacer></v-spacer>
                <v-chip 
                  :color="roomStats.total > 0 ? 'success' : 'warning'"
                  size="small"
                >
                  {{ roomStats.total }} Total Rooms
                </v-chip>
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="6" md="3" class="text-center">
                    <div class="text-h4 text-success">{{ roomStats.available }}</div>
                    <div class="text-caption text-grey">Available</div>
                  </v-col>
                  <v-col cols="6" md="3" class="text-center">
                    <div class="text-h4 text-primary">{{ roomStats.occupied }}</div>
                    <div class="text-caption text-grey">In Use</div>
                  </v-col>
                  <v-col cols="6" md="3" class="text-center">
                    <div class="text-h4 text-info">{{ roomStats.totalCapacity }}</div>
                    <div class="text-caption text-grey">Total Capacity</div>
                  </v-col>
                  <v-col cols="6" md="3" class="text-center">
                    <div class="text-h4 text-warning">{{ roomStats.utilizationRate }}%</div>
                    <div class="text-caption text-grey">Utilization</div>
                  </v-col>
                </v-row>
                
                <!-- Utilization Progress -->
                <v-progress-linear
                  :model-value="roomStats.utilizationRate"
                  :color="roomStats.utilizationRate > 80 ? 'warning' : roomStats.utilizationRate > 50 ? 'primary' : 'success'"
                  height="12"
                  rounded
                  class="mt-4"
                >
                  <template v-slot:default="{ value }">
                    <small class="text-white font-weight-bold">{{ Math.ceil(value) }}%</small>
                  </template>
                </v-progress-linear>
                <div class="text-caption text-grey text-center mt-1">
                  {{ roomStats.usedCapacity }} / {{ roomStats.totalCapacity }} capacity utilized
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- Quick Actions -->
          <v-col cols="12" lg="4">
            <v-card>
              <v-card-title>Quick Actions</v-card-title>
              <v-card-text>
                <v-btn
                  block
                  color="primary"
                  prepend-icon="mdi-plus"
                  class="mb-3"
                  @click="startEdit()"
                  :disabled="!canEditEvent"
                >
                  Add New Room
                </v-btn>
                
                <v-btn
                  block
                  color="secondary"
                  prepend-icon="mdi-plus-box-multiple"
                  class="mb-3"
                  @click="bulkSetupDialog = true"
                  :disabled="!canEditEvent"
                >
                  Bulk Room Setup
                </v-btn>
                
                <v-btn
                  block
                  color="info"
                  prepend-icon="mdi-account-group"
                  class="mb-3"
                  @click="currentTab = 'assignments'"
                  :disabled="!activeRound?.isActive"
                >
                  View Live Assignments
                </v-btn>
                
                <v-btn
                  block
                  color="success"
                  prepend-icon="mdi-cog"
                  to="/groups"
                >
                  Manage Rounds
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Room Status Overview -->
        <div v-if="rooms.length > 0">
          <h2 class="text-h5 mb-4">Room Status Overview</h2>
          
          <!-- Available Rooms -->
          <div v-if="roomsByStatus.available.length > 0" class="mb-6">
            <h3 class="text-h6 mb-3 text-success">
              <v-icon class="mr-2">mdi-check-circle</v-icon>
              Available Rooms ({{ roomsByStatus.available.length }})
            </h3>
            <v-row>
              <v-col
                v-for="room in roomsByStatus.available"
                :key="room.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
              >
                <v-card variant="outlined" class="h-100">
                  <v-card-title class="text-subtitle-1 pb-2">
                    <v-icon color="success" class="mr-2">mdi-home-city</v-icon>
                    {{ room.name }}
                  </v-card-title>
                  <v-card-text class="pt-0">
                    <div class="text-caption text-grey mb-1">
                      <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                      {{ room.location }}
                    </div>
                    <div class="text-caption text-grey mb-2">
                      <v-icon size="small" class="mr-1">mdi-account-group</v-icon>
                      {{ room.capacity }} capacity
                    </div>
                    <div v-if="room.amenities.length > 0" class="d-flex flex-wrap gap-1">
                      <v-icon
                        v-for="amenity in room.amenities.slice(0, 4)"
                        :key="amenity"
                        size="small"
                        :title="getAmenityLabel(amenity)"
                      >
                        {{ getAmenityIcon(amenity) }}
                      </v-icon>
                      <span v-if="room.amenities.length > 4" class="text-caption">
                        +{{ room.amenities.length - 4 }} more
                      </span>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- Occupied Rooms -->
          <div v-if="roomsByStatus.occupied.length > 0" class="mb-6">
            <h3 class="text-h6 mb-3 text-primary">
              <v-icon class="mr-2">mdi-account-group</v-icon>
              Occupied Rooms ({{ roomsByStatus.occupied.length }})
            </h3>
            <v-row>
              <v-col
                v-for="room in roomsByStatus.occupied"
                :key="room.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
              >
                <v-card :color="getRoomStatusColor(room)" variant="tonal" class="h-100">
                  <v-card-title class="text-subtitle-1 pb-2">
                    <v-icon class="mr-2">mdi-home-city</v-icon>
                    {{ room.name }}
                  </v-card-title>
                  <v-card-text class="pt-0">
                    <div class="text-caption mb-1">
                      <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                      {{ room.location }}
                    </div>
                    <div class="text-caption mb-2">
                      <v-icon size="small" class="mr-1">mdi-account-group</v-icon>
                      {{ room.currentSession?.participants.length || 0 }} / {{ room.capacity }}
                      <span v-if="roomAvailability[room.id]?.isOvercapacity" class="text-warning font-weight-bold">
                        (Over capacity!)
                      </span>
                    </div>
                    <div v-if="room.currentSession" class="text-body-2 font-weight-medium mb-2">
                      {{ room.currentSession.topicTitle }}
                    </div>
                    <v-progress-linear
                      :model-value="Math.min((room.currentSession?.participants.length || 0) / room.capacity * 100, 100)"
                      :color="roomAvailability[room.id]?.isOvercapacity ? 'warning' : 'success'"
                      height="4"
                    ></v-progress-linear>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!-- Unavailable Rooms -->
          <div v-if="roomsByStatus.unavailable.length > 0" class="mb-6">
            <h3 class="text-h6 mb-3 text-error">
              <v-icon class="mr-2">mdi-close-circle</v-icon>
              Unavailable Rooms ({{ roomsByStatus.unavailable.length }})
            </h3>
            <v-row>
              <v-col
                v-for="room in roomsByStatus.unavailable"
                :key="room.id"
                cols="12"
                sm="6"
                md="4"
                lg="3"
              >
                <v-card variant="outlined" class="h-100" style="opacity: 0.6;">
                  <v-card-title class="text-subtitle-1 pb-2">
                    <v-icon color="error" class="mr-2">mdi-home-city-outline</v-icon>
                    {{ room.name }}
                  </v-card-title>
                  <v-card-text class="pt-0">
                    <div class="text-caption text-grey mb-1">
                      <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                      {{ room.location }}
                    </div>
                    <div class="text-caption text-grey">
                      <v-icon size="small" class="mr-1">mdi-account-group</v-icon>
                      {{ room.capacity }} capacity
                    </div>
                    <v-chip size="small" color="error" class="mt-2">
                      Unavailable
                    </v-chip>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </div>
        
        <!-- No Rooms State -->
        <v-alert v-else-if="!loading" type="info" prominent class="text-center">
          <v-alert-title>No Rooms Configured</v-alert-title>
          <div class="mb-4">Get started by adding your first discussion room. You can add rooms individually or use bulk setup for multiple rooms.</div>
          <v-btn color="primary" @click="startEdit()" class="mr-2">Add First Room</v-btn>
          <v-btn color="secondary" variant="outlined" @click="bulkSetupDialog = true">Bulk Setup</v-btn>
        </v-alert>
      </v-window-item>

      <!-- Manage Rooms Tab -->
      <v-window-item value="manage">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
          <p class="mt-4 text-h6">Loading rooms...</p>
        </div>

        <!-- Rooms Grid -->
        <v-row v-else>
          <v-col
            v-for="room in rooms"
            :key="room.id"
            cols="12"
            md="6"
            lg="4"
            class="d-flex"
          >
            <v-card class="flex-grow-1" elevation="2">
              <v-card-title class="d-flex align-center">
                <v-icon class="mr-2" :color="getRoomStatusColor(room)">
                  {{ room.available ? 'mdi-home-city' : 'mdi-home-city-outline' }}
                </v-icon>
                {{ room.name }}
                <v-spacer></v-spacer>
                <v-chip 
                  :color="getRoomStatusColor(room)" 
                  size="small"
                >
                  {{ getRoomStatusText(room) }}
                </v-chip>
              </v-card-title>
              
              <v-card-subtitle>
                <div class="d-flex align-center gap-2">
                  <v-icon size="small">mdi-account-group</v-icon>
                  <span>{{ room.capacity }} people max</span>
                </div>
                <div class="d-flex align-center gap-2 mt-1">
                  <v-icon size="small">mdi-map-marker</v-icon>
                  <span>{{ room.location }}</span>
                </div>
              </v-card-subtitle>
              
              <v-card-text>
                <p v-if="room.description" class="text-body-2 mb-3">
                  {{ room.description }}
                </p>
                
                <div v-if="room.amenities.length > 0" class="mb-3">
                  <div class="text-subtitle-2 mb-2">Amenities:</div>
                  <v-chip-group>
                    <v-chip
                      v-for="amenity in room.amenities"
                      :key="amenity"
                      size="x-small"
                      :prepend-icon="getAmenityIcon(amenity)"
                      variant="outlined"
                    >
                      {{ getAmenityLabel(amenity) }}
                    </v-chip>
                  </v-chip-group>
                </div>
                
                <div v-if="room.currentSession" class="mb-3">
                  <v-alert type="info" variant="tonal" density="compact">
                    <strong>Current Session:</strong> {{ room.currentSession.topicTitle }}
                    <br>
                    <small>{{ room.currentSession.participants.length }} participants</small>
                  </v-alert>
                </div>
              </v-card-text>
              
              <v-card-actions>
                <v-btn
                  variant="text"
                  prepend-icon="mdi-pencil"
                  @click="startEdit(room)"
                  :disabled="!canEditEvent"
                >
                  Edit
                </v-btn>
                
                <v-btn
                  :variant="room.available ? 'text' : 'tonal'"
                  :prepend-icon="room.available ? 'mdi-pause' : 'mdi-play'"
                  :color="room.available ? 'warning' : 'success'"
                  @click="toggleRoomAvailability(room)"
                  :disabled="!canEditEvent || !!room.currentSession"
                >
                  {{ room.available ? 'Disable' : 'Enable' }}
                </v-btn>
                
                <v-spacer></v-spacer>
                
                <v-btn
                  variant="text"
                  color="error"
                  prepend-icon="mdi-delete"
                  @click="deleteRoom(room)"
                  :disabled="!canEditEvent || !!room.currentSession"
                  size="small"
                >
                  Delete
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>

      <!-- Live Assignments Tab -->
      <v-window-item value="assignments">
        <div v-if="activeRound?.isActive">
          <v-alert type="success" class="mb-6" variant="tonal">
            <v-alert-title>Round {{ activeRound.roundNumber }} Active</v-alert-title>
            Real-time room assignments and capacity monitoring for the current discussion round.
          </v-alert>

          <v-row>
            <v-col
              v-for="group in activeRound.groupAssignments || []"
              :key="group.topicId"
              cols="12"
              md="6"
              lg="4"
            >
              <v-card class="h-100">
                <v-card-title>{{ group.topicTitle }}</v-card-title>
                <v-card-subtitle v-if="group.roomAssignment">
                  <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                  {{ group.roomAssignment }}
                </v-card-subtitle>
                <v-card-text>
                  <div class="d-flex align-center justify-space-between mb-3">
                    <span class="text-body-2">Participants:</span>
                    <v-chip size="small" color="primary">
                      {{ group.participants.length }}
                    </v-chip>
                  </div>
                  
                  <div class="d-flex flex-wrap gap-1">
                    <v-chip
                      v-for="participant in group.participants.slice(0, 8)"
                      :key="participant"
                      size="x-small"
                      variant="outlined"
                    >
                      {{ participant.split('@')[0] }}
                    </v-chip>
                    <v-chip
                      v-if="group.participants.length > 8"
                      size="x-small"
                      variant="outlined"
                    >
                      +{{ group.participants.length - 8 }} more
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
        
        <v-alert v-else type="info" prominent class="text-center">
          <v-alert-title>No Active Round</v-alert-title>
          <div>Room assignments appear here when a discussion round is active.</div>
        </v-alert>
      </v-window-item>
    </v-window>

    <!-- Add/Edit Room Dialog -->
    <v-dialog v-model="roomDialog" max-width="600px">
      <v-card>
        <v-card-title>
          {{ editingRoom ? 'Edit Room' : 'Add New Room' }}
        </v-card-title>
        
        <v-card-text>
          <v-form @submit.prevent="saveRoom">
            <v-text-field
              v-model="newRoom.name"
              label="Room Name"
              :rules="[rules.required]"
              class="mb-4"
            ></v-text-field>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="newRoom.capacity"
                  label="Capacity"
                  type="number"
                  :rules="[rules.minCapacity, rules.maxCapacity]"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="newRoom.available"
                  label="Available"
                  color="success"
                ></v-switch>
              </v-col>
            </v-row>
            
            <v-text-field
              v-model="newRoom.location"
              label="Location"
              :rules="[rules.required]"
              class="mb-4"
            ></v-text-field>
            
            <v-textarea
              v-model="newRoom.description"
              label="Description (Optional)"
              rows="2"
              class="mb-4"
            ></v-textarea>
            
            <div class="mb-4">
              <div class="text-subtitle-1 mb-2">Amenities:</div>
              <v-row>
                <v-col
                  v-for="amenity in AMENITIES"
                  :key="amenity"
                  cols="12"
                  sm="6"
                  md="4"
                >
                  <v-checkbox
                    v-model="newRoom.amenities"
                    :label="getAmenityLabel(amenity)"
                    :value="amenity"
                    density="compact"
                  ></v-checkbox>
                </v-col>
              </v-row>
            </div>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="roomDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            @click="saveRoom"
            :disabled="!newRoom.name || !newRoom.location || newRoom.capacity < 1"
          >
            {{ editingRoom ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Bulk Setup Dialog -->
    <v-dialog v-model="bulkSetupDialog" max-width="500px">
      <v-card>
        <v-card-title>Bulk Room Setup</v-card-title>
        
        <v-card-text>
          <v-form @submit.prevent="createBulkRooms">
            <v-row>
              <v-col cols="8">
                <v-text-field
                  v-model="bulkRooms.prefix"
                  label="Room Name Prefix"
                  placeholder="Room"
                ></v-text-field>
              </v-col>
              <v-col cols="4">
                <v-text-field
                  v-model.number="bulkRooms.startNumber"
                  label="Start Number"
                  type="number"
                  min="1"
                ></v-text-field>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model.number="bulkRooms.count"
                  label="Number of Rooms"
                  type="number"
                  min="1"
                  max="50"
                ></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="bulkRooms.baseCapacity"
                  label="Base Capacity"
                  type="number"
                  min="1"
                  max="200"
                ></v-text-field>
              </v-col>
            </v-row>
            
            <v-text-field
              v-model="bulkRooms.location"
              label="Base Location"
              class="mb-4"
            ></v-text-field>
            
            <div class="mb-4">
              <div class="text-subtitle-2 mb-2">Default Amenities:</div>
              <v-row>
                <v-col
                  v-for="amenity in AMENITIES"
                  :key="amenity"
                  cols="6"
                  md="4"
                >
                  <v-checkbox
                    v-model="bulkRooms.amenities"
                    :label="getAmenityLabel(amenity)"
                    :value="amenity"
                    density="compact"
                  ></v-checkbox>
                </v-col>
              </v-row>
            </div>
            
            <v-alert type="info" variant="tonal" class="text-left">
              This will create {{ bulkRooms.count }} rooms named "{{ bulkRooms.prefix }} {{ bulkRooms.startNumber }}" through "{{ bulkRooms.prefix }} {{ bulkRooms.startNumber + bulkRooms.count - 1 }}"
            </v-alert>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="bulkSetupDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            @click="createBulkRooms"
            :disabled="!bulkRooms.prefix || !bulkRooms.location || bulkRooms.count < 1"
          >
            Create {{ bulkRooms.count }} Rooms
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
/* Room cards hover effects */
.v-card:hover {
  transform: translateY(-2px);
  transition: transform 0.2s ease;
}

/* Progress bar styling */
.v-progress-linear {
  border-radius: 8px;
}

/* Tab content spacing */
.v-window-item {
  min-height: 400px;
}

/* Responsive design */
@media (max-width: 600px) {
  .v-card-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .v-card-actions .v-btn {
    margin-bottom: 8px;
  }
}
</style>
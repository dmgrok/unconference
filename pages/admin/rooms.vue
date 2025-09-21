<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Room } from '~/types/room'
import { AMENITIES } from '~/types/room'

const { user } = useUserSession()
const { eventStatus, isEventActive, isEventInactive, canEditEvent } = useEventStatus()
const rooms = ref<Room[]>([])
const loading = ref(true)
const error = ref('')
const dialog = ref(false)
const editingRoom = ref<Room | null>(null)

const newRoom = ref({
  name: '',
  capacity: 8,
  location: '',
  description: '',
  amenities: [] as string[],
  available: true
})

const rules = {
  required: (v: string) => !!v || 'This field is required',
  minCapacity: (v: number) => v >= 1 || 'Capacity must be at least 1',
  maxCapacity: (v: number) => v <= 200 || 'Capacity cannot exceed 200'
}

async function loadRooms() {
  loading.value = true
  error.value = ''
  
  try {
    const response = await $fetch('/api/admin/rooms')
    rooms.value = response.rooms
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to load rooms'
  } finally {
    loading.value = false
  }
}

function startEdit(room: Room) {
  editingRoom.value = room
  newRoom.value = {
    name: room.name,
    capacity: room.capacity,
    location: room.location,
    description: room.description || '',
    amenities: [...room.amenities],
    available: room.available
  }
  dialog.value = true
}

function startCreate() {
  editingRoom.value = null
  newRoom.value = {
    name: '',
    capacity: 8,
    location: '',
    description: '',
    amenities: [],
    available: true
  }
  dialog.value = true
}

async function saveRoom() {
  if (!newRoom.value.name || !newRoom.value.location || newRoom.value.capacity < 1) {
    return
  }

  try {
    const response = await $fetch('/api/admin/rooms', {
      method: 'POST',
      body: {
        ...newRoom.value,
        id: editingRoom.value?.id
      }
    })
    
    dialog.value = false
    await loadRooms()
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to save room'
  }
}

function getAmenityIcon(amenity: string) {
  const icons: Record<string, string> = {
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
  return icons[amenity] || 'mdi-check'
}

function getAmenityLabel(amenity: string) {
  return amenity.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

onMounted(() => {
  loadRooms()
})

definePageMeta({
  middleware: 'admin',
  requiresAdmin: true
})
</script>

<template>
  <v-container>
    <!-- Event Status Warning -->
    <v-alert
      v-if="isEventInactive"
      type="warning"
      class="mb-4"
      variant="outlined"
    >
      <v-icon>mdi-alert</v-icon>
      Event is currently inactive. Room management may be limited.
      <span v-if="eventStatus.statusReason">{{ eventStatus.statusReason }}</span>
    </v-alert>
    
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 text-primary">Room Management</h1>
      
      <v-btn
        v-if="canEditEvent"
        color="primary"
        prepend-icon="mdi-plus"
        @click="startCreate"
      >
        Add Room
      </v-btn>
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
            <v-icon class="mr-2" :color="room.available ? 'success' : 'error'">
              {{ room.available ? 'mdi-home-city' : 'mdi-home-city-outline' }}
            </v-icon>
            {{ room.name }}
            <v-spacer></v-spacer>
            <v-chip 
              :color="room.available ? 'success' : 'error'" 
              size="small"
            >
              {{ room.available ? 'Available' : 'Unavailable' }}
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
            
            <div v-if="room.amenities.length > 0">
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
            
            <div v-if="room.currentSession" class="mt-3">
              <v-alert type="info" variant="tonal" density="compact">
                <strong>Current Session:</strong> {{ room.currentSession.topicTitle }}
              </v-alert>
            </div>
          </v-card-text>
          
          <v-card-actions v-if="canEditEvent">
            <v-btn
              variant="text"
              prepend-icon="mdi-pencil"
              @click="startEdit(room)"
            >
              Edit
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Add/Edit Room Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
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
          <v-btn color="grey" @click="dialog = false">Cancel</v-btn>
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
  </v-container>
</template>
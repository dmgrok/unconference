<template>
  <v-container class="pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Participant Management</h1>
        <p class="text-body-1 mt-2">Manage participants for {{ currentEvent?.name }}</p>
      </div>
      
      <div class="d-flex gap-2">
        <v-btn color="success" prepend-icon="mdi-email" @click="showInviteDialog = true">
          Invite Participants
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-refresh" @click="loadParticipants">
          Refresh
        </v-btn>
      </div>
    </div>

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card color="primary" variant="elevated">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-account-group</v-icon>
            <div class="text-h4 font-weight-bold">{{ participants.length }}</div>
            <div class="text-body-2">Total Participants</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="success" variant="elevated">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-account-check</v-icon>
            <div class="text-h4 font-weight-bold">{{ activeParticipants }}</div>
            <div class="text-body-2">Active Today</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="info" variant="elevated">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-email</v-icon>
            <div class="text-h4 font-weight-bold">{{ pendingInvites }}</div>
            <div class="text-body-2">Pending Invites</div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="3">
        <v-card color="warning" variant="elevated">
          <v-card-text class="text-center text-white">
            <v-icon size="48" class="mb-2">mdi-account-star</v-icon>
            <div class="text-h4 font-weight-bold">{{ moderators.length }}</div>
            <div class="text-body-2">Moderators</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Participants Table -->
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon class="mr-2">mdi-account-group</v-icon>
          Event Participants
        </div>
        
        <div class="d-flex align-center gap-2">
          <v-text-field
            v-model="searchQuery"
            placeholder="Search participants..."
            density="compact"
            variant="outlined"
            prepend-inner-icon="mdi-magnify"
            style="max-width: 300px;"
          />
          
          <v-select
            v-model="roleFilter"
            :items="roleFilterOptions"
            density="compact"
            variant="outlined"
            style="max-width: 150px;"
          />
        </div>
      </v-card-title>
      
      <v-data-table
        :headers="participantHeaders"
        :items="filteredParticipants"
        :loading="loading"
        item-value="id"
      >
        <template #item.name="{ item }">
          <div class="d-flex align-center">
            <v-avatar :color="getStatusColor(item.status)" size="32" class="mr-3">
              <v-icon size="16" color="white">
                {{ getStatusIcon(item.status) }}
              </v-icon>
            </v-avatar>
            
            <div>
              <div class="font-weight-medium">{{ item.name }}</div>
              <div class="text-caption text-grey">{{ item.email }}</div>
            </div>
          </div>
        </template>
        
        <template #item.role="{ item }">
          <v-chip
            :color="getRoleColor(item.role)"
            size="small"
            variant="tonal"
          >
            {{ item.role }}
          </v-chip>
        </template>
        
        <template #item.joinedAt="{ item }">
          {{ formatDateTime(item.joinedAt) }}
        </template>
        
        <template #item.lastActive="{ item }">
          <div v-if="item.lastActive">
            {{ formatDateTime(item.lastActive) }}
          </div>
          <div v-else class="text-grey">Never</div>
        </template>
        
        <template #item.actions="{ item }">
          <v-menu>
            <template #activator="{ props }">
              <v-btn
                icon="mdi-dots-vertical"
                size="small"
                variant="text"
                v-bind="props"
              />
            </template>
            
            <v-list density="compact">
              <v-list-item @click="changeRole(item)">
                <v-list-item-title>Change Role</v-list-item-title>
              </v-list-item>
              
              <v-list-item @click="sendMessage(item)">
                <v-list-item-title>Send Message</v-list-item-title>
              </v-list-item>
              
              <v-list-item 
                v-if="item.status === 'active'"
                @click="suspendParticipant(item)"
                class="text-warning"
              >
                <v-list-item-title>Suspend</v-list-item-title>
              </v-list-item>
              
              <v-list-item 
                v-else-if="item.status === 'suspended'"
                @click="reactivateParticipant(item)"
                class="text-success"
              >
                <v-list-item-title>Reactivate</v-list-item-title>
              </v-list-item>
              
              <v-divider />
              
              <v-list-item 
                @click="removeParticipant(item)"
                class="text-error"
              >
                <v-list-item-title>Remove</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table>
    </v-card>

    <!-- Invite Dialog -->
    <v-dialog v-model="showInviteDialog" max-width="600">
      <v-card>
        <v-card-title>Invite Participants</v-card-title>
        
        <v-card-text>
          <v-tabs v-model="inviteTab">
            <v-tab value="email">Email Invites</v-tab>
            <v-tab value="bulk">Bulk Import</v-tab>
            <v-tab value="share">Share Links</v-tab>
          </v-tabs>
          
          <v-window v-model="inviteTab" class="mt-4">
            <!-- Email Tab -->
            <v-window-item value="email">
              <v-textarea
                v-model="inviteEmails"
                label="Email Addresses"
                placeholder="Enter email addresses, one per line or separated by commas"
                rows="4"
                variant="outlined"
              />
              
              <v-select
                v-model="inviteRole"
                :items="roleOptions"
                label="Assign Role"
                variant="outlined"
              />
              
              <v-textarea
                v-model="inviteMessage"
                label="Custom Message (Optional)"
                placeholder="Add a personal message to the invitation..."
                rows="3"
                variant="outlined"
              />
            </v-window-item>
            
            <!-- Bulk Import Tab -->
            <v-window-item value="bulk">
              <v-file-input
                v-model="csvFile"
                label="Upload CSV File"
                accept=".csv"
                variant="outlined"
                prepend-icon="mdi-file-delimited"
              />
              
              <v-alert type="info" variant="tonal" class="mt-4">
                <v-alert-title>CSV Format</v-alert-title>
                <div>
                  Expected columns: Name, Email, Role (optional)
                  <br>
                  Example: John Doe, john@example.com, Participant
                </div>
              </v-alert>
            </v-window-item>
            
            <!-- Share Links Tab -->
            <v-window-item value="share">
              <div class="mb-4">
                <h3 class="text-h6 mb-2">Event Code</h3>
                <v-text-field
                  :value="currentEvent?.code"
                  label="Event Code"
                  readonly
                  append-icon="mdi-content-copy"
                  variant="outlined"
                  @click:append="copyToClipboard(currentEvent?.code)"
                />
              </div>
              
              <div class="mb-4">
                <h3 class="text-h6 mb-2">Direct Join Link</h3>
                <v-text-field
                  :value="joinUrl"
                  label="Join URL"
                  readonly
                  append-icon="mdi-content-copy"
                  variant="outlined"
                  @click:append="copyToClipboard(joinUrl)"
                />
              </div>
              
              <v-btn 
                color="primary" 
                prepend-icon="mdi-qrcode" 
                @click="generateQRCode"
                :loading="generatingQR"
              >
                Generate QR Code
              </v-btn>
              
              <div v-if="qrCodeUrl" class="mt-4 text-center">
                <img :src="qrCodeUrl" alt="Event QR Code" style="max-width: 200px;" />
              </div>
            </v-window-item>
          </v-window>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showInviteDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            @click="sendInvites"
            :loading="sendingInvites"
          >
            {{ inviteTab === 'share' ? 'Done' : 'Send Invites' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Role Change Dialog -->
    <v-dialog v-model="showRoleDialog" max-width="400">
      <v-card v-if="selectedParticipant">
        <v-card-title>Change Role</v-card-title>
        
        <v-card-text>
          <p class="mb-4">
            Change role for {{ selectedParticipant.name }}?
          </p>
          
          <v-select
            v-model="newRole"
            :items="roleOptions"
            label="New Role"
            variant="outlined"
          />
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showRoleDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="confirmRoleChange">Update</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'authenticated',
  layout: 'multi-event'
})

interface Participant {
  id: string
  name: string
  email: string
  role: 'Organizer' | 'Moderator' | 'Participant' | 'Guest'
  status: 'active' | 'suspended' | 'pending'
  joinedAt: string
  lastActive?: string
}

const { currentEventId } = useEventContext()
const currentEvent = inject('currentEvent') as any

// Data
const participants = ref<Participant[]>([])
const loading = ref(false)
const searchQuery = ref('')
const roleFilter = ref('all')
const showInviteDialog = ref(false)
const showRoleDialog = ref(false)
const selectedParticipant = ref<Participant | null>(null)
const newRole = ref('')

// Invite form data
const inviteTab = ref('email')
const inviteEmails = ref('')
const inviteRole = ref('Participant')
const inviteMessage = ref('')
const csvFile = ref(null)
const sendingInvites = ref(false)
const generatingQR = ref(false)
const qrCodeUrl = ref('')

// Computed
const activeParticipants = computed(() => 
  participants.value.filter(p => p.status === 'active').length
)

const pendingInvites = computed(() => 
  participants.value.filter(p => p.status === 'pending').length
)

const moderators = computed(() => 
  participants.value.filter(p => p.role === 'Moderator')
)

const joinUrl = computed(() => {
  if (!currentEvent?.code) return ''
  return `${window.location.origin}/quick-join?code=${currentEvent.code}`
})

const filteredParticipants = computed(() => {
  let filtered = participants.value

  // Search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.email.toLowerCase().includes(query)
    )
  }

  // Role filter
  if (roleFilter.value !== 'all') {
    filtered = filtered.filter(p => p.role === roleFilter.value)
  }

  return filtered
})

// Table configuration
const participantHeaders = [
  { title: 'Participant', value: 'name', sortable: true },
  { title: 'Role', value: 'role', sortable: true },
  { title: 'Joined', value: 'joinedAt', sortable: true },
  { title: 'Last Active', value: 'lastActive', sortable: true },
  { title: 'Actions', value: 'actions', sortable: false }
]

const roleFilterOptions = [
  { title: 'All Roles', value: 'all' },
  { title: 'Organizers', value: 'Organizer' },
  { title: 'Moderators', value: 'Moderator' },
  { title: 'Participants', value: 'Participant' },
  { title: 'Guests', value: 'Guest' }
]

const roleOptions = [
  { title: 'Participant', value: 'Participant' },
  { title: 'Moderator', value: 'Moderator' },
  { title: 'Organizer', value: 'Organizer' }
]

// Methods
async function loadParticipants() {
  if (!currentEventId.value) return
  
  loading.value = true
  try {
    const response = await $fetch(`/api/events/${currentEventId.value}/participants`) as any
    participants.value = response.participants || []
  } catch (error) {
    console.error('Failed to load participants:', error)
  } finally {
    loading.value = false
  }
}

function getStatusColor(status: string) {
  const colors = {
    active: 'success',
    suspended: 'warning',
    pending: 'info'
  }
  return colors[status] || 'grey'
}

function getStatusIcon(status: string) {
  const icons = {
    active: 'mdi-check',
    suspended: 'mdi-pause',
    pending: 'mdi-clock'
  }
  return icons[status] || 'mdi-help'
}

function getRoleColor(role: string) {
  const colors = {
    Organizer: 'primary',
    Moderator: 'secondary',
    Participant: 'success',
    Guest: 'info'
  }
  return colors[role] || 'grey'
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString()
}

function changeRole(participant: Participant) {
  selectedParticipant.value = participant
  newRole.value = participant.role
  showRoleDialog.value = true
}

async function confirmRoleChange() {
  if (!selectedParticipant.value || !currentEventId.value) return
  
  try {
    await $fetch(`/api/events/${currentEventId.value}/participants/${selectedParticipant.value.id}/role`, {
      method: 'PUT',
      body: { role: newRole.value }
    })
    
    showRoleDialog.value = false
    await loadParticipants()
  } catch (error) {
    console.error('Failed to change role:', error)
    alert('Failed to change participant role')
  }
}

async function sendInvites() {
  if (inviteTab.value === 'share') {
    showInviteDialog.value = false
    return
  }
  
  if (!currentEventId.value) return
  
  sendingInvites.value = true
  try {
    let emailList = []
    
    if (inviteTab.value === 'email') {
      emailList = inviteEmails.value
        .split(/[,\n]/)
        .map(email => email.trim())
        .filter(email => email)
    } else if (inviteTab.value === 'bulk' && csvFile.value) {
      // Parse CSV file (simplified)
      const text = await csvFile.value.text()
      const lines = text.split('\n')
      emailList = lines
        .slice(1) // Skip header
        .map(line => line.split(',')[1]?.trim())
        .filter(email => email)
    }
    
    await $fetch(`/api/events/${currentEventId.value}/invites`, {
      method: 'POST',
      body: {
        emails: emailList,
        role: inviteRole.value,
        message: inviteMessage.value
      }
    })
    
    showInviteDialog.value = false
    inviteEmails.value = ''
    inviteMessage.value = ''
    csvFile.value = null
    
    await loadParticipants()
  } catch (error) {
    console.error('Failed to send invites:', error)
    alert('Failed to send invitations')
  } finally {
    sendingInvites.value = false
  }
}

async function generateQRCode() {
  if (!currentEventId.value) return
  
  generatingQR.value = true
  try {
    const response = await $fetch(`/api/events/${currentEventId.value}/qr-code`, {
      method: 'POST'
    }) as any
    
    qrCodeUrl.value = response.qrCodeDataUrl
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    alert('Failed to generate QR code')
  } finally {
    generatingQR.value = false
  }
}

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    // Show success toast
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

function sendMessage(participant: Participant) {
  // Implement messaging functionality
  console.log('Send message to:', participant)
}

async function suspendParticipant(participant: Participant) {
  const confirmed = confirm(`Suspend ${participant.name}?`)
  if (!confirmed) return
  
  try {
    await $fetch(`/api/events/${currentEventId.value}/participants/${participant.id}/suspend`, {
      method: 'POST'
    })
    await loadParticipants()
  } catch (error) {
    console.error('Failed to suspend participant:', error)
    alert('Failed to suspend participant')
  }
}

async function reactivateParticipant(participant: Participant) {
  try {
    await $fetch(`/api/events/${currentEventId.value}/participants/${participant.id}/reactivate`, {
      method: 'POST'
    })
    await loadParticipants()
  } catch (error) {
    console.error('Failed to reactivate participant:', error)
    alert('Failed to reactivate participant')
  }
}

async function removeParticipant(participant: Participant) {
  const confirmed = confirm(`Remove ${participant.name} from the event?`)
  if (!confirmed) return
  
  try {
    await $fetch(`/api/events/${currentEventId.value}/participants/${participant.id}`, {
      method: 'DELETE'
    })
    await loadParticipants()
  } catch (error) {
    console.error('Failed to remove participant:', error)
    alert('Failed to remove participant')
  }
}

onMounted(() => {
  loadParticipants()
})
</script>

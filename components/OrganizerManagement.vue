<template>
  <v-card>
    <v-card-title class="d-flex align-center justify-space-between">
      <span>Event Organizers</span>
      <v-btn
        v-if="canManageOrganizers"
        color="primary"
        prepend-icon="mdi-account-plus"
        @click="showInviteDialog = true"
        size="small"
      >
        Add Organizer
      </v-btn>
    </v-card-title>
    
    <v-card-text>
      <v-list v-if="organizers.length > 0">
        <v-list-item
          v-for="organizer in organizers"
          :key="organizer.id"
        >
          <template #prepend>
            <v-avatar color="primary">
              <v-icon>mdi-account</v-icon>
            </v-avatar>
          </template>
          
          <v-list-item-title>{{ organizer.name }}</v-list-item-title>
          <v-list-item-subtitle>
            {{ organizer.email }}
            <v-chip
              v-if="organizer.isPrimary"
              color="primary"
              size="x-small"
              class="ml-2"
            >
              Primary
            </v-chip>
          </v-list-item-subtitle>
          
          <template #append>
            <v-btn
              v-if="canRemoveOrganizer(organizer)"
              icon="mdi-account-minus"
              size="small"
              color="error"
              variant="text"
              @click="confirmRemoveOrganizer(organizer)"
              :title="`Remove ${organizer.name} as organizer`"
            />
          </template>
        </v-list-item>
      </v-list>
      
      <div v-else class="text-center py-4">
        <v-icon size="48" color="grey-lighten-1">mdi-account-group</v-icon>
        <p class="text-body-2 mt-2">No organizers found</p>
      </div>
    </v-card-text>

    <!-- Invite Organizer Dialog -->
    <v-dialog v-model="showInviteDialog" max-width="500">
      <v-card>
        <v-card-title>Add Organizer</v-card-title>
        
        <v-card-text>
          <v-form ref="inviteForm" v-model="inviteFormValid">
            <v-text-field
              v-model="inviteEmail"
              label="Email Address *"
              type="email"
              :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'Valid email required']"
              required
            />
            
            <v-textarea
              v-model="inviteMessage"
              label="Optional Message"
              rows="3"
              placeholder="You've been invited to help organize this event..."
            />
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="cancelInvite">Cancel</v-btn>
          <v-btn 
            color="primary" 
            :disabled="!inviteFormValid"
            :loading="inviting"
            @click="inviteOrganizer"
          >
            Add Organizer
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Remove Confirmation Dialog -->
    <v-dialog v-model="showRemoveDialog" max-width="400">
      <v-card v-if="organizerToRemove">
        <v-card-title class="text-h6">Remove Organizer</v-card-title>
        
        <v-card-text>
          Are you sure you want to remove <strong>{{ organizerToRemove.name }}</strong> as an organizer?
          They will become a regular participant.
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showRemoveDialog = false">Cancel</v-btn>
          <v-btn 
            color="error" 
            :loading="removing"
            @click="removeOrganizer"
          >
            Remove
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
interface Organizer {
  id: string
  name: string
  email: string
  isPrimary?: boolean
  joinedAt: string
}

interface Props {
  eventId: string
  userRole?: string
  currentUserId?: string
}

const props = defineProps<Props>()

// Data
const organizers = ref<Organizer[]>([])
const loading = ref(false)
const showInviteDialog = ref(false)
const showRemoveDialog = ref(false)
const inviteFormValid = ref(false)
const inviting = ref(false)
const removing = ref(false)
const inviteEmail = ref('')
const inviteMessage = ref('')
const organizerToRemove = ref<Organizer | null>(null)

// Computed
const canManageOrganizers = computed(() => {
  return props.userRole === 'Organizer'
})

// Methods
async function loadOrganizers() {
  loading.value = true
  try {
    const response = await $fetch(`/api/events/${props.eventId}/organizers`) as any
    organizers.value = response.organizers || []
  } catch (error) {
    console.error('Failed to load organizers:', error)
  } finally {
    loading.value = false
  }
}

async function inviteOrganizer() {
  if (!inviteFormValid.value) return
  
  inviting.value = true
  try {
    const response = await $fetch(`/api/events/${props.eventId}/organizers/invite`, {
      method: 'POST',
      body: {
        email: inviteEmail.value,
        message: inviteMessage.value
      }
    }) as any
    
    if (response.success) {
      showInviteDialog.value = false
      resetInviteForm()
      await loadOrganizers()
      
      // Show success message
      // You can emit an event or use a toast notification here
    }
  } catch (error: any) {
    console.error('Failed to invite organizer:', error)
    // Show error message
    alert(error.data?.message || 'Failed to invite organizer')
  } finally {
    inviting.value = false
  }
}

function canRemoveOrganizer(organizer: Organizer): boolean {
  if (!canManageOrganizers.value) return false
  if (organizer.isPrimary) return false // Cannot remove primary organizer
  if (organizer.id === props.currentUserId) return false // Cannot remove self
  return true
}

function confirmRemoveOrganizer(organizer: Organizer) {
  organizerToRemove.value = organizer
  showRemoveDialog.value = true
}

async function removeOrganizer() {
  if (!organizerToRemove.value) return
  
  removing.value = true
  try {
    const response = await $fetch(`/api/events/${props.eventId}/organizers/${organizerToRemove.value.id}/remove`, {
      method: 'DELETE'
    }) as any
    
    if (response.success) {
      showRemoveDialog.value = false
      organizerToRemove.value = null
      await loadOrganizers()
    }
  } catch (error: any) {
    console.error('Failed to remove organizer:', error)
    alert(error.data?.message || 'Failed to remove organizer')
  } finally {
    removing.value = false
  }
}

function cancelInvite() {
  showInviteDialog.value = false
  resetInviteForm()
}

function resetInviteForm() {
  inviteEmail.value = ''
  inviteMessage.value = ''
  inviteFormValid.value = false
}

// Load organizers on mount
onMounted(() => {
  loadOrganizers()
})

// Watch for eventId changes
watch(() => props.eventId, () => {
  if (props.eventId) {
    loadOrganizers()
  }
})
</script>

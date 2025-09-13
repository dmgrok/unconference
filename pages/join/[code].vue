<template>
  <div>
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 100vh;">
      <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
      <div class="ml-4">
        <p class="text-h6">Joining event...</p>
        <p class="text-body-2">{{ loadingMessage }}</p>
      </div>
    </div>
    
    <div v-else-if="showParticipantLimitError" class="d-flex justify-center align-center" style="height: 100vh;">
      <v-card max-width="600" class="pa-6">
        <v-card-title class="text-center">
          <v-icon size="48" color="warning" class="mb-2">mdi-account-group</v-icon>
          <h2>Event is Full</h2>
        </v-card-title>
        <v-card-text class="text-center">
          <p class="text-body-1 mb-4">
            This event has reached its participant limit of {{ participantLimitData?.maxParticipants }} people.
          </p>
          
          <v-alert color="info" variant="tonal" class="mb-4">
            <div class="text-body-2">
              <strong>Good news!</strong> The event organizer can upgrade to a commercial license to remove this limit and allow unlimited participants.
            </div>
          </v-alert>

          <div class="mb-4">
            <v-chip color="success" size="large">
              <v-icon start>mdi-account-multiple</v-icon>
              {{ participantLimitData?.participantCount || 49 }} / {{ participantLimitData?.maxParticipants || 49 }}
            </v-chip>
          </div>

          <div class="mt-6">
            <v-btn color="primary" @click="navigateTo('/pricing')" class="mr-2" size="large">
              <v-icon start>mdi-arrow-up-bold</v-icon>
              Learn About Upgrade
            </v-btn>
            <v-btn variant="outlined" @click="navigateTo('/')" size="large">
              Go Home
            </v-btn>
          </div>

          <div class="mt-4">
            <p class="text-caption text-grey">
              Tell the event organizer they can remove participant limits by upgrading to a commercial license.
            </p>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <div v-else-if="error" class="d-flex justify-center align-center" style="height: 100vh;">
      <v-card max-width="500" class="pa-6">
        <v-card-title class="text-center">
          <v-icon size="48" color="error" class="mb-2">mdi-alert-circle</v-icon>
          <h2>Unable to Join Event</h2>
        </v-card-title>
        <v-card-text class="text-center">
          <p>{{ error }}</p>
          <div class="mt-4">
            <v-btn color="primary" @click="navigateTo('/login')" class="mr-2">
              Sign In
            </v-btn>
            <v-btn variant="outlined" @click="navigateTo('/')">
              Go Home
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'public'
})

const route = useRoute()
const { loggedIn } = useUserSession()

const eventCode = route.params.code as string
const loading = ref(true)
const error = ref('')
const loadingMessage = ref('Validating event code...')
const showParticipantLimitError = ref(false)
const participantLimitData = ref<any>(null)

onMounted(async () => {
  if (!eventCode) {
    error.value = 'No event code provided'
    loading.value = false
    return
  }

  try {
    // Check if event exists
    loadingMessage.value = `Checking event ${eventCode.toUpperCase()}...`
    
    const eventResponse = await $fetch(`/api/events/by-code/${eventCode.toUpperCase()}`) as { success: boolean, event?: any }
    
    if (!eventResponse.success) {
      error.value = 'Event not found. Please check the event code.'
      loading.value = false
      return
    }

    const event = eventResponse.event
    loadingMessage.value = `Found "${event.name}". Preparing to join...`

    if (loggedIn.value) {
      // User is logged in, redirect to voting with event context
      loadingMessage.value = 'Joining event...'
      await navigateTo(`/voting?eventId=${event.id}&autoJoin=true`)
    } else {
      // User not logged in, redirect to login with event code
      loadingMessage.value = 'Redirecting to login...'
      await navigateTo(`/login?code=${eventCode.toUpperCase()}`)
    }
  } catch (err: any) {
    console.error('Error joining event:', err)
    if (err.status === 404) {
      error.value = `Event "${eventCode.toUpperCase()}" not found. Please check the event code.`
    } else if (err.status === 403) {
      // Check if this is a participant limit error
      if (err.data?.upgradeRequired) {
        showParticipantLimitError.value = true
        participantLimitData.value = err.data
        return
      }
      error.value = 'This event does not allow new participants.'
    } else {
      error.value = 'Unable to join event. Please try again later.'
    }
    loading.value = false
  }
})
</script>

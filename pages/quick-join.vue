<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const { loggedIn } = useUserSession()

const eventCode = ref('')
const guestName = ref('')
const isLoading = ref(false)
const error = ref('')

// Get event code from URL parameter
onMounted(() => {
  const code = route.query.code as string
  if (code) {
    eventCode.value = code.toUpperCase()
  }
  
  // If user is already logged in, redirect to dashboard
  if (loggedIn.value) {
    router.push('/dashboard')
  }
})

async function joinAsGuest() {
  if (!eventCode.value) {
    error.value = 'Event code is required'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const response = await $fetch('/api/auth/guest-join', {
      method: 'POST',
      body: {
        eventCode: eventCode.value,
        name: guestName.value || undefined
      }
    })

    // Refresh the user session
    await $fetch('/api/auth/session')
    
    // Redirect to dashboard
    await router.push('/dashboard')
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to join event'
  } finally {
    isLoading.value = false
  }
}

const eventCodeRules = [
  (v: string) => !!v || 'Event code is required',
  (v: string) => (v && v.length >= 4) || 'Event code must be at least 4 characters'
]
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="pa-4">
          <v-card-title class="text-center">
            <div class="d-flex flex-column align-center">
              <v-icon size="48" color="primary" class="mb-2">mdi-ticket-confirmation</v-icon>
              <h2>Join Any Unconference Event</h2>
            </div>
          </v-card-title>
          
          <v-card-text>
            <p class="text-center text-grey mb-4">
              Enter your event code to join the discussion instantly!
            </p>

            <v-alert type="info" variant="tonal" class="mb-4">
              <v-alert-title class="d-flex align-center">
                <v-icon class="mr-2">mdi-information</v-icon>
                How to find your event code
              </v-alert-title>
              <ul class="mt-2 text-body-2">
                <li>Look for QR codes at the event venue</li>
                <li>Check your invitation email or message</li>
                <li>Ask event organizers for the code</li>
                <li>Examples: DEMO2024, CONF2025, SUMMIT25</li>
              </ul>
            </v-alert>

            <v-form @submit.prevent="joinAsGuest">
              <v-text-field
                v-model="eventCode"
                label="Event Code"
                :rules="eventCodeRules"
                variant="outlined"
                class="mb-4"
                :disabled="!!route.query.code"
                hint="Enter the event code provided by the organizer"
                prepend-inner-icon="mdi-ticket-confirmation"
                style="text-transform: uppercase;"
                @input="eventCode = eventCode.toUpperCase()"
              />

              <v-text-field
                v-model="guestName"
                label="Your Name (Optional)"
                variant="outlined"
                class="mb-4"
                hint="Leave blank for a random generated name"
                prepend-inner-icon="mdi-account"
              />

              <v-alert
                v-if="error"
                type="error"
                class="mb-4"
              >
                {{ error }}
              </v-alert>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                :loading="isLoading"
                @click="joinAsGuest"
              >
                Join Event
              </v-btn>
            </v-form>

            <v-divider class="my-6" />

            <div class="text-center">
              <p class="text-grey mb-2">Already have an account?</p>
              <v-btn
                variant="text"
                color="primary"
                @click="$router.push('/login')"
              >
                Sign In
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
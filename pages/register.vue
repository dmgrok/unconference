<template>
  <div class="d-flex flex-column align-center justify-center" style="min-height: 100vh;">
    <v-card max-width="500" class="pa-6" elevation="8">
      <v-card-title class="text-center mb-4">
        <v-icon size="40" color="primary" class="mb-2">mdi-account-plus</v-icon>
        <h2>Create Account</h2>
        <p class="text-body-2 text-grey-darken-1 mt-2">
          Join the unconference platform to create and participate in events
        </p>
      </v-card-title>

      <v-card-text>
        <v-form ref="form" v-model="formValid" @submit.prevent="register">
          <v-text-field
            v-model="registrationData.name"
            label="Full Name *"
            prepend-inner-icon="mdi-account"
            :rules="[v => !!v || 'Name is required', v => v.length >= 2 || 'Name must be at least 2 characters']"
            required
            variant="outlined"
            class="mb-3"
          />

          <v-text-field
            v-model="registrationData.email"
            label="Email Address *"
            type="email"
            prepend-inner-icon="mdi-email"
            :rules="[
              v => !!v || 'Email is required',
              v => /.+@.+\..+/.test(v) || 'Valid email required'
            ]"
            required
            variant="outlined"
            class="mb-3"
          />

          <v-text-field
            v-model="registrationData.password"
            label="Password *"
            type="password"
            prepend-inner-icon="mdi-lock"
            :rules="[
              v => !!v || 'Password is required',
              v => v.length >= 8 || 'Password must be at least 8 characters'
            ]"
            required
            variant="outlined"
            class="mb-3"
          />

          <v-text-field
            v-model="confirmPassword"
            label="Confirm Password *"
            type="password"
            prepend-inner-icon="mdi-lock-check"
            :rules="[
              v => !!v || 'Please confirm your password',
              v => v === registrationData.password || 'Passwords do not match'
            ]"
            required
            variant="outlined"
            class="mb-4"
          />

          <v-alert
            v-if="registrationError"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ registrationError }}
          </v-alert>

          <v-btn
            type="submit"
            color="primary"
            block
            size="large"
            :loading="registering"
            :disabled="!formValid"
            prepend-icon="mdi-account-plus"
          >
            Create Account
          </v-btn>
        </v-form>
      </v-card-text>

      <v-card-actions class="justify-center">
        <p class="text-body-2">
          Already have an account?
          <nuxt-link to="/login" class="text-primary text-decoration-none">
            Sign in here
          </nuxt-link>
        </p>
      </v-card-actions>

      <v-divider class="my-4" />

      <div class="text-center">
        <p class="text-body-2 text-grey-darken-1 mb-3">
          Or join as a guest
        </p>
        <v-btn
          variant="outlined"
          to="/quick-join"
          prepend-icon="mdi-ticket-confirmation"
        >
          Join Event as Guest
        </v-btn>
      </div>
    </v-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'public'
})

const { fetch: refreshSession } = useUserSession()

// Form data
const registrationData = reactive({
  name: '',
  email: '',
  password: ''
})

const confirmPassword = ref('')
const formValid = ref(false)
const registering = ref(false)
const registrationError = ref('')

// Form reference
const form = ref()

// Registration function
async function register() {
  if (!formValid.value) return

  registering.value = true
  registrationError.value = ''

  try {
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: registrationData
    }) as any

    if (response.success) {
      // Refresh the session and redirect
      await refreshSession()
      
      // Show success message briefly
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Redirect to events page or voting
      await navigateTo('/events')
    }
  } catch (error: any) {
    console.error('Registration failed:', error)
    registrationError.value = error.data?.message || 'Registration failed. Please try again.'
  } finally {
    registering.value = false
  }
}

// Clear error when user starts typing
watch(() => registrationData.email, () => {
  if (registrationError.value) {
    registrationError.value = ''
  }
})
</script>

<style scoped>
.v-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
}
</style>

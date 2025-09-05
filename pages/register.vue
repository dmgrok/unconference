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
            :rules="nameRules"
            required
            variant="outlined"
            class="mb-3"
          />

          <v-text-field
            v-model="registrationData.email"
            label="Email Address *"
            type="email"
            prepend-inner-icon="mdi-email"
            :rules="emailRules"
            required
            variant="outlined"
            class="mb-3"
          />

          <v-text-field
            v-model="registrationData.password"
            label="Password *"
            type="password"
            prepend-inner-icon="mdi-lock"
            :rules="passwordRules"
            required
            variant="outlined"
            class="mb-3"
          />

          <v-text-field
            v-model="confirmPassword"
            label="Confirm Password *"
            type="password"
            prepend-inner-icon="mdi-lock-check"
            :rules="confirmPasswordRules"
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

          <v-alert
            v-if="registrationSuccess"
            type="success"
            variant="tonal"
            class="mb-4"
          >
            {{ registrationSuccess }}
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
const route = useRoute()

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
const registrationSuccess = ref('')

// Form reference
const form = ref()

// Validation rules (defined once to avoid recreation)
const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(v) || 'Valid email required'
  }
]

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 8 || 'Password must be at least 8 characters'
]

const nameRules = [
  (v: string) => !!v || 'Name is required',
  (v: string) => v.length >= 2 || 'Name must be at least 2 characters'
]

const confirmPasswordRules = [
  (v: string) => !!v || 'Please confirm your password',
  (v: string) => v === registrationData.password || 'Passwords do not match'
]

// Add error handling for reactivity issues
onErrorCaptured((error) => {
  console.error('Component error:', error)
  return false
})

// Registration function
async function register() {
  if (!formValid.value) return

  registering.value = true
  registrationError.value = ''
  registrationSuccess.value = ''

  try {
    const eventCode = (route.query.code as string) || (route.query.eventCode as string)
    const redirectTo = route.query.redirect as string
    
    const response = await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        ...registrationData,
        eventCode: eventCode?.toUpperCase(),
        redirectTo
      }
    }) as any

    if (response.success) {
      // Show success message
      registrationSuccess.value = `Account created successfully! Welcome, ${response.user.name}. Redirecting...`
      
      // Refresh the session to make sure it's properly established
      await refreshSession()
      
      // Wait longer to ensure session is established and show success message
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Use smart routing to determine where to go
      try {
        const routingResponse = await $fetch('/api/auth/post-login-redirect') as { redirect: string, reason: string }
        await navigateTo(routingResponse.redirect)
      } catch (error) {
        console.warn('Failed to get smart redirect, falling back:', error)
        await navigateTo('/voting')
      }
    } else {
      registrationError.value = response.message || 'Registration failed. Please try again.'
    }
  } catch (error: any) {
    console.error('Registration failed:', error)
    registrationError.value = error.data?.message || error.message || 'Registration failed. Please try again.'
  } finally {
    registering.value = false
  }
}

// Clear error and success messages when user starts typing in any field
watch(() => [registrationData.email, registrationData.name, registrationData.password, confirmPassword.value], () => {
  if (registrationError.value) {
    registrationError.value = ''
  }
  if (registrationSuccess.value) {
    registrationSuccess.value = ''
  }
}, { flush: 'post' })
</script>

<style scoped>
.v-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
}
</style>

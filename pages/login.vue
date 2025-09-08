<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'public'
})

const route = useRoute()
const router = useRouter()
const { fetch: refreshSession } = useUserSession()

// Form state
const isLogin = ref(true)
const loading = ref(false)
const guestLoading = ref(false)

// Login form
const loginForm = ref({
  email: '',
  password: ''
})

// Registration form
const registerForm = ref({
  name: '',
  email: '',
  eventCode: '',
  nickname: ''
})

// Guest form
const guestForm = ref({
  eventCode: ''
})

// Error handling
const error = ref('')
const success = ref('')

// Get redirect URL from query params
const redirectUrl = computed(() => {
  // If user is selecting an event, add the select parameter
  const defaultRedirect = route.query.fromEventSelection === 'true' ? '/events?select=true' : '/events'
  return route.query.redirect?.toString() || defaultRedirect
})

// Check for OAuth errors
onMounted(() => {
  if (route.query.error === 'oauth_failed') {
    error.value = 'OAuth authentication failed. Please try again.'
  }
  
  // Pre-fill event code if provided
  if (route.query.eventCode) {
    registerForm.value.eventCode = route.query.eventCode.toString()
    guestForm.value.eventCode = route.query.eventCode.toString()
  }
})

async function handleLogin() {
  if (!loginForm.value.email || !loginForm.value.password) {
    error.value = 'Please fill in all fields'
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    const response = await $fetch('/api/auth/email/login', {
      method: 'POST',
      body: loginForm.value
    })
    
    success.value = response.message
    
    // Refresh the session on client-side to update authentication state
    await refreshSession()
    
    await router.push(redirectUrl.value)
  } catch (err: any) {
    error.value = err.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}

async function handleRegister() {
  if (!registerForm.value.name || !registerForm.value.email) {
    error.value = 'Please fill in your name and email'
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    const response = await $fetch('/api/auth/email/register', {
      method: 'POST',
      body: registerForm.value
    })
    
    success.value = response.message
    // Redirect to verification page with email
    await router.push(`/verify?email=${encodeURIComponent(registerForm.value.email)}`)
  } catch (err: any) {
    if (err.data?.data) {
      // Zod validation errors
      error.value = err.data.data.map((e: any) => e.message).join(', ')
    } else {
      error.value = err.data?.message || 'Registration failed'
    }
  } finally {
    loading.value = false
  }
}

async function handleGuestJoin() {
  if (!guestForm.value.eventCode) {
    error.value = 'Please enter an event code'
    return
  }

  guestLoading.value = true
  error.value = ''
  
  try {
    const response = await $fetch('/api/auth/guest', {
      method: 'POST',
      body: guestForm.value
    })
    
    success.value = response.message
    
    // Refresh the session on client-side to update authentication state
    await refreshSession()
    
    // For guest users, redirect to their current event or events page
    await router.push(guestForm.value.eventCode ? '/voting' : '/events')
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to join event'
  } finally {
    guestLoading.value = false
  }
}

function handleOAuthLogin(provider: 'github' | 'google') {
  const authUrl = `/api/auth/${provider}?redirect=${encodeURIComponent(redirectUrl.value)}`
  window.location.href = authUrl
}

useSeoMeta({
  title: 'Login - Unconference',
  description: 'Sign in to access your unconference events and manage discussions.',
})
</script>

<template>
  <div class="login-page">
    <v-container class="d-flex align-center justify-center min-vh-100">
      <v-row justify="center">
        <v-col cols="12" sm="10" md="8" lg="6" xl="4">
          <v-card class="login-card" elevation="12">
            <!-- Header -->
            <v-card-title class="login-header text-center">
              <div class="login-logo mb-4">
                <v-icon size="48" color="primary">mdi-account-group</v-icon>
              </div>
              <h1 class="login-title">
                {{ isLogin ? 'Welcome Back' : 'Join Unconference' }}
              </h1>
              <p class="login-subtitle">
                {{ isLogin ? 'Sign in to access your events' : 'Create your account to get started' }}
              </p>
            </v-card-title>

            <v-card-text class="px-8 pb-4">
              <!-- Alert Messages -->
              <v-alert
                v-if="error"
                type="error"
                variant="tonal"
                class="mb-4"
                closable
                @click:close="error = ''"
              >
                {{ error }}
              </v-alert>

              <v-alert
                v-if="success"
                type="success"
                variant="tonal"
                class="mb-4"
                closable
                @click:close="success = ''"
              >
                {{ success }}
              </v-alert>

              <!-- Auth Toggle -->
              <div class="text-center mb-6">
                <v-btn-toggle
                  v-model="isLogin"
                  variant="outlined"
                  density="compact"
                  mandatory
                >
                  <v-btn :value="true" prepend-icon="mdi-login">
                    Sign In
                  </v-btn>
                  <v-btn :value="false" prepend-icon="mdi-account-plus">
                    Sign Up
                  </v-btn>
                </v-btn-toggle>
              </div>

              <!-- OAuth Providers -->
              <div class="oauth-section mb-6">
                <p class="oauth-label text-center mb-3">
                  {{ isLogin ? 'Sign in with' : 'Sign up with' }}
                </p>
                
                <div class="oauth-buttons">
                  <v-btn
                    color="primary"
                    size="large"
                    variant="outlined"
                    prepend-icon="mdi-github"
                    block
                    class="mb-3"
                    @click="handleOAuthLogin('github')"
                  >
                    GitHub
                  </v-btn>
                  
                  <v-btn
                    color="primary"
                    size="large"
                    variant="outlined"
                    prepend-icon="mdi-google"
                    block
                    @click="handleOAuthLogin('google')"
                  >
                    Google
                  </v-btn>
                </div>
              </div>

              <!-- Divider -->
              <v-divider class="mb-6">
                <span class="divider-text">or with email</span>
              </v-divider>

              <!-- Login Form -->
              <v-form v-if="isLogin" @submit.prevent="handleLogin">
                <v-text-field
                  v-model="loginForm.email"
                  label="Email Address"
                  type="email"
                  prepend-inner-icon="mdi-email"
                  variant="outlined"
                  class="mb-3"
                  :rules="[v => !!v || 'Email is required']"
                  required
                />
                
                <v-text-field
                  v-model="loginForm.password"
                  label="Password"
                  type="password"
                  prepend-inner-icon="mdi-lock"
                  variant="outlined"
                  class="mb-4"
                  :rules="[v => !!v || 'Password is required']"
                  required
                />

                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  block
                  :loading="loading"
                  class="mb-3"
                >
                  Sign In
                </v-btn>
              </v-form>

              <!-- Registration Form -->
              <v-form v-else @submit.prevent="handleRegister">
                <v-text-field
                  v-model="registerForm.name"
                  label="Your Full Name"
                  prepend-inner-icon="mdi-account"
                  variant="outlined"
                  class="mb-3"
                  :rules="[v => !!v || 'Name is required']"
                  hint="This will be used for your account and email communications"
                  required
                />
                
                <v-text-field
                  v-model="registerForm.email"
                  label="Email Address"
                  type="email"
                  prepend-inner-icon="mdi-email"
                  variant="outlined"
                  class="mb-3"
                  :rules="[v => !!v || 'Email is required']"
                  hint="We'll send you a PIN to verify your account"
                  required
                />

                <v-text-field
                  v-model="registerForm.nickname"
                  label="Event Nickname (Optional)"
                  prepend-inner-icon="mdi-tag-outline"
                  variant="outlined"
                  class="mb-3"
                  placeholder="Leave blank to auto-generate a friendly name"
                  hint="How you'll appear to other participants (e.g., 'Creative Sarah')"
                />

                <v-text-field
                  v-model="registerForm.eventCode"
                  label="Event Code (Optional)"
                  prepend-inner-icon="mdi-ticket"
                  variant="outlined"
                  class="mb-4"
                  placeholder="e.g., DEMO2024"
                  hint="Join an event immediately after verification"
                />

                <v-btn
                  type="submit"
                  color="primary"
                  size="large"
                  block
                  :loading="loading"
                  class="mb-3"
                >
                  Send Verification PIN
                </v-btn>
              </v-form>

              <!-- Guest Access -->
              <v-divider class="my-6">
                <span class="divider-text">Quick Access</span>
              </v-divider>

              <div class="guest-section">
                <p class="guest-label text-center mb-3">
                  Join as guest with event code
                </p>
                
                <v-form @submit.prevent="handleGuestJoin">
                  <div class="d-flex gap-2">
                    <v-text-field
                      v-model="guestForm.eventCode"
                      label="Event Code"
                      prepend-inner-icon="mdi-ticket"
                      variant="outlined"
                      density="comfortable"
                      class="flex-grow-1"
                      placeholder="e.g., DEMO2024"
                    />
                    
                    <v-btn
                      type="submit"
                      color="secondary"
                      size="large"
                      :loading="guestLoading"
                      :disabled="!guestForm.eventCode"
                    >
                      Join
                    </v-btn>
                  </div>
                </v-form>
                
                <p class="guest-hint text-center text-caption mt-2">
                  No account needed - join instantly as a guest
                </p>
              </div>
            </v-card-text>

            <!-- Footer -->
            <v-card-actions class="px-8 pb-6">
              <div class="login-footer w-100 text-center">
                <p class="text-caption mb-2">
                  By continuing, you agree to our 
                  <a href="/terms" class="text-primary">Terms</a> and 
                  <a href="/privacy" class="text-primary">Privacy Policy</a>
                </p>
                
                <v-btn
                  color="primary"
                  variant="text"
                  size="small"
                  prepend-icon="mdi-arrow-left"
                  to="/"
                >
                  Back to Home
                </v-btn>
              </div>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.login-page {
  background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%);
  min-height: 100vh;
}

.login-card {
  border-radius: 20px;
  background: linear-gradient(135deg, #FFFFFF 0%, #FEFEFE 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  overflow: hidden;
  position: relative;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%);
}

.login-header {
  padding: 2rem 2rem 1rem;
  background: linear-gradient(135deg, #FEFEFE 0%, #F8FAFC 100%);
}

.login-logo {
  display: flex;
  justify-content: center;
}

.login-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: #64748B;
  font-size: 1rem;
  margin: 0;
}

.oauth-label,
.guest-label {
  color: #64748B;
  font-size: 0.9rem;
  font-weight: 500;
}

.oauth-buttons .v-btn {
  font-weight: 600;
  text-transform: none;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.oauth-buttons .v-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.divider-text {
  background: white;
  padding: 0 1rem;
  color: #64748B;
  font-size: 0.8rem;
  font-weight: 500;
}

.guest-section {
  background: rgba(var(--v-theme-secondary), 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(var(--v-theme-secondary), 0.1);
}

.guest-hint {
  color: #64748B;
  opacity: 0.8;
}

.login-footer {
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  padding-top: 1rem;
}

.login-footer a {
  text-decoration: none;
  font-weight: 500;
}

.login-footer a:hover {
  text-decoration: underline;
}

/* Form styling */
.v-text-field {
  margin-bottom: 0;
}

.v-btn {
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
}

.v-btn.v-btn--size-large {
  padding: 12px 24px;
  font-size: 1rem;
}

.v-btn:hover {
  transform: translateY(-1px);
  transition: all 0.3s ease;
}

/* Responsive design */
@media (max-width: 600px) {
  .login-card {
    margin: 1rem;
  }
  
  .login-header {
    padding: 1.5rem 1.5rem 1rem;
  }
  
  .login-title {
    font-size: 1.5rem;
  }
}
</style>
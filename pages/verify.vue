<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  layout: 'public'
})

const route = useRoute()
const router = useRouter()

// Form state
const loading = ref(false)
const resendLoading = ref(false)

const form = ref({
  email: '',
  pin: ''
})

// Error/success messages
const error = ref('')
const success = ref('')
const resendCooldown = ref(0)

// Get email from route params or redirect
onMounted(() => {
  const emailParam = route.query.email?.toString()
  if (emailParam) {
    form.value.email = emailParam
  } else {
    // No email provided, redirect to registration
    router.push('/login')
  }
})

// Countdown timer for resend
const startResendCooldown = () => {
  resendCooldown.value = 60
  const interval = setInterval(() => {
    resendCooldown.value--
    if (resendCooldown.value <= 0) {
      clearInterval(interval)
    }
  }, 1000)
}

async function handleVerify() {
  if (!form.value.email || !form.value.pin) {
    error.value = 'Please enter the 6-digit PIN from your email'
    return
  }

  if (form.value.pin.length !== 6) {
    error.value = 'PIN must be exactly 6 digits'
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    const response = await $fetch('/api/auth/email/verify', {
      method: 'POST',
      body: form.value
    })
    
    success.value = response.message
    // Redirect to dashboard after successful verification
    await router.push('/groups')
  } catch (err: any) {
    error.value = err.data?.message || 'Verification failed'
  } finally {
    loading.value = false
  }
}

async function resendPin() {
  if (!form.value.email) {
    error.value = 'Email is required'
    return
  }

  resendLoading.value = true
  error.value = ''
  
  try {
    const response = await $fetch('/api/auth/email/resend-pin', {
      method: 'POST',
      body: { email: form.value.email }
    })
    
    success.value = response.message
    startResendCooldown()
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to resend PIN'
  } finally {
    resendLoading.value = false
  }
}

// Auto-format PIN input
function formatPin(event: any) {
  const value = event.target.value.replace(/\D/g, '') // Remove non-digits
  form.value.pin = value.slice(0, 6) // Limit to 6 digits
}

useSeoMeta({
  title: 'Verify Your Email - Unconference',
  description: 'Enter the PIN sent to your email to complete your account setup.',
})
</script>

<template>
  <div class="verify-page">
    <v-container class="d-flex align-center justify-center min-vh-100">
      <v-row justify="center">
        <v-col cols="12" sm="10" md="8" lg="6" xl="4">
          <v-card class="verify-card" elevation="12">
            <!-- Header -->
            <v-card-title class="verify-header text-center">
              <div class="verify-icon mb-4">
                <v-icon size="64" color="primary">mdi-email-check</v-icon>
              </div>
              <h1 class="verify-title">Check Your Email</h1>
              <p class="verify-subtitle">
                We've sent a 6-digit PIN to<br>
                <strong>{{ form.email }}</strong>
              </p>
            </v-card-title>

            <v-card-text class="px-8 pb-6">
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

              <!-- PIN Input -->
              <v-form @submit.prevent="handleVerify">
                <div class="pin-input-section mb-6">
                  <v-text-field
                    v-model="form.pin"
                    label="Enter 6-digit PIN"
                    variant="outlined"
                    class="pin-input"
                    maxlength="6"
                    :rules="[v => !!v || 'PIN is required', v => v.length === 6 || 'PIN must be 6 digits']"
                    placeholder="123456"
                    @input="formatPin"
                    autofocus
                    required
                  >
                    <template #prepend-inner>
                      <v-icon color="primary">mdi-key-variant</v-icon>
                    </template>
                  </v-text-field>

                  <p class="pin-hint text-center text-caption mt-2">
                    Enter the 6-digit code from your email
                  </p>
                </div>

                <v-btn
                  type="submit"
                  color="primary"
                  size="x-large"
                  block
                  :loading="loading"
                  :disabled="form.pin.length !== 6"
                  class="verify-btn mb-4"
                >
                  Verify Account
                </v-btn>
              </v-form>

              <!-- Resend Section -->
              <div class="resend-section text-center">
                <p class="resend-text mb-3">
                  Didn't receive the email?
                </p>
                
                <v-btn
                  v-if="resendCooldown === 0"
                  color="secondary"
                  variant="outlined"
                  :loading="resendLoading"
                  @click="resendPin"
                >
                  Resend PIN
                </v-btn>
                
                <v-btn
                  v-else
                  color="secondary"
                  variant="outlined"
                  disabled
                >
                  Resend in {{ resendCooldown }}s
                </v-btn>
                
                <p class="resend-hint text-caption mt-3">
                  Check your spam folder if you don't see the email
                </p>
              </div>
            </v-card-text>

            <!-- Footer -->
            <v-card-actions class="px-8 pb-6">
              <div class="verify-footer w-100">
                <v-divider class="mb-4"></v-divider>
                
                <div class="d-flex justify-space-between align-center">
                  <v-btn
                    color="grey"
                    variant="text"
                    size="small"
                    prepend-icon="mdi-arrow-left"
                    to="/login"
                  >
                    Back to Login
                  </v-btn>
                  
                  <v-btn
                    color="primary"
                    variant="text"
                    size="small"
                    prepend-icon="mdi-home"
                    to="/"
                  >
                    Home
                  </v-btn>
                </div>
              </div>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.verify-page {
  background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%);
  min-height: 100vh;
}

.verify-card {
  border-radius: 20px;
  background: linear-gradient(135deg, #FFFFFF 0%, #FEFEFE 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  overflow: hidden;
  position: relative;
}

.verify-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #10B981 0%, #059669 100%);
}

.verify-header {
  padding: 2rem 2rem 1rem;
  background: linear-gradient(135deg, #FEFEFE 0%, #F8FAFC 100%);
}

.verify-icon {
  display: flex;
  justify-content: center;
  position: relative;
}

.verify-icon::after {
  content: '📧';
  position: absolute;
  bottom: -5px;
  right: 20px;
  font-size: 1.5rem;
  animation: pulse 2s infinite;
}

.verify-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 0.5rem;
}

.verify-subtitle {
  color: #64748B;
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
}

.pin-input-section {
  text-align: center;
}

.pin-input {
  max-width: 280px;
  margin: 0 auto;
}

.pin-input :deep(.v-field__input) {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.2rem;
  font-family: 'Monaco', 'Courier New', monospace;
}

.pin-input :deep(.v-field) {
  border-radius: 12px;
  border: 2px solid #E2E8F0;
  transition: all 0.3s ease;
}

.pin-input :deep(.v-field--focused) {
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.pin-hint {
  color: #64748B;
  margin-top: 0.5rem;
}

.verify-btn {
  border-radius: 12px;
  font-weight: 700;
  text-transform: none;
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  transition: all 0.3s ease;
}

.verify-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.resend-section {
  background: rgba(var(--v-theme-secondary), 0.03);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(var(--v-theme-secondary), 0.1);
}

.resend-text {
  color: #64748B;
  font-weight: 500;
}

.resend-hint {
  color: #64748B;
  opacity: 0.8;
}

.verify-footer {
  border-top: 1px solid rgba(148, 163, 184, 0.1);
  padding-top: 1rem;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Responsive design */
@media (max-width: 600px) {
  .verify-card {
    margin: 1rem;
  }
  
  .verify-header {
    padding: 1.5rem 1.5rem 1rem;
  }
  
  .verify-title {
    font-size: 1.5rem;
  }
  
  .pin-input {
    max-width: 100%;
  }
}
</style>
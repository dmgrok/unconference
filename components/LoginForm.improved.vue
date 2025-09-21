<script setup lang="ts">
import { nextTick } from 'vue'

const runtimeConfig = useRuntimeConfig()
// Fix: Use environment-based dev mode
const devMode = ref(runtimeConfig.public.devMode || false)
const route = useRoute()

const { loggedIn, user, fetch: refreshSession } = useUserSession()
const credentials = reactive({
    email: '',
    password: '',
})

const guestForm = reactive({
    eventCode: '',
    name: '',
    email: ''
})

const loginError = ref('')
const loginLoading = ref(false)
const guestLoading = ref(false)
const formValid = ref(false)
const guestFormValid = ref(false)
const isGuestMode = ref(false)
const showPassword = ref(false)

// Enhanced icon selection with categories
const avatarCategories = ref({
    people: ['mdi-account', 'mdi-account-circle', 'mdi-face-man', 'mdi-face-woman'],
    emotions: ['mdi-emoticon', 'mdi-emoticon-happy', 'mdi-emoticon-cool'],
    characters: ['mdi-robot', 'mdi-alien', 'mdi-skull'],
    animals: ['mdi-butterfly', 'mdi-cat', 'mdi-dog', 'mdi-owl'],
    objects: ['mdi-rocket', 'mdi-star', 'mdi-heart', 'mdi-diamond', 'mdi-crown', 'mdi-flash']
})
const selectedIcon = ref('mdi-account')
const selectedCategory = ref('people')

// Check if user has existing guest session
const existingGuestData = ref<any>(null)

onMounted(() => {
    const stored = localStorage.getItem('unconference-guest')
    if (stored) {
        try {
            existingGuestData.value = JSON.parse(stored)
        } catch (e) {
            localStorage.removeItem('unconference-guest')
        }
    }
    
    // Check for event code in URL parameters
    const urlEventCode = route.query.code as string || route.query.eventCode as string
    if (urlEventCode) {
        guestForm.eventCode = urlEventCode.toUpperCase()
        isGuestMode.value = true
    }
})

// Fix: Remove hardcoded credentials, use environment-based approach
const testCredentials = computed(() => {
    if (!devMode.value) return {}
    
    return {
        superAdmin: {
            email: runtimeConfig.public.testAdminEmail || '',
            password: runtimeConfig.public.testAdminPassword || ''
        },
        admin: {
            email: runtimeConfig.public.testAdminEmail || '',
            password: runtimeConfig.public.testAdminPassword || ''
        },
        organizer: {
            email: runtimeConfig.public.testOrganizerEmail || '',
            password: runtimeConfig.public.testOrganizerPassword || ''
        },
        user: {
            email: runtimeConfig.public.testUserEmail || '',
            password: runtimeConfig.public.testUserPassword || ''
        }
    }
})

// Enhanced validation rules
const emailRules = [
    (v: string) => !!v || 'Email is required',
    (v: string) => /.+@.+\..+/.test(v) || 'Please enter a valid email address',
    (v: string) => v.length <= 254 || 'Email is too long'
]

const passwordRules = [
    (v: string) => !!v || 'Password is required',
    (v: string) => v.length >= 6 || 'Password must be at least 6 characters',
    (v: string) => v.length <= 128 || 'Password is too long'
]

const eventCodeRules = [
    (v: string) => !!v || 'Event code is required',
    (v: string) => v.length >= 4 || 'Event code must be at least 4 characters',
    (v: string) => v.length <= 20 || 'Event code is too long',
    (v: string) => /^[A-Z0-9]+$/.test(v) || 'Event code must contain only letters and numbers'
]

// Enhanced error handling
function getErrorMessage(error: any): string {
    if (error?.data?.message) return error.data.message
    if (error?.message) return error.message
    
    // Map common HTTP status codes to user-friendly messages
    const statusMessages: Record<number, string> = {
        401: 'Invalid email or password',
        403: 'Access denied',
        404: 'Account not found',
        422: 'Invalid input provided',
        429: 'Too many login attempts. Please try again later',
        500: 'Server error. Please try again later'
    }
    
    return statusMessages[error?.status] || 'Login failed. Please try again'
}

async function login() {
    if (loginLoading.value || !formValid.value) return
    
    loginLoading.value = true
    loginError.value = ''
    
    try {
        const eventCode = guestForm.eventCode || (route.query.code as string) || (route.query.eventCode as string)
        const redirectTo = route.query.redirect as string
        
        await $fetch('/api/auth/login', {
            method: 'POST',
            body: {
                ...credentials,
                eventCode: eventCode?.toUpperCase(),
                redirectTo
            }
        })
        
        // Refresh the session on client-side
        await refreshSession()
        
        // Use smart routing to determine where to go
        const routingResponse = await $fetch('/api/auth/post-login-redirect') as { redirect: string, reason: string }
        await navigateTo(routingResponse.redirect)
        
    } catch (error: any) {
        loginError.value = getErrorMessage(error)
        console.error('Login failed:', error)
    } finally {
        loginLoading.value = false
    }
}

async function guestJoin() {
    if (guestLoading.value || !guestFormValid.value) return
    
    guestLoading.value = true
    loginError.value = ''
    
    try {
        const response = await $fetch('/api/auth/guest-join', {
            method: 'POST',
            body: {
                eventCode: guestForm.eventCode,
                name: guestForm.name || undefined,
                email: guestForm.email || undefined
            }
        })
        
        // Store guest data for future logins
        const guestData = {
            name: guestForm.name || response.user.name,
            email: guestForm.email,
            icon: selectedIcon.value,
            eventCode: guestForm.eventCode
        }
        localStorage.setItem('unconference-guest', JSON.stringify(guestData))
        
        // Refresh the session and redirect
        await refreshSession()
        await navigateTo('/voting')
        
    } catch (error: any) {
        loginError.value = getErrorMessage(error)
        console.error('Guest login failed:', error)
    } finally {
        guestLoading.value = false
    }
}

async function continueAsGuest() {
    if (existingGuestData.value) {
        Object.assign(guestForm, {
            eventCode: existingGuestData.value.eventCode,
            name: existingGuestData.value.name,
            email: existingGuestData.value.email
        })
        selectedIcon.value = existingGuestData.value.icon || 'mdi-account'
        await guestJoin()
    }
}

// Development functions - only available in dev mode
function fillTestCredentials(role: string) {
    if (!devMode.value || !testCredentials.value[role as keyof typeof testCredentials.value]) return
    
    const creds = testCredentials.value[role as keyof typeof testCredentials.value]
    credentials.email = creds.email
    credentials.password = creds.password
    loginError.value = ''
    
    // Auto-login for convenience
    nextTick(() => login())
}

function switchToGuest() {
    isGuestMode.value = true
    loginError.value = ''
}

function switchToLogin() {
    isGuestMode.value = false
    loginError.value = ''
}

// Enhanced OAuth functions with better error handling
async function signInWithProvider(provider: 'google' | 'github') {
    try {
        loginError.value = ''
        
        const eventCode = guestForm.eventCode || (route.query.code as string) || (route.query.eventCode as string)
        const redirectTo = route.query.redirect as string
        
        let oauthUrl = `/api/auth/${provider}`
        
        if (eventCode || redirectTo) {
            const params = new URLSearchParams()
            if (eventCode) params.set('state', eventCode.toUpperCase())
            if (redirectTo) params.set('redirect_uri', redirectTo)
            oauthUrl += '?' + params.toString()
        }
        
        await navigateTo(oauthUrl, { external: true })
        
    } catch (error) {
        console.error(`${provider} OAuth error:`, error)
        loginError.value = `Failed to connect with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`
    }
}

// Accessibility enhancements
function announceError(message: string) {
    // Create a live region for screen readers
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.textContent = message
    document.body.appendChild(announcement)
    
    setTimeout(() => {
        document.body.removeChild(announcement)
    }, 1000)
}

watch(loginError, (newError) => {
    if (newError) {
        announceError(newError)
    }
})
</script>

<template>
    <div class="login-container">
        <v-card class="login-card" elevation="12">
            <!-- Header with improved accessibility -->
            <div class="login-header" role="banner">
                <div class="header-icon" aria-hidden="true">
                    <v-icon size="64" color="white">mdi-forum</v-icon>
                </div>
                <h1 class="header-title">Welcome to Unconference</h1>
                <p class="header-subtitle">Choose your preferred way to join the conversation</p>
            </div>

            <div class="login-content" role="main">
                <!-- Enhanced existing guest welcome -->
                <div v-if="existingGuestData && !isGuestMode" class="guest-welcome">
                    <v-card class="welcome-card" elevation="2">
                        <div class="welcome-avatar" aria-hidden="true">
                            <v-icon :icon="existingGuestData.icon || 'mdi-account'" size="48"></v-icon>
                        </div>
                        <h2 class="welcome-title">Welcome back, {{ existingGuestData.name }}!</h2>
                        <p class="welcome-subtitle">Continue with your previous session for {{ existingGuestData.eventCode }}</p>
                        <v-btn 
                            color="primary" 
                            @click="continueAsGuest" 
                            class="welcome-btn" 
                            size="large"
                            :loading="guestLoading"
                            :disabled="guestLoading"
                        >
                            <v-icon start>mdi-login</v-icon>
                            Continue as {{ existingGuestData.name }}
                        </v-btn>
                        <v-btn 
                            variant="text" 
                            @click="existingGuestData = null" 
                            size="small" 
                            class="mt-2"
                            :disabled="guestLoading"
                        >
                            Use different account
                        </v-btn>
                    </v-card>
                </div>

                <!-- Enhanced mode toggle with better accessibility -->
                <div class="mode-toggle" v-if="!existingGuestData" role="tablist">
                    <div class="method-cards">
                        <v-card 
                            :class="['method-card', { 'method-card--active': !isGuestMode }]"
                            @click="switchToLogin"
                            @keydown.enter="switchToLogin"
                            @keydown.space.prevent="switchToLogin"
                            elevation="2"
                            role="tab"
                            :aria-selected="!isGuestMode"
                            tabindex="0"
                        >
                            <div class="method-icon oauth-icon" aria-hidden="true">
                                <div class="oauth-icons">
                                    <v-icon size="24" color="#4285F4">mdi-google</v-icon>
                                    <v-icon size="24">mdi-github</v-icon>
                                </div>
                            </div>
                            <h3 class="method-title">Account Login</h3>
                            <p class="method-description">
                                Use your Google, GitHub account or email/password
                            </p>
                        </v-card>
                        
                        <v-card 
                            :class="['method-card', { 'method-card--active': isGuestMode }]"
                            @click="switchToGuest"
                            @keydown.enter="switchToGuest"
                            @keydown.space.prevent="switchToGuest"
                            elevation="2"
                            role="tab"
                            :aria-selected="isGuestMode"
                            tabindex="0"
                        >
                            <div class="method-icon guest-icon" aria-hidden="true">
                                <v-icon size="40">mdi-account-question</v-icon>
                            </div>
                            <h3 class="method-title">Quick Guest Access</h3>
                            <p class="method-description">
                                Join with just an event code - no account needed
                            </p>
                        </v-card>
                    </div>
                </div>

                <!-- Enhanced regular login form -->
                <div v-if="!isGuestMode && !existingGuestData" class="login-form">
                    <v-form 
                        @submit.prevent="login" 
                        ref="loginForm" 
                        v-model="formValid"
                        validate-on="blur"
                    >
                        <v-text-field
                            v-model="credentials.email"
                            label="Email Address"
                            type="email"
                            data-testid="email-input"
                            placeholder="Enter your email"
                            required
                            :rules="emailRules"
                            class="form-field"
                            prepend-inner-icon="mdi-email"
                            autocomplete="email"
                            :disabled="loginLoading"
                        ></v-text-field>
                        
                        <v-text-field
                            v-model="credentials.password"
                            label="Password"
                            :type="showPassword ? 'text' : 'password'"
                            data-testid="password-input"
                            placeholder="Enter your password"
                            required
                            :rules="passwordRules"
                            class="form-field"
                            prepend-inner-icon="mdi-lock"
                            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                            @click:append-inner="showPassword = !showPassword"
                            autocomplete="current-password"
                            :disabled="loginLoading"
                        ></v-text-field>
                        
                        <!-- Enhanced test buttons for development -->
                        <div v-if="devMode && Object.keys(testCredentials).length > 0" class="dev-section">
                            <v-divider class="mb-4"></v-divider>
                            <div class="dev-header">
                                <v-icon class="mr-2" size="20">mdi-dev-to</v-icon>
                                <span class="dev-title">Development Quick Access</span>
                            </div>
                            <div class="test-buttons">
                                <v-btn
                                    v-for="(role, key) in testCredentials"
                                    :key="key"
                                    @click="fillTestCredentials(key)"
                                    :disabled="loginLoading"
                                    :loading="loginLoading && credentials.email === role.email"
                                    variant="outlined"
                                    :color="key === 'superAdmin' ? 'error' : key === 'admin' ? 'primary' : key === 'organizer' ? 'info' : 'secondary'"
                                    size="small"
                                    :data-testid="`${key}-test-button`"
                                    class="test-btn"
                                >
                                    <v-icon start>{{
                                        key === 'superAdmin' ? 'mdi-shield-crown' :
                                        key === 'admin' ? 'mdi-account-star' :
                                        key === 'organizer' ? 'mdi-account-tie' :
                                        'mdi-account'
                                    }}</v-icon>
                                    {{ key.charAt(0).toUpperCase() + key.slice(1) }}
                                </v-btn>
                            </div>
                            <v-divider class="mt-4"></v-divider>
                        </div>

                        <v-btn 
                            :disabled="!formValid || loginLoading" 
                            :loading="loginLoading"
                            type="submit" 
                            data-testid="login-submit-button"
                            color="primary" 
                            size="large"
                            class="login-submit-btn"
                        >
                            <v-icon start>mdi-login</v-icon>
                            Sign In
                        </v-btn>

                        <!-- Enhanced OAuth section -->
                        <div class="oauth-section">
                            <v-divider class="my-4">
                                <template #default>
                                    <span class="oauth-divider-text">Or continue with</span>
                                </template>
                            </v-divider>
                            
                            <div class="oauth-buttons">
                                <v-btn
                                    @click="signInWithProvider('google')"
                                    :disabled="loginLoading"
                                    variant="outlined"
                                    color="primary"
                                    size="large"
                                    class="oauth-btn google-btn"
                                    data-testid="google-login-button"
                                >
                                    <v-icon start color="#4285F4">mdi-google</v-icon>
                                    Google
                                </v-btn>
                                
                                <v-btn
                                    @click="signInWithProvider('github')"
                                    :disabled="loginLoading"
                                    variant="outlined"
                                    color="primary"
                                    size="large"
                                    class="oauth-btn github-btn"
                                    data-testid="github-login-button"
                                >
                                    <v-icon start>mdi-github</v-icon>
                                    GitHub
                                </v-btn>
                            </div>
                        </div>
                        
                        <!-- Register link -->
                        <div class="text-center mt-4">
                            <p class="text-body-2 mb-2">Don't have an account?</p>
                            <v-btn
                                variant="outlined"
                                color="secondary"
                                to="/register"
                                prepend-icon="mdi-account-plus"
                                :disabled="loginLoading"
                            >
                                Create Account
                            </v-btn>
                        </div>
                    </v-form>
                </div>

                <!-- Enhanced guest join form -->
                <div v-if="isGuestMode && !existingGuestData" class="guest-form">
                    <v-alert type="info" class="guest-info" variant="tonal">
                        <template #prepend>
                            <v-icon>mdi-rocket-launch</v-icon>
                        </template>
                        <v-alert-title class="guest-info-title">Instant Event Access</v-alert-title>
                        <p class="guest-info-text">
                            Enter your event code to join instantly! You can vote, propose topics, and participate 
                            in discussions without creating any accounts. Your session will be saved for easy return.
                        </p>
                    </v-alert>
                    
                    <v-form 
                        @submit.prevent="guestJoin" 
                        v-model="guestFormValid"
                        validate-on="blur"
                    >
                        <v-text-field
                            v-model="guestForm.eventCode"
                            label="Event Code"
                            placeholder="Enter event code (e.g., DEMO2024, SUMMIT25)"
                            required
                            :rules="eventCodeRules"
                            class="form-field event-code-field"
                            prepend-inner-icon="mdi-ticket-confirmation"
                            @input="guestForm.eventCode = guestForm.eventCode.toUpperCase()"
                            :disabled="guestLoading"
                            autocomplete="off"
                        ></v-text-field>

                        <div class="profile-section">
                            <h3 class="profile-title">Customize Your Profile</h3>
                            
                            <v-text-field
                                v-model="guestForm.name"
                                label="Display Name (optional)"
                                placeholder="Enter your name or leave blank for random"
                                class="form-field"
                                prepend-inner-icon="mdi-account"
                                :disabled="guestLoading"
                                maxlength="50"
                                counter="50"
                            ></v-text-field>

                            <v-text-field
                                v-model="guestForm.email"
                                label="Email (optional)"
                                type="email"
                                placeholder="For session recovery on other devices"
                                class="form-field"
                                prepend-inner-icon="mdi-email"
                                hint="Save your email to recover your profile on other devices"
                                persistent-hint
                                :disabled="guestLoading"
                                :rules="guestForm.email ? emailRules.slice(1) : []"
                            ></v-text-field>

                            <!-- Enhanced icon selection -->
                            <div class="avatar-section">
                                <v-label class="avatar-label">Choose Your Avatar</v-label>
                                
                                <!-- Category tabs -->
                                <v-tabs 
                                    v-model="selectedCategory" 
                                    density="compact" 
                                    class="avatar-tabs mb-3"
                                    :disabled="guestLoading"
                                >
                                    <v-tab value="people">People</v-tab>
                                    <v-tab value="emotions">Emotions</v-tab>
                                    <v-tab value="characters">Characters</v-tab>
                                    <v-tab value="animals">Animals</v-tab>
                                    <v-tab value="objects">Objects</v-tab>
                                </v-tabs>
                                
                                <!-- Icon grid for selected category -->
                                <div class="avatar-grid">
                                    <v-btn
                                        v-for="icon in avatarCategories[selectedCategory]"
                                        :key="icon"
                                        :class="['avatar-btn', { 'avatar-btn--selected': selectedIcon === icon }]"
                                        :color="selectedIcon === icon ? 'primary' : 'default'"
                                        :variant="selectedIcon === icon ? 'elevated' : 'outlined'"
                                        size="small"
                                        @click="selectedIcon = icon"
                                        :disabled="guestLoading"
                                        :aria-label="`Select ${icon.replace('mdi-', '').replace('-', ' ')} avatar`"
                                    >
                                        <v-icon :icon="icon" size="20"></v-icon>
                                    </v-btn>
                                </div>
                            </div>

                            <!-- Enhanced preview -->
                            <v-card class="profile-preview" elevation="1">
                                <div class="preview-avatar" aria-hidden="true">
                                    <v-icon :icon="selectedIcon" size="32"></v-icon>
                                </div>
                                <div class="preview-content">
                                    <p class="preview-name">{{ guestForm.name || 'Anonymous User' }}</p>
                                    <p class="preview-code">{{ guestForm.eventCode || 'Enter Event Code' }}</p>
                                </div>
                            </v-card>
                        </div>

                        <!-- Development test access -->
                        <div v-if="devMode" class="dev-section guest-dev-section">
                            <v-divider class="mb-4"></v-divider>
                            <div class="dev-header">
                                <v-icon class="mr-2" size="20">mdi-test-tube</v-icon>
                                <span class="dev-title">Development Test Access</span>
                            </div>
                            <v-alert type="warning" variant="tonal" class="mb-3">
                                <v-alert-title>Development Mode</v-alert-title>
                                <p class="mb-2">Use these test event codes:</p>
                                <div class="test-codes">
                                    <v-chip 
                                        color="error" 
                                        variant="outlined" 
                                        class="mr-2 mb-1 cursor-pointer"
                                        @click="guestForm.eventCode = 'SUPERADMIN'"
                                        :disabled="guestLoading"
                                    >
                                        <v-icon start>mdi-shield-crown</v-icon>
                                        SUPERADMIN
                                    </v-chip>
                                    <v-chip 
                                        color="error" 
                                        variant="outlined" 
                                        class="mb-1 cursor-pointer"
                                        @click="guestForm.eventCode = 'TESTADMIN'"
                                        :disabled="guestLoading"
                                    >
                                        <v-icon start>mdi-account-star</v-icon>
                                        TESTADMIN
                                    </v-chip>
                                </div>
                                <p class="text-caption mt-2">These codes grant special privileges for testing</p>
                            </v-alert>
                            <v-divider class="mt-4"></v-divider>
                        </div>

                        <v-btn 
                            :disabled="!guestForm.eventCode || guestLoading"
                            :loading="guestLoading"
                            type="submit" 
                            color="success" 
                            size="large"
                            class="guest-submit-btn"
                        >
                            <v-icon start>mdi-login</v-icon>
                            Join Event
                        </v-btn>
                    </v-form>
                </div>

                <!-- Enhanced error messages -->
                <div v-if="loginError" class="message-section">
                    <v-alert 
                        type="error" 
                        variant="tonal" 
                        class="error-alert"
                        closable
                        @click:close="loginError = ''"
                        role="alert"
                        aria-live="polite"
                    >
                        <v-alert-title>{{ isGuestMode ? 'Guest Access Failed' : 'Login Failed' }}</v-alert-title>
                        {{ loginError }}
                    </v-alert>
                </div>
                
                <!-- Success message -->
                <div v-else-if="loggedIn" class="message-section">
                    <v-alert type="success" variant="tonal" class="success-alert">
                        <v-alert-title>Welcome!</v-alert-title>
                        <p>Hello, {{ (user as any)?.name || 'User' }}. Redirecting you now...</p>
                    </v-alert>
                </div>
            </div>
        </v-card>
    </div>
</template>

<style scoped>
/* Enhanced styles with better accessibility and mobile support */
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
}

@media (min-width: 768px) {
  .login-container {
    padding: 2rem;
  }
}

.login-card {
  max-width: 550px;
  width: 100%;
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(135deg, #FFFFFF 0%, #FEFEFE 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
  box-shadow: 
    0 25px 50px rgba(0,0,0,0.15), 
    0 0 0 1px rgba(255,255,255,0.6);
}

.login-header {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
  color: white;
  text-align: center;
  padding: 2rem 1.5rem;
  position: relative;
}

@media (min-width: 768px) {
  .login-header {
    padding: 3rem 2rem 2rem;
  }
}

.login-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
}

.header-icon {
  margin-bottom: 1rem;
}

.header-title {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

@media (min-width: 768px) {
  .header-title {
    font-size: 1.8rem;
  }
}

.header-subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
}

.login-content {
  padding: 1.5rem;
}

@media (min-width: 768px) {
  .login-content {
    padding: 2rem;
  }
}

/* Enhanced method cards with better focus states */
.method-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .method-cards {
    grid-template-columns: 1fr 1fr;
  }
}

.method-card {
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 16px;
  border: 2px solid transparent;
  background: linear-gradient(135deg, #FEFEFE 0%, #F8FAFC 100%);
}

.method-card:hover,
.method-card:focus-visible {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  outline: 2px solid #6366F1;
  outline-offset: 2px;
}

.method-card--active {
  border-color: #6366F1;
  background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.2);
}

/* Enhanced avatar selection */
.avatar-tabs {
  margin-bottom: 1rem;
}

.avatar-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  max-height: 120px;
  overflow-y: auto;
  padding: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: #CBD5E1 #F1F5F9;
}

.avatar-grid::-webkit-scrollbar {
  width: 6px;
}

.avatar-grid::-webkit-scrollbar-track {
  background: #F1F5F9;
  border-radius: 3px;
}

.avatar-grid::-webkit-scrollbar-thumb {
  background: #CBD5E1;
  border-radius: 3px;
}

.avatar-btn {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.avatar-btn:focus-visible {
  outline: 2px solid #6366F1;
  outline-offset: 2px;
}

.avatar-btn--selected {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* Enhanced form fields */
.form-field :deep(.v-field) {
  border-radius: 12px;
}

.form-field :deep(.v-field--focused) {
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

/* Enhanced button styles */
.login-submit-btn,
.guest-submit-btn {
  width: 100%;
  text-transform: none;
  font-weight: 700;
  font-size: 1rem;
  border-radius: 12px;
  padding: 16px;
  margin-top: 0.5rem;
}

.oauth-buttons {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
  margin-top: 1rem;
}

@media (min-width: 768px) {
  .oauth-buttons {
    grid-template-columns: 1fr 1fr;
  }
}

.oauth-btn {
  text-transform: none;
  font-weight: 600;
  border-radius: 10px;
  padding: 12px 16px;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.oauth-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.oauth-btn:focus-visible {
  outline: 2px solid #6366F1;
  outline-offset: 2px;
}

/* Enhanced dev section */
.test-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.test-btn {
  text-transform: none;
  font-weight: 600;
  border-radius: 8px;
}

/* Enhanced error and success states */
.error-alert,
.success-alert {
  border-radius: 12px;
  margin-top: 1rem;
}

/* Utility classes */
.cursor-pointer {
  cursor: pointer;
}

/* Enhanced responsive design */
@media (max-width: 480px) {
  .login-container {
    padding: 0.5rem;
  }
  
  .login-header {
    padding: 1.5rem 1rem;
  }
  
  .header-title {
    font-size: 1.3rem;
  }
  
  .login-content {
    padding: 1rem;
  }
  
  .method-card {
    padding: 1rem;
  }
  
  .avatar-grid {
    max-height: 80px;
  }
}

/* Dark mode enhancements */
.v-theme--dark .login-card {
  background: linear-gradient(135deg, #1E293B 0%, #334155 100%);
  border-color: rgba(71, 85, 105, 0.3);
}

.v-theme--dark .method-card {
  background: linear-gradient(135deg, #334155 0%, #475569 100%);
}

.v-theme--dark .method-card--active {
  background: linear-gradient(135deg, #312E81 0%, #3730A3 100%);
}

.v-theme--dark .method-card:hover,
.v-theme--dark .method-card:focus-visible {
  outline-color: #A78BFA;
}

.v-theme--dark .profile-preview {
  background: linear-gradient(135deg, #334155 0%, #475569 100%);
  border-color: rgba(71, 85, 105, 0.3);
}

.v-theme--dark .oauth-btn {
  background-color: rgba(51, 65, 85, 0.6);
  color: #F1F5F9;
}

.v-theme--dark .oauth-btn:focus-visible {
  outline-color: #A78BFA;
}

/* Print styles */
@media print {
  .login-container {
    background: white;
  }
  
  .login-card {
    box-shadow: none;
    border: 1px solid #ccc;
  }
  
  .dev-section {
    display: none;
  }
}
</style>

<script setup lang="ts">
    const runtimeConfig = useRuntimeConfig()
    const devMode = ref(true); // Enable dev mode for guest features

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
    
    const loginError = ref(false)
    const formValid = ref(false)
    const guestFormValid = ref(false)
    const isGuestMode = ref(false)
    const availableIcons = ref([
        'mdi-account', 'mdi-account-circle', 'mdi-face-man', 'mdi-face-woman',
        'mdi-emoticon', 'mdi-emoticon-happy', 'mdi-emoticon-cool', 'mdi-robot',
        'mdi-alien', 'mdi-skull', 'mdi-butterfly', 'mdi-cat', 'mdi-dog', 'mdi-owl',
        'mdi-rocket', 'mdi-star', 'mdi-heart', 'mdi-diamond', 'mdi-crown', 'mdi-flash'
    ])
    const selectedIcon = ref('mdi-account')

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
    })

    // Test credentials for quick access
    const testCredentials = {
        admin: {
            email: 'darth.vader@starwars.com',
            password: 'AdminPassword123'
        },
        organizer: {
            email: 'organizer@example.com',
            password: 'organizerPassword'
        },
        user: {
            email: 'storm.trooper@starwars.com',
            password: 'UserPassword123'
        }
    }

    async function login() {
        useFetch('/api/auth/login', {
            method: 'POST',
            body: credentials
        }).then(async () => {
            // Refresh the session on client-side and redirect to the home page
            await refreshSession()
            await navigateTo('/dashboard')
        }).catch((error) => {
            loginError.value = true
            console.error('Login failed', error)
        })
    }

    async function guestJoin() {
        try {
            const response = await $fetch('/api/auth/guest-join', {
                method: 'POST',
                body: {
                    eventCode: guestForm.eventCode,
                    name: guestForm.name || undefined
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
            await navigateTo('/dashboard')
        } catch (error: any) {
            loginError.value = true
            console.error('Guest login failed', error)
        }
    }
    
    async function continueAsGuest() {
        if (existingGuestData.value) {
            guestForm.eventCode = existingGuestData.value.eventCode
            guestForm.name = existingGuestData.value.name
            guestForm.email = existingGuestData.value.email
            selectedIcon.value = existingGuestData.value.icon || 'mdi-account'
            await guestJoin()
        }
    }

    function fillAdminCredentials() {
        credentials.email = testCredentials.admin.email
        credentials.password = testCredentials.admin.password
        loginError.value = false
    }

    function fillUserCredentials() {
        credentials.email = testCredentials.user.email
        credentials.password = testCredentials.user.password
        loginError.value = false
    }

    function fillOrganizerCredentials() {
        credentials.email = testCredentials.organizer.email
        credentials.password = testCredentials.organizer.password
        loginError.value = false
    }
    
    function switchToGuest() {
        isGuestMode.value = true
        loginError.value = false
    }
    
    function switchToLogin() {
        isGuestMode.value = false
        loginError.value = false
    }
</script>

<template>
    <div class="login-container">
        <v-card class="login-card" elevation="12">
            <!-- Header -->
            <div class="login-header">
                <div class="header-icon">
                    <v-icon size="64" color="white">mdi-forum</v-icon>
                </div>
                <h1 class="header-title">Welcome to Unconference</h1>
                <p class="header-subtitle">Choose your preferred way to join the conversation</p>
            </div>

            <div class="login-content">
                <!-- Existing Guest Welcome -->
                <div v-if="existingGuestData && !isGuestMode" class="guest-welcome">
                    <v-card class="welcome-card" elevation="2">
                        <div class="welcome-avatar">
                            <v-icon :icon="existingGuestData.icon || 'mdi-account'" size="48"></v-icon>
                        </div>
                        <h3 class="welcome-title">Welcome back, {{ existingGuestData.name }}!</h3>
                        <p class="welcome-subtitle">Continue with your previous session</p>
                        <v-btn color="primary" @click="continueAsGuest" class="welcome-btn" size="large">
                            <v-icon start>mdi-login</v-icon>
                            Continue as {{ existingGuestData.name }}
                        </v-btn>
                        <v-btn variant="text" @click="existingGuestData = null" size="small" class="mt-2">
                            Use different account
                        </v-btn>
                    </v-card>
                </div>

                <!-- Mode Toggle -->
                <div class="mode-toggle" v-if="!existingGuestData">
                    <div class="method-cards">
                        <v-card 
                            :class="['method-card', { 'method-card--active': !isGuestMode }]"
                            @click="switchToLogin"
                            elevation="2"
                        >
                            <div class="method-icon github-icon">
                                <v-icon size="40">mdi-github</v-icon>
                            </div>
                            <h3 class="method-title">GitHub Account</h3>
                            <p class="method-description">
                                Full features, edit topics, admin access
                            </p>
                        </v-card>
                        
                        <v-card 
                            :class="['method-card', { 'method-card--active': isGuestMode }]"
                            @click="switchToGuest"
                            elevation="2"
                        >
                            <div class="method-icon guest-icon">
                                <v-icon size="40">mdi-account-question</v-icon>
                            </div>
                            <h3 class="method-title">Guest Access</h3>
                            <p class="method-description">
                                Anonymous, vote & participate, no setup
                            </p>
                        </v-card>
                    </div>

                    <div class="toggle-buttons">
                        <v-btn-toggle 
                            :model-value="isGuestMode ? 1 : 0"
                            @update:model-value="isGuestMode = !!$event"
                            color="primary" 
                            variant="outlined"
                            mandatory
                            class="custom-toggle"
                        >
                            <v-btn :value="0" class="toggle-btn">
                                <v-icon start>mdi-account-key</v-icon>
                                Login
                            </v-btn>
                            <v-btn :value="1" class="toggle-btn">
                                <v-icon start>mdi-account-plus</v-icon>
                                Join as Guest
                            </v-btn>
                        </v-btn-toggle>
                    </div>
                </div>

                <!-- Regular Login Form -->
                <div v-if="!isGuestMode && !existingGuestData" class="login-form">
                    <v-form @submit.prevent="login" ref="loginForm" v-model="formValid">
                        <v-text-field
                            v-model="credentials.email"
                            label="Email Address"
                            type="email"
                            data-testid="email-input"
                            placeholder="Enter your email"
                            required
                            :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'E-mail must be valid']"
                            class="form-field"
                            prepend-inner-icon="mdi-email"
                        ></v-text-field>
                        
                        <v-text-field
                            v-model="credentials.password"
                            label="Password"
                            type="password"
                            data-testid="password-input"
                            placeholder="Enter your password"
                            required
                            :rules="[v => !!v || 'Password is required', v => v.length >= 6 || 'Password must be at least 6 characters']"
                            class="form-field"
                            prepend-inner-icon="mdi-lock"
                        ></v-text-field>
                        
                        <!-- Test Buttons for Development -->
                        <div v-if="devMode" class="dev-section">
                            <v-divider class="mb-4"></v-divider>
                            <div class="dev-header">
                                <v-icon class="mr-2" size="20">mdi-dev-to</v-icon>
                                <span class="dev-title">Quick Test Access</span>
                            </div>
                            <div class="test-buttons">
                                <v-btn
                                    @click="fillAdminCredentials"
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    data-testid="admin-test-button"
                                    class="test-btn"
                                >
                                    <v-icon start>mdi-account-star</v-icon>
                                    Admin
                                </v-btn>
                                <v-btn
                                    @click="fillUserCredentials"
                                    variant="outlined"
                                    color="secondary"
                                    size="small"
                                    data-testid="user-test-button"
                                    class="test-btn"
                                >
                                    <v-icon start>mdi-account</v-icon>
                                    User
                                </v-btn>
                                <v-btn
                                    @click="fillOrganizerCredentials"
                                    variant="outlined"
                                    color="info"
                                    size="small"
                                    data-testid="organizer-test-button"
                                    class="test-btn"
                                >
                                    <v-icon start>mdi-account-tie</v-icon>
                                    Organizer
                                </v-btn>
                            </div>
                            <v-divider class="mt-4"></v-divider>
                        </div>

                        <v-btn 
                            :disabled="!formValid" 
                            type="submit" 
                            data-testid="login-submit-button"
                            color="primary" 
                            size="large"
                            class="login-submit-btn"
                        >
                            <v-icon start>mdi-login</v-icon>
                            Sign In
                        </v-btn>
                    </v-form>
                </div>

                <!-- Guest Join Form -->
                <div v-if="isGuestMode && !existingGuestData" class="guest-form">
                    <v-alert type="info" class="guest-info" variant="tonal">
                        <template #prepend>
                            <v-icon>mdi-rocket-launch</v-icon>
                        </template>
                        <v-alert-title class="guest-info-title">Quick Access to Any Event</v-alert-title>
                        <p class="guest-info-text">
                            Enter your event code to join instantly! You can vote, propose topics, and participate 
                            in discussions without creating any accounts.
                        </p>
                    </v-alert>
                    
                    <v-form @submit.prevent="guestJoin" v-model="guestFormValid">
                        <v-text-field
                            v-model="guestForm.eventCode"
                            label="Event Code"
                            placeholder="Enter event code (e.g., DEMO2024, SUMMIT25)"
                            required
                            :rules="[v => !!v || 'Event code is required', v => v.length >= 4 || 'Event code must be at least 4 characters']"
                            class="form-field event-code-field"
                            prepend-inner-icon="mdi-ticket-confirmation"
                            style="text-transform: uppercase;"
                            @input="guestForm.eventCode = guestForm.eventCode.toUpperCase()"
                        ></v-text-field>

                        <div class="profile-section">
                            <h4 class="profile-title">Customize Your Profile</h4>
                            
                            <v-text-field
                                v-model="guestForm.name"
                                label="Display Name (optional)"
                                placeholder="Enter your name or leave blank for random"
                                class="form-field"
                                prepend-inner-icon="mdi-account"
                            ></v-text-field>

                            <v-text-field
                                v-model="guestForm.email"
                                label="Email (optional)"
                                type="email"
                                placeholder="For device switching recovery"
                                class="form-field"
                                prepend-inner-icon="mdi-email"
                                hint="Save your email to recover your profile on other devices"
                                persistent-hint
                            ></v-text-field>

                            <!-- Icon Selection -->
                            <div class="avatar-section">
                                <v-label class="avatar-label">Choose Your Avatar</v-label>
                                <div class="avatar-grid">
                                    <v-btn
                                        v-for="icon in availableIcons"
                                        :key="icon"
                                        :class="['avatar-btn', { 'avatar-btn--selected': selectedIcon === icon }]"
                                        :color="selectedIcon === icon ? 'primary' : 'default'"
                                        :variant="selectedIcon === icon ? 'elevated' : 'outlined'"
                                        size="small"
                                        @click="selectedIcon = icon"
                                    >
                                        <v-icon :icon="icon" size="20"></v-icon>
                                    </v-btn>
                                </div>
                            </div>

                            <!-- Preview -->
                            <v-card class="profile-preview" elevation="1">
                                <div class="preview-avatar">
                                    <v-icon :icon="selectedIcon" size="32"></v-icon>
                                </div>
                                <div class="preview-content">
                                    <p class="preview-name">{{ guestForm.name || 'Random Name' }}</p>
                                    <p class="preview-code">{{ guestForm.eventCode || 'Event Code' }}</p>
                                </div>
                            </v-card>
                        </div>

                        <v-btn 
                            :disabled="!guestForm.eventCode"
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

                <!-- Error Messages -->
                <div v-if="loginError" class="message-section">
                    <v-alert type="error" variant="tonal" class="error-alert">
                        {{ isGuestMode ? 'Failed to join event. Please check your event code.' : 'Login failed' }}
                    </v-alert>
                </div>
                
                <!-- Success Messages -->
                <div v-else-if="loggedIn" class="message-section">
                    <v-alert type="success" variant="tonal" class="success-alert">
                        <p>Welcome, {{ (user as any)?.name }}</p>
                    </v-alert>
                </div>
                
                <!-- Default Message -->
                <div v-else-if="!existingGuestData" class="message-section">
                    <p class="default-message">{{ isGuestMode ? 'Join the event with a code' : 'Please log in to continue' }}</p>
                </div>
            </div>
        </v-card>
    </div>
</template>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
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
  padding: 3rem 2rem 2rem;
  position: relative;
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
  font-size: 1.8rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-subtitle {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
}

.login-content {
  padding: 2rem;
}

/* Guest Welcome Styles */
.guest-welcome {
  margin-bottom: 2rem;
}

.welcome-card {
  text-align: center;
  padding: 2rem;
  border-radius: 16px;
  background: linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%);
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.welcome-avatar {
  margin-bottom: 1rem;
}

.welcome-avatar .v-icon {
  color: #10B981;
}

.welcome-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #064E3B;
  margin-bottom: 0.5rem;
}

.welcome-subtitle {
  color: #065F46;
  margin-bottom: 1.5rem;
}

.welcome-btn {
  font-weight: 600;
  text-transform: none;
  border-radius: 12px;
  margin-bottom: 0.5rem;
}

/* Mode Toggle Styles */
.mode-toggle {
  margin-bottom: 2rem;
}

.method-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
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

.method-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
}

.method-card--active {
  border-color: #6366F1;
  background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(99, 102, 241, 0.2);
}

.method-icon {
  margin-bottom: 1rem;
}

.github-icon .v-icon {
  color: #1F2937;
}

.guest-icon .v-icon {
  color: #8B5CF6;
}

.method-card--active .github-icon .v-icon {
  color: #6366F1;
}

.method-card--active .guest-icon .v-icon {
  color: #6366F1;
}

.method-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 0.5rem;
}

.method-description {
  font-size: 0.9rem;
  color: #64748B;
  line-height: 1.4;
  margin: 0;
}

.toggle-buttons {
  display: flex;
  justify-content: center;
}

.custom-toggle {
  border-radius: 12px;
  overflow: hidden;
}

.toggle-btn {
  text-transform: none;
  font-weight: 600;
  padding: 12px 24px;
}

/* Form Styles */
.login-form, .guest-form {
  margin-bottom: 1rem;
}

.form-field {
  margin-bottom: 1.5rem;
}

.form-field :deep(.v-field) {
  border-radius: 12px;
}

.event-code-field :deep(.v-field__input) {
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Dev Section */
.dev-section {
  margin: 1.5rem 0;
}

.dev-header {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: #64748B;
}

.dev-title {
  font-size: 0.9rem;
  font-weight: 600;
}

.test-buttons {
  display: flex;
  gap: 0.5rem;
}

.test-btn {
  flex: 1;
  text-transform: none;
  font-weight: 600;
  border-radius: 8px;
}

/* Guest Form Specific Styles */
.guest-info {
  margin-bottom: 1.5rem;
  border-radius: 12px;
}

.guest-info-title {
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.guest-info-text {
  margin: 0;
  line-height: 1.5;
}

.profile-section {
  margin: 2rem 0;
}

.profile-title {
  text-align: center;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
}

.avatar-section {
  margin: 1.5rem 0;
}

.avatar-label {
  display: block;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 1rem;
  text-align: center;
}

.avatar-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  max-height: 120px;
  overflow-y: auto;
  padding: 0.5rem;
}

.avatar-btn {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.avatar-btn--selected {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.profile-preview {
  padding: 1.5rem;
  text-align: center;
  margin: 1.5rem 0;
  border-radius: 16px;
  background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%);
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.preview-avatar {
  margin-bottom: 1rem;
}

.preview-avatar .v-icon {
  color: #6366F1;
}

.preview-name {
  font-weight: 700;
  color: #1E293B;
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.preview-code {
  color: #64748B;
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Button Styles */
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

/* Message Styles */
.message-section {
  margin-top: 1.5rem;
}

.error-alert,
.success-alert {
  border-radius: 12px;
}

.default-message {
  text-align: center;
  color: #64748B;
  font-style: italic;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 600px) {
  .login-container {
    padding: 1rem;
  }
  
  .login-header {
    padding: 2rem 1.5rem 1.5rem;
  }
  
  .header-title {
    font-size: 1.5rem;
  }
  
  .login-content {
    padding: 1.5rem;
  }
  
  .method-cards {
    grid-template-columns: 1fr;
  }
  
  .test-buttons {
    flex-direction: column;
  }
  
  .avatar-grid {
    max-height: 80px;
  }
}

/* Dark mode support */
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

.v-theme--dark .method-title {
  color: #F1F5F9;
}

.v-theme--dark .method-description {
  color: #CBD5E1;
}

.v-theme--dark .profile-preview {
  background: linear-gradient(135deg, #334155 0%, #475569 100%);
  border-color: rgba(71, 85, 105, 0.3);
}

.v-theme--dark .preview-name {
  color: #F1F5F9;
}

.v-theme--dark .preview-code {
  color: #CBD5E1;
}
</style>

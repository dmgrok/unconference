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
    <v-card class="pa-5" max-width="500" min-width="400">
        <!-- Existing Guest Welcome -->
        <div v-if="existingGuestData && !isGuestMode" class="text-center mb-4">
            <v-card variant="outlined" class="pa-4 mb-4" color="success">
                <v-icon :icon="existingGuestData.icon || 'mdi-account'" size="48" class="mb-2"></v-icon>
                <h3>Welcome back, {{ existingGuestData.name }}!</h3>
                <p class="text-caption mb-3">Continue with your previous session</p>
                <v-btn color="success" @click="continueAsGuest" block class="mb-2">
                    <v-icon start>mdi-login</v-icon>
                    Continue as {{ existingGuestData.name }}
                </v-btn>
                <v-btn color="grey" variant="text" @click="existingGuestData = null" size="small">
                    Use different account
                </v-btn>
            </v-card>
        </div>

        <!-- Mode Toggle -->
        <div class="text-center mb-4" v-if="!existingGuestData">
            <v-card variant="outlined" class="pa-4 mb-4">
                <v-card-title class="text-h6 mb-3">Choose Your Login Method</v-card-title>
                <v-card-text>
                    <v-row>
                        <v-col cols="6">
                            <v-card 
                                :color="!isGuestMode ? 'primary' : 'grey-lighten-3'" 
                                :variant="!isGuestMode ? 'flat' : 'outlined'"
                                class="pa-3 text-center cursor-pointer"
                                @click="switchToLogin"
                            >
                                <v-icon size="48" class="mb-2">mdi-github</v-icon>
                                <h3>GitHub Account</h3>
                                <p class="text-caption mt-2">
                                    Full features, edit topics, admin access
                                </p>
                            </v-card>
                        </v-col>
                        <v-col cols="6">
                            <v-card 
                                :color="isGuestMode ? 'secondary' : 'grey-lighten-3'" 
                                :variant="isGuestMode ? 'flat' : 'outlined'"
                                class="pa-3 text-center cursor-pointer"
                                @click="switchToGuest"
                            >
                                <v-icon size="48" class="mb-2">mdi-account-question</v-icon>
                                <h3>Guest Access</h3>
                                <p class="text-caption mt-2">
                                    Anonymous, vote & participate, no setup
                                </p>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>

            <v-btn-toggle 
                :model-value="isGuestMode ? 1 : 0"
                @update:model-value="isGuestMode = !!$event"
                color="primary" 
                variant="outlined"
                mandatory
                class="mb-4"
            >
                <v-btn :value="0">
                    <v-icon start>mdi-account-key</v-icon>
                    Login
                </v-btn>
                <v-btn :value="1">
                    <v-icon start>mdi-account-plus</v-icon>
                    Join as Guest
                </v-btn>
            </v-btn-toggle>
        </div>

        <!-- Regular Login Form -->
        <div v-if="!isGuestMode && !existingGuestData">
            <v-form @submit.prevent="login" ref="loginForm" v-model="formValid">
                <v-text-field
                    v-model="credentials.email"
                    label="Email"
                    type="email"
                    data-testid="email-input"
                    placeholder="Email"
                    required
                    :rules="[v => !!v || 'Email is required', v => /.+@.+\..+/.test(v) || 'E-mail must be valid']"
                    class="mb-4"
                ></v-text-field>
                <v-text-field
                    v-model="credentials.password"
                    label="Password"
                    type="password"
                    data-testid="password-input"
                    placeholder="Password"
                    required
                    :rules="[v => !!v || 'Password is required', v => v.length >= 6 || 'Password must be at least 6 characters']"
                    class="mb-4"
                ></v-text-field>
                
                <!-- Test Buttons for Development -->
                <div v-if="devMode" class="mb-4">
                    <v-divider class="mb-3"></v-divider>
                    <div class="text-center mb-2">
                        <small class="text-grey">Quick Test Access</small>
                    </div>
                    <div class="d-flex gap-2">
                        <v-btn
                            @click="fillAdminCredentials"
                            variant="outlined"
                            color="primary"
                            size="small"
                            data-testid="admin-test-button"
                            class="flex-grow-1"
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
                            class="flex-grow-1"
                        >
                            <v-icon start>mdi-account</v-icon>
                            User
                        </v-btn>
                    </div>
                    <v-divider class="mt-3"></v-divider>
                </div>

                <v-btn 
                    :disabled="!formValid" 
                    type="submit" 
                    data-testid="login-submit-button"
                    color="primary" 
                    block
                >
                    Login
                </v-btn>
            </v-form>
        </div>

        <!-- Guest Join Form -->
        <div v-if="isGuestMode && !existingGuestData">
            <v-alert type="info" variant="tonal" class="mb-4">
                <v-alert-title>
                    <v-icon class="mr-2">mdi-rocket-launch</v-icon>
                    Quick Access to Any Event
                </v-alert-title>
                <p class="mt-2 text-body-2">
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
                    class="mb-4"
                    prepend-icon="mdi-ticket-confirmation"
                    style="text-transform: uppercase;"
                    @input="guestForm.eventCode = guestForm.eventCode.toUpperCase()"
                ></v-text-field>

                <v-divider class="mb-4"></v-divider>
                <h4 class="text-center mb-3">Customize Your Profile</h4>

                <v-text-field
                    v-model="guestForm.name"
                    label="Display Name (optional)"
                    placeholder="Enter your name or leave blank for random"
                    class="mb-4"
                    prepend-icon="mdi-account"
                ></v-text-field>

                <v-text-field
                    v-model="guestForm.email"
                    label="Email (optional)"
                    type="email"
                    placeholder="For device switching recovery"
                    class="mb-4"
                    prepend-icon="mdi-email"
                    hint="Save your email to recover your profile on other devices"
                    persistent-hint
                ></v-text-field>

                <!-- Icon Selection -->
                <div class="mb-4">
                    <v-label class="text-caption mb-2">Choose Your Avatar</v-label>
                    <div class="d-flex flex-wrap gap-2 justify-center mt-2">
                        <v-btn
                            v-for="icon in availableIcons"
                            :key="icon"
                            :color="selectedIcon === icon ? 'primary' : 'grey'"
                            :variant="selectedIcon === icon ? 'elevated' : 'outlined'"
                            size="small"
                            @click="selectedIcon = icon"
                            class="icon-btn"
                        >
                            <v-icon :icon="icon" size="20"></v-icon>
                        </v-btn>
                    </div>
                </div>

                <!-- Preview -->
                <v-card variant="outlined" class="pa-3 mb-4 text-center">
                    <v-icon :icon="selectedIcon" size="32" class="mb-2"></v-icon>
                    <p class="text-body-2 mb-0">
                        <strong>{{ guestForm.name || 'Random Name' }}</strong>
                    </p>
                    <p class="text-caption text-grey">
                        {{ guestForm.eventCode || 'Event Code' }}
                    </p>
                </v-card>

                <v-btn 
                    :disabled="!guestForm.eventCode"
                    type="submit" 
                    color="success" 
                    block
                    size="large"
                >
                    <v-icon start>mdi-login</v-icon>
                    Join Event
                </v-btn>
            </v-form>
        </div>

        <!-- Error Messages -->
        <div v-if="loginError" class="error mt-4 text-center">
            <v-alert type="error" variant="tonal">
                {{ isGuestMode ? 'Failed to join event. Please check your event code.' : 'Login failed' }}
            </v-alert>
        </div>
        
        <!-- Success Messages -->
        <div v-else-if="loggedIn" class="mt-4 text-center">
            <v-alert type="success" variant="tonal">
                <p>Welcome, {{ (user as any)?.name }}</p>
            </v-alert>
        </div>
        
        <!-- Default Message -->
        <div v-else-if="!existingGuestData" class="mt-4 text-center">
            <p class="text-grey">{{ isGuestMode ? 'Join the event with a code' : 'Please log in to continue' }}</p>
        </div>
    </v-card>
</template>

<style scoped>
.icon-btn {
    width: 40px;
    height: 40px;
    min-width: 40px;
}
</style>

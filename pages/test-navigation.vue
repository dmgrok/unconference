<template>
  <div class="pa-6">
    <h1 class="text-h4 mb-6">Event Navigation Test</h1>
    
    <v-alert type="info" class="mb-6">
      <v-alert-title>Testing Multi-Event User Experience</v-alert-title>
      <p>Use these links to test the new event navigation system:</p>
    </v-alert>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <v-card-title>Direct Event Links</v-card-title>
          <v-card-text>
            <p class="mb-4">Test direct event joining with codes:</p>
            
            <div class="d-flex flex-column gap-2">
              <v-btn 
                color="primary" 
                variant="outlined"
                :href="`/join/DEMO2024`"
                target="_blank"
                prepend-icon="mdi-link"
              >
                /join/DEMO2024
              </v-btn>
              
              <v-btn 
                color="secondary" 
                variant="outlined"
                :href="`/join/SUMMIT25`"
                target="_blank"
                prepend-icon="mdi-link"
              >
                /join/SUMMIT25
              </v-btn>
              
              <v-btn 
                color="success" 
                variant="outlined"
                :href="`/?code=TECH2024`"
                target="_blank"
                prepend-icon="mdi-link"
              >
                /?code=TECH2024
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <v-card-title>Login with Event Context</v-card-title>
          <v-card-text>
            <p class="mb-4">Test login flow with event codes:</p>
            
            <div class="d-flex flex-column gap-2">
              <v-btn 
                color="primary" 
                variant="outlined"
                :href="`/login?code=DEMO2024`"
                target="_blank"
                prepend-icon="mdi-login"
              >
                Login with DEMO2024
              </v-btn>
              
              <v-btn 
                color="secondary" 
                variant="outlined"
                :href="`/register?code=SUMMIT25`"
                target="_blank"
                prepend-icon="mdi-account-plus"
              >
                Register with SUMMIT25
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="mt-6 pa-4">
      <v-card-title>Expected Behavior</v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item prepend-icon="mdi-check-circle" color="success">
            <v-list-item-title>Unauthenticated users see login form with event code pre-filled</v-list-item-title>
          </v-list-item>
          <v-list-item prepend-icon="mdi-check-circle" color="success">
            <v-list-item-title>After login, users automatically join the specified event</v-list-item-title>
          </v-list-item>
          <v-list-item prepend-icon="mdi-check-circle" color="success">
            <v-list-item-title>Users with one event go directly to voting/dashboard</v-list-item-title>
          </v-list-item>
          <v-list-item prepend-icon="mdi-check-circle" color="success">
            <v-list-item-title>Users with multiple events see event selection page</v-list-item-title>
          </v-list-item>
          <v-list-item prepend-icon="mdi-check-circle" color="success">
            <v-list-item-title>Guest users can join directly with event codes</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>

    <v-card class="mt-6 pa-4">
      <v-card-title>Current User Status</v-card-title>
      <v-card-text>
        <div v-if="loggedIn">
          <p><strong>User:</strong> {{ (user as any)?.name }}</p>
          <p><strong>Email:</strong> {{ (user as any)?.email }}</p>
          <p><strong>Role:</strong> {{ (user as any)?.role }}</p>
          <p><strong>Global Role:</strong> {{ (user as any)?.globalRole }}</p>
          <p><strong>Current Event:</strong> {{ (user as any)?.currentEventId || 'None' }}</p>
          
          <div class="mt-4">
            <v-btn color="primary" @click="testPostLoginRedirect">
              Test Post-Login Redirect
            </v-btn>
            <v-btn color="secondary" class="ml-2" @click="logout">
              Logout
            </v-btn>
          </div>
        </div>
        <div v-else>
          <p>Not logged in</p>
          <v-btn color="primary" to="/login">
            Login
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Event Navigation Test'
})

const { loggedIn, user, clear } = useUserSession()

async function testPostLoginRedirect() {
  try {
    const response = await $fetch('/api/auth/post-login-redirect') as { redirect: string, reason: string }
    console.log('Post-login redirect response:', response)
    alert(`Redirect: ${response.redirect}\nReason: ${response.reason}`)
  } catch (error) {
    console.error('Failed to test redirect:', error)
    alert('Failed to test redirect: ' + error)
  }
}

async function logout() {
  await clear()
  await navigateTo('/')
}
</script>

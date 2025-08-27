<template>
  <div>
    <h1>Super Admin UI Test Page</h1>
    <p>This is a test page to demonstrate the super admin interface without authentication.</p>
    
    <div class="mt-4">
      <v-btn color="primary" @click="openDashboard">
        View Super Admin Dashboard
      </v-btn>
      <v-btn color="secondary" @click="openEvents" class="ml-2">
        View Events Management
      </v-btn>
      <v-btn color="info" @click="openUsers" class="ml-2">
        View User Management
      </v-btn>
      <v-btn color="warning" @click="openSettings" class="ml-2">
        View Platform Settings
      </v-btn>
    </div>

    <!-- Embedded Dashboard Demo -->
    <v-card class="mt-6" v-if="showDemo">
      <v-card-title>{{ demoTitle }}</v-card-title>
      <v-card-text>
        <iframe 
          :src="demoUrl" 
          width="100%" 
          height="600"
          style="border: 1px solid #ccc;"
        />
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
const showDemo = ref(false)
const demoTitle = ref('')
const demoUrl = ref('')

function openDashboard() {
  showDemo.value = true
  demoTitle.value = 'Super Admin Dashboard'
  demoUrl.value = '/super-admin/dashboard'
}

function openEvents() {
  showDemo.value = true
  demoTitle.value = 'Events Management'
  demoUrl.value = '/super-admin/events'
}

function openUsers() {
  showDemo.value = true
  demoTitle.value = 'User Management'
  demoUrl.value = '/super-admin/users'
}

function openSettings() {
  showDemo.value = true
  demoTitle.value = 'Platform Settings'
  demoUrl.value = '/super-admin/settings'
}
</script>

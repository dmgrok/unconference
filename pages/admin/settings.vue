<template>
  <v-container class="pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold">Platform Settings</h1>
        <p class="text-body-1 mt-2">Configure platform-wide settings and policies</p>
      </div>
      
      <div class="d-flex gap-2">
        <v-btn color="success" prepend-icon="mdi-content-save" @click="saveSettings" :loading="saving">
          Save Changes
        </v-btn>
        <v-btn color="secondary" prepend-icon="mdi-arrow-left" to="/admin/dashboard">
          Back to Dashboard
        </v-btn>
      </div>
    </div>

    <v-row>
      <!-- General Settings -->
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title>General Settings</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="settings.platformName"
              label="Platform Name"
              variant="outlined"
              class="mb-4"
            />
            <v-textarea
              v-model="settings.platformDescription"
              label="Platform Description"
              variant="outlined"
              rows="3"
              class="mb-4"
            />
            <v-text-field
              v-model="settings.supportEmail"
              label="Support Email"
              variant="outlined"
              type="email"
              class="mb-4"
            />
            <v-text-field
              v-model="settings.maxEventsPerOrganizer"
              label="Max Events per Organizer"
              variant="outlined"
              type="number"
            />
          </v-card-text>
        </v-card>

        <!-- User Registration Settings -->
        <v-card class="mb-4">
          <v-card-title>User Registration</v-card-title>
          <v-card-text>
            <v-switch
              v-model="settings.allowPublicRegistration"
              label="Allow Public Registration"
              color="primary"
              class="mb-4"
            />
            <v-switch
              v-model="settings.requireEmailVerification"
              label="Require Email Verification"
              color="primary"
              class="mb-4"
            />
            <v-switch
              v-model="settings.allowGuestAccess"
              label="Allow Guest Access to Events"
              color="primary"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Security & Limits -->
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title>Security Settings</v-card-title>
          <v-card-text>
            <v-text-field
              v-model="settings.sessionTimeoutMinutes"
              label="Session Timeout (minutes)"
              variant="outlined"
              type="number"
              class="mb-4"
            />
            <v-text-field
              v-model="settings.maxParticipantsPerEvent"
              label="Max Participants per Event"
              variant="outlined"
              type="number"
              class="mb-4"
            />
            <v-text-field
              v-model="settings.maxTopicsPerEvent"
              label="Max Topics per Event"
              variant="outlined"
              type="number"
              class="mb-4"
            />
            <v-switch
              v-model="settings.enableAuditLog"
              label="Enable Audit Logging"
              color="primary"
            />
          </v-card-text>
        </v-card>

        <!-- Feature Flags -->
        <v-card class="mb-4">
          <v-card-title>Feature Flags</v-card-title>
          <v-card-text>
            <v-switch
              v-model="settings.features.multiEvent"
              label="Multi-Event Support"
              color="primary"
              class="mb-2"
            />
            <v-switch
              v-model="settings.features.qrCodeJoin"
              label="QR Code Joining"
              color="primary"
              class="mb-2"
            />
            <v-switch
              v-model="settings.features.realTimeUpdates"
              label="Real-time Updates"
              color="primary"
              class="mb-2"
            />
            <v-switch
              v-model="settings.features.analytics"
              label="Analytics Dashboard"
              color="primary"
              class="mb-2"
            />
            <v-switch
              v-model="settings.features.eventCloning"
              label="Event Cloning"
              color="primary"
              class="mb-2"
            />
            <v-switch
              v-model="settings.features.advancedPermissions"
              label="Advanced Permissions"
              color="primary"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Notification Settings -->
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title>Notification Settings</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <v-switch
                  v-model="settings.notifications.emailEnabled"
                  label="Enable Email Notifications"
                  color="primary"
                  class="mb-2"
                />
                <v-switch
                  v-model="settings.notifications.eventCreated"
                  label="Notify on Event Creation"
                  color="primary"
                  class="mb-2"
                />
                <v-switch
                  v-model="settings.notifications.userRegistered"
                  label="Notify on User Registration"
                  color="primary"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="settings.notifications.fromEmail"
                  label="From Email Address"
                  variant="outlined"
                  type="email"
                  class="mb-4"
                />
                <v-text-field
                  v-model="settings.notifications.fromName"
                  label="From Name"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Data Management -->
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title>Data Management</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="settings.dataRetentionDays"
                  label="Data Retention (days)"
                  variant="outlined"
                  type="number"
                  hint="0 = keep forever"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-switch
                  v-model="settings.autoBackup"
                  label="Automatic Backups"
                  color="primary"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="settings.backupFrequencyHours"
                  label="Backup Frequency (hours)"
                  variant="outlined"
                  type="number"
                  :disabled="!settings.autoBackup"
                />
              </v-col>
            </v-row>

            <v-divider class="my-4" />

            <div class="d-flex gap-2">
              <v-btn color="primary" prepend-icon="mdi-download" @click="exportData">
                Export Platform Data
              </v-btn>
              <v-btn color="warning" prepend-icon="mdi-backup-restore" @click="backupNow">
                Backup Now
              </v-btn>
              <v-btn color="info" prepend-icon="mdi-chart-line" @click="generateReport">
                Generate Analytics Report
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Global Announcements -->
      <v-col cols="12">
        <v-card>
          <v-card-title>Global Announcements</v-card-title>
          <v-card-text>
            <v-switch
              v-model="settings.announcement.enabled"
              label="Show Global Announcement"
              color="primary"
              class="mb-4"
            />
            
            <div v-if="settings.announcement.enabled">
              <v-select
                v-model="settings.announcement.type"
                :items="announcementTypes"
                label="Announcement Type"
                variant="outlined"
                class="mb-4"
              />
              <v-text-field
                v-model="settings.announcement.title"
                label="Announcement Title"
                variant="outlined"
                class="mb-4"
              />
              <v-textarea
                v-model="settings.announcement.message"
                label="Announcement Message"
                variant="outlined"
                rows="3"
                class="mb-4"
              />
              <v-text-field
                v-model="settings.announcement.expiresAt"
                label="Expires At"
                variant="outlined"
                type="datetime-local"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'admin'
})

const { user } = useUserSession()

// Check if user is super admin
const isAdmin = computed(() => (user.value as any)?.globalRole === 'Admin')
if (!isAdmin.value) {
  throw createError({ statusCode: 403, statusMessage: 'Super Admin access required' })
}

// Data
const saving = ref(false)

const settings = ref({
  platformName: 'Unconference Platform',
  platformDescription: 'A platform for organizing discussion-based unconferences',
  supportEmail: 'support@unconference.com',
  maxEventsPerOrganizer: 10,
  allowPublicRegistration: true,
  requireEmailVerification: false,
  allowGuestAccess: true,
  sessionTimeoutMinutes: 480,
  maxParticipantsPerEvent: 500,
  maxTopicsPerEvent: 100,
  enableAuditLog: true,
  dataRetentionDays: 365,
  autoBackup: true,
  backupFrequencyHours: 24,
  features: {
    multiEvent: true,
    qrCodeJoin: true,
    realTimeUpdates: true,
    analytics: true,
    eventCloning: true,
    advancedPermissions: false
  },
  notifications: {
    emailEnabled: true,
    eventCreated: true,
    userRegistered: true,
    fromEmail: 'noreply@unconference.com',
    fromName: 'Unconference Platform'
  },
  announcement: {
    enabled: false,
    type: 'info',
    title: '',
    message: '',
    expiresAt: ''
  }
})

const announcementTypes = [
  { title: 'Information', value: 'info' },
  { title: 'Warning', value: 'warning' },
  { title: 'Success', value: 'success' },
  { title: 'Error', value: 'error' }
]

// Methods
async function loadSettings() {
  try {
    const response = await $fetch('/api/admin/settings') as any
    if (response.settings) {
      settings.value = { ...settings.value, ...response.settings }
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
  }
}

async function saveSettings() {
  saving.value = true
  try {
    await $fetch('/api/admin/settings', {
      method: 'PUT',
      body: { settings: settings.value }
    })
    // Show success message
    alert('Settings saved successfully!')
  } catch (error) {
    console.error('Failed to save settings:', error)
    alert('Failed to save settings')
  } finally {
    saving.value = false
  }
}

async function exportData() {
  try {
    const response = await $fetch('/api/admin/export', {
      method: 'POST'
    }) as any
    
    // Create download link
    const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `platform-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to export data:', error)
    alert('Failed to export data')
  }
}

async function backupNow() {
  try {
    await $fetch('/api/admin/backup', {
      method: 'POST'
    })
    alert('Backup completed successfully!')
  } catch (error) {
    console.error('Failed to create backup:', error)
    alert('Failed to create backup')
  }
}

async function generateReport() {
  try {
    const response = await $fetch('/api/admin/analytics/report', {
      method: 'POST'
    }) as any
    
    // Create download link for PDF or Excel report
    const blob = new Blob([response.data], { type: response.mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to generate report:', error)
    alert('Failed to generate analytics report')
  }
}

onMounted(() => {
  loadSettings()
})
</script>

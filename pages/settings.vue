<script setup lang="ts">
const { user } = useUserSession()

// Redirect super admins to their platform settings
const isSuperAdmin = computed(() => (user.value as any)?.globalRole === 'SuperAdmin')
if (isSuperAdmin.value) {
  await navigateTo('/super-admin/settings')
}

const config = useRuntimeConfig()
const { eventConfig, updateEventConfig } = useEventConfig()
const { applyTheme, getCurrentTheme, initializeTheme, setupAutoThemeWatcher } = useAppTheme()
const { settings: adminSettings, updateSetting } = useAdminSettings()
const { settings: viewerModeSettings, toggleViewerMode, isViewerMode } = useViewerMode()

// Initialize theme on component mount
onMounted(async () => {
  initializeTheme()
  setupAutoThemeWatcher()
  
  // Load admin settings from API
  try {
    const loadedSettings = await $fetch('/api/admin/settings')
    // Update local settings
    settings.admin.maxVotesPerTopic = loadedSettings.maxVotesPerTopic
    settings.admin.topTopicsCount = loadedSettings.topTopicsCount
    settings.admin.showVoterNames = loadedSettings.showVoterNames
    settings.admin.allowTopicSubmission = loadedSettings.allowTopicSubmission
    settings.admin.autoStartNewRound = loadedSettings.autoStartNewRound
    settings.admin.roundDurationMinutes = loadedSettings.roundDurationMinutes || 20
    settings.admin.maxTopicsPerRound = loadedSettings.maxTopicsPerRound || 8
  } catch (error) {
    console.warn('Failed to load admin settings, using defaults')
  }
})

// Settings data
const settings = reactive({
  user: {
    name: user.value?.name || '',
    email: user.value?.email || '',
    notifications: true,
    theme: getCurrentTheme()
  },
  admin: {
    maxVotesPerTopic: config.public.maxVotesPerTopic || 12,
    topTopicsCount: config.public.topTopicsCount || 10,
    allowTopicSubmission: true,
    autoStartNewRound: false,
    roundDurationMinutes: 20,
    maxTopicsPerRound: 8,
    showVoterNames: adminSettings.value.showVoterNames,
    eventInfo: {
      title: eventConfig.title,
      description: eventConfig.description,
      dates: eventConfig.dates,
      location: eventConfig.location
    },
    defaultTopics: [
      {
        title: 'Copilot and MCP servers',
        description: 'MCP servers are changing the landscape of AI. How do we leverage them securely?'
      },
      {
        title: 'GitHub Actions Hosted Runners optimization',
        description: 'Private networking and custom images are bringing new possibilities to GitHub Actions. How do we leverage them?'
      }
    ]
  }
})

const saving = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')
const eventInfoSaving = ref(false)
const userSettingsSaving = ref(false)
const adminSettingsSaving = ref(false)
const defaultTopicsSaving = ref(false)
const qrCode = ref('')
const qrCodeGenerated = ref(false)
const qrGenerating = ref(false)
const eventCodeForm = ref({
  eventCode: 'DEMO2024',
  eventName: 'Demo Unconference 2024'
})

// Check if user is admin or organizer
const isAdmin = computed(() => (user.value as any)?.Role === 'Admin' || (user.value as any)?.role === 'Admin')
const isOrganizer = computed(() => (user.value as any)?.Role === 'Organizer' || (user.value as any)?.role === 'Organizer')
const hasEventAccess = computed(() => isAdmin.value || isOrganizer.value)

// Event and user context for organizer management
const { currentEventId } = useEventContext()
const currentUserId = computed(() => (user.value as any)?.id || (user.value as any)?.email)
const userRole = computed(() => {
  if (isAdmin.value) return 'Admin'
  if (isOrganizer.value) return 'Organizer'
  return 'Participant'
})

// Theme options
const themeOptions = [
  { title: 'Light', value: 'light' },
  { title: 'Dark', value: 'dark' },
  { title: 'Auto', value: 'auto' }
]

async function startNewRound() {
  const confirmed = confirm('Are you sure you want to start a new round? This will reset all votes and award badges to top topics.')
  if (!confirmed) return

  saving.value = true
  try {
    await $fetch('/api/topics/new-round', { method: 'POST' })
    message.value = 'New round started successfully!'
    messageType.value = 'success'
  } catch (error) {
    message.value = 'Failed to start new round'
    messageType.value = 'error'
  } finally {
    saving.value = false
  }
}

async function exportData() {
  try {
    const topics = await $fetch('/api/topics')
    const dataStr = JSON.stringify(topics, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `unconference-topics-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    
    message.value = 'Topics exported successfully!'
    messageType.value = 'success'
  } catch (error) {
    message.value = 'Failed to export topics'
    messageType.value = 'error'
  }
}

function addDefaultTopic() {
  settings.admin.defaultTopics.push({
    title: '',
    description: ''
  })
}

function removeDefaultTopic(index: number) {
  settings.admin.defaultTopics.splice(index, 1)
}

async function loadDefaultTopics() {
  const confirmed = confirm('Are you sure you want to load default topics? This will replace all current topics with the default ones.')
  if (!confirmed) return

  saving.value = true
  try {
    // Here you would typically save to an API endpoint that loads default topics
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    message.value = 'Default topics loaded successfully!'
    messageType.value = 'success'
  } catch (error) {
    message.value = 'Failed to load default topics'
    messageType.value = 'error'
  } finally {
    saving.value = false
  }
}

async function updateEventInfo() {
  const confirmed = confirm('Are you sure you want to update the event information on the homepage?')
  if (!confirmed) return

  saving.value = true
  try {
    // Here you would typically save to an API endpoint that updates the event info
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    message.value = 'Event information updated successfully!'
    messageType.value = 'success'
  } catch (error) {
    message.value = 'Failed to update event information'
    messageType.value = 'error'
  } finally {
    saving.value = false
  }
}

async function generateQRCode() {
  if (!eventCodeForm.value.eventCode || !eventCodeForm.value.eventName) {
    message.value = 'Event code and name are required'
    messageType.value = 'error'
    return
  }

  qrGenerating.value = true
  try {
    const response = await $fetch('/api/admin/generate-qr', {
      method: 'POST',
      body: {
        eventCode: eventCodeForm.value.eventCode,
        eventName: eventCodeForm.value.eventName
      }
    })
    
    qrCode.value = response.qrCode
    qrCodeGenerated.value = true
    message.value = `QR code generated! Join URL: ${response.joinUrl}`
    messageType.value = 'success'
  } catch (error: any) {
    message.value = error.data?.message || 'Failed to generate QR code'
    messageType.value = 'error'
  } finally {
    qrGenerating.value = false
  }
}

function downloadQRCode() {
  if (!qrCode.value) return
  
  const link = document.createElement('a')
  link.href = qrCode.value
  link.download = `qr-code-${eventCodeForm.value.eventCode}.png`
  link.click()
}

// Auto-save functions with debouncing
let userSettingsTimeout: NodeJS.Timeout | null = null
let adminSettingsTimeout: NodeJS.Timeout | null = null
let defaultTopicsTimeout: NodeJS.Timeout | null = null
let eventInfoTimeout: NodeJS.Timeout | null = null

// Auto-save user settings
async function autoSaveUserSettings() {
  if (userSettingsSaving.value) return
  
  userSettingsSaving.value = true
  try {
    // Apply theme change immediately
    applyTheme(settings.user.theme)
    
    // Here you would typically save to an API endpoint
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('User settings auto-saved')
  } catch (error) {
    console.error('Failed to auto-save user settings:', error)
  } finally {
    userSettingsSaving.value = false
  }
}

// Auto-save admin settings
async function autoSaveAdminSettings() {
  if (adminSettingsSaving.value) return
  
  adminSettingsSaving.value = true
  try {
    // Save settings via API
    await $fetch('/api/admin/settings', {
      method: 'POST',
      body: {
        maxVotesPerTopic: settings.admin.maxVotesPerTopic,
        topTopicsCount: settings.admin.topTopicsCount,
        showVoterNames: settings.admin.showVoterNames,
        allowTopicSubmission: settings.admin.allowTopicSubmission,
        autoStartNewRound: settings.admin.autoStartNewRound,
        roundDurationMinutes: settings.admin.roundDurationMinutes,
        maxTopicsPerRound: settings.admin.maxTopicsPerRound
      }
    })
    
    // Also update the global admin settings composable
    updateSetting('showVoterNames', settings.admin.showVoterNames)
    updateSetting('maxVotesPerTopic', settings.admin.maxVotesPerTopic)
    updateSetting('topTopicsCount', settings.admin.topTopicsCount)
    updateSetting('allowTopicSubmission', settings.admin.allowTopicSubmission)
    updateSetting('autoStartNewRound', settings.admin.autoStartNewRound)
    updateSetting('roundDurationMinutes', settings.admin.roundDurationMinutes)
    updateSetting('maxTopicsPerRound', settings.admin.maxTopicsPerRound)
    
    console.log('Admin settings auto-saved')
  } catch (error) {
    console.error('Failed to auto-save admin settings:', error)
    message.value = 'Failed to save admin settings'
    messageType.value = 'error'
  } finally {
    adminSettingsSaving.value = false
  }
}

// Auto-save default topics
async function autoSaveDefaultTopics() {
  if (defaultTopicsSaving.value) return
  
  defaultTopicsSaving.value = true
  try {
    // Here you would typically save to an API endpoint
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('Default topics auto-saved')
  } catch (error) {
    console.error('Failed to auto-save default topics:', error)
  } finally {
    defaultTopicsSaving.value = false
  }
}

// Auto-save event information
async function autoSaveEventInfo() {
  if (eventInfoSaving.value) return
  
  eventInfoSaving.value = true
  try {
    // Update the global event configuration immediately
    updateEventConfig(settings.admin.eventInfo)
    
    // Here you would typically save to an API endpoint
    await new Promise(resolve => setTimeout(resolve, 500))
    console.log('Event information auto-saved')
  } catch (error) {
    console.error('Failed to auto-save event information:', error)
  } finally {
    eventInfoSaving.value = false
  }
}

// Watchers for auto-save with debouncing
watch(() => settings.user, () => {
  if (userSettingsTimeout) {
    clearTimeout(userSettingsTimeout)
  }
  userSettingsTimeout = setTimeout(() => {
    autoSaveUserSettings()
  }, 1000)
}, { deep: true })

watch(() => [settings.admin.maxVotesPerTopic, settings.admin.topTopicsCount, settings.admin.allowTopicSubmission, settings.admin.autoStartNewRound, settings.admin.showVoterNames, settings.admin.roundDurationMinutes, settings.admin.maxTopicsPerRound], () => {
  if (adminSettingsTimeout) {
    clearTimeout(adminSettingsTimeout)
  }
  adminSettingsTimeout = setTimeout(() => {
    autoSaveAdminSettings()
  }, 1000)
}, { deep: true })

watch(() => settings.admin.defaultTopics, () => {
  if (defaultTopicsTimeout) {
    clearTimeout(defaultTopicsTimeout)
  }
  defaultTopicsTimeout = setTimeout(() => {
    autoSaveDefaultTopics()
  }, 1000)
}, { deep: true })

watch(() => settings.admin.eventInfo, () => {
  if (eventInfoTimeout) {
    clearTimeout(eventInfoTimeout)
  }
  eventInfoTimeout = setTimeout(() => {
    autoSaveEventInfo()
  }, 1000)
}, { deep: true })

definePageMeta({
  middleware: 'authenticated',
  requiresAdmin: true
})
</script>

<template>
  <div class="settings-page">
    <v-container max-width="800">
      <h1 class="text-h4 mb-6 text-primary">Settings</h1>
      
      <!-- Alert Messages -->
      <v-alert
        v-if="message"
        :type="messageType"
        dismissible
        class="mb-6"
        @click:close="message = ''"
      >
        {{ message }}
      </v-alert>

      <!-- User Settings Section -->
      <v-card class="mb-6">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-account-cog</v-icon>
          User Settings
          <v-spacer></v-spacer>
          <v-chip 
            v-if="userSettingsSaving" 
            color="primary" 
            size="small"
            prepend-icon="mdi-loading mdi-spin"
          >
            Auto-saving...
          </v-chip>
          <v-chip 
            v-else
            color="success" 
            size="small"
            prepend-icon="mdi-check"
          >
            Auto-save enabled
          </v-chip>
        </v-card-title>
        <v-card-text>
          <v-alert
            type="info"
            variant="tonal"
            class="mb-4"
            prepend-icon="mdi-information"
          >
            Your settings are automatically saved as you make changes. Changes take effect immediately.
          </v-alert>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="settings.user.name"
                label="Display Name"
                prepend-icon="mdi-account"
                readonly
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="settings.user.email"
                label="Email"
                prepend-icon="mdi-email"
                readonly
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="settings.user.theme"
                :items="themeOptions"
                label="Theme Preference"
                prepend-icon="mdi-palette"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-switch
                v-model="settings.user.notifications"
                label="Email Notifications"
                color="primary"
              ></v-switch>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Admin Settings Section (Visible to admins and organizers) -->
      <v-card v-if="hasEventAccess" class="mb-6">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-shield-crown</v-icon>
          Admin Settings
          <v-chip class="ml-2" color="warning" size="small">
            {{ isAdmin ? 'Admin Only' : 'Organizer Access' }}
          </v-chip>
          <v-spacer></v-spacer>
          <v-chip 
            v-if="adminSettingsSaving" 
            color="primary" 
            size="small"
            prepend-icon="mdi-loading mdi-spin"
          >
            Auto-saving...
          </v-chip>
          <v-chip 
            v-else
            color="success" 
            size="small"
            prepend-icon="mdi-check"
          >
            Auto-save enabled
          </v-chip>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="settings.admin.maxVotesPerTopic"
                label="Max Votes Per Topic"
                type="number"
                min="1"
                max="50"
                prepend-icon="mdi-vote"
                hint="Maximum number of votes each topic can receive"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="settings.admin.topTopicsCount"
                label="Top Topics Count"
                type="number"
                min="1"
                max="20"
                prepend-icon="mdi-trophy"
                hint="Number of top topics to award badges when starting new round"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-switch
                v-model="settings.admin.allowTopicSubmission"
                label="Allow Topic Submission"
                color="primary"
                hint="Allow users to submit new topics"
              ></v-switch>
            </v-col>
            <v-col cols="12" md="6">
              <v-switch
                v-model="settings.admin.autoStartNewRound"
                label="Auto Start New Round"
                color="primary"
                hint="Automatically start new round when vote limit reached"
              ></v-switch>
            </v-col>
            <v-col cols="12" md="6">
              <v-switch
                v-model="settings.admin.showVoterNames"
                label="Show Voter Names"
                color="primary"
                hint="Display who voted for each topic (visible to all participants)"
              ></v-switch>
            </v-col>
          </v-row>
          
          <!-- Round Management Configuration -->
          <h3 class="text-h6 mb-4 mt-6">Round Management</h3>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="settings.admin.roundDurationMinutes"
                label="Round Duration (minutes)"
                type="number"
                min="5"
                max="60"
                prepend-icon="mdi-timer"
                hint="How long each discussion round should last"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model.number="settings.admin.maxTopicsPerRound"
                label="Max Topics Per Round"
                type="number"
                min="1"
                max="20"
                prepend-icon="mdi-format-list-numbered"
                hint="Maximum number of topics that can be selected for each round"
              ></v-text-field>
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12">
              <v-divider class="mb-4"></v-divider>
              <div class="d-flex align-center mb-4">
                <div>
                  <h3 class="text-h6 mb-1">Viewer Mode</h3>
                  <p class="text-body-2 text-grey-darken-1">
                    See the interface as participants do. Admin features will be hidden when enabled.
                  </p>
                </div>
                <v-spacer></v-spacer>
                <v-switch
                  :model-value="isViewerMode"
                  @update:model-value="toggleViewerMode"
                  color="purple"
                  :label="isViewerMode ? 'ON' : 'OFF'"
                ></v-switch>
              </div>
              
              <v-row v-if="isViewerMode">
                <v-col cols="12" md="6">
                  <v-select
                    :model-value="viewerModeSettings.simulateRole"
                    @update:model-value="(value) => viewerModeSettings.simulateRole = value"
                    :items="[
                      { title: 'Regular User', value: 'User' },
                      { title: 'Guest User', value: 'Guest' }
                    ]"
                    label="Simulate User Type"
                    hint="Choose what type of user experience to simulate"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    :model-value="viewerModeSettings.simulateUserEmail"
                    @update:model-value="(value) => viewerModeSettings.simulateUserEmail = value"
                    label="Simulated Email"
                    hint="Email address for the simulated user"
                  ></v-text-field>
                </v-col>
              </v-row>
              
              <v-alert 
                v-if="isViewerMode" 
                type="warning" 
                variant="tonal" 
                class="mt-4"
                prepend-icon="mdi-eye"
              >
                <v-alert-title>Viewer Mode Active</v-alert-title>
                You are currently viewing the interface as a {{ viewerModeSettings.simulateRole.toLowerCase() }} would see it. 
                Admin features are hidden. Toggle off to return to admin view.
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Organizer Management Section (Visible to organizers) -->
      <v-card v-if="hasEventAccess" class="mb-6">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-account-group</v-icon>
          Event Organizers
          <v-chip class="ml-2" color="primary" size="small">
            Manage Access
          </v-chip>
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-grey-darken-1 mb-4">
            Manage who can organize this event. Organizers have full control over event settings, rooms, topics, and rounds.
          </p>
          
          <OrganizerManagement
            :event-id="currentEventId"
            :user-role="userRole"
            :current-user-id="currentUserId"
          />
        </v-card-text>
      </v-card>

      <!-- Event Information Section -->
      <v-card v-if="hasEventAccess" class="mb-6">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-information</v-icon>
          Event Information
          <v-spacer></v-spacer>
          <v-chip 
            v-if="eventInfoSaving" 
            color="primary" 
            size="small"
            prepend-icon="mdi-loading mdi-spin"
          >
            Auto-saving...
          </v-chip>
          <v-chip 
            v-else
            color="success" 
            size="small"
            prepend-icon="mdi-check"
          >
            Auto-save enabled
          </v-chip>
        </v-card-title>
        <v-card-text>
          <!-- Event Information Section -->
          <v-divider class="my-6"></v-divider>
          <div class="mb-4 d-flex align-center">
            <div>
              <h3 class="text-h6 mb-2">Event Information</h3>
              <p class="text-body-2 text-grey-darken-1">
                Configure the event details that appear on the homepage and throughout the application.
              </p>
            </div>
            <v-spacer></v-spacer>
            <v-chip 
              v-if="eventInfoSaving" 
              color="primary" 
              size="small"
              prepend-icon="mdi-loading mdi-spin"
            >
              Auto-saving...
            </v-chip>
            <v-chip 
              v-else
              color="success" 
              size="small"
              prepend-icon="mdi-check"
            >
              Auto-save enabled
            </v-chip>
          </div>
          
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="settings.admin.eventInfo.title"
                label="Event Title"
                prepend-icon="mdi-calendar-text"
                placeholder="Enter event title..."
                hint="Main title displayed on the homepage"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="settings.admin.eventInfo.description"
                label="Event Description"
                prepend-icon="mdi-text"
                placeholder="Enter event description..."
                rows="2"
                hint="Brief description of the event purpose"
              ></v-textarea>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="settings.admin.eventInfo.dates"
                label="Event Dates"
                prepend-icon="mdi-calendar-range"
                placeholder="e.g., May 21st - 22nd, 2025"
                hint="When the event takes place"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="settings.admin.eventInfo.location"
                label="Event Location"
                prepend-icon="mdi-map-marker"
                placeholder="Enter event location..."
                hint="Where the event takes place"
              ></v-text-field>
            </v-col>
          </v-row>
          
          <!-- Default Topics Section - Only for Organizers -->
          <template v-if="isOrganizer">
            <v-divider class="my-6"></v-divider>
            <div class="mb-4 d-flex align-center">
              <div>
                <h3 class="text-h6 mb-2">Mandatory Topics</h3>
                <p class="text-body-2 text-grey-darken-1">
                  Configure topics that will be automatically added to your event. These serve as starting points for discussions and will be available for voting when the event begins.
                </p>
              </div>
              <v-spacer></v-spacer>
              <v-chip 
                v-if="defaultTopicsSaving" 
                color="primary" 
                size="small"
                prepend-icon="mdi-loading mdi-spin"
              >
                Auto-saving...
              </v-chip>
              <v-chip 
                v-else
                color="success" 
                size="small"
                prepend-icon="mdi-check"
              >
                Auto-save enabled
              </v-chip>
            </div>
            
            <div v-for="(topic, index) in settings.admin.defaultTopics" :key="index" class="mb-4">
              <v-card variant="outlined" class="pa-4">
                <div class="d-flex align-center mb-2">
                  <h4 class="text-subtitle-1">Topic {{ index + 1 }}</h4>
                  <v-spacer></v-spacer>
                  <v-btn
                    @click="removeDefaultTopic(index)"
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="small"
                  ></v-btn>
                </div>
                <v-text-field
                  v-model="topic.title"
                  label="Topic Title"
                  placeholder="Enter topic title..."
                  class="mb-2"
                ></v-text-field>
                <v-textarea
                  v-model="topic.description"
                  label="Topic Description"
                  placeholder="Enter topic description..."
                  rows="2"
                ></v-textarea>
              </v-card>
            </div>
            
            <v-btn
              @click="addDefaultTopic"
              prepend-icon="mdi-plus"
              variant="outlined"
              color="primary"
              class="mb-4"
            >
              Add Mandatory Topic
            </v-btn>
          </template>
        </v-card-text>
      </v-card>

      <!-- Admin Actions Section -->
      <v-card v-if="hasEventAccess" class="mb-6">
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-cogs</v-icon>
          Admin Actions
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-grey-darken-1 mb-4">
            Use these actions to manage the unconference session.
          </p>
          
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title class="text-h6">
                  <v-icon class="mr-2" color="success">mdi-restart</v-icon>
                  New Round
                </v-card-title>
                <v-card-text>
                  Start a new voting round. This will reset all votes and award badges to the top {{ settings.admin.topTopicsCount }} topics.
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    @click="startNewRound"
                    :loading="saving"
                    color="success"
                    prepend-icon="mdi-restart"
                  >
                    Start New Round
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title class="text-h6">
                  <v-icon class="mr-2" color="primary">mdi-chart-bar</v-icon>
                  Live Voting Dashboard
                </v-card-title>
                <v-card-text>
                  View real-time voting results with a pixel art bar chart. Perfect for screen sharing during voting sessions.
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    :to="'/admin/voting-dashboard'"
                    color="primary"
                    prepend-icon="mdi-chart-bar"
                  >
                    Open Dashboard
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title class="text-h6">
                  <v-icon class="mr-2" color="info">mdi-download</v-icon>
                  Export Data
                </v-card-title>
                <v-card-text>
                  Download all topics and voting data as a JSON file for backup or analysis.
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    @click="exportData"
                    color="info"
                    prepend-icon="mdi-download"
                  >
                    Export Topics
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title class="text-h6">
                  <v-icon class="mr-2" color="warning">mdi-playlist-plus</v-icon>
                  Load Default Topics
                </v-card-title>
                <v-card-text>
                  Replace current topics with the configured default topics. This will clear all existing topics and votes.
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    @click="loadDefaultTopics"
                    :loading="saving"
                    color="warning"
                    prepend-icon="mdi-playlist-plus"
                  >
                    Load Default Topics
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title class="text-h6">
                  <v-icon class="mr-2" color="purple">mdi-web</v-icon>
                  Update Homepage
                </v-card-title>
                <v-card-text>
                  Apply the configured event information to the homepage. This will update the title, description, dates, and location.
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    @click="updateEventInfo"
                    :loading="saving"
                    color="purple"
                    prepend-icon="mdi-web"
                  >
                    Update Homepage
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
            
            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-title class="text-h6">
                  <v-icon class="mr-2" color="indigo">mdi-qrcode</v-icon>
                  QR Code Quick Join
                </v-card-title>
                <v-card-text>
                  <p class="text-body-2 text-grey-darken-1 mb-4">
                    Generate a QR code that allows participants to join the event instantly without creating accounts.
                  </p>
                  
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="eventCodeForm.eventCode"
                        label="Event Code"
                        hint="Short code participants will use to join (e.g., DEMO2024)"
                        prepend-icon="mdi-ticket-confirmation"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="eventCodeForm.eventName"
                        label="Event Name"
                        hint="Full name of the event for display"
                        prepend-icon="mdi-calendar-text"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  
                  <v-row v-if="qrCodeGenerated" class="mt-4">
                    <v-col cols="12" md="6">
                      <div class="text-center">
                        <v-img
                          :src="qrCode"
                          max-width="256"
                          class="mx-auto mb-4"
                        ></v-img>
                        <p class="text-body-2">
                          Scan this QR code or visit the join URL to participate
                        </p>
                      </div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-alert type="success" variant="tonal" class="mb-4">
                        <v-alert-title>QR Code Generated!</v-alert-title>
                        <p class="mt-2">
                          Participants can now scan this code or use the event code 
                          <strong>{{ eventCodeForm.eventCode }}</strong> to join instantly.
                        </p>
                      </v-alert>
                      
                      <v-btn
                        @click="downloadQRCode"
                        color="success"
                        prepend-icon="mdi-download"
                        class="me-2"
                      >
                        Download QR Code
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    @click="generateQRCode"
                    :loading="qrGenerating"
                    color="indigo"
                    prepend-icon="mdi-qrcode"
                  >
                    Generate QR Code
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Current Configuration Info -->
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-information</v-icon>
          Current Configuration
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>User Role</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip :color="isAdmin ? 'warning' : 'primary'" size="small">
                      {{ user?.role || 'User' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Max Votes Per Topic</v-list-item-title>
                  <v-list-item-subtitle>{{ config.public.maxVotesPerTopic }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Top Topics Count</v-list-item-title>
                  <v-list-item-subtitle>{{ config.public.topTopicsCount }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
            <v-col cols="12" md="6">
              <v-list density="compact">
                <v-list-item>
                  <v-list-item-title>Development Mode</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip :color="config.public.devMode ? 'success' : 'error'" size="small">
                      {{ config.public.devMode ? 'Enabled' : 'Disabled' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Authentication</v-list-item-title>
                  <v-list-item-subtitle>{{ config.public.authUrl === '/auth/github' ? 'GitHub OAuth' : 'Local Login' }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title>Session Active</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip color="success" size="small">Yes</v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<style scoped>
.settings-page {
  min-height: 100vh;
}
</style>
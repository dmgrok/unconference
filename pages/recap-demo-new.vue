<template>
  <div class="recap-demo-page">
    <div class="page-header pa-6 text-center white--text">
      <h1 class="display-2 font-weight-bold mb-4">🎯 Professional Recap System Demo</h1>
      <p class="text-h5 mb-2">Experience the power of business-focused event summaries</p>
      <p class="text-body-1">Now with professional sharing modes designed for colleague engagement</p>
    </div>

    <v-container class="pt-8">
      <!-- Demo Controls -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card elevation="4" color="grey lighten-5">
            <v-card-text class="text-center">
              <h3 class="text-h6 mb-4">🎮 Interactive Demo Controls</h3>
              <v-row justify="center">
                <v-col cols="auto">
                  <v-select
                    v-model="selectedEvent"
                    :items="demoEvents"
                    item-text="name"
                    item-value="id"
                    label="Select Demo Event"
                    outlined
                    dense
                    class="demo-select"
                  />
                </v-col>
                <v-col cols="auto">
                  <v-select
                    v-model="selectedUser"
                    :items="demoUsers"
                    item-text="name"
                    item-value="id"
                    label="Select Demo Participant"
                    outlined
                    dense
                    class="demo-select"
                  />
                </v-col>
                <v-col cols="auto">
                  <v-select
                    v-model="selectedViewMode"
                    :items="viewModes"
                    item-text="name"
                    item-value="value"
                    label="Recap View Mode"
                    outlined
                    dense
                    class="demo-select"
                  />
                </v-col>
                <v-col cols="auto">
                  <v-btn
                    large
                    color="primary"
                    @click="loadDemoData"
                    :loading="loading"
                  >
                    <v-icon left>mdi-refresh</v-icon>
                    Load Recap
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Feature Highlights -->
      <v-row v-if="!demoData" class="mb-6">
        <v-col cols="12">
          <v-card elevation="4" class="feature-showcase">
            <v-card-title class="text-h5 font-weight-bold primary white--text">
              <v-icon left color="white">mdi-star</v-icon>
              New Professional Features
            </v-card-title>
            <v-card-text class="pa-6">
              <v-row>
                <v-col cols="12" md="4">
                  <div class="feature-item text-center">
                    <v-icon size="48" color="primary" class="mb-3">mdi-briefcase</v-icon>
                    <h4 class="text-h6 font-weight-bold mb-2">Professional View</h4>
                    <p class="text-body-2">Business-focused content with ROI metrics and strategic outcomes</p>
                  </div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="feature-item text-center">
                    <v-icon size="48" color="success" class="mb-3">mdi-share-variant</v-icon>
                    <h4 class="text-h6 font-weight-bold mb-2">Smart Sharing</h4>
                    <p class="text-body-2">Colleague-appropriate templates with customizable content selection</p>
                  </div>
                </v-col>
                <v-col cols="12" md="4">
                  <div class="feature-item text-center">
                    <v-icon size="48" color="warning" class="mb-3">mdi-lightning-bolt</v-icon>
                    <h4 class="text-h6 font-weight-bold mb-2">Executive Summary</h4>
                    <p class="text-body-2">Quick overview with key outcomes and business impact</p>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Main Demo Content -->
      <v-row v-if="demoData">
        <v-col cols="12">
          <!-- View Mode Indicator -->
          <v-alert 
            type="info" 
            class="mb-4"
            prominent
            icon="mdi-information"
          >
            <div class="d-flex align-center">
              <div class="flex-grow-1">
                <div class="font-weight-bold">Currently Viewing: {{ getCurrentViewModeName() }}</div>
                <div class="text-body-2 mt-1">{{ getCurrentViewModeDescription() }}</div>
              </div>
              <v-btn
                color="primary"
                outlined
                small
                @click="showViewModeComparison = true"
              >
                <v-icon small left>mdi-compare</v-icon>
                Compare Views
              </v-btn>
            </div>
          </v-alert>

          <!-- PersonalRecap Component -->
          <PersonalRecap
            :event-id="selectedEvent"
            :user-id="selectedUser"
            :demo-data="demoData"
            :force-view-mode="selectedViewMode"
            class="demo-recap-component"
          />
        </v-col>
      </v-row>

      <!-- Before/After Comparison -->
      <v-row v-if="demoData" class="mt-8">
        <v-col cols="12">
          <v-card elevation="4" class="comparison-section">
            <v-card-title class="text-h5 font-weight-bold success white--text">
              <v-icon left color="white">mdi-compare</v-icon>
              Before vs After: The Professional Transformation
            </v-card-title>
            <v-card-text class="pa-6">
              <v-row>
                <v-col cols="12" md="6">
                  <div class="before-section">
                    <h4 class="text-h6 font-weight-bold mb-3 error--text">
                      <v-icon color="error" class="mr-2">mdi-close-circle</v-icon>
                      Old Personal Recap (Information Overload)
                    </h4>
                    <v-list density="compact">
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon small color="error">mdi-alert</v-icon>
                        </template>
                        <v-list-item-title>Overwhelming personal metrics</v-list-item-title>
                        <v-list-item-subtitle>Vanity scores that colleagues don't care about</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon small color="error">mdi-alert</v-icon>
                        </template>
                        <v-list-item-title>Granular timeline details</v-list-item-title>
                        <v-list-item-subtitle>Too much personal activity data</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon small color="error">mdi-alert</v-icon>
                        </template>
                        <v-list-item-title>Generic sharing options</v-list-item-title>
                        <v-list-item-subtitle>Not colleague-appropriate content</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </div>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="after-section">
                    <h4 class="text-h6 font-weight-bold mb-3 success--text">
                      <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
                      New Professional Recap (Business Focused)
                    </h4>
                    <v-list density="compact">
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon small color="success">mdi-check</v-icon>
                        </template>
                        <v-list-item-title>Executive summary with ROI</v-list-item-title>
                        <v-list-item-subtitle>Clear business impact and value metrics</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon small color="success">mdi-check</v-icon>
                        </template>
                        <v-list-item-title>Project-focused outcomes</v-list-item-title>
                        <v-list-item-subtitle>Follow-up commitments with timelines</v-list-item-subtitle>
                      </v-list-item>
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon small color="success">mdi-check</v-icon>
                        </template>
                        <v-list-item-title>Professional sharing templates</v-list-item-title>
                        <v-list-item-subtitle>Colleague-appropriate content selection</v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Usage Scenarios -->
      <v-row class="mt-8">
        <v-col cols="12">
          <v-card elevation="4" class="scenarios-section">
            <v-card-title class="text-h5 font-weight-bold info white--text">
              <v-icon left color="white">mdi-account-group</v-icon>
              Real-World Usage Scenarios
            </v-card-title>
            <v-card-text class="pa-6">
              <v-row>
                <v-col cols="12" md="4">
                  <v-card outlined class="scenario-card h-100">
                    <v-card-title class="pb-2">
                      <v-avatar color="primary" size="36" class="mr-3">
                        <v-icon color="white">mdi-account-tie</v-icon>
                      </v-avatar>
                      <div>
                        <div class="text-subtitle-1 font-weight-bold">Manager Update</div>
                        <div class="text-caption">Professional View</div>
                      </div>
                    </v-card-title>
                    <v-card-text>
                      <p class="text-body-2 mb-3">"Show your manager the business value of event attendance with ROI metrics and concrete follow-up projects."</p>
                      <v-chip small color="primary" text-color="white">Executive Summary</v-chip>
                      <v-chip small color="success" text-color="white" class="ml-1">Project Commitments</v-chip>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-card outlined class="scenario-card h-100">
                    <v-card-title class="pb-2">
                      <v-avatar color="success" size="36" class="mr-3">
                        <v-icon color="white">mdi-account-group</v-icon>
                      </v-avatar>
                      <div>
                        <div class="text-subtitle-1 font-weight-bold">Team Sharing</div>
                        <div class="text-caption">Quick Summary</div>
                      </div>
                    </v-card-title>
                    <v-card-text>
                      <p class="text-body-2 mb-3">"Share key insights and connections with your team in a digestible format that highlights collaboration opportunities."</p>
                      <v-chip small color="warning" text-color="white">Key Ideas</v-chip>
                      <v-chip small color="info" text-color="white" class="ml-1">Strategic Connections</v-chip>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="4">
                  <v-card outlined class="scenario-card h-100">
                    <v-card-title class="pb-2">
                      <v-avatar color="purple" size="36" class="mr-3">
                        <v-icon color="white">mdi-account</v-icon>
                      </v-avatar>
                      <div>
                        <div class="text-subtitle-1 font-weight-bold">Personal Reflection</div>
                        <div class="text-caption">Personal View</div>
                      </div>
                    </v-card-title>
                    <v-card-text>
                      <p class="text-body-2 mb-3">"Keep all detailed analytics and journey tracking for personal growth and reflection while maintaining professional sharing options."</p>
                      <v-chip small color="purple" text-color="white">Full Analytics</v-chip>
                      <v-chip small color="orange" text-color="white" class="ml-1">Achievements</v-chip>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Getting Started -->
      <v-row class="mt-8" v-if="!demoData">
        <v-col cols="12">
          <v-card elevation="4" class="getting-started-section">
            <v-card-title class="text-h5 font-weight-bold gradient-primary white--text">
              <v-icon left color="white">mdi-rocket-launch</v-icon>
              Try the Demo Now
            </v-card-title>
            <v-card-text class="pa-6 text-center">
              <p class="text-h6 mb-4">Experience how professional recaps transform event participation into business value</p>
              <v-row justify="center">
                <v-col cols="auto">
                  <v-btn
                    x-large
                    color="primary"
                    @click="loadSampleDemo"
                    class="mr-4"
                  >
                    <v-icon left>mdi-play</v-icon>
                    Load Sample Demo
                  </v-btn>
                </v-col>
                <v-col cols="auto">
                  <v-btn
                    x-large
                    outlined
                    color="primary"
                    @click="showViewModeComparison = true"
                  >
                    <v-icon left>mdi-compare</v-icon>
                    Compare All Views
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- View Mode Comparison Dialog -->
    <v-dialog v-model="showViewModeComparison" max-width="1200px">
      <v-card>
        <v-card-title class="text-h5 font-weight-bold">
          <v-icon left color="primary">mdi-compare</v-icon>
          View Mode Comparison
          <v-spacer />
          <v-btn icon @click="showViewModeComparison = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pa-4">
          <v-row>
            <v-col v-for="mode in viewModes" :key="mode.value" cols="12" md="4">
              <v-card outlined class="h-100">
                <v-card-title class="pb-2" :class="`${mode.color} white--text`">
                  <v-icon left color="white">{{ mode.icon }}</v-icon>
                  {{ mode.name }}
                </v-card-title>
                <v-card-text>
                  <p class="text-body-2 mb-3">{{ mode.description }}</p>
                  
                  <h4 class="text-subtitle-2 font-weight-bold mb-2">Key Features:</h4>
                  <v-list density="compact">
                    <v-list-item v-for="feature in mode.features" :key="feature" class="px-0">
                      <template v-slot:prepend>
                        <v-icon small color="success">mdi-check</v-icon>
                      </template>
                      <v-list-item-title class="text-body-2">{{ feature }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                  
                  <h4 class="text-subtitle-2 font-weight-bold mt-3 mb-2">Best For:</h4>
                  <p class="text-body-2">{{ mode.bestFor }}</p>
                </v-card-text>
                
                <v-card-actions>
                  <v-btn 
                    :color="mode.color" 
                    text 
                    @click="selectViewModeAndClose(mode.value)"
                  >
                    Try This View
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import PersonalRecap from '~/components/PersonalRecap.vue'

// Define page layout - no auth required for demo
definePageMeta({
  layout: 'default',
  auth: false
})

// State
const selectedEvent = ref('demo-event-1')
const selectedUser = ref('demo-user-1')
const selectedViewMode = ref('professional')
const loading = ref(false)
const demoData = ref<any>(null)
const showViewModeComparison = ref(false)

// View modes configuration
const viewModes = ref([
  {
    value: 'professional',
    name: 'Professional View',
    description: 'Business-focused content with ROI metrics and strategic outcomes',
    icon: 'mdi-briefcase',
    color: 'primary',
    features: [
      'Executive Summary with ROI',
      'Follow-up Projects & Commitments',
      'Strategic Connections',
      'Business Impact Statements',
      'Professional Sharing Templates'
    ],
    bestFor: 'Sharing with managers, colleagues, and professional networks'
  },
  {
    value: 'personal',
    name: 'Personal View',
    description: 'Complete analytics dashboard for personal growth and reflection',
    icon: 'mdi-account',
    color: 'purple',
    features: [
      'Detailed Journey Timeline',
      'Personal Achievement Badges',
      'Full Analytics Dashboard',
      'Impact Score Breakdowns',
      'Survey & Discussion Analytics'
    ],
    bestFor: 'Personal reflection and comprehensive event analysis'
  },
  {
    value: 'summary',
    name: 'Quick Summary',
    description: 'Elevator pitch format with top 3 outcomes and key insights',
    icon: 'mdi-lightning-bolt',
    color: 'warning',
    features: [
      'Top 3 Key Outcomes',
      'Executive Summary Only',
      'One-Click Sharing',
      'Mobile-Optimized Format',
      'Quick Action Items'
    ],
    bestFor: 'Quick updates, social media, and informal conversations'
  }
])

// Demo data
const demoEvents = [
  { id: 'demo-event-1', name: 'AI & Future of Work Summit 2025' },
  { id: 'demo-event-2', name: 'Climate Innovation Unconference' },
  { id: 'demo-event-3', name: 'Startup Founder Collective' }
]

const demoUsers = [
  { id: 'demo-user-1', name: 'Alex Johnson (Product Manager)' },
  { id: 'demo-user-2', name: 'Sam Chen (Tech Lead)' },
  { id: 'demo-user-3', name: 'Jordan Taylor (Startup Founder)' }
]

// Methods
const loadDemoData = async () => {
  loading.value = true

  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Generate realistic demo data based on selections
    demoData.value = generateDemoData(selectedEvent.value, selectedUser.value)
  } catch (error) {
    console.error('Error loading demo data:', error)
  } finally {
    loading.value = false
  }
}

const loadSampleDemo = () => {
  selectedEvent.value = 'demo-event-1'
  selectedUser.value = 'demo-user-1'
  selectedViewMode.value = 'professional'
  loadDemoData()
}

const generateDemoData = (eventId: string, userId: string) => {
  const eventData = demoEvents.find(e => e.id === eventId)
  const userData = demoUsers.find(u => u.id === userId)

  // Different user profiles have different metrics
  const userProfiles = {
    'demo-user-1': { // Product Manager
      overallImpact: 87,
      contributionScore: 92,
      networkingScore: 78,
      collaborationScore: 85,
      activeProjects: 3,
      newConnections: 15,
      ideasGenerated: 8,
      businessImpact: 'High'
    },
    'demo-user-2': { // Tech Lead
      overallImpact: 82,
      contributionScore: 88,
      networkingScore: 71,
      collaborationScore: 89,
      activeProjects: 2,
      newConnections: 11,
      ideasGenerated: 12,
      businessImpact: 'Medium-High'
    },
    'demo-user-3': { // Startup Founder
      overallImpact: 79,
      contributionScore: 65,
      networkingScore: 95,
      collaborationScore: 72,
      activeProjects: 4,
      newConnections: 23,
      ideasGenerated: 6,
      businessImpact: 'High'
    }
  }

  const profile = userProfiles[userId as keyof typeof userProfiles] || userProfiles['demo-user-1']

  return {
    event: eventData,
    user: userData,
    personalImpact: {
      overallImpact: profile.overallImpact,
      contributionScore: profile.contributionScore,
      networkingScore: profile.networkingScore,
      collaborationScore: profile.collaborationScore
    },
    metrics: {
      activeProjects: profile.activeProjects,
      newConnections: profile.newConnections,
      ideasGenerated: profile.ideasGenerated,
      activeMinutes: 127,
      businessImpact: profile.businessImpact
    }
  }
}

const getCurrentViewModeName = () => {
  const mode = viewModes.value.find(m => m.value === selectedViewMode.value)
  return mode ? mode.name : 'Unknown'
}

const getCurrentViewModeDescription = () => {
  const mode = viewModes.value.find(m => m.value === selectedViewMode.value)
  return mode ? mode.description : ''
}

const selectViewModeAndClose = (viewMode: string) => {
  selectedViewMode.value = viewMode
  showViewModeComparison.value = false
  if (demoData.value) {
    // Force refresh of the component with new view mode
    loadDemoData()
  }
}

// Load sample data on mount
onMounted(() => {
  loadSampleDemo()
})
</script>

<style scoped>
.recap-demo-page {
  min-height: 100vh;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin-bottom: 0;
}

.demo-select {
  min-width: 200px;
}

.feature-showcase {
  border-radius: 12px;
  overflow: hidden;
}

.feature-item {
  padding: 24px 16px;
}

.comparison-section {
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.before-section {
  padding: 16px;
  background: rgba(244, 67, 54, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(244, 67, 54, 0.2);
}

.after-section {
  padding: 16px;
  background: rgba(76, 175, 80, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(76, 175, 80, 0.2);
}

.scenarios-section {
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.scenario-card {
  transition: all 0.3s ease;
  border-radius: 12px;
}

.scenario-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.getting-started-section {
  border-radius: 12px;
  overflow: hidden;
}

.gradient-primary {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
}

.demo-recap-component {
  border: 2px solid #e3f2fd;
  border-radius: 12px;
  overflow: hidden;
}

/* Responsive improvements */
@media (max-width: 768px) {
  .demo-select {
    min-width: 150px;
    margin-bottom: 12px;
  }
  
  .feature-item {
    padding: 16px 8px;
  }
  
  .scenario-card {
    margin-bottom: 16px;
  }
}

/* Animation for demo loading */
.demo-recap-component {
  animation: slideInUp 0.6s ease-out;
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Highlight important sections */
.comparison-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4caf50 0%, #81c784 100%);
}

.scenarios-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #2196f3 0%, #64b5f6 100%);
}
</style>

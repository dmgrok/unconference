<template>
  <div class="phase1-demo">
    <v-container class="py-6">
      <!-- Page Header -->
      <div class="text-center mb-8">
        <v-chip color="success" size="large" prepend-icon="mdi-check-circle" class="mb-4">
          Phase 1 Implementation Complete
        </v-chip>
        <h1 class="text-h3 font-weight-bold mb-4">
          🎉 Connection & Collaboration Features
        </h1>
        <p class="text-h6 text-medium-emphasis">
          Demo of all Phase 1 features working together
        </p>
      </div>

      <!-- Feature Showcase Tabs -->
      <v-tabs v-model="activeTab" class="mb-6" centered>
        <v-tab value="overview">Overview</v-tab>
        <v-tab value="tracking">Auto Tracking</v-tab>
        <v-tab value="connections">Connection Management</v-tab>
        <v-tab value="collaboration">Collaboration Spaces</v-tab>
        <v-tab value="showcase">Work Showcase</v-tab>
        <v-tab value="achievements">Achievements</v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <!-- Overview Tab -->
        <v-window-item value="overview">
          <v-row>
            <v-col cols="12">
              <v-card elevation="3" class="mb-4">
                <v-card-title class="d-flex align-center">
                  <v-icon color="success" class="mr-2">mdi-check-all</v-icon>
                  Phase 1 Features Implemented
                </v-card-title>
                <v-card-text>
                  <v-list>
                    <v-list-item prepend-icon="mdi-account-plus" title="Automatic Connection Tracking">
                      <v-list-item-subtitle>
                        Invisible tracking when users vote for same topics or join same discussion rooms
                      </v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-handshake" title="Connection Management">
                      <v-list-item-subtitle>
                        View connections, see suggestions, request introductions
                      </v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-folder-multiple" title="Collaboration Spaces">
                      <v-list-item-subtitle>
                        Shared workspaces with notes, resources, and action items
                      </v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-rocket" title="Work Showcase">
                      <v-list-item-subtitle>
                        Share projects and find collaborators
                      </v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-trophy" title="Achievement System">
                      <v-list-item-subtitle>
                        Gamification to encourage participation and connections
                      </v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item prepend-icon="mdi-api" title="Complete API">
                      <v-list-item-subtitle>
                        Full REST API for all connection and collaboration features
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>

              <!-- Technical Implementation Summary -->
              <v-card elevation="3">
                <v-card-title class="d-flex align-center">
                  <v-icon color="blue" class="mr-2">mdi-code-braces</v-icon>
                  Technical Implementation
                </v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <h4 class="mb-3">Database Models Added</h4>
                      <v-chip-group column>
                        <v-chip color="primary" size="small">EventConnection</v-chip>
                        <v-chip color="primary" size="small">CollaborationSpace</v-chip>
                        <v-chip color="primary" size="small">CollaborationResource</v-chip>
                        <v-chip color="primary" size="small">ActionItem</v-chip>
                        <v-chip color="primary" size="small">WorkShowcase</v-chip>
                        <v-chip color="primary" size="small">UserAchievement</v-chip>
                        <v-chip color="primary" size="small">SkillMatch</v-chip>
                        <v-chip color="primary" size="small">IntroductionRequest</v-chip>
                      </v-chip-group>
                    </v-col>
                    <v-col cols="12" md="6">
                      <h4 class="mb-3">Components Created</h4>
                      <v-chip-group column>
                        <v-chip color="success" size="small">ConnectionTracker</v-chip>
                        <v-chip color="success" size="small">InvisibleConnectionTracker</v-chip>
                        <v-chip color="success" size="small">CollaborationWorkspace</v-chip>
                        <v-chip color="success" size="small">WorkShowcase</v-chip>
                        <v-chip color="success" size="small">AchievementSystem</v-chip>
                      </v-chip-group>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Auto Tracking Tab -->
        <v-window-item value="tracking">
          <v-row>
            <v-col cols="12">
              <v-card elevation="3" class="mb-4">
                <v-card-title>
                  <v-icon color="orange" class="mr-2">mdi-radar</v-icon>
                  Automatic Connection Tracking Demo
                </v-card-title>
                <v-card-text>
                  <p class="mb-4">
                    The invisible connection tracker automatically creates connections when users:
                  </p>
                  <v-row>
                    <v-col cols="12" md="4">
                      <v-card color="blue-lighten-5" variant="flat" class="h-100">
                        <v-card-text class="text-center">
                          <v-icon size="48" color="blue" class="mb-3">mdi-vote</v-icon>
                          <h4 class="mb-2">Voting</h4>
                          <p class="text-body-2">Vote for the same topics</p>
                          <v-chip size="small" color="blue">Strength: 1</v-chip>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-card color="green-lighten-5" variant="flat" class="h-100">
                        <v-card-text class="text-center">
                          <v-icon size="48" color="green" class="mb-3">mdi-account-group</v-icon>
                          <h4 class="mb-2">Room Assignment</h4>
                          <p class="text-body-2">Get assigned to same room</p>
                          <v-chip size="small" color="green">Strength: 2</v-chip>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="12" md="4">
                      <v-card color="purple-lighten-5" variant="flat" class="h-100">
                        <v-card-text class="text-center">
                          <v-icon size="48" color="purple" class="mb-3">mdi-chat</v-icon>
                          <h4 class="mb-2">Discussion</h4>
                          <p class="text-body-2">Actively discuss together</p>
                          <v-chip size="small" color="purple">Strength: 3</v-chip>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>

                  <!-- Demo Invisible Tracker -->
                  <div class="mt-6 pa-4" style="background-color: #f8f9fa; border-radius: 8px;">
                    <h4 class="mb-3">
                      <v-icon color="grey" class="mr-2">mdi-eye-off</v-icon>
                      Invisible Tracker Active
                    </h4>
                    <p class="text-caption text-medium-emphasis mb-3">
                      This component is running invisibly on voting and groups pages.
                    </p>
                    
                    <InvisibleConnectionTracker
                      context="voting"
                      :participants="demoParticipants"
                      @connection-created="onDemoConnectionCreated"
                    />
                    
                    <v-alert v-if="demoConnections.length > 0" color="success" variant="tonal" class="mt-3">
                      <div class="d-flex align-center">
                        <v-icon class="mr-2">mdi-check-circle</v-icon>
                        {{ demoConnections.length }} demo connections tracked
                      </div>
                    </v-alert>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Connections Tab -->
        <v-window-item value="connections">
          <ConnectionTracker />
        </v-window-item>

        <!-- Collaboration Tab -->
        <v-window-item value="collaboration">
          <v-row>
            <v-col cols="12" lg="6">
              <CollaborationWorkspace workspace-id="demo-workspace-1" />
            </v-col>
            <v-col cols="12" lg="6">
              <CollaborationWorkspace workspace-id="demo-workspace-2" />
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Showcase Tab -->
        <v-window-item value="showcase">
          <v-row>
            <v-col
              v-for="showcase in demoShowcases"
              :key="showcase.id"
              cols="12" md="6" lg="4"
            >
              <WorkShowcase 
                :showcase="showcase"
                :participants="demoParticipantProfiles"
                @join-project="onJoinProject"
                @contact-team="onContactTeam"
              />
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Achievements Tab -->
        <v-window-item value="achievements">
          <AchievementSystem event-id="demo-event" user-id="demo-user" />
        </v-window-item>
      </v-window>

      <!-- Implementation Status -->
      <v-card elevation="3" class="mt-8" color="success-lighten-5">
        <v-card-title class="d-flex align-center">
          <v-icon color="success" class="mr-2">mdi-check-decagram</v-icon>
          Implementation Status: COMPLETE ✅
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <h4 class="mb-3 text-success">✅ Completed Features</h4>
              <v-list density="compact">
                <v-list-item>✅ Database schema with 8 new models</v-list-item>
                <v-list-item>✅ Complete REST API endpoints</v-list-item>
                <v-list-item>✅ Invisible connection tracking</v-list-item>
                <v-list-item>✅ Connection management UI</v-list-item>
                <v-list-item>✅ Collaboration workspaces</v-list-item>
                <v-list-item>✅ Work showcase gallery</v-list-item>
                <v-list-item>✅ Achievement system</v-list-item>
                <v-list-item>✅ Vue.js composables</v-list-item>
                <v-list-item>✅ Integrated with existing pages</v-list-item>
                <v-list-item>✅ Navigation menu updated</v-list-item>
              </v-list>
            </v-col>
            <v-col cols="12" md="6">
              <h4 class="mb-3 text-primary">🚀 Ready for Phase 2</h4>
              <p class="text-body-2 mb-3">
                All Phase 1 features are implemented and ready for production use. 
                The platform now automatically tracks connections and provides tools for collaboration.
              </p>
              <v-btn
                color="primary"
                size="large"
                prepend-icon="mdi-rocket"
                href="/connections"
              >
                Experience Live Features
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  title: 'Phase 1 Demo - Connections & Collaboration'
})

// Reactive data
const activeTab = ref('overview')
const demoConnections = ref<any[]>([])

// Demo data
const demoParticipants = ref(['user1@example.com', 'user2@example.com', 'user3@example.com'])

const demoParticipantProfiles = ref([
  { id: 'user1', name: 'Alice Johnson', avatar: null },
  { id: 'user2', name: 'Bob Smith', avatar: null },
  { id: 'user3', name: 'Carol Chen', avatar: null }
])

const demoShowcases = ref([
  {
    id: 'showcase1',
    projectName: 'AI-Powered Climate Tracker',
    description: 'A machine learning application that tracks and predicts local climate patterns using satellite data and community input.',
    contributors: ['user1', 'user2'],
    skillsUsed: ['Python', 'TensorFlow', 'React', 'PostgreSQL'],
    skillsNeeded: ['DevOps', 'UI/UX Design'],
    status: 'ACTIVE' as const,
    contactEmail: 'team@climatetracker.app',
    repositoryUrl: 'https://github.com/example/climate-tracker',
    demoUrl: 'https://demo.climatetracker.app',
    images: [],
    tags: ['climate', 'ai', 'sustainability'],
    createdAt: new Date(Date.now() - 86400000)
  },
  {
    id: 'showcase2',
    projectName: 'Community Learning Platform',
    description: 'Open-source platform for organizing skill-sharing sessions and peer learning groups in local communities.',
    contributors: ['user3'],
    skillsUsed: ['Vue.js', 'Node.js', 'MongoDB'],
    skillsNeeded: ['Mobile Development', 'Marketing'],
    status: 'SEEKING_COLLABORATORS' as const,
    contactEmail: 'hello@communitylearn.org',
    repositoryUrl: 'https://github.com/example/community-learn',
    images: [],
    tags: ['education', 'community', 'open-source'],
    createdAt: new Date(Date.now() - 172800000)
  },
  {
    id: 'showcase3',
    projectName: 'Accessibility Widget Toolkit',
    description: 'Complete toolkit of web accessibility widgets that developers can easily integrate into any website.',
    contributors: ['user1'],
    skillsUsed: ['TypeScript', 'CSS', 'WCAG'],
    skillsNeeded: [],
    status: 'COMPLETED' as const,
    repositoryUrl: 'https://github.com/example/a11y-toolkit',
    demoUrl: 'https://a11y-toolkit.dev',
    images: [],
    tags: ['accessibility', 'web', 'toolkit'],
    createdAt: new Date(Date.now() - 604800000)
  }
])

// Event handlers
const onDemoConnectionCreated = (connection: any) => {
  console.log('Demo connection created:', connection)
  demoConnections.value.push(connection)
}

const onJoinProject = (showcaseId: string) => {
  console.log('Joining project:', showcaseId)
}

const onContactTeam = (showcaseId: string) => {
  console.log('Contacting team for project:', showcaseId)
}
</script>

<style scoped>
.phase1-demo {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.phase1-demo .v-container {
  position: relative;
  z-index: 1;
}

.phase1-demo::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%);
  z-index: 0;
}
</style>

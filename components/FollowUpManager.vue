<template>
  <v-card class="follow-up-manager" elevation="4">
    <v-card-title class="text-h5 font-weight-bold success white--text">
      <v-icon left color="white">mdi-calendar-check</v-icon>
      Follow-Up Manager
      <v-spacer />
      <v-chip
        v-if="pendingFollowUps.length > 0"
        color="warning"
        text-color="white"
        small
      >
        {{ pendingFollowUps.length }} pending
      </v-chip>
    </v-card-title>

    <v-card-text class="pa-6">
      <!-- Quick Actions Bar -->
      <v-row class="mb-4">
        <v-col cols="12" md="8">
          <v-text-field
            v-model="searchQuery"
            prepend-inner-icon="mdi-magnify"
            label="Search connections..."
            outlined
            dense
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="12" md="4">
          <v-select
            v-model="statusFilter"
            :items="statusOptions"
            label="Filter by status"
            outlined
            dense
            hide-details
          />
        </v-col>
      </v-row>

      <!-- Follow-up Tabs -->
      <v-tabs v-model="selectedTab" background-color="transparent" grow>
        <v-tab>
          <v-icon left>mdi-clock-outline</v-icon>
          Pending ({{ pendingFollowUps.length }})
        </v-tab>
        <v-tab>
          <v-icon left>mdi-calendar-today</v-icon>
          Due Today ({{ dueTodayFollowUps.length }})
        </v-tab>
        <v-tab>
          <v-icon left>mdi-check-circle</v-icon>
          Completed ({{ completedFollowUps.length }})
        </v-tab>
        <v-tab>
          <v-icon left>mdi-trending-up</v-icon>
          Analytics
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="selectedTab" class="mt-4">
        <!-- Pending Follow-ups -->
        <v-tab-item>
          <div v-if="filteredPendingFollowUps.length === 0" class="text-center pa-8">
            <v-icon color="grey lighten-1" size="64">mdi-calendar-check-outline</v-icon>
            <div class="text-h6 grey--text mt-4">No pending follow-ups</div>
            <div class="text-body-2 grey--text">Great job staying on top of your connections!</div>
          </div>

          <v-expansion-panels v-else accordion>
            <v-expansion-panel
              v-for="followUp in filteredPendingFollowUps"
              :key="followUp.id"
              class="mb-2"
            >
              <v-expansion-panel-header>
                <div class="d-flex align-center">
                  <v-avatar size="40" class="mr-3">
                    <img v-if="followUp.connection.avatar" :src="followUp.connection.avatar" alt="Avatar">
                    <span v-else class="white--text">{{ followUp.connection.name.charAt(0) }}</span>
                  </v-avatar>
                  <div class="flex-grow-1">
                    <div class="font-weight-medium">{{ followUp.connection.name }}</div>
                    <div class="text-caption grey--text">{{ followUp.connection.company || 'Company' }}</div>
                  </div>
                  <div class="text-right mr-4">
                    <v-chip
                      :color="getPriorityColor(followUp.priority)"
                      small
                      text-color="white"
                    >
                      {{ followUp.priority }}
                    </v-chip>
                    <div class="text-caption mt-1">
                      Due: {{ formatDate(followUp.dueDate) }}
                    </div>
                  </div>
                </div>
              </v-expansion-panel-header>

              <v-expansion-panel-content>
                <v-row>
                  <v-col cols="12" md="8">
                    <h3 class="text-subtitle-1 font-weight-bold mb-2">{{ followUp.task }}</h3>
                    <p class="text-body-2 mb-3">{{ followUp.description }}</p>

                    <!-- Connection Context -->
                    <v-card outlined class="mb-3">
                      <v-card-subtitle class="pb-1">Connection Context</v-card-subtitle>
                      <v-card-text class="pt-1">
                        <div class="mb-2">
                          <strong>Shared Interests:</strong> {{ followUp.connection.sharedInterests?.join(', ') || 'Not specified' }}
                        </div>
                        <div class="mb-2">
                          <strong>Connection Quality:</strong>
                          <v-rating
                            :value="followUp.connection.qualityScore / 20"
                            color="orange"
                            background-color="grey lighten-1"
                            small
                            readonly
                            dense
                          />
                          ({{ followUp.connection.qualityScore }}/100)
                        </div>
                        <div v-if="followUp.connection.conversationTopics">
                          <strong>Topics Discussed:</strong> {{ followUp.connection.conversationTopics }}
                        </div>
                      </v-card-text>
                    </v-card>

                    <!-- Action Templates -->
                    <v-expansion-panels class="mb-3">
                      <v-expansion-panel>
                        <v-expansion-panel-header>
                          <span class="font-weight-medium">Quick Action Templates</span>
                        </v-expansion-panel-header>
                        <v-expansion-panel-content>
                          <v-chip-group column>
                            <v-chip
                              v-for="template in actionTemplates"
                              :key="template.id"
                              @click="applyActionTemplate(followUp, template)"
                              outlined
                              color="primary"
                              small
                            >
                              {{ template.name }}
                            </v-chip>
                          </v-chip-group>
                        </v-expansion-panel-content>
                      </v-expansion-panel>
                    </v-expansion-panels>
                  </v-col>

                  <v-col cols="12" md="4">
                    <!-- Actions -->
                    <div class="mb-3">
                      <v-btn
                        color="success"
                        block
                        @click="markCompleted(followUp)"
                      >
                        <v-icon left>mdi-check</v-icon>
                        Mark Completed
                      </v-btn>
                    </div>

                    <div class="mb-3">
                      <v-btn
                        color="primary"
                        outlined
                        block
                        @click="scheduleReminder(followUp)"
                      >
                        <v-icon left>mdi-bell-plus</v-icon>
                        Schedule Reminder
                      </v-btn>
                    </div>

                    <div class="mb-3">
                      <v-btn
                        color="info"
                        outlined
                        block
                        @click="openEmailTemplate(followUp)"
                      >
                        <v-icon left>mdi-email-outline</v-icon>
                        Send Follow-up Email
                      </v-btn>
                    </div>

                    <div class="mb-3">
                      <v-btn
                        color="warning"
                        outlined
                        block
                        @click="editFollowUp(followUp)"
                      >
                        <v-icon left>mdi-pencil</v-icon>
                        Edit Details
                      </v-btn>
                    </div>

                    <!-- Next Steps -->
                    <v-card outlined>
                      <v-card-subtitle>Suggested Next Steps</v-card-subtitle>
                      <v-card-text>
                        <div class="text-body-2">
                          <div class="mb-2">
                            • Schedule 30-min coffee chat
                          </div>
                          <div class="mb-2">
                            • Share relevant resource/article
                          </div>
                          <div class="mb-2">
                            • Introduce to relevant contact
                          </div>
                          <div>
                            • Propose collaboration opportunity
                          </div>
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-tab-item>

        <!-- Due Today -->
        <v-tab-item>
          <v-alert
            v-if="dueTodayFollowUps.length > 0"
            type="warning"
            prominent
            class="mb-4"
          >
            <v-row align="center">
              <v-col class="grow">
                <div class="text-h6">{{ dueTodayFollowUps.length }} follow-ups due today!</div>
                <div>Don't let valuable connections go cold.</div>
              </v-col>
              <v-col class="shrink">
                <v-btn color="warning" @click="batchProcessToday">
                  Process All
                </v-btn>
              </v-col>
            </v-row>
          </v-alert>

          <v-list v-if="dueTodayFollowUps.length > 0">
            <v-list-item
              v-for="followUp in dueTodayFollowUps"
              :key="followUp.id"
              class="border rounded mb-2"
            >
              <v-list-item-avatar>
                <img v-if="followUp.connection.avatar" :src="followUp.connection.avatar" alt="Avatar">
                <v-icon v-else>mdi-account</v-icon>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>{{ followUp.connection.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ followUp.task }}</v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn icon @click="markCompleted(followUp)">
                  <v-icon color="success">mdi-check</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
          </v-list>

          <div v-else class="text-center pa-8">
            <v-icon color="success" size="64">mdi-calendar-check</v-icon>
            <div class="text-h6 success--text mt-4">All caught up!</div>
            <div class="text-body-2 grey--text">No follow-ups due today.</div>
          </div>
        </v-tab-item>

        <!-- Completed -->
        <v-tab-item>
          <v-list>
            <v-list-item
              v-for="followUp in completedFollowUps"
              :key="followUp.id"
              class="border rounded mb-2"
            >
              <v-list-item-avatar>
                <v-icon color="success">mdi-check-circle</v-icon>
              </v-list-item-avatar>
              <v-list-item-content>
                <v-list-item-title>{{ followUp.connection.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ followUp.task }}</v-list-item-subtitle>
                <div class="text-caption grey--text">
                  Completed: {{ formatDate(followUp.completedAt) }}
                </div>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-tab-item>

        <!-- Analytics -->
        <v-tab-item>
          <v-row>
            <v-col cols="12" md="6">
              <v-card outlined>
                <v-card-title class="text-h6">Follow-up Performance</v-card-title>
                <v-card-text>
                  <div class="mb-4">
                    <div class="d-flex justify-space-between mb-2">
                      <span>Completion Rate</span>
                      <span class="font-weight-bold">{{ completionRate }}%</span>
                    </div>
                    <v-progress-linear
                      :value="completionRate"
                      color="success"
                      height="8"
                      rounded
                    />
                  </div>

                  <div class="mb-4">
                    <div class="d-flex justify-space-between mb-2">
                      <span>Average Response Time</span>
                      <span class="font-weight-bold">{{ averageResponseTime }} days</span>
                    </div>
                  </div>

                  <div>
                    <div class="d-flex justify-space-between mb-2">
                      <span>Conversion to Collaboration</span>
                      <span class="font-weight-bold">{{ collaborationRate }}%</span>
                    </div>
                    <v-progress-linear
                      :value="collaborationRate"
                      color="primary"
                      height="8"
                      rounded
                    />
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card outlined>
                <v-card-title class="text-h6">Connection Quality Impact</v-card-title>
                <v-card-text>
                  <div class="text-center mb-4">
                    <div class="text-h3 primary--text font-weight-bold">
                      {{ highQualityConnections }}
                    </div>
                    <div class="text-body-2 grey--text">High Quality Connections</div>
                    <div class="text-caption">(Score > 80)</div>
                  </div>

                  <v-divider class="mb-4" />

                  <div class="mb-2">
                    <strong>Follow-up Success by Quality:</strong>
                  </div>
                  <div class="mb-1">
                    <div class="d-flex justify-space-between">
                      <span>High Quality (80-100)</span>
                      <span>95%</span>
                    </div>
                  </div>
                  <div class="mb-1">
                    <div class="d-flex justify-space-between">
                      <span>Medium Quality (60-79)</span>
                      <span>78%</span>
                    </div>
                  </div>
                  <div>
                    <div class="d-flex justify-space-between">
                      <span>Lower Quality (40-59)</span>
                      <span>45%</span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-tab-item>
      </v-tabs-items>
    </v-card-text>

    <!-- Add Follow-up FAB -->
    <v-fab-transition>
      <v-btn
        v-show="selectedTab !== 3"
        fab
        fixed
        bottom
        right
        color="primary"
        @click="addFollowUpDialog = true"
      >
        <v-icon>mdi-plus</v-icon>
      </v-btn>
    </v-fab-transition>

    <!-- Add Follow-up Dialog -->
    <v-dialog v-model="addFollowUpDialog" max-width="600px">
      <v-card>
        <v-card-title>Add New Follow-up</v-card-title>
        <v-card-text>
          <v-form ref="followUpForm">
            <v-select
              v-model="newFollowUp.connectionId"
              :items="availableConnections"
              item-text="name"
              item-value="id"
              label="Select Connection"
              outlined
              required
            />
            <v-text-field
              v-model="newFollowUp.task"
              label="Follow-up Task"
              outlined
              required
            />
            <v-textarea
              v-model="newFollowUp.description"
              label="Description"
              outlined
              rows="3"
            />
            <v-menu
              v-model="dueDateMenu"
              :close-on-content-click="false"
              :nudge-right="40"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model="newFollowUp.dueDate"
                  label="Due Date"
                  prepend-icon="mdi-calendar"
                  readonly
                  outlined
                  v-bind="attrs"
                  v-on="on"
                />
              </template>
              <v-date-picker
                v-model="newFollowUp.dueDate"
                @input="dueDateMenu = false"
              />
            </v-menu>
            <v-select
              v-model="newFollowUp.priority"
              :items="['low', 'medium', 'high']"
              label="Priority"
              outlined
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="addFollowUpDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="createFollowUp">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" top right>
      {{ snackbarText }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const props = defineProps<{
  connections: any[]
  eventData?: any
}>()

// State
const selectedTab = ref(0)
const searchQuery = ref('')
const statusFilter = ref('all')
const addFollowUpDialog = ref(false)
const dueDateMenu = ref(false)
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Follow-up data
const followUps = ref([
  {
    id: '1',
    connectionId: 'conn1',
    task: 'Schedule coffee chat to discuss AI collaboration',
    description: 'Follow up on our discussion about machine learning applications in healthcare. Sarah mentioned she has connections at Stanford Medical.',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'high',
    status: 'pending',
    createdAt: new Date(),
    connection: {
      id: 'conn1',
      name: 'Sarah Chen',
      company: 'TechMed Solutions',
      avatar: null,
      qualityScore: 85,
      sharedInterests: ['AI/ML', 'Healthcare Innovation', 'Startup Strategy'],
      conversationTopics: 'Machine learning in diagnostics, healthcare data privacy, startup funding strategies'
    }
  },
  {
    id: '2',
    connectionId: 'conn2',
    task: 'Share contact for blockchain developer',
    description: 'Marcus was looking for a senior blockchain developer for his DeFi project. I promised to introduce him to Alex from my previous company.',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    priority: 'medium',
    status: 'pending',
    createdAt: new Date(),
    connection: {
      id: 'conn2',
      name: 'Marcus Rodriguez',
      company: 'CryptoVentures LLC',
      avatar: null,
      qualityScore: 72,
      sharedInterests: ['Blockchain', 'DeFi', 'Venture Capital'],
      conversationTopics: 'DeFi protocols, regulatory challenges, talent acquisition'
    }
  },
  {
    id: '3',
    connectionId: 'conn3',
    task: 'Introduce to sustainability consultant',
    description: 'Jennifer is launching a green tech initiative and needs expertise in sustainability frameworks. Perfect match for Lisa from EcoConsult.',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // day after tomorrow
    priority: 'high',
    status: 'pending',
    createdAt: new Date(),
    connection: {
      id: 'conn3',
      name: 'Jennifer Walsh',
      company: 'Green Innovation Corp',
      avatar: null,
      qualityScore: 91,
      sharedInterests: ['Sustainability', 'Green Tech', 'Corporate Strategy'],
      conversationTopics: 'Carbon footprint reduction, sustainable supply chains, green technology adoption'
    }
  },
  {
    id: '4',
    connectionId: 'conn4',
    task: 'Collaboration on research paper',
    description: 'Dr. Kim and I discovered overlapping research interests in quantum computing applications. We agreed to co-author a paper.',
    dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // yesterday (overdue)
    priority: 'high',
    status: 'completed',
    createdAt: new Date(Date.now() - 5 * 86400000),
    completedAt: new Date(),
    connection: {
      id: 'conn4',
      name: 'Dr. David Kim',
      company: 'Quantum Research Institute',
      avatar: null,
      qualityScore: 95,
      sharedInterests: ['Quantum Computing', 'Research', 'Academic Collaboration'],
      conversationTopics: 'Quantum algorithms, computational complexity, research methodologies'
    }
  }
])

const newFollowUp = ref({
  connectionId: '',
  task: '',
  description: '',
  dueDate: '',
  priority: 'medium'
})

// Status filter options
const statusOptions = [
  { text: 'All', value: 'all' },
  { text: 'Pending', value: 'pending' },
  { text: 'Completed', value: 'completed' },
  { text: 'Overdue', value: 'overdue' }
]

// Action templates
const actionTemplates = [
  { id: 1, name: 'Coffee Chat', template: 'Schedule 30-minute coffee chat to continue our conversation' },
  { id: 2, name: 'Resource Share', template: 'Share relevant article/resource we discussed' },
  { id: 3, name: 'Introduction', template: 'Introduce to relevant contact in my network' },
  { id: 4, name: 'Collaboration', template: 'Propose specific collaboration opportunity' },
  { id: 5, name: 'Check-in', template: 'Friendly check-in on current projects' }
]

// Computed properties
const pendingFollowUps = computed(() => {
  return followUps.value.filter(f => f.status === 'pending')
})

const dueTodayFollowUps = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  return followUps.value.filter(f => f.status === 'pending' && f.dueDate === today)
})

const completedFollowUps = computed(() => {
  return followUps.value.filter(f => f.status === 'completed')
})

const filteredPendingFollowUps = computed(() => {
  let filtered = pendingFollowUps.value

  if (searchQuery.value) {
    filtered = filtered.filter(f =>
      f.connection.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      f.task.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  return filtered.sort((a, b) => {
    // Sort by priority (high -> medium -> low) then by due date
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const priorityDiff = priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
    if (priorityDiff !== 0) return priorityDiff
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  })
})

const availableConnections = computed(() => {
  return props.connections || [
    { id: 'conn1', name: 'Sarah Chen' },
    { id: 'conn2', name: 'Marcus Rodriguez' },
    { id: 'conn3', name: 'Jennifer Walsh' }
  ]
})

const completionRate = computed(() => {
  const total = followUps.value.length
  const completed = completedFollowUps.value.length
  return total > 0 ? Math.round((completed / total) * 100) : 0
})

const averageResponseTime = computed(() => {
  // Mock calculation - would be based on actual completion times
  return 2.3
})

const collaborationRate = computed(() => {
  // Mock calculation - percentage of follow-ups that led to actual collaboration
  return 68
})

const highQualityConnections = computed(() => {
  return followUps.value.filter(f => f.connection.qualityScore > 80).length
})

// Methods
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'red'
    case 'medium': return 'orange'
    case 'low': return 'green'
    default: return 'grey'
  }
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString()
}

const markCompleted = (followUp: any) => {
  followUp.status = 'completed'
  followUp.completedAt = new Date()
  showSnackbar(`Follow-up with ${followUp.connection.name} marked as completed!`, 'success')
}

const scheduleReminder = (followUp: any) => {
  // Implementation would integrate with calendar/notification system
  showSnackbar(`Reminder scheduled for ${followUp.connection.name}`, 'info')
}

const openEmailTemplate = (followUp: any) => {
  const subject = encodeURIComponent(`Following up from our conversation`)
  const body = encodeURIComponent(`Hi ${followUp.connection.name},\n\nI hope you're doing well! I wanted to follow up on our conversation about ${followUp.connection.conversationTopics}.\n\n${followUp.task}\n\nLooking forward to hearing from you!\n\nBest regards`)
  window.open(`mailto:?subject=${subject}&body=${body}`)
}

const editFollowUp = (followUp: any) => {
  // Implementation would open edit dialog
  showSnackbar('Edit functionality coming soon!', 'info')
}

const applyActionTemplate = (followUp: any, template: any) => {
  followUp.task = template.template
  showSnackbar(`Applied ${template.name} template!`, 'success')
}

const batchProcessToday = () => {
  dueTodayFollowUps.value.forEach(followUp => {
    markCompleted(followUp)
  })
}

const createFollowUp = () => {
  if (!newFollowUp.value.connectionId || !newFollowUp.value.task) {
    showSnackbar('Please fill in required fields', 'error')
    return
  }

  const connection = availableConnections.value.find(c => c.id === newFollowUp.value.connectionId)
  const followUp = {
    id: Date.now().toString(),
    ...newFollowUp.value,
    status: 'pending',
    createdAt: new Date(),
    connection: {
      ...connection,
      qualityScore: 75, // Default score
      sharedInterests: [],
      conversationTopics: ''
    }
  }

  followUps.value.push(followUp)

  // Reset form
  newFollowUp.value = {
    connectionId: '',
    task: '',
    description: '',
    dueDate: '',
    priority: 'medium'
  }

  addFollowUpDialog.value = false
  showSnackbar('Follow-up created successfully!', 'success')
}

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

// Initialize
onMounted(() => {
  // Set default due date to tomorrow
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  newFollowUp.value.dueDate = tomorrow.toISOString().split('T')[0]
})
</script>

<style scoped>
.follow-up-manager {
  border-radius: 16px;
  overflow: hidden;
}

.border {
  border: 1px solid #e0e0e0 !important;
}

.v-expansion-panel {
  border-radius: 8px !important;
}

.v-expansion-panel::before {
  box-shadow: none;
}

.v-fab-transition-enter-active,
.v-fab-transition-leave-active {
  transition: all 0.3s ease;
}

.v-fab-transition-enter,
.v-fab-transition-leave-to {
  transform: scale(0) rotate(-45deg);
}
</style>
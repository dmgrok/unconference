<template>
  <div class="analytics-page">
    <!-- Page Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h1 class="text-h3 font-weight-bold">Analytics Dashboard</h1>
        <p class="text-body-1 text-medium-emphasis mt-2">
          Comprehensive insights into platform performance and user engagement
        </p>
      </div>

      <!-- Quick Actions -->
      <div class="d-flex gap-2">
        <v-btn
          variant="outlined"
          prepend-icon="mdi-chart-line"
          @click="showEventSelector = !showEventSelector"
        >
          {{ selectedEventId ? 'Change Event' : 'Select Event' }}
        </v-btn>

        <v-btn
          color="primary"
          prepend-icon="mdi-download"
          @click="showExportDialog = true"
        >
          Export Report
        </v-btn>
      </div>
    </div>

    <!-- Event Selector -->
    <v-expand-transition>
      <v-card v-show="showEventSelector" class="mb-6">
        <v-card-title>Select Event for Real-time Analytics</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="8">
              <v-autocomplete
                v-model="selectedEventId"
                :items="recentEvents"
                item-title="title"
                item-value="id"
                label="Search events..."
                prepend-icon="mdi-magnify"
                clearable
                @update:model-value="showEventSelector = false"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #prepend>
                      <v-avatar
                        :color="getEventStatusColor(item.raw.status)"
                        size="small"
                      >
                        <v-icon size="16">{{ getEventStatusIcon(item.raw.status) }}</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ item.raw.status }} • {{ formatDate(item.raw.createdAt) }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-expand-transition>

    <!-- Main Analytics Dashboard -->
    <AnalyticsDashboard
      :selected-event-id="selectedEventId"
      :auto-refresh="true"
    />

    <!-- Export Dialog -->
    <v-dialog v-model="showExportDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-download</v-icon>
          Export Analytics Report
        </v-card-title>

        <v-card-text>
          <v-form ref="exportForm" v-model="exportFormValid">
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="exportConfig.timeRange"
                  :items="timeRangeOptions"
                  label="Time Range"
                  variant="outlined"
                  required
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="exportConfig.format"
                  :items="formatOptions"
                  label="Format"
                  variant="outlined"
                  required
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-select
                  v-model="exportConfig.sections"
                  :items="sectionOptions"
                  label="Data Sections"
                  variant="outlined"
                  multiple
                  chips
                  required
                  :rules="[v => v && v.length > 0 || 'At least one section is required']"
                />
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="12">
                <v-switch
                  v-model="exportConfig.includeRawData"
                  label="Include raw analytics events"
                  hint="May result in large file sizes"
                  persistent-hint
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn @click="showExportDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="exportLoading"
            :disabled="!exportFormValid"
            @click="exportReport"
          >
            Export
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="showNotification"
      :color="notificationType"
      timeout="5000"
    >
      {{ notificationMessage }}
      <template #actions>
        <v-btn variant="text" @click="showNotification = false">Close</v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Page metadata
definePageMeta({
  middleware: 'auth',
  layout: 'admin'
})

// State
const showEventSelector = ref(false)
const showExportDialog = ref(false)
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'error' | 'warning' | 'info'>('info')
const selectedEventId = ref<string>()
const recentEvents = ref<any[]>([])
const exportLoading = ref(false)
const exportFormValid = ref(false)
const exportForm = ref()

// Export configuration
const exportConfig = ref({
  timeRange: '30d',
  format: 'csv',
  sections: ['platform', 'events'],
  includeRawData: false
})

// Options
const timeRangeOptions = [
  { title: 'Last 7 days', value: '7d' },
  { title: 'Last 30 days', value: '30d' },
  { title: 'Last 90 days', value: '90d' },
  { title: 'Last 12 months', value: '12m' }
]

const formatOptions = [
  { title: 'CSV Spreadsheet', value: 'csv' },
  { title: 'JSON Data', value: 'json' }
]

const sectionOptions = [
  { title: 'Platform Metrics', value: 'platform' },
  { title: 'Event Performance', value: 'events' },
  { title: 'User Engagement', value: 'engagement' },
  { title: 'Revenue Analytics', value: 'revenue' },
  { title: 'Cohort Analysis', value: 'cohort' }
]

// Methods
const loadRecentEvents = async () => {
  try {
    const response = await $fetch('/api/admin/events', {
      params: { limit: 50 }
    })

    if (response.success) {
      recentEvents.value = response.events || []
    }
  } catch (error) {
    console.error('Failed to load events:', error)
    showNotificationMessage('Failed to load events', 'error')
  }
}

const exportReport = async () => {
  if (!exportForm.value?.validate()) return

  exportLoading.value = true
  try {
    const response = await $fetch('/api/admin/analytics/export', {
      method: 'POST',
      body: exportConfig.value
    })

    if (exportConfig.value.format === 'csv') {
      // For CSV, the response is the raw CSV data
      const blob = new Blob([response], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-report-${exportConfig.value.timeRange}-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showNotificationMessage('Report exported successfully', 'success')
    } else {
      // For JSON, show download link or handle differently
      const blob = new Blob([JSON.stringify(response.report, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-report-${exportConfig.value.timeRange}-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showNotificationMessage('Report exported successfully', 'success')
    }

    showExportDialog.value = false
  } catch (error) {
    console.error('Export failed:', error)
    showNotificationMessage('Failed to export report', 'error')
  } finally {
    exportLoading.value = false
  }
}

const getEventStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'ACTIVE': 'success',
    'DRAFT': 'warning',
    'PAUSED': 'info',
    'COMPLETED': 'secondary',
    'ARCHIVED': 'grey'
  }
  return colorMap[status] || 'grey'
}

const getEventStatusIcon = (status: string): string => {
  const iconMap: Record<string, string> = {
    'ACTIVE': 'mdi-play',
    'DRAFT': 'mdi-file-edit',
    'PAUSED': 'mdi-pause',
    'COMPLETED': 'mdi-check',
    'ARCHIVED': 'mdi-archive'
  }
  return iconMap[status] || 'mdi-circle'
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString()
}

const showNotificationMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  notificationMessage.value = message
  notificationType.value = type
  showNotification.value = true
}

// Lifecycle
onMounted(() => {
  loadRecentEvents()
})

// Add page title
useHead({
  title: 'Analytics Dashboard - Admin'
})
</script>

<style scoped>
.analytics-page {
  padding: 24px;
  max-width: 100%;
  margin: 0 auto;
}

@media (max-width: 960px) {
  .analytics-page {
    padding: 16px;
  }

  .d-flex.justify-space-between {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .d-flex.gap-2 {
    width: 100%;
    justify-content: stretch;
  }

  .d-flex.gap-2 .v-btn {
    flex: 1;
  }
}
</style>
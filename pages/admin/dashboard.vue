<script setup lang="ts">
// Admin dashboard component
import { ref, computed } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: ['auth', 'admin']
})

interface AdminStats {
  totalUsers: number
  totalEvents: number
  activeEvents: number
  paidSubscriptions: number
  revenue: number
  monthlyRecurringRevenue: number
  eventPaymentsThisMonth: number
}

interface ActivityItem {
  id: string
  action: string
  details: string | null
  createdAt: string
}

interface RecentUser {
  id: string
  name: string | null
  email: string
  subscriptionTier: string
}

// State
const loading = ref(true)
const stats = ref<AdminStats>({} as AdminStats)
const recentActivity = ref<ActivityItem[]>([])
const recentUsers = ref<RecentUser[]>([])

// Fetch admin stats
async function fetchAdminStats() {
  loading.value = true
  
  try {
    const response = await $fetch('/api/admin/stats')
    stats.value = response.stats
    recentActivity.value = response.recentActivity || []
    recentUsers.value = response.recentUsers || []
  } catch (error) {
    console.error('Failed to fetch admin stats:', error)
  } finally {
    loading.value = false
  }
}

// Computed values
const totalRevenue = computed(() => {
  if (!stats.value.revenue) return '$0'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(stats.value.revenue / 100)
})

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(cents / 100)
}

function getActivityColor(action: string) {
  switch (action) {
    case 'event_created': return 'success'
    case 'subscription_upgraded': return 'info'
    case 'event_payment_completed': return 'warning'
    case 'user_registered': return 'primary'
    default: return 'grey'
  }
}

function getActivityIcon(action: string) {
  switch (action) {
    case 'event_created': return 'mdi-calendar-plus'
    case 'subscription_upgraded': return 'mdi-arrow-up-bold'
    case 'event_payment_completed': return 'mdi-credit-card'
    case 'user_registered': return 'mdi-account-plus'
    default: return 'mdi-information'
  }
}

function getActivityDescription(action: string) {
  switch (action) {
    case 'event_created': return 'New event created'
    case 'subscription_upgraded': return 'Subscription upgraded'
    case 'event_payment_completed': return 'Event payment completed'
    case 'user_registered': return 'New user registered'
    default: return action
  }
}

function getSubscriptionColor(tier: string) {
  switch (tier) {
    case 'FREE': return 'grey'
    case 'COMMUNITY': return 'blue'
    case 'ORGANIZER': return 'orange'
    case 'UNLIMITED': return 'purple'
    default: return 'grey'
  }
}

onMounted(() => {
  fetchAdminStats()
})

useSeoMeta({
  title: 'Admin Dashboard - Unconference',
  description: 'Administrative dashboard for managing the unconference platform.',
})
</script>

<template>
  <div class="admin-dashboard">
    <v-container class="py-8">
      <!-- Header -->
      <div class="d-flex justify-space-between align-center mb-8">
        <div>
          <h1 class="text-h3 font-weight-bold text-primary mb-2">
            Admin Dashboard
          </h1>
          <p class="text-h6 text-medium-emphasis">
            Platform overview and management
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="64" />
        <p class="text-h6 mt-4">Loading dashboard...</p>
      </div>

      <!-- Stats Cards -->
      <v-row v-else class="mb-8">
        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card h-100" color="primary" dark>
            <v-card-text class="pa-6">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <p class="text-caption mb-1 opacity-80">Total Users</p>
                  <h2 class="text-h3 font-weight-bold">{{ stats.totalUsers || 0 }}</h2>
                </div>
                <v-icon size="48" class="opacity-60">mdi-account-group</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card h-100" color="success" dark>
            <v-card-text class="pa-6">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <p class="text-caption mb-1 opacity-80">Active Events</p>
                  <h2 class="text-h3 font-weight-bold">{{ stats.activeEvents || 0 }}</h2>
                </div>
                <v-icon size="48" class="opacity-60">mdi-calendar-check</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card h-100" color="info" dark>
            <v-card-text class="pa-6">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <p class="text-caption mb-1 opacity-80">Paid Subscriptions</p>
                  <h2 class="text-h3 font-weight-bold">{{ stats.paidSubscriptions || 0 }}</h2>
                </div>
                <v-icon size="48" class="opacity-60">mdi-credit-card</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="stat-card h-100" color="warning" dark>
            <v-card-text class="pa-6">
              <div class="d-flex align-center justify-space-between">
                <div>
                  <p class="text-caption mb-1 opacity-80">Monthly Revenue</p>
                  <h2 class="text-h4 font-weight-bold">{{ totalRevenue }}</h2>
                </div>
                <v-icon size="48" class="opacity-60">mdi-currency-usd</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Recent Activity & Users -->
      <v-row>
        <v-col cols="12" lg="8">
          <v-card class="h-100">
            <v-card-title class="d-flex align-center justify-space-between">
              <h3 class="text-h5">Recent Activity</h3>
              <v-chip color="primary" size="small">
                Last 7 Days
              </v-chip>
            </v-card-title>
            
            <v-card-text>
              <div v-if="recentActivity.length === 0" class="text-center py-8">
                <v-icon size="64" color="grey-lighten-2">mdi-history</v-icon>
                <p class="text-h6 mt-4 text-medium-emphasis">No recent activity</p>
              </div>
              
              <v-timeline v-else density="compact" class="ml-0">
                <v-timeline-item
                  v-for="activity in recentActivity"
                  :key="activity.id"
                  :dot-color="getActivityColor(activity.action)"
                  size="small"
                >
                  <template #icon>
                    <v-icon size="small">{{ getActivityIcon(activity.action) }}</v-icon>
                  </template>
                  
                  <v-card variant="tonal" class="mb-2">
                    <v-card-text class="py-2">
                      <div class="d-flex justify-space-between align-start">
                        <div>
                          <p class="text-body-2 mb-1">
                            <strong>{{ getActivityDescription(activity.action) }}</strong>
                          </p>
                          <p class="text-caption text-medium-emphasis mb-0">
                            {{ activity.details ? JSON.parse(activity.details).eventTitle || JSON.parse(activity.details).tier : 'No details' }}
                          </p>
                        </div>
                        <v-chip size="x-small" variant="outlined">
                          {{ formatDate(activity.createdAt) }}
                        </v-chip>
                      </div>
                    </v-card-text>
                  </v-card>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" lg="4">
          <v-card class="h-100">
            <v-card-title>
              <h3 class="text-h5">Recent Users</h3>
            </v-card-title>
            
            <v-card-text>
              <div v-if="recentUsers.length === 0" class="text-center py-8">
                <v-icon size="64" color="grey-lighten-2">mdi-account-plus</v-icon>
                <p class="text-h6 mt-4 text-medium-emphasis">No new users</p>
              </div>
              
              <div v-else>
                <div
                  v-for="user in recentUsers"
                  :key="user.id"
                  class="user-item d-flex align-center justify-space-between py-2"
                >
                  <div class="d-flex align-center">
                    <v-avatar size="32" color="primary" class="mr-3">
                      <span class="text-caption">{{ (user.name || 'U')[0].toUpperCase() }}</span>
                    </v-avatar>
                    <div>
                      <p class="text-body-2 mb-0 font-weight-medium">
                        {{ user.name || 'Unknown User' }}
                      </p>
                      <p class="text-caption text-medium-emphasis mb-0">
                        {{ user.email }}
                      </p>
                    </div>
                  </div>
                  
                  <v-chip
                    :color="getSubscriptionColor(user.subscriptionTier)"
                    size="x-small"
                    variant="outlined"
                  >
                    {{ user.subscriptionTier }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.admin-dashboard {
  background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%);
  min-height: 100vh;
}

.stat-card {
  border-radius: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.user-item:not(:last-child) {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
</style>
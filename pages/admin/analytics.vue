<template>
  <div class="simple-analytics">
    <v-container>
      <!-- Header -->
      <div class="d-flex justify-space-between align-center mb-6">
        <div>
          <h1 class="text-h4 font-weight-bold">Simple Analytics</h1>
          <p class="text-body-1 text-medium-emphasis">
            Essential metrics that matter for OST events
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" size="48" />
        <p class="mt-4">Loading analytics...</p>
      </div>

      <!-- Essential Metrics Cards -->
      <v-row v-else class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card class="h-100">
            <v-card-text class="text-center pa-6">
              <v-icon size="48" color="primary" class="mb-3">mdi-calendar-multiple</v-icon>
              <h2 class="text-h3 font-weight-bold">{{ metrics.totalEvents || 0 }}</h2>
              <p class="text-body-2 text-medium-emphasis">Total Events</p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="h-100">
            <v-card-text class="text-center pa-6">
              <v-icon size="48" color="success" class="mb-3">mdi-account-group</v-icon>
              <h2 class="text-h3 font-weight-bold">{{ metrics.totalParticipants || 0 }}</h2>
              <p class="text-body-2 text-medium-emphasis">Total Participants</p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="h-100">
            <v-card-text class="text-center pa-6">
              <v-icon size="48" color="info" class="mb-3">mdi-lightbulb-multiple</v-icon>
              <h2 class="text-h3 font-weight-bold">{{ metrics.totalTopics || 0 }}</h2>
              <p class="text-body-2 text-medium-emphasis">Topics Created</p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="h-100">
            <v-card-text class="text-center pa-6">
              <v-icon size="48" color="warning" class="mb-3">mdi-currency-usd</v-icon>
              <h2 class="text-h3 font-weight-bold">${{ metrics.monthlyRevenue || 0 }}</h2>
              <p class="text-body-2 text-medium-emphasis">Monthly Revenue</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Recent Events -->
      <v-card>
        <v-card-title>
          <h3 class="text-h5">Recent Events</h3>
        </v-card-title>
        <v-card-text>
          <div v-if="recentEvents.length === 0" class="text-center py-8">
            <v-icon size="64" color="grey-lighten-2">mdi-calendar-outline</v-icon>
            <p class="text-h6 mt-4 text-medium-emphasis">No events yet</p>
          </div>

          <v-simple-table v-else>
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Participants</th>
                <th>Topics</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="event in recentEvents" :key="event.id">
                <td class="font-weight-medium">{{ event.name }}</td>
                <td>{{ event.participantCount || 0 }}</td>
                <td>{{ event.topicCount || 0 }}</td>
                <td>{{ formatDate(event.createdAt) }}</td>
                <td>
                  <v-chip
                    :color="getStatusColor(event.status)"
                    size="small"
                    variant="outlined"
                  >
                    {{ event.status || 'Draft' }}
                  </v-chip>
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<script setup lang="ts">
// Simple analytics - just the essential metrics
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'admin']
});

interface SimpleMetrics {
  totalEvents: number;
  totalParticipants: number;
  totalTopics: number;
  monthlyRevenue: number;
}

interface SimpleEvent {
  id: string;
  name: string;
  participantCount: number;
  topicCount: number;
  createdAt: string;
  status: string;
}

// State
const loading = ref(true);
const metrics = ref<SimpleMetrics>({
  totalEvents: 0,
  totalParticipants: 0,
  totalTopics: 0,
  monthlyRevenue: 0
});
const recentEvents = ref<SimpleEvent[]>([]);

// Load simple analytics data
const loadSimpleAnalytics = async () => {
  loading.value = true;

  try {
    // Load from file-based storage (keeping it simple)
    const [eventsResponse, topicsResponse] = await Promise.all([
      $fetch('/api/admin/events'),
      $fetch('/api/admin/topics')
    ]);

    // Calculate simple metrics
    const events = eventsResponse.events || [];
    const topics = topicsResponse.topics || [];

    metrics.value = {
      totalEvents: events.length,
      totalParticipants: events.reduce((sum: number, event: any) => sum + (event.participantCount || 0), 0),
      totalTopics: topics.length,
      monthlyRevenue: 0 // Will be updated when payment system is implemented
    };

    // Show recent 10 events
    recentEvents.value = events
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((event: any) => ({
        id: event.id,
        name: event.name || 'Unnamed Event',
        participantCount: event.participantCount || 0,
        topicCount: topics.filter((t: any) => t.eventId === event.id).length,
        createdAt: event.createdAt,
        status: event.isActive ? 'Active' : 'Draft'
      }));

  } catch (error) {
    console.error('Failed to load analytics:', error);
  } finally {
    loading.value = false;
  }
};

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'success';
    case 'completed': return 'info';
    default: return 'grey';
  }
};

// Load data on mount
onMounted(() => {
  loadSimpleAnalytics();
});

useSeoMeta({
  title: 'Simple Analytics - Admin',
  description: 'Essential metrics for unconference platform'
});
</script>

<style scoped>
.simple-analytics {
  /* Keep it clean and minimal */
}

.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}
</style>
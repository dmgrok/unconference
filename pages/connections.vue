<template>
  <div class="connections-page">
    <v-container class="py-6">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-h4 font-weight-bold mb-2">Connections</h1>
        <p class="text-body-1 text-medium-emphasis">
          Track the people you connect with during the event
        </p>
      </div>

      <!-- Simple Networking Component -->
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <SimpleNetworking
            v-if="currentEventId"
            :event-id="currentEventId"
          />

          <!-- No event state -->
          <v-card v-else elevation="2">
            <v-card-text class="text-center py-8">
              <v-icon size="64" color="grey-lighten-2">mdi-account-group-outline</v-icon>
              <h3 class="text-h6 mt-4 mb-2">No Active Event</h3>
              <p class="text-body-2 text-medium-emphasis">
                Join an event to start making connections
              </p>
              <v-btn
                color="primary"
                variant="flat"
                to="/events"
                class="mt-4"
              >
                Browse Events
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Global feedback button -->
      <FeedbackButton />
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Page meta
definePageMeta({
  middleware: ['auth']
})

// Composables
const { currentEventId } = useEventContext()

// SEO
useSeoMeta({
  title: 'Connections - Unconference',
  description: 'Track connections made during the event'
})
</script>

<style scoped>
.connections-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}
</style>
<script setup lang="ts">
const { eventConfig } = useEventConfig()
</script>

<template>
  <v-container class="text-center py-16">
    <v-row justify="center">
      <v-col cols="12" md="8">
        <h1 class="text-h2 font-weight-bold mb-6">{{ eventConfig.title }}</h1>
        
        <v-card class="mx-auto pa-6 mb-8" max-width="800" elevation="3">
          <div class="text-h5 mb-4">
            {{ eventConfig.description }}
          </div>
          
          <v-list>
            <v-list-item prepend-icon="mdi-calendar">
              <v-list-item-title class="text-h6">{{ eventConfig.dates }}</v-list-item-title>
            </v-list-item>
            
            <v-list-item prepend-icon="mdi-map-marker">
              <v-list-item-title class="text-h6">{{ eventConfig.location }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
        
        <v-btn
          color="primary"
          size="x-large"
          to="/login"
          class="text-h6 px-8"
        >
          Join the Discussion
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

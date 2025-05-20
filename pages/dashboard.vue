<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDisplay } from 'vuetify'

const data = ref([
  {
    title: 'Global 1',
    drilldownRoute: 'dashboard-team',
    drilldownParams: {}
  },
  {
    title: 'Global 2',
    drilldownRoute: 'dashboard-team',
    drilldownParams: {}
  },
  {
    title: 'Global 3',
    drilldownRoute: 'dashboard-team',
    drilldownParams: {}
  },
  {
    title: 'Global 4',
    drilldownRoute: 'dashboard-team',
    drilldownParams: {}
  }
])

const { lgAndUp, mdAndDown } = useDisplay()

const placeholderCount = computed(() => {
  const itemCount = data.value.length
  
  if (lgAndUp.value) {
    // On large screens (3 columns), calculate padding to next multiple of 3
    const remainder = itemCount % 3
    return remainder === 0 ? 0 : 3 - remainder
  } else if (mdAndDown.value) {
    // On medium and smaller screens (2 columns), add 1 if odd number
    return itemCount % 2 === 0 ? 0 : 1
  }
  return 0
})

const placeholders = computed(() => Array(placeholderCount.value).fill(null))
</script>

<template>
  <v-container>
    <v-row>
      <v-col
        v-for="(item, index) in data"
        :key="'tile-' + index"
        cols="12"
        sm="6"
        lg="4"
        class="d-flex"
      >
        <WorkflowHealthTile
          :title="item.title"
          :drilldownRoute="item.drilldownRoute"
          :drilldownParams="{}"
          class="flex-grow-1"
        />
      </v-col>
      
      <!-- Placeholder tiles -->
      <v-col
        v-for="(_, index) in placeholders"
        :key="'placeholder-' + index"
        cols="12"
        sm="6"
        lg="4"
        class="d-flex"
      >
        <WorkflowHealthTilePlaceholder class="flex-grow-1" />
      </v-col>
    </v-row>
  </v-container>
</template>

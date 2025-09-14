<template>
  <div v-if="shouldShow">
    <!-- Banner Warning (for headers/global placement) -->
    <v-banner
      v-if="displayMode === 'banner'"
      :color="warningColor"
      :icon="warningIcon"
      class="mb-4"
      lines="two"
      sticky
    >
      <template #text>
        <div>
          <div class="font-weight-bold">{{ warning.title }}</div>
          <div class="text-body-2">{{ warning.message }}</div>
        </div>
      </template>

      <template #actions>
        <v-btn
          v-if="showUpgradeAction"
          :color="warningColor"
          variant="elevated"
          size="small"
          @click="$emit('upgrade')"
        >
          {{ warning.action }}
        </v-btn>

        <v-btn
          variant="text"
          size="small"
          @click="$emit('dismiss')"
        >
          Dismiss
        </v-btn>
      </template>
    </v-banner>

    <!-- Alert Warning (for inline placement) -->
    <v-alert
      v-else-if="displayMode === 'alert'"
      :type="warningColor"
      :variant="alertVariant"
      class="mb-4"
      :dismissible="dismissible"
      @click:close="$emit('dismiss')"
    >
      <template #title>{{ warning.title }}</template>
      <div class="mb-2">{{ warning.message }}</div>

      <template #append v-if="showUpgradeAction">
        <v-btn
          :color="warningColor"
          :variant="warning.type === 'error' ? 'elevated' : 'outlined'"
          size="small"
          @click="$emit('upgrade')"
        >
          {{ warning.action }}
        </v-btn>
      </template>
    </v-alert>

    <!-- Compact Warning (for cards/small spaces) -->
    <v-card
      v-else-if="displayMode === 'compact'"
      :color="warningColor"
      variant="tonal"
      class="mb-2"
    >
      <v-card-text class="py-2 px-3">
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon :color="warningColor" size="small" class="mr-2">
              {{ warningIcon }}
            </v-icon>
            <div>
              <div class="text-body-2 font-weight-bold">{{ warning.title }}</div>
              <div class="text-caption">{{ compactMessage }}</div>
            </div>
          </div>

          <div v-if="showUpgradeAction">
            <v-btn
              :color="warningColor"
              size="x-small"
              variant="elevated"
              @click="$emit('upgrade')"
              class="mr-1"
            >
              Upgrade
            </v-btn>
            <v-btn
              icon
              size="x-small"
              variant="text"
              @click="$emit('dismiss')"
            >
              <v-icon size="small">mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Chip Warning (for minimal display) -->
    <v-chip
      v-else-if="displayMode === 'chip'"
      :color="warningColor"
      size="small"
      variant="elevated"
      class="mb-2"
      @click="showDetails = !showDetails"
    >
      <v-icon start size="small">{{ warningIcon }}</v-icon>
      {{ chipMessage }}
      <v-icon end size="small">{{ showDetails ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
    </v-chip>

    <!-- Details expansion for chip mode -->
    <v-expand-transition>
      <v-card
        v-if="displayMode === 'chip' && showDetails"
        variant="outlined"
        class="mt-2 mb-4"
      >
        <v-card-text class="py-2">
          <div class="text-body-2">{{ warning.message }}</div>
          <div class="mt-2" v-if="showUpgradeAction">
            <v-btn
              :color="warningColor"
              size="small"
              variant="outlined"
              @click="$emit('upgrade')"
              class="mr-2"
            >
              {{ warning.action }}
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              @click="$emit('dismiss')"
            >
              Dismiss
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-expand-transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface WarningInfo {
  type: 'info' | 'warning' | 'error'
  title: string
  message: string
  action: string
}

interface Props {
  warning: WarningInfo | null
  displayMode?: 'banner' | 'alert' | 'compact' | 'chip'
  showUpgradeAction?: boolean
  dismissible?: boolean
  alertVariant?: 'tonal' | 'outlined' | 'elevated' | 'flat' | 'plain'
}

const props = withDefaults(defineProps<Props>(), {
  displayMode: 'alert',
  showUpgradeAction: true,
  dismissible: true,
  alertVariant: 'tonal'
})

const emit = defineEmits<{
  'upgrade': []
  'dismiss': []
}>()

const showDetails = ref(false)

const shouldShow = computed(() => {
  return !!props.warning
})

const warningColor = computed(() => {
  if (!props.warning) return 'info'

  switch (props.warning.type) {
    case 'error': return 'error'
    case 'warning': return 'warning'
    case 'info': return 'info'
    default: return 'info'
  }
})

const warningIcon = computed(() => {
  if (!props.warning) return 'mdi-information'

  switch (props.warning.type) {
    case 'error': return 'mdi-alert-circle'
    case 'warning': return 'mdi-alert'
    case 'info': return 'mdi-information'
    default: return 'mdi-information'
  }
})

// Shortened messages for compact display modes
const compactMessage = computed(() => {
  if (!props.warning) return ''

  // Extract key info for compact display
  const message = props.warning.message
  if (message.length <= 50) return message

  // Try to extract participant count info
  const participantMatch = message.match(/(\d+)\/(\d+)/)
  if (participantMatch) {
    return `${participantMatch[0]} participants`
  }

  const spotsMatch = message.match(/(\d+)\s+spot[s]?\s+remaining/i)
  if (spotsMatch) {
    return `${spotsMatch[1]} spots left`
  }

  // Fallback to truncated message
  return message.substring(0, 47) + '...'
})

const chipMessage = computed(() => {
  if (!props.warning) return ''

  const message = props.warning.message

  // Extract key participant info for chip
  const spotsMatch = message.match(/(\d+)\s+spot[s]?\s+remaining/i)
  if (spotsMatch) {
    const count = parseInt(spotsMatch[1])
    return count === 1 ? '1 spot left' : `${count} spots left`
  }

  const percentMatch = message.match(/(\d+)%\s+full/i)
  if (percentMatch) {
    return `${percentMatch[1]}% full`
  }

  if (message.toLowerCase().includes('limit reached')) {
    return 'Limit reached'
  }

  return props.warning.title
})
</script>

<style scoped>
.v-banner {
  border-radius: 8px;
}

.v-chip {
  cursor: pointer;
}

.v-alert {
  border-radius: 8px;
}
</style>
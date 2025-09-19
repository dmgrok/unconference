<template>
  <div class="pricing-selector">
    <h2 class="text-h5 font-weight-bold mb-6 text-center">Choose Event Tier</h2>

    <v-row>
      <!-- Free Tier -->
      <v-col cols="12" md="4">
        <v-card
          :class="{ 'border-primary': selectedTier === 'FREE' }"
          elevation="2"
          class="h-100 d-flex flex-column"
          @click="selectTier('FREE')"
          style="cursor: pointer"
        >
          <v-card-title class="text-center">
            <div>
              <h3 class="text-h6">Free</h3>
              <div class="text-h4 font-weight-bold text-primary">$0</div>
              <div class="text-caption text-medium-emphasis">Per event</div>
            </div>
          </v-card-title>

          <v-card-text class="flex-grow-1">
            <div class="text-center mb-4">
              <div class="text-subtitle-1 font-weight-medium">Up to 50 participants</div>
            </div>

            <v-list class="bg-transparent" density="compact">
              <v-list-item prepend-icon="mdi-check" class="px-0">
                <v-list-item-title class="text-body-2">Basic topic voting</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-check" class="px-0">
                <v-list-item-title class="text-body-2">Round management</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-check" class="px-0">
                <v-list-item-title class="text-body-2">QR code access</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-check" class="px-0">
                <v-list-item-title class="text-body-2">Simple networking</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-card-actions class="pa-4">
            <v-btn
              :variant="selectedTier === 'FREE' ? 'flat' : 'outlined'"
              :color="selectedTier === 'FREE' ? 'primary' : 'default'"
              block
              @click.stop="selectTier('FREE')"
            >
              Select Free
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Professional Tier -->
      <v-col cols="12" md="4">
        <v-card
          :class="{ 'border-primary': selectedTier === 'PROFESSIONAL' }"
          elevation="3"
          class="h-100 d-flex flex-column position-relative"
          @click="selectTier('PROFESSIONAL')"
          style="cursor: pointer"
        >
          <v-chip
            color="primary"
            size="small"
            class="position-absolute"
            style="top: 16px; right: 16px; z-index: 1"
          >
            Popular
          </v-chip>

          <v-card-title class="text-center">
            <div>
              <h3 class="text-h6">Professional</h3>
              <div class="text-h4 font-weight-bold text-primary">$29</div>
              <div class="text-caption text-medium-emphasis">Per event</div>
            </div>
          </v-card-title>

          <v-card-text class="flex-grow-1">
            <div class="text-center mb-4">
              <div class="text-subtitle-1 font-weight-medium">Up to 100 participants</div>
            </div>

            <v-list class="bg-transparent" density="compact">
              <v-list-item prepend-icon="mdi-check" class="px-0">
                <v-list-item-title class="text-body-2">Everything in Free</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-check" class="px-0">
                <v-list-item-title class="text-body-2">Advanced analytics</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-check" class="px-0">
                <v-list-item-title class="text-body-2">Data export</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-check" class="px-0">
                <v-list-item-title class="text-body-2">Email support</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-card-actions class="pa-4">
            <v-btn
              :variant="selectedTier === 'PROFESSIONAL' ? 'flat' : 'outlined'"
              :color="selectedTier === 'PROFESSIONAL' ? 'primary' : 'default'"
              block
              @click.stop="selectTier('PROFESSIONAL')"
            >
              Select Professional
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Enterprise Tier -->
      <v-col cols="12" md="4">
        <v-card
          :class="{ 'border-primary': selectedTier === 'ENTERPRISE' }"
          elevation="2"
          class="h-100 d-flex flex-column"
          @click="selectTier('ENTERPRISE')"
          style="cursor: pointer"
        >
          <v-card-title class="text-center">
            <div>
              <h3 class="text-h6">Enterprise</h3>
              <div class="text-h4 font-weight-bold text-primary">$99</div>
              <div class="text-caption text-medium-emphasis">Per event</div>
            </div>
          </v-card-title>

          <v-card-text class="flex-grow-1">
            <div class="text-center mb-4">
              <div class="text-subtitle-1 font-weight-medium">Unlimited participants</div>
            </div>

            <v-list class="bg-transparent" density="compact">
              <v-list-item prepend-icon="mdi-check" class="px-0">
                <v-list-item-title class="text-body-2">Everything in Professional</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-check" class="px-0">
                <v-list-item-title class="text-body-2">Priority support</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-check" class="px-0">
                <v-list-item-title class="text-body-2">Custom branding</v-list-item-title>
              </v-list-item>
              <v-list-item prepend-icon="mdi-check" class="px-0">
                <v-list-item-title class="text-body-2">Advanced integrations</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>

          <v-card-actions class="pa-4">
            <v-btn
              :variant="selectedTier === 'ENTERPRISE' ? 'flat' : 'outlined'"
              :color="selectedTier === 'ENTERPRISE' ? 'primary' : 'default'"
              block
              @click.stop="selectTier('ENTERPRISE')"
            >
              Select Enterprise
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Comparison Note -->
    <v-alert
      type="info"
      variant="tonal"
      class="mt-6"
      icon="mdi-information"
    >
      <div class="text-body-2">
        <strong>Compare with competitors:</strong> Sessionize charges €500 (~$540) per event.
        Our pricing gives you professional event management at a fraction of the cost.
      </div>
    </v-alert>

    <!-- Continue Button -->
    <div class="text-center mt-6" v-if="selectedTier && selectedTier !== 'FREE'">
      <v-btn
        color="primary"
        size="large"
        variant="flat"
        @click="proceedToPayment"
        :loading="loading"
      >
        Proceed to Payment (${{ selectedTier === 'PROFESSIONAL' ? '29' : '99' }})
      </v-btn>
    </div>

    <div class="text-center mt-6" v-if="selectedTier === 'FREE'">
      <v-btn
        color="primary"
        size="large"
        variant="flat"
        @click="proceedWithFree"
      >
        Continue with Free Event
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  eventId: string
  modelValue?: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE'
}

interface Emits {
  (e: 'update:modelValue', value: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE'): void
  (e: 'tier-selected', value: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE'): void
  (e: 'proceed-to-payment', tier: 'PROFESSIONAL' | 'ENTERPRISE'): void
  (e: 'proceed-free'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedTier = ref<'FREE' | 'PROFESSIONAL' | 'ENTERPRISE'>(props.modelValue || 'PROFESSIONAL')
const loading = ref(false)

function selectTier(tier: 'FREE' | 'PROFESSIONAL' | 'ENTERPRISE') {
  selectedTier.value = tier
  emit('update:modelValue', tier)
  emit('tier-selected', tier)
}

async function proceedToPayment() {
  if (selectedTier.value === 'FREE') return

  loading.value = true
  try {
    emit('proceed-to-payment', selectedTier.value)
  } finally {
    loading.value = false
  }
}

function proceedWithFree() {
  emit('proceed-free')
}

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  if (newValue && newValue !== selectedTier.value) {
    selectedTier.value = newValue
  }
})
</script>

<style scoped>
.pricing-selector .v-card {
  transition: all 0.3s ease;
}

.pricing-selector .v-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.12) !important;
}

.border-primary {
  border: 2px solid rgb(var(--v-theme-primary)) !important;
}
</style>
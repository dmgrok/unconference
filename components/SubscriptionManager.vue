<template>
  <v-card class="subscription-manager">
    <v-card-title class="text-h5 d-flex align-center">
      <v-icon class="mr-2" color="primary">mdi-credit-card</v-icon>
      Subscription Management
    </v-card-title>

    <v-card-text>
      <!-- Current Subscription Overview -->
      <v-row class="mb-6">
        <v-col cols="12">
          <div class="text-h6 mb-3">Current Subscription</div>
          <v-card
            :color="subscriptionData.status === 'ACTIVE' ? 'success' : 'warning'"
            variant="tonal"
            class="pa-4"
          >
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-h6 font-weight-bold">
                  {{ subscriptionData.tier }} Plan
                </div>
                <div class="text-body-2 mb-2">
                  Status: {{ formatStatus(subscriptionData.status) }}
                </div>
                <div class="text-body-2" v-if="subscriptionData.isActive">
                  Next billing: {{ formatDate(subscriptionData.limits.subscriptionEnd) }}
                </div>
                <div class="text-body-2 error--text" v-else-if="subscriptionData.status === 'PAST_DUE'">
                  Payment failed - Please update payment method
                </div>
              </div>
              <div class="text-right">
                <div class="text-h4 font-weight-bold">
                  ${{ getTierPrice(subscriptionData.tier) }}
                </div>
                <div class="text-body-2">per month</div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Usage Statistics -->
      <v-row class="mb-6">
        <v-col cols="12">
          <div class="text-h6 mb-3">Usage This Month</div>
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold text-primary">
                    {{ subscriptionData.usage.eventsThisMonth }}
                  </div>
                  <div class="text-body-2">
                    of {{ subscriptionData.limits.maxEventsPerMonth === -1 ? '∞' : subscriptionData.limits.maxEventsPerMonth }} events
                  </div>
                  <v-progress-linear
                    :model-value="getEventUsagePercent()"
                    :color="getEventUsagePercent() > 80 ? 'error' : 'primary'"
                    class="mt-2"
                  />
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4">
                <div class="text-center">
                  <div class="text-h4 font-weight-bold text-primary">
                    {{ currentParticipants }}
                  </div>
                  <div class="text-body-2">
                    max participants per event: {{ subscriptionData.limits.maxParticipants === -1 ? '∞' : subscriptionData.limits.maxParticipants }}
                  </div>
                  <v-progress-linear
                    :model-value="getParticipantUsagePercent()"
                    :color="getParticipantUsagePercent() > 80 ? 'error' : 'primary'"
                    class="mt-2"
                  />
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <!-- Feature Comparison -->
      <v-row class="mb-6" v-if="showFeatureComparison">
        <v-col cols="12">
          <div class="text-h6 mb-3">Plan Comparison</div>
          <v-table>
            <thead>
              <tr>
                <th>Feature</th>
                <th class="text-center">Current ({{ subscriptionData.tier }})</th>
                <th class="text-center" v-for="tier in upgradableTiers" :key="tier">
                  {{ tier }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Max Participants</td>
                <td class="text-center">{{ subscriptionData.limits.maxParticipants === -1 ? '∞' : subscriptionData.limits.maxParticipants }}</td>
                <td class="text-center" v-for="tier in upgradableTiers" :key="tier">
                  {{ getFeatureValue(tier, 'maxParticipants') }}
                </td>
              </tr>
              <tr>
                <td>Events per Month</td>
                <td class="text-center">{{ subscriptionData.limits.maxEventsPerMonth === -1 ? '∞' : subscriptionData.limits.maxEventsPerMonth }}</td>
                <td class="text-center" v-for="tier in upgradableTiers" :key="tier">
                  {{ getFeatureValue(tier, 'maxEventsPerMonth') }}
                </td>
              </tr>
              <tr>
                <td>Price</td>
                <td class="text-center">${{ getTierPrice(subscriptionData.tier) }}/month</td>
                <td class="text-center" v-for="tier in upgradableTiers" :key="tier">
                  ${{ getTierPrice(tier) }}/month
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-col>
      </v-row>

      <!-- Action Buttons -->
      <v-row>
        <v-col cols="12" class="d-flex flex-wrap gap-3">
          <v-btn
            v-if="canUpgrade"
            color="primary"
            variant="elevated"
            @click="showUpgradeDialog = true"
            prepend-icon="mdi-arrow-up-bold"
          >
            Upgrade Plan
          </v-btn>

          <v-btn
            v-if="canDowngrade"
            color="orange"
            variant="outlined"
            @click="showDowngradeDialog = true"
            prepend-icon="mdi-arrow-down-bold"
          >
            Downgrade Plan
          </v-btn>

          <v-btn
            v-if="subscriptionData.isActive"
            variant="outlined"
            @click="openBillingPortal"
            prepend-icon="mdi-receipt"
            :loading="billingPortalLoading"
          >
            Billing Portal
          </v-btn>

          <v-btn
            v-if="subscriptionData.status === 'PAST_DUE'"
            color="error"
            variant="elevated"
            @click="retryPayment"
            prepend-icon="mdi-refresh"
            :loading="retryingPayment"
          >
            Update Payment Method
          </v-btn>

          <v-btn
            variant="outlined"
            @click="showFeatureComparison = !showFeatureComparison"
            prepend-icon="mdi-compare"
          >
            {{ showFeatureComparison ? 'Hide' : 'Compare' }} Plans
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- Upgrade Dialog -->
    <v-dialog v-model="showUpgradeDialog" max-width="600">
      <v-card>
        <v-card-title>Upgrade Subscription</v-card-title>
        <v-card-text>
          <div class="text-body-1 mb-4">
            Choose your new subscription tier:
          </div>
          <v-row>
            <v-col
              v-for="tier in upgradableTiers"
              :key="tier"
              cols="12"
              sm="6"
            >
              <v-card
                :variant="selectedUpgradeTier === tier ? 'elevated' : 'outlined'"
                :color="selectedUpgradeTier === tier ? 'primary' : undefined"
                class="pa-3 upgrade-option"
                @click="selectedUpgradeTier = tier"
              >
                <div class="text-center">
                  <div class="text-h6">{{ tier }}</div>
                  <div class="text-h5 font-weight-bold">${{ getTierPrice(tier) }}/month</div>
                  <div class="text-body-2 mt-2">
                    {{ getFeatureValue(tier, 'maxParticipants') }} participants<br>
                    {{ getFeatureValue(tier, 'maxEventsPerMonth') }} events/month
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>

          <v-checkbox
            v-model="prorateUpgrade"
            label="Apply prorated charges immediately"
            class="mt-4"
          />
          <div class="text-caption text-medium-emphasis">
            If unchecked, changes will take effect at your next billing cycle
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="outlined" @click="showUpgradeDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :disabled="!selectedUpgradeTier"
            :loading="upgrading"
            @click="processUpgrade"
          >
            Upgrade
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Downgrade Dialog -->
    <v-dialog v-model="showDowngradeDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Downgrade Subscription</v-card-title>
        <v-card-text>
          <v-alert type="warning" variant="tonal" class="mb-4">
            <div class="text-body-1 mb-2">
              <strong>Important:</strong> Downgrading may affect your current events.
            </div>
            <div class="text-body-2">
              Your events will be limited to the new plan's participant limits.
              Any events exceeding these limits may be affected.
            </div>
          </v-alert>

          <div class="mb-4">
            <div class="text-subtitle-1 mb-2">Downgrade to:</div>
            <v-radio-group v-model="selectedDowngradeTier">
              <v-radio
                v-for="tier in downgradableTiers"
                :key="tier"
                :label="`${tier} - $${getTierPrice(tier)}/month`"
                :value="tier"
              />
            </v-radio-group>
          </div>

          <v-checkbox
            v-model="immediateDowngrade"
            label="Apply changes immediately (with prorated refund)"
          />
          <div class="text-caption text-medium-emphasis">
            If unchecked, changes will take effect at your next billing cycle
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="outlined" @click="showDowngradeDialog = false">Cancel</v-btn>
          <v-btn
            color="orange"
            :disabled="!selectedDowngradeTier"
            :loading="downgrading"
            @click="processDowngrade"
          >
            Downgrade
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface SubscriptionData {
  tier: string
  status: string
  isActive: boolean
  limits: {
    maxParticipants: number
    maxEventsPerMonth: number
    subscriptionEnd?: Date
  }
  usage: {
    eventsThisMonth: number
    totalEvents: number
  }
}

interface Props {
  subscriptionData: SubscriptionData
  currentParticipants?: number
}

const props = withDefaults(defineProps<Props>(), {
  currentParticipants: 0
})

const emit = defineEmits<{
  'upgrade': [tier: string, prorate: boolean]
  'downgrade': [tier: string, immediate: boolean]
  'billing-portal': []
  'retry-payment': []
  'refresh': []
}>()

// Reactive state
const showUpgradeDialog = ref(false)
const showDowngradeDialog = ref(false)
const showFeatureComparison = ref(false)
const selectedUpgradeTier = ref('')
const selectedDowngradeTier = ref('')
const prorateUpgrade = ref(true)
const immediateDowngrade = ref(false)
const upgrading = ref(false)
const downgrading = ref(false)
const billingPortalLoading = ref(false)
const retryingPayment = ref(false)

// Tier definitions
const tierOrder = ['FREE', 'COMMUNITY', 'ORGANIZER', 'UNLIMITED']
const tierLimits = {
  FREE: { maxParticipants: 50, maxEventsPerMonth: 5, price: 0 },
  COMMUNITY: { maxParticipants: 150, maxEventsPerMonth: 15, price: 19 },
  ORGANIZER: { maxParticipants: 300, maxEventsPerMonth: 30, price: 49 },
  UNLIMITED: { maxParticipants: -1, maxEventsPerMonth: -1, price: 99 }
}

// Computed properties
const canUpgrade = computed(() => {
  const currentIndex = tierOrder.indexOf(props.subscriptionData.tier)
  return currentIndex < tierOrder.length - 1 && props.subscriptionData.isActive
})

const canDowngrade = computed(() => {
  const currentIndex = tierOrder.indexOf(props.subscriptionData.tier)
  return currentIndex > 0 && props.subscriptionData.isActive
})

const upgradableTiers = computed(() => {
  const currentIndex = tierOrder.indexOf(props.subscriptionData.tier)
  return tierOrder.slice(currentIndex + 1)
})

const downgradableTiers = computed(() => {
  const currentIndex = tierOrder.indexOf(props.subscriptionData.tier)
  return tierOrder.slice(0, currentIndex).filter(tier => tier !== 'FREE')
})

// Helper functions
const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    'ACTIVE': 'Active',
    'PAST_DUE': 'Past Due',
    'CANCELED': 'Canceled',
    'TRIALING': 'Trial',
    'INCOMPLETE': 'Incomplete'
  }
  return statusMap[status] || status
}

const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'Unknown'
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getTierPrice = (tier: string): number => {
  return tierLimits[tier as keyof typeof tierLimits]?.price || 0
}

const getFeatureValue = (tier: string, feature: string) => {
  const limits = tierLimits[tier as keyof typeof tierLimits]
  if (!limits) return 'N/A'

  const value = limits[feature as keyof typeof limits]
  return value === -1 ? '∞' : value
}

const getEventUsagePercent = () => {
  if (props.subscriptionData.limits.maxEventsPerMonth === -1) return 0
  return Math.min(100, (props.subscriptionData.usage.eventsThisMonth / props.subscriptionData.limits.maxEventsPerMonth) * 100)
}

const getParticipantUsagePercent = () => {
  if (props.subscriptionData.limits.maxParticipants === -1) return 0
  return Math.min(100, (props.currentParticipants / props.subscriptionData.limits.maxParticipants) * 100)
}

// Action handlers
const processUpgrade = async () => {
  if (!selectedUpgradeTier.value) return

  upgrading.value = true
  try {
    emit('upgrade', selectedUpgradeTier.value, prorateUpgrade.value)
    showUpgradeDialog.value = false
  } finally {
    upgrading.value = false
  }
}

const processDowngrade = async () => {
  if (!selectedDowngradeTier.value) return

  downgrading.value = true
  try {
    emit('downgrade', selectedDowngradeTier.value, immediateDowngrade.value)
    showDowngradeDialog.value = false
  } finally {
    downgrading.value = false
  }
}

const openBillingPortal = async () => {
  billingPortalLoading.value = true
  try {
    emit('billing-portal')
  } finally {
    billingPortalLoading.value = false
  }
}

const retryPayment = async () => {
  retryingPayment.value = true
  try {
    emit('retry-payment')
  } finally {
    retryingPayment.value = false
  }
}

// Reset selections when dialogs close
watch(showUpgradeDialog, (isOpen) => {
  if (!isOpen) {
    selectedUpgradeTier.value = ''
    prorateUpgrade.value = true
  }
})

watch(showDowngradeDialog, (isOpen) => {
  if (!isOpen) {
    selectedDowngradeTier.value = ''
    immediateDowngrade.value = false
  }
})
</script>

<style scoped>
.subscription-manager {
  max-width: 100%;
}

.upgrade-option {
  cursor: pointer;
  transition: all 0.2s ease;
}

.upgrade-option:hover {
  transform: translateY(-2px);
}

@media (max-width: 600px) {
  .d-flex.flex-wrap.gap-3 {
    flex-direction: column;
  }

  .d-flex.flex-wrap.gap-3 .v-btn {
    margin-bottom: 0.5rem;
  }
}
</style>
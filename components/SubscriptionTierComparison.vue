<template>
  <v-container class="subscription-tiers">
    <div class="text-center mb-6">
      <h2 class="text-h4 font-weight-bold mb-2">Choose Your Plan</h2>
      <p class="text-h6 text-medium-emphasis">
        Scale your events with the right subscription tier
      </p>
    </div>

    <!-- Billing Toggle -->
    <div class="text-center mb-6">
      <v-chip-group v-model="billingCycle" mandatory class="justify-center">
        <v-chip value="monthly" color="primary">Monthly</v-chip>
        <v-chip value="yearly" color="primary">
          Yearly
          <v-chip size="x-small" color="success" class="ml-1">Save 20%</v-chip>
        </v-chip>
      </v-chip-group>
    </div>

    <!-- Tier Comparison Cards -->
    <v-row>
      <v-col
        v-for="tier in tiers"
        :key="tier.key"
        cols="12"
        sm="6"
        md="3"
      >
        <v-card
          :color="tier.popular ? 'primary' : undefined"
          :variant="tier.popular ? 'elevated' : 'outlined'"
          class="tier-card h-100"
          :class="{
            'tier-current': currentTier === tier.key,
            'tier-popular': tier.popular
          }"
        >
          <!-- Popular Badge -->
          <v-chip
            v-if="tier.popular"
            color="success"
            size="small"
            class="popular-badge"
          >
            Most Popular
          </v-chip>

          <!-- Current Plan Badge -->
          <v-chip
            v-if="currentTier === tier.key"
            color="info"
            size="small"
            class="current-badge"
          >
            Current Plan
          </v-chip>

          <v-card-text class="text-center pb-0">
            <!-- Tier Name & Price -->
            <div class="mb-4">
              <h3 class="text-h5 font-weight-bold">{{ tier.name }}</h3>
              <div class="price-section">
                <div class="text-h3 font-weight-bold text-primary">
                  ${{ getPrice(tier) }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  {{ tier.key === 'FREE' ? 'Forever' : `per ${billingCycle === 'yearly' ? 'year' : 'month'}` }}
                </div>
              </div>
            </div>

            <!-- Key Features -->
            <div class="mb-4">
              <div class="text-h6 font-weight-bold mb-2">
                {{ tier.maxParticipants === -1 ? 'Unlimited' : tier.maxParticipants }} Participants
              </div>
              <div class="text-body-2">
                {{ tier.maxEventsPerMonth === -1 ? 'Unlimited' : tier.maxEventsPerMonth }} events/month
              </div>
            </div>

            <p class="text-body-2 text-medium-emphasis">{{ tier.description }}</p>
          </v-card-text>

          <!-- Feature List -->
          <v-card-text class="pt-2">
            <v-list density="compact" class="bg-transparent">
              <v-list-item
                v-for="feature in tier.displayFeatures"
                :key="feature.name"
                class="px-0 py-1"
              >
                <template #prepend>
                  <v-icon
                    :color="feature.included ? 'success' : 'grey'"
                    size="small"
                  >
                    {{ feature.included ? 'mdi-check-circle' : 'mdi-minus-circle' }}
                  </v-icon>
                </template>
                <v-list-item-title
                  class="text-body-2"
                  :class="{ 'text-medium-emphasis': !feature.included }"
                >
                  {{ feature.name }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>

          <!-- Action Button -->
          <v-card-actions class="pt-0 px-6 pb-6">
            <v-btn
              v-if="currentTier === tier.key"
              color="success"
              variant="outlined"
              block
              disabled
            >
              <v-icon start>mdi-check</v-icon>
              Current Plan
            </v-btn>

            <v-btn
              v-else-if="tier.key === 'FREE'"
              color="grey"
              variant="outlined"
              block
              @click="selectTier(tier)"
            >
              Downgrade
            </v-btn>

            <v-btn
              v-else
              :color="tier.popular ? 'success' : 'primary'"
              :variant="tier.popular ? 'elevated' : 'outlined'"
              block
              @click="selectTier(tier)"
              :loading="selectedTier === tier.key && upgrading"
            >
              {{ isUpgrade(tier.key) ? 'Upgrade' : 'Select Plan' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Feature Comparison Table (Desktop) -->
    <div class="mt-8 d-none d-md-block">
      <v-divider class="mb-6"></v-divider>
      <h3 class="text-h5 font-weight-bold mb-4 text-center">Feature Comparison</h3>

      <v-table>
        <thead>
          <tr>
            <th class="text-left font-weight-bold">Features</th>
            <th
              v-for="tier in tiers"
              :key="tier.key"
              class="text-center font-weight-bold"
            >
              {{ tier.name }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="feature in allFeatures" :key="feature">
            <td class="font-weight-medium">{{ formatFeatureName(feature) }}</td>
            <td
              v-for="tier in tiers"
              :key="tier.key"
              class="text-center"
            >
              <v-icon
                :color="tier.features.includes(feature) || tier.features.includes('all_features') ? 'success' : 'grey'"
                size="small"
              >
                {{ tier.features.includes(feature) || tier.features.includes('all_features') ? 'mdi-check' : 'mdi-close' }}
              </v-icon>
            </td>
          </tr>
        </tbody>
      </v-table>
    </div>

    <!-- Enterprise Contact -->
    <v-card class="mt-8" variant="tonal" color="blue">
      <v-card-text class="text-center">
        <div class="text-h6 font-weight-bold mb-2">Need Something Custom?</div>
        <p class="text-body-2 mb-4">
          For enterprise solutions, custom integrations, or events with 1000+ participants,
          contact us for a tailored solution.
        </p>
        <v-btn color="blue" variant="elevated" @click="contactSales">
          Contact Sales
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { SUBSCRIPTION_LIMITS } from '~/lib/subscription'

interface TierInfo {
  key: string
  name: string
  maxParticipants: number
  maxEventsPerMonth: number
  features: readonly string[]
  price: number
  description: string
  popular?: boolean
  displayFeatures: Array<{ name: string; included: boolean }>
}

interface Props {
  currentTier?: string
  showPricing?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentTier: 'FREE',
  showPricing: true
})

const emit = defineEmits<{
  'select': [tier: string, billingCycle: string]
  'contact': []
}>()

const billingCycle = ref<'monthly' | 'yearly'>('monthly')
const selectedTier = ref<string | null>(null)
const upgrading = ref(false)

// Convert subscription limits to display format
const tiers = computed<TierInfo[]>(() => {
  const allFeaturesList = [
    'basic_voting',
    'room_management',
    'qr_codes',
    'basic_analytics',
    'analytics',
    'custom_branding',
    'export_data',
    'email_templates',
    'advanced_analytics',
    'multi_organizer',
    'attendee_management',
    'feedback_collection',
    'priority_support',
    'custom_domains',
    'white_label',
    'api_access'
  ]

  return Object.entries(SUBSCRIPTION_LIMITS).map(([key, limits]) => {
    const displayFeatures = allFeaturesList.map(feature => ({
      name: formatFeatureName(feature),
      included: limits.features.includes(feature) || limits.features.includes('all_features') ||
               (key === 'UNLIMITED' && feature !== 'basic_analytics') // UNLIMITED has all features
    }))

    return {
      key,
      name: key.charAt(0) + key.slice(1).toLowerCase(),
      maxParticipants: limits.maxParticipants,
      maxEventsPerMonth: limits.maxEventsPerMonth,
      features: limits.features,
      price: limits.price,
      description: limits.description,
      popular: key === 'COMMUNITY',
      displayFeatures: displayFeatures.filter(f => f.included || ['basic_voting', 'analytics', 'advanced_analytics', 'priority_support'].includes(feature))
    }
  })
})

const allFeatures = computed(() => {
  const features = new Set<string>()
  tiers.value.forEach(tier => {
    tier.features.forEach(feature => {
      if (feature !== 'all_features' && feature !== 'all_community_features') {
        features.add(feature)
      }
    })
  })
  return Array.from(features).sort()
})

const getPrice = (tier: TierInfo) => {
  if (tier.key === 'FREE') return 0
  return billingCycle.value === 'yearly' ? Math.round(tier.price * 12 * 0.8) : tier.price
}

const isUpgrade = (tierKey: string) => {
  const tierOrder = ['FREE', 'COMMUNITY', 'ORGANIZER', 'UNLIMITED']
  const currentIndex = tierOrder.indexOf(props.currentTier)
  const targetIndex = tierOrder.indexOf(tierKey)
  return targetIndex > currentIndex
}

const formatFeatureName = (feature: string) => {
  const featureMap: Record<string, string> = {
    'basic_voting': 'Basic Voting System',
    'room_management': 'Room Management',
    'qr_codes': 'QR Code Generation',
    'basic_analytics': 'Basic Analytics',
    'analytics': 'Analytics Dashboard',
    'custom_branding': 'Custom Branding',
    'export_data': 'Data Export',
    'email_templates': 'Email Templates',
    'advanced_analytics': 'Advanced Analytics',
    'multi_organizer': 'Multiple Organizers',
    'attendee_management': 'Attendee Management',
    'feedback_collection': 'Feedback Collection',
    'priority_support': 'Priority Support',
    'custom_domains': 'Custom Domains',
    'white_label': 'White Label',
    'api_access': 'API Access'
  }

  return featureMap[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const selectTier = async (tier: TierInfo) => {
  selectedTier.value = tier.key
  upgrading.value = true

  try {
    emit('select', tier.key, billingCycle.value)
  } finally {
    upgrading.value = false
    selectedTier.value = null
  }
}

const contactSales = () => {
  emit('contact')
}
</script>

<style scoped>
.tier-card {
  position: relative;
  transition: all 0.2s ease;
}

.tier-card:hover {
  transform: translateY(-4px);
}

.tier-popular {
  border: 2px solid rgb(var(--v-theme-primary));
}

.tier-current {
  border: 2px solid rgb(var(--v-theme-success));
}

.popular-badge,
.current-badge {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.price-section {
  margin: 1rem 0;
}

.subscription-tiers {
  max-width: 1200px;
  margin: 0 auto;
}

.v-table {
  border-radius: 8px;
  overflow: hidden;
}

.v-table th {
  background-color: rgb(var(--v-theme-surface-variant));
  font-weight: 600;
}

.v-table tbody tr:nth-child(even) {
  background-color: rgba(var(--v-theme-surface-variant), 0.1);
}

@media (max-width: 600px) {
  .tier-card {
    margin-bottom: 1rem;
  }

  .text-h3 {
    font-size: 2rem !important;
  }
}

/* Animation for tier selection */
.tier-card.selecting {
  animation: pulse 0.5s ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(1) translateY(-4px); }
  50% { transform: scale(1.02) translateY(-6px); }
  100% { transform: scale(1) translateY(-4px); }
}
</style>
<template>
  <v-dialog v-model="showDialog" max-width="600" persistent>
    <v-card>
      <v-card-title class="text-h5 d-flex align-center">
        <v-icon class="mr-2" :color="urgentUpgrade ? 'error' : 'warning'">
          {{ urgentUpgrade ? 'mdi-alert-circle' : 'mdi-arrow-up-bold' }}
        </v-icon>
        {{ urgentUpgrade ? 'Participant Limit Reached!' : 'Approaching Participant Limit' }}
      </v-card-title>

      <v-card-text>
        <v-alert
          :type="urgentUpgrade ? 'error' : 'warning'"
          variant="tonal"
          class="mb-4"
        >
          <div class="text-body-1 mb-2">
            <strong>Current Status:</strong> {{ currentParticipants }}/{{ participantLimit }} participants
          </div>
          <div class="text-body-2">
            {{ urgentUpgrade
              ? 'No new participants can join until you upgrade your subscription.'
              : 'You\'re approaching your participant limit. Consider upgrading to avoid disruption.'
            }}
          </div>
        </v-alert>

        <div class="mb-4">
          <div class="text-h6 mb-3">{{ isOwner ? 'Choose Your Plan' : 'Contact Event Organizer' }}</div>

          <div v-if="!isOwner" class="text-body-2 mb-4">
            This event has reached its participant limit. Please contact the event organizer to request an upgrade.

            <v-card class="mt-3 pa-3" color="blue-lighten-5">
              <div class="text-body-2">
                <strong>For Event Organizer:</strong><br>
                Upgrade your subscription to allow more participants and unlock premium features.
              </div>
            </v-card>
          </div>

          <div v-else>
            <!-- Subscription Options -->
            <v-row>
              <v-col
                v-for="option in upgradeOptions"
                :key="option.tier"
                cols="12"
                sm="6"
              >
                <v-card
                  :color="option.recommended ? 'primary' : undefined"
                  :variant="option.recommended ? 'elevated' : 'outlined'"
                  class="subscription-option"
                  @click="selectOption(option)"
                  :class="{ 'subscription-selected': selectedOption?.tier === option.tier }"
                >
                  <v-card-text class="text-center">
                    <div class="mb-2">
                      <v-chip
                        v-if="option.recommended"
                        color="primary"
                        size="small"
                        class="mb-2"
                      >
                        Recommended
                      </v-chip>
                      <div class="text-h6 font-weight-bold">{{ option.tier }}</div>
                      <div class="text-h5 font-weight-bold text-primary">
                        ${{ option.price }}/month
                      </div>
                    </div>

                    <div class="text-body-2 mb-3">
                      <strong>{{ option.maxParticipants === 'Unlimited' ? 'Unlimited' : option.maxParticipants }} participants</strong>
                    </div>

                    <div class="features-list text-left">
                      <div
                        v-for="feature in option.displayFeatures"
                        :key="feature"
                        class="text-caption mb-1"
                      >
                        <v-icon size="small" color="success" class="mr-1">mdi-check</v-icon>
                        {{ formatFeature(feature) }}
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Pay Per Event Option -->
            <v-divider class="my-4"></v-divider>
            <div class="text-body-2 mb-3">
              <strong>One-time Event Option:</strong> Pay only for this event if you don't need a monthly subscription.
            </div>

            <v-row>
              <v-col
                v-for="eventOption in payPerEventOptions"
                :key="eventOption.eventSize"
                cols="12"
                sm="4"
              >
                <v-card
                  variant="outlined"
                  class="event-option"
                  @click="selectEventOption(eventOption)"
                  :class="{ 'subscription-selected': selectedEventOption?.eventSize === eventOption.eventSize }"
                >
                  <v-card-text class="text-center">
                    <div class="text-body-1 font-weight-bold">${{ eventOption.price }}</div>
                    <div class="text-caption">{{ eventOption.maxParticipants }} participants</div>
                    <div class="text-caption">One-time payment</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="px-6 pb-4">
        <v-spacer></v-spacer>

        <v-btn
          v-if="!urgentUpgrade"
          variant="outlined"
          @click="dismissDialog"
        >
          {{ isOwner ? 'Maybe Later' : 'Close' }}
        </v-btn>

        <v-btn
          v-if="isOwner"
          :disabled="!selectedOption && !selectedEventOption"
          color="primary"
          variant="elevated"
          @click="proceedWithUpgrade"
          :loading="upgrading"
        >
          {{ selectedEventOption ? 'Pay for Event' : 'Upgrade Subscription' }}
        </v-btn>

        <v-btn
          v-if="!isOwner"
          color="primary"
          variant="elevated"
          @click="contactOrganizer"
        >
          Contact Organizer
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface UpgradeOption {
  tier: string
  maxParticipants: number | string
  price: number
  features: string[]
  displayFeatures?: string[]
  recommended?: boolean
}

interface PayPerEventOption {
  eventSize: string
  maxParticipants: number
  price: number
  description: string
}

interface Props {
  modelValue: boolean
  currentParticipants: number
  participantLimit: number
  currentTier?: string
  isOwner?: boolean
  upgradeOptions?: UpgradeOption[]
  payPerEventOptions?: PayPerEventOption[]
  eventId?: string
}

const props = withDefaults(defineProps<Props>(), {
  isOwner: false,
  currentTier: 'FREE',
  upgradeOptions: () => [
    {
      tier: 'COMMUNITY',
      maxParticipants: 150,
      price: 19,
      features: ['basic_voting', 'room_management', 'qr_codes', 'analytics', 'custom_branding', 'export_data'],
      displayFeatures: ['150 participants', 'Custom branding', 'Analytics dashboard', 'Data export'],
      recommended: true
    },
    {
      tier: 'ORGANIZER',
      maxParticipants: 300,
      price: 49,
      features: ['all_community_features', 'advanced_analytics', 'multi_organizer', 'attendee_management'],
      displayFeatures: ['300 participants', 'Advanced analytics', 'Multi-organizer support', 'Attendee management']
    }
  ],
  payPerEventOptions: () => [
    { eventSize: 'SMALL', maxParticipants: 100, price: 29, description: 'Up to 100 participants' },
    { eventSize: 'MEDIUM', maxParticipants: 250, price: 49, description: 'Up to 250 participants' },
    { eventSize: 'LARGE', maxParticipants: 500, price: 79, description: 'Up to 500 participants' }
  ]
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'upgrade': [option: UpgradeOption | PayPerEventOption, type: 'subscription' | 'event']
  'contact': [eventId: string]
  'dismiss': []
}>()

const showDialog = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const urgentUpgrade = computed(() => {
  return props.currentParticipants >= props.participantLimit
})

const selectedOption = ref<UpgradeOption | null>(null)
const selectedEventOption = ref<PayPerEventOption | null>(null)
const upgrading = ref(false)

const selectOption = (option: UpgradeOption) => {
  selectedOption.value = option
  selectedEventOption.value = null
}

const selectEventOption = (option: PayPerEventOption) => {
  selectedEventOption.value = option
  selectedOption.value = null
}

const formatFeature = (feature: string) => {
  const featureMap: Record<string, string> = {
    'basic_voting': 'Basic voting system',
    'room_management': 'Room management',
    'qr_codes': 'QR code generation',
    'analytics': 'Analytics dashboard',
    'custom_branding': 'Custom branding',
    'export_data': 'Data export',
    'advanced_analytics': 'Advanced analytics',
    'multi_organizer': 'Multiple organizers',
    'attendee_management': 'Attendee management'
  }

  return featureMap[feature] || feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

const proceedWithUpgrade = async () => {
  upgrading.value = true

  try {
    if (selectedOption.value) {
      emit('upgrade', selectedOption.value, 'subscription')
    } else if (selectedEventOption.value) {
      emit('upgrade', selectedEventOption.value, 'event')
    }
  } finally {
    upgrading.value = false
  }
}

const contactOrganizer = () => {
  if (props.eventId) {
    emit('contact', props.eventId)
  }
}

const dismissDialog = () => {
  emit('dismiss')
  showDialog.value = false
}

// Reset selections when dialog closes
watch(showDialog, (isOpen) => {
  if (!isOpen) {
    selectedOption.value = null
    selectedEventOption.value = null
  }
})
</script>

<style scoped>
.subscription-option {
  cursor: pointer;
  transition: all 0.2s ease;
  height: 100%;
}

.subscription-option:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.subscription-selected {
  border: 2px solid rgb(var(--v-theme-primary));
  transform: scale(1.02);
}

.event-option {
  cursor: pointer;
  transition: all 0.2s ease;
}

.event-option:hover {
  transform: translateY(-1px);
}

.features-list {
  min-height: 120px;
}

@media (max-width: 600px) {
  .features-list {
    min-height: auto;
  }

  .subscription-option {
    margin-bottom: 1rem;
  }
}
</style>
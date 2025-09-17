<script setup lang="ts">
import { ref, computed, watch } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: 'auth'
})

const router = useRouter()

// Form state
const loading = ref(false)
const checkingPayment = ref(false)
const showPaymentOptions = ref(false)

// Event form
const eventForm = ref({
  title: '',
  description: '',
  expectedParticipants: 25,
  allowGuestAccess: true,
  requireApproval: false,
  startsAt: '',
  endsAt: ''
})

// Payment state
const paymentCheck = ref<any>(null)
const selectedPaymentOption = ref<any>(null)

// Error handling
const error = ref('')
const success = ref('')

// Computed properties
const isValidForm = computed(() => {
  return eventForm.value.title.trim().length >= 3 &&
         eventForm.value.expectedParticipants >= 1 &&
         eventForm.value.expectedParticipants <= 1000
})

// Watch for changes in expected participants to check payment requirements
watch(() => eventForm.value.expectedParticipants, async (newValue) => {
  if (newValue >= 1 && newValue <= 1000) {
    await checkPaymentRequirements()
  }
}, { debounce: 500 })

async function checkPaymentRequirements() {
  if (!isValidForm.value) return
  
  checkingPayment.value = true
  error.value = ''
  
  try {
    const response = await $fetch('/api/events/payment-check', {
      method: 'POST',
      body: {
        expectedParticipants: eventForm.value.expectedParticipants
      }
    })
    
    paymentCheck.value = response
    showPaymentOptions.value = response.paymentRequired
    
    if (!response.paymentRequired) {
      selectedPaymentOption.value = null
    }
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to check payment requirements'
  } finally {
    checkingPayment.value = false
  }
}

async function handleCreateEvent() {
  if (!isValidForm.value) {
    error.value = 'Please fill in all required fields correctly'
    return
  }

  loading.value = true
  error.value = ''
  
  try {
    // If payment is required and no option selected
    if (paymentCheck.value?.paymentRequired && !selectedPaymentOption.value) {
      error.value = 'Please select a payment option to create this event'
      loading.value = false
      return
    }

    // Create the event first
    const createResponse = await $fetch('/api/events', {
      method: 'POST',
      body: {
        title: eventForm.value.title,
        description: eventForm.value.description,
        maxParticipants: eventForm.value.expectedParticipants,
        allowGuestAccess: eventForm.value.allowGuestAccess,
        requireApproval: eventForm.value.requireApproval,
        startsAt: eventForm.value.startsAt || null,
        endsAt: eventForm.value.endsAt || null
      }
    })

    // If payment is required, redirect to checkout
    if (paymentCheck.value?.paymentRequired && selectedPaymentOption.value) {
      if (selectedPaymentOption.value.type === 'pay_per_event') {
        await handleEventPayment(createResponse.event.id)
      } else if (selectedPaymentOption.value.type === 'subscription') {
        // Subscription checkout not implemented in lean MVP - redirect to settings
        error.value = 'Subscription upgrades are handled in account settings. Please upgrade your account first.'
        await router.push('/settings/subscription')
      }
    } else {
      // No payment required, redirect to event
      success.value = 'Event created successfully!'
      await router.push(`/events/${createResponse.event.id}`)
    }
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to create event'
  } finally {
    loading.value = false
  }
}

async function handleEventPayment(eventId: string) {
  try {
    const checkoutResponse = await $fetch('/api/stripe/event-checkout', {
      method: 'POST',
      body: {
        eventId: eventId,
        eventTier: selectedPaymentOption.value.eventTier || selectedPaymentOption.value.eventSize, // Support both new and old naming
        successUrl: `${window.location.origin}/events/${eventId}?payment=success`,
        cancelUrl: `${window.location.origin}/events/create?payment=cancelled`
      }
    })

    // Redirect to Stripe checkout
    window.location.href = checkoutResponse.checkoutUrl
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to process payment'
  }
}

// Subscription checkout removed in lean MVP
// Users should upgrade via account settings instead

function selectPaymentOption(option: any) {
  selectedPaymentOption.value = option
}

// Initialize payment check on mount
onMounted(async () => {
  await checkPaymentRequirements()
})

useSeoMeta({
  title: 'Create Event - Unconference',
  description: 'Create a new unconference event and start building your community discussions.',
})
</script>

<template>
  <div class="create-event-page">
    <v-container class="py-8">
      <v-row justify="center">
        <v-col cols="12" md="8" lg="6">
          <!-- Header -->
          <div class="text-center mb-8">
            <h1 class="text-h3 font-weight-bold text-primary mb-3">
              Create Your Event
            </h1>
            <p class="text-h6 text-medium-emphasis">
              Set up a new unconference event for your community
            </p>
          </div>

          <v-card elevation="8" class="create-event-card">
            <v-card-text class="pa-8">
              <!-- Alert Messages -->
              <v-alert
                v-if="error"
                type="error"
                variant="tonal"
                class="mb-6"
                closable
                @click:close="error = ''"
              >
                {{ error }}
              </v-alert>

              <v-alert
                v-if="success"
                type="success"
                variant="tonal"
                class="mb-6"
                closable
                @click:close="success = ''"
              >
                {{ success }}
              </v-alert>

              <!-- Event Details Form -->
              <v-form @submit.prevent="handleCreateEvent">
                <div class="mb-6">
                  <h3 class="text-h5 mb-4">Event Details</h3>
                  
                  <v-text-field
                    v-model="eventForm.title"
                    label="Event Title *"
                    prepend-inner-icon="mdi-calendar-text"
                    variant="outlined"
                    class="mb-4"
                    :rules="[v => !!v || 'Title is required', v => v.length >= 3 || 'Title must be at least 3 characters']"
                    placeholder="e.g., Monthly Product Meetup"
                    required
                  />

                  <v-textarea
                    v-model="eventForm.description"
                    label="Description (Optional)"
                    prepend-inner-icon="mdi-text"
                    variant="outlined"
                    class="mb-4"
                    rows="3"
                    placeholder="Brief description of your event..."
                  />

                  <v-row>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="eventForm.startsAt"
                        label="Start Date & Time"
                        prepend-inner-icon="mdi-calendar-start"
                        variant="outlined"
                        type="datetime-local"
                        class="mb-4"
                      />
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="eventForm.endsAt"
                        label="End Date & Time"
                        prepend-inner-icon="mdi-calendar-end"
                        variant="outlined"
                        type="datetime-local"
                        class="mb-4"
                      />
                    </v-col>
                  </v-row>
                </div>

                <!-- Participant Settings -->
                <div class="mb-6">
                  <h3 class="text-h5 mb-4">Participant Settings</h3>
                  
                  <v-slider
                    v-model="eventForm.expectedParticipants"
                    label="Expected Participants"
                    prepend-icon="mdi-account-group"
                    class="mb-4"
                    min="1"
                    max="500"
                    step="5"
                    show-ticks="always"
                    tick-size="4"
                    :disabled="checkingPayment"
                  >
                    <template #append>
                      <v-text-field
                        v-model="eventForm.expectedParticipants"
                        type="number"
                        style="width: 80px"
                        density="compact"
                        variant="outlined"
                        :disabled="checkingPayment"
                        min="1"
                        max="1000"
                      />
                    </template>
                  </v-slider>

                  <v-switch
                    v-model="eventForm.allowGuestAccess"
                    label="Allow guest access (no account required)"
                    color="primary"
                    class="mb-3"
                  />

                  <v-switch
                    v-model="eventForm.requireApproval"
                    label="Require approval for new participants"
                    color="primary"
                    class="mb-4"
                  />
                </div>

                <!-- Payment Requirements -->
                <div v-if="checkingPayment" class="mb-6">
                  <v-progress-linear indeterminate color="primary" class="mb-3" />
                  <p class="text-center text-medium-emphasis">Checking payment requirements...</p>
                </div>

                <div v-else-if="paymentCheck && !paymentCheck.paymentRequired" class="mb-6">
                  <v-alert type="success" variant="tonal" prepend-icon="mdi-check-circle">
                    <div class="text-h6 mb-2">No Payment Required</div>
                    <p>This event fits within your current plan limits. You can create it immediately!</p>
                  </v-alert>
                </div>

                <div v-else-if="showPaymentOptions && paymentCheck?.suggestedOptions" class="mb-6">
                  <v-alert type="info" variant="tonal" prepend-icon="mdi-information">
                    <div class="text-h6 mb-2">Payment Required</div>
                    <p class="mb-0">{{ paymentCheck.reason }}</p>
                  </v-alert>

                  <div class="mt-4">
                    <h4 class="text-h6 mb-3">Choose a Payment Option:</h4>
                    
                    <v-radio-group v-model="selectedPaymentOption">
                      <template v-for="option in paymentCheck.suggestedOptions" :key="`${option.type}-${option.tier || option.eventSize}`">
                        <v-radio :value="option">
                          <template #label>
                            <v-card 
                              variant="outlined" 
                              class="w-100 pa-4 ml-3"
                              :color="selectedPaymentOption === option ? 'primary' : 'default'"
                              :class="{ 'border-primary': selectedPaymentOption === option }"
                            >
                              <div class="d-flex justify-space-between align-center">
                                <div>
                                  <div class="text-h6">
                                    <v-chip 
                                      v-if="option.type === 'pay_per_event'" 
                                      color="orange" 
                                      size="small" 
                                      class="mr-2"
                                    >
                                      One-time
                                    </v-chip>
                                    <v-chip 
                                      v-else 
                                      color="blue" 
                                      size="small" 
                                      class="mr-2"
                                    >
                                      Monthly
                                    </v-chip>
                                    ${{ option.price }}{{ option.type === 'subscription' ? '/month' : '' }}
                                  </div>
                                  <p class="text-body-2 text-medium-emphasis mb-0 mt-1">
                                    {{ option.description }}
                                  </p>
                                </div>
                                <v-icon 
                                  v-if="selectedPaymentOption === option" 
                                  color="primary" 
                                  size="large"
                                >
                                  mdi-check-circle
                                </v-icon>
                              </div>
                            </v-card>
                          </template>
                        </v-radio>
                      </template>
                    </v-radio-group>
                  </div>
                </div>

                <!-- Action Buttons -->
                <div class="text-center">
                  <v-btn
                    color="grey"
                    variant="outlined"
                    class="mr-4"
                    @click="router.back()"
                  >
                    Cancel
                  </v-btn>
                  
                  <v-btn
                    type="submit"
                    color="primary"
                    size="large"
                    :loading="loading"
                    :disabled="!isValidForm || (paymentCheck?.paymentRequired && !selectedPaymentOption)"
                  >
                    <template v-if="paymentCheck?.paymentRequired && selectedPaymentOption">
                      {{ selectedPaymentOption.type === 'pay_per_event' ? 'Pay & Create Event' : 'Upgrade & Create Event' }}
                    </template>
                    <template v-else>
                      Create Event
                    </template>
                  </v-btn>
                </div>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.create-event-page {
  background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%);
  min-height: 100vh;
}

.create-event-card {
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.create-event-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%);
  border-radius: 16px 16px 0 0;
}

.v-radio-group {
  gap: 12px;
}

.v-radio :deep(.v-selection-control__wrapper) {
  margin-right: 0;
}

.border-primary {
  border-color: rgb(var(--v-theme-primary)) !important;
  border-width: 2px !important;
}
</style>
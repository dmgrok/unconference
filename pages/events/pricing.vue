<template>
  <div class="pricing-page">
    <v-container class="py-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-h4 font-weight-bold mb-2">Event Pricing</h1>
        <p class="text-body-1 text-medium-emphasis">
          Choose the right tier for your unconference event
        </p>
      </div>

      <!-- Event Info Card -->
      <v-row justify="center" class="mb-8">
        <v-col cols="12" md="8">
          <v-card elevation="2" class="mb-6">
            <v-card-text class="d-flex align-center">
              <v-icon size="32" color="primary" class="mr-4">mdi-calendar-account</v-icon>
              <div>
                <h3 class="text-h6 mb-1">{{ eventData?.title || 'Your Event' }}</h3>
                <p class="text-body-2 text-medium-emphasis mb-0">
                  Expected participants: {{ expectedParticipants }} people
                </p>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Pricing Selector -->
      <v-row justify="center">
        <v-col cols="12" md="10" lg="12" xl="10">
          <EventPricingSelector
            v-if="eventId"
            :event-id="eventId"
            v-model="selectedTier"
            @proceed-to-payment="handleProceedToPayment"
            @proceed-free="handleProceedFree"
          />

          <!-- Loading State -->
          <div v-else class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="64" />
            <p class="text-body-1 mt-4">Loading event details...</p>
          </div>
        </v-col>
      </v-row>

      <!-- Footer Note -->
      <div class="text-center mt-8">
        <v-card variant="outlined" class="mx-auto" max-width="600">
          <v-card-text class="text-center py-6">
            <v-icon size="48" color="primary" class="mb-3">mdi-shield-check</v-icon>
            <h3 class="text-h6 mb-2">Secure Payment</h3>
            <p class="text-body-2 text-medium-emphasis mb-0">
              All payments are processed securely through Stripe.
              Your event will be activated immediately after payment.
            </p>
          </v-card-text>
        </v-card>
      </div>
    </v-container>
  </div>
</template>

<script setup lang="ts">
// Page meta
definePageMeta({
  middleware: ['auth'],
  name: 'event-pricing'
})

// Route params
const route = useRoute()
const router = useRouter()

// Data
const eventId = computed(() => route.query.eventId as string)
const selectedTier = ref<'FREE' | 'PROFESSIONAL' | 'ENTERPRISE'>('PROFESSIONAL')
const eventData = ref<any>(null)
const expectedParticipants = ref(25)
const loading = ref(false)

// Load event data
const { data: event } = await $fetch(`/api/events/${eventId.value}`, {
  server: false
}).catch(() => ({ data: null }))

if (event) {
  eventData.value = event
  // Estimate participants from event data if available
  if (event.expectedParticipants) {
    expectedParticipants.value = event.expectedParticipants
  }
}

// Handle payment flow
async function handleProceedToPayment(tier: 'PROFESSIONAL' | 'ENTERPRISE') {
  if (!eventId.value) {
    console.error('No event ID available')
    return
  }

  loading.value = true

  try {
    // Create Stripe checkout session
    const response = await $fetch('/api/stripe/event-checkout', {
      method: 'POST',
      body: {
        eventId: eventId.value,
        eventTier: tier,
        successUrl: `${window.location.origin}/events/${eventId.value}?payment=success`,
        cancelUrl: `${window.location.origin}/events/pricing?eventId=${eventId.value}&payment=cancelled`
      }
    })

    if (response.checkoutUrl) {
      // Redirect to Stripe checkout
      window.location.href = response.checkoutUrl
    }
  } catch (error: any) {
    console.error('Payment error:', error)

    // Show error to user
    const errorMessage = error.data?.statusMessage || 'Failed to create payment session'
    alert(`Payment Error: ${errorMessage}`)
  } finally {
    loading.value = false
  }
}

// Handle free tier selection
async function handleProceedFree() {
  if (!eventId.value) {
    console.error('No event ID available')
    return
  }

  try {
    // Update event to free tier
    await $fetch(`/api/events/${eventId.value}`, {
      method: 'PATCH',
      body: {
        paymentType: 'FREE',
        paymentStatus: 'PAID', // Free tier is immediately "paid"
        maxParticipants: 50
      }
    })

    // Redirect to event page
    await router.push(`/events/${eventId.value}`)
  } catch (error: any) {
    console.error('Free tier setup error:', error)
    alert('Failed to set up free event. Please try again.')
  }
}

// SEO
useSeoMeta({
  title: 'Event Pricing - Unconference',
  description: 'Choose the right pricing tier for your unconference event'
})

// Handle payment result messages
onMounted(() => {
  const paymentStatus = route.query.payment
  if (paymentStatus === 'success') {
    // Payment was successful - could show success message
    console.log('Payment completed successfully')
  } else if (paymentStatus === 'cancelled') {
    // Payment was cancelled - could show message
    console.log('Payment was cancelled')
  }
})
</script>

<style scoped>
.pricing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}
</style>
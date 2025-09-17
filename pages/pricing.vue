<template>
  <div class="pricing-landing-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <v-container class="py-16">
        <div class="text-center">
          <h1 class="text-h2 font-weight-bold text-white mb-4">
            Event Management at 90% Less Cost
          </h1>
          <p class="text-h5 text-blue-lighten-2 mb-8 mx-auto" style="max-width: 600px">
            While Sessionize charges €500 per event, we deliver professional unconference management starting at just $29
          </p>
          <v-btn
            color="white"
            size="x-large"
            variant="flat"
            class="text-primary"
            to="/events/create"
          >
            Start Your Event Today
            <v-icon end>mdi-arrow-right</v-icon>
          </v-btn>
        </div>
      </v-container>
    </section>

    <!-- Comparison Section -->
    <section class="comparison-section py-16">
      <v-container>
        <h2 class="text-h3 font-weight-bold text-center mb-12">
          See the Difference
        </h2>

        <v-row justify="center">
          <v-col cols="12" md="10" lg="8">
            <!-- Competitor Comparison -->
            <v-card elevation="3" class="mb-8">
              <v-card-title class="bg-red-lighten-4 text-center pa-6">
                <div>
                  <h3 class="text-h4 text-red-darken-2">Sessionize</h3>
                  <div class="text-h3 font-weight-bold text-red-darken-3 mt-2">€500</div>
                  <div class="text-subtitle-1 text-red-darken-1">Per Event</div>
                </div>
              </v-card-title>

              <v-card-text class="pa-6">
                <v-list density="compact">
                  <v-list-item prepend-icon="mdi-check" class="text-red-darken-2">
                    <v-list-item-title>Call for speakers management</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check" class="text-red-darken-2">
                    <v-list-item-title>Speaker communication</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check" class="text-red-darken-2">
                    <v-list-item-title>Agenda building</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-close" class="text-red-darken-1">
                    <v-list-item-title class="text-decoration-line-through">Participant-driven topics</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-close" class="text-red-darken-1">
                    <v-list-item-title class="text-decoration-line-through">Real-time voting</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-close" class="text-red-darken-1">
                    <v-list-item-title class="text-decoration-line-through">Open Space Technology</v-list-item-title>
                  </v-list-item>
                </v-list>

                <v-alert type="error" variant="tonal" class="mt-4">
                  <strong>€500 per event</strong> - Expensive for single events or small organizations
                </v-alert>
              </v-card-text>
            </v-card>

            <!-- Our Solution -->
            <v-card elevation="5" class="border-primary" style="border-width: 3px">
              <v-card-title class="bg-primary text-center pa-6">
                <div>
                  <h3 class="text-h4 text-white">Unconference Platform</h3>
                  <div class="text-h3 font-weight-bold text-white mt-2">$29 - $99</div>
                  <div class="text-subtitle-1 text-blue-lighten-2">Per Event</div>
                </div>
              </v-card-title>

              <v-card-text class="pa-6">
                <v-list density="compact">
                  <v-list-item prepend-icon="mdi-check-circle" class="text-primary">
                    <v-list-item-title class="font-weight-medium">Participant-driven topic creation</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check-circle" class="text-primary">
                    <v-list-item-title class="font-weight-medium">Real-time voting system</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check-circle" class="text-primary">
                    <v-list-item-title class="font-weight-medium">Open Space Technology methodology</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check-circle" class="text-primary">
                    <v-list-item-title class="font-weight-medium">Round management & timers</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check-circle" class="text-primary">
                    <v-list-item-title class="font-weight-medium">QR code access</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check-circle" class="text-primary">
                    <v-list-item-title class="font-weight-medium">Simple networking</v-list-item-title>
                  </v-list-item>
                </v-list>

                <v-alert type="success" variant="tonal" class="mt-4">
                  <strong>94% cost savings</strong> - From €500 to $29-$99 per event
                </v-alert>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Pricing Tiers -->
    <section class="pricing-tiers py-16 bg-grey-lighten-5">
      <v-container>
        <h2 class="text-h3 font-weight-bold text-center mb-4">
          Choose Your Event Size
        </h2>
        <p class="text-h6 text-center text-medium-emphasis mb-12">
          Pay only for what you need, when you need it
        </p>

        <v-row>
          <!-- Free Tier -->
          <v-col cols="12" md="4">
            <v-card elevation="2" class="h-100 text-center">
              <v-card-title class="bg-grey-lighten-3 pa-6">
                <div>
                  <h3 class="text-h5">Free</h3>
                  <div class="text-h3 font-weight-bold text-primary mt-2">$0</div>
                  <div class="text-subtitle-2 text-medium-emphasis">Up to 50 participants</div>
                </div>
              </v-card-title>

              <v-card-text class="pa-6">
                <v-list density="compact" class="bg-transparent">
                  <v-list-item prepend-icon="mdi-check">
                    <v-list-item-title>Basic topic voting</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check">
                    <v-list-item-title>Round management</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check">
                    <v-list-item-title>QR code access</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check">
                    <v-list-item-title>Simple networking</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>

              <v-card-actions class="pa-6">
                <v-btn color="grey" variant="outlined" block to="/events/create">
                  Start Free Event
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <!-- Professional Tier -->
          <v-col cols="12" md="4">
            <v-card elevation="5" class="h-100 text-center border-primary position-relative" style="border-width: 2px">
              <v-chip color="primary" class="position-absolute" style="top: -12px; left: 50%; transform: translateX(-50%)">
                Most Popular
              </v-chip>

              <v-card-title class="bg-primary pa-6">
                <div>
                  <h3 class="text-h5 text-white">Professional</h3>
                  <div class="text-h3 font-weight-bold text-white mt-2">$29</div>
                  <div class="text-subtitle-2 text-blue-lighten-2">Up to 100 participants</div>
                </div>
              </v-card-title>

              <v-card-text class="pa-6">
                <v-list density="compact" class="bg-transparent">
                  <v-list-item prepend-icon="mdi-check" class="text-primary">
                    <v-list-item-title>Everything in Free</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check" class="text-primary">
                    <v-list-item-title>Advanced analytics</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check" class="text-primary">
                    <v-list-item-title>Data export</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check" class="text-primary">
                    <v-list-item-title>Email support</v-list-item-title>
                  </v-list-item>
                </v-list>

                <div class="mt-4 pa-3 bg-primary rounded">
                  <div class="text-white text-center">
                    <strong>94% savings</strong><br>
                    <small>vs. Sessionize €500</small>
                  </div>
                </div>
              </v-card-text>

              <v-card-actions class="pa-6">
                <v-btn color="primary" variant="flat" block to="/events/create">
                  Choose Professional
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>

          <!-- Enterprise Tier -->
          <v-col cols="12" md="4">
            <v-card elevation="2" class="h-100 text-center">
              <v-card-title class="bg-grey-lighten-2 pa-6">
                <div>
                  <h3 class="text-h5">Enterprise</h3>
                  <div class="text-h3 font-weight-bold text-primary mt-2">$99</div>
                  <div class="text-subtitle-2 text-medium-emphasis">Unlimited participants</div>
                </div>
              </v-card-title>

              <v-card-text class="pa-6">
                <v-list density="compact" class="bg-transparent">
                  <v-list-item prepend-icon="mdi-check">
                    <v-list-item-title>Everything in Professional</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check">
                    <v-list-item-title>Priority support</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check">
                    <v-list-item-title>Custom branding</v-list-item-title>
                  </v-list-item>
                  <v-list-item prepend-icon="mdi-check">
                    <v-list-item-title>Advanced integrations</v-list-item-title>
                  </v-list-item>
                </v-list>

                <div class="mt-4 pa-3 bg-orange rounded">
                  <div class="text-white text-center">
                    <strong>80% savings</strong><br>
                    <small>vs. Sessionize €500</small>
                  </div>
                </div>
              </v-card-text>

              <v-card-actions class="pa-6">
                <v-btn color="orange" variant="flat" block to="/events/create">
                  Choose Enterprise
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Value Proposition -->
    <section class="value-prop py-16">
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="6">
            <h2 class="text-h3 font-weight-bold mb-6">
              Why Event Organizers Choose Us
            </h2>

            <v-list class="bg-transparent">
              <v-list-item prepend-icon="mdi-cash-multiple" class="mb-4">
                <v-list-item-title class="text-h6 font-weight-medium">
                  Affordable Per-Event Pricing
                </v-list-item-title>
                <v-list-item-subtitle class="text-body-2">
                  No monthly subscriptions. Pay only when you host an event.
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item prepend-icon="mdi-account-group" class="mb-4">
                <v-list-item-title class="text-h6 font-weight-medium">
                  True Participant Engagement
                </v-list-item-title>
                <v-list-item-subtitle class="text-body-2">
                  Let participants create and vote on topics in real-time.
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item prepend-icon="mdi-lightning-bolt" class="mb-4">
                <v-list-item-title class="text-h6 font-weight-medium">
                  Quick Setup
                </v-list-item-title>
                <v-list-item-subtitle class="text-body-2">
                  Create an event in minutes. No complex configuration required.
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item prepend-icon="mdi-heart" class="mb-4">
                <v-list-item-title class="text-h6 font-weight-medium">
                  Built for Unconferences
                </v-list-item-title>
                <v-list-item-subtitle class="text-body-2">
                  Designed specifically for Open Space Technology and participant-driven events.
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-col>

          <v-col cols="12" md="6" class="text-center">
            <v-card elevation="3" class="pa-8">
              <v-icon size="80" color="primary" class="mb-4">mdi-calculator</v-icon>
              <h3 class="text-h4 font-weight-bold mb-4">Cost Comparison</h3>

              <div class="mb-6">
                <div class="text-h6 text-red-darken-2 mb-2">
                  <v-icon start color="red">mdi-close</v-icon>
                  Sessionize: €500 per event
                </div>
                <div class="text-h6 text-primary">
                  <v-icon start color="primary">mdi-check</v-icon>
                  Our Platform: $29-$99 per event
                </div>
              </div>

              <v-divider class="mb-4" />

              <div class="text-h5 font-weight-bold text-success">
                Save $400+ per event
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- CTA Section -->
    <section class="cta-section bg-primary py-16">
      <v-container>
        <div class="text-center">
          <h2 class="text-h3 font-weight-bold text-white mb-4">
            Ready to Save 90% on Your Next Event?
          </h2>
          <p class="text-h6 text-blue-lighten-2 mb-8">
            Start with our free tier or choose the plan that fits your event size
          </p>

          <div class="d-flex justify-center gap-4 flex-wrap">
            <v-btn
              color="white"
              size="x-large"
              variant="flat"
              class="text-primary"
              to="/events/create"
            >
              Create Free Event
            </v-btn>

            <v-btn
              color="transparent"
              size="x-large"
              variant="outlined"
              class="text-white border-white"
              href="mailto:hello@unconference.app"
            >
              Contact Sales
            </v-btn>
          </div>
        </div>
      </v-container>
    </section>
  </div>
</template>

<script setup lang="ts">
// SEO Meta
useSeoMeta({
  title: 'Pricing - 90% Less Than Sessionize | Unconference Platform',
  description: 'Professional event management starting at $29. Save $400+ per event compared to Sessionize. Perfect for unconferences and participant-driven events.',
  keywords: 'event management pricing, sessionize alternative, unconference platform, open space technology, affordable event software'
})

// Structured data for pricing
useJsonld({
  '@context': 'https://schema.org',
  '@type': 'Product',
  'name': 'Unconference Platform',
  'description': 'Participant-driven event management platform for unconferences',
  'offers': [
    {
      '@type': 'Offer',
      'name': 'Free Tier',
      'price': '0',
      'priceCurrency': 'USD',
      'description': 'Up to 50 participants'
    },
    {
      '@type': 'Offer',
      'name': 'Professional',
      'price': '29',
      'priceCurrency': 'USD',
      'description': 'Up to 100 participants'
    },
    {
      '@type': 'Offer',
      'name': 'Enterprise',
      'price': '99',
      'priceCurrency': 'USD',
      'description': 'Unlimited participants'
    }
  ]
})
</script>

<style scoped>
.pricing-landing-page {
  background: white;
}

.hero-section {
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 50%, #0d47a1 100%);
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
}

.comparison-section {
  background: white;
}

.value-prop {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.border-primary {
  border-color: rgb(var(--v-theme-primary)) !important;
}

.gap-4 {
  gap: 1rem;
}

@media (max-width: 960px) {
  .gap-4 {
    flex-direction: column;
    align-items: center;
  }
}
</style>
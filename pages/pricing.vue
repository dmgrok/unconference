<script setup lang="ts">
import { StripeService } from '~/lib/stripe'

definePageMeta({
  layout: 'public'
})

const { user } = useUserSession()
const loading = ref(false)
const selectedPlan = ref<string | null>(null)

// Get pricing plans from Stripe service
const pricingPlans = StripeService.getPricingPlans()

useSeoMeta({
  title: 'Pricing - Unconference',
  description: 'Affordable pricing for community event organizers. Start free, upgrade as you grow your events.',
})

async function upgradeToPlan(tier: string) {
  if (!user.value) {
    await navigateTo('/login?redirect=/pricing')
    return
  }

  if (tier === 'FREE') {
    return // Already free
  }

  try {
    loading.value = true
    selectedPlan.value = tier

    const response = await $fetch('/api/stripe/checkout', {
      method: 'POST',
      body: {
        tier,
        successUrl: `${window.location.origin}/pricing/success`,
        cancelUrl: `${window.location.origin}/pricing`
      }
    })

    // Redirect to Stripe checkout
    window.location.href = response.checkoutUrl
  } catch (error: any) {
    console.error('Upgrade error:', error)
    alert('Failed to start upgrade process. Please try again.')
  } finally {
    loading.value = false
    selectedPlan.value = null
  }
}

const features = {
  community: [
    '👥 Perfect for meetups and workshops',
    '🎯 Replaces Klaxoon, Miro for agenda planning',
    '📱 QR codes for instant participant access',
    '🏷️ Custom branding for your events',
    '📊 Basic analytics and export',
    '✉️ Email templates for participants'
  ],
  organizer: [
    '🏢 Great for conferences and series',
    '👥 Multiple organizer collaboration', 
    '📋 Advanced attendee management',
    '📈 Detailed analytics and insights',
    '💬 Feedback collection tools',
    '⚡ Priority email support'
  ],
  unlimited: [
    '🚀 Large conferences and companies',
    '🌐 Custom domains and white-label',
    '🔌 API access for integrations',
    '☎️ Priority phone support',
    '⚙️ Custom feature development',
    '🛡️ Enterprise security options'
  ]
}
</script>

<template>
  <div class="pricing-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <v-container class="py-16">
        <div class="text-center">
          <h1 class="hero-title mb-6">
            Simple Pricing for Event Organizers
          </h1>
          <p class="hero-subtitle mb-8">
            From community meetups to professional conferences. <br>
            Start free, upgrade only when you need more capacity.
          </p>
        </div>
      </v-container>
    </section>

    <!-- Pricing Cards -->
    <section class="pricing-section">
      <v-container class="py-16">
        <v-row justify="center">
          <v-col
            v-for="plan in pricingPlans"
            :key="plan.tier"
            cols="12"
            md="6"
            lg="3"
          >
            <v-card
              :class="{ 'highlighted-plan': plan.highlighted }"
              class="pricing-card h-100"
              :elevation="plan.highlighted ? 8 : 2"
            >
              <!-- Popular Badge -->
              <div v-if="plan.highlighted" class="popular-badge">
                <v-chip color="primary" size="small">
                  Most Popular
                </v-chip>
              </div>

              <v-card-title class="text-center pt-6">
                <div class="plan-header">
                  <h3 class="plan-name">{{ plan.name }}</h3>
                  <div class="plan-price">
                    <span v-if="plan.price === 0" class="price-large">Free</span>
                    <template v-else>
                      <span class="currency">$</span>
                      <span class="price-large">{{ plan.price }}</span>
                      <span class="period">/month</span>
                    </template>
                  </div>
                  <p class="plan-description">{{ plan.description }}</p>
                </div>
              </v-card-title>

              <v-card-text class="plan-features">
                <!-- Key Limits -->
                <div class="limits-section mb-4">
                  <div class="limit-item">
                    <v-icon color="primary" class="mr-2">mdi-account-group</v-icon>
                    <strong>
                      {{ plan.tier === 'FREE' ? '50' : plan.tier === 'COMMUNITY' ? '150' : plan.tier === 'ORGANIZER' ? '300' : 'Unlimited' }} 
                      participants
                    </strong>
                  </div>
                  <div class="limit-item">
                    <v-icon color="primary" class="mr-2">mdi-calendar</v-icon>
                    <strong>
                      {{ plan.tier === 'FREE' ? '5' : plan.tier === 'COMMUNITY' ? '15' : plan.tier === 'ORGANIZER' ? '30' : 'Unlimited' }} 
                      events/month
                    </strong>
                  </div>
                </div>

                <!-- Feature List -->
                <v-divider class="mb-4"></v-divider>
                <ul class="feature-list">
                  <li v-for="feature in plan.features" :key="feature" class="feature-item">
                    <v-icon color="success" size="small" class="mr-2">mdi-check</v-icon>
                    {{ feature }}
                  </li>
                </ul>

                <!-- Community-focused features -->
                <div v-if="plan.tier === 'COMMUNITY'" class="community-highlight mt-4">
                  <v-alert type="info" variant="tonal" density="compact">
                    <div class="d-flex align-center">
                      <v-icon class="mr-2">mdi-heart</v-icon>
                      <span class="text-caption">
                        Perfect replacement for Klaxoon, Excel, or paper-based agenda planning
                      </span>
                    </div>
                  </v-alert>
                </div>
              </v-card-text>

              <v-card-actions class="px-6 pb-6">
                <v-btn
                  :color="plan.highlighted ? 'primary' : 'outline'"
                  :variant="plan.highlighted ? 'elevated' : 'outlined'"
                  :loading="loading && selectedPlan === plan.tier"
                  :disabled="loading"
                  size="large"
                  block
                  @click="upgradeToPlan(plan.tier)"
                >
                  <span v-if="plan.price === 0">Get Started Free</span>
                  <span v-else>Upgrade to {{ plan.name }}</span>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- FAQ Section -->
    <section class="faq-section bg-grey-lighten-5">
      <v-container class="py-16">
        <div class="text-center mb-12">
          <h2 class="section-title">Frequently Asked Questions</h2>
          <p class="section-subtitle">
            Common questions from community organizers
          </p>
        </div>

        <v-row>
          <v-col cols="12" md="8" class="mx-auto">
            <v-expansion-panels variant="accordion">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  How is this better than using Klaxoon or Excel?
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  Unlike static tools, our platform provides real-time voting, automatic group formation based on preferences, 
                  and seamless participant interaction. No more manual counting or complex spreadsheet formulas - 
                  everything happens automatically as participants vote and join.
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>
                  What happens if I exceed my participant limit?
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  We'll send you a notification when you're approaching your limit. You can easily upgrade before your event, 
                  or we offer one-time overages for special occasions. No events will be shut down mid-session.
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>
                  Can I try premium features before upgrading?
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  Yes! All new accounts get a 14-day trial of Community features. You can also request a demo 
                  for larger events to see all features in action.
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>
                  Is there a discount for non-profits?
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  Absolutely! We offer 50% discounts for registered non-profits, educational institutions, 
                  and community organizations. Contact us with your organization details.
                </v-expansion-panel-text>
              </v-expansion-panel>

              <v-expansion-panel>
                <v-expansion-panel-title>
                  What if my events are irregular (not monthly)?
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  You can upgrade and downgrade anytime. Many organizers upgrade just for their conference season 
                  and downgrade afterwards. No long-term contracts required.
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-col>
        </v-row>

        <div class="text-center mt-12">
          <p class="text-body-1 mb-4">
            Still have questions? We're here to help!
          </p>
          <v-btn
            color="primary"
            size="large"
            prepend-icon="mdi-email"
            href="mailto:hello@unconference.app"
          >
            Contact Us
          </v-btn>
        </div>
      </v-container>
    </section>
  </div>
</template>

<style scoped>
.pricing-page {
  min-height: 100vh;
}

/* Hero Section */
.hero-section {
  background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #06B6D4 100%);
  color: white;
}

.hero-title {
  font-size: clamp(2.5rem, 5vw, 3.5rem);
  font-weight: 800;
  line-height: 1.2;
  text-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.hero-subtitle {
  font-size: clamp(1.1rem, 2vw, 1.3rem);
  opacity: 0.95;
  line-height: 1.6;
}

/* Pricing Cards */
.pricing-section {
  background: linear-gradient(135deg, #FEFEFE 0%, #F8FAFC 100%);
}

.pricing-card {
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 16px;
  overflow: visible;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1) !important;
}

.highlighted-plan {
  border: 2px solid #6366F1;
  transform: scale(1.05);
}

.highlighted-plan:hover {
  transform: scale(1.05) translateY(-4px);
}

.popular-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.plan-header {
  padding: 1rem 0;
}

.plan-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1E293B;
  margin-bottom: 1rem;
}

.plan-price {
  margin-bottom: 1rem;
}

.currency {
  font-size: 1.5rem;
  font-weight: 600;
  color: #6366F1;
  vertical-align: top;
}

.price-large {
  font-size: 3rem;
  font-weight: 800;
  color: #6366F1;
  line-height: 1;
}

.period {
  font-size: 1rem;
  color: #64748B;
  font-weight: 500;
}

.plan-description {
  font-size: 0.9rem;
  color: #64748B;
  line-height: 1.5;
  margin: 0;
}

.limits-section {
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 8px;
  padding: 1rem;
}

.limit-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.limit-item:last-child {
  margin-bottom: 0;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  font-size: 0.9rem;
  color: #374151;
}

.community-highlight {
  background: rgba(var(--v-theme-info), 0.05);
  border-radius: 8px;
  padding: 0.75rem;
}

/* Section Styling */
.section-title {
  font-size: clamp(2rem, 4vw, 2.5rem);
  font-weight: 800;
  color: #1E293B;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1.1rem;
  color: #64748B;
  margin-bottom: 2rem;
}

.faq-section {
  background: #F8FAFC;
}

/* Responsive Design */
@media (max-width: 960px) {
  .highlighted-plan {
    transform: none;
  }
  
  .highlighted-plan:hover {
    transform: translateY(-4px);
  }
  
  .pricing-card {
    margin-bottom: 2rem;
  }
}
</style>
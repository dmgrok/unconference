import { ref, computed, readonly } from 'vue'

interface UpgradeOptions {
  tier: string
  prorate: boolean
  successUrl?: string
  cancelUrl?: string
}

interface DowngradeOptions {
  tier: string
  immediate: boolean
}

export const useSubscriptionUpgrade = () => {
  const upgrading = ref(false)
  const downgrading = ref(false)
  const error = ref<string | null>(null)
  const lastUpgradeResult = ref<any>(null)

  /**
   * Upgrade user's subscription to a new tier
   */
  const upgradeSubscription = async (options: UpgradeOptions) => {
    upgrading.value = true
    error.value = null

    try {
      const { tier, prorate, successUrl, cancelUrl } = options

      const response = await $fetch('/api/stripe/upgrade', {
        method: 'POST',
        body: {
          newTier: tier,
          prorate,
          successUrl: successUrl || `${window.location.origin}/subscription/success`,
          cancelUrl: cancelUrl || `${window.location.origin}/subscription/cancel`
        }
      })

      lastUpgradeResult.value = response

      // If checkout is required, redirect to Stripe
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl
        return response
      }

      // Direct upgrade successful
      return response

    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to upgrade subscription'
      console.error('Upgrade error:', err)
      throw err
    } finally {
      upgrading.value = false
    }
  }

  /**
   * Downgrade user's subscription to a lower tier
   */
  const downgradeSubscription = async (options: DowngradeOptions) => {
    downgrading.value = true
    error.value = null

    try {
      const { tier, immediate } = options

      const response = await $fetch('/api/stripe/downgrade', {
        method: 'POST',
        body: {
          newTier: tier,
          immediate
        }
      })

      return response

    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to downgrade subscription'
      console.error('Downgrade error:', err)
      throw err
    } finally {
      downgrading.value = false
    }
  }

  /**
   * Open Stripe billing portal for subscription management
   */
  const openBillingPortal = async (returnUrl?: string) => {
    try {
      const response = await $fetch('/api/stripe/portal', {
        method: 'POST',
        body: {
          returnUrl: returnUrl || window.location.href
        }
      })

      if (response.url) {
        window.location.href = response.url
      }

      return response

    } catch (err: any) {
      error.value = err.data?.message || err.message || 'Failed to open billing portal'
      console.error('Billing portal error:', err)
      throw err
    }
  }

  /**
   * Get upgrade recommendations based on current usage
   */
  const getUpgradeRecommendations = async () => {
    try {
      const response = await $fetch('/api/subscription/recommendations')
      return response.recommendations || []
    } catch (err: any) {
      console.error('Failed to get upgrade recommendations:', err)
      return []
    }
  }

  /**
   * Check if upgrade is needed based on participant limits
   */
  const checkUpgradeNeeded = async (eventId: string, expectedParticipants: number) => {
    try {
      const response = await $fetch(`/api/events/${eventId}/check-payment`, {
        method: 'POST',
        body: { expectedParticipants }
      })

      return {
        paymentRequired: response.paymentRequired,
        reason: response.reason,
        suggestedOptions: response.suggestedOptions || []
      }
    } catch (err: any) {
      console.error('Failed to check upgrade requirements:', err)
      return {
        paymentRequired: false,
        reason: null,
        suggestedOptions: []
      }
    }
  }

  /**
   * Get subscription usage details
   */
  const getSubscriptionDetails = async () => {
    try {
      const response = await $fetch('/api/subscription/details')
      return response
    } catch (err: any) {
      console.error('Failed to get subscription details:', err)
      return null
    }
  }

  /**
   * Retry failed payment
   */
  const retryFailedPayment = async () => {
    try {
      // Open billing portal for payment method update
      await openBillingPortal()
    } catch (err: any) {
      error.value = 'Failed to open payment update portal'
      throw err
    }
  }

  // Computed properties
  const isLoading = computed(() => upgrading.value || downgrading.value)

  const clearError = () => {
    error.value = null
  }

  return {
    // State
    upgrading: readonly(upgrading),
    downgrading: readonly(downgrading),
    isLoading,
    error: readonly(error),
    lastUpgradeResult: readonly(lastUpgradeResult),

    // Actions
    upgradeSubscription,
    downgradeSubscription,
    openBillingPortal,
    getUpgradeRecommendations,
    checkUpgradeNeeded,
    getSubscriptionDetails,
    retryFailedPayment,
    clearError
  }
}

/**
 * Helper function to determine if a tier is an upgrade
 */
export const isUpgrade = (currentTier: string, targetTier: string): boolean => {
  const tierOrder = ['FREE', 'COMMUNITY', 'ORGANIZER', 'UNLIMITED']
  const currentIndex = tierOrder.indexOf(currentTier)
  const targetIndex = tierOrder.indexOf(targetTier)
  return targetIndex > currentIndex
}

/**
 * Helper function to get tier comparison
 */
export const getTierComparison = (tier1: string, tier2: string): 'upgrade' | 'downgrade' | 'same' => {
  const tierOrder = ['FREE', 'COMMUNITY', 'ORGANIZER', 'UNLIMITED']
  const index1 = tierOrder.indexOf(tier1)
  const index2 = tierOrder.indexOf(tier2)

  if (index2 > index1) return 'upgrade'
  if (index2 < index1) return 'downgrade'
  return 'same'
}

/**
 * Helper function to calculate upgrade cost difference
 */
export const getUpgradeCost = (currentTier: string, targetTier: string): number => {
  const tierPrices = {
    'FREE': 0,
    'COMMUNITY': 19,
    'ORGANIZER': 49,
    'UNLIMITED': 99
  }

  const currentPrice = tierPrices[currentTier as keyof typeof tierPrices] || 0
  const targetPrice = tierPrices[targetTier as keyof typeof tierPrices] || 0

  return targetPrice - currentPrice
}
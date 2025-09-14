import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useSubscriptionUpgrade, isUpgrade, getTierComparison, getUpgradeCost } from '~/composables/useSubscriptionUpgrade'

// Mock $fetch
const mockFetch = vi.fn()
global.$fetch = mockFetch

// Mock window and location for browser environment
vi.stubGlobal('window', {
  location: {
    href: '',
    origin: 'http://localhost:3000'
  }
})

describe('useSubscriptionUpgrade', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockClear()
  })

  describe('upgradeSubscription', () => {
    it('should successfully upgrade subscription with direct payment', async () => {
      const mockResponse = {
        success: true,
        message: 'Subscription upgraded successfully',
        newTier: 'COMMUNITY',
        subscriptionId: 'sub_123'
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      const { upgradeSubscription, upgrading, error } = useSubscriptionUpgrade()

      const result = await upgradeSubscription({
        tier: 'COMMUNITY',
        prorate: true
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/upgrade', {
        method: 'POST',
        body: {
          newTier: 'COMMUNITY',
          prorate: true,
          successUrl: 'http://localhost:3000/subscription/success',
          cancelUrl: 'http://localhost:3000/subscription/cancel'
        }
      })

      expect(result).toEqual(mockResponse)
      expect(upgrading.value).toBe(false)
      expect(error.value).toBe(null)
    })

    it('should redirect to Stripe checkout when required', async () => {
      const mockResponse = {
        success: true,
        message: 'Checkout session created',
        checkoutUrl: 'https://checkout.stripe.com/session123',
        requiresCheckout: true
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      const { upgradeSubscription } = useSubscriptionUpgrade()

      const result = await upgradeSubscription({
        tier: 'ORGANIZER',
        prorate: false
      })

      expect(result).toEqual(mockResponse)
      expect(window.location.href).toBe('https://checkout.stripe.com/session123')
    })

    it('should handle upgrade errors', async () => {
      const mockError = {
        message: 'Payment method required',
        data: { message: 'No valid payment method found' }
      }

      mockFetch.mockRejectedValueOnce(mockError)

      const { upgradeSubscription, error } = useSubscriptionUpgrade()

      await expect(upgradeSubscription({
        tier: 'UNLIMITED',
        prorate: true
      })).rejects.toThrow()

      expect(error.value).toBe('No valid payment method found')
    })
  })

  describe('downgradeSubscription', () => {
    it('should successfully downgrade subscription', async () => {
      const mockResponse = {
        success: true,
        message: 'Subscription downgraded successfully',
        newTier: 'COMMUNITY',
        effectiveDate: '2024-01-01T00:00:00Z'
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      const { downgradeSubscription, downgrading, error } = useSubscriptionUpgrade()

      const result = await downgradeSubscription({
        tier: 'COMMUNITY',
        immediate: false
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/downgrade', {
        method: 'POST',
        body: {
          newTier: 'COMMUNITY',
          immediate: false
        }
      })

      expect(result).toEqual(mockResponse)
      expect(downgrading.value).toBe(false)
      expect(error.value).toBe(null)
    })
  })

  describe('openBillingPortal', () => {
    it('should open Stripe billing portal', async () => {
      const mockResponse = {
        url: 'https://billing.stripe.com/session123'
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      const { openBillingPortal } = useSubscriptionUpgrade()

      await openBillingPortal('http://localhost:3000/dashboard')

      expect(mockFetch).toHaveBeenCalledWith('/api/stripe/portal', {
        method: 'POST',
        body: {
          returnUrl: 'http://localhost:3000/dashboard'
        }
      })

      expect(window.location.href).toBe('https://billing.stripe.com/session123')
    })
  })

  describe('checkUpgradeNeeded', () => {
    it('should return upgrade requirements', async () => {
      const mockResponse = {
        paymentRequired: true,
        reason: 'Participant limit exceeded',
        suggestedOptions: [
          {
            type: 'subscription',
            tier: 'COMMUNITY',
            price: 19,
            description: 'Upgrade to Community plan'
          }
        ]
      }

      mockFetch.mockResolvedValueOnce(mockResponse)

      const { checkUpgradeNeeded } = useSubscriptionUpgrade()

      const result = await checkUpgradeNeeded('event123', 100)

      expect(mockFetch).toHaveBeenCalledWith('/api/events/event123/check-payment', {
        method: 'POST',
        body: { expectedParticipants: 100 }
      })

      expect(result).toEqual(mockResponse)
    })

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const { checkUpgradeNeeded } = useSubscriptionUpgrade()

      const result = await checkUpgradeNeeded('event123', 100)

      expect(result).toEqual({
        paymentRequired: false,
        reason: null,
        suggestedOptions: []
      })
    })
  })
})

describe('Tier Helper Functions', () => {
  describe('isUpgrade', () => {
    it('should correctly identify upgrades', () => {
      expect(isUpgrade('FREE', 'COMMUNITY')).toBe(true)
      expect(isUpgrade('COMMUNITY', 'ORGANIZER')).toBe(true)
      expect(isUpgrade('ORGANIZER', 'UNLIMITED')).toBe(true)
    })

    it('should correctly identify non-upgrades', () => {
      expect(isUpgrade('COMMUNITY', 'FREE')).toBe(false)
      expect(isUpgrade('ORGANIZER', 'COMMUNITY')).toBe(false)
      expect(isUpgrade('UNLIMITED', 'ORGANIZER')).toBe(false)
      expect(isUpgrade('COMMUNITY', 'COMMUNITY')).toBe(false)
    })
  })

  describe('getTierComparison', () => {
    it('should return correct comparison results', () => {
      expect(getTierComparison('FREE', 'COMMUNITY')).toBe('upgrade')
      expect(getTierComparison('ORGANIZER', 'COMMUNITY')).toBe('downgrade')
      expect(getTierComparison('COMMUNITY', 'COMMUNITY')).toBe('same')
    })
  })

  describe('getUpgradeCost', () => {
    it('should calculate correct cost differences', () => {
      expect(getUpgradeCost('FREE', 'COMMUNITY')).toBe(19)
      expect(getUpgradeCost('COMMUNITY', 'ORGANIZER')).toBe(30)
      expect(getUpgradeCost('ORGANIZER', 'UNLIMITED')).toBe(50)
      expect(getUpgradeCost('COMMUNITY', 'FREE')).toBe(-19)
    })

    it('should return 0 for same tier', () => {
      expect(getUpgradeCost('COMMUNITY', 'COMMUNITY')).toBe(0)
    })
  })
})

describe('Integration Tests', () => {
  it('should handle complete upgrade flow', async () => {
    // Mock successful upgrade
    mockFetch
      .mockResolvedValueOnce({
        success: true,
        message: 'Subscription upgraded successfully',
        newTier: 'ORGANIZER',
        subscriptionId: 'sub_456'
      })
      .mockResolvedValueOnce({
        tier: 'ORGANIZER',
        status: 'ACTIVE',
        isActive: true,
        limits: {
          maxParticipants: 300,
          maxEventsPerMonth: 30
        }
      })

    const { upgradeSubscription, getSubscriptionDetails } = useSubscriptionUpgrade()

    // Perform upgrade
    await upgradeSubscription({
      tier: 'ORGANIZER',
      prorate: true
    })

    // Verify new subscription details
    const details = await getSubscriptionDetails()

    expect(details.tier).toBe('ORGANIZER')
    expect(details.limits.maxParticipants).toBe(300)
  })

  it('should handle error recovery flow', async () => {
    // Mock failed payment
    mockFetch.mockRejectedValueOnce({
      message: 'Payment failed',
      data: { message: 'Card declined' }
    })

    const { upgradeSubscription, error, clearError } = useSubscriptionUpgrade()

    // Attempt upgrade - should fail
    await expect(upgradeSubscription({
      tier: 'UNLIMITED',
      prorate: true
    })).rejects.toThrow()

    expect(error.value).toBe('Card declined')

    // Clear error
    clearError()
    expect(error.value).toBe(null)
  })
})
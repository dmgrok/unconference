import { ref, computed, type Ref } from 'vue'
import type { SubscriptionTier } from '@prisma/client'

interface ParticipantLimitInfo {
  current: number
  limit: number
  tier: SubscriptionTier
  percentFull: number
  isApproaching: boolean
  isAtLimit: boolean
  warningLevel: 'none' | 'soft' | 'hard' | 'critical'
}

interface UpgradeOption {
  tier: string
  maxParticipants: number | string
  price: number
  features: string[]
}

export const useParticipantLimits = () => {
  const showUpgradePrompt = ref(false)
  const warningDismissed = ref(false)
  const currentLimitInfo = ref<ParticipantLimitInfo | null>(null)

  // Warning thresholds
  const WARNING_THRESHOLDS = {
    soft: 0.7,    // 70% full
    hard: 0.85,   // 85% full
    critical: 0.95 // 95% full
  }

  const getWarningLevel = (current: number, limit: number): ParticipantLimitInfo['warningLevel'] => {
    if (limit === -1) return 'none' // Unlimited

    const percentFull = current / limit

    if (percentFull >= WARNING_THRESHOLDS.critical) return 'critical'
    if (percentFull >= WARNING_THRESHOLDS.hard) return 'hard'
    if (percentFull >= WARNING_THRESHOLDS.soft) return 'soft'
    return 'none'
  }

  const calculateLimitInfo = (
    current: number,
    limit: number,
    tier: SubscriptionTier
  ): ParticipantLimitInfo => {
    const percentFull = limit === -1 ? 0 : Math.round((current / limit) * 100)
    const warningLevel = getWarningLevel(current, limit)

    return {
      current,
      limit,
      tier,
      percentFull,
      isApproaching: warningLevel === 'soft' || warningLevel === 'hard',
      isAtLimit: current >= limit && limit !== -1,
      warningLevel
    }
  }

  const updateLimitInfo = (current: number, limit: number, tier: SubscriptionTier) => {
    currentLimitInfo.value = calculateLimitInfo(current, limit, tier)

    // Auto-show upgrade prompt for hard/critical warnings
    if (currentLimitInfo.value.warningLevel === 'critical' && !warningDismissed.value) {
      showUpgradePrompt.value = true
    }
  }

  // Computed warning message based on current state
  const warningMessage = computed(() => {
    if (!currentLimitInfo.value || currentLimitInfo.value.warningLevel === 'none') {
      return null
    }

    const { current, limit, warningLevel, percentFull } = currentLimitInfo.value
    const remaining = limit - current

    switch (warningLevel) {
      case 'soft':
        return {
          type: 'info' as const,
          title: 'Growing Event',
          message: `Your event is ${percentFull}% full (${current}/${limit} participants). Consider upgrading to avoid hitting limits.`,
          action: 'Consider Upgrade'
        }

      case 'hard':
        return {
          type: 'warning' as const,
          title: 'Approaching Limit',
          message: `Only ${remaining} spots remaining! Upgrade now to avoid turning away participants.`,
          action: 'Upgrade Now'
        }

      case 'critical':
        return {
          type: 'error' as const,
          title: 'Critical Limit',
          message: remaining > 0
            ? `Only ${remaining} spot${remaining === 1 ? '' : 's'} left! New participants may be blocked soon.`
            : 'Participant limit reached! No new participants can join.',
          action: 'Upgrade Required'
        }

      default:
        return null
    }
  })

  // Upgrade recommendations based on current usage
  const upgradeRecommendations = computed((): UpgradeOption[] => {
    if (!currentLimitInfo.value) return []

    const { current, tier } = currentLimitInfo.value
    const recommendations: UpgradeOption[] = []

    // Suggest next tier up that can handle current + some buffer
    const targetCapacity = Math.max(current * 1.5, current + 50)

    const tierHierarchy = [
      { tier: 'COMMUNITY', limit: 150, price: 19 },
      { tier: 'ORGANIZER', limit: 300, price: 49 },
      { tier: 'UNLIMITED', limit: -1, price: 99 }
    ]

    for (const option of tierHierarchy) {
      if (tier !== option.tier && (option.limit === -1 || option.limit >= targetCapacity)) {
        recommendations.push({
          tier: option.tier,
          maxParticipants: option.limit === -1 ? 'Unlimited' : option.limit,
          price: option.price,
          features: [] // Will be filled by the component
        })
      }
    }

    return recommendations
  })

  // Actions
  const dismissWarning = () => {
    warningDismissed.value = true
    showUpgradePrompt.value = false
  }

  const showUpgrade = () => {
    showUpgradePrompt.value = true
  }

  const resetWarning = () => {
    warningDismissed.value = false
  }

  // Utility functions for templates
  const getWarningColor = (level: ParticipantLimitInfo['warningLevel']) => {
    switch (level) {
      case 'soft': return 'info'
      case 'hard': return 'warning'
      case 'critical': return 'error'
      default: return 'success'
    }
  }

  const getWarningIcon = (level: ParticipantLimitInfo['warningLevel']) => {
    switch (level) {
      case 'soft': return 'mdi-information'
      case 'hard': return 'mdi-alert'
      case 'critical': return 'mdi-alert-circle'
      default: return 'mdi-check-circle'
    }
  }

  const shouldShowInHeader = computed(() => {
    return currentLimitInfo.value?.warningLevel === 'hard' ||
           currentLimitInfo.value?.warningLevel === 'critical'
  })

  return {
    // State
    showUpgradePrompt,
    warningDismissed,
    currentLimitInfo,

    // Computed
    warningMessage,
    upgradeRecommendations,
    shouldShowInHeader,

    // Methods
    updateLimitInfo,
    calculateLimitInfo,
    dismissWarning,
    showUpgrade,
    resetWarning,
    getWarningColor,
    getWarningIcon,

    // Constants
    WARNING_THRESHOLDS
  }
}
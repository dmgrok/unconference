import { describe, it, expect, beforeEach } from 'vitest'
import { useParticipantLimits } from '~/composables/useParticipantLimits'

describe('useParticipantLimits composable', () => {
  let composable: ReturnType<typeof useParticipantLimits>

  beforeEach(() => {
    composable = useParticipantLimits()
  })

  describe('calculateLimitInfo', () => {
    it('should calculate correct info for FREE tier', () => {
      const info = composable.calculateLimitInfo(25, 50, 'FREE')

      expect(info).toEqual({
        current: 25,
        limit: 50,
        tier: 'FREE',
        percentFull: 50,
        isApproaching: false,
        isAtLimit: false,
        warningLevel: 'none'
      })
    })

    it('should identify soft warning at 70% capacity', () => {
      const info = composable.calculateLimitInfo(35, 50, 'FREE') // 70% of 50

      expect(info.warningLevel).toBe('soft')
      expect(info.isApproaching).toBe(true)
      expect(info.isAtLimit).toBe(false)
    })

    it('should identify hard warning at 85% capacity', () => {
      const info = composable.calculateLimitInfo(43, 50, 'FREE') // 86% of 50

      expect(info.warningLevel).toBe('hard')
      expect(info.isApproaching).toBe(true)
      expect(info.isAtLimit).toBe(false)
    })

    it('should identify critical warning at 95% capacity', () => {
      const info = composable.calculateLimitInfo(48, 50, 'FREE') // 96% of 50

      expect(info.warningLevel).toBe('critical')
      expect(info.isApproaching).toBe(false) // Critical is beyond "approaching"
      expect(info.isAtLimit).toBe(false)
    })

    it('should identify at limit when at capacity', () => {
      const info = composable.calculateLimitInfo(50, 50, 'FREE')

      expect(info.warningLevel).toBe('critical')
      expect(info.isAtLimit).toBe(true)
      expect(info.percentFull).toBe(100)
    })

    it('should handle unlimited tier correctly', () => {
      const info = composable.calculateLimitInfo(500, -1, 'UNLIMITED')

      expect(info.warningLevel).toBe('none')
      expect(info.isApproaching).toBe(false)
      expect(info.isAtLimit).toBe(false)
      expect(info.percentFull).toBe(0) // 0% of unlimited
    })
  })

  describe('warning messages', () => {
    it('should provide no warning for low usage', () => {
      composable.updateLimitInfo(20, 50, 'FREE')

      expect(composable.warningMessage.value).toBeNull()
    })

    it('should provide soft warning message', () => {
      composable.updateLimitInfo(35, 50, 'FREE') // 70%

      const warning = composable.warningMessage.value
      expect(warning).toBeDefined()
      expect(warning?.type).toBe('info')
      expect(warning?.title).toBe('Growing Event')
      expect(warning?.message).toContain('70% full')
      expect(warning?.action).toBe('Consider Upgrade')
    })

    it('should provide hard warning message', () => {
      composable.updateLimitInfo(43, 50, 'FREE') // 86%

      const warning = composable.warningMessage.value
      expect(warning).toBeDefined()
      expect(warning?.type).toBe('warning')
      expect(warning?.title).toBe('Approaching Limit')
      expect(warning?.message).toContain('7 spots remaining')
      expect(warning?.action).toBe('Upgrade Now')
    })

    it('should provide critical warning message', () => {
      composable.updateLimitInfo(49, 50, 'FREE') // 98%

      const warning = composable.warningMessage.value
      expect(warning).toBeDefined()
      expect(warning?.type).toBe('error')
      expect(warning?.title).toBe('Critical Limit')
      expect(warning?.message).toContain('1 spot left')
      expect(warning?.action).toBe('Upgrade Required')
    })

    it('should provide at-limit message', () => {
      composable.updateLimitInfo(50, 50, 'FREE')

      const warning = composable.warningMessage.value
      expect(warning).toBeDefined()
      expect(warning?.type).toBe('error')
      expect(warning?.title).toBe('Critical Limit')
      expect(warning?.message).toContain('Participant limit reached')
      expect(warning?.action).toBe('Upgrade Required')
    })
  })

  describe('upgrade recommendations', () => {
    it('should recommend COMMUNITY tier for FREE users with moderate usage', () => {
      composable.updateLimitInfo(30, 50, 'FREE')

      const recommendations = composable.upgradeRecommendations.value
      expect(recommendations).toHaveLength(3) // COMMUNITY, ORGANIZER, UNLIMITED

      const communityOption = recommendations.find(r => r.tier === 'COMMUNITY')
      expect(communityOption).toBeDefined()
      expect(communityOption?.maxParticipants).toBe(150)
      expect(communityOption?.price).toBe(19)
    })

    it('should recommend ORGANIZER tier for COMMUNITY users approaching limit', () => {
      composable.updateLimitInfo(120, 150, 'COMMUNITY')

      const recommendations = composable.upgradeRecommendations.value
      const organizerOption = recommendations.find(r => r.tier === 'ORGANIZER')
      expect(organizerOption).toBeDefined()
      expect(organizerOption?.maxParticipants).toBe(300)
      expect(organizerOption?.price).toBe(49)
    })

    it('should recommend UNLIMITED for high usage scenarios', () => {
      composable.updateLimitInfo(200, 300, 'ORGANIZER')

      const recommendations = composable.upgradeRecommendations.value
      const unlimitedOption = recommendations.find(r => r.tier === 'UNLIMITED')
      expect(unlimitedOption).toBeDefined()
      expect(unlimitedOption?.maxParticipants).toBe('Unlimited')
      expect(unlimitedOption?.price).toBe(99)
    })

    it('should not recommend current tier', () => {
      composable.updateLimitInfo(100, 150, 'COMMUNITY')

      const recommendations = composable.upgradeRecommendations.value
      const currentTierOption = recommendations.find(r => r.tier === 'COMMUNITY')
      expect(currentTierOption).toBeUndefined()
    })

    it('should provide no recommendations for UNLIMITED tier', () => {
      composable.updateLimitInfo(500, -1, 'UNLIMITED')

      const recommendations = composable.upgradeRecommendations.value
      expect(recommendations).toHaveLength(0)
    })
  })

  describe('warning state management', () => {
    it('should auto-show upgrade prompt for critical warnings', () => {
      expect(composable.showUpgradePrompt.value).toBe(false)

      composable.updateLimitInfo(48, 50, 'FREE') // Critical warning

      expect(composable.showUpgradePrompt.value).toBe(true)
    })

    it('should not auto-show prompt if already dismissed', () => {
      composable.dismissWarning()

      composable.updateLimitInfo(48, 50, 'FREE') // Critical warning

      expect(composable.showUpgradePrompt.value).toBe(false)
    })

    it('should allow manual show of upgrade prompt', () => {
      composable.showUpgrade()

      expect(composable.showUpgradePrompt.value).toBe(true)
    })

    it('should reset warning dismissal', () => {
      composable.dismissWarning()
      expect(composable.warningDismissed.value).toBe(true)

      composable.resetWarning()
      expect(composable.warningDismissed.value).toBe(false)
    })
  })

  describe('UI helpers', () => {
    it('should provide correct warning colors', () => {
      expect(composable.getWarningColor('none')).toBe('success')
      expect(composable.getWarningColor('soft')).toBe('info')
      expect(composable.getWarningColor('hard')).toBe('warning')
      expect(composable.getWarningColor('critical')).toBe('error')
    })

    it('should provide correct warning icons', () => {
      expect(composable.getWarningIcon('none')).toBe('mdi-check-circle')
      expect(composable.getWarningIcon('soft')).toBe('mdi-information')
      expect(composable.getWarningIcon('hard')).toBe('mdi-alert')
      expect(composable.getWarningIcon('critical')).toBe('mdi-alert-circle')
    })

    it('should determine when to show in header', () => {
      // Should not show for soft warnings
      composable.updateLimitInfo(35, 50, 'FREE')
      expect(composable.shouldShowInHeader.value).toBe(false)

      // Should show for hard warnings
      composable.updateLimitInfo(43, 50, 'FREE')
      expect(composable.shouldShowInHeader.value).toBe(true)

      // Should show for critical warnings
      composable.updateLimitInfo(48, 50, 'FREE')
      expect(composable.shouldShowInHeader.value).toBe(true)
    })
  })

  describe('warning thresholds constants', () => {
    it('should have correct threshold values', () => {
      expect(composable.WARNING_THRESHOLDS).toEqual({
        soft: 0.7,
        hard: 0.85,
        critical: 0.95
      })
    })
  })

  describe('edge cases', () => {
    it('should handle zero participants', () => {
      const info = composable.calculateLimitInfo(0, 50, 'FREE')

      expect(info.percentFull).toBe(0)
      expect(info.warningLevel).toBe('none')
      expect(info.isAtLimit).toBe(false)
    })

    it('should handle over-limit scenarios', () => {
      const info = composable.calculateLimitInfo(60, 50, 'FREE') // Over limit

      expect(info.percentFull).toBe(120)
      expect(info.isAtLimit).toBe(true)
      expect(info.warningLevel).toBe('critical')
    })

    it('should handle exactly at threshold boundaries', () => {
      // Exactly at 70% (soft threshold)
      const softInfo = composable.calculateLimitInfo(35, 50, 'FREE')
      expect(softInfo.warningLevel).toBe('soft')

      // Exactly at 85% (hard threshold)
      const hardInfo = composable.calculateLimitInfo(43, 50, 'FREE') // 42.5 rounds to 85%
      expect(hardInfo.warningLevel).toBe('hard')

      // Exactly at 95% (critical threshold)
      const criticalInfo = composable.calculateLimitInfo(48, 50, 'FREE') // 47.5 rounds to 95%
      expect(criticalInfo.warningLevel).toBe('critical')
    })
  })
})
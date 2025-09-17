import { PRICING_TIERS } from '~/types/pricing'
import type { PricingTier } from '~/types/pricing'

export const useEventLimits = () => {
  const checkParticipantLimit = (currentCount: number, tier: string) => {
    const tierConfig = PRICING_TIERS.find(t => t.id === tier);
    if (!tierConfig) return false;

    if (tierConfig.participantLimit === -1) return false; // Unlimited
    return currentCount >= tierConfig.participantLimit;
  };

  const shouldShowUpgradeModal = (participants: number, tier: string) => {
    return tier === 'free' && participants >= 20; // Show at 20/25 limit
  };

  const getTierConfig = (tier: string): PricingTier | undefined => {
    return PRICING_TIERS.find(t => t.id === tier);
  };

  const getParticipantLimit = (tier: string): number => {
    const tierConfig = getTierConfig(tier);
    return tierConfig?.participantLimit ?? 25;
  };

  const canAddParticipant = (currentCount: number, tier: string): boolean => {
    const limit = getParticipantLimit(tier);
    return limit === -1 || currentCount < limit;
  };

  return {
    checkParticipantLimit,
    shouldShowUpgradeModal,
    getTierConfig,
    getParticipantLimit,
    canAddParticipant,
    PRICING_TIERS
  };
};
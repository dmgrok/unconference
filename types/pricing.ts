interface PricingTier {
  id: 'free' | 'professional' | 'enterprise';
  name: string;
  price: number; // in cents
  participantLimit: number;
  features: string[];
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    participantLimit: 50,
    features: ['Topic voting', 'Round management', 'Basic timer', 'Event sharing']
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 2900, // $29.00
    participantLimit: 100,
    features: ['Everything in Free', 'Up to 100 participants', 'Export results', 'Email support']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 9900, // $99.00
    participantLimit: -1, // unlimited
    features: ['Everything in Professional', 'Unlimited participants', 'Priority support', 'Custom branding']
  }
];

export type { PricingTier };
export { PRICING_TIERS };
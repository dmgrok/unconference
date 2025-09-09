# License Model Comparison: Unconference vs Papermark

## Overview

Both projects use a dual licensing model with AGPLv3 as the open source foundation, but they differ significantly in their commercial licensing triggers and structure.

## Core Licensing Structure

| Aspect | Papermark | Unconference Platform |
|--------|-----------|----------------------|
| **Open Source License** | AGPLv3 | AGPLv3 |
| **Commercial License** | Feature-based | Usage-based |
| **Attribution** | Required | Required |
| **Code Structure** | Split (`/ee` directory) | Unified codebase |

## Key Differences

### 1. **Commercial License Trigger**

**Papermark:**
- Triggered by accessing enterprise features
- Features in `/ee` directory require commercial license
- Core features remain open source
- Decision point: "Do I need enterprise features?"

**Unconference:**
- Triggered by event size (50+ participants)
- All features available to everyone
- License depends on usage scale, not features
- Decision point: "How many people are attending my event?"

### 2. **Code Organization**

**Papermark:**
```
papermark/
├── src/           # Open source features (AGPLv3)
├── ee/            # Enterprise features (Commercial)
│   └── LICENSE    # Commercial license
└── LICENSE        # AGPLv3 + commercial terms
```

**Unconference:**
```
unconference/
├── components/    # All features (AGPLv3 for <50, Commercial for 50+)
├── pages/         # All features (license by usage)
├── enterprise/    # Commercial license terms only
│   └── LICENSE    # Commercial license
└── LICENSE        # AGPLv3 + usage restrictions
```

### 3. **Feature Access Philosophy**

**Papermark:**
- **Freemium Model**: Basic features free, premium features paid
- Open source users get core functionality
- Enterprise users get advanced features (analytics, white-label, etc.)
- Clear feature boundary between tiers

**Unconference:**
- **Scale-Based Model**: All features free for small events, paid for large events
- Small organizers get full functionality
- Large organizations pay for scale/usage
- No feature restrictions based on license

### 4. **Target Monetization**

**Papermark:**
- **Enterprise Features**: Advanced analytics, SSO, white-labeling
- **Value Proposition**: "Pay for premium capabilities"
- **Typical Users**: Small teams use free, enterprises pay for features

**Unconference:**
- **Scale/Volume**: Event size and organizational capacity
- **Value Proposition**: "Pay when you have budget/scale to afford it"
- **Typical Users**: Small events free, corporate/large events paid

### 5. **Implementation Complexity**

**Papermark:**
- **Higher Complexity**: Need to maintain feature gates
- Separate codebases for different editions
- Feature detection and licensing enforcement
- Clear separation of open/enterprise code

**Unconference:**
- **Lower Complexity**: Single codebase for all features
- License enforcement based on self-reporting
- Simpler development and maintenance
- Honor-system approach with legal backing

## Legal Enforcement

### Papermark
```
if (accessingEnterpriseFeature && !hasCommercialLicense) {
  throw new LicenseViolationError()
}
```

### Unconference
```
if (eventParticipants >= 50 && !hasCommercialLicense) {
  // License violation (honor system + legal terms)
}
```

## Pros and Cons

### Papermark Model

**Pros:**
- Clear feature boundaries
- Technical enforcement possible
- Proven model (GitLab, etc.)
- Appeals to feature-driven buyers

**Cons:**
- More complex development
- Maintains two codebases
- Can limit adoption (feature gates)
- Requires enterprise feature development

### Unconference Model

**Pros:**
- Simpler development (one codebase)
- Full features for small users
- Encourages adoption
- Fair pricing based on ability to pay

**Cons:**
- Harder to enforce technically
- Relies on honor system
- Less predictable revenue
- May need usage monitoring

## Revenue Implications

**Papermark:**
- Revenue from enterprises wanting advanced features
- Clear upgrade path (free → enterprise features)
- Predictable revenue per enterprise customer

**Unconference:**
- Revenue from organizations with scale/budget
- Natural correlation between event size and budget
- Larger potential customer base (all large events)

## Which Approach for Unconference?

The **usage-based model** makes more sense for Unconference because:

1. **Event Management Context**: Event size naturally correlates with organizational budget
2. **Fair Access**: Small nonprofits/communities get full functionality
3. **Simplicity**: One codebase, easier to maintain
4. **Market Positioning**: Positions as "fair and accessible" rather than "freemium"
5. **Natural Segmentation**: 50+ participants is a reasonable proxy for "has budget"

## Implementation Notes

Our current implementation is **simpler and more ethical** than feature-gating because:
- Everyone gets the same great software
- Payment is based on capacity to pay (event size/organization size)
- Encourages community adoption while monetizing enterprise use
- Easier to develop and maintain

This model is particularly suitable for developer tools and platforms where you want maximum adoption while monetizing based on scale rather than features.

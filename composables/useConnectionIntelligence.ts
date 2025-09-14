// Connection Intelligence and Quality Scoring System
export const useConnectionIntelligence = () => {
  // Connection quality scoring algorithm
  const calculateConnectionQuality = (connection: any, eventData?: any) => {
    let score = 0
    const factors = {
      sharedInterests: 0,
      conversationDepth: 0,
      mutualGoals: 0,
      followUpPotential: 0,
      networkValue: 0,
      engagementLevel: 0,
      professionalAlignment: 0,
      collaborationPotential: 0
    }

    // 1. Shared Interests Analysis (0-15 points)
    if (connection.sharedInterests?.length > 0) {
      const interestCount = connection.sharedInterests.length
      factors.sharedInterests = Math.min(15, interestCount * 3) // 3 points per shared interest, max 15
    }

    // 2. Conversation Depth (0-15 points)
    if (connection.conversationTopics) {
      const topicLength = connection.conversationTopics.length
      const keywordDensity = countProfessionalKeywords(connection.conversationTopics)
      factors.conversationDepth = Math.min(15, (topicLength / 50) * 10 + keywordDensity)
    }

    // 3. Mutual Goals Alignment (0-15 points)
    if (connection.mutualGoals?.length > 0) {
      factors.mutualGoals = Math.min(15, connection.mutualGoals.length * 5)
    }

    // 4. Follow-up Potential (0-10 points)
    factors.followUpPotential = assessFollowUpPotential(connection)

    // 5. Network Value (0-15 points) - Based on company, role, industry
    factors.networkValue = calculateNetworkValue(connection)

    // 6. Engagement Level (0-15 points) - How actively they participated
    factors.engagementLevel = assessEngagementLevel(connection, eventData)

    // 7. Professional Alignment (0-10 points) - Career stage, industry fit
    factors.professionalAlignment = assessProfessionalAlignment(connection)

    // 8. Collaboration Potential (0-5 points) - Likelihood of future projects
    factors.collaborationPotential = assessCollaborationPotential(connection)

    // Calculate total score
    score = Object.values(factors).reduce((total, factor) => total + factor, 0)

    return {
      overallScore: Math.min(100, Math.round(score)),
      factors,
      recommendation: getQualityRecommendation(score),
      priorityLevel: getConnectionPriority(score),
      businessValue: calculateBusinessValue(connection, score)
    }
  }

  // Enhanced connection strength calculation
  const calculateConnectionStrength = (connection: any, interactions: any[] = []) => {
    let strength = 'WEAK'
    let score = 0

    // Base factors
    if (connection.sharedInterests?.length >= 3) score += 20
    if (connection.conversationTopics?.length > 100) score += 15
    if (connection.contactExchanged) score += 10
    if (connection.followUpPlanned) score += 15

    // Interaction quality
    const interactionScore = interactions.reduce((sum, interaction) => {
      if (interaction.type === 'collaboration') return sum + 15
      if (interaction.type === 'deep_discussion') return sum + 10
      if (interaction.type === 'resource_share') return sum + 8
      return sum + 5
    }, 0)

    score += Math.min(25, interactionScore)

    // Professional alignment bonus
    if (connection.professionalAlignment?.score > 70) score += 15

    // Determine strength category
    if (score >= 75) strength = 'STRONG'
    else if (score >= 45) strength = 'MEDIUM'
    else strength = 'WEAK'

    return {
      strength,
      score,
      factors: {
        sharedInterests: connection.sharedInterests?.length >= 3,
        conversationDepth: connection.conversationTopics?.length > 100,
        contactExchange: connection.contactExchanged,
        followUpPlanned: connection.followUpPlanned,
        interactionQuality: interactionScore,
        professionalAlignment: connection.professionalAlignment?.score > 70
      }
    }
  }

  // Business value calculation
  const calculateBusinessValue = (connection: any, qualityScore: number) => {
    let value = 0

    // Base value from quality score
    value = qualityScore * 100 // $100 per quality point

    // Industry multipliers
    const industryMultipliers: Record<string, number> = {
      'Technology': 1.5,
      'Healthcare': 1.4,
      'Finance': 1.6,
      'Consulting': 1.3,
      'Media': 1.2,
      'Education': 1.1,
      'Government': 1.0
    }

    const industry = connection.industry || 'Technology'
    value *= industryMultipliers[industry] || 1.2

    // Role-based multipliers
    const roleMultipliers: Record<string, number> = {
      'C-Suite': 2.0,
      'VP': 1.7,
      'Director': 1.5,
      'Manager': 1.3,
      'Senior': 1.2,
      'Lead': 1.1
    }

    const role = connection.role || connection.title || ''
    const roleMultiplier = Object.entries(roleMultipliers).find(([key]) =>
      role.toLowerCase().includes(key.toLowerCase())
    )?.[1] || 1.0

    value *= roleMultiplier

    // Company size factor
    const companySize = connection.companySize || 'medium'
    const sizeMultipliers = {
      'startup': 1.1,
      'small': 1.2,
      'medium': 1.3,
      'large': 1.5,
      'enterprise': 1.8
    }

    value *= sizeMultipliers[companySize as keyof typeof sizeMultipliers] || 1.3

    // Collaboration potential bonus
    if (connection.collaborationPotential?.score > 80) {
      value *= 1.4
    }

    return {
      estimated: Math.round(value),
      breakdown: {
        baseValue: qualityScore * 100,
        industryMultiplier: industryMultipliers[industry] || 1.2,
        roleMultiplier,
        companySizeMultiplier: sizeMultipliers[companySize as keyof typeof sizeMultipliers] || 1.3,
        collaborationBonus: connection.collaborationPotential?.score > 80 ? 1.4 : 1.0
      }
    }
  }

  // Smart follow-up recommendations
  const generateFollowUpRecommendations = (connection: any, qualityScore: number) => {
    const recommendations = []

    // High-quality connections (80+)
    if (qualityScore >= 80) {
      recommendations.push({
        priority: 'high',
        timeline: '24-48 hours',
        action: 'Schedule strategic coffee meeting',
        template: 'executive-followup',
        reason: 'High mutual value potential identified'
      })

      if (connection.collaborationPotential?.score > 75) {
        recommendations.push({
          priority: 'high',
          timeline: '1 week',
          action: 'Propose specific collaboration opportunity',
          template: 'collaboration-proposal',
          reason: 'Strong collaboration indicators detected'
        })
      }
    }

    // Medium-quality connections (60-79)
    else if (qualityScore >= 60) {
      recommendations.push({
        priority: 'medium',
        timeline: '3-5 days',
        action: 'Send personalized connection message',
        template: 'connection-nurture',
        reason: 'Good foundation for relationship building'
      })

      if (connection.sharedInterests?.length >= 3) {
        recommendations.push({
          priority: 'medium',
          timeline: '1-2 weeks',
          action: 'Share relevant industry resource',
          template: 'resource-share',
          reason: 'Multiple shared interests identified'
        })
      }
    }

    // Lower-quality connections (40-59)
    else if (qualityScore >= 40) {
      recommendations.push({
        priority: 'low',
        timeline: '1 week',
        action: 'Send friendly check-in message',
        template: 'casual-checkin',
        reason: 'Maintain connection for future opportunities'
      })
    }

    // Add industry-specific recommendations
    if (connection.industry === connection.userIndustry) {
      recommendations.push({
        priority: 'medium',
        timeline: '1 week',
        action: 'Discuss industry trends and challenges',
        template: 'industry-discussion',
        reason: 'Same industry - high relevance for ongoing dialogue'
      })
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority as keyof typeof priorityOrder] - priorityOrder[a.priority as keyof typeof priorityOrder]
    })
  }

  // Network analysis and insights
  const analyzeNetworkHealth = (connections: any[]) => {
    const analysis = {
      totalConnections: connections.length,
      averageQuality: 0,
      qualityDistribution: {
        high: 0,    // 80-100
        medium: 0,  // 60-79
        low: 0      // 40-59
      },
      strengthDistribution: {
        strong: 0,
        medium: 0,
        weak: 0
      },
      industryDiversity: 0,
      followUpRequired: 0,
      businessValue: {
        total: 0,
        high: 0,
        medium: 0,
        potential: 0
      },
      insights: [] as string[]
    }

    if (connections.length === 0) return analysis

    const qualityScores = connections.map(conn => conn.qualityScore || 0)
    analysis.averageQuality = Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / connections.length)

    // Quality distribution
    connections.forEach(conn => {
      const score = conn.qualityScore || 0
      if (score >= 80) analysis.qualityDistribution.high++
      else if (score >= 60) analysis.qualityDistribution.medium++
      else analysis.qualityDistribution.low++
    })

    // Strength distribution
    connections.forEach(conn => {
      const strength = conn.connectionStrength?.toLowerCase() || 'weak'
      if (strength === 'strong') analysis.strengthDistribution.strong++
      else if (strength === 'medium') analysis.strengthDistribution.medium++
      else analysis.strengthDistribution.weak++
    })

    // Industry diversity
    const industries = new Set(connections.map(conn => conn.industry).filter(Boolean))
    analysis.industryDiversity = industries.size

    // Follow-up requirements
    analysis.followUpRequired = connections.filter(conn =>
      conn.followUpStatus === 'PENDING' || !conn.lastContactDate
    ).length

    // Business value calculation
    connections.forEach(conn => {
      const value = conn.businessValue?.estimated || 0
      analysis.businessValue.total += value
      if (value >= 10000) analysis.businessValue.high += value
      else if (value >= 5000) analysis.businessValue.medium += value
      else analysis.businessValue.potential += value
    })

    // Generate insights
    const insights = []

    if (analysis.qualityDistribution.high / connections.length > 0.3) {
      insights.push('🏆 Exceptional network quality! 30%+ high-value connections.')
    }

    if (analysis.industryDiversity >= 5) {
      insights.push('🌐 Strong industry diversification reduces risk and increases opportunities.')
    }

    if (analysis.followUpRequired / connections.length > 0.4) {
      insights.push('⚠️  High follow-up backlog may impact relationship quality.')
    }

    if (analysis.strengthDistribution.strong / connections.length > 0.25) {
      insights.push('💪 Strong relationship foundation - excellent collaboration potential.')
    }

    if (analysis.businessValue.total > 100000) {
      insights.push(`💰 Significant business value identified: $${(analysis.businessValue.total / 1000).toFixed(0)}K+ potential.`)
    }

    analysis.insights = insights

    return analysis
  }

  // Helper functions
  const countProfessionalKeywords = (text: string): number => {
    const keywords = [
      'strategy', 'innovation', 'collaboration', 'partnership', 'growth',
      'technology', 'digital', 'transformation', 'solutions', 'business',
      'development', 'research', 'analysis', 'optimization', 'efficiency',
      'leadership', 'management', 'consulting', 'advisory', 'expertise'
    ]

    const lowerText = text.toLowerCase()
    return keywords.filter(keyword => lowerText.includes(keyword)).length
  }

  const assessFollowUpPotential = (connection: any): number => {
    let score = 0

    if (connection.contactExchanged) score += 3
    if (connection.followUpPlanned) score += 4
    if (connection.sharedInterests?.length >= 2) score += 2
    if (connection.collaborationDiscussed) score += 1

    return Math.min(10, score)
  }

  const calculateNetworkValue = (connection: any): number => {
    let score = 5 // Base score

    // Company recognition
    const topCompanies = ['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Tesla', 'Netflix']
    if (topCompanies.some(company => connection.company?.includes(company))) {
      score += 5
    }

    // Role seniority
    const seniorRoles = ['CEO', 'CTO', 'VP', 'Director', 'Principal', 'Senior']
    if (seniorRoles.some(role => connection.title?.includes(role))) {
      score += 3
    }

    // Industry alignment
    if (connection.industry === connection.userIndustry) {
      score += 2
    }

    return Math.min(15, score)
  }

  const assessEngagementLevel = (connection: any, eventData?: any): number => {
    let score = 5 // Base engagement

    if (connection.topicsDiscussed > 2) score += 3
    if (connection.questionsAsked > 0) score += 2
    if (connection.resourcesShared > 0) score += 3
    if (connection.collaborationProposed) score += 2

    return Math.min(15, score)
  }

  const assessProfessionalAlignment = (connection: any): number => {
    let score = 0

    // Career stage alignment
    if (connection.careerStage === connection.userCareerStage) score += 3

    // Skills overlap
    if (connection.skills && connection.userSkills) {
      const overlap = connection.skills.filter((skill: string) =>
        connection.userSkills.includes(skill)
      ).length
      score += Math.min(4, overlap)
    }

    // Goals alignment
    if (connection.professionalGoals && connection.userGoals) {
      const goalOverlap = connection.professionalGoals.some((goal: string) =>
        connection.userGoals.includes(goal)
      )
      if (goalOverlap) score += 3
    }

    return Math.min(10, score)
  }

  const assessCollaborationPotential = (connection: any): number => {
    let score = 0

    if (connection.lookingForCollaborators) score += 2
    if (connection.hasComplementarySkills) score += 2
    if (connection.sharedProjectInterests) score += 1

    return Math.min(5, score)
  }

  const getQualityRecommendation = (score: number): string => {
    if (score >= 80) return 'HIGH_PRIORITY: Schedule strategic meeting within 48 hours'
    if (score >= 60) return 'MEDIUM_PRIORITY: Follow up within 1 week with personalized message'
    if (score >= 40) return 'LOW_PRIORITY: Maintain connection with periodic check-ins'
    return 'EVALUATE: Consider if this connection aligns with your goals'
  }

  const getConnectionPriority = (score: number): 'high' | 'medium' | 'low' => {
    if (score >= 80) return 'high'
    if (score >= 60) return 'medium'
    return 'low'
  }

  // Smart connection matching
  const findConnectionOpportunities = (connections: any[]) => {
    const opportunities = []

    // Find potential introductions
    for (let i = 0; i < connections.length; i++) {
      for (let j = i + 1; j < connections.length; j++) {
        const conn1 = connections[i]
        const conn2 = connections[j]

        const sharedInterests = conn1.interests?.filter((interest: string) =>
          conn2.interests?.includes(interest)
        ).length || 0

        if (sharedInterests >= 2) {
          opportunities.push({
            type: 'introduction',
            connections: [conn1, conn2],
            reason: `${sharedInterests} shared interests`,
            value: sharedInterests * 20
          })
        }
      }
    }

    return opportunities.sort((a, b) => b.value - a.value)
  }

  return {
    calculateConnectionQuality,
    calculateConnectionStrength,
    calculateBusinessValue,
    generateFollowUpRecommendations,
    analyzeNetworkHealth,
    findConnectionOpportunities
  }
}
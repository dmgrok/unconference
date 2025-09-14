// Viral Sharing Composable for Multi-Platform Content Generation
export const useViralSharing = () => {
  // Enhanced platform-specific content templates with business focus
  const platformTemplates = {
    linkedin: {
      maxLength: 3000,
      style: 'professional',
      hashtagLimit: 10,
      includeCallToAction: true,
      tone: 'accomplished',
      audience: 'professional-network'
    },
    twitter: {
      maxLength: 280,
      style: 'casual',
      hashtagLimit: 3,
      includeCallToAction: true,
      tone: 'excited',
      audience: 'public-network'
    },
    instagram: {
      maxLength: 2200,
      style: 'visual',
      hashtagLimit: 30,
      includeCallToAction: true,
      tone: 'inspiring',
      audience: 'social-network'
    },
    facebook: {
      maxLength: 63206,
      style: 'storytelling',
      hashtagLimit: 5,
      includeCallToAction: true,
      tone: 'conversational',
      audience: 'personal-network'
    },
    slack: {
      maxLength: 4000,
      style: 'informal',
      hashtagLimit: 0,
      includeCallToAction: false,
      tone: 'team-focused',
      audience: 'internal-team'
    },
    email: {
      maxLength: 10000,
      style: 'detailed',
      hashtagLimit: 0,
      includeCallToAction: true,
      tone: 'informative',
      audience: 'direct-connections'
    },
    'executive-brief': {
      maxLength: 2000,
      style: 'executive',
      hashtagLimit: 0,
      includeCallToAction: false,
      tone: 'strategic',
      audience: 'leadership'
    },
    'industry-report': {
      maxLength: 5000,
      style: 'analytical',
      hashtagLimit: 5,
      includeCallToAction: true,
      tone: 'authoritative',
      audience: 'industry-peers'
    }
  }

  // Generate platform-specific content
  const generateContent = (platform: keyof typeof platformTemplates, data: any) => {
    const template = platformTemplates[platform]

    switch (platform) {
      case 'linkedin':
        return generateLinkedInContent(data, template)
      case 'twitter':
        return generateTwitterContent(data, template)
      case 'instagram':
        return generateInstagramContent(data, template)
      case 'facebook':
        return generateFacebookContent(data, template)
      case 'slack':
        return generateSlackContent(data, template)
      case 'email':
        return generateEmailContent(data, template)
      case 'executive-brief':
        return generateExecutiveBriefContent(data, template)
      case 'industry-report':
        return generateIndustryReportContent(data, template)
      default:
        return generateGenericContent(data, template)
    }
  }

  // LinkedIn content - Professional achievement focus
  const generateLinkedInContent = (data: any, template: any) => {
    const { 
      event, 
      personalImpact, 
      metrics, 
      connections, 
      achievements, 
      generatedIdeas, 
      promisingTopics, 
      followUpCommitments,
      surveyData,
      surveyInsights,
      topicDiscussionData,
      discussionInsights
    } = data

    const headlines = [
      `Just wrapped up an incredible ${event.title} - here's what I accomplished:`,
      `Proud to share my impact from ${event.title}:`,
      `Amazing results from today's ${event.title}:`,
      `What happens when great minds gather? See my ${event.title} recap:`
    ]

    const headline = headlines[Math.floor(Math.random() * headlines.length)]

    let content = `${headline}\n\n`

    // Key achievements
    content += `📊 Personal Impact Score: ${personalImpact?.overallImpact || 0}/100\n`
    content += `🤝 Made ${metrics?.connectionsMode || 0} meaningful professional connections\n`
    content += `💡 Engaged with ${metrics?.topicsVotedFor || 0} innovative discussion topics\n`

    if (metrics?.topicsProposed > 0) {
      content += `🎯 Proposed ${metrics.topicsProposed} discussion topics that shaped our agenda\n`
    }

    if (metrics?.collaborationsJoined > 0) {
      content += `🚀 Joined ${metrics.collaborationsJoined} active collaboration projects\n`
    }

    if (achievements?.length > 0) {
      content += `🏆 Earned ${achievements.length} achievements for community contribution\n`
    }

    // Survey insights section
    if (surveyInsights?.length > 0) {
      content += `\n📊 Survey Insights Revealed:\n`
      const positiveInsights = surveyInsights.filter((insight: any) => insight.type === 'positive').slice(0, 2)
      positiveInsights.forEach((insight: any) => {
        content += `• ${insight.message}\n`
      })
    }

    // Discussion analytics
    if (topicDiscussionData?.length > 0) {
      const totalDiscussions = topicDiscussionData.reduce((sum: number, topic: any) => sum + topic.value, 0)
      const topTopic = topicDiscussionData[0]
      content += `\n🗣️ Discussion Analytics:\n`
      content += `• ${totalDiscussions} total topic interactions across the event\n`
      content += `• "${topTopic?.name}" sparked the most engagement (${topTopic?.value} interactions)\n`
      content += `• ${topicDiscussionData.length} different topics explored in depth\n`
    }

    // Ideas generated section
    if (generatedIdeas?.length > 0) {
      content += `\n💡 Ideas & Insights Generated:\n`
      const topIdeas = generatedIdeas
        .sort((a: any, b: any) => b.promisingScore - a.promisingScore)
        .slice(0, 3)
      
      topIdeas.forEach((idea: any) => {
        content += `• ${idea.title} (${idea.promisingScore}/5 ⭐)\n`
      })

      const followUpCount = generatedIdeas.filter((idea: any) => idea.needsFollowUp).length
      if (followUpCount > 0) {
        content += `\n🚀 ${followUpCount} ideas marked for follow-up collaboration!\n`
      }
    }

    // Most promising topics
    if (promisingTopics?.length > 0) {
      content += `\n🌟 Most Impactful Discussion Topics:\n`
      promisingTopics.slice(0, 2).forEach((topic: any, index: number) => {
        content += `${index + 1}. ${topic.title} (${topic.engagementScore}/5 engagement)\n`
      })
    }

    // Follow-up commitments
    if (followUpCommitments?.length > 0) {
      content += `\n📋 What's Next:\n`
      const highPriorityCommitments = followUpCommitments.filter((c: any) => c.priority === 'high')
      if (highPriorityCommitments.length > 0) {
        content += `• Leading ${highPriorityCommitments[0].title} with ${highPriorityCommitments[0].collaborators?.length || 0} collaborators\n`
      }
    }

    // Enhanced insights section
    content += `\n✨ Key Insights:\n`
    if (surveyData?.length > 0) {
      // Calculate consensus topics
      const strongConsensus = surveyData.filter((topic: any) => {
        const total = topic.stronglyDisagree + topic.disagree + topic.neutral + topic.agree + topic.stronglyAgree
        const positive = topic.agree + topic.stronglyAgree
        return (positive / total) > 0.75
      })
      
      if (strongConsensus.length > 0) {
        content += `• ${strongConsensus.length} topics showed strong community consensus (>75% agreement)\n`
      }
    }
    
    content += `• The power of participant-driven agendas creates 10x more engagement\n`
    content += `• Real connections happen when people share genuine interests\n`
    content += `• Collaborative problem-solving beats traditional presentations every time\n`

    // Call to action
    content += `\n🎯 Interested in joining our next unconference? The magic happens when passionate professionals come together to solve real challenges.\n`

    // Professional hashtags
    const hashtags = ['unconference', 'networking', 'collaboration', 'innovation', 'professionaldev', 'leadership', 'teamwork', 'futureofwork', 'datainsights']
    content += `\n${hashtags.slice(0, template.hashtagLimit).map(tag => `#${tag}`).join(' ')}`

    return {
      platform: 'linkedin',
      content: content.slice(0, template.maxLength),
      shareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}&summary=${encodeURIComponent(content)}`
    }
  }

    // Twitter content - Concise impact highlights
  const generateTwitterContent = (data: any, template: any) => {
    const { 
      event, 
      personalImpact, 
      metrics, 
      generatedIdeas, 
      followUpCommitments,
      topicDiscussionData,
      surveyInsights
    } = data

    // Enhanced templates with survey/discussion insights
    const templates = [
      `🎉 Just crushed it at ${event.title}! Made ${metrics?.connectionsMode || 0} connections, ${topicDiscussionData?.length || 0} topics explored. Impact: ${personalImpact?.overallImpact || 0}/100!`,
      `${event.title} was 🔥! ${metrics?.connectionsMode || 0} connections + ${generatedIdeas?.length || 0} ideas + ${topicDiscussionData?.reduce((sum: number, topic: any) => sum + topic.value, 0) || 0} interactions = magic! ✨`,
      `From ideas to action at ${event.title}! ${generatedIdeas?.length || 0} insights captured, ${followUpCommitments?.length || 0} projects launching 🚀`
    ]

    // Add survey insight if available
    if (surveyInsights?.length > 0) {
      const positiveInsight = surveyInsights.find((insight: any) => insight.type === 'positive')
      if (positiveInsight) {
        templates.push(`📊 Major insight from ${event.title}: ${positiveInsight.message.slice(0, 100)}... Data-driven conversations FTW! 🚀`)
      }
    }

    // Add discussion analytics if available
    if (topicDiscussionData?.length > 0) {
      const topTopic = topicDiscussionData[0]
      const totalInteractions = topicDiscussionData.reduce((sum: number, topic: any) => sum + topic.value, 0)
      templates.push(`🗣️ ${event.title} analytics: ${totalInteractions} total interactions! "${topTopic?.name}" sparked the most discussion. Love seeing data tell the story! 📈`)
    }

    let content = templates[Math.floor(Math.random() * templates.length)]

    // Add hashtags
    const hashtags = ['unconference', 'networking', 'innovation']
    if (generatedIdeas?.length > 0) {
      hashtags.push('ideas')
    }
    if (followUpCommitments?.length > 0) {
      hashtags.push('collaboration')
    }
    if (surveyInsights?.length > 0 || topicDiscussionData?.length > 0) {
      hashtags.push('data')
    }
    
    content += ` ${hashtags.slice(0, template.hashtagLimit).map(tag => `#${tag}`).join(' ')}`

    return {
      platform: 'twitter',
      content: content.slice(0, template.maxLength),
      shareUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(content)}`
    }
  }

  // Instagram content - Visual storytelling
  const generateInstagramContent = (data: any, template: any) => {
    const { event, personalImpact, metrics, connections } = data

    let content = `✨ What an incredible day at ${event.title}! ✨\n\n`
    content += `🎯 My impact journey:\n`
    content += `📈 Personal Impact Score: ${personalImpact?.overallImpact || 0}/100\n`
    content += `🤝 ${metrics?.connectionsMode || 0} amazing new connections\n`
    content += `💡 ${metrics?.topicsVotedFor || 0} topics that sparked innovation\n\n`

    content += `The energy when passionate people come together is UNREAL! 🔥\n\n`
    content += `Every conversation led to new possibilities. Every connection opened new doors. This is what happens when we prioritize authentic collaboration over traditional networking. 💫\n\n`

    // Visual elements suggestion
    content += `Swipe to see the transformation → scattered ideas became concrete action items! 📊\n\n`

    // Call to action
    content += `Ready to experience this magic yourself? Join our next unconference! Link in bio 👆\n\n`

    // Instagram hashtags (can use more)
    const hashtags = [
      'unconference', 'networking', 'collaboration', 'innovation', 'community',
      'connections', 'growth', 'inspiration', 'transformation', 'leadership',
      'entrepreneurs', 'creativity', 'problemsolving', 'teamwork', 'future'
    ]
    content += hashtags.slice(0, template.hashtagLimit).map(tag => `#${tag}`).join(' ')

    return {
      platform: 'instagram',
      content: content.slice(0, template.maxLength),
      shareUrl: null // Instagram doesn't support URL sharing
    }
  }

  // Facebook content - Storytelling approach
  const generateFacebookContent = (data: any, template: any) => {
    const { event, personalImpact, metrics, journey } = data

    let content = `🎉 Just experienced something truly special at ${event.title}!\n\n`
    content += `Picture this: ${metrics?.topicsProposed || 47} scattered ideas from ${event.totalParticipants} brilliant minds. No predetermined agenda. No keynote speakers. Just pure, participant-driven collaboration.\n\n`

    content += `Here's what happened:\n`
    content += `✨ We voted democratically on which topics to explore\n`
    content += `🤝 I connected with ${metrics?.connectionsMode || 0} incredible people who share my passions\n`
    content += `🚀 Joined ${metrics?.collaborationsJoined || 0} projects that could change everything\n`
    content += `💡 Contributed to discussions that generated ${metrics?.actionItemsCreated || 0} concrete action items\n\n`

    content += `My personal impact score? ${personalImpact?.overallImpact || 0}/100 - and every point was earned through genuine contribution and connection.\n\n`

    content += `This is what happens when you trust a community to self-organize around what matters most. The results speak for themselves:\n`
    content += `📊 ${journey?.keyMoments?.length || 0} defining moments\n`
    content += `⏰ ${journey?.activeMinutes || 0} minutes of engaged participation\n`
    content += `🏆 ${metrics?.achievementsEarned || 0} achievements unlocked\n\n`

    content += `If you're tired of traditional conferences where you sit passively and listen, you need to experience this. It's not just different - it's transformative.\n\n`

    content += `Who's ready to join the next one? 🙋‍♂️\n\n`

    const hashtags = ['unconference', 'collaboration', 'innovation', 'community', 'transformation']
    content += hashtags.map(tag => `#${tag}`).join(' ')

    return {
      platform: 'facebook',
      content: content.slice(0, template.maxLength),
      shareUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`
    }
  }

  // Slack content - Team-focused internal sharing
  const generateSlackContent = (data: any, template: any) => {
    const { event, personalImpact, metrics, connections } = data

    let content = `:tada: Team update from ${event.title}!\n\n`
    content += `Just wrapped up an incredible unconference experience. Here's what our team gained:\n\n`

    content += `:chart_with_upwards_trend: **Impact Metrics:**\n`
    content += `• Personal Impact Score: ${personalImpact?.overallImpact || 0}/100\n`
    content += `• New professional connections: ${metrics?.connectionsMode || 0}\n`
    content += `• Topics explored: ${metrics?.topicsVotedFor || 0}\n`
    content += `• Active collaborations joined: ${metrics?.collaborationsJoined || 0}\n\n`

    content += `:bulb: **Key Learnings for Our Team:**\n`
    content += `• Participant-driven agendas create 10x higher engagement\n`
    content += `• Real innovation happens in small, focused groups\n`
    content += `• Diverse perspectives lead to breakthrough solutions\n\n`

    content += `:rocket: **Next Steps:**\n`
    content += `• Following up with ${connections?.length || 0} new contacts this week\n`
    content += `• Implementing insights from ${metrics?.topicsVotedFor || 0} discussion topics\n`
    content += `• Considering unconference format for our next team offsite\n\n`

    content += `Anyone interested in attending the next one? I can share more details! :point_up:`

    return {
      platform: 'slack',
      content: content.slice(0, template.maxLength),
      shareUrl: null // Slack doesn't use URLs for sharing
    }
  }

  // Email content - Detailed follow-up
  const generateEmailContent = (data: any, template: any) => {
    const { event, personalImpact, metrics, connections, collaborations, insights } = data

    const subject = `My ${event.title} Recap - ${metrics?.connectionsMode || 0} connections, ${metrics?.collaborationsJoined || 0} collaborations!`

    let content = `Hi there!\n\n`
    content += `I just wanted to share an incredible experience I had at ${event.title}. If you've never heard of an unconference, you're in for a treat!\n\n`

    content += `**What is an unconference?**\n`
    content += `Instead of predetermined speakers and topics, WE created the agenda. Everyone pitched ideas, we voted democratically, and self-organized into discussions around what mattered most. The result? Pure magic.\n\n`

    content += `**My Personal Impact:**\n`
    content += `• Overall Impact Score: ${personalImpact?.overallImpact || 0}/100\n`
    content += `• New meaningful connections: ${metrics?.connectionsMode || 0} people\n`
    content += `• Topics I engaged with: ${metrics?.topicsVotedFor || 0}\n`
    content += `• Collaborations I joined: ${metrics?.collaborationsJoined || 0} active projects\n`
    content += `• Achievements unlocked: ${metrics?.achievementsEarned || 0}\n\n`

    if (insights?.length > 0) {
      content += `**Biggest Insights:**\n`
      insights.forEach((insight: any) => {
        content += `• ${insight.description}\n`
      })
      content += `\n`
    }

    content += `**The Most Valuable Part?**\n`
    content += `The connections weren't just networking - they were genuine relationships built around shared interests and challenges. I'm already planning follow-ups with several people, and we've identified concrete ways to collaborate.\n\n`

    if (connections?.length > 0) {
      content += `**New Connections Include:**\n`
      connections.slice(0, 5).forEach((conn: any) => {
        content += `• ${conn.person.name} - ${conn.sharedTopics?.join(', ') || 'Multiple shared interests'}\n`
      })
      if (connections.length > 5) {
        content += `• And ${connections.length - 5} more amazing people!\n`
      }
      content += `\n`
    }

    content += `**Why You Should Consider This:**\n`
    content += `If you're tired of traditional conferences where you sit and listen passively, an unconference might be exactly what you need. It's engaging, collaborative, and produces real outcomes.\n\n`

    content += `The next event is already in planning. If you're interested, I'd love to tell you more!\n\n`

    content += `Best regards,\n[Your Name]\n\n`
    content += `P.S. I'm attaching my full event recap if you want to see the detailed breakdown of outcomes!`

    return {
      platform: 'email',
      content: content.slice(0, template.maxLength),
      subject,
      shareUrl: null
    }
  }

  // Generic content fallback
  const generateGenericContent = (data: any, template: any) => {
    const { event, personalImpact, metrics } = data

    let content = `Amazing experience at ${event.title}! `
    content += `Made ${metrics?.connectionsMode || 0} connections, `
    content += `engaged with ${metrics?.topicsVotedFor || 0} topics, `
    content += `achieved ${personalImpact?.overallImpact || 0}/100 impact score. `
    content += `The power of collaborative, participant-driven events is incredible!`

    return {
      platform: 'generic',
      content: content.slice(0, template.maxLength),
      shareUrl: null
    }
  }

  // Executive Brief content - ROI-focused for leadership
  const generateExecutiveBriefContent = (data: any, template: any) => {
    const {
      event,
      personalImpact,
      metrics,
      strategicConnections,
      followUpCommitments,
      generatedIdeas
    } = data

    const businessValue = strategicConnections?.businessValue || '$250K+'
    const connectionsCount = strategicConnections?.totalConnections || metrics?.connectionsMode || 0
    const projectsCount = followUpCommitments?.length || 0

    const title = `Executive Brief: ${event?.title} Strategic Outcomes`

    let content = `EXECUTIVE SUMMARY\n`
    content += `Event: ${event?.title}\n`
    content += `Date: ${new Date().toLocaleDateString()}\n`
    content += `Strategic Impact Assessment\n\n`

    content += `KEY PERFORMANCE INDICATORS:\n`
    content += `• Network Expansion: +${connectionsCount} qualified professional relationships\n`
    content += `• Business Value Pipeline: ${businessValue} in identified opportunities\n`
    content += `• Project Activation: ${projectsCount} collaborative initiatives launched\n`
    content += `• Engagement Effectiveness: ${personalImpact?.overallImpact || 0}/100 score\n\n`

    content += `STRATEGIC OUTCOMES:\n`
    content += `• Cross-functional collaboration frameworks validated\n`
    content += `• Industry partnership opportunities mapped\n`
    content += `• Innovation pipeline accelerated through participant-driven methodology\n`
    content += `• Knowledge transfer efficiency increased by 10x over traditional formats\n\n`

    content += `COMPETITIVE ADVANTAGE:\n`
    content += `The unconference format demonstrates significant ROI advantages:\n`
    content += `• Higher engagement rates (${personalImpact?.overallImpact || 0}% vs. ~20% traditional)\n`
    content += `• Quality relationship building over quantity networking\n`
    content += `• Real-time problem-solving vs. theoretical presentations\n`
    content += `• Measurable collaboration outcomes vs. passive consumption\n\n`

    content += `RECOMMENDATION:\n`
    content += `Consider implementing participant-driven formats for future team development and external partnership events. The measured outcomes support scaling this approach for strategic relationship building and collaborative innovation initiatives.\n\n`

    content += `NEXT PHASE:\n`
    content += `• Execute ${projectsCount} scheduled follow-up collaborations\n`
    content += `• Implement learnings in Q${Math.ceil((new Date().getMonth() + 1) / 3) + 1} strategic planning\n`
    content += `• Evaluate unconference methodology for annual leadership retreat`

    return {
      platform: 'executive-brief',
      content: content.slice(0, template.maxLength),
      title,
      shareUrl: null
    }
  }

  // Industry Report content - Sector insights and trends
  const generateIndustryReportContent = (data: any, template: any) => {
    const {
      event,
      surveyData,
      surveyInsights,
      topicDiscussionData,
      discussionInsights,
      strategicConnections
    } = data

    const title = `Industry Intelligence Report: ${event?.title} Cross-Sector Analysis`
    const totalInteractions = topicDiscussionData?.reduce((sum: number, topic: any) => sum + topic.value, 0) || 0
    const topTopic = topicDiscussionData?.[0]

    let content = `# ${title}\n\n`
    content += `## Executive Summary\n`
    content += `Analysis of cross-sector professional collaboration patterns and emerging industry trends from ${event?.title}, featuring ${strategicConnections?.totalConnections || 0} industry participants.\n\n`

    content += `## Key Findings\n\n`
    content += `### 1. Collaboration Efficiency Metrics\n`
    content += `• Total topic interactions: ${totalInteractions}\n`
    content += `• Most engaged topic: "${topTopic?.name}" (${topTopic?.value} interactions)\n`
    content += `• Cross-functional engagement rate: 95%+ (vs. 30% traditional formats)\n\n`

    if (surveyInsights?.length > 0) {
      content += `### 2. Survey Intelligence\n`
      surveyInsights.slice(0, 4).forEach((insight: any, index: number) => {
        content += `${index + 1}. ${insight.message}\n`
      })
      content += `\n`
    }

    content += `### 3. Industry Trend Analysis\n`
    content += `• **Participant-Driven Innovation**: 10x higher engagement vs. traditional presentations\n`
    content += `• **Cross-Sector Pollination**: Breakthrough solutions emerge at industry intersections\n`
    content += `• **Collaborative Intelligence**: Distributed expertise outperforms individual thought leadership\n`
    content += `• **Real-Time Problem Solving**: Immediate application over theoretical discussion\n\n`

    content += `### 4. Strategic Implications\n`
    content += `Organizations embracing participant-driven collaboration methodologies show:\n`
    content += `• Accelerated innovation cycles\n`
    content += `• Higher employee engagement in professional development\n`
    content += `• Stronger cross-industry partnership formation\n`
    content += `• Measurable knowledge transfer efficiency\n\n`

    content += `## Recommendations\n`
    content += `1. **Adopt Unconference Methodologies**: Implement for internal innovation sessions\n`
    content += `2. **Cross-Industry Collaboration**: Prioritize diverse participant representation\n`
    content += `3. **Measurement Framework**: Track engagement and outcome metrics\n`
    content += `4. **Scaling Strategy**: Apply learnings to annual professional development programs\n\n`

    content += `## Conclusion\n`
    content += `The evidence strongly supports participant-driven collaboration as a superior methodology for professional development, innovation acceleration, and strategic relationship building. Early adopters will gain competitive advantages in talent development and industry positioning.\n\n`

    content += `---\n`
    content += `*Report generated: ${new Date().toLocaleString()}*\n`
    content += `*Source: ${event?.title} participant data and engagement analytics*`

    // Add industry hashtags
    const hashtags = ['industryreport', 'collaboration', 'innovation', 'professionaldev', 'crosssector']
    content += `\n\n${hashtags.slice(0, template.hashtagLimit).map(tag => `#${tag}`).join(' ')}`

    return {
      platform: 'industry-report',
      content: content.slice(0, template.maxLength),
      title,
      shareUrl: null
    }
  }

  // Generate content for all platforms
  const generateAllPlatformContent = (data: any) => {
    const platforms = Object.keys(platformTemplates) as (keyof typeof platformTemplates)[]
    const content: Record<string, any> = {}

    platforms.forEach(platform => {
      content[platform] = generateContent(platform, data)
    })

    return content
  }

  // Copy content to clipboard
  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
      return true
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
      return false
    }
  }

  // Share using native sharing API
  const nativeShare = async (content: string, title: string, url?: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: content,
          url
        })
        return true
      } catch (error) {
        console.error('Native sharing failed:', error)
        return false
      }
    }
    return false
  }

  return {
    generateContent,
    generateAllPlatformContent,
    copyToClipboard,
    nativeShare,
    platformTemplates
  }
}
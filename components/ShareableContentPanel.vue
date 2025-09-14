<template>
  <v-card class="shareable-content-panel" elevation="4">
    <v-card-title class="text-h5 font-weight-bold primary white--text">
      <v-icon left color="white">mdi-share-variant</v-icon>
      Share Your Impact
    </v-card-title>

    <v-card-text class="pa-6">
      <!-- Platform Tabs -->
      <v-tabs v-model="selectedPlatform" background-color="transparent" grow>
        <v-tab v-for="platform in platforms" :key="platform.key" class="platform-tab">
          <v-icon :color="platform.color" class="mr-2">{{ platform.icon }}</v-icon>
          {{ platform.name }}
        </v-tab>
      </v-tabs>

      <!-- Content Preview -->
      <v-tabs-items v-model="selectedPlatform" class="mt-4">
        <v-tab-item v-for="(platform, index) in platforms" :key="platform.key">
          <v-card outlined class="content-preview-card">
            <v-card-subtitle class="d-flex align-center justify-space-between">
              <span>{{ platform.name }} Preview</span>
              <v-chip small :color="platform.color" text-color="white">
                {{ getContentLength(platform.key) }}/{{ getMaxLength(platform.key) }} chars
              </v-chip>
            </v-card-subtitle>

            <v-card-text>
              <!-- Platform-specific preview -->
              <div v-if="platform.key === 'linkedin'" class="linkedin-preview">
                <div class="preview-header d-flex align-center mb-3">
                  <v-avatar size="40" class="mr-3">
                    <img src="/default-avatar.png" alt="Your Profile">
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">Your Name</div>
                    <div class="text-caption text--secondary">Just now • 🌎</div>
                  </div>
                </div>
                <div class="preview-content">
                  {{ generatedContent[platform.key]?.content }}
                </div>
              </div>

              <div v-else-if="platform.key === 'twitter'" class="twitter-preview">
                <div class="preview-header d-flex align-center mb-3">
                  <v-avatar size="40" class="mr-3">
                    <img src="/default-avatar.png" alt="Your Profile">
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">Your Name</div>
                    <div class="text-caption text--secondary">@yourusername • now</div>
                  </div>
                </div>
                <div class="preview-content">
                  {{ generatedContent[platform.key]?.content }}
                </div>
              </div>

              <div v-else-if="platform.key === 'email' || platform.key === 'executive-brief' || platform.key === 'industry-report'" class="email-preview">
                <div class="email-header mb-3">
                  <div class="text-caption text--secondary">{{ platform.key === 'email' ? 'Subject:' : 'Title:' }}</div>
                  <div class="font-weight-medium">{{ generatedContent[platform.key]?.subject || generatedContent[platform.key]?.title }}</div>
                </div>
                <v-divider class="mb-3" />
                <div class="preview-content email-content">
                  {{ generatedContent[platform.key]?.content }}
                </div>
                <div v-if="platform.audience" class="mt-2">
                  <v-chip small color="grey" outlined>
                    <v-icon left small>mdi-account-group</v-icon>
                    {{ platform.audience }}
                  </v-chip>
                </div>
              </div>

              <div v-else-if="platform.key === 'slack'" class="slack-preview">
                <div class="preview-header d-flex align-center mb-3">
                  <v-avatar size="32" class="mr-2" color="green">
                    <span class="white--text text-caption">U</span>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium text-body-2">Your Name</div>
                    <div class="text-caption text--secondary">today at {{ new Date().toLocaleTimeString() }}</div>
                  </div>
                </div>
                <div class="preview-content slack-content">
                  {{ generatedContent[platform.key]?.content }}
                </div>
                <div class="mt-2">
                  <v-chip small color="purple" outlined>
                    <v-icon left small>mdi-account-group</v-icon>
                    {{ platform.audience }}
                  </v-chip>
                </div>
              </div>

              <div v-else class="generic-preview">
                <div class="preview-content">
                  {{ generatedContent[platform.key]?.content }}
                </div>
              </div>

              <!-- Character count warning -->
              <v-alert
                v-if="getContentLength(platform.key) > getMaxLength(platform.key)"
                type="warning"
                dense
                class="mt-3"
              >
                Content exceeds {{ platform.name }} character limit. Consider shortening.
              </v-alert>
            </v-card-text>

            <!-- Action Buttons -->
            <v-card-actions class="px-4 pb-4">
              <v-btn
                color="primary"
                :disabled="!generatedContent[platform.key]"
                @click="copyContent(platform.key)"
              >
                <v-icon left>mdi-content-copy</v-icon>
                Copy
              </v-btn>

              <v-btn
                v-if="platform.shareUrl && generatedContent[platform.key]?.shareUrl"
                color="success"
                :href="generatedContent[platform.key].shareUrl"
                target="_blank"
              >
                <v-icon left>{{ platform.icon }}</v-icon>
                Share on {{ platform.name }}
              </v-btn>

              <v-btn
                v-if="platform.key === 'email'"
                color="info"
                @click="openEmailClient(platform.key)"
              >
                <v-icon left>mdi-email-open</v-icon>
                Open in Email
              </v-btn>

              <v-btn
                v-if="platform.key === 'executive-brief' || platform.key === 'industry-report'"
                color="info"
                @click="downloadReport(platform.key)"
              >
                <v-icon left>mdi-file-download</v-icon>
                Download Report
              </v-btn>

              <v-btn
                text
                @click="customizeContent(platform.key)"
              >
                <v-icon left>mdi-pencil</v-icon>
                Customize
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-tab-item>
      </v-tabs-items>

      <!-- Bulk Actions -->
      <v-row class="mt-6">
        <v-col cols="12">
          <v-card outlined color="grey lighten-5">
            <v-card-text class="text-center">
              <h3 class="text-h6 mb-3">Quick Actions</h3>
              <v-row justify="center">
                <v-col cols="auto">
                  <v-btn
                    large
                    color="primary"
                    @click="generateAllContent"
                    :loading="generating"
                  >
                    <v-icon left>mdi-auto-fix</v-icon>
                    Generate All
                  </v-btn>
                </v-col>
                <v-col cols="auto">
                  <v-btn
                    large
                    color="success"
                    @click="copyAllContent"
                    :disabled="!hasGeneratedContent"
                  >
                    <v-icon left>mdi-content-copy</v-icon>
                    Copy All
                  </v-btn>
                </v-col>
                <v-col cols="auto">
                  <v-btn
                    large
                    color="info"
                    @click="downloadContentPack"
                    :disabled="!hasGeneratedContent"
                  >
                    <v-icon left>mdi-download</v-icon>
                    Download Pack
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Analytics Preview -->
      <v-row v-if="showAnalytics" class="mt-6">
        <v-col cols="12">
          <v-card outlined>
            <v-card-title class="text-h6">
              <v-icon left color="primary">mdi-chart-line</v-icon>
              Viral Potential Score
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-progress-circular
                    :value="viralScore"
                    :color="getScoreColor(viralScore)"
                    size="100"
                    width="8"
                  >
                    <div class="text-center">
                      <div class="text-h5 font-weight-bold">{{ viralScore }}</div>
                      <div class="text-caption">Viral Score</div>
                    </div>
                  </v-progress-circular>
                </v-col>
                <v-col cols="12" md="6">
                  <div class="text-body-2">
                    <div class="mb-2">
                      <v-icon small color="primary">mdi-account-group</v-icon>
                      Projected reach: {{ projectedReach }} people
                    </div>
                    <div class="mb-2">
                      <v-icon small color="success">mdi-share</v-icon>
                      Expected shares: {{ expectedShares }}
                    </div>
                    <div class="mb-2">
                      <v-icon small color="warning">mdi-eye</v-icon>
                      Estimated engagement: {{ estimatedEngagement }}%
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- Customize Dialog -->
    <v-dialog v-model="customizeDialog" max-width="800px" scrollable>
      <v-card>
        <v-card-title>
          Customize {{ platforms[selectedPlatform]?.name }} Content
        </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="customContent"
            :label="`${platforms[selectedPlatform]?.name} Content`"
            :counter="getMaxLength(platforms[selectedPlatform]?.key)"
            outlined
            rows="10"
            persistent-counter
          />

          <v-row v-if="platforms[selectedPlatform]?.key === 'email'" class="mt-3">
            <v-col cols="12">
              <v-text-field
                v-model="customSubject"
                label="Email Subject"
                outlined
                dense
              />
            </v-col>
          </v-row>

          <!-- Content Templates -->
          <v-expansion-panels class="mt-4">
            <v-expansion-panel>
              <v-expansion-panel-header>
                <span class="font-weight-medium">Content Templates</span>
              </v-expansion-panel-header>
              <v-expansion-panel-content>
                <v-chip-group column>
                  <v-chip
                    v-for="template in contentTemplates"
                    :key="template.id"
                    @click="applyTemplate(template)"
                    outlined
                    color="primary"
                  >
                    {{ template.name }}
                  </v-chip>
                </v-chip-group>
              </v-expansion-panel-content>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="customizeDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveCustomContent">Save Changes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Success Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" top right>
      {{ snackbarText }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="snackbar = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useViralSharing } from '~/composables/useViralSharing'

const props = defineProps<{
  eventData: any
}>()

const { generateAllPlatformContent, copyToClipboard, nativeShare } = useViralSharing()

// Enhanced platform definitions with business focus
const platforms = [
  {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: 'mdi-linkedin',
    color: 'blue darken-3',
    shareUrl: true,
    audience: 'Professional Network',
    description: 'Achievement-focused content for career growth',
    maxLength: 3000
  },
  {
    key: 'email',
    name: 'Email Follow-up',
    icon: 'mdi-email-outline',
    color: 'green darken-2',
    shareUrl: false,
    audience: 'New Connections',
    description: 'Personalized follow-up for relationship building',
    maxLength: 10000
  },
  {
    key: 'slack',
    name: 'Team Update',
    icon: 'mdi-slack',
    color: 'purple',
    shareUrl: false,
    audience: 'Internal Team',
    description: 'Team-focused insights and learnings',
    maxLength: 4000
  },
  {
    key: 'twitter',
    name: 'Twitter',
    icon: 'mdi-twitter',
    color: 'light-blue',
    shareUrl: true,
    audience: 'Public Network',
    description: 'Concise impact highlights and insights',
    maxLength: 280
  },
  {
    key: 'executive-brief',
    name: 'Executive Brief',
    icon: 'mdi-account-tie',
    color: 'indigo darken-3',
    shareUrl: false,
    audience: 'Leadership',
    description: 'ROI-focused outcomes for executives',
    maxLength: 2000
  },
  {
    key: 'industry-report',
    name: 'Industry Report',
    icon: 'mdi-chart-line',
    color: 'orange darken-2',
    shareUrl: false,
    audience: 'Industry Peers',
    description: 'Sector insights and trend analysis',
    maxLength: 5000
  }
]

// State
const selectedPlatform = ref(0)
const generatedContent = ref<Record<string, any>>({})
const generating = ref(false)
const showAnalytics = ref(true)

// Customize dialog
const customizeDialog = ref(false)
const customContent = ref('')
const customSubject = ref('')
const currentCustomizePlatform = ref('')

// Snackbar
const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

// Enhanced content templates for professional sharing
const contentTemplates = [
  // Business Value Templates
  {
    id: 1,
    name: 'Executive Summary',
    type: 'executive',
    description: 'ROI-focused content for leadership',
    audience: 'executives'
  },
  {
    id: 2,
    name: 'Team Collaboration',
    type: 'team',
    description: 'Team-building and process insights',
    audience: 'colleagues'
  },
  {
    id: 3,
    name: 'Industry Insights',
    type: 'industry',
    description: 'Sector-specific trends and opportunities',
    audience: 'industry-peers'
  },
  {
    id: 4,
    name: 'Innovation Showcase',
    type: 'innovation',
    description: 'Breakthrough ideas and solutions',
    audience: 'innovators'
  },
  // Connection Intelligence Templates
  {
    id: 5,
    name: 'Strategic Connections',
    type: 'strategic-connections',
    description: 'High-value professional relationships',
    audience: 'network'
  },
  {
    id: 6,
    name: 'Learning & Development',
    type: 'learning',
    description: 'Professional growth outcomes',
    audience: 'mentors-peers'
  },
  // Platform-Optimized Templates
  {
    id: 7,
    name: 'LinkedIn Professional',
    type: 'linkedin-pro',
    description: 'Achievement-focused for LinkedIn network',
    audience: 'professional-network'
  },
  {
    id: 8,
    name: 'Email Follow-up',
    type: 'email-followup',
    description: 'Connection nurturing and project updates',
    audience: 'new-connections'
  }
]

// Computed properties
const hasGeneratedContent = computed(() => {
  return Object.keys(generatedContent.value).length > 0
})

const viralScore = computed(() => {
  if (!props.eventData?.personalImpact) return 0

  const impact = props.eventData.personalImpact.overallImpact || 0
  const connections = props.eventData.metrics?.connectionsMode || 0
  const achievements = props.eventData.metrics?.achievementsEarned || 0

  return Math.min(100, Math.round((impact * 0.4) + (connections * 2) + (achievements * 5)))
})

const projectedReach = computed(() => {
  const connections = props.eventData.metrics?.connectionsMode || 0
  return Math.round(connections * 15 + viralScore.value * 3)
})

const expectedShares = computed(() => {
  return Math.round(viralScore.value * 0.3)
})

const estimatedEngagement = computed(() => {
  return Math.round(viralScore.value * 0.8)
})

// Methods
const generateAllContent = async () => {
  generating.value = true
  try {
    generatedContent.value = generateAllPlatformContent(props.eventData)
    showSnackbar('Content generated for all platforms!', 'success')
  } catch (error) {
    showSnackbar('Error generating content', 'error')
  } finally {
    generating.value = false
  }
}

const copyContent = async (platform: string) => {
  const content = generatedContent.value[platform]?.content
  if (!content) return

  const success = await copyToClipboard(content)
  if (success) {
    showSnackbar(`${platforms.find(p => p.key === platform)?.name} content copied!`, 'success')
  } else {
    showSnackbar('Failed to copy content', 'error')
  }
}

const copyAllContent = async () => {
  let allContent = ''

  platforms.forEach(platform => {
    const content = generatedContent.value[platform.key]
    if (content) {
      allContent += `\n\n=== ${platform.name.toUpperCase()} ===\n`
      if (content.subject) {
        allContent += `Subject: ${content.subject}\n\n`
      }
      allContent += content.content
      allContent += '\n' + '='.repeat(platform.name.length + 8)
    }
  })

  const success = await copyToClipboard(allContent)
  if (success) {
    showSnackbar('All content copied to clipboard!', 'success')
  } else {
    showSnackbar('Failed to copy content', 'error')
  }
}

const downloadContentPack = () => {
  const content = generateDownloadContent()
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `event-sharing-pack-${Date.now()}.txt`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  showSnackbar('Content pack downloaded!', 'success')
}

const generateDownloadContent = () => {
  let content = `# Event Sharing Content Pack\n`
  content += `Generated: ${new Date().toLocaleString()}\n`
  content += `Event: ${props.eventData.event?.title}\n\n`

  platforms.forEach(platform => {
    const platformContent = generatedContent.value[platform.key]
    if (platformContent) {
      content += `## ${platform.name}\n`
      if (platformContent.subject) {
        content += `**Subject:** ${platformContent.subject}\n\n`
      }
      content += platformContent.content
      content += '\n\n' + '-'.repeat(50) + '\n\n'
    }
  })

  return content
}

const customizeContent = (platform: string) => {
  currentCustomizePlatform.value = platform
  const platformContent = generatedContent.value[platform]
  customContent.value = platformContent?.content || ''
  customSubject.value = platformContent?.subject || ''
  customizeDialog.value = true
}

const saveCustomContent = () => {
  const platform = currentCustomizePlatform.value
  if (!generatedContent.value[platform]) {
    generatedContent.value[platform] = {}
  }

  generatedContent.value[platform].content = customContent.value
  if (customSubject.value) {
    generatedContent.value[platform].subject = customSubject.value
  }

  customizeDialog.value = false
  showSnackbar('Content customized successfully!', 'success')
}

const applyTemplate = (template: any) => {
  const platform = platforms[selectedPlatform.value]?.key
  if (!platform) return

  try {
    const templateContent = generateTemplateContent(template, platform, props.eventData)
    customContent.value = templateContent.content
    if (templateContent.subject) {
      customSubject.value = templateContent.subject
    }
    showSnackbar(`${template.name} template applied to ${platforms[selectedPlatform.value]?.name}!`, 'success')
  } catch (error) {
    showSnackbar('Failed to apply template', 'error')
  }
}

const generateTemplateContent = (template: any, platform: string, data: any) => {
  const { event, personalImpact, metrics, strategicConnections, networkData } = data

  switch (template.type) {
    case 'executive':
      return generateExecutiveTemplate(platform, data)
    case 'strategic-connections':
      return generateStrategicConnectionsTemplate(platform, data)
    case 'linkedin-pro':
      return generateLinkedInProTemplate(platform, data)
    case 'email-followup':
      return generateEmailFollowUpTemplate(platform, data)
    case 'innovation':
      return generateInnovationTemplate(platform, data)
    case 'industry':
      return generateIndustryTemplate(platform, data)
    default:
      return generateGenericTemplate(platform, data)
  }
}

const generateExecutiveTemplate = (platform: string, data: any) => {
  const { event, personalImpact, metrics, strategicConnections } = data
  const roi = strategicConnections?.businessValue || '$250K+'
  const connectionsCount = strategicConnections?.totalConnections || metrics?.connectionsMode || 0

  if (platform === 'linkedin') {
    const content = `📊 Executive Brief: ${event?.title} ROI Analysis\n\n` +
      `🎯 STRATEGIC OUTCOMES:\n` +
      `• ${connectionsCount} high-value professional relationships established\n` +
      `• ${roi} in potential business value identified\n` +
      `• ${personalImpact?.overallImpact || 0}/100 engagement effectiveness score\n\n` +
      `💼 KEY PERFORMANCE INDICATORS:\n` +
      `• Network expansion: +${connectionsCount} qualified connections\n` +
      `• Follow-up pipeline: ${strategicConnections?.followUps || 0} scheduled engagements\n` +
      `• Knowledge transfer: ${metrics?.topicsVotedFor || 0} strategic discussions\n\n` +
      `🚀 NEXT PHASE: Converting connections into collaborative opportunities\n\n` +
      `#ExecutiveNetworking #StrategicPartnerships #BusinessDevelopment #ROI`
    return { content, subject: `Executive Brief: ${event?.title} Strategic Outcomes` }
  }

  if (platform === 'email') {
    const content = `Executive Summary\n\n` +
      `I wanted to share the strategic outcomes from ${event?.title}, as the results demonstrate significant ROI potential for our network expansion initiatives.\n\n` +
      `KEY METRICS:\n` +
      `• Strategic Connections: ${connectionsCount} qualified relationships\n` +
      `• Business Value Pipeline: ${roi}\n` +
      `• Engagement Score: ${personalImpact?.overallImpact || 0}/100\n\n` +
      `STRATEGIC INSIGHTS:\n` +
      `• Participant-driven formats generate 10x higher engagement\n` +
      `• Quality over quantity approach yields better long-term partnerships\n` +
      `• Cross-industry pollination accelerates innovation\n\n` +
      `RECOMMENDATION: Consider implementing similar engagement strategies for our next team development initiative.\n\n` +
      `Best regards`
    return { content, subject: `Strategic Outcomes: ${event?.title} Executive Brief` }
  }

  return { content: `Executive outcomes from ${event?.title}: ${connectionsCount} strategic connections, ${roi} potential value.` }
}

const generateStrategicConnectionsTemplate = (platform: string, data: any) => {
  const { event, strategicConnections, networkData } = data
  const connections = strategicConnections?.connections || []
  const networkStrength = networkData?.averageConnectionStrength || 'medium'

  if (platform === 'linkedin') {
    const content = `🤝 Strategic Networking Success at ${event?.title}\n\n` +
      `Just completed an intensive networking session that prioritized QUALITY over quantity. Here's what strategic relationship building looks like:\n\n` +
      `📈 CONNECTION INTELLIGENCE:\n` +
      `• ${connections.length} strategically selected relationships\n` +
      `• Average connection strength: ${networkStrength.toUpperCase()}\n` +
      `• ${connections.filter((c: any) => c.businessValue > 1000).length} high-value partnership opportunities\n\n` +
      `🎯 FOLLOW-UP STRATEGY:\n` +
      connections.slice(0, 3).map((conn: any) =>
        `• ${conn.name} (${conn.company}): ${conn.followUpPlan || 'Project collaboration scheduled'}`
      ).join('\n') + '\n\n' +
      `💡 KEY INSIGHT: The most valuable connections happen when you lead with genuine curiosity about shared challenges, not just what you can gain.\n\n` +
      `Ready to transform your networking approach? Let's connect! 🚀\n\n` +
      `#StrategicNetworking #RelationshipBuilding #BusinessDevelopment #ProfessionalGrowth`
    return { content }
  }

  if (platform === 'email') {
    const content = `Strategic Connection Update\n\n` +
      `Following up on our recent conversation about intentional networking approaches. I wanted to share results from ${event?.title} where I implemented the connection intelligence strategies we discussed.\n\n` +
      `APPROACH: Quality-focused relationship building\n` +
      `RESULTS: ${connections.length} strategic connections with ${networkStrength} average relationship strength\n\n` +
      `TOP CONNECTIONS MADE:\n` +
      connections.slice(0, 5).map((conn: any) =>
        `• ${conn.name} (${conn.company}): ${conn.sharedInterests?.join(', ') || 'Multiple alignment areas'}`
      ).join('\n') + '\n\n' +
      `The key insight: Leading with genuine interest in shared challenges creates much stronger foundations than traditional networking approaches.\n\n` +
      `I'd love to discuss how we might apply these strategies to our upcoming industry events.\n\n` +
      `Best regards`
    return { content, subject: `Strategic Networking Results: ${event?.title}` }
  }

  return { content: `Strategic networking at ${event?.title}: ${connections.length} quality connections focused on mutual value creation.` }
}

const generateLinkedInProTemplate = (platform: string, data: any) => {
  if (platform !== 'linkedin') {
    return generateStrategicConnectionsTemplate(platform, data)
  }

  const { event, personalImpact, metrics, strategicConnections, generatedIdeas } = data
  const content = `🏆 Professional Development Milestone: ${event?.title}\n\n` +
    `Excited to share the quantifiable outcomes from today's intensive collaborative session. When professionals with diverse expertise self-organize around shared challenges, magic happens:\n\n` +
    `📊 PERFORMANCE METRICS:\n` +
    `• Personal Impact Score: ${personalImpact?.overallImpact || 0}/100\n` +
    `• Strategic Connections: ${strategicConnections?.totalConnections || 0} qualified relationships\n` +
    `• Innovation Output: ${generatedIdeas?.length || 0} actionable insights generated\n` +
    `• Knowledge Transfer: ${metrics?.topicsVotedFor || 0} strategic discussions facilitated\n\n` +
    `🚀 IMMEDIATE APPLICATIONS:\n` +
    `• Implementing cross-functional collaboration frameworks from today's learnings\n` +
    `• Scheduling follow-ups with ${strategicConnections?.followUps || 0} potential project partners\n` +
    `• Applying participant-driven agenda techniques to upcoming team meetings\n\n` +
    `💡 KEY PROFESSIONAL INSIGHT: The highest-value outcomes emerge when you combine structured facilitation with organic relationship building. Traditional networking events optimize for quantity; unconference formats optimize for depth and actionable outcomes.\n\n` +
    `For fellow professionals interested in evidence-based networking and collaborative problem-solving approaches, I'm happy to share specific methodologies that proved most effective.\n\n` +
    `#ProfessionalDevelopment #CollaborativeLeadership #NetworkingStrategy #ContinuousLearning #InnovationManagement`
  return { content }
}

const generateEmailFollowUpTemplate = (platform: string, data: any) => {
  if (platform !== 'email') {
    return generateStrategicConnectionsTemplate(platform, data)
  }

  const { event, strategicConnections } = data
  const connections = strategicConnections?.connections || []

  const content = `Thank you for the engaging conversation at ${event?.title}!\n\n` +
    `It was excellent connecting with you during our discussion about [SPECIFIC TOPIC FROM YOUR CONVERSATION]. Your insights on [SPECIFIC INSIGHT] really resonated with challenges we're seeing in our industry.\n\n` +
    `As promised, I wanted to follow up with:\n` +
    `• [SPECIFIC RESOURCE/CONTACT YOU MENTIONED SHARING]\n` +
    `• [RELEVANT ARTICLE/CASE STUDY THAT CAME UP]\n` +
    `• [INTRODUCTION TO RELEVANT CONTACT IN YOUR NETWORK]\n\n` +
    `I'm particularly interested in exploring [COLLABORATION OPPORTUNITY DISCUSSED] further. Based on our conversation, I think there's strong alignment between [SHARED INTEREST/CHALLENGE].\n\n` +
    `SUGGESTED NEXT STEPS:\n` +
    `• Brief 30-minute call to dive deeper into [SPECIFIC OPPORTUNITY]\n` +
    `• I'd love to introduce you to [RELEVANT PERSON IN YOUR NETWORK]\n` +
    `• Happy to share our recent work on [RELEVANT PROJECT/EXPERTISE]\n\n` +
    `The quality of connections at ${event?.title} was exceptional - clearly demonstrates the power of participant-driven agendas for creating meaningful professional relationships.\n\n` +
    `Looking forward to continuing our conversation!\n\n` +
    `Best regards,\n[YOUR NAME]\n\n` +
    `P.S. If you're interested in attending future unconference events, I'm happy to share details about upcoming sessions.`

  return {
    content,
    subject: `Following up from ${event?.title} - [PERSONALIZED SUBJECT BASED ON YOUR CONVERSATION]`
  }
}

const generateInnovationTemplate = (platform: string, data: any) => {
  const { event, generatedIdeas, followUpCommitments } = data
  const topIdeas = generatedIdeas?.slice(0, 3) || []

  if (platform === 'linkedin') {
    const content = `🚀 Innovation Catalyst Report: ${event?.title}\n\n` +
      `When you combine diverse expertise with structured ideation, breakthrough solutions emerge. Today's session generated ${generatedIdeas?.length || 0} actionable innovations:\n\n` +
      `💡 TOP BREAKTHROUGH IDEAS:\n` +
      topIdeas.map((idea: any) =>
        `• ${idea.title}: ${idea.description?.substring(0, 80)}... (${idea.promisingScore}/5 ⭐)`
      ).join('\n') + '\n\n' +
      `🔥 INNOVATION PIPELINE:\n` +
      `• ${followUpCommitments?.length || 0} concepts moving to proof-of-concept phase\n` +
      `• Cross-functional collaboration opportunities identified\n` +
      `• Industry partnership potential mapped\n\n` +
      `The magic ingredient? Participant-driven discovery combined with rapid prototyping mindsets. When diverse perspectives collide with structured facilitation, innovation accelerates exponentially.\n\n` +
      `#Innovation #Ideation #CollaborativeSolution #BreakthroughThinking #FutureOfWork`
    return { content }
  }

  return { content: `Innovation outcomes from ${event?.title}: ${generatedIdeas?.length || 0} breakthrough ideas, ${followUpCommitments?.length || 0} moving to development.` }
}

const generateIndustryTemplate = (platform: string, data: any) => {
  const { event, surveyInsights, topicDiscussionData } = data
  const topDiscussion = topicDiscussionData?.[0]

  if (platform === 'linkedin') {
    const content = `📊 Industry Intelligence: ${event?.title} Trend Analysis\n\n` +
      `Emerging patterns from today's cross-sector discussions reveal significant shifts in how professionals approach [INDUSTRY FOCUS]:\n\n` +
      `🔍 KEY INDUSTRY INSIGHTS:\n` +
      surveyInsights?.slice(0, 3).map((insight: any) =>
        `• ${insight.message}`
      ).join('\n') + '\n\n' +
      `📈 TRENDING DISCUSSIONS:\n` +
      `• "${topDiscussion?.name}" dominated engagement (${topDiscussion?.value} interactions)\n` +
      `• Cross-industry collaboration opportunities identified\n` +
      `• Regulatory and innovation convergence points mapped\n\n` +
      `💡 STRATEGIC IMPLICATION: Organizations that embrace participant-driven knowledge sharing will outpace traditional top-down information distribution by significant margins.\n\n` +
      `The data suggests a fundamental shift toward collaborative intelligence over individual expertise hoarding.\n\n` +
      `#IndustryTrends #CollaborativeIntelligence #FutureOfWork #CrossSectorInnovation`
    return { content }
  }

  return { content: `Industry insights from ${event?.title}: Key trends in collaborative intelligence and cross-sector innovation.` }
}

const generateGenericTemplate = (platform: string, data: any) => {
  const { event, personalImpact, metrics } = data
  return {
    content: `Professional development milestone at ${event?.title}: ${personalImpact?.overallImpact || 0}/100 impact score, ${metrics?.connectionsMode || 0} strategic connections.`
  }
}

const openEmailClient = (platform: string) => {
  const content = generatedContent.value[platform]
  if (!content) return

  const subject = encodeURIComponent(content.subject || 'Event Recap')
  const body = encodeURIComponent(content.content)

  window.open(`mailto:?subject=${subject}&body=${body}`)
}

const getContentLength = (platform: string) => {
  return generatedContent.value[platform]?.content?.length || 0
}

const getMaxLength = (platform: string) => {
  const selectedPlatformConfig = platforms.find(p => p.key === platform)
  return selectedPlatformConfig?.maxLength || 1000
}

const downloadReport = (platform: string) => {
  const content = generatedContent.value[platform]
  if (!content) return

  const reportContent = `# ${content.title || content.subject}\n\n${content.content}\n\n---\nGenerated: ${new Date().toLocaleString()}\nEvent: ${props.eventData.event?.title}`
  const blob = new Blob([reportContent], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${platform}-report-${Date.now()}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)

  showSnackbar('Report downloaded successfully!', 'success')
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  if (score >= 40) return 'orange'
  return 'error'
}

const showSnackbar = (text: string, color: string = 'success') => {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

// Initialize
onMounted(() => {
  if (props.eventData) {
    generateAllContent()
  }
})
</script>

<style scoped>
.shareable-content-panel {
  border-radius: 16px;
  overflow: hidden;
}

.platform-tab {
  text-transform: none !important;
}

.content-preview-card {
  border-radius: 12px;
  min-height: 300px;
}

.linkedin-preview {
  background: #f3f2ef;
  border-radius: 8px;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.twitter-preview {
  background: #ffffff;
  border: 1px solid #e1e8ed;
  border-radius: 16px;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Ubuntu, sans-serif;
}

.email-preview {
  background: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  font-family: Arial, sans-serif;
}

.email-content {
  white-space: pre-wrap;
  max-height: 300px;
  overflow-y: auto;
}

.generic-preview {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 16px;
}

.preview-content {
  line-height: 1.5;
  white-space: pre-wrap;
}

.preview-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding-bottom: 8px;
}

.email-header {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
}

.slack-preview {
  background: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.slack-content {
  white-space: pre-wrap;
  line-height: 1.4;
  font-size: 14px;
}

.executive-brief-preview {
  background: #fafafa;
  border: 2px solid #1976d2;
  border-radius: 8px;
  padding: 20px;
  font-family: 'Times New Roman', serif;
}

.industry-report-preview {
  background: #fff8e1;
  border: 1px solid #ff9800;
  border-radius: 8px;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}
</style>
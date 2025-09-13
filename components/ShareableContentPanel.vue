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

              <div v-else-if="platform.key === 'email'" class="email-preview">
                <div class="email-header mb-3">
                  <div class="text-caption text--secondary">Subject:</div>
                  <div class="font-weight-medium">{{ generatedContent[platform.key]?.subject }}</div>
                </div>
                <v-divider class="mb-3" />
                <div class="preview-content email-content">
                  {{ generatedContent[platform.key]?.content }}
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

// Platform definitions
const platforms = [
  { key: 'linkedin', name: 'LinkedIn', icon: 'mdi-linkedin', color: 'blue darken-3', shareUrl: true },
  { key: 'twitter', name: 'Twitter', icon: 'mdi-twitter', color: 'light-blue', shareUrl: true },
  { key: 'instagram', name: 'Instagram', icon: 'mdi-instagram', color: 'pink', shareUrl: false },
  { key: 'facebook', name: 'Facebook', icon: 'mdi-facebook', color: 'indigo', shareUrl: true },
  { key: 'slack', name: 'Slack', icon: 'mdi-slack', color: 'purple', shareUrl: false },
  { key: 'email', name: 'Email', icon: 'mdi-email', color: 'grey darken-2', shareUrl: false }
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

// Content templates for customization
const contentTemplates = [
  { id: 1, name: 'Achievement Focus', type: 'achievement' },
  { id: 2, name: 'Networking Focus', type: 'networking' },
  { id: 3, name: 'Learning Focus', type: 'learning' },
  { id: 4, name: 'Collaboration Focus', type: 'collaboration' }
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
  // This would apply different content templates based on focus area
  // For now, we'll just show it's available
  showSnackbar(`${template.name} template applied!`, 'info')
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
  const platformConfig = {
    linkedin: 3000,
    twitter: 280,
    instagram: 2200,
    facebook: 63206,
    slack: 4000,
    email: 10000
  }
  return platformConfig[platform as keyof typeof platformConfig] || 1000
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
</style>
<template>
  <v-container>
    <v-card class="journey-card" elevation="8">
      <v-card-title class="text-h4 font-weight-bold primary white--text pa-6">
        <v-icon left large color="white">mdi-timeline-text</v-icon>
        Event Journey & Transformation
      </v-card-title>

      <v-card-text class="pa-6">
        <!-- Before/During/After Overview -->
        <v-row class="mb-8">
          <v-col cols="12" md="4">
            <v-card class="phase-card before-phase" elevation="3">
              <v-card-title class="text-center">
                <v-icon x-large color="grey">mdi-lightbulb-outline</v-icon>
              </v-card-title>
              <v-card-text class="text-center">
                <h3 class="text-h6 mb-2">BEFORE</h3>
                <div class="text-h3 font-weight-bold primary--text">{{ beforeMetrics.ideas }}</div>
                <div class="text-subtitle-1">scattered ideas</div>
                <v-divider class="my-3" />
                <div class="text-body-2">
                  <div>{{ beforeMetrics.participants }} participants registered</div>
                  <div>{{ beforeMetrics.connections }} existing connections</div>
                  <div>No clear agenda</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="phase-card during-phase" elevation="3">
              <v-card-title class="text-center">
                <v-icon x-large color="warning">mdi-account-group</v-icon>
              </v-card-title>
              <v-card-text class="text-center">
                <h3 class="text-h6 mb-2">DURING</h3>
                <div class="text-h3 font-weight-bold warning--text">{{ duringMetrics.activeParticipants }}</div>
                <div class="text-subtitle-1">active participants</div>
                <v-divider class="my-3" />
                <div class="text-body-2">
                  <div>{{ duringMetrics.topicsDiscussed }} topics discussed</div>
                  <div>{{ duringMetrics.votescast }} votes cast</div>
                  <div>{{ duringMetrics.roundsCompleted }} rounds completed</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="phase-card after-phase" elevation="3">
              <v-card-title class="text-center">
                <v-icon x-large color="success">mdi-rocket-launch</v-icon>
              </v-card-title>
              <v-card-text class="text-center">
                <h3 class="text-h6 mb-2">AFTER</h3>
                <div class="text-h3 font-weight-bold success--text">{{ afterMetrics.outcomes }}</div>
                <div class="text-subtitle-1">concrete outcomes</div>
                <v-divider class="my-3" />
                <div class="text-body-2">
                  <div>{{ afterMetrics.newConnections }} new connections</div>
                  <div>{{ afterMetrics.collaborations }} collaborations started</div>
                  <div>{{ afterMetrics.actionItems }} action items</div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Interactive Timeline -->
        <v-row class="mb-6">
          <v-col cols="12">
            <h3 class="text-h5 mb-4">Event Timeline</h3>
            <v-timeline>
              <v-timeline-item
                v-for="(event, index) in timelineEvents"
                :key="index"
                :color="event.color"
                :icon="event.icon"
                fill-dot
              >
                <template v-slot:opposite>
                  <span class="text-caption">{{ formatTime(event.time) }}</span>
                </template>

                <v-card class="timeline-card elevation-2">
                  <v-card-title class="text-h6">
                    {{ event.title }}
                  </v-card-title>
                  <v-card-text>
                    <p>{{ event.description }}</p>
                    <div v-if="event.metrics" class="mt-3">
                      <v-chip
                        v-for="(value, key) in event.metrics"
                        :key="key"
                        class="mr-2 mb-2"
                        small
                        :color="event.color"
                        text-color="white"
                      >
                        {{ key }}: {{ value }}
                      </v-chip>
                    </div>
                    <div v-if="event.participants" class="mt-3">
                      <v-avatar
                        v-for="participant in event.participants.slice(0, 5)"
                        :key="participant.id"
                        size="32"
                        class="mr-1"
                      >
                        <img :src="participant.avatar || '/default-avatar.png'" :alt="participant.name">
                      </v-avatar>
                      <span v-if="event.participants.length > 5" class="text-caption ml-2">
                        +{{ event.participants.length - 5 }} more
                      </span>
                    </div>
                  </v-card-text>
                </v-card>
              </v-timeline-item>
            </v-timeline>
          </v-col>
        </v-row>

        <!-- Participation Heatmap -->
        <v-row class="mb-6">
          <v-col cols="12">
            <h3 class="text-h5 mb-4">Engagement Heatmap</h3>
            <v-card elevation="2" class="pa-4">
              <canvas ref="heatmapCanvas" width="800" height="200"></canvas>
              <div class="text-center mt-3">
                <v-chip-group>
                  <v-chip small>Low</v-chip>
                  <v-chip small color="warning">Medium</v-chip>
                  <v-chip small color="success">High</v-chip>
                  <v-chip small color="error">Peak</v-chip>
                </v-chip-group>
              </div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Key Transformations -->
        <v-row class="mb-6">
          <v-col cols="12">
            <h3 class="text-h5 mb-4">Key Transformations</h3>
            <v-row>
              <v-col v-for="transformation in transformations" :key="transformation.id" cols="12" md="6">
                <v-card class="transformation-card" elevation="2">
                  <v-card-text>
                    <v-row align="center">
                      <v-col cols="5" class="text-center">
                        <div class="text-caption mb-1">FROM</div>
                        <div class="text-h6 grey--text">{{ transformation.from }}</div>
                      </v-col>
                      <v-col cols="2" class="text-center">
                        <v-icon color="primary">mdi-arrow-right</v-icon>
                      </v-col>
                      <v-col cols="5" class="text-center">
                        <div class="text-caption mb-1">TO</div>
                        <div class="text-h6 success--text font-weight-bold">{{ transformation.to }}</div>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>

        <!-- Shareable Visual Summary -->
        <v-row>
          <v-col cols="12">
            <v-card class="share-visual-card" color="primary" dark elevation="4">
              <v-card-text class="text-center pa-6">
                <h3 class="text-h4 font-weight-bold mb-4">Share This Journey</h3>
                <div class="visual-summary" ref="visualSummary">
                  <canvas ref="summaryCanvas" width="1200" height="630"></canvas>
                </div>
                <v-row justify="center" class="mt-6">
                  <v-col cols="auto">
                    <v-btn large color="white" class="primary--text" @click="downloadImage">
                      <v-icon left>mdi-download</v-icon>
                      Download Image
                    </v-btn>
                  </v-col>
                  <v-col cols="auto">
                    <v-btn large color="white" class="primary--text" @click="shareImage">
                      <v-icon left>mdi-share-variant</v-icon>
                      Share Image
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps<{
  eventId: string
}>()

// Refs
const heatmapCanvas = ref<HTMLCanvasElement>()
const summaryCanvas = ref<HTMLCanvasElement>()
const visualSummary = ref<HTMLDivElement>()

// Data
const beforeMetrics = ref({
  ideas: 0,
  participants: 0,
  connections: 0
})

const duringMetrics = ref({
  activeParticipants: 0,
  topicsDiscussed: 0,
  votescast: 0,
  roundsCompleted: 0
})

const afterMetrics = ref({
  outcomes: 0,
  newConnections: 0,
  collaborations: 0,
  actionItems: 0
})

const timelineEvents = ref<any[]>([])
const transformations = ref<any[]>([])
const engagementData = ref<number[]>([])

// Fetch journey data
async function fetchJourneyData() {
  try {
    const response = await $fetch(`/api/events/${props.eventId}/journey`, {
      method: 'GET'
    })

    // Update metrics
    beforeMetrics.value = response.before
    duringMetrics.value = response.during
    afterMetrics.value = response.after
    timelineEvents.value = response.timeline
    transformations.value = response.transformations
    engagementData.value = response.engagement

    // Draw visualizations
    await nextTick()
    drawHeatmap()
    drawSummaryCanvas()
  } catch (error) {
    console.error('Error fetching journey data:', error)
    // Use mock data for now
    generateMockData()
  }
}

// Generate mock data for demonstration
function generateMockData() {
  beforeMetrics.value = {
    ideas: 47,
    participants: 35,
    connections: 12
  }

  duringMetrics.value = {
    activeParticipants: 32,
    topicsDiscussed: 15,
    votescast: 280,
    roundsCompleted: 4
  }

  afterMetrics.value = {
    outcomes: 23,
    newConnections: 89,
    collaborations: 7,
    actionItems: 45
  }

  timelineEvents.value = [
    {
      time: new Date(Date.now() - 7200000),
      title: 'Event Kickoff',
      description: 'Welcome and introduction to unconference format',
      color: 'primary',
      icon: 'mdi-flag',
      metrics: { 'Attendees': 35, 'Energy': 'High' }
    },
    {
      time: new Date(Date.now() - 6300000),
      title: 'Topic Generation',
      description: 'Participants proposed and pitched their discussion topics',
      color: 'warning',
      icon: 'mdi-lightbulb',
      metrics: { 'Topics': 47, 'Proposers': 18 }
    },
    {
      time: new Date(Date.now() - 5400000),
      title: 'Voting Round',
      description: 'Democratic selection of topics through participant voting',
      color: 'success',
      icon: 'mdi-vote',
      metrics: { 'Votes': 280, 'Top Topics': 15 }
    },
    {
      time: new Date(Date.now() - 4500000),
      title: 'Round 1 Discussions',
      description: 'First round of breakout sessions',
      color: 'primary',
      icon: 'mdi-account-group',
      metrics: { 'Sessions': 5, 'Participants': 32 }
    },
    {
      time: new Date(Date.now() - 2700000),
      title: 'Collaboration Formation',
      description: 'Teams formed around project ideas',
      color: 'error',
      icon: 'mdi-handshake',
      metrics: { 'Projects': 7, 'Team Members': 24 }
    },
    {
      time: new Date(Date.now() - 900000),
      title: 'Closing & Next Steps',
      description: 'Action items defined and commitments made',
      color: 'success',
      icon: 'mdi-calendar-check',
      metrics: { 'Actions': 45, 'Follow-ups': 12 }
    }
  ]

  transformations.value = [
    { id: 1, from: '47 scattered ideas', to: '15 focused topics' },
    { id: 2, from: '35 individuals', to: '89 connections' },
    { id: 3, from: '0 projects', to: '7 collaborations' },
    { id: 4, from: 'No clear plan', to: '45 action items' }
  ]

  // Generate engagement data (hourly)
  engagementData.value = Array.from({ length: 24 }, () => Math.floor(Math.random() * 100))

  // Draw visualizations
  nextTick(() => {
    drawHeatmap()
    drawSummaryCanvas()
  })
}

// Draw engagement heatmap
function drawHeatmap() {
  if (!heatmapCanvas.value) return

  const ctx = heatmapCanvas.value.getContext('2d')
  if (!ctx) return

  const width = heatmapCanvas.value.width
  const height = heatmapCanvas.value.height
  const cellWidth = width / 24
  const cellHeight = height

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Draw heatmap cells
  engagementData.value.forEach((value, hour) => {
    const intensity = value / 100
    const color = getHeatmapColor(intensity)

    ctx.fillStyle = color
    ctx.fillRect(hour * cellWidth, 0, cellWidth - 2, cellHeight)

    // Add hour labels
    if (hour % 3 === 0) {
      ctx.fillStyle = '#666'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${hour}:00`, hour * cellWidth + cellWidth / 2, height - 5)
    }
  })
}

// Draw summary canvas for sharing
function drawSummaryCanvas() {
  if (!summaryCanvas.value) return

  const ctx = summaryCanvas.value.getContext('2d')
  if (!ctx) return

  const width = summaryCanvas.value.width
  const height = summaryCanvas.value.height

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#667eea')
  gradient.addColorStop(1, '#764ba2')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  // Title
  ctx.fillStyle = 'white'
  ctx.font = 'bold 48px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('Event Impact Journey', width / 2, 80)

  // Before/During/After boxes
  const boxWidth = 300
  const boxHeight = 200
  const boxY = 150
  const spacing = (width - boxWidth * 3) / 4

  // Before box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.fillRect(spacing, boxY, boxWidth, boxHeight)
  ctx.fillStyle = '#333'
  ctx.font = 'bold 24px Arial'
  ctx.fillText('BEFORE', spacing + boxWidth / 2, boxY + 40)
  ctx.font = 'bold 48px Arial'
  ctx.fillStyle = '#666'
  ctx.fillText(`${beforeMetrics.value.ideas}`, spacing + boxWidth / 2, boxY + 110)
  ctx.font = '18px Arial'
  ctx.fillText('scattered ideas', spacing + boxWidth / 2, boxY + 140)

  // During box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.fillRect(spacing * 2 + boxWidth, boxY, boxWidth, boxHeight)
  ctx.fillStyle = '#333'
  ctx.font = 'bold 24px Arial'
  ctx.fillText('DURING', spacing * 2 + boxWidth + boxWidth / 2, boxY + 40)
  ctx.font = 'bold 48px Arial'
  ctx.fillStyle = '#ff9800'
  ctx.fillText(`${duringMetrics.value.activeParticipants}`, spacing * 2 + boxWidth + boxWidth / 2, boxY + 110)
  ctx.font = '18px Arial'
  ctx.fillStyle = '#333'
  ctx.fillText('active participants', spacing * 2 + boxWidth + boxWidth / 2, boxY + 140)

  // After box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.fillRect(spacing * 3 + boxWidth * 2, boxY, boxWidth, boxHeight)
  ctx.fillStyle = '#333'
  ctx.font = 'bold 24px Arial'
  ctx.fillText('AFTER', spacing * 3 + boxWidth * 2 + boxWidth / 2, boxY + 40)
  ctx.font = 'bold 48px Arial'
  ctx.fillStyle = '#4caf50'
  ctx.fillText(`${afterMetrics.value.outcomes}`, spacing * 3 + boxWidth * 2 + boxWidth / 2, boxY + 110)
  ctx.font = '18px Arial'
  ctx.fillStyle = '#333'
  ctx.fillText('concrete outcomes', spacing * 3 + boxWidth * 2 + boxWidth / 2, boxY + 140)

  // Bottom stats
  ctx.fillStyle = 'white'
  ctx.font = '24px Arial'
  ctx.textAlign = 'center'
  const statsY = 450
  const statSpacing = width / 4

  ctx.fillText(`🤝 ${afterMetrics.value.newConnections} Connections`, statSpacing, statsY)
  ctx.fillText(`🚀 ${afterMetrics.value.collaborations} Collaborations`, statSpacing * 2, statsY)
  ctx.fillText(`✅ ${afterMetrics.value.actionItems} Action Items`, statSpacing * 3, statsY)

  // Footer
  ctx.font = '18px Arial'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.fillText('Powered by Unconference Platform', width / 2, height - 40)
}

// Helper functions
function formatTime(time: Date) {
  return new Date(time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getHeatmapColor(intensity: number) {
  if (intensity < 0.25) return '#e3f2fd'
  if (intensity < 0.5) return '#90caf9'
  if (intensity < 0.75) return '#42a5f5'
  return '#1e88e5'
}

async function downloadImage() {
  if (!summaryCanvas.value) return

  const link = document.createElement('a')
  link.download = 'event-journey.png'
  link.href = summaryCanvas.value.toDataURL()
  link.click()
}

async function shareImage() {
  if (!summaryCanvas.value) return

  try {
    const blob = await new Promise<Blob>((resolve) => {
      summaryCanvas.value?.toBlob((blob) => resolve(blob!))
    })

    const file = new File([blob], 'event-journey.png', { type: 'image/png' })

    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: 'My Event Journey',
        text: 'Check out the amazing transformation from our unconference event!'
      })
    } else {
      // Fallback to download
      downloadImage()
    }
  } catch (error) {
    console.error('Error sharing image:', error)
  }
}

// Initialize
onMounted(() => {
  fetchJourneyData()
})
</script>

<style scoped>
.journey-card {
  border-radius: 16px;
  overflow: hidden;
}

.phase-card {
  border-radius: 12px;
  transition: all 0.3s;
  height: 100%;
}

.phase-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.15);
}

.before-phase {
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
}

.during-phase {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
}

.after-phase {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.timeline-card {
  border-radius: 12px;
}

.transformation-card {
  border-radius: 12px;
  background: linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%);
}

.share-visual-card {
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.visual-summary {
  background: white;
  border-radius: 12px;
  padding: 16px;
  display: inline-block;
}

canvas {
  max-width: 100%;
  height: auto;
}
</style>
<template>
  <v-card class="sankey-flow-chart" elevation="4">
    <v-card-title class="text-h6 font-weight-bold primary white--text">
      <v-icon left color="white">mdi-chart-sankey</v-icon>
      {{ title }}
    </v-card-title>

    <v-card-text class="pa-6">
      <!-- Chart Loading State -->
      <v-row v-if="loading" justify="center" class="py-8">
        <v-col cols="auto">
          <v-progress-circular indeterminate color="primary" size="64" />
          <div class="text-center mt-4 text-h6">Building your impact flow...</div>
        </v-col>
      </v-row>

      <!-- Chart Container -->
      <div v-else>
        <div ref="chartContainer" class="sankey-container" />
        
        <!-- Chart Legend -->
        <v-row class="mt-4">
          <v-col cols="12">
            <div class="d-flex flex-wrap justify-center">
              <v-chip
                v-for="category in legendCategories"
                :key="category.key"
                :color="category.color"
                text-color="white"
                class="ma-1"
                small
              >
                <v-icon left small>{{ category.icon }}</v-icon>
                {{ category.label }}
              </v-chip>
            </div>
          </v-col>
        </v-row>

        <!-- Flow Statistics -->
        <v-row class="mt-6">
          <v-col cols="12" md="3">
            <v-card outlined class="text-center pa-4">
              <div class="text-h4 primary--text font-weight-bold">{{ flowStats.topicsEngaged }}</div>
              <div class="text-body-2 text--secondary">Topics Engaged</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card outlined class="text-center pa-4">
              <div class="text-h4 success--text font-weight-bold">{{ flowStats.ideasGenerated }}</div>
              <div class="text-body-2 text--secondary">Ideas Generated</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card outlined class="text-center pa-4">
              <div class="text-h4 warning--text font-weight-bold">{{ flowStats.followUpCommitments }}</div>
              <div class="text-body-2 text--secondary">Follow-up Commitments</div>
            </v-card>
          </v-col>
          <v-col cols="12" md="3">
            <v-card outlined class="text-center pa-4">
              <div class="text-h4 info--text font-weight-bold">{{ flowStats.peopleConnected }}</div>
              <div class="text-body-2 text--secondary">People Connected</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Most Promising Ideas -->
        <v-row class="mt-6" v-if="promisingIdeas.length > 0">
          <v-col cols="12">
            <v-card outlined>
              <v-card-title class="text-h6">
                <v-icon left color="yellow darken-2">mdi-lightbulb</v-icon>
                Most Promising Ideas
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col
                    v-for="(idea, index) in promisingIdeas.slice(0, 3)"
                    :key="index"
                    cols="12"
                    md="4"
                  >
                    <v-card outlined class="h-100">
                      <v-card-subtitle class="pb-2">
                        <v-chip small :color="getTopicColor(idea.topic)" text-color="white">
                          {{ idea.topic }}
                        </v-chip>
                      </v-card-subtitle>
                      <v-card-text class="pt-0">
                        <div class="text-body-1 font-weight-medium mb-2">{{ idea.title }}</div>
                        <div class="text-body-2 text--secondary mb-3">{{ idea.description }}</div>
                        <div class="d-flex align-center justify-space-between">
                          <div class="text-caption">
                            <v-icon small color="primary">mdi-account-group</v-icon>
                            {{ idea.interestedCount }} interested
                          </div>
                          <v-rating
                            :value="idea.promisingScore"
                            color="amber"
                            background-color="grey lighten-2"
                            small
                            readonly
                            half-increments
                            dense
                          />
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-card-text>

    <!-- Action Buttons -->
    <v-card-actions class="px-6 pb-6">
      <v-btn color="primary" @click="exportChart">
        <v-icon left>mdi-download</v-icon>
        Export Chart
      </v-btn>
      <v-btn color="success" @click="shareFlow" :disabled="!chartData">
        <v-icon left>mdi-share-variant</v-icon>
        Share Flow
      </v-btn>
      <v-spacer />
      <v-btn text @click="refreshChart" :loading="loading">
        <v-icon left>mdi-refresh</v-icon>
        Refresh
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import * as d3 from 'd3'
import { sankey, sankeyLinkHorizontal } from 'd3-sankey'
import type { SankeyNode, SankeyLink } from 'd3-sankey'

interface FlowNode {
  id: string
  name: string
  category: 'topic' | 'idea' | 'followup' | 'person'
  value: number
  color?: string
}

interface FlowLink {
  source: string | FlowNode
  target: string | FlowNode
  value: number
}

interface IdeaData {
  topic: string
  title: string
  description: string
  interestedCount: number
  promisingScore: number
}

const props = defineProps<{
  eventData: any
  userId?: string
  title?: string
}>()

const chartContainer = ref<HTMLElement>()
const loading = ref(false)
const chartData = ref<{ nodes: FlowNode[], links: FlowLink[] } | null>(null)

const title = computed(() => props.title || 'Your Event Impact Flow')

// Sample data structure - in real implementation this would come from props.eventData
const flowStats = computed(() => ({
  topicsEngaged: chartData.value?.nodes.filter(n => n.category === 'topic').length || 0,
  ideasGenerated: chartData.value?.nodes.filter(n => n.category === 'idea').length || 0,
  followUpCommitments: chartData.value?.nodes.filter(n => n.category === 'followup').length || 0,
  peopleConnected: chartData.value?.nodes.filter(n => n.category === 'person').length || 0
}))

const promisingIdeas = computed(() => {
  // Extract most promising ideas from the data
  // In real implementation, this would be calculated from actual event data
  return [
    {
      topic: 'AI Ethics',
      title: 'Bias Detection Framework',
      description: 'A practical framework for identifying and mitigating AI bias in production systems',
      interestedCount: 8,
      promisingScore: 4.5
    },
    {
      topic: 'Climate Tech',
      title: 'Community Solar Sharing',
      description: 'Platform for neighborhoods to share renewable energy resources',
      interestedCount: 12,
      promisingScore: 4.2
    },
    {
      topic: 'Remote Work',
      title: 'Async Meeting Protocol',
      description: 'New methodology for conducting effective asynchronous team meetings',
      interestedCount: 6,
      promisingScore: 3.8
    }
  ]
})

const legendCategories = [
  { key: 'topic', label: 'Discussion Topics', color: 'primary', icon: 'mdi-forum' },
  { key: 'idea', label: 'Generated Ideas', color: 'success', icon: 'mdi-lightbulb' },
  { key: 'followup', label: 'Follow-up Commitments', color: 'warning', icon: 'mdi-rocket-launch' },
  { key: 'person', label: 'People Connected', color: 'info', icon: 'mdi-account-group' }
]

// Generate chart data from event data
const generateChartData = () => {
  if (!props.eventData) return null

  const nodes: FlowNode[] = []
  const links: FlowLink[] = []

  // Add user as the starting node
  nodes.push({
    id: 'you',
    name: 'You',
    category: 'person',
    value: 100,
    color: '#1976d2'
  })

  // Add topics you engaged with
  const engagedTopics = props.eventData.metrics?.topicsVotedFor || 3
  for (let i = 0; i < engagedTopics; i++) {
    const topicId = `topic_${i}`
    nodes.push({
      id: topicId,
      name: `Topic ${i + 1}`,
      category: 'topic',
      value: Math.random() * 50 + 20
    })

    // Link from you to topics
    links.push({
      source: 'you',
      target: topicId,
      value: Math.random() * 30 + 10
    })

    // Add ideas generated from each topic
    const ideasPerTopic = Math.floor(Math.random() * 3) + 1
    for (let j = 0; j < ideasPerTopic; j++) {
      const ideaId = `idea_${i}_${j}`
      nodes.push({
        id: ideaId,
        name: `Idea ${j + 1}`,
        category: 'idea',
        value: Math.random() * 40 + 15
      })

      // Link from topic to idea
      links.push({
        source: topicId,
        target: ideaId,
        value: Math.random() * 25 + 10
      })

      // Some ideas lead to follow-ups
      if (Math.random() > 0.6) {
        const followupId = `followup_${i}_${j}`
        nodes.push({
          id: followupId,
          name: `Follow-up ${j + 1}`,
          category: 'followup',
          value: Math.random() * 30 + 10
        })

        links.push({
          source: ideaId,
          target: followupId,
          value: Math.random() * 20 + 5
        })

        // Some follow-ups connect to other people
        if (Math.random() > 0.7) {
          const personId = `person_${i}_${j}`
          nodes.push({
            id: personId,
            name: `Collaborator ${j + 1}`,
            category: 'person',
            value: Math.random() * 25 + 10
          })

          links.push({
            source: followupId,
            target: personId,
            value: Math.random() * 15 + 5
          })
        }
      }
    }
  }

  return { nodes, links }
}

const getTopicColor = (topic: string) => {
  const colors = ['primary', 'success', 'warning', 'info', 'purple', 'teal']
  return colors[topic.length % colors.length]
}

const getCategoryColor = (category: string) => {
  const colorMap = {
    topic: '#1976d2',      // primary
    idea: '#4caf50',       // success  
    followup: '#ff9800',   // warning
    person: '#2196f3'      // info
  }
  return colorMap[category as keyof typeof colorMap] || '#9e9e9e'
}

const drawChart = () => {
  if (!chartContainer.value || !chartData.value) return

  // Clear previous chart
  d3.select(chartContainer.value).selectAll('*').remove()

  const margin = { top: 10, right: 10, bottom: 10, left: 10 }
  const width = 800 - margin.left - margin.right
  const height = 500 - margin.top - margin.bottom

  const svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Create sankey generator
  const sankeyGenerator = sankey<FlowNode, FlowLink>()
    .nodeId((d: FlowNode) => d.id)
    .nodeWidth(15)
    .nodePadding(10)
    .extent([[1, 1], [width - 1, height - 6]])

  // Process data
  const sankeyData = sankeyGenerator({
    nodes: chartData.value.nodes.map(d => ({ ...d })),
    links: chartData.value.links.map(d => ({ ...d }))
  })

  // Draw links
  svg.append('g')
    .selectAll('path')
    .data(sankeyData.links)
    .enter()
    .append('path')
    .attr('d', sankeyLinkHorizontal())
    .attr('stroke', (d: any) => getCategoryColor((d.source as FlowNode).category))
    .attr('stroke-opacity', 0.4)
    .attr('stroke-width', (d: any) => Math.max(1, d.width || 0))
    .attr('fill', 'none')
    .on('mouseover', function(this: SVGPathElement, event: any, d: any) {
      d3.select(this).attr('stroke-opacity', 0.8)
    })
    .on('mouseout', function(this: SVGPathElement, event: any, d: any) {
      d3.select(this).attr('stroke-opacity', 0.4)
    })

  // Draw nodes
  const node = svg.append('g')
    .selectAll('rect')
    .data(sankeyData.nodes)
    .enter()
    .append('rect')
    .attr('x', (d: any) => d.x0!)
    .attr('y', (d: any) => d.y0!)
    .attr('height', (d: any) => d.y1! - d.y0!)
    .attr('width', (d: any) => d.x1! - d.x0!)
    .attr('fill', (d: FlowNode) => getCategoryColor(d.category))
    .attr('stroke', '#000')
    .attr('stroke-width', 0.5)

  // Add node labels
  svg.append('g')
    .selectAll('text')
    .data(sankeyData.nodes)
    .enter()
    .append('text')
    .attr('x', (d: any) => d.x0! < width / 2 ? d.x1! + 6 : d.x0! - 6)
    .attr('y', (d: any) => (d.y1! + d.y0!) / 2)
    .attr('dy', '0.35em')
    .attr('text-anchor', (d: any) => d.x0! < width / 2 ? 'start' : 'end')
    .text((d: FlowNode) => d.name)
    .attr('font-size', '12px')
    .attr('font-family', 'sans-serif')
    .attr('fill', '#333')

  // Add tooltips
  node.append('title')
    .text((d: FlowNode) => `${d.name}\nCategory: ${d.category}\nValue: ${d.value}`)
}

const refreshChart = async () => {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
    chartData.value = generateChartData()
    await nextTick()
    drawChart()
  } finally {
    loading.value = false
  }
}

const exportChart = () => {
  if (!chartContainer.value) return

  const svg = chartContainer.value.querySelector('svg')
  if (!svg) return

  const serializer = new XMLSerializer()
  const svgString = serializer.serializeToString(svg)
  const blob = new Blob([svgString], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `event-flow-chart-${Date.now()}.svg`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const shareFlow = () => {
  // Implementation for sharing the flow chart
  if (navigator.share) {
    navigator.share({
      title: 'My Event Impact Flow',
      text: `Check out my impact flow from ${props.eventData?.event?.title}!`,
      url: window.location.href
    })
  } else {
    // Fallback to copying URL
    navigator.clipboard.writeText(window.location.href)
  }
}

// Watch for data changes
watch(() => props.eventData, () => {
  chartData.value = generateChartData()
  nextTick(() => drawChart())
}, { immediate: true, deep: true })

onMounted(() => {
  refreshChart()
})
</script>

<style scoped>
.sankey-container {
  min-height: 500px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.sankey-container svg {
  max-width: 100%;
  height: auto;
}
</style>

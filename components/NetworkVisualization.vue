<template>
  <div class="network-visualization">
    <v-card elevation="4" class="network-card">
      <v-card-title class="text-h5 font-weight-bold info white--text">
        <v-icon left color="white">mdi-graph</v-icon>
        Network Visualization
        <v-spacer />
        <v-btn-toggle v-model="viewType" mandatory class="network-view-toggle">
          <v-btn small value="force" color="white" text>
            <v-icon small>mdi-vector-circle</v-icon>
          </v-btn>
          <v-btn small value="cluster" color="white" text>
            <v-icon small>mdi-graph-outline</v-icon>
          </v-btn>
          <v-btn small value="hierarchy" color="white" text>
            <v-icon small>mdi-file-tree</v-icon>
          </v-btn>
        </v-btn-toggle>
      </v-card-title>

      <v-card-text class="pa-0">
        <!-- Network Stats Panel -->
        <div class="network-stats-panel pa-4" v-if="networkStats">
          <v-row>
            <v-col cols="6" md="3" class="text-center">
              <div class="stat-item">
                <div class="text-h5 font-weight-bold primary--text">{{ networkStats.totalNodes }}</div>
                <div class="text-caption">Network Size</div>
              </div>
            </v-col>
            <v-col cols="6" md="3" class="text-center">
              <div class="stat-item">
                <div class="text-h5 font-weight-bold success--text">{{ networkStats.strongConnections }}</div>
                <div class="text-caption">Strong Ties</div>
              </div>
            </v-col>
            <v-col cols="6" md="3" class="text-center">
              <div class="stat-item">
                <div class="text-h5 font-weight-bold warning--text">{{ networkStats.clusters }}</div>
                <div class="text-caption">Communities</div>
              </div>
            </v-col>
            <v-col cols="6" md="3" class="text-center">
              <div class="stat-item">
                <div class="text-h5 font-weight-bold info--text">{{ networkStats.influenceScore }}</div>
                <div class="text-caption">Influence</div>
              </div>
            </v-col>
          </v-row>
        </div>

        <!-- SVG Container for D3 Visualization -->
        <div ref="networkContainer" class="network-container" :style="{ height: containerHeight + 'px' }">
          <svg
            ref="networkSvg"
            :width="containerWidth"
            :height="containerHeight"
            class="network-svg"
          >
            <!-- D3 will render here -->
          </svg>
        </div>

        <!-- Interactive Controls -->
        <div class="network-controls pa-4">
          <v-row align="center">
            <v-col cols="12" md="6">
              <div class="control-group">
                <v-label class="text-caption">Connection Strength Filter:</v-label>
                <v-range-slider
                  v-model="strengthFilter"
                  :min="0"
                  :max="100"
                  step="5"
                  thumb-label
                  class="mt-2"
                  @input="updateVisualization"
                >
                  <template v-slot:thumb-label="{ value }">
                    {{ value }}
                  </template>
                </v-range-slider>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="control-group">
                <v-label class="text-caption">Highlight Category:</v-label>
                <v-select
                  v-model="highlightCategory"
                  :items="categories"
                  item-text="name"
                  item-value="value"
                  dense
                  outlined
                  class="mt-2"
                  @change="updateVisualization"
                />
              </div>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
    </v-card>

    <!-- Node Details Panel -->
    <v-dialog v-model="showNodeDetails" max-width="600">
      <v-card v-if="selectedNode">
        <v-card-title class="primary white--text">
          <v-avatar :color="getNodeColor(selectedNode)" size="40" class="mr-3">
            <span class="white--text">{{ getNodeInitials(selectedNode.name) }}</span>
          </v-avatar>
          <div>
            <div class="text-h6">{{ selectedNode.name }}</div>
            <div class="text-caption">{{ selectedNode.role || 'Professional Connection' }}</div>
          </div>
        </v-card-title>

        <v-card-text class="pa-6">
          <v-row>
            <v-col cols="12" md="6">
              <div class="detail-section mb-4">
                <h4 class="text-subtitle-1 font-weight-bold mb-2">Connection Details</h4>
                <div class="detail-item mb-2">
                  <strong>Quality Score:</strong>
                  <v-chip small :color="getQualityColor(selectedNode.qualityScore)" class="ml-2">
                    {{ selectedNode.qualityScore || 50 }}
                  </v-chip>
                </div>
                <div class="detail-item mb-2">
                  <strong>Connection Strength:</strong> {{ selectedNode.connectionStrength || 'Medium' }}
                </div>
                <div class="detail-item mb-2">
                  <strong>Mutual Connections:</strong> {{ selectedNode.mutualConnections || 0 }}
                </div>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="detail-section mb-4">
                <h4 class="text-subtitle-1 font-weight-bold mb-2">Shared Interests</h4>
                <div v-if="selectedNode.sharedTopics?.length > 0">
                  <v-chip
                    v-for="topic in selectedNode.sharedTopics"
                    :key="topic"
                    small
                    outlined
                    color="primary"
                    class="mr-1 mb-1"
                  >
                    {{ topic }}
                  </v-chip>
                </div>
                <div v-else class="text-caption text--secondary">
                  No shared topics recorded
                </div>
              </div>
            </v-col>
          </v-row>

          <div class="detail-section">
            <h4 class="text-subtitle-1 font-weight-bold mb-2">Network Insights</h4>
            <v-list dense>
              <v-list-item>
                <v-list-item-icon>
                  <v-icon color="info">mdi-account-network</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Bridge Connections: {{ selectedNode.bridgeConnections || 0 }}</v-list-item-title>
                  <v-list-item-subtitle>Connects different network clusters</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
              <v-list-item>
                <v-list-item-icon>
                  <v-icon color="warning">mdi-trending-up</v-icon>
                </v-list-item-icon>
                <v-list-item-content>
                  <v-list-item-title>Influence Score: {{ selectedNode.influenceScore || 0 }}</v-list-item-title>
                  <v-list-item-subtitle>Network positioning strength</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </v-list>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-btn color="primary" @click="initiateFollowUp(selectedNode)">
            <v-icon left>mdi-message</v-icon>
            Follow Up
          </v-btn>
          <v-btn color="success" outlined @click="viewConnectionHistory(selectedNode)">
            <v-icon left>mdi-history</v-icon>
            View History
          </v-btn>
          <v-spacer />
          <v-btn text @click="showNodeDetails = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch } from 'vue'
import * as d3 from 'd3'

const props = defineProps<{
  networkData?: any
  userId?: string
  height?: number
}>()

// Component state
const networkContainer = ref<HTMLElement>()
const networkSvg = ref<SVGElement>()
const containerWidth = ref(800)
const containerHeight = ref(props.height || 500)
const viewType = ref<'force' | 'cluster' | 'hierarchy'>('force')

// Visualization state
const strengthFilter = ref([20, 100])
const highlightCategory = ref('all')
const selectedNode = ref<any>(null)
const showNodeDetails = ref(false)
const networkStats = ref<any>(null)

// Control options
const categories = ref([
  { name: 'All Connections', value: 'all' },
  { name: 'High Quality', value: 'high_quality' },
  { name: 'Recent Connections', value: 'recent' },
  { name: 'Strong Ties', value: 'strong' },
  { name: 'Professional', value: 'professional' },
  { name: 'Industry Peers', value: 'industry' }
])

// D3 visualization variables
let simulation: d3.Simulation<any, any> | null = null
let nodes: any[] = []
let links: any[] = []

// Sample network data
const sampleNetworkData = {
  nodes: [
    { id: 'user', name: 'You', role: 'Your Position', type: 'user', qualityScore: 100, x: 400, y: 250 },
    { id: '1', name: 'Dr. Sarah Chen', role: 'AI Ethics Lead', type: 'connection', qualityScore: 92, category: 'professional', sharedTopics: ['AI Ethics', 'Governance'], connectionStrength: 'strong' },
    { id: '2', name: 'Marcus Rodriguez', role: 'CTO', type: 'connection', qualityScore: 88, category: 'professional', sharedTopics: ['Leadership', 'Technology'], connectionStrength: 'medium' },
    { id: '3', name: 'Lisa Thompson', role: 'Product Manager', type: 'connection', qualityScore: 79, category: 'professional', sharedTopics: ['Product', 'Strategy'], connectionStrength: 'medium' },
    { id: '4', name: 'Alex Kim', role: 'Startup Founder', type: 'connection', qualityScore: 85, category: 'industry', sharedTopics: ['Entrepreneurship'], connectionStrength: 'strong' },
    { id: '5', name: 'Jordan Walsh', role: 'Data Scientist', type: 'connection', qualityScore: 67, category: 'professional', sharedTopics: ['Data Science', 'ML'], connectionStrength: 'weak' },
    { id: '6', name: 'Emily Park', role: 'UX Designer', type: 'connection', qualityScore: 74, category: 'professional', sharedTopics: ['Design', 'UX'], connectionStrength: 'medium' },
    { id: '7', name: 'David Brown', role: 'VP Engineering', type: 'connection', qualityScore: 91, category: 'professional', sharedTopics: ['Engineering', 'Leadership'], connectionStrength: 'strong' },
    { id: '8', name: 'Maria Garcia', role: 'Research Lead', type: 'connection', qualityScore: 83, category: 'industry', sharedTopics: ['Research', 'Innovation'], connectionStrength: 'medium' }
  ],
  links: [
    { source: 'user', target: '1', strength: 92, type: 'direct' },
    { source: 'user', target: '2', strength: 88, type: 'direct' },
    { source: 'user', target: '3', strength: 79, type: 'direct' },
    { source: 'user', target: '4', strength: 85, type: 'direct' },
    { source: 'user', target: '5', strength: 67, type: 'direct' },
    { source: 'user', target: '6', strength: 74, type: 'direct' },
    { source: 'user', target: '7', strength: 91, type: 'direct' },
    { source: 'user', target: '8', strength: 83, type: 'direct' },
    { source: '1', target: '2', strength: 45, type: 'mutual' },
    { source: '2', target: '7', strength: 67, type: 'mutual' },
    { source: '3', target: '6', strength: 52, type: 'mutual' },
    { source: '4', target: '8', strength: 38, type: 'mutual' },
    { source: '1', target: '8', strength: 41, type: 'mutual' }
  ]
}

// Computed network statistics
const calculateNetworkStats = (data: any) => {
  const totalNodes = data.nodes.length - 1 // Exclude user node
  const strongConnections = data.links.filter((l: any) => l.strength >= 80 && l.source === 'user').length
  const clusters = Math.ceil(totalNodes / 3) // Simple clustering estimation
  const influenceScore = Math.round(data.nodes.reduce((sum: number, node: any) => {
    return sum + (node.qualityScore || 0)
  }, 0) / totalNodes)

  return {
    totalNodes,
    strongConnections,
    clusters,
    influenceScore
  }
}

// D3 Helper Functions
const getNodeColor = (node: any) => {
  if (node.type === 'user') return '#1976d2'
  if (node.qualityScore >= 85) return '#4caf50'
  if (node.qualityScore >= 70) return '#ff9800'
  if (node.qualityScore >= 50) return '#2196f3'
  return '#9e9e9e'
}

const getNodeRadius = (node: any) => {
  if (node.type === 'user') return 20
  return 8 + (node.qualityScore / 100) * 12
}

const getLinkColor = (link: any) => {
  if (link.type === 'direct') {
    if (link.strength >= 80) return '#4caf50'
    if (link.strength >= 60) return '#ff9800'
    return '#2196f3'
  }
  return '#bdbdbd'
}

const getLinkWidth = (link: any) => {
  return 1 + (link.strength / 100) * 4
}

const getNodeInitials = (name: string) => {
  return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2)
}

const getQualityColor = (score: number) => {
  if (score >= 85) return 'success'
  if (score >= 70) return 'warning'
  if (score >= 50) return 'primary'
  return 'grey'
}

// Visualization Methods
const initializeVisualization = () => {
  if (!networkSvg.value) return

  const data = props.networkData || sampleNetworkData
  nodes = [...data.nodes]
  links = [...data.links]

  networkStats.value = calculateNetworkStats(data)

  // Clear existing visualization
  d3.select(networkSvg.value).selectAll('*').remove()

  // Create SVG groups
  const svg = d3.select(networkSvg.value)
  const linkGroup = svg.append('g').attr('class', 'links')
  const nodeGroup = svg.append('g').attr('class', 'nodes')

  renderVisualization()
}

const renderVisualization = () => {
  if (!networkSvg.value) return

  const svg = d3.select(networkSvg.value)
  const width = containerWidth.value
  const height = containerHeight.value

  // Filter data based on controls
  const filteredLinks = links.filter(link => {
    const linkStrength = link.strength || 50
    return linkStrength >= strengthFilter.value[0] && linkStrength <= strengthFilter.value[1]
  })

  const filteredNodes = nodes.filter(node => {
    if (highlightCategory.value === 'all') return true
    if (highlightCategory.value === 'high_quality') return node.qualityScore >= 80
    if (highlightCategory.value === 'strong') return node.connectionStrength === 'strong'
    return node.category === highlightCategory.value
  })

  // Create force simulation
  simulation = d3.forceSimulation(filteredNodes)
    .force('link', d3.forceLink(filteredLinks).id((d: any) => d.id).distance(d => 50 + (100 - (d as any).strength)))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => getNodeRadius(d) + 5))

  // Render links
  const linkSelection = svg.select('.links')
    .selectAll('line')
    .data(filteredLinks)

  linkSelection.enter()
    .append('line')
    .merge(linkSelection as any)
    .attr('stroke', getLinkColor)
    .attr('stroke-width', getLinkWidth)
    .attr('stroke-opacity', 0.6)

  linkSelection.exit().remove()

  // Render nodes
  const nodeSelection = svg.select('.nodes')
    .selectAll('g')
    .data(filteredNodes)

  const nodeEnter = nodeSelection.enter()
    .append('g')
    .attr('class', 'node')
    .style('cursor', 'pointer')
    .call(d3.drag<any, any>()
      .on('start', dragStarted)
      .on('drag', dragged)
      .on('end', dragEnded)
    )
    .on('click', (event, d) => {
      selectedNode.value = d
      showNodeDetails.value = true
    })

  // Add circles to nodes
  nodeEnter.append('circle')
    .attr('r', getNodeRadius)
    .attr('fill', getNodeColor)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)

  // Add labels to nodes
  nodeEnter.append('text')
    .attr('dy', -25)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .style('fill', '#333')
    .text(d => d.type === 'user' ? 'You' : d.name.split(' ')[0])

  // Update existing nodes
  nodeSelection.merge(nodeEnter as any)
    .select('circle')
    .attr('r', getNodeRadius)
    .attr('fill', getNodeColor)

  nodeSelection.exit().remove()

  // Update simulation
  simulation.on('tick', () => {
    svg.select('.links').selectAll('line')
      .attr('x1', (d: any) => d.source.x)
      .attr('y1', (d: any) => d.source.y)
      .attr('x2', (d: any) => d.target.x)
      .attr('y2', (d: any) => d.target.y)

    svg.select('.nodes').selectAll('g')
      .attr('transform', (d: any) => `translate(${d.x}, ${d.y})`)
  })
}

// Drag functions
const dragStarted = (event: any, d: any) => {
  if (!simulation) return
  if (!event.active) simulation.alphaTarget(0.3).restart()
  d.fx = d.x
  d.fy = d.y
}

const dragged = (event: any, d: any) => {
  d.fx = event.x
  d.fy = event.y
}

const dragEnded = (event: any, d: any) => {
  if (!simulation) return
  if (!event.active) simulation.alphaTarget(0)
  d.fx = null
  d.fy = null
}

const updateVisualization = () => {
  nextTick(() => {
    renderVisualization()
  })
}

// Action handlers
const initiateFollowUp = (node: any) => {
  console.log('Initiating follow-up with:', node.name)
  showNodeDetails.value = false
  // Emit event or call parent method
}

const viewConnectionHistory = (node: any) => {
  console.log('Viewing connection history for:', node.name)
  showNodeDetails.value = false
  // Emit event or call parent method
}

// Watchers
watch(viewType, () => {
  updateVisualization()
})

watch(() => props.networkData, () => {
  if (props.networkData) {
    initializeVisualization()
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  // Set container dimensions
  if (networkContainer.value) {
    const rect = networkContainer.value.getBoundingClientRect()
    containerWidth.value = rect.width || 800
  }

  nextTick(() => {
    initializeVisualization()
  })
})
</script>

<style scoped>
.network-visualization {
  width: 100%;
}

.network-card {
  border-radius: 12px;
  overflow: hidden;
}

.network-view-toggle {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.network-stats-panel {
  background: rgba(33, 150, 243, 0.05);
  border-bottom: 1px solid rgba(33, 150, 243, 0.1);
}

.stat-item {
  padding: 8px;
  text-align: center;
}

.network-container {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.network-svg {
  display: block;
  width: 100%;
  height: 100%;
}

.network-controls {
  background: #fafafa;
  border-top: 1px solid #e0e0e0;
}

.control-group {
  width: 100%;
}

/* Node hover effects */
:deep(.node circle) {
  transition: all 0.2s ease;
}

:deep(.node:hover circle) {
  stroke-width: 3px;
  filter: drop-shadow(0 0 6px rgba(0, 0, 0, 0.3));
}

:deep(.node text) {
  pointer-events: none;
  user-select: none;
}

/* Link styles */
:deep(.links line) {
  transition: stroke-opacity 0.2s ease;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .network-stats-panel .v-col {
    margin-bottom: 8px;
  }

  .control-group {
    margin-bottom: 16px;
  }
}
</style>
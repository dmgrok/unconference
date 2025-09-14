<template>
  <div class="cohort-analysis-chart">
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 250px;">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <div v-else-if="!data.length" class="d-flex justify-center align-center" style="height: 250px;">
      <div class="text-center">
        <v-icon size="48" color="grey-lighten-1">mdi-chart-gantt</v-icon>
        <div class="text-body-2 text-medium-emphasis mt-2">No cohort data available</div>
      </div>
    </div>
    <div v-else class="chart-content">
      <!-- Summary Stats -->
      <div class="cohort-summary mb-4">
        <v-row>
          <v-col cols="4">
            <div class="text-center">
              <div class="text-h6 font-weight-bold">{{ totalCohorts }}</div>
              <div class="text-caption text-medium-emphasis">Cohorts</div>
            </div>
          </v-col>
          <v-col cols="4">
            <div class="text-center">
              <div class="text-h6 font-weight-bold">{{ avgRetention.toFixed(1) }}%</div>
              <div class="text-caption text-medium-emphasis">Avg Retention</div>
            </div>
          </v-col>
          <v-col cols="4">
            <div class="text-center">
              <div class="text-h6 font-weight-bold">{{ totalUsers.toLocaleString() }}</div>
              <div class="text-caption text-medium-emphasis">Total Users</div>
            </div>
          </v-col>
        </v-row>
      </div>

      <!-- Chart -->
      <div ref="chartContainer" class="chart-container"></div>

      <!-- Cohort Table -->
      <div class="cohort-table mt-4">
        <v-data-table
          :items="tableData"
          :headers="tableHeaders"
          density="compact"
          class="elevation-0"
          hide-default-footer
        >
          <template #item.cohortPeriod="{ item }">
            <span class="font-weight-medium">{{ item.cohortPeriod }}</span>
          </template>

          <template #item.retention="{ item }">
            <v-chip
              :color="getRetentionColor(item.retention)"
              size="small"
              class="font-weight-medium"
            >
              {{ item.retention.toFixed(1) }}%
            </v-chip>
          </template>

          <template #item.activeUsers="{ item }">
            <div class="d-flex align-center">
              <span>{{ item.activeUsers }}</span>
              <span class="text-caption text-medium-emphasis ml-1">
                / {{ item.totalUsers }}
              </span>
            </div>
          </template>
        </v-data-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import * as d3 from 'd3'

interface CohortData {
  cohortPeriod: string
  totalUsers: number
  activeUsers: number
}

interface Props {
  data: CohortData[]
  loading?: boolean
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  height: 200
})

const chartContainer = ref<HTMLElement>()

// Computed properties
const totalCohorts = computed(() => props.data.length)

const avgRetention = computed(() => {
  if (!props.data.length) return 0
  const totalRetention = props.data.reduce((sum, cohort) => {
    const retention = cohort.totalUsers > 0 ? (cohort.activeUsers / cohort.totalUsers) * 100 : 0
    return sum + retention
  }, 0)
  return totalRetention / props.data.length
})

const totalUsers = computed(() => {
  return props.data.reduce((sum, cohort) => sum + cohort.totalUsers, 0)
})

const tableData = computed(() => {
  return props.data.map(cohort => ({
    ...cohort,
    retention: cohort.totalUsers > 0 ? (cohort.activeUsers / cohort.totalUsers) * 100 : 0
  })).sort((a, b) => b.cohortPeriod.localeCompare(a.cohortPeriod))
})

const tableHeaders = [
  { title: 'Cohort', key: 'cohortPeriod', sortable: true },
  { title: 'Total Users', key: 'totalUsers', sortable: true },
  { title: 'Active Users', key: 'activeUsers', sortable: true },
  { title: 'Retention', key: 'retention', sortable: true }
]

// Methods
const getRetentionColor = (retention: number): string => {
  if (retention >= 80) return 'success'
  if (retention >= 60) return 'warning'
  if (retention >= 40) return 'orange'
  return 'error'
}

const drawChart = async () => {
  if (!chartContainer.value || !props.data.length) return

  // Clear previous chart
  d3.select(chartContainer.value).selectAll('*').remove()

  // Process data
  const processedData = props.data.map(d => ({
    ...d,
    retention: d.totalUsers > 0 ? (d.activeUsers / d.totalUsers) * 100 : 0
  })).sort((a, b) => a.cohortPeriod.localeCompare(b.cohortPeriod))

  // Dimensions and margins
  const margin = { top: 20, right: 30, bottom: 60, left: 60 }
  const width = chartContainer.value.clientWidth - margin.left - margin.right
  const height = props.height - margin.top - margin.bottom

  // Create SVG
  const svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Create scales
  const xScale = d3.scaleBand()
    .domain(processedData.map(d => d.cohortPeriod))
    .range([0, width])
    .padding(0.1)

  const yScale = d3.scaleLinear()
    .domain([0, 100]) // Retention percentage
    .range([height, 0])

  // Color scale for retention
  const colorScale = d3.scaleSequential()
    .domain([0, 100])
    .interpolator(d3.interpolateRdYlGn)

  // Create axes
  const xAxis = d3.axisBottom(xScale)
  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d => d + '%')

  // Add axes
  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
    .selectAll('text')
    .style('fill', 'rgb(var(--v-theme-on-surface))')
    .style('text-anchor', 'end')
    .attr('dx', '-.8em')
    .attr('dy', '.15em')
    .attr('transform', 'rotate(-45)')

  g.append('g')
    .attr('class', 'y-axis')
    .call(yAxis)
    .selectAll('text')
    .style('fill', 'rgb(var(--v-theme-on-surface))')

  // Add axis labels
  g.append('text')
    .attr('class', 'y-label')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('fill', 'rgb(var(--v-theme-on-surface))')
    .style('font-size', '12px')
    .text('Retention Rate (%)')

  g.append('text')
    .attr('class', 'x-label')
    .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
    .style('text-anchor', 'middle')
    .style('fill', 'rgb(var(--v-theme-on-surface))')
    .style('font-size', '12px')
    .text('Cohort Period')

  // Create tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'cohort-tooltip')
    .style('position', 'absolute')
    .style('padding', '12px')
    .style('background', 'rgb(var(--v-theme-surface))')
    .style('border', '1px solid rgb(var(--v-theme-outline))')
    .style('border-radius', '8px')
    .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('font-size', '12px')
    .style('z-index', 1000)

  // Add bars
  g.selectAll('.cohort-bar')
    .data(processedData)
    .enter().append('rect')
    .attr('class', 'cohort-bar')
    .attr('x', d => xScale(d.cohortPeriod)!)
    .attr('width', xScale.bandwidth())
    .attr('y', height)
    .attr('height', 0)
    .style('fill', d => colorScale(d.retention))
    .style('stroke', 'rgb(var(--v-theme-outline))')
    .style('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .style('stroke-width', 2)
        .style('stroke', 'rgb(var(--v-theme-primary))')

      tooltip
        .style('opacity', 1)
        .html(`
          <div style="color: rgb(var(--v-theme-on-surface))">
            <strong>${d.cohortPeriod}</strong><br/>
            Total Users: ${d.totalUsers.toLocaleString()}<br/>
            Active Users: ${d.activeUsers.toLocaleString()}<br/>
            Retention: ${d.retention.toFixed(1)}%
          </div>
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px')
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('stroke-width', 1)
        .style('stroke', 'rgb(var(--v-theme-outline))')

      tooltip.style('opacity', 0)
    })
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .attr('y', d => yScale(d.retention))
    .attr('height', d => height - yScale(d.retention))

  // Add value labels on bars
  g.selectAll('.bar-label')
    .data(processedData)
    .enter().append('text')
    .attr('class', 'bar-label')
    .attr('x', d => xScale(d.cohortPeriod)! + xScale.bandwidth() / 2)
    .attr('y', d => yScale(d.retention) - 5)
    .attr('text-anchor', 'middle')
    .style('fill', 'rgb(var(--v-theme-on-surface))')
    .style('font-size', '11px')
    .style('font-weight', '500')
    .style('opacity', 0)
    .text(d => d.retention.toFixed(0) + '%')
    .transition()
    .duration(800)
    .delay((d, i) => i * 100 + 400)
    .style('opacity', 1)

  // Add average line
  const avgY = yScale(avgRetention.value)
  g.append('line')
    .attr('class', 'avg-line')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', avgY)
    .attr('y2', avgY)
    .style('stroke', 'rgb(var(--v-theme-warning))')
    .style('stroke-width', 2)
    .style('stroke-dasharray', '5,5')
    .style('opacity', 0)
    .transition()
    .duration(800)
    .delay(600)
    .style('opacity', 0.8)

  // Add average label
  g.append('text')
    .attr('class', 'avg-label')
    .attr('x', width - 5)
    .attr('y', avgY - 5)
    .attr('text-anchor', 'end')
    .style('fill', 'rgb(var(--v-theme-warning))')
    .style('font-size', '11px')
    .style('font-weight', '500')
    .style('opacity', 0)
    .text(`Avg: ${avgRetention.value.toFixed(1)}%`)
    .transition()
    .duration(800)
    .delay(600)
    .style('opacity', 1)
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  if (props.data.length) {
    drawChart()
  }
})

// Watch for data changes
watch(() => props.data, async () => {
  await nextTick()
  drawChart()
}, { deep: true })

watch(() => props.loading, async (newVal) => {
  if (!newVal && props.data.length) {
    await nextTick()
    drawChart()
  }
})

// Cleanup tooltip on unmount
onUnmounted(() => {
  d3.selectAll('.cohort-tooltip').remove()
})
</script>

<style scoped>
.cohort-analysis-chart {
  width: 100%;
}

.chart-container {
  width: 100%;
  min-height: 200px;
}

.cohort-summary {
  background: rgb(var(--v-theme-surface-variant));
  border-radius: 8px;
  padding: 16px;
}

.cohort-table {
  max-height: 300px;
  overflow-y: auto;
}

:deep(.x-axis) line,
:deep(.x-axis) path,
:deep(.y-axis) line,
:deep(.y-axis) path {
  stroke: rgb(var(--v-theme-outline));
}

:deep(.cohort-bar) {
  transition: all 0.2s ease;
}

:deep(.cohort-bar:hover) {
  filter: brightness(1.1);
}
</style>
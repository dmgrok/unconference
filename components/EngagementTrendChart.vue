<template>
  <div class="engagement-trend-chart">
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 300px;">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <div v-else-if="!data.length" class="d-flex justify-center align-center" style="height: 300px;">
      <div class="text-center">
        <v-icon size="48" color="grey-lighten-1">mdi-chart-line-variant</v-icon>
        <div class="text-body-2 text-medium-emphasis mt-2">No engagement data available</div>
      </div>
    </div>
    <div v-else ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'

interface EngagementPoint {
  date: Date | string
  avgEngagement: number
  activeUsers: number
}

interface Props {
  data: EngagementPoint[]
  loading?: boolean
  height?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  height: 300
})

const chartContainer = ref<HTMLElement>()

const drawChart = async () => {
  if (!chartContainer.value || !props.data.length) return

  // Clear previous chart
  d3.select(chartContainer.value).selectAll('*').remove()

  // Process data
  const processedData = props.data.map(d => ({
    date: typeof d.date === 'string' ? new Date(d.date) : d.date,
    avgEngagement: d.avgEngagement,
    activeUsers: d.activeUsers
  })).sort((a, b) => a.date.getTime() - b.date.getTime())

  // Dimensions and margins
  const margin = { top: 20, right: 80, bottom: 40, left: 60 }
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
  const xScale = d3.scaleTime()
    .domain(d3.extent(processedData, d => d.date) as [Date, Date])
    .range([0, width])

  const yScaleEngagement = d3.scaleLinear()
    .domain([0, d3.max(processedData, d => d.avgEngagement) || 100])
    .range([height, 0])

  const yScaleUsers = d3.scaleLinear()
    .domain([0, d3.max(processedData, d => d.activeUsers) || 100])
    .range([height, 0])

  // Create line generators
  const engagementLine = d3.line<EngagementPoint>()
    .x(d => xScale(new Date(d.date)))
    .y(d => yScaleEngagement(d.avgEngagement))
    .curve(d3.curveMonotoneX)

  const usersLine = d3.line<EngagementPoint>()
    .x(d => xScale(new Date(d.date)))
    .y(d => yScaleUsers(d.activeUsers))
    .curve(d3.curveMonotoneX)

  // Create axes
  const xAxis = d3.axisBottom(xScale)
    .tickFormat(d3.timeFormat('%m/%d'))

  const yAxisEngagement = d3.axisLeft(yScaleEngagement)
  const yAxisUsers = d3.axisRight(yScaleUsers)

  // Add axes
  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis)
    .selectAll('text')
    .style('fill', 'rgb(var(--v-theme-on-surface))')

  g.append('g')
    .attr('class', 'y-axis-engagement')
    .call(yAxisEngagement)
    .selectAll('text')
    .style('fill', 'rgb(var(--v-theme-primary))')

  g.append('g')
    .attr('class', 'y-axis-users')
    .attr('transform', `translate(${width},0)`)
    .call(yAxisUsers)
    .selectAll('text')
    .style('fill', 'rgb(var(--v-theme-info))')

  // Add axis labels
  g.append('text')
    .attr('class', 'y-label')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('fill', 'rgb(var(--v-theme-primary))')
    .style('font-size', '12px')
    .text('Avg Engagement Score')

  g.append('text')
    .attr('class', 'y-label')
    .attr('transform', 'rotate(90)')
    .attr('y', 0 - width - margin.right + 20)
    .attr('x', height / 2)
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('fill', 'rgb(var(--v-theme-info))')
    .style('font-size', '12px')
    .text('Active Users')

  // Create gradient for engagement area
  const gradient = g.append('defs')
    .append('linearGradient')
    .attr('id', 'engagement-gradient')
    .attr('gradientUnits', 'userSpaceOnUse')
    .attr('x1', 0).attr('y1', height)
    .attr('x2', 0).attr('y2', 0)

  gradient.append('stop')
    .attr('offset', '0%')
    .attr('stop-color', 'rgb(var(--v-theme-primary))')
    .attr('stop-opacity', 0.1)

  gradient.append('stop')
    .attr('offset', '100%')
    .attr('stop-color', 'rgb(var(--v-theme-primary))')
    .attr('stop-opacity', 0.3)

  // Add area under engagement line
  const area = d3.area<EngagementPoint>()
    .x(d => xScale(new Date(d.date)))
    .y0(height)
    .y1(d => yScaleEngagement(d.avgEngagement))
    .curve(d3.curveMonotoneX)

  g.append('path')
    .datum(processedData)
    .attr('class', 'engagement-area')
    .attr('d', area)
    .style('fill', 'url(#engagement-gradient)')

  // Add engagement line
  g.append('path')
    .datum(processedData)
    .attr('class', 'engagement-line')
    .attr('d', engagementLine)
    .style('fill', 'none')
    .style('stroke', 'rgb(var(--v-theme-primary))')
    .style('stroke-width', 3)

  // Add users line
  g.append('path')
    .datum(processedData)
    .attr('class', 'users-line')
    .attr('d', usersLine)
    .style('fill', 'none')
    .style('stroke', 'rgb(var(--v-theme-info))')
    .style('stroke-width', 2)
    .style('stroke-dasharray', '5,5')

  // Add dots for engagement
  g.selectAll('.engagement-dot')
    .data(processedData)
    .enter().append('circle')
    .attr('class', 'engagement-dot')
    .attr('cx', d => xScale(d.date))
    .attr('cy', d => yScaleEngagement(d.avgEngagement))
    .attr('r', 4)
    .style('fill', 'rgb(var(--v-theme-primary))')
    .style('stroke', 'white')
    .style('stroke-width', 2)

  // Add dots for users
  g.selectAll('.users-dot')
    .data(processedData)
    .enter().append('circle')
    .attr('class', 'users-dot')
    .attr('cx', d => xScale(d.date))
    .attr('cy', d => yScaleUsers(d.activeUsers))
    .attr('r', 3)
    .style('fill', 'rgb(var(--v-theme-info))')
    .style('stroke', 'white')
    .style('stroke-width', 1)

  // Add tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'chart-tooltip')
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

  // Add invisible overlay for mouse events
  g.append('rect')
    .attr('class', 'overlay')
    .attr('width', width)
    .attr('height', height)
    .style('fill', 'none')
    .style('pointer-events', 'all')
    .on('mouseover', () => tooltip.style('opacity', 1))
    .on('mouseout', () => tooltip.style('opacity', 0))
    .on('mousemove', (event) => {
      const [mouseX] = d3.pointer(event)
      const date = xScale.invert(mouseX)

      // Find closest data point
      const bisectDate = d3.bisector((d: EngagementPoint) => d.date).left
      const i = bisectDate(processedData, date, 1)
      const d0 = processedData[i - 1]
      const d1 = processedData[i]
      const d = d1 && (date.getTime() - d0.date.getTime() > d1.date.getTime() - date.getTime()) ? d1 : d0

      if (d) {
        tooltip
          .html(`
            <div style="color: rgb(var(--v-theme-on-surface))">
              <strong>${d3.timeFormat('%b %d, %Y')(d.date)}</strong><br/>
              <div style="color: rgb(var(--v-theme-primary))">
                Engagement: ${d.avgEngagement.toFixed(1)}
              </div>
              <div style="color: rgb(var(--v-theme-info))">
                Active Users: ${d.activeUsers}
              </div>
            </div>
          `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px')
      }
    })

  // Add legend
  const legend = g.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${width - 120}, 20)`)

  const legendData = [
    { color: 'rgb(var(--v-theme-primary))', label: 'Engagement', dash: false },
    { color: 'rgb(var(--v-theme-info))', label: 'Active Users', dash: true }
  ]

  const legendItems = legend.selectAll('.legend-item')
    .data(legendData)
    .enter().append('g')
    .attr('class', 'legend-item')
    .attr('transform', (d, i) => `translate(0, ${i * 20})`)

  legendItems.append('line')
    .attr('x1', 0)
    .attr('x2', 15)
    .attr('y1', 5)
    .attr('y2', 5)
    .style('stroke', d => d.color)
    .style('stroke-width', 2)
    .style('stroke-dasharray', d => d.dash ? '3,3' : 'none')

  legendItems.append('text')
    .attr('x', 20)
    .attr('y', 9)
    .style('fill', 'rgb(var(--v-theme-on-surface))')
    .style('font-size', '12px')
    .text(d => d.label)
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
</script>

<style scoped>
.engagement-trend-chart {
  width: 100%;
}

.chart-container {
  width: 100%;
  min-height: 300px;
}

:deep(.x-axis) line,
:deep(.x-axis) path {
  stroke: rgb(var(--v-theme-outline));
}

:deep(.y-axis-engagement) line,
:deep(.y-axis-engagement) path {
  stroke: rgb(var(--v-theme-outline));
}

:deep(.y-axis-users) line,
:deep(.y-axis-users) path {
  stroke: rgb(var(--v-theme-outline));
}
</style>
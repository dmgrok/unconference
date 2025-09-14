<template>
  <div class="activity-heatmap">
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 200px;">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <div v-else-if="!data.length" class="d-flex justify-center align-center" style="height: 200px;">
      <div class="text-center">
        <v-icon size="48" color="grey-lighten-1">mdi-calendar-heat</v-icon>
        <div class="text-body-2 text-medium-emphasis mt-2">No activity data</div>
      </div>
    </div>
    <div v-else>
      <div ref="chartContainer" class="chart-container"></div>
      <div class="legend-container mt-2">
        <div class="d-flex align-center gap-2">
          <span class="text-caption">Less</span>
          <div class="color-scale">
            <div
              v-for="(color, index) in colorScale"
              :key="index"
              class="color-cell"
              :style="{ backgroundColor: color }"
            />
          </div>
          <span class="text-caption">More</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick, computed } from 'vue'
import * as d3 from 'd3'

interface HeatmapData {
  date: Date | string
  value: number
  count?: number
}

interface Props {
  data: HeatmapData[]
  loading?: boolean
  cellSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  cellSize: 12
})

const chartContainer = ref<HTMLElement>()

// Create color scale for legend
const colorScale = computed(() => {
  return ['#ebedf0', '#c6e48b', '#7bc96f', '#239a3b', '#196127']
})

const drawHeatmap = async () => {
  if (!chartContainer.value || !props.data.length) return

  // Clear previous chart
  d3.select(chartContainer.value).selectAll('*').remove()

  // Process data
  const processedData = props.data.map(d => ({
    date: typeof d.date === 'string' ? new Date(d.date) : d.date,
    value: d.value,
    count: d.count || 0
  })).sort((a, b) => a.date.getTime() - b.date.getTime())

  // Get date range
  const startDate = processedData[0]?.date
  const endDate = processedData[processedData.length - 1]?.date

  if (!startDate || !endDate) return

  // Create a map for quick lookup
  const dataMap = new Map()
  processedData.forEach(d => {
    const dateKey = d3.timeFormat('%Y-%m-%d')(d.date)
    dataMap.set(dateKey, d)
  })

  // Generate all dates in range
  const allDates: Date[] = []
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    allDates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Calculate dimensions
  const cellSize = props.cellSize
  const cellPadding = 2
  const totalCellSize = cellSize + cellPadding

  // Group dates by week
  const weeks: Date[][] = []
  let currentWeek: Date[] = []

  allDates.forEach(date => {
    if (currentWeek.length === 0 || date.getDay() === 0) {
      if (currentWeek.length > 0) {
        weeks.push([...currentWeek])
      }
      currentWeek = []
    }
    currentWeek.push(date)
  })
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }

  const width = weeks.length * totalCellSize
  const height = 7 * totalCellSize + 20 // 7 days + space for day labels

  // Create SVG
  const svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('font-family', 'inherit')

  // Create color scale based on data values
  const maxValue = d3.max(processedData, d => d.value) || 1
  const colorScale = d3.scaleSequential()
    .domain([0, maxValue])
    .interpolator(d3.interpolateGreens)

  // Day labels
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  svg.selectAll('.day-label')
    .data(dayLabels)
    .enter().append('text')
    .attr('class', 'day-label')
    .attr('x', -5)
    .attr('y', (d, i) => (i * totalCellSize) + cellSize / 2 + 20)
    .attr('dy', '0.35em')
    .style('text-anchor', 'end')
    .style('font-size', '10px')
    .style('fill', 'rgb(var(--v-theme-on-surface-variant))')
    .text(d => d)

  // Create tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'heatmap-tooltip')
    .style('position', 'absolute')
    .style('padding', '8px 12px')
    .style('background', 'rgb(var(--v-theme-inverse-surface))')
    .style('color', 'rgb(var(--v-theme-inverse-on-surface))')
    .style('border-radius', '6px')
    .style('box-shadow', '0 2px 8px rgba(0,0,0,0.15)')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('font-size', '12px')
    .style('z-index', 1000)

  // Draw cells
  weeks.forEach((week, weekIndex) => {
    week.forEach((date, dayIndex) => {
      const dateKey = d3.timeFormat('%Y-%m-%d')(date)
      const dataPoint = dataMap.get(dateKey)
      const value = dataPoint?.value || 0
      const count = dataPoint?.count || 0

      const cell = svg.append('rect')
        .attr('class', 'heatmap-cell')
        .attr('x', weekIndex * totalCellSize)
        .attr('y', dayIndex * totalCellSize + 20)
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('rx', 2)
        .attr('ry', 2)
        .style('fill', value > 0 ? colorScale(value) : '#ebedf0')
        .style('stroke', 'rgb(var(--v-theme-outline))')
        .style('stroke-width', '0.5px')
        .style('cursor', 'pointer')

      // Add hover effects and tooltip
      cell
        .on('mouseover', function(event) {
          d3.select(this)
            .style('stroke-width', '2px')
            .style('stroke', 'rgb(var(--v-theme-primary))')

          tooltip
            .style('opacity', 1)
            .html(`
              <div>
                <strong>${d3.timeFormat('%b %d, %Y')(date)}</strong><br/>
                Engagement: ${value.toFixed(1)}<br/>
                ${count > 0 ? `Active Users: ${count}` : 'No activity'}
              </div>
            `)
        })
        .on('mousemove', function(event) {
          tooltip
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px')
        })
        .on('mouseout', function() {
          d3.select(this)
            .style('stroke-width', '0.5px')
            .style('stroke', 'rgb(var(--v-theme-outline))')

          tooltip.style('opacity', 0)
        })
    })
  })

  // Add month labels if we have enough weeks
  if (weeks.length > 4) {
    const monthLabels: { month: string, x: number }[] = []
    let currentMonth = ''

    weeks.forEach((week, weekIndex) => {
      const monthName = d3.timeFormat('%b')(week[0])
      if (monthName !== currentMonth) {
        monthLabels.push({
          month: monthName,
          x: weekIndex * totalCellSize
        })
        currentMonth = monthName
      }
    })

    svg.selectAll('.month-label')
      .data(monthLabels)
      .enter().append('text')
      .attr('class', 'month-label')
      .attr('x', d => d.x)
      .attr('y', 12)
      .style('font-size', '11px')
      .style('font-weight', '500')
      .style('fill', 'rgb(var(--v-theme-on-surface))')
      .text(d => d.month)
  }
}

// Lifecycle
onMounted(async () => {
  await nextTick()
  if (props.data.length) {
    drawHeatmap()
  }
})

// Watch for data changes
watch(() => props.data, async () => {
  await nextTick()
  drawHeatmap()
}, { deep: true })

watch(() => props.loading, async (newVal) => {
  if (!newVal && props.data.length) {
    await nextTick()
    drawHeatmap()
  }
})

// Cleanup tooltip on unmount
onUnmounted(() => {
  d3.selectAll('.heatmap-tooltip').remove()
})
</script>

<style scoped>
.activity-heatmap {
  width: 100%;
}

.chart-container {
  width: 100%;
  overflow-x: auto;
}

.legend-container {
  display: flex;
  justify-content: center;
}

.color-scale {
  display: flex;
  gap: 1px;
}

.color-cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: 0.5px solid rgba(0, 0, 0, 0.1);
}

:deep(.heatmap-cell) {
  transition: all 0.2s ease;
}

:deep(.heatmap-cell:hover) {
  transform: scale(1.1);
}
</style>
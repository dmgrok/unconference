<template>
  <div class="diverging-stacked-bar-container">
    <h3 v-if="title" class="chart-title">{{ title }}</h3>
    <div 
      ref="chartContainer" 
      class="diverging-stacked-bar-chart"
      :style="{ height: `${height}px` }"
    ></div>
    <div v-if="showLegend" class="chart-legend">
      <div class="legend-items">
        <div 
          v-for="category in legendCategories" 
          :key="category.key"
          class="legend-item"
        >
          <span 
            class="legend-color" 
            :style="{ backgroundColor: category.color }"
          ></span>
          <span class="legend-label">{{ category.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface VotingData {
  topic: string
  stronglyDisagree: number
  disagree: number
  neutral: number
  agree: number
  stronglyAgree: number
}

interface LegendCategory {
  key: string
  label: string
  color: string
}

interface Props {
  data: VotingData[]
  title?: string
  height?: number
  showLegend?: boolean
  colors?: {
    stronglyDisagree: string
    disagree: string
    neutral: string
    agree: string
    stronglyAgree: string
  }
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  height: 400,
  showLegend: true,
  colors: () => ({
    stronglyDisagree: '#d32f2f',
    disagree: '#f57c00',
    neutral: '#9e9e9e',
    agree: '#388e3c',
    stronglyAgree: '#1976d2'
  })
})

const chartContainer = ref<HTMLElement | null>(null)

const legendCategories = computed<LegendCategory[]>(() => [
  { key: 'stronglyDisagree', label: 'Strongly Disagree', color: props.colors.stronglyDisagree },
  { key: 'disagree', label: 'Disagree', color: props.colors.disagree },
  { key: 'neutral', label: 'Neutral', color: props.colors.neutral },
  { key: 'agree', label: 'Agree', color: props.colors.agree },
  { key: 'stronglyAgree', label: 'Strongly Agree', color: props.colors.stronglyAgree }
])

const createChart = async () => {
  if (!chartContainer.value || !props.data.length) return

  // Dynamic import for D3
  const d3 = await import('d3')

  // Clear previous chart
  d3.select(chartContainer.value).selectAll('*').remove()

  const margin = { top: 20, right: 60, bottom: 100, left: 120 }
  const width = chartContainer.value.offsetWidth - margin.left - margin.right
  const height = props.height - margin.top - margin.bottom

  // Create SVG
  const svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Process data for diverging stack
  const processedData = props.data.map(d => {
    const total = d.stronglyDisagree + d.disagree + d.neutral + d.agree + d.stronglyAgree
    const halfNeutral = d.neutral / 2
    
    return {
      topic: d.topic,
      total,
      values: [
        { key: 'stronglyDisagree', value: d.stronglyDisagree, start: -(d.stronglyDisagree + d.disagree + halfNeutral) },
        { key: 'disagree', value: d.disagree, start: -(d.disagree + halfNeutral) },
        { key: 'neutral', value: d.neutral, start: -halfNeutral },
        { key: 'agree', value: d.agree, start: halfNeutral },
        { key: 'stronglyAgree', value: d.stronglyAgree, start: halfNeutral + d.agree }
      ]
    }
  })

  // Scales
  const yScale = d3.scaleBand()
    .domain(processedData.map(d => d.topic))
    .range([0, height])
    .padding(0.2)

  const maxValue = d3.max(processedData, d => d.total) || 0
  const xScale = d3.scaleLinear()
    .domain([-maxValue / 2, maxValue / 2])
    .range([0, width])

  // Color scale
  const colorScale = d3.scaleOrdinal<string>()
    .domain(['stronglyDisagree', 'disagree', 'neutral', 'agree', 'stronglyAgree'])
    .range([
      props.colors.stronglyDisagree,
      props.colors.disagree,
      props.colors.neutral,
      props.colors.agree,
      props.colors.stronglyAgree
    ])

  // Create bars
  const bars = g.selectAll('.topic-group')
    .data(processedData)
    .enter()
    .append('g')
    .attr('class', 'topic-group')
    .attr('transform', d => `translate(0, ${yScale(d.topic)})`)

  // Add segments
  bars.selectAll('.segment')
    .data(d => d.values.filter(v => v.value > 0))
    .enter()
    .append('rect')
    .attr('class', 'segment')
    .attr('x', d => xScale(d.start))
    .attr('y', 0)
    .attr('width', d => xScale(d.start + d.value) - xScale(d.start))
    .attr('height', yScale.bandwidth())
    .attr('fill', d => colorScale(d.key))
    .attr('opacity', 0.8)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1)
      
      // Create tooltip
      const tooltip = d3.select('body').append('div')
        .attr('class', 'chart-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '8px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')

      tooltip.transition()
        .duration(200)
        .style('opacity', 1)

      tooltip.html(`<strong>${legendCategories.value.find(cat => cat.key === d.key)?.label}</strong><br/>Count: ${d.value}`)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px')
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 0.8)
      d3.selectAll('.chart-tooltip').remove()
    })

  // Add axes
  const yAxis = d3.axisLeft(yScale)
  g.append('g')
    .attr('class', 'y-axis')
    .call(yAxis)
    .selectAll('text')
    .style('font-size', '12px')
    .call(wrap, margin.left - 10)

  const xAxis = d3.axisBottom(xScale)
    .tickFormat((d: any) => Math.abs(Number(d)).toString())
  g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${height})`)
    .call(xAxis)

  // Add center line
  g.append('line')
    .attr('x1', xScale(0))
    .attr('x2', xScale(0))
    .attr('y1', 0)
    .attr('y2', height)
    .attr('stroke', '#666')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3,3')

  // Add labels
  g.append('text')
    .attr('x', xScale(-maxValue / 4))
    .attr('y', -5)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .text('Disagree')

  g.append('text')
    .attr('x', xScale(maxValue / 4))
    .attr('y', -5)
    .attr('text-anchor', 'middle')
    .style('font-size', '12px')
    .style('font-weight', 'bold')
    .text('Agree')

  // Text wrapping function
  function wrap(text: any, width: number) {
    text.each(function(this: SVGTextElement) {
      const textElement = d3.select(this)
      const words = textElement.text().split(/\s+/).reverse()
      let word: string | undefined
      let line: string[] = []
      let lineNumber = 0
      const lineHeight = 1.1
      const y = textElement.attr('y')
      const dy = parseFloat(textElement.attr('dy') || '0')
      
      let tspan = textElement.text(null).append('tspan')
        .attr('x', 0).attr('y', y).attr('dy', dy + 'em')
      
      while (word = words.pop()) {
        line.push(word)
        tspan.text(line.join(' '))
        if ((tspan.node() as any)?.getComputedTextLength() > width) {
          line.pop()
          tspan.text(line.join(' '))
          line = [word]
          tspan = textElement.append('tspan')
            .attr('x', 0).attr('y', y)
            .attr('dy', ++lineNumber * lineHeight + dy + 'em')
            .text(word)
        }
      }
    })
  }
}

onMounted(() => {
  nextTick(() => {
    createChart()
  })
})

watch(() => props.data, () => {
  nextTick(() => {
    createChart()
  })
}, { deep: true })
</script>

<style scoped>
.diverging-stacked-bar-container {
  width: 100%;
  padding: 1rem;
  background: var(--color-surface);
  border-radius: 0.5rem;
  border: 1px solid var(--color-border);
}

.chart-title {
  text-align: center;
  margin-bottom: 1rem;
  color: var(--color-text);
  font-size: 1.2rem;
  font-weight: 600;
}

.diverging-stacked-bar-chart {
  width: 100%;
  overflow: hidden;
}

.chart-legend {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.legend-items {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

:deep(.y-axis text) {
  fill: var(--color-text-muted);
}

:deep(.x-axis text) {
  fill: var(--color-text-muted);
}

:deep(.y-axis path),
:deep(.x-axis path) {
  stroke: var(--color-border);
}

:deep(.y-axis line),
:deep(.x-axis line) {
  stroke: var(--color-border);
}
</style>

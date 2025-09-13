<template>
  <div class="treemap-container">
    <h3 v-if="title" class="chart-title">{{ title }}</h3>
    <div 
      ref="chartContainer" 
      class="treemap-chart"
      :style="{ height: `${height}px` }"
    ></div>
    <div v-if="showDetails" class="treemap-details">
      <div class="detail-stats">
        <div class="stat-item">
          <span class="stat-label">Total Topics:</span>
          <span class="stat-value">{{ data.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Total Discussions:</span>
          <span class="stat-value">{{ totalDiscussions }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">People Involved:</span>
          <span class="stat-value">{{ totalPeople }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Most Discussed:</span>
          <span class="stat-value">{{ mostDiscussedTopic?.name || 'N/A' }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Most Engaging:</span>
          <span class="stat-value">{{ mostEngagedTopic?.name || 'N/A' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface TopicData {
  name: string
  value: number // Total engagement score or primary metric
  discussions: number // Number of discussions
  people: number // Number of people involved
  category?: string
  description?: string
}

interface Props {
  data: TopicData[]
  title?: string
  height?: number
  showDetails?: boolean
  colorScheme?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  height: 400,
  showDetails: true,
  colorScheme: () => [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
    '#aec7e8', '#ffbb78', '#98df8a', '#ff9896', '#c5b0d5'
  ]
})

const chartContainer = ref<HTMLElement | null>(null)

const totalDiscussions = computed(() => 
  props.data.reduce((sum, item) => sum + (item.discussions || item.value), 0)
)

const totalPeople = computed(() => 
  props.data.reduce((sum, item) => sum + (item.people || 0), 0)
)

const mostDiscussedTopic = computed(() => 
  props.data.length > 0 
    ? props.data.reduce((max, item) => (item.discussions || item.value) > (max.discussions || max.value) ? item : max)
    : null
)

const mostEngagedTopic = computed(() => 
  props.data.length > 0 
    ? props.data.reduce((max, item) => (item.people || 0) > (max.people || 0) ? item : max)
    : null
)

const createTreemap = async () => {
  if (!chartContainer.value || !props.data.length) return

  // Dynamic import for D3
  const d3 = await import('d3')

  // Clear previous chart
  d3.select(chartContainer.value).selectAll('*').remove()

  const width = chartContainer.value.offsetWidth
  const height = props.height

  // Create SVG
  const svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  // Color scale
  const colorScale = d3.scaleOrdinal<string>()
    .domain(props.data.map(d => d.category || d.name))
    .range(props.colorScheme)

  // Create hierarchy
  const root = d3.hierarchy({ children: props.data } as any)
    .sum((d: any) => d.value)
    .sort((a, b) => (b.value || 0) - (a.value || 0))

  // Create treemap layout
  const treemap = d3.treemap<any>()
    .size([width, height])
    .padding(2)
    .round(true)

  treemap(root)

  // Create tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'treemap-tooltip')
    .style('opacity', 0)
    .style('position', 'absolute')
    .style('background', 'rgba(0, 0, 0, 0.9)')
    .style('color', 'white')
    .style('padding', '12px')
    .style('border-radius', '8px')
    .style('font-size', '14px')
    .style('pointer-events', 'none')
    .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
    .style('max-width', '200px')
    .style('z-index', '1000')

  // Create cells
  const cell = svg.selectAll('g')
    .data(root.leaves())
    .enter()
    .append('g')
    .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`)

  // Add rectangles
  cell.append('rect')
    .attr('width', (d: any) => d.x1 - d.x0)
    .attr('height', (d: any) => d.y1 - d.y0)
    .attr('fill', (d: any) => colorScale(d.data.category || d.data.name))
    .attr('stroke', 'white')
    .attr('stroke-width', 2)
    .attr('opacity', 0.8)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d: any) {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 1)
        .attr('stroke-width', 3)

      tooltip.transition()
        .duration(200)
        .style('opacity', 1)

      const discussionCount = d.data.discussions || d.data.value
      const peopleCount = d.data.people || 0
      const percentage = ((discussionCount / totalDiscussions.value) * 100).toFixed(1)
      
      tooltip.html(`
        <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">${d.data.name}</div>
        <div style="margin-bottom: 4px;"><strong>Discussions:</strong> ${discussionCount}</div>
        <div style="margin-bottom: 4px;"><strong>People Involved:</strong> ${peopleCount}</div>
        <div style="margin-bottom: 4px;"><strong>Share:</strong> ${percentage}%</div>
        ${d.data.category ? `<div style="margin-bottom: 4px;"><strong>Category:</strong> ${d.data.category}</div>` : ''}
        ${d.data.description ? `<div style="margin-top: 8px; font-size: 12px; opacity: 0.9; font-style: italic;">${d.data.description}</div>` : ''}
      `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('opacity', 0.8)
        .attr('stroke-width', 2)

      tooltip.transition()
        .duration(500)
        .style('opacity', 0)
    })
    .on('click', function(event, d: any) {
      // Emit click event for parent component
      // You can handle this in the parent component if needed
      console.log('Topic clicked:', d.data)
    })

  // Add text labels
  const textPadding = 4
  
  cell.append('text')
    .attr('x', textPadding)
    .attr('y', textPadding)
    .attr('dy', '0.8em')
    .style('font-size', (d: any) => {
      const area = (d.x1 - d.x0) * (d.y1 - d.y0)
      if (area < 1000) return '10px'
      if (area < 3000) return '12px'
      if (area < 6000) return '14px'
      return '16px'
    })
    .style('font-weight', '600')
    .style('fill', 'white')
    .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
    .style('pointer-events', 'none')
    .text((d: any) => {
      const rectWidth = d.x1 - d.x0
      const rectHeight = d.y1 - d.y0
      
      // Only show text if rectangle is large enough
      if (rectWidth < 60 || rectHeight < 30) return ''
      
      // Truncate long names
      let name = d.data.name
      if (rectWidth < 100 && name.length > 12) {
        name = name.substring(0, 12) + '...'
      } else if (rectWidth < 150 && name.length > 20) {
        name = name.substring(0, 20) + '...'
      }
      
      return name
    })
    .call(wrapText, function(d: any) { return d.x1 - d.x0 - (textPadding * 2) })

  // Add value labels
  cell.append('text')
    .attr('x', textPadding)
    .attr('y', (d: any) => {
      const parentNode = (cell.node() as any)?.parentNode
      const fontSize = parentNode ? parseFloat(d3.select(parentNode).select('text').style('font-size')) : 14
      return textPadding + fontSize + 4
    })
    .attr('dy', '0.8em')
    .style('font-size', '11px')
    .style('font-weight', '400')
    .style('fill', 'white')
    .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
    .style('pointer-events', 'none')
    .text((d: any) => {
      const rectWidth = d.x1 - d.x0
      const rectHeight = d.y1 - d.y0
      
      // Only show value if rectangle is large enough
      if (rectWidth < 60 || rectHeight < 50) return ''
      
      const discussions = d.data.discussions || d.data.value
      const people = d.data.people || 0
      
      if (rectWidth < 100) {
        return `${discussions}d, ${people}p`
      } else {
        return `${discussions} discussions, ${people} people`
      }
    })

  // Add secondary value labels for larger rectangles
  cell.append('text')
    .attr('x', textPadding)
    .attr('y', (d: any) => {
      const parentNode = (cell.node() as any)?.parentNode
      const fontSize = parentNode ? parseFloat(d3.select(parentNode).select('text').style('font-size')) : 14
      return textPadding + fontSize + 20
    })
    .attr('dy', '0.8em')
    .style('font-size', '10px')
    .style('font-weight', '300')
    .style('fill', 'rgba(255,255,255,0.8)')
    .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)')
    .style('pointer-events', 'none')
    .text((d: any) => {
      const rectWidth = d.x1 - d.x0
      const rectHeight = d.y1 - d.y0
      
      // Only show for very large rectangles
      if (rectWidth < 120 || rectHeight < 80) return ''
      
      const percentage = (((d.data.discussions || d.data.value) / totalDiscussions.value) * 100).toFixed(0)
      return `${percentage}% of total discussions`
    })

  // Text wrapping function
  function wrapText(text: any, width: (d: any) => number) {
    text.each(function(this: SVGTextElement, d: any) {
      const textElement = d3.select(this)
      const maxWidth = width(d)
      const words = textElement.text().split(/\s+/).reverse()
      let word: string | undefined
      let line: string[] = []
      let lineNumber = 0
      const lineHeight = 1.1
      const y = textElement.attr('y')
      const dy = parseFloat(textElement.attr('dy') || '0')
      
      let tspan = textElement.text(null).append('tspan')
        .attr('x', textPadding).attr('y', y).attr('dy', dy + 'em')
      
      while (word = words.pop()) {
        line.push(word)
        tspan.text(line.join(' '))
        if ((tspan.node() as any)?.getComputedTextLength() > maxWidth) {
          line.pop()
          tspan.text(line.join(' '))
          line = [word]
          tspan = textElement.append('tspan')
            .attr('x', textPadding).attr('y', y)
            .attr('dy', ++lineNumber * lineHeight + dy + 'em')
            .text(word)
        }
      }
    })
  }

  // Clean up tooltip on component unmount
  onBeforeUnmount(() => {
    d3.selectAll('.treemap-tooltip').remove()
  })
}

onMounted(() => {
  nextTick(() => {
    createTreemap()
  })
})

watch(() => props.data, () => {
  nextTick(() => {
    createTreemap()
  })
}, { deep: true })

// Handle window resize
const handleResize = () => {
  nextTick(() => {
    createTreemap()
  })
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.treemap-container {
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

.treemap-chart {
  width: 100%;
  overflow: hidden;
  border-radius: 0.25rem;
}

.treemap-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.detail-stats {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  font-weight: 500;
}

.stat-value {
  font-size: 1.25rem;
  color: var(--color-text);
  font-weight: 700;
}

@media (max-width: 640px) {
  .detail-stats {
    flex-direction: column;
    align-items: center;
  }
  
  .stat-item {
    flex-direction: row;
    gap: 0.5rem;
  }
}
</style>

# Analytics & Visualizations Features

This document describes the new analytics and visualization features added to the viral functionalities and recap system.

## Overview

The analytics and visualizations system provides rich, interactive data representations of survey results, voting patterns, and topic discussion frequencies. This enhances both the personal recap experience and viral sharing capabilities.

## New Components

### 1. DivergingStackedBar Component

**Purpose**: Visualizes survey and voting sentiment data with a diverging stacked bar chart.

**Features**:
- Shows sentiment distribution from strongly disagree to strongly agree
- Neutral responses centered, with positive/negative extending in opposite directions
- Interactive tooltips with detailed breakdown
- Responsive design with automatic text wrapping
- Customizable colors and legend

**Usage**:
```vue
<DivergingStackedBar
  :data="surveyData"
  title="Survey Results & Sentiment Analysis"
  :height="300"
  :show-legend="true"
/>
```

**Data Format**:
```typescript
interface VotingData {
  topic: string
  stronglyDisagree: number
  disagree: number
  neutral: number
  agree: number
  stronglyAgree: number
}
```

### 2. TreeMapChart Component

**Purpose**: Visualizes topic discussion frequency using proportional rectangles.

**Features**:
- Rectangle size represents discussion volume
- Color-coded by category
- Interactive tooltips with detailed information
- Responsive text sizing based on rectangle dimensions
- Summary statistics display

**Usage**:
```vue
<TreeMapChart
  :data="topicDiscussionData"
  title="Topic Discussion Frequency"
  :height="350"
  :show-details="true"
/>
```

**Data Format**:
```typescript
interface TopicData {
  name: string
  value: number
  category?: string
  description?: string
}
```

## Integration Points

### Personal Recap Component

The analytics visualizations are integrated into the `PersonalRecap.vue` component with two new sections:

1. **Survey Results & Sentiment Analysis**: Shows how participants felt about key topics
2. **Topic Discussion Frequency**: Displays which topics generated the most engagement

### Viral Sharing Enhancement

The `useViralSharing.ts` composable has been enhanced to include analytics insights in social media posts:

**LinkedIn Content**:
- Survey consensus insights
- Discussion analytics summary
- Community engagement metrics

**Twitter Content**:
- Condensed analytics highlights
- Most discussed topics
- Interaction counts

### Recap Demo Page

The demo page includes a dedicated analytics showcase in the "Ideas & Flow" tab featuring:
- Interactive survey sentiment visualization
- Topic discussion treemap
- Insights summary cards
- Discussion statistics

## Data Generation

### Survey Data
```typescript
const surveyData = [
  {
    topic: 'AI Ethics Implementation',
    stronglyDisagree: 2,
    disagree: 3,
    neutral: 5,
    agree: 12,
    stronglyAgree: 8
  }
  // ... more topics
]
```

### Discussion Data
```typescript
const topicDiscussionData = [
  {
    name: 'AI Ethics & Governance',
    value: 45,
    category: 'Technology',
    description: 'Deep discussions about responsible AI development'
  }
  // ... more topics
]
```

## Key Insights Generated

### Survey Insights
- Consensus detection (>75% agreement)
- Polarization identification
- Community priorities
- Engagement patterns

### Discussion Analytics
- Total interaction counts
- Most engaging topics
- Category distribution
- Discussion volume trends

## Technical Implementation

### Dependencies
- D3.js for data visualization
- Vue 3 Composition API
- TypeScript for type safety

### Performance Considerations
- Dynamic D3 imports to reduce bundle size
- Responsive charts that adapt to container size
- Efficient data processing for large datasets
- Tooltip cleanup to prevent memory leaks

### Accessibility
- Semantic HTML structure
- ARIA labels and descriptions
- Keyboard navigation support
- High contrast color schemes

## Future Enhancements

1. **Real-time Updates**: Live chart updates during events
2. **Export Functionality**: Download charts as PNG/SVG
3. **Advanced Filtering**: Filter by time, category, or participant
4. **Comparison Views**: Compare multiple events or time periods
5. **Machine Learning**: Predictive insights and trend analysis

## API Integration

When connected to real data sources, these components expect:

### Survey Endpoints
```
GET /api/events/{eventId}/surveys
GET /api/events/{eventId}/survey-insights
```

### Discussion Endpoints
```
GET /api/events/{eventId}/topic-discussions
GET /api/events/{eventId}/discussion-analytics
```

## Best Practices

1. **Data Validation**: Always validate data structure before passing to components
2. **Error Handling**: Implement fallbacks for missing or malformed data
3. **Performance**: Use computed properties for expensive calculations
4. **Accessibility**: Ensure charts are accessible to screen readers
5. **Responsiveness**: Test on various screen sizes and devices

## Testing

The components include comprehensive demo data for testing and showcase purposes. The recap demo page provides an interactive environment to explore all features.

## Conclusion

These analytics and visualization features significantly enhance the unconference platform by providing data-driven insights into participant engagement, topic popularity, and community sentiment. The integration with viral sharing amplifies the impact by including these insights in social media content.

// Global event configuration composable
const eventConfig = reactive({
  name: 'Tech Innovation Unconference 2024', // Specific event name
  description: 'Join us for two days of collaborative discussions and knowledge sharing!',
  dates: 'May 21st - 22nd, 2025',
  location: 'Paris'
})

export const useEventConfig = () => {
  const updateEventConfig = (newConfig: Partial<typeof eventConfig>) => {
    Object.assign(eventConfig, newConfig)
  }

  const getEventConfig = () => eventConfig

  return {
    eventConfig: readonly(eventConfig),
    updateEventConfig,
    getEventConfig
  }
}

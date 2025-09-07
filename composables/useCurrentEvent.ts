export const useCurrentEvent = () => {
  const { currentEventId } = useEventContext()
  
  const currentEvent = ref<{
    id: string
    code: string
    name: string
    description?: string
    location?: string
    startDate?: string
    endDate?: string
    isActive: boolean
    organizerId?: string
  } | null>(null)
  
  const eventStats = ref<{
    participantCount: number
    organizerCount: number
    topicCount: number
    roundCount: number
  } | null>(null)
  
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Load current event details
  const loadCurrentEvent = async (eventId?: string) => {
    const targetEventId = eventId || currentEventId.value
    if (!targetEventId) {
      currentEvent.value = null
      eventStats.value = null
      return
    }

    loading.value = true
    error.value = null

    try {
      // Load event details
      const eventResponse = await $fetch(`/api/events/${targetEventId}/details`) as any
      currentEvent.value = eventResponse.event

      // Load event statistics
      try {
        const statsResponse = await $fetch(`/api/events/${targetEventId}/stats`) as any
        eventStats.value = statsResponse
      } catch (statsError) {
        console.warn('Failed to load event stats:', statsError)
        eventStats.value = {
          participantCount: 0,
          organizerCount: 0,
          topicCount: 0,
          roundCount: 0
        }
      }
    } catch (loadError: any) {
      console.error('Failed to load current event:', loadError)
      error.value = loadError.message || 'Failed to load event details'
      currentEvent.value = null
      eventStats.value = null
    } finally {
      loading.value = false
    }
  }

  // Get user's role in the current event
  const { userRole } = useEventContext()

  // Watch for event changes and reload
  watch(currentEventId, (newEventId) => {
    if (newEventId) {
      loadCurrentEvent(newEventId)
    } else {
      currentEvent.value = null
      eventStats.value = null
    }
  }, { immediate: true })

  return {
    currentEvent: readonly(currentEvent),
    eventStats: readonly(eventStats),
    userRole,
    loading: readonly(loading),
    error: readonly(error),
    loadCurrentEvent
  }
}

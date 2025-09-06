// Composable for event status management and read-only mode
export const useEventStatus = () => {
  const { currentEventId } = useEventContext()
  const eventStatus = ref<{
    isActive: boolean
    isLoading: boolean
    canEdit: boolean
    statusReason?: string
  }>({
    isActive: true,
    isLoading: true,
    canEdit: true
  })

  // Load event status
  const loadEventStatus = async (eventId?: string) => {
    const targetEventId = eventId || currentEventId.value
    if (!targetEventId) return

    eventStatus.value.isLoading = true

    try {
      const response = await $fetch(`/api/events/${targetEventId}/status`) as any
      eventStatus.value = {
        isActive: response.isActive,
        isLoading: false,
        canEdit: response.isActive,
        statusReason: response.statusReason
      }
    } catch (error) {
      console.error('Failed to load event status:', error)
      eventStatus.value = {
        isActive: true,
        isLoading: false,
        canEdit: true,
        statusReason: 'Failed to load status'
      }
    }
  }

  // Toggle event status (activate/close)
  const toggleEventStatus = async (eventId?: string) => {
    const targetEventId = eventId || currentEventId.value
    if (!targetEventId) return

    const currentStatus = eventStatus.value.isActive
    const action = currentStatus ? 'close' : 'activate'
    const actionText = currentStatus ? 'close' : 'reactivate'
    
    const confirmed = confirm(`Are you sure you want to ${actionText} this event?`)
    if (!confirmed) return

    try {
      const response = await $fetch(`/api/events/${targetEventId}/${action}`, {
        method: 'POST'
      }) as any
      
      if (response.success) {
        eventStatus.value.isActive = !currentStatus
        eventStatus.value.canEdit = !currentStatus
        return true
      }
    } catch (error: any) {
      console.error(`Failed to ${actionText} event:`, error)
      throw error
    }
    return false
  }

  // Check if current user can reactivate the event
  const canReactivateEvent = async (eventId?: string) => {
    const targetEventId = eventId || currentEventId.value
    if (!targetEventId) return false

    try {
      const response = await $fetch(`/api/events/${targetEventId}/can-reactivate`) as any
      return response.canReactivate
    } catch {
      return false
    }
  }

  // Watch for event changes and reload status
  watch(currentEventId, (newEventId) => {
    if (newEventId) {
      loadEventStatus(newEventId)
    }
  }, { immediate: true })

  // Computed properties for easy access
  const isEventActive = computed(() => eventStatus.value.isActive)
  const isEventInactive = computed(() => !eventStatus.value.isActive)
  const canEditEvent = computed(() => eventStatus.value.canEdit)
  const isStatusLoading = computed(() => eventStatus.value.isLoading)

  return {
    eventStatus: readonly(eventStatus),
    isEventActive,
    isEventInactive,
    canEditEvent,
    isStatusLoading,
    loadEventStatus,
    toggleEventStatus,
    canReactivateEvent
  }
}

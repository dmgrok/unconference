// Client-side composable for event context
export const useEventContext = () => {
  const route = useRoute()
  const { user } = useUserSession()

  // Get current event ID from route query or user session
  const currentEventId = computed(() => {
    return route.query.eventId as string || 
           (user.value as any)?.currentEventId ||
           null
  })

  // Check if user has permission for current event
  const hasEventPermission = async (resource: string, action: string) => {
    if (!currentEventId.value) return false
    
    try {
      await $fetch(`/api/events/${currentEventId.value}/permissions/check`, {
        method: 'POST',
        body: { resource, action }
      })
      return true
    } catch {
      return false
    }
  }

  // Get user's role in current event
  const userRole = ref<string | null>(null)

  const loadEventRole = async () => {
    if (!currentEventId.value) return
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/my-role`) as any
      userRole.value = response.role
    } catch {
      userRole.value = null
    }
  }

  // Watch for event changes and reload role
  watch(currentEventId, loadEventRole, { immediate: true })

  const isAdmin = computed(() => ['Admin', 'Organizer'].includes(userRole.value || ''))

  return {
    currentEventId: readonly(currentEventId),
    userRole: readonly(userRole),
    isAdmin,
    hasEventPermission,
    loadEventRole
  }
}

// Phase 1: Event Summary Composable
export const useEventSummary = () => {
  const { currentEventId } = useEventContext()

  // Get post-event summary for user
  const getEventSummary = async (userId?: string, format: 'json' | 'email' = 'json') => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/summary`, {
        params: { 
          userId: userId || 'current',
          format
        }
      })
      return response
    } catch (error) {
      console.error('Error fetching event summary:', error)
      return null
    }
  }

  // Generate summary for all participants (admin function)
  const generateAllSummaries = async () => {
    if (!currentEventId.value) return null
    
    try {
      // This would be an admin endpoint to generate summaries for all participants
      const response = await $fetch(`/api/events/${currentEventId.value}/summary/generate-all`, {
        method: 'POST' as const
      })
      return response
    } catch (error) {
      console.error('Error generating all summaries:', error)
      return null
    }
  }

  // Send summary via email
  const emailSummary = async (userId: string, email: string) => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/summary/email`, {
        method: 'POST' as const,
        body: {
          userId,
          email
        }
      })
      return response
    } catch (error) {
      console.error('Error sending summary email:', error)
      throw error
    }
  }

  return {
    getEventSummary,
    generateAllSummaries,
    emailSummary
  }
}

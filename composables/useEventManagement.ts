// Client-side composable for event management
export const useEventManagement = () => {
  const createEvent = async (eventData: any) => {
    return await $fetch('/api/events/create', {
      method: 'POST',
      body: eventData
    })
  }

  const getUserEvents = async () => {
    return await $fetch('/api/events/my-events')
  }

  const getEventDetails = async (eventId: string) => {
    return await $fetch(`/api/events/${eventId}/details`)
  }

  const updateEventSettings = async (eventId: string, settings: any) => {
    return await $fetch(`/api/events/${eventId}/settings`, {
      method: 'POST',
      body: settings
    })
  }

  const joinEventByCode = async (eventCode: string, name?: string) => {
    return await $fetch('/api/auth/guest-join', {
      method: 'POST',
      body: { eventCode, name }
    })
  }

  return {
    createEvent,
    getUserEvents,
    getEventDetails,
    updateEventSettings,
    joinEventByCode
  }
}

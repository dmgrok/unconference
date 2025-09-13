// Phase 1: Connection & Collaboration Composable
export const useConnections = () => {
  const { currentEventId } = useEventContext()

  // Get user connections for current event
  const getConnections = async () => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/connections`, {
        params: { type: 'connections' }
      })
      return response
    } catch (error) {
      console.error('Error fetching connections:', error)
      return null
    }
  }

  // Get connection suggestions
  const getSuggestions = async () => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/connections`, {
        params: { type: 'suggestions' }
      })
      return response
    } catch (error) {
      console.error('Error fetching suggestions:', error)
      return null
    }
  }

  // Get user collaborations
  const getCollaborations = async () => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/connections`, {
        params: { type: 'collaborations' }
      })
      return response
    } catch (error) {
      console.error('Error fetching collaborations:', error)
      return null
    }
  }

  // Get network statistics
  const getNetworkStats = async () => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/connections`, {
        params: { type: 'network-stats' }
      })
      return response
    } catch (error) {
      console.error('Error fetching network stats:', error)
      return null
    }
  }

  // Get comprehensive connections overview
  const getConnectionsOverview = async () => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/connections`)
      return response
    } catch (error) {
      console.error('Error fetching connections overview:', error)
      return null
    }
  }

  // Create a new connection
  const createConnection = async (data: {
    otherPersonId: string
    sharedTopics?: string[]
    collaboratedOn?: string[]
    connectionStrength?: number
  }) => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/connections`, {
        method: 'POST',
        body: {
          action: 'create-connection',
          ...data
        }
      })
      return response
    } catch (error) {
      console.error('Error creating connection:', error)
      throw error
    }
  }

  // Request introduction
  const requestIntroduction = async (data: {
    targetPersonId: string
    reason: string
    commonInterests?: string[]
  }) => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/connections`, {
        method: 'POST',
        body: {
          action: 'request-introduction',
          ...data
        }
      })
      return response
    } catch (error) {
      console.error('Error requesting introduction:', error)
      throw error
    }
  }

  // Create collaboration space
  const createCollaboration = async (data: {
    name: string
    description?: string
    topicId?: string
    roomId?: string
    contributors?: string[]
  }) => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/connections`, {
        method: 'POST',
        body: {
          action: 'create-collaboration',
          ...data
        }
      })
      return response
    } catch (error) {
      console.error('Error creating collaboration:', error)
      throw error
    }
  }

  // Add resource to collaboration
  const addResource = async (data: {
    collaborationId: string
    url: string
    title: string
    description?: string
    resourceType?: 'LINK' | 'DOCUMENT' | 'TOOL' | 'ARTICLE'
  }) => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/connections`, {
        method: 'POST',
        body: {
          action: 'add-resource',
          ...data
        }
      })
      return response
    } catch (error) {
      console.error('Error adding resource:', error)
      throw error
    }
  }

  // Add action item
  const addActionItem = async (data: {
    collaborationId: string
    task: string
    description?: string
    assignedTo: string
    dueDate?: string
    priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  }) => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/connections`, {
        method: 'POST',
        body: {
          action: 'add-action-item',
          ...data
        }
      })
      return response
    } catch (error) {
      console.error('Error adding action item:', error)
      throw error
    }
  }

  // Create work showcase
  const createShowcase = async (data: {
    projectName: string
    description: string
    contributors?: string[]
    skillsUsed?: string[]
    skillsNeeded?: string[]
    status?: 'IDEATION' | 'ACTIVE' | 'COMPLETED' | 'SEEKING_COLLABORATORS'
    contactEmail?: string
    repositoryUrl?: string
    demoUrl?: string
    images?: string[]
    tags?: string[]
  }) => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/connections`, {
        method: 'POST',
        body: {
          action: 'create-showcase',
          ...data
        }
      })
      return response
    } catch (error) {
      console.error('Error creating showcase:', error)
      throw error
    }
  }

  return {
    getConnections,
    getSuggestions,
    getCollaborations,
    getNetworkStats,
    getConnectionsOverview,
    createConnection,
    requestIntroduction,
    createCollaboration,
    addResource,
    addActionItem,
    createShowcase
  }
}

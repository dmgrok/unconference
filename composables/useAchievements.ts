// Phase 1: Achievement System Composable
export const useAchievements = () => {
  const { currentEventId } = useEventContext()

  // Get user achievements
  const getUserAchievements = async () => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/achievements`, {
        params: { type: 'user-achievements' }
      })
      return response
    } catch (error) {
      console.error('Error fetching achievements:', error)
      return null
    }
  }

  // Get achievement progress
  const getAchievementProgress = async () => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/achievements`, {
        params: { type: 'progress' }
      })
      return response
    } catch (error) {
      console.error('Error fetching achievement progress:', error)
      return null
    }
  }

  // Get achievement leaderboard
  const getLeaderboard = async () => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/achievements`, {
        params: { type: 'leaderboard' }
      })
      return response
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      return null
    }
  }

  // Check for new achievements (call this after user actions)
  const checkAchievements = async () => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/achievements`, {
        method: 'POST',
        body: {
          action: 'check-triggers'
        }
      })
      return response
    } catch (error) {
      console.error('Error checking achievements:', error)
      return null
    }
  }

  // Grant specific achievement (admin function)
  const grantAchievement = async (achievementType: string, metadata = {}) => {
    if (!currentEventId.value) return null
    
    try {
      const response = await $fetch(`/api/events/${currentEventId.value}/achievements`, {
        method: 'POST',
        body: {
          action: 'grant-achievement',
          achievementType,
          metadata
        }
      })
      return response
    } catch (error) {
      console.error('Error granting achievement:', error)
      throw error
    }
  }

  return {
    getUserAchievements,
    getAchievementProgress,
    getLeaderboard,
    checkAchievements,
    grantAchievement
  }
}

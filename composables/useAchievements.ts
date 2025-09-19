// Simplified Achievement System Composable - Lean MVP
export const useAchievements = () => {
  const { currentEventId } = useEventContext()

  // Get user achievements (simplified)
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

  // Check for new achievements after user actions
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

  return {
    getUserAchievements,
    checkAchievements
    // Removed: getLeaderboard (gamification), getAchievementProgress (too complex)
    // Removed: grantAchievement (admin complexity)
  }
}

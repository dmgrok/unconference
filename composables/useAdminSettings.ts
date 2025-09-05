export const useAdminSettings = () => {
  // Reactive state that will be loaded from the API
  const settings = useState('admin-settings', () => ({
    maxVotesPerTopic: 12,
    topTopicsCount: 10,
    showVoterNames: true,
    allowTopicSubmission: true,
    autoStartNewRound: false,
    roundDurationMinutes: 20,  // Default round duration
    maxTopicsPerRound: 8       // Maximum topics that can be selected per round
  }))

  const loading = useState('admin-settings-loading', () => false)
  const error = useState('admin-settings-error', () => null as string | null)

  const loadSettings = async () => {
    try {
      loading.value = true
      error.value = null
      const data = await $fetch('/api/admin/settings')
      settings.value = { ...settings.value, ...data }
    } catch (err: any) {
      console.warn('Failed to load admin settings, using defaults:', err.message)
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  const saveSettings = async (newSettings: Partial<typeof settings.value>) => {
    try {
      loading.value = true
      error.value = null
      
      // Update local state immediately
      Object.assign(settings.value, newSettings)
      
      // Save to server
      await $fetch('/api/admin/settings', {
        method: 'POST',
        body: settings.value
      })
    } catch (err: any) {
      console.error('Failed to save admin settings:', err.message)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateSetting = async (key: keyof typeof settings.value, value: any) => {
    await saveSettings({ [key]: value })
  }

  return {
    settings: readonly(settings),
    loading: readonly(loading),
    error: readonly(error),
    loadSettings,
    saveSettings,
    updateSetting
  }
}
export const useViewerMode = () => {
  // Viewer mode settings - when enabled, admin sees participant view
  const settings = useState('viewer-mode-settings', () => ({
    enabled: false,
    simulateRole: 'User' as 'User' | 'Guest',
    hideAdminFeatures: true,
    simulateUserEmail: 'viewer@example.com'
  }))

  const isViewerMode = computed(() => settings.value.enabled)

  const toggleViewerMode = () => {
    settings.value.enabled = !settings.value.enabled
  }

  const enableViewerMode = (role: 'User' | 'Guest' = 'User') => {
    settings.value.enabled = true
    settings.value.simulateRole = role
  }

  const disableViewerMode = () => {
    settings.value.enabled = false
  }

  // Function to get the effective user role for display purposes
  const getEffectiveRole = (actualRole?: string) => {
    if (isViewerMode.value && actualRole === 'Admin') {
      return settings.value.simulateRole
    }
    return actualRole
  }

  // Function to check if admin features should be hidden
  const shouldHideAdminFeatures = (actualRole?: string) => {
    return isViewerMode.value && actualRole === 'Admin' && settings.value.hideAdminFeatures
  }

  return {
    settings: readonly(settings),
    isViewerMode: readonly(isViewerMode),
    toggleViewerMode,
    enableViewerMode,
    disableViewerMode,
    getEffectiveRole,
    shouldHideAdminFeatures
  }
}
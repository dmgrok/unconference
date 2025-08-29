// Global application configuration composable
const appConfig = reactive({
  title: 'Unconference',
  tagline: 'Shape Your Own Conference',
  description: 'Join collaborative discussions where you decide the agenda. Propose topics, vote on interests, and engage in meaningful conversations.',
  version: '2025'
})

export const useApplicationConfig = () => {
  const updateAppConfig = (newConfig: Partial<typeof appConfig>) => {
    Object.assign(appConfig, newConfig)
  }

  const getAppConfig = () => appConfig

  // Get the full title with version if needed
  const getFullTitle = () => `${appConfig.title} ${appConfig.version}`

  // Get just the base title
  const getTitle = () => appConfig.title

  return {
    appConfig: readonly(appConfig),
    updateAppConfig,
    getAppConfig,
    getFullTitle,
    getTitle
  }
}

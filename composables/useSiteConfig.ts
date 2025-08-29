// Global application configuration composable
const siteConfig = reactive({
  title: 'Unconference',
  tagline: 'Shape Your Own Conference',
  description: 'Join collaborative discussions where you decide the agenda. Propose topics, vote on interests, and engage in meaningful conversations.',
  version: '2025'
})

export const useSiteConfig = () => {
  const updateSiteConfig = (newConfig: Partial<typeof siteConfig>) => {
    Object.assign(siteConfig, newConfig)
  }

  const getSiteConfig = () => siteConfig

  // Get the full title with version if needed
  const getFullTitle = () => `${siteConfig.title} ${siteConfig.version}`

  // Get just the base title
  const getTitle = () => siteConfig.title

  return {
    siteConfig: readonly(siteConfig),
    updateSiteConfig,
    getSiteConfig,
    getFullTitle,
    getTitle
  }
}

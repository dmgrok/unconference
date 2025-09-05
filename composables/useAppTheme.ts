import { useTheme } from 'vuetify'

export const useAppTheme = () => {
  const vuetifyTheme = useTheme()
  
  // Get stored theme preference from localStorage
  const getStoredTheme = (): string => {
    if (process.client) {
      return localStorage.getItem('theme-preference') || 'light'
    }
    return 'light'
  }
  
  // Store theme preference in localStorage
  const setStoredTheme = (theme: string) => {
    if (process.client) {
      localStorage.setItem('theme-preference', theme)
    }
  }
  
  // Initialize theme
  const initializeTheme = () => {
    const storedTheme = getStoredTheme()
    applyTheme(storedTheme)
  }
  
  // Apply theme based on preference
  const applyTheme = (themePreference: string) => {
    let targetTheme = 'light'
    
    if (themePreference === 'dark') {
      targetTheme = 'dark'
    } else if (themePreference === 'auto') {
      // Auto theme based on system preference
      if (process.client && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        targetTheme = 'dark'
      }
    }
    
    vuetifyTheme.global.name.value = targetTheme
    setStoredTheme(themePreference)
  }
  
  // Get current theme
  const getCurrentTheme = () => {
    return getStoredTheme()
  }
  
  // Watch for system theme changes when in auto mode
  const setupAutoThemeWatcher = () => {
    if (process.client && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        const currentPreference = getStoredTheme()
        if (currentPreference === 'auto') {
          applyTheme('auto')
        }
      }
      
      mediaQuery.addEventListener('change', handleChange)
      
      // Return cleanup function
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    return () => {}
  }
  
  return {
    applyTheme,
    getCurrentTheme,
    initializeTheme,
    setupAutoThemeWatcher
  }
}

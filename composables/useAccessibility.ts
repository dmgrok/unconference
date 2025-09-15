export const useAccessibility = () => {
  const isHighContrast = ref(false)
  const isMotionReduced = ref(false)
  const fontSize = ref('normal')

  // Check for user preferences from system/localStorage
  const initializeAccessibilitySettings = () => {
    // Check for high contrast mode preference
    if (process.client) {
      // Check localStorage first
      const storedHighContrast = localStorage.getItem('highContrastMode')
      if (storedHighContrast) {
        isHighContrast.value = storedHighContrast === 'true'
      }

      // Check system preference for reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
      isMotionReduced.value = prefersReducedMotion.matches

      // Listen for changes
      prefersReducedMotion.addEventListener('change', (e) => {
        isMotionReduced.value = e.matches
      })

      // Check for font size preference
      const storedFontSize = localStorage.getItem('fontSize')
      if (storedFontSize && ['small', 'normal', 'large', 'x-large'].includes(storedFontSize)) {
        fontSize.value = storedFontSize
      }

      // Apply settings
      applyAccessibilitySettings()
    }
  }

  const toggleHighContrast = () => {
    isHighContrast.value = !isHighContrast.value
    if (process.client) {
      localStorage.setItem('highContrastMode', isHighContrast.value.toString())
      applyAccessibilitySettings()
    }
  }

  const setFontSize = (size: string) => {
    fontSize.value = size
    if (process.client) {
      localStorage.setItem('fontSize', size)
      applyAccessibilitySettings()
    }
  }

  const applyAccessibilitySettings = () => {
    if (!process.client) return

    const root = document.documentElement

    // Apply high contrast mode
    if (isHighContrast.value) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Apply reduced motion
    if (isMotionReduced.value) {
      root.classList.add('reduced-motion')
    } else {
      root.classList.remove('reduced-motion')
    }

    // Apply font size
    root.classList.remove('font-small', 'font-normal', 'font-large', 'font-x-large')
    root.classList.add(`font-${fontSize.value}`)
  }

  // Focus management utilities
  const announceTtoScreenReader = (message: string) => {
    if (!process.client) return

    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message

    document.body.appendChild(announcement)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  const focusElement = (selector: string, delay = 0) => {
    if (!process.client) return

    setTimeout(() => {
      const element = document.querySelector(selector) as HTMLElement
      if (element && typeof element.focus === 'function') {
        element.focus()
      }
    }, delay)
  }

  const trapFocus = (container: HTMLElement) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',')

    const focusableElements = container.querySelectorAll(focusableSelectors) as NodeListOf<HTMLElement>
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeydown)

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeydown)
    }
  }

  return {
    isHighContrast: readonly(isHighContrast),
    isMotionReduced: readonly(isMotionReduced),
    fontSize: readonly(fontSize),
    initializeAccessibilitySettings,
    toggleHighContrast,
    setFontSize,
    announceTtoScreenReader,
    focusElement,
    trapFocus
  }
}
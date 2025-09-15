/**
 * Haptic Feedback Composable
 *
 * Provides a comprehensive haptic feedback system for mobile devices
 * with fallbacks for devices that don't support haptic feedback.
 */

import { ref, computed } from 'vue'

export interface HapticFeedbackOptions {
  enabled?: boolean
  fallbackToVibration?: boolean
  visualFeedback?: boolean
  audioFeedback?: boolean
}

export type HapticType = 'selection' | 'impact' | 'notification' | 'success' | 'warning' | 'error'
export type HapticIntensity = 'light' | 'medium' | 'heavy'

export const useHapticFeedback = (options: HapticFeedbackOptions = {}) => {
  const defaultOptions: Required<HapticFeedbackOptions> = {
    enabled: true,
    fallbackToVibration: true,
    visualFeedback: false,
    audioFeedback: false
  }

  const config = { ...defaultOptions, ...options }
  const isSupported = ref(false)
  const isEnabled = ref(config.enabled)

  // Check for haptic feedback support
  const checkSupport = () => {
    // iOS Safari Haptic Feedback API
    if ('ontouchstart' in window && 'DeviceMotionEvent' in window) {
      isSupported.value = true
      return true
    }

    // Android Chrome Vibration API
    if ('vibrate' in navigator) {
      isSupported.value = true
      return true
    }

    // Web Vibration API (broader support)
    if (navigator.vibrate) {
      isSupported.value = true
      return true
    }

    return false
  }

  // Initialize support detection
  checkSupport()

  /**
   * Trigger haptic feedback based on type and intensity
   */
  const triggerHaptic = async (type: HapticType, intensity: HapticIntensity = 'medium') => {
    if (!isEnabled.value) return

    try {
      // Try iOS Haptic Feedback API first
      if (await tryIOSHapticFeedback(type, intensity)) return

      // Fallback to Android/Web Vibration API
      if (config.fallbackToVibration && await tryVibrationAPI(type, intensity)) return

      // Visual feedback as final fallback
      if (config.visualFeedback) {
        await triggerVisualFeedback(type)
      }

      // Audio feedback if enabled
      if (config.audioFeedback) {
        await triggerAudioFeedback(type)
      }

    } catch (error) {
      console.warn('Haptic feedback failed:', error)
    }
  }

  /**
   * iOS Safari Haptic Feedback API
   */
  const tryIOSHapticFeedback = async (type: HapticType, intensity: HapticIntensity): Promise<boolean> => {
    // Check if running on iOS Safari
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (!isIOS) return false

    try {
      // iOS 13+ Haptic Feedback API (if available)
      if ((window as any).DeviceMotionEvent && typeof (window as any).DeviceMotionEvent.requestPermission === 'function') {
        const permission = await (window as any).DeviceMotionEvent.requestPermission()
        if (permission !== 'granted') return false
      }

      // Map types to iOS haptic patterns
      const hapticMap = {
        selection: () => triggerIOSSelectionFeedback(),
        impact: () => triggerIOSImpactFeedback(intensity),
        notification: () => triggerIOSNotificationFeedback(type as 'success' | 'warning' | 'error'),
        success: () => triggerIOSNotificationFeedback('success'),
        warning: () => triggerIOSNotificationFeedback('warning'),
        error: () => triggerIOSNotificationFeedback('error')
      }

      const hapticFunction = hapticMap[type]
      if (hapticFunction) {
        await hapticFunction()
        return true
      }
    } catch (error) {
      console.warn('iOS haptic feedback failed:', error)
    }

    return false
  }

  /**
   * iOS Selection Feedback
   */
  const triggerIOSSelectionFeedback = async () => {
    try {
      // Create subtle feedback for selection changes
      if (navigator.vibrate) {
        navigator.vibrate([10])
      }
    } catch (error) {
      console.warn('iOS selection feedback failed:', error)
    }
  }

  /**
   * iOS Impact Feedback
   */
  const triggerIOSImpactFeedback = async (intensity: HapticIntensity) => {
    try {
      const patterns = {
        light: [15],
        medium: [25],
        heavy: [35, 10, 25]
      }

      if (navigator.vibrate) {
        navigator.vibrate(patterns[intensity])
      }
    } catch (error) {
      console.warn('iOS impact feedback failed:', error)
    }
  }

  /**
   * iOS Notification Feedback
   */
  const triggerIOSNotificationFeedback = async (notificationType: 'success' | 'warning' | 'error') => {
    try {
      const patterns = {
        success: [20, 10, 20],
        warning: [30, 20, 30, 20, 30],
        error: [50, 30, 50]
      }

      if (navigator.vibrate) {
        navigator.vibrate(patterns[notificationType])
      }
    } catch (error) {
      console.warn('iOS notification feedback failed:', error)
    }
  }

  /**
   * Android/Web Vibration API
   */
  const tryVibrationAPI = async (type: HapticType, intensity: HapticIntensity): Promise<boolean> => {
    if (!navigator.vibrate) return false

    try {
      const vibrationPatterns = {
        selection: {
          light: [5],
          medium: [10],
          heavy: [15]
        },
        impact: {
          light: [20],
          medium: [40],
          heavy: [60]
        },
        notification: {
          light: [30, 10, 30],
          medium: [50, 20, 50],
          heavy: [80, 30, 80]
        },
        success: {
          light: [20, 10, 20],
          medium: [30, 15, 30],
          heavy: [40, 20, 40]
        },
        warning: {
          light: [30, 15, 30, 15, 30],
          medium: [40, 20, 40, 20, 40],
          heavy: [50, 25, 50, 25, 50]
        },
        error: {
          light: [50, 20, 50],
          medium: [70, 30, 70],
          heavy: [100, 40, 100]
        }
      }

      const pattern = vibrationPatterns[type][intensity]
      navigator.vibrate(pattern)
      return true

    } catch (error) {
      console.warn('Vibration API failed:', error)
      return false
    }
  }

  /**
   * Visual Feedback
   */
  const triggerVisualFeedback = async (type: HapticType) => {
    try {
      // Create a temporary visual element for feedback
      const feedbackElement = document.createElement('div')
      feedbackElement.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        width: 60px;
        height: 60px;
        transform: translate(-50%, -50%);
        background: ${getVisualFeedbackColor(type)};
        border-radius: 50%;
        opacity: 0.8;
        pointer-events: none;
        z-index: 10000;
        animation: hapticPulse 0.3s ease-out forwards;
      `

      // Add CSS animation
      if (!document.querySelector('#haptic-feedback-styles')) {
        const style = document.createElement('style')
        style.id = 'haptic-feedback-styles'
        style.textContent = `
          @keyframes hapticPulse {
            0% { transform: translate(-50%, -50%) scale(0); opacity: 0.8; }
            50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.6; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
          }
        `
        document.head.appendChild(style)
      }

      document.body.appendChild(feedbackElement)

      // Remove element after animation
      setTimeout(() => {
        if (feedbackElement.parentNode) {
          feedbackElement.parentNode.removeChild(feedbackElement)
        }
      }, 300)

    } catch (error) {
      console.warn('Visual feedback failed:', error)
    }
  }

  /**
   * Audio Feedback
   */
  const triggerAudioFeedback = async (type: HapticType) => {
    try {
      // Create audio context for subtle sound feedback
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Set frequency based on feedback type
      const frequencies = {
        selection: 800,
        impact: 400,
        notification: 600,
        success: 800,
        warning: 600,
        error: 300
      }

      oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime)
      oscillator.type = 'sine'

      // Set volume and duration
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)

    } catch (error) {
      console.warn('Audio feedback failed:', error)
    }
  }

  /**
   * Get visual feedback color based on type
   */
  const getVisualFeedbackColor = (type: HapticType): string => {
    const colors = {
      selection: 'rgba(33, 150, 243, 0.8)',  // Blue
      impact: 'rgba(156, 39, 176, 0.8)',     // Purple
      notification: 'rgba(255, 193, 7, 0.8)', // Amber
      success: 'rgba(76, 175, 80, 0.8)',     // Green
      warning: 'rgba(255, 152, 0, 0.8)',     // Orange
      error: 'rgba(244, 67, 54, 0.8)'        // Red
    }
    return colors[type]
  }

  /**
   * Convenience methods for common interactions
   */
  const selection = (intensity: HapticIntensity = 'light') => triggerHaptic('selection', intensity)
  const impact = (intensity: HapticIntensity = 'medium') => triggerHaptic('impact', intensity)
  const success = (intensity: HapticIntensity = 'medium') => triggerHaptic('success', intensity)
  const warning = (intensity: HapticIntensity = 'medium') => triggerHaptic('warning', intensity)
  const error = (intensity: HapticIntensity = 'heavy') => triggerHaptic('error', intensity)
  const notification = (intensity: HapticIntensity = 'medium') => triggerHaptic('notification', intensity)

  /**
   * Enable/disable haptic feedback
   */
  const enable = () => { isEnabled.value = true }
  const disable = () => { isEnabled.value = false }
  const toggle = () => { isEnabled.value = !isEnabled.value }

  /**
   * Check if device supports haptic feedback
   */
  const hasSupport = computed(() => isSupported.value)
  const enabled = computed(() => isEnabled.value)

  return {
    // State
    hasSupport,
    enabled,

    // Core methods
    triggerHaptic,

    // Convenience methods
    selection,
    impact,
    success,
    warning,
    error,
    notification,

    // Control methods
    enable,
    disable,
    toggle,

    // Configuration
    checkSupport
  }
}

/**
 * Global haptic feedback instance for use across the app
 */
let globalHapticInstance: ReturnType<typeof useHapticFeedback> | null = null

export const useGlobalHapticFeedback = () => {
  if (!globalHapticInstance) {
    globalHapticInstance = useHapticFeedback({
      enabled: true,
      fallbackToVibration: true,
      visualFeedback: false,
      audioFeedback: false
    })
  }
  return globalHapticInstance
}

/**
 * Vue directive for automatic haptic feedback on interactions
 */
export const vHaptic = {
  mounted(el: HTMLElement, binding: any) {
    const haptic = useGlobalHapticFeedback()

    const handleInteraction = () => {
      const { type = 'selection', intensity = 'light' } = binding.value || {}
      haptic.triggerHaptic(type, intensity)
    }

    // Add event listeners
    el.addEventListener('click', handleInteraction)
    el.addEventListener('touchstart', handleInteraction, { passive: true })

    // Store cleanup function
    ;(el as any)._hapticCleanup = () => {
      el.removeEventListener('click', handleInteraction)
      el.removeEventListener('touchstart', handleInteraction)
    }
  },

  unmounted(el: HTMLElement) {
    if ((el as any)._hapticCleanup) {
      ;(el as any)._hapticCleanup()
    }
  }
}

// Export types
export type { HapticFeedbackOptions, HapticType, HapticIntensity }
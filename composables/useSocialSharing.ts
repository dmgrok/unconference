export const useSocialSharing = () => {
  const isGenerating = ref(false)
  const shareContent = ref(null)
  const error = ref(null)

  /**
   * Generate shareable content for a platform
   */
  const generateShareContent = async (eventId: string, platform: string, template: string, customMessage?: string) => {
    isGenerating.value = true
    error.value = null

    try {
      const { data } = await $fetch(`/api/events/${eventId}/share`, {
        method: 'POST',
        body: {
          platform,
          template,
          customMessage,
          includeMetrics: true,
          includeHashtags: true
        }
      })

      shareContent.value = data
      return data
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to generate share content'
      throw err
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * Open native sharing dialog
   */
  const shareNatively = async (content: any) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Unconference Experience',
          text: content.message,
          url: content.linkUrl
        })
        return true
      } catch (err) {
        console.log('Native sharing cancelled or failed')
        return false
      }
    }
    return false
  }

  /**
   * Copy content to clipboard
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      return false
    }
  }

  /**
   * Open platform sharing window
   */
  const openShareWindow = (shareUrl: string, platform: string) => {
    const width = 600
    const height = 400
    const left = (window.innerWidth - width) / 2
    const top = (window.innerHeight - height) / 2

    window.open(
      shareUrl,
      `share-${platform}`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
    )
  }

  /**
   * Get platform-specific sharing templates
   */
  const getTemplateOptions = () => [
    {
      value: 'event_summary',
      label: 'Event Summary',
      description: 'Share overall event experience with metrics'
    },
    {
      value: 'connections_made',
      label: 'Connections Made',
      description: 'Highlight networking success'
    },
    {
      value: 'key_learnings',
      label: 'Key Learnings',
      description: 'Share insights and knowledge gained'
    },
    {
      value: 'collaboration_success',
      label: 'Collaboration Success',
      description: 'Focus on partnerships and opportunities'
    },
    {
      value: 'custom',
      label: 'Custom Message',
      description: 'Write your own personalized message'
    }
  ]

  /**
   * Get supported platforms
   */
  const getPlatformOptions = () => [
    {
      value: 'linkedin',
      label: 'LinkedIn',
      icon: 'mdi-linkedin',
      color: '#0077B5',
      description: 'Professional network sharing'
    },
    {
      value: 'twitter',
      label: 'Twitter',
      icon: 'mdi-twitter',
      color: '#1DA1F2',
      description: 'Quick updates and highlights'
    },
    {
      value: 'facebook',
      label: 'Facebook',
      icon: 'mdi-facebook',
      color: '#1877F2',
      description: 'Detailed experience sharing'
    }
  ]

  /**
   * Format content for display
   */
  const formatContentPreview = (content: any) => {
    if (!content) return ''

    let preview = content.message

    if (content.hashtags && content.hashtags.length > 0) {
      preview += '\n\n' + content.hashtags.join(' ')
    }

    if (content.linkUrl) {
      preview += '\n\n' + content.linkUrl
    }

    return preview
  }

  /**
   * Get character count for platform limits
   */
  const getCharacterCount = (content: any, platform: string) => {
    if (!content) return 0

    const preview = formatContentPreview(content)

    // Platform-specific limits
    const limits = {
      twitter: 280,
      linkedin: 3000,
      facebook: 63206
    }

    return {
      count: preview.length,
      limit: limits[platform as keyof typeof limits] || 1000,
      isOverLimit: preview.length > (limits[platform as keyof typeof limits] || 1000)
    }
  }

  return {
    // State
    isGenerating: readonly(isGenerating),
    shareContent: readonly(shareContent),
    error: readonly(error),

    // Actions
    generateShareContent,
    shareNatively,
    copyToClipboard,
    openShareWindow,

    // Utilities
    getTemplateOptions,
    getPlatformOptions,
    formatContentPreview,
    getCharacterCount
  }
}
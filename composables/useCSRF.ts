export const useCSRF = () => {
  const getCSRFToken = (): string | null => {
    if (import.meta.client) {
      return useCookie('csrf-token').value || null
    }
    return null
  }

  const setCSRFHeader = (headers: Record<string, string> = {}): Record<string, string> => {
    const token = getCSRFToken()
    if (token) {
      headers['x-csrf-token'] = token
    }
    return headers
  }

  const secureRequest = async (url: string, options: any = {}) => {
    const headers = setCSRFHeader(options.headers || {})
    
    return await $fetch(url, {
      ...options,
      headers
    })
  }

  return {
    getCSRFToken,
    setCSRFHeader,
    secureRequest
  }
}

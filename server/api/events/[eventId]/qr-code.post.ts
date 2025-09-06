import logger from '~/utils/logger'
import { requireEventPermission } from '~/server/utils/authService'

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'eventId')
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID is required'
    })
  }

  // Check if user has permission to manage participants in this event
  await requireEventPermission(event, eventId, 'participants', 'manage')

  try {
    // Get the request headers to build the base URL
    const headers = getHeaders(event)
    const host = headers.host || 'localhost:3000'
    const protocol = headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https')
    
    // Generate the join URL for this event
    const joinUrl = `${protocol}://${host}/join/${eventId}`
    
    // For QR code generation, you would typically use a library like 'qrcode'
    // For now, we'll return the URL and suggest using a QR code service
    const qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`
    
    return {
      success: true,
      qrCode: qrCodeDataUrl,
      joinUrl,
      message: 'QR code generated successfully'
    }

  } catch (error) {
    logger.error('Error generating QR code:', error)
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to generate QR code'
    })
  }
})

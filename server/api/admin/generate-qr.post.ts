import QRCode from 'qrcode'
import { z } from 'zod'
import logger from '../../../utils/logger'

const bodySchema = z.object({
  eventCode: z.string().min(4).max(8),
  eventName: z.string().min(1).max(100)
})

export default defineEventHandler(async (event) => {
  // Require admin or organizer authentication
  const { user } = await requireUserSession(event)
  const userRole = (user as any).Role || (user as any).role
  if (!['Admin', 'Organizer'].includes(userRole) && (user as any).globalRole !== 'SuperAdmin') {
    throw createError({
      statusCode: 403,
      message: 'Admin or organizer access required'
    })
  }

  const { eventCode, eventName } = await readValidatedBody(event, bodySchema.parse)
  
  try {
    // Get the base URL for the application
    const headers = getHeaders(event)
    const protocol = headers['x-forwarded-proto'] || (headers.host?.includes('localhost') ? 'http' : 'https')
    const host = headers.host || 'localhost:3000'
    const baseUrl = `${protocol}://${host}`
    
    // Create the join URL
    const joinUrl = `${baseUrl}/quick-join?code=${eventCode.toUpperCase()}`
    
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(joinUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    })
    
    logger.info(`Generated QR code for event: ${eventName} (${eventCode}) - URL: ${joinUrl}`)
    
    return {
      qrCode: qrCodeDataUrl,
      joinUrl,
      eventCode: eventCode.toUpperCase(),
      eventName
    }
  } catch (error) {
    logger.error('Error generating QR code:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to generate QR code'
    })
  }
})
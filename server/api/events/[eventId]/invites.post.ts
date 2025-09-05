import { promises as fs } from 'fs'
import { join } from 'path'
import { randomBytes } from 'crypto'
import logger from '../../../../utils/logger'
import { requireEventPermission } from '../../../utils/authService'

export default defineEventHandler(async (event) => {
  const eventId = getRouterParam(event, 'eventId')
  const body = await readBody(event)
  
  if (!eventId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Event ID is required'
    })
  }

  // Check if user has permission to invite participants
  await requireEventPermission(event, eventId, 'participants', 'create')

  const { emails, role = 'Participant', message = '' } = body

  if (!emails || !Array.isArray(emails) || emails.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Email list is required'
    })
  }

  try {
    const platformPath = join(process.cwd(), 'data', 'platform')
    
    // Load existing data
    const usersPath = join(platformPath, 'users.json')
    const membershipsPath = join(platformPath, 'memberships.json')
    const eventsPath = join(platformPath, 'events.json')
    const invitesPath = join(platformPath, 'invitations.json')
    
    let users = []
    let memberships = []
    let events = []
    let invitations = []
    
    try {
      const usersData = await fs.readFile(usersPath, 'utf-8')
      users = JSON.parse(usersData)
    } catch {
      // No users file yet
    }
    
    try {
      const membershipsData = await fs.readFile(membershipsPath, 'utf-8')
      memberships = JSON.parse(membershipsData)
    } catch {
      // No memberships file yet
    }
    
    try {
      const eventsData = await fs.readFile(eventsPath, 'utf-8')
      events = JSON.parse(eventsData)
    } catch {
      // No events file yet
    }
    
    try {
      const invitationsData = await fs.readFile(invitesPath, 'utf-8')
      invitations = JSON.parse(invitationsData)
    } catch {
      // No invitations file yet
    }

    // Find the event
    const eventData = events.find((e: any) => e.id === eventId)
    if (!eventData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Event not found'
      })
    }

    const results = {
      sent: [] as string[],
      existing: [] as string[],
      errors: [] as string[]
    }

    // Process each email
    for (const email of emails) {
      try {
        // Check if user already exists and is member of event
        const existingUser = users.find((u: any) => u.email === email)
        if (existingUser) {
          const existingMembership = memberships.find((m: any) => 
            m.userId === existingUser.id && m.eventId === eventId
          )
          if (existingMembership) {
            results.existing.push(email)
            continue
          }
        }

        // Check for existing invitation
        const existingInvite = invitations.find((i: any) => 
          i.email === email && i.eventId === eventId && i.status === 'pending'
        )
        
        if (existingInvite) {
          results.existing.push(email)
          continue
        }

        // Create invitation
        const invitation = {
          id: randomBytes(16).toString('hex'),
          eventId,
          email,
          role,
          message,
          status: 'pending',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          inviteCode: randomBytes(8).toString('hex')
        }

        invitations.push(invitation)

        // Here you would send the actual email
        // For now, we'll just log it
        logger.info(`Invitation sent to ${email} for event ${eventData.name}`)
        
        // In a real implementation, you'd send an email like:
        // await sendInvitationEmail(email, eventData, invitation, message)
        
        results.sent.push(email)

      } catch (error) {
        logger.error(`Error processing invitation for ${email}:`, error)
        results.errors.push(email)
      }
    }

    // Save updated invitations
    await fs.writeFile(invitesPath, JSON.stringify(invitations, null, 2))

    return {
      success: true,
      results,
      message: `Invitations processed: ${results.sent.length} sent, ${results.existing.length} already members, ${results.errors.length} errors`
    }

  } catch (error) {
    logger.error('Error sending invitations:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send invitations'
    })
  }
})

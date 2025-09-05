import { promises as fs } from 'fs'
import { join } from 'path'
import type { ActiveRound } from '~/types/topic'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const eventId = query.eventId as string
  
  // If no eventId provided, try to get it from user's current context or default to legacy
  let actualEventId = eventId
  if (!actualEventId) {
    // For backward compatibility, fall back to global data
    actualEventId = 'default-event'
  }
  
  const activeRoundPath = eventId 
    ? join(process.cwd(), 'data', 'events', eventId, 'active-round.json')
    : join(process.cwd(), 'data', 'active-round.json')
  
  const usersPath = join(process.cwd(), config.usersFilePath)
  
  try {
    // Check if active round file exists
    const fileExists = await fs.access(activeRoundPath).then(() => true).catch(() => false)
    
    if (!fileExists) {
      return null
    }
    
    const activeRoundData = await fs.readFile(activeRoundPath, 'utf-8')
    const activeRound = JSON.parse(activeRoundData) as ActiveRound
    
    // Check if round is still active based on start time and duration
    const startTime = new Date(activeRound.startTime)
    const now = new Date()
    const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60)
    
    if (elapsedMinutes >= activeRound.duration) {
      // Round has expired, mark as inactive and re-enable voting
      activeRound.isActive = false
      activeRound.votingDisabled = false
      await fs.writeFile(activeRoundPath, JSON.stringify(activeRound, null, 2))
    }
    
    // Enhance group assignments with participant names
    if (activeRound.isActive && activeRound.groupAssignments) {
      // Load users data for name formatting
      let users = []
      try {
        const usersData = await fs.readFile(usersPath, 'utf-8')
        users = JSON.parse(usersData)
      } catch (error) {
        console.warn('Could not read users file for participant name formatting')
      }
      
      // Helper function to get participant details
      const getParticipantDetails = (participantEmail: string) => {
        const userDetail = users.find((u: any) => 
          u.Email?.toLowerCase() === participantEmail.toLowerCase()
        )
        
        if (userDetail) {
          return {
            name: `${userDetail.Firstname || ''} ${userDetail.Lastname || ''}`.trim(),
            email: userDetail.Email,
            role: userDetail.Role
          }
        }
        
        if (participantEmail.includes('@unconference.guest')) {
          return {
            name: `Guest ${participantEmail.split('_')[1]?.substring(0, 4).toUpperCase() || 'User'}`,
            email: participantEmail,
            role: 'Guest'
          }
        }
        
        return {
          name: participantEmail.split('@')[0] || participantEmail,
          email: participantEmail,
          role: 'User'
        }
      }
      
      // Enhance group assignments with participant details
      activeRound.groupAssignments = activeRound.groupAssignments.map((group: any) => ({
        ...group,
        participantDetails: group.participants.map((email: string) => getParticipantDetails(email))
      }))
    }
    
    return activeRound
  } catch (error) {
    console.error('Error reading active round:', error)
    return null
  }
})

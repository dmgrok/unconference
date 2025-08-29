import { promises as fs } from 'fs'
import { join } from 'path'
import type { ActiveRound, GroupAssignment } from '~/types/topic'
import type { User } from '~/types/user'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  const userEmail = (user as User).email
  
  if (!userEmail) {
    throw createError({
      statusCode: 401,
      message: 'User email required'
    })
  }

  const activeRoundPath = join(process.cwd(), 'data', 'active-round.json')
  
  try {
    // Check if active round file exists
    const fileExists = await fs.access(activeRoundPath).then(() => true).catch(() => false)
    
    if (!fileExists) {
      return { 
        hasAssignment: false, 
        message: 'No active round' 
      }
    }
    
    const activeRoundData = await fs.readFile(activeRoundPath, 'utf-8')
    const activeRound = JSON.parse(activeRoundData) as ActiveRound
    
    if (!activeRound.isActive) {
      return { 
        hasAssignment: false, 
        message: 'No active round' 
      }
    }
    
    // Find user's group assignment
    const userAssignment = activeRound.groupAssignments?.find(group => 
      group.participants.includes(userEmail)
    )
    
    if (userAssignment) {
      return {
        hasAssignment: true,
        assignment: {
          topicId: userAssignment.topicId,
          topicTitle: userAssignment.topicTitle,
          roomAssignment: userAssignment.roomAssignment,
          participants: userAssignment.participants,
          participantCount: userAssignment.participants.length
        },
        roundInfo: {
          roundNumber: activeRound.roundNumber,
          startTime: activeRound.startTime,
          duration: activeRound.duration,
          isActive: activeRound.isActive
        }
      }
    } else {
      return {
        hasAssignment: false,
        message: 'Neither of your voted topics was selected for this round. You can join any discussion group that interests you.',
        roundInfo: {
          roundNumber: activeRound.roundNumber,
          startTime: activeRound.startTime,
          duration: activeRound.duration,
          isActive: activeRound.isActive
        }
      }
    }
  } catch (error) {
    console.error('Error getting user assignment:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to get group assignment'
    })
  }
})

import { promises as fs } from 'fs'
import { join } from 'path'
import { z } from 'zod'
import logger from '../../../utils/logger'
import type { DiscussionTopic } from '~/types/topic'
import type { Room } from '~/types/room'

const rebalanceSchema = z.object({
  minParticipantsPerTable: z.number().min(3).max(15).default(4)
})

interface RebalanceResult {
  success: boolean
  originalGroups: any[]
  rebalancedGroups: any[]
  changes: string[]
  statistics: {
    totalParticipants: number
    groupsBefore: number
    groupsAfter: number
    participantsReassigned: number
  }
}

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

  const { minParticipantsPerTable } = await readValidatedBody(event, rebalanceSchema.parse)
  const config = useRuntimeConfig()
  
  try {
    // Read current groups
    const groupsPath = join(process.cwd(), 'data', 'current-groups.json')
    const topicsPath = join(process.cwd(), config.topicsFilePath)
    const roomsPath = join(process.cwd(), 'data', 'rooms.json')
    
    const [groupsData, topicsData, roomsData] = await Promise.all([
      fs.readFile(groupsPath, 'utf-8').catch(() => '{"groups": []}'),
      fs.readFile(topicsPath, 'utf-8'),
      fs.readFile(roomsPath, 'utf-8').catch(() => '[]')
    ])
    
    const currentGroupsInfo = JSON.parse(groupsData)
    const originalGroups = currentGroupsInfo.groups || []
    const topics = JSON.parse(topicsData) as DiscussionTopic[]
    const rooms = JSON.parse(roomsData) as Room[]
    
    if (originalGroups.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No existing groups found. Create groups first.'
      })
    }
    
    logger.info(`Starting group rebalancing with minimum ${minParticipantsPerTable} participants per table`)
    
    // Identify under-capacity groups
    const underCapacityGroups = originalGroups.filter(group => 
      group.participants.length < minParticipantsPerTable
    )
    
    const adequateGroups = originalGroups.filter(group => 
      group.participants.length >= minParticipantsPerTable
    )
    
    if (underCapacityGroups.length === 0) {
      return {
        success: true,
        originalGroups,
        rebalancedGroups: originalGroups,
        changes: ['No rebalancing needed - all groups meet minimum capacity'],
        statistics: {
          totalParticipants: originalGroups.reduce((sum, g) => sum + g.participants.length, 0),
          groupsBefore: originalGroups.length,
          groupsAfter: originalGroups.length,
          participantsReassigned: 0
        }
      }
    }
    
    // Collect all participants who need reassignment
    const participantsToReassign = []
    const changes = []
    
    for (const group of underCapacityGroups) {
      changes.push(`Dissolving under-capacity group "${group.topicTitle}" (${group.participants.length}/${minParticipantsPerTable})`)
      
      for (const participant of group.participants) {
        // Find their preferences from topics
        let secondChoiceTopic: DiscussionTopic | null = null
        
        for (const topic of topics) {
          if (topic.secondChoiceVoters?.includes(participant.email)) {
            secondChoiceTopic = topic
            break
          }
        }
        
        participantsToReassign.push({
          ...participant,
          originalTopicId: group.topicId,
          originalTopicTitle: group.topicTitle,
          secondChoiceTopicId: secondChoiceTopic?.id,
          secondChoiceTopicTitle: secondChoiceTopic?.title
        })
      }
    }
    
    logger.info(`Found ${participantsToReassign.length} participants to reassign from ${underCapacityGroups.length} under-capacity groups`)
    
    // Try to assign participants to their second choice topics if those groups have space
    let participantsReassigned = 0
    const rebalancedGroups = [...adequateGroups]
    const remainingParticipants = [...participantsToReassign]
    
    // Phase 1: Assign to second choice topics if they exist and have room capacity
    for (let i = remainingParticipants.length - 1; i >= 0; i--) {
      const participant = remainingParticipants[i]
      
      if (!participant.secondChoiceTopicId) continue
      
      // Find the group for their second choice topic
      const targetGroup = rebalancedGroups.find(group => 
        group.topicId === participant.secondChoiceTopicId
      )
      
      if (!targetGroup) continue
      
      // Check room capacity
      const targetRoom = rooms.find(room => room.id === targetGroup.roomId)
      const roomCapacity = targetRoom?.capacity || 999
      
      if (targetGroup.participants.length < roomCapacity) {
        targetGroup.participants.push({
          name: participant.name,
          email: participant.email,
          role: participant.role
        })
        
        changes.push(
          `Reassigned ${participant.name} from "${participant.originalTopicTitle}" to "${participant.secondChoiceTopicTitle}" (2nd choice)`
        )
        
        remainingParticipants.splice(i, 1)
        participantsReassigned++
      }
    }
    
    // Phase 2: Distribute remaining participants to groups with available room capacity
    for (let i = remainingParticipants.length - 1; i >= 0; i--) {
      const participant = remainingParticipants[i]
      
      // Find groups with available capacity (sorted by current size descending)
      const availableGroups = rebalancedGroups
        .map(group => {
          const room = rooms.find(room => room.id === group.roomId)
          const roomCapacity = room?.capacity || 999
          return {
            ...group,
            roomCapacity,
            availableSpots: roomCapacity - group.participants.length
          }
        })
        .filter(group => group.availableSpots > 0)
        .sort((a, b) => b.participants.length - a.participants.length)
      
      if (availableGroups.length > 0) {
        const targetGroup = availableGroups[0]
        const originalGroup = rebalancedGroups.find(g => g.topicId === targetGroup.topicId)
        
        if (originalGroup) {
          originalGroup.participants.push({
            name: participant.name,
            email: participant.email,
            role: participant.role
          })
          
          changes.push(
            `Reassigned ${participant.name} from "${participant.originalTopicTitle}" to "${originalGroup.topicTitle}" (room available)`
          )
          
          remainingParticipants.splice(i, 1)
          participantsReassigned++
        }
      }
    }
    
    // Phase 3: Create overflow group for remaining participants if any
    if (remainingParticipants.length > 0) {
      // Find an available room for overflow
      const usedRoomIds = new Set(rebalancedGroups.map(g => g.roomId).filter(Boolean))
      const availableRoom = rooms.find(room => room.available && !usedRoomIds.has(room.id))
      
      const overflowGroup = {
        topicId: 'overflow-' + Date.now(),
        topicTitle: 'Overflow Discussion Group',
        participants: remainingParticipants.map(p => ({
          name: p.name,
          email: p.email,
          role: p.role
        })),
        groupNumber: rebalancedGroups.length + 1,
        roomId: availableRoom?.id,
        roomName: availableRoom?.name,
        roomCapacity: availableRoom?.capacity,
        roomLocation: availableRoom?.location,
        isOvercapacity: false,
        waitlist: [],
        actualCapacity: remainingParticipants.length
      }
      
      rebalancedGroups.push(overflowGroup)
      changes.push(`Created overflow group with ${remainingParticipants.length} participants`)
      participantsReassigned += remainingParticipants.length
    }
    
    // Update group numbers
    rebalancedGroups.forEach((group, index) => {
      group.groupNumber = index + 1
    })
    
    // Save rebalanced groups
    const rebalancedGroupsInfo = {
      ...currentGroupsInfo,
      rebalancedAt: new Date().toISOString(),
      rebalancedBy: user.email,
      minParticipantsPerTable,
      rebalanceChanges: changes,
      groups: rebalancedGroups
    }
    
    await fs.writeFile(groupsPath, JSON.stringify(rebalancedGroupsInfo, null, 2))
    
    const result: RebalanceResult = {
      success: true,
      originalGroups,
      rebalancedGroups,
      changes,
      statistics: {
        totalParticipants: originalGroups.reduce((sum, g) => sum + g.participants.length, 0),
        groupsBefore: originalGroups.length,
        groupsAfter: rebalancedGroups.length,
        participantsReassigned
      }
    }
    
    logger.info(`Group rebalancing completed: ${participantsReassigned} participants reassigned, ${result.statistics.groupsBefore} → ${result.statistics.groupsAfter} groups`)
    
    return result
    
  } catch (error) {
    if (error.statusCode) throw error
    
    logger.error('Error rebalancing groups:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to rebalance groups'
    })
  }
})
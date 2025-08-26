import { promises as fs } from 'fs'
import { join } from 'path'
import logger from '../../../utils/logger'
import type { DiscussionTopic } from '~/types/topic'
import type { Room, SessionAssignment } from '~/types/room'

interface RoomAwareGroupAssignment {
  topicId: string
  topicTitle: string
  participants: {
    name: string
    email: string
    role?: string
  }[]
  groupNumber: number
  // Room management fields
  roomId?: string
  roomName?: string
  roomCapacity?: number
  roomLocation?: string
  isOvercapacity: boolean
  waitlist: {
    name: string
    email: string
    role?: string
  }[]
  actualCapacity: number
}

export default defineEventHandler(async (event) => {
  // Require admin authentication
  const { user } = await requireUserSession(event)
  if (user.role !== 'Admin') {
    throw createError({
      statusCode: 403,
      message: 'Admin access required'
    })
  }

  const config = useRuntimeConfig()
  const topicsPath = join(process.cwd(), config.topicsFilePath)
  const usersPath = join(process.cwd(), config.usersFilePath)
  const roomsPath = join(process.cwd(), 'data', 'rooms.json')
  
  try {
    // Read all data files
    const topicsData = await fs.readFile(topicsPath, 'utf-8')
    const topics = JSON.parse(topicsData) as DiscussionTopic[]
    
    let users = []
    try {
      const usersData = await fs.readFile(usersPath, 'utf-8')
      users = JSON.parse(usersData)
    } catch (error) {
      logger.warn('Could not read users file, using voter information from topics')
    }
    
    // Read available rooms
    let rooms: Room[] = []
    try {
      const roomsData = await fs.readFile(roomsPath, 'utf-8')
      rooms = JSON.parse(roomsData)
    } catch (error) {
      throw createError({
        statusCode: 400,
        message: 'No rooms configured. Please set up rooms first.'
      })
    }
    
    // Filter available rooms
    const availableRooms = rooms.filter(room => room.available)
    if (availableRooms.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No rooms available for group assignments.'
      })
    }
    
    // Get all topics that have reached the vote limit or are selected for round
    const selectedTopics = topics.filter(topic => 
      topic.selectedForRound || topic.votes >= config.public.maxVotesPerTopic
    )
    
    if (selectedTopics.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No topics are ready for group formation. Topics need to reach the vote limit or be manually selected.'
      })
    }
    
    // Helper function to get participant details
    const getParticipantDetails = (voterEmail: string) => {
      const userDetail = users.find((u: any) => 
        u.Email?.toLowerCase() === voterEmail.toLowerCase()
      )
      
      if (userDetail) {
        return {
          name: `${userDetail.Firstname || ''} ${userDetail.Lastname || ''}`.trim(),
          email: userDetail.Email,
          role: userDetail.Role
        }
      }
      
      if (voterEmail.includes('@unconference.guest')) {
        return {
          name: `Guest ${voterEmail.split('_')[1]?.substring(0, 6).toUpperCase() || 'User'}`,
          email: voterEmail,
          role: 'Guest'
        }
      }
      
      return {
        name: voterEmail.split('@')[0] || voterEmail,
        email: voterEmail,
        role: 'User'
      }
    }
    
    // Sort topics by participant count (descending) to handle largest groups first
    const sortedTopics = selectedTopics.sort((a, b) => b.voters.length - a.voters.length)
    
    // Sort rooms by capacity (descending) to optimize assignment
    const sortedRooms = [...availableRooms].sort((a, b) => b.capacity - a.capacity)
    
    // Create room-aware group assignments
    const groupAssignments: RoomAwareGroupAssignment[] = []
    const assignedRoomIds = new Set<string>()
    let groupNumber = 1
    let warnings: string[] = []
    
    for (const topic of sortedTopics) {
      const allParticipants = topic.voters.map(getParticipantDetails)
      
      // Find the best fitting available room
      const suitableRoom = sortedRooms.find(room => 
        !assignedRoomIds.has(room.id) && room.capacity >= Math.min(allParticipants.length, 6) // At least 6 people minimum
      )
      
      if (!suitableRoom) {
        // No suitable room found - either assign to largest available or create waitlist
        const largestAvailableRoom = sortedRooms.find(room => !assignedRoomIds.has(room.id))
        
        if (largestAvailableRoom) {
          // Assign participants up to room capacity, rest go to waitlist
          const assignedParticipants = allParticipants.slice(0, largestAvailableRoom.capacity)
          const waitlistedParticipants = allParticipants.slice(largestAvailableRoom.capacity)
          
          groupAssignments.push({
            topicId: topic.id,
            topicTitle: topic.title,
            participants: assignedParticipants,
            groupNumber: groupNumber++,
            roomId: largestAvailableRoom.id,
            roomName: largestAvailableRoom.name,
            roomCapacity: largestAvailableRoom.capacity,
            roomLocation: largestAvailableRoom.location,
            isOvercapacity: waitlistedParticipants.length > 0,
            waitlist: waitlistedParticipants,
            actualCapacity: assignedParticipants.length
          })
          
          assignedRoomIds.add(largestAvailableRoom.id)
          
          if (waitlistedParticipants.length > 0) {
            warnings.push(`Topic "${topic.title}" has ${waitlistedParticipants.length} participants on waitlist - room at capacity`)
          }
        } else {
          // No rooms left - all participants go to waitlist for this topic
          warnings.push(`Topic "${topic.title}" could not be assigned a room - all rooms occupied`)
          groupAssignments.push({
            topicId: topic.id,
            topicTitle: topic.title,
            participants: [],
            groupNumber: groupNumber++,
            isOvercapacity: true,
            waitlist: allParticipants,
            actualCapacity: 0
          })
        }
      } else {
        // Room found - check if all participants fit
        if (allParticipants.length <= suitableRoom.capacity) {
          // All participants fit in the room
          groupAssignments.push({
            topicId: topic.id,
            topicTitle: topic.title,
            participants: allParticipants,
            groupNumber: groupNumber++,
            roomId: suitableRoom.id,
            roomName: suitableRoom.name,
            roomCapacity: suitableRoom.capacity,
            roomLocation: suitableRoom.location,
            isOvercapacity: false,
            waitlist: [],
            actualCapacity: allParticipants.length
          })
          
          assignedRoomIds.add(suitableRoom.id)
        } else {
          // Participants exceed room capacity
          const assignedParticipants = allParticipants.slice(0, suitableRoom.capacity)
          const waitlistedParticipants = allParticipants.slice(suitableRoom.capacity)
          
          groupAssignments.push({
            topicId: topic.id,
            topicTitle: topic.title,
            participants: assignedParticipants,
            groupNumber: groupNumber++,
            roomId: suitableRoom.id,
            roomName: suitableRoom.name,
            roomCapacity: suitableRoom.capacity,
            roomLocation: suitableRoom.location,
            isOvercapacity: true,
            waitlist: waitlistedParticipants,
            actualCapacity: assignedParticipants.length
          })
          
          assignedRoomIds.add(suitableRoom.id)
          warnings.push(`Topic "${topic.title}" has ${waitlistedParticipants.length} participants on waitlist - room at capacity`)
        }
      }
    }
    
    // Calculate statistics
    const totalAssignedParticipants = groupAssignments.reduce((total, group) => total + group.participants.length, 0)
    const totalWaitlistedParticipants = groupAssignments.reduce((total, group) => total + group.waitlist.length, 0)
    const totalRoomsUsed = groupAssignments.filter(group => group.roomId).length
    const totalRoomsAvailable = availableRooms.length
    
    // Log the group assignments
    logger.info(`Created ${groupAssignments.length} groups:`)
    logger.info(`- ${totalAssignedParticipants} participants assigned to rooms`)
    logger.info(`- ${totalWaitlistedParticipants} participants on waitlists`)
    logger.info(`- ${totalRoomsUsed}/${totalRoomsAvailable} rooms utilized`)
    
    if (warnings.length > 0) {
      logger.warn('Room capacity warnings:')
      warnings.forEach(warning => logger.warn(`- ${warning}`))
    }
    
    // Save group assignments to a file for persistence
    const groupsPath = join(process.cwd(), 'data', 'current-groups.json')
    await fs.writeFile(groupsPath, JSON.stringify({
      createdAt: new Date().toISOString(),
      createdBy: user.email,
      eventRound: Date.now(),
      roomConstraints: {
        totalRoomsAvailable,
        totalRoomsUsed,
        hasWaitlists: totalWaitlistedParticipants > 0,
        warnings
      },
      statistics: {
        totalAssignedParticipants,
        totalWaitlistedParticipants,
        utilizationRate: Math.round((totalRoomsUsed / totalRoomsAvailable) * 100)
      },
      groups: groupAssignments
    }, null, 2))
    
    return {
      success: true,
      groupCount: groupAssignments.length,
      totalParticipants: totalAssignedParticipants + totalWaitlistedParticipants,
      assignedParticipants: totalAssignedParticipants,
      waitlistedParticipants: totalWaitlistedParticipants,
      roomsUsed: totalRoomsUsed,
      roomsAvailable: totalRoomsAvailable,
      utilizationRate: Math.round((totalRoomsUsed / totalRoomsAvailable) * 100),
      warnings,
      hasCapacityIssues: totalWaitlistedParticipants > 0,
      groups: groupAssignments
    }
    
  } catch (error) {
    if (error.statusCode) throw error
    
    logger.error('Error creating groups:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create group assignments'
    })
  }
})
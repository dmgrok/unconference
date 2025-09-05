export interface Room {
  id: string
  name: string
  capacity: number
  location: string
  description?: string
  amenities: string[]
  available: boolean
  eventId?: string
  createdAt?: string
  updatedAt?: string
  currentSession?: SessionAssignment
}

export interface SessionAssignment {
  topicId: string
  topicTitle: string
  participants: string[]
  startTime: Date
  endTime: Date
  roomId: string
  facilitator?: string
  actualAttendance?: number
}

export interface RoomAvailability {
  roomId: string
  availableSpots: number
  isOvercapacity: boolean
  waitlistCount: number
}

export interface DiscussionTopicWithRoom {
  id: string
  title: string
  description: string
  createdBy: string
  votes: number
  voters: string[]
  badges: number
  selectedForRound?: boolean
  frozen?: boolean
  // Room management fields
  preferredRoomSize?: number
  requiredAmenities?: string[]
  roomAssignment?: string
  waitlist?: string[]
  maxCapacity?: number
  estimatedAttendance?: number
}

export const AMENITIES = [
  'projector',
  'whiteboard', 
  'flipchart',
  'microphone',
  'speakers',
  'video_conference',
  'natural_light',
  'moveable_furniture',
  'power_outlets',
  'wifi_strong'
] as const

export type Amenity = typeof AMENITIES[number]
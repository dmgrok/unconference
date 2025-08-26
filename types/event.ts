export interface Event {
  id: string
  code: string // Unique event code for joining
  name: string
  description?: string
  organizerId: string // User ID of the event organizer
  location?: string
  startDate: Date
  endDate: Date
  isActive: boolean
  settings: EventSettings
  createdAt: Date
  updatedAt: Date
}

export interface EventSettings {
  maxVotesPerTopic: number
  topTopicsCount: number
  showVoterNames: boolean
  allowTopicSubmission: boolean
  autoStartNewRound: boolean
  allowGuestAccess: boolean
  maxParticipants?: number
  theme?: EventTheme
}

export interface EventTheme {
  primaryColor?: string
  logo?: string
  backgroundColor?: string
  customCss?: string
}

export interface EventMembership {
  eventId: string
  userId: string
  role: 'Organizer' | 'Moderator' | 'Participant'
  joinedAt: Date
  isActive: boolean
}

export interface EventInvite {
  id: string
  eventId: string
  invitedBy: string
  email: string
  role: 'Organizer' | 'Moderator' | 'Participant'
  token: string
  expiresAt: Date
  usedAt?: Date
  createdAt: Date
}

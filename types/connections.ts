// Phase 1: Connection & Collaboration Types

export interface Participant {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  skills: string[]
  interests: string[]
  lookingFor: string[] // "seeking designer", "need React developer"
  contactInfo: {
    linkedin?: string
    twitter?: string
    website?: string
    allowContactSharing: boolean
  }
  achievements: Achievement[]
}

export interface EventConnection {
  id: string
  eventId: string
  participantA: string
  participantB: string
  sharedTopics: string[] // topics both voted for
  collaboratedOn: string[] // rooms/topics they worked on together
  contactExchanged: boolean
  connectionStrength: number // 1-5 based on interaction level
  meetingNotes?: string
  followUpPlanned: boolean
  followUpDate?: Date
  createdAt: Date
}

export interface CollaborationSpace {
  id: string
  eventId: string
  topicId: string
  roomId: string
  name: string
  description: string
  contributors: string[] // participant IDs
  sharedNotes: string
  resources: Resource[]
  actionItems: ActionItem[]
  files: {
    id: string
    filename: string
    url: string
    uploadedBy: string
    uploadedAt: Date
  }[]
  status: 'active' | 'completed' | 'on-hold'
  createdAt: Date
  updatedAt: Date
}

export interface Resource {
  id: string
  url: string
  title: string
  description?: string
  type: 'link' | 'document' | 'tool' | 'article'
  addedBy: string // participant ID
  addedAt: Date
  votes: number // how useful this resource was
}

export interface ActionItem {
  id: string
  task: string
  description?: string
  assignedTo: string // participant ID
  dueDate?: Date
  status: 'pending' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  createdBy: string
  createdAt: Date
  completedAt?: Date
}

export interface WorkShowcase {
  id: string
  eventId: string
  projectName: string
  description: string
  contributors: string[] // participant IDs
  skillsUsed: string[]
  skillsNeeded: string[] // still looking for
  status: 'ideation' | 'active' | 'completed' | 'seeking-collaborators'
  contactEmail?: string
  repositoryUrl?: string
  demoUrl?: string
  images: string[]
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Achievement {
  id: string
  type: 'connection' | 'collaboration' | 'knowledge' | 'community'
  name: string
  description: string
  icon: string
  badgeUrl: string
  earnedAt: Date
  eventId?: string // if earned at specific event
  metadata?: {
    connectionCount?: number
    projectsStarted?: number
    knowledgeShared?: number
  }
}

export interface IntroductionRequest {
  id: string
  eventId: string
  requesterId: string
  targetPersonId: string
  reason: string
  commonInterests: string[]
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  facilitatedBy?: string // system or person who made intro
  createdAt: Date
  completedAt?: Date
}

export interface SkillMatch {
  personA: string
  personB: string
  matchType: 'complement' | 'shared-interest' | 'mentor-mentee'
  skills: string[]
  compatibilityScore: number // 0-1
  reason: string
  eventId: string
}

export interface EventNetwork {
  eventId: string
  totalConnections: number
  averageConnectionsPerPerson: number
  topConnectors: {
    participantId: string
    connectionCount: number
  }[]
  collaborationClusters: {
    members: string[]
    sharedTopics: string[]
    strength: number
  }[]
  skillsExchanged: {
    skill: string
    teacherCount: number
    learnerCount: number
  }[]
  generatedAt: Date
}

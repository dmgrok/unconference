export interface DiscussionTopic {
  id: string
  title: string
  description: string
  createdBy: string
  votes: number
  voters: string[]
  badges: number
  selectedForRound?: boolean  // Indicates if topic has reached vote limit
  frozen?: boolean
  currentRound?: number  // Which round is this topic currently being discussed in
  // Preference voting system
  firstChoiceVoters: string[]
  secondChoiceVoters: string[]
  totalPreferenceScore: number  // weighted score: first choice = 2 points, second choice = 1 point
}

export interface UserVotePreferences {
  userEmail: string
  firstChoice?: string  // topicId
  secondChoice?: string // topicId
  hasVoted: boolean
}

export interface RoundHistory {
  roundNumber: number
  timestamp: string
  selectedTopics: {
    topicId: string
    title: string
    participantCount: number
    finalScore: number
    assignedParticipants: string[]  // emails of assigned participants
    roomAssignment?: string
  }[]
  totalParticipants: number
}

export interface ActiveRound {
  roundNumber: number
  startTime: string
  duration: number  // minutes
  selectedTopics: string[]  // topic IDs
  isActive: boolean
  groupAssignments: GroupAssignment[]
  votingDisabled: boolean
}

export interface GroupAssignment {
  topicId: string
  topicTitle: string
  participants: string[]  // participant emails
  roomAssignment?: string
}

export interface TopicSelection {
  topicId: string
  title: string
  description: string
  totalPreferenceScore: number
  participantCount: number
  selected: boolean
}

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

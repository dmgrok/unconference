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
}

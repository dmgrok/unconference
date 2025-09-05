export interface User {
  id: string
  name: string
  email: string
  globalRole?: 'SuperAdmin' | 'User' // Global platform role
  isGuest?: boolean
  eventCode?: string // For guest users
  createdAt: Date
  lastLoginAt?: Date
  isActive: boolean
}

export interface UserEventRole {
  userId: string
  eventId: string
  role: 'Organizer' | 'Moderator' | 'Participant' | 'Guest'
  permissions: EventPermission[]
  joinedAt: Date
}

export interface EventPermission {
  resource: 'topics' | 'rooms' | 'settings' | 'users' | 'rounds' | 'voting'
  actions: ('create' | 'read' | 'update' | 'delete' | 'manage')[]
}

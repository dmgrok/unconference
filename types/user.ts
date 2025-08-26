export interface User {
  name: string
  email: string
  role?: 'Admin' | 'User' | 'Guest'
  isGuest?: boolean
  eventCode?: string
}

// Server-only authorization service
import type { User, UserEventRole, EventPermission } from '~/types/user'
import type { Event } from '~/types/event'

export class AuthorizationService {
  private static instance: AuthorizationService

  static getInstance(): AuthorizationService {
    if (!AuthorizationService.instance) {
      AuthorizationService.instance = new AuthorizationService()
    }
    return AuthorizationService.instance
  }

  async canAccessEvent(userId: string, eventId: string): Promise<boolean> {
    // Import server-only service dynamically
    const { eventService } = await import('./eventService')
    const role = await eventService.getUserRoleInEvent(userId, eventId)
    return role !== null
  }

  async canPerformAction(
    userId: string, 
    eventId: string, 
    resource: string, 
    action: 'create' | 'read' | 'update' | 'delete' | 'manage'
  ): Promise<boolean> {
    const { eventService } = await import('./eventService')
    const role = await eventService.getUserRoleInEvent(userId, eventId)
    if (!role) return false

    const permissions = this.getPermissionsForRole(role)
    const resourcePermission = permissions.find(p => p.resource === resource)
    
    return resourcePermission?.actions.includes(action) || false
  }

  async isAdmin(user: User): Promise<boolean> {
    return user.globalRole === 'Admin'
  }

  async isEventOrganizer(userId: string, eventId: string): Promise<boolean> {
    const { eventService } = await import('./eventService')
    const role = await eventService.getUserRoleInEvent(userId, eventId)
    return role === 'Organizer'
  }

  async isEventModerator(userId: string, eventId: string): Promise<boolean> {
    const { eventService } = await import('./eventService')
    const role = await eventService.getUserRoleInEvent(userId, eventId)
    return role === 'Moderator' || role === 'Organizer'
  }

  private getPermissionsForRole(role: string): EventPermission[] {
    const permissions: Record<string, EventPermission[]> = {
      'Organizer': [
        { resource: 'topics', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'rooms', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'settings', actions: ['read', 'update', 'manage'] },
        { resource: 'users', actions: ['read', 'update', 'manage'] },
        { resource: 'rounds', actions: ['create', 'read', 'update', 'delete', 'manage'] },
        { resource: 'voting', actions: ['read', 'manage'] }
      ],
      'Moderator': [
        { resource: 'topics', actions: ['create', 'read', 'update'] },
        { resource: 'rooms', actions: ['read', 'update'] },
        { resource: 'settings', actions: ['read'] },
        { resource: 'users', actions: ['read'] },
        { resource: 'rounds', actions: ['read', 'update'] },
        { resource: 'voting', actions: ['read'] }
      ],
      'Participant': [
        { resource: 'topics', actions: ['create', 'read'] },
        { resource: 'rooms', actions: ['read'] },
        { resource: 'voting', actions: ['create', 'read'] }
      ],
      'Guest': [
        { resource: 'topics', actions: ['read'] },
        { resource: 'rooms', actions: ['read'] },
        { resource: 'voting', actions: ['create', 'read'] }
      ]
    }
    
    return permissions[role] || permissions['Guest']
  }
}

export const authService = AuthorizationService.getInstance()

// Helper middleware function for API routes
export async function requireEventPermission(
  event: any,
  eventId: string,
  resource: string,
  action: 'create' | 'read' | 'update' | 'delete' | 'manage'
) {
  const { user } = await requireUserSession(event)
  
  // Admins can do anything
  if ((user as any).globalRole === 'Admin') {
    return user
  }

  const userId = (user as any).id || (user as any).email // fallback for legacy users
  const canPerform = await authService.canPerformAction(
    userId,
    eventId,
    resource,
    action
  )

  if (!canPerform) {
    throw createError({
      statusCode: 403,
      message: `Insufficient permissions to ${action} ${resource} in this event`
    })
  }

  return user
}

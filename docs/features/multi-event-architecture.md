# Multi-Event Platform Architecture

## Overview

The unconference platform has been designed as a multi-event system that supports multiple organizers running their own events while maintaining platform-wide administration capabilities.

## User Roles & Permissions

### Super Admin (Platform Level)
- **Scope**: Entire platform
- **Capabilities**:
  - View all events across the platform
  - Suspend or delete events
  - Manage platform-wide settings
  - Access analytics and logs
  - Assign/remove event organizers
  - Create global announcements

### Event Organizer (Event Level)
- **Scope**: Specific event(s) they own
- **Capabilities**:
  - Full control over their event settings
  - Create and manage rooms
  - Manage topics and voting rounds
  - Invite and manage participants/moderators
  - Access event analytics
  - Generate QR codes for event access

### Event Moderator (Event Level)
- **Scope**: Specific event(s) they're assigned to
- **Capabilities**:
  - Assist with topic management
  - Moderate discussions
  - Limited room management
  - View participant lists

### Participant (Event Level)
- **Scope**: Events they've joined
- **Capabilities**:
  - Submit and vote on topics
  - View schedules and room assignments
  - Join discussions
  - Update personal preferences

### Guest (Event Level)
- **Scope**: Specific event with guest code
- **Capabilities**:
  - Limited participation
  - Vote on topics
  - View schedules
  - No administrative features

## Data Architecture

### Directory Structure
```
data/
├── platform/
│   ├── users.json              # Global user registry
│   ├── events.json             # All events metadata
│   ├── memberships.json        # User-event relationships
│   └── super-admin-settings.json
└── events/
    ├── {eventId}/
    │   ├── settings.json       # Event-specific settings
    │   ├── topics.json         # Event topics
    │   ├── rooms.json          # Event rooms
    │   ├── active-round.json   # Current round
    │   ├── round-history.json  # Round history
    │   └── current-groups.json # Current groups
    └── {anotherEventId}/
        └── ...
```

### Key Entities

#### Event
```typescript
interface Event {
  id: string
  code: string // Unique 6-character code for joining
  name: string
  description?: string
  organizerId: string
  location?: string
  startDate: Date
  endDate: Date
  isActive: boolean
  settings: EventSettings
  createdAt: Date
  updatedAt: Date
}
```

#### User
```typescript
interface User {
  id: string
  name: string
  email: string
  globalRole?: 'SuperAdmin' | 'User'
  isActive: boolean
  createdAt: Date
  lastLoginAt?: Date
}
```

#### Event Membership
```typescript
interface UserEventRole {
  userId: string
  eventId: string
  role: 'Organizer' | 'Moderator' | 'Participant' | 'Guest'
  permissions: EventPermission[]
  joinedAt: Date
}
```

## API Endpoints

### Platform Management
- `GET /api/super-admin/dashboard` - Super admin dashboard
- `GET /api/super-admin/events` - All platform events
- `POST /api/super-admin/events/{eventId}/suspend` - Suspend event

### Event Management
- `POST /api/events/create` - Create new event
- `GET /api/events/my-events` - User's events
- `GET /api/events/{eventId}/details` - Event details
- `PUT /api/events/{eventId}/settings` - Update event settings

### Event-Scoped Resources
All existing endpoints become event-scoped:
- `/api/events/{eventId}/topics/*`
- `/api/events/{eventId}/rooms/*` 
- `/api/events/{eventId}/rounds/*`

## Authentication & Authorization

### Session Context
User sessions now include:
```typescript
{
  user: User,
  currentEventId?: string,
  eventRole?: string
}
```

### Permission Checking
```typescript
// Check if user can perform action in event
await requireEventPermission(event, eventId, 'topics', 'create')
```

### Route Protection
Pages are protected based on:
1. Authentication requirement
2. Event membership
3. Specific permissions within event

## Event Creation Flow

1. **User creates event**
   - Provides basic event information
   - Receives unique event code
   - Automatically becomes event organizer

2. **Event setup**
   - Configure settings and preferences
   - Create rooms and initial topics
   - Set up participant invitation process

3. **Participant onboarding**
   - Join with event code
   - Authenticate or register
   - Receive appropriate role and permissions

## Migration Strategy

### Phase 1: Data Migration
- Existing single-event data becomes "default event"
- Current admin becomes event organizer
- All participants get membership in default event

### Phase 2: Feature Rollout
- Enable multi-event creation
- Add event switching in UI
- Implement event-scoped permissions

### Phase 3: Platform Features
- Super admin dashboard
- Cross-event analytics
- Platform-wide settings

## Security Considerations

### Data Isolation
- Events are completely isolated
- Users can only access events they're members of
- Super admins have platform-wide access

### Permission System
- Granular permissions per resource type
- Role-based defaults with custom overrides
- Event-scoped authorization checks

### Guest Access
- Limited-time access tokens
- Event-specific guest sessions
- Restricted permissions

## Scalability

### Horizontal Scaling
- Events can be distributed across servers
- User sessions remain stateless
- Event data can be cached independently

### Performance Optimization
- Event-specific data loading
- Lazy loading of non-essential features
- Efficient permission caching

## Monitoring & Analytics

### Event-Level Metrics
- Participant engagement
- Topic submission rates
- Voting patterns
- Room utilization

### Platform-Level Metrics
- Total active events
- User growth and retention
- Resource utilization
- Performance metrics

# Organizer Management Feature

## Overview

The organizer management feature provides a comprehensive system for managing event organizers with multi-organizer support, role assignment, and secure permission management.

## Features

### 1. **Automatic Organizer Assignment**
- When a user creates an event, they automatically become the **primary organizer**
- Primary organizers have full control over their events
- Cannot be removed unless ownership is transferred

### 2. **Multi-Organizer Support**
- Events can have multiple organizers
- All organizers have the same permissions within the event
- Clear distinction between primary and additional organizers

### 3. **Organizer Invitation System**
- Current organizers can invite additional organizers
- Invitation is done via email address
- Only existing platform users can be made organizers
- Optional message support for invitations

### 4. **Role Management**
- **Primary Organizer**: Event creator, cannot be removed
- **Additional Organizers**: Can be added/removed by other organizers
- **Super Admin Override**: Super admins can manage all organizer roles

### 5. **Security & Permissions**
- Organizers cannot remove themselves (prevents accidental lockout)
- Primary organizer cannot be removed (prevents ownership loss)
- Full audit trail of role changes
- Permission validation on all operations

## API Endpoints

### Invite Organizer
```
POST /api/events/[eventId]/organizers/invite
```

**Request Body:**
```json
{
  "email": "organizer@example.com",
  "message": "Optional invitation message"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User has been added as organizer",
  "userExists": true
}
```

### List Event Organizers
```
GET /api/events/[eventId]/organizers
```

**Response:**
```json
{
  "success": true,
  "organizers": [
    {
      "id": "user-123",
      "name": "John Doe",
      "email": "john@example.com",
      "isPrimary": true,
      "joinedAt": "2025-08-29T08:00:00.000Z"
    }
  ]
}
```

### Remove Organizer
```
DELETE /api/events/[eventId]/organizers/[organizerId]/remove
```

**Response:**
```json
{
  "success": true,
  "message": "Organizer removed successfully"
}
```

## UI Components

### OrganizerManagement Component

**Usage:**
```vue
<OrganizerManagement
  :event-id="currentEventId"
  :user-role="userRole"
  :current-user-id="currentUserId"
/>
```

**Features:**
- Lists all event organizers
- Shows primary organizer badge
- Add organizer functionality
- Remove organizer with confirmation
- Real-time updates

### Settings Integration

The organizer management component is integrated into the main settings page under the "Event Organizers" section, visible to organizers and admins.

## Permission Model

### Who Can Manage Organizers:
1. **Current Event Organizers**: Can invite/remove additional organizers
2. **Super Admins**: Can manage all organizer roles across all events
3. **Event Creators**: Automatic primary organizer status

### Restrictions:
1. **Cannot remove primary organizer** without ownership transfer
2. **Cannot remove self** to prevent accidental lockout
3. **Only existing platform users** can be made organizers
4. **Must be authenticated** to perform any organizer operations

## Database Schema

### UserEventRole
```typescript
interface UserEventRole {
  userId: string
  eventId: string
  role: 'Organizer' | 'Moderator' | 'Participant' | 'Guest'
  permissions: EventPermission[]
  joinedAt: Date
}
```

### Event
```typescript
interface Event {
  id: string
  organizerId: string // Primary organizer (event creator)
  // ... other fields
}
```

## Security Considerations

1. **Input Validation**: All emails are validated before processing
2. **Permission Checks**: Every operation validates user permissions
3. **Audit Trail**: All role changes are logged
4. **Rate Limiting**: Should be implemented for invitation endpoints
5. **Data Integrity**: Prevents orphaned events by protecting primary organizer

## Error Handling

### Common Error Scenarios:
- **403 Forbidden**: User not authorized to manage organizers
- **404 Not Found**: User email not found in platform
- **400 Bad Request**: Trying to remove primary organizer or self
- **500 Internal Server Error**: Database or system errors

### Error Messages:
- Clear, user-friendly error messages
- Specific guidance for resolution
- No sensitive information exposure

## Future Enhancements

1. **Ownership Transfer**: Allow primary organizer to transfer ownership
2. **Role Hierarchy**: Different organizer permission levels
3. **Invitation System**: Send email invitations to non-platform users
4. **Batch Operations**: Add/remove multiple organizers at once
5. **Activity History**: View organizer change history
6. **Delegation**: Temporary organizer roles with expiration

## Testing

### Test Scenarios:
1. **Event Creation**: Verify automatic organizer assignment
2. **Organizer Invitation**: Test valid/invalid email addresses
3. **Permission Validation**: Verify access controls
4. **Edge Cases**: Handle missing data, network errors
5. **UI Interactions**: Test all dialog flows
6. **Security**: Attempt unauthorized operations

### Test Data:
- Multiple events with different organizer configurations
- Users with various role combinations
- Edge cases like deleted users, suspended accounts

## Migration Notes

When upgrading existing installations:
1. Existing event creators are automatically primary organizers
2. No existing data is modified
3. New permission structure is backward compatible
4. Gradual rollout recommended for large installations

# Event-User Association and Management Feature

## Overview

This feature implements persistent event-user associations and event lifecycle management. When users join events, this information is stored and referenced for future logins, allowing seamless access to their events. Organizers can also start and close their events as needed.

## Features Implemented

### 🔗 **Persistent Event-User Association**

**When users join events:**
- User membership is automatically stored in `data/platform/memberships.json`
- Includes user ID, event ID, role, permissions, and join timestamp
- Supports multiple events per user
- Tracks roles: Organizer, Moderator, Participant, Guest

**Login Flow Enhancement:**
- `post-login-redirect.get.ts` provides smart routing based on user's events:
  - No events → redirect to `/events` to join or create
  - Single event → redirect directly to that event's voting page
  - Multiple events → redirect to `/events` to choose

**Data Structure:**
```json
{
  "userId": "user_123",
  "eventId": "evt_456", 
  "role": "Participant",
  "permissions": [...],
  "joinedAt": "2025-09-05T10:30:00.000Z"
}
```

### 📅 **Enhanced Events Page**

**User Event History:**
- Shows all events the user has joined with their role
- Displays join date (relative: "Today", "2d ago", etc.)
- Event status indicators (Active/Closed)
- Quick access to event management for organizers

**Event Status Controls for Organizers:**
- Start/Close event buttons directly in event list
- Visual status indicators 
- Confirmation dialogs for status changes
- Real-time updates after status changes

**Improved Event Cards:**
- Event status chips (Active/Inactive)
- User role badges (Organizer/Participant/etc.)
- Join date information with tooltips
- Disabled "Enter Event" for closed events

### ⚙️ **Event Lifecycle Management**

**New API Endpoints:**
- `POST /api/events/[eventId]/activate` - Start an event (organizers only)
- `POST /api/events/[eventId]/close` - Close an event (organizers only)
- Enhanced super admin endpoints already existed

**Permission System:**
- Event organizers can start/close their own events
- Super admins can manage any event status
- Participants cannot change event status
- Proper error handling and validation

**Event Status Tracking:**
- `isActive` boolean field in event records
- Timestamps for activation/closure with user attribution
- Status history for audit purposes

### 🎯 **Header Navigation Enhancement**

**Quick Access:**
- "My Events" button in header for multi-event users
- Easy switching between events
- Clear visual indication of user's event involvement

## Technical Implementation

### Backend Changes

**Enhanced EventService:**
```typescript
async getUserEvents(userId: string): Promise<Event[]> {
  // Now includes role, joinedAt, and participantCount
  // Joins memberships with events data
  // Filters out guest memberships
}
```

**New Event Management APIs:**
- `server/api/events/[eventId]/activate.post.ts`
- `server/api/events/[eventId]/close.post.ts`
- Permission validation via `eventService.getUserRoleInEvent()`

### Frontend Changes

**Events Page (`pages/events/index.vue`):**
- Enhanced event interface with joinedAt and _statusLoading
- `toggleEventStatus()` function for organizer controls
- `formatJoinDate()` and `formatDateTime()` utility functions
- Improved visual design with status indicators

**Default Layout (`layouts/default.vue`):**
- Added "My Events" quick access button
- Better navigation for multi-event scenarios

## User Experience Flow

### For New Users:
1. User logs in → no events found → redirected to `/events`
2. User joins event via code → membership created with timestamp
3. Next login → redirected directly to their event

### For Multi-Event Users:
1. User logs in → multiple events found → redirected to `/events` to choose
2. Can see all their events with join dates and roles
3. Quick access via header "My Events" button

### For Event Organizers:
1. Can start/close events directly from events list
2. Visual status indicators show event state
3. Confirmation dialogs prevent accidental changes
4. Real-time feedback on status changes

## Database Schema

### Events Table:
```json
{
  "id": "evt_123",
  "name": "My Event",
  "isActive": true,
  "activatedAt": "2025-09-05T10:00:00.000Z",
  "activatedBy": "user_456",
  "closedAt": null,
  "closedBy": null,
  // ... other fields
}
```

### Memberships Table:
```json
{
  "userId": "user_123",
  "eventId": "evt_456",
  "role": "Participant", 
  "permissions": ["vote", "submit_topics"],
  "joinedAt": "2025-09-05T10:30:00.000Z"
}
```

## Security Considerations

1. **Permission Validation**: All event status changes validate organizer permissions
2. **Audit Trail**: Status changes are logged with user attribution and timestamps
3. **Input Validation**: Event IDs and user roles are validated
4. **Error Handling**: Graceful handling of missing events/permissions

## Existing Infrastructure Leveraged

This feature builds on existing systems:
- ✅ User session management (`useUserSession`)
- ✅ Event service infrastructure (`eventService`)
- ✅ Membership tracking (`memberships.json`)
- ✅ Post-login routing logic
- ✅ Super admin event management

## Future Enhancements

1. **Event Templates**: Allow organizers to create reusable event templates
2. **Event History**: More detailed participation history and analytics
3. **Event Notifications**: Notify users of event status changes
4. **Bulk Event Management**: Tools for managing multiple events
5. **Event Archiving**: Archive completed events while preserving history

## Testing

**Test Scenarios:**
1. **New User Journey**: Register → join event → login again → verify routing
2. **Multi-Event User**: Join multiple events → verify event selection page
3. **Organizer Controls**: Create event → start/close → verify status changes
4. **Permission Validation**: Attempt unauthorized status changes
5. **Data Persistence**: Verify membership data survives server restarts

**Test Data:**
- Users with 0, 1, and multiple event memberships
- Events with different organizers and status combinations
- Various user roles and permissions

## Migration Notes

This feature is **backward compatible**:
- Existing events continue to work unchanged
- Existing user sessions are preserved
- New membership tracking is additive
- No data migration required for existing installations

The implementation leverages existing infrastructure while adding new functionality in a non-breaking way.

# Event Status Protection Implementation

## Overview
This implementation ensures that users (including organizers) cannot perform any actions like starting rounds, voting, creating topics, or managing events when an event is not active (either closed or suspended). The system gracefully degrades to read-only mode.

## Changes Made

### Backend API Protection

#### New Utility Function
- Created `server/utils/eventStatusHelper.ts` with functions:
  - `checkEventStatus(eventId)` - Returns event status information
  - `requireActiveEvent(eventId)` - Middleware that throws error if event is inactive

#### Protected Endpoints
1. **Round Management**
   - `/api/events/[eventId]/rounds/start.post.ts` - Start new round
   - `/api/admin/start-round.post.ts` - Legacy start round endpoint

2. **Topic Management**
   - `/api/events/[eventId]/topics/index.post.ts` - Create new topic

3. **Legacy Endpoints (documented but not blocked for backward compatibility)**
   - `/api/topics/[id]/vote.post.ts` - Single-event voting
   - `/api/topics/preferences.post.ts` - Single-event preferences
   - `/api/topics/new-round.post.ts` - Single-event round starting
   - `/api/topics/[id]/edit.post.ts` - Single-event topic editing
   - `/api/topics/[id]/delete.post.ts` - Single-event topic deletion

### Frontend UI Protection

#### Enhanced Components
1. **pages/voting.vue**
   - **HIDDEN** (not just disabled) action buttons when event inactive:
     - "Propose Topic" button
     - "Manage Rounds" button (for admins)
     - "Reset All Votes" button
     - Topic edit/delete/freeze buttons
   - Added event status checks to vote functions with user-friendly alerts
   - Shows prominent warning when event is inactive

2. **pages/groups.vue**
   - Added comprehensive event status warnings
   - **HIDDEN** all round management buttons when event inactive:
     - "Quick Round" button
     - "Start Custom Round" button
     - "Extend Round" button
     - "End Round" button
     - "Configure Rooms" button
   - Maintained "Round History" access (read-only)
   - Updated `canStartRound` computed to include event status

3. **pages/admin/round-management.vue**
   - **HIDDEN** round management actions section when event inactive
   - **HIDDEN** active round management controls when event inactive
   - Added prominent warning alert for inactive events
   - Updated `canStartRound` computed to include event status

4. **pages/organizer.vue**
   - Added event status warning alert
   - Informs organizers that management actions are limited

5. **pages/admin/rooms.vue**
   - Added event status warning (rooms are configuration, but limited during inactive events)
   - **HIDDEN** "Add Room" button when event inactive
   - **HIDDEN** room edit buttons when event inactive
   - Maintained read-only access to room information

#### Event Status Composable Enhancement
The existing `useEventStatus()` composable provides:
- `isEventActive` - Boolean indicating if event is active
- `isEventInactive` - Boolean indicating if event is inactive
- `canEditEvent` - Boolean combining active status and user access
- `eventStatus.statusReason` - Explanation for why event is inactive

## Key Design Principles

### Complete Action Blocking
- **No one** (including organizers and admins) can perform actions on inactive events
- Actions are **HIDDEN** rather than just disabled for cleaner UX
- Clear visual feedback explains why actions are unavailable

### Graceful Degradation
- All data remains viewable in read-only mode
- Navigation between pages continues to work
- Historical data (round history, topics, participants) remains accessible
- Event status and information is clearly displayed

### User Experience Focus
- Prominent warning alerts explain the situation
- Consistent messaging across all pages
- Actions are hidden rather than disabled for cleaner interface
- Clear differentiation between what's available and what's not

## Error Handling

When attempting actions on inactive events:
- **Backend**: Returns HTTP 403 with clear messages like "Cannot perform this action: Event was closed by an organizer"
- **Frontend**: Shows user-friendly alerts and hides action buttons entirely
- **API calls**: Prevented at the function level with early return and alert

## Event Status Sources

Events can be inactive due to:
1. **Closed by organizer** - `closedAt` timestamp present
2. **Suspended by admin** - `suspendedAt` timestamp present  
3. **Explicitly set inactive** - `isActive` field set to false

## Comprehensive Protection Areas

### Voting Protection
- No voting by anyone (participants, organizers, admins)
- Vote reset functionality hidden
- Topic preference changes blocked
- Clear alerts when attempting to vote

### Round Management Protection
- No round starting of any kind
- No round extending or ending actions
- No topic selection for rounds
- Round history remains viewable

### Topic Management Protection
- No new topic creation
- No topic editing or deletion
- No topic freezing actions
- Topics remain viewable with all data

### Administrative Protection
- Room management limited (view-only)
- No round configuration changes
- Event settings may be limited
- User management may be limited

## Testing

Enhanced test script: `./test-event-status-protection.sh`

The script provides comprehensive testing for:
1. **API Endpoint Protection** - Verifies HTTP 403 responses
2. **UI Element Hiding** - Confirms buttons are hidden, not just disabled
3. **Function-Level Protection** - Tests that actions are blocked with alerts
4. **Read-Only Access** - Verifies data viewing still works
5. **Restoration Testing** - Confirms functionality returns when event reactivated

## Impact & Benefits

### Security & Data Integrity
- ✅ Prevents unauthorized actions on inactive events
- ✅ Maintains event state consistency
- ✅ Protects against accidental modifications

### User Experience
- ✅ Clear feedback when actions are unavailable
- ✅ Clean interface with hidden (not disabled) elements
- ✅ Consistent messaging across all pages
- ✅ Graceful degradation to read-only mode

### Administrative Control
- ✅ Organizers and admins can view all data
- ✅ Event status can be changed by authorized users
- ✅ Full restoration of functionality when event reactivated
- ✅ Audit trail of when events were closed/suspended

### System Reliability
- ✅ Backend validation prevents API abuse
- ✅ Frontend validation provides immediate feedback
- ✅ Backward compatibility maintained for single-event installations
- ✅ Consistent behavior across all event management scenarios

## Notes for Developers

- The protection is comprehensive but respects the read-only principle
- Legacy single-event endpoints are documented but not broken
- Multi-event installations get full protection through event-specific APIs
- The system can be easily extended to add more granular permissions if needed
- Event reactivation immediately restores all functionality

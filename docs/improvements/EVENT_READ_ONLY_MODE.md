# Event Read-Only Mode Implementation

## Overview

This document describes the implementation of read-only mode for inactive events in the Unconference platform. When an event is inactive (closed or suspended), users can view all event data but cannot make changes.

## Features Implemented

### 1. Event Status Management

**New Composable: `useEventStatus.ts`**
- Tracks event active/inactive status
- Provides computed properties for UI state management
- Handles event reactivation for organizers
- Loads event status from API

**Key Functions:**
- `isEventActive` - Boolean indicating if event is active
- `isEventInactive` - Boolean indicating if event is inactive  
- `canEditEvent` - Boolean indicating if editing is allowed
- `toggleEventStatus()` - Reactivate or close event (organizers only)

### 2. API Endpoints

**Event Status Endpoint: `/api/events/[eventId]/status.get.ts`**
- Returns current event status and metadata
- Provides status reason (suspended vs closed)
- Indicates if user can reactivate the event

**Reactivation Check: `/api/events/[eventId]/can-reactivate.get.ts`**
- Checks if current user can reactivate the event
- Only organizers and super admins can reactivate

### 3. Settings Page Enhancements

**Read-Only Controls (`/pages/settings.vue`)**
- Event status section with reactivate/close buttons
- All form inputs disabled when event is inactive
- Admin settings (voting rules) disabled when inactive
- Default topics management disabled when inactive
- Admin actions (QR generation, exports) disabled when inactive
- Clear indicators showing read-only status

**Status Indicators:**
- Event status chip (Active/Inactive)
- Read-only alerts in each section
- Disabled form styling

### 4. Voting Page Enhancements

**Read-Only Voting (`/pages/voting.vue`)**
- Event inactive alert at top of page
- Vote buttons disabled with "Event Inactive" status
- Topic creation disabled
- Topic editing/deletion disabled for organizers
- Topic freezing disabled for admins
- Clear visual indicators of disabled state

**Status Messages:**
- Vote buttons show "Event Inactive" when disabled
- Topic proposal button disabled
- Edit/Delete/Freeze buttons disabled with tooltip

### 5. Groups/Round Management

**Read-Only Round Management (`/pages/groups.vue`)**
- Event inactive alert
- Round start buttons disabled
- Quick round functionality disabled
- Round management limited to viewing only

## User Experience

### For Participants
- Can view all topics and vote history
- Cannot vote on topics
- Cannot create new topics
- Clear indication that event is inactive

### For Organizers
- Can view all event data and settings
- Cannot modify settings or start rounds
- Can reactivate event with prominent button
- All management functions show disabled state

### For Super Admins
- Same restrictions as organizers within events
- Can reactivate any event via button or admin panel
- Platform-level event management remains available

## Technical Implementation

### Event Status Flow
1. Event status loaded via `useEventStatus()` composable
2. Status checked on page load and watch for changes
3. UI elements bound to `canEditEvent` computed property
4. API calls validate permissions server-side

### Read-Only Patterns
```vue
<!-- Form inputs -->
<v-text-field
  v-model="field"
  :readonly="!canEditEvent"
  :disabled="!canEditEvent"
/>

<!-- Action buttons -->
<v-btn
  @click="action"
  :disabled="!canEditEvent"
>
  Action
</v-btn>

<!-- Status alerts -->
<v-alert v-if="isEventInactive" type="warning">
  Event is inactive - read-only mode
</v-alert>
```

### API Security
- All event modification endpoints validate event status
- Inactive events reject modification attempts
- Reactivation requires organizer or super admin role
- Status changes logged with user attribution

## Benefits

1. **Data Preservation**: Event data remains accessible when inactive
2. **Clear Status**: Users understand event state immediately
3. **Easy Reactivation**: Organizers can quickly reactivate events
4. **Consistent UX**: All editing interfaces respect event status
5. **Audit Trail**: Status changes tracked with timestamps

## Future Enhancements

1. **Scheduled Reactivation**: Allow events to be scheduled for reactivation
2. **Partial Read-Only**: Different levels of restrictions (e.g., voting only)
3. **Notification System**: Alert users when events change status
4. **Bulk Status Management**: Super admin tools for managing multiple events
5. **Status History**: Detailed log of all status changes

## Related Files

- `/composables/useEventStatus.ts` - Status management composable
- `/server/api/events/[eventId]/status.get.ts` - Status API
- `/server/api/events/[eventId]/can-reactivate.get.ts` - Reactivation check
- `/pages/settings.vue` - Main settings with read-only mode
- `/pages/voting.vue` - Voting with read-only restrictions
- `/pages/groups.vue` - Round management with restrictions

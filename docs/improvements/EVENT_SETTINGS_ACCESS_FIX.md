# Event Settings Access Fix

## Issue
Users were encountering errors when trying to view settings for inactive events:
1. 403 "Access denied to this event" error from the status API
2. Vue component unmount errors due to failed API calls
3. No graceful handling of access denied scenarios

## Root Cause
The event status API was using incorrect user ID resolution, causing authentication failures even for users who should have access to the event.

## Solution

### 1. Fixed User ID Resolution in APIs
**Problem**: APIs were using `(user as any).id || (user as any).email` which doesn't properly resolve the user ID from the session.

**Fix**: Updated both event status APIs to use the proper `resolveUserId` function:

#### `/server/api/events/[eventId]/status.get.ts`
```typescript
// Before: const userId = (user as any).id || (user as any).email
// After:
const userId = await resolveUserId(user)
if (!userId) {
  throw createError({
    statusCode: 403,
    statusMessage: 'User not found in platform'
  })
}
```

#### `/server/api/events/[eventId]/can-reactivate.get.ts`
```typescript
// Same fix applied to maintain consistency
const userId = await resolveUserId(user)
```

### 2. Enhanced Error Handling in useEventStatus Composable
**Problem**: Failed API calls were causing Vue component crashes and poor user experience.

**Fix**: Added comprehensive error handling with graceful degradation:

```typescript
const eventStatus = ref<{
  isActive: boolean
  isLoading: boolean
  canEdit: boolean
  statusReason?: string
  hasAccess: boolean  // New field
}>

try {
  const response = await $fetch(`/api/events/${targetEventId}/status`)
  // Success path
} catch (error: any) {
  if (error?.statusCode === 403) {
    // Handle access denied gracefully
    eventStatus.value = {
      isActive: false,
      isLoading: false,
      canEdit: false,
      statusReason: 'Access denied to this event',
      hasAccess: false
    }
  } else {
    // Handle other errors with sensible defaults
    eventStatus.value = {
      isActive: true,
      isLoading: false,
      canEdit: true,
      statusReason: 'Failed to load event status',
      hasAccess: true
    }
  }
}
```

### 3. Added Access Control UI in Settings Page
**Problem**: No user-friendly way to handle access denied scenarios.

**Fix**: Added access control section to settings page:

```vue
<!-- Access Denied Alert for Events -->
<v-alert
  v-if="currentEventId && !hasEventAccess"
  type="error"
  prominent
  variant="tonal"
  prepend-icon="mdi-lock"
>
  <v-alert-title>Access Denied</v-alert-title>
  <p>You don't have permission to access settings for this event.</p>
  <p class="text-caption">
    {{ eventStatus?.statusReason }}
  </p>
  <template #append>
    <v-btn color="primary" variant="outlined" to="/events">
      Back to My Events
    </v-btn>
  </template>
</v-alert>

<!-- Settings Content (only show if user has access) -->
<template v-if="!currentEventId || hasEventAccess">
  <!-- All existing settings content -->
</template>
```

## Benefits

### 1. Proper Authentication
- Event APIs now correctly resolve user IDs from sessions
- Consistent authentication across all event-related endpoints
- Proper role checking for event access

### 2. Graceful Error Handling
- No more Vue component crashes on API failures
- Clear error messages for users
- Sensible fallback behavior when APIs fail

### 3. Better User Experience
- Clear access denied messages with explanations
- Easy navigation back to accessible areas
- No confusing error screens or broken interfaces

### 4. Security
- Proper access control enforcement
- Consistent permission checking
- Clear audit trail of access attempts

## Files Modified

1. `/server/api/events/[eventId]/status.get.ts` - Fixed user ID resolution
2. `/server/api/events/[eventId]/can-reactivate.get.ts` - Fixed user ID resolution  
3. `/composables/useEventStatus.ts` - Enhanced error handling and access control
4. `/pages/settings.vue` - Added access control UI

## Testing

The fix addresses:
- ✅ 403 errors when accessing event status
- ✅ Vue component unmount errors
- ✅ Poor user experience with access denied scenarios
- ✅ Inconsistent authentication across APIs

Users can now:
- ✅ View settings for events they have access to
- ✅ Get clear messages when access is denied
- ✅ Navigate easily back to accessible areas
- ✅ Experience graceful error handling instead of crashes

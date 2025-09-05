# Topic Management and Group Viewing Improvements

## Overview
This document outlines the recent improvements to topic management permissions and group participant viewing functionality in the unconference platform.

## Topic Management Changes

### 1. Topic Deletion Permissions
**Objective**: Improve content moderation by restricting topic deletion to organizers and administrators only.

#### Previous Behavior
- Any user could delete topics they created
- Administrators could delete any topic
- Created potential for users to disrupt ongoing events by deleting their topics

#### New Behavior
- Only users with Admin or Organizer roles can delete topics
- Users can still edit topics they created
- Prevents disruption of voting and active rounds by topic deletion

#### Implementation
**API Changes** (`/server/api/topics/[id]/delete.post.ts`):
```typescript
// Check permissions: Only Admin/Organizer can delete topics
const userRole = (user as any).Role || (user as any).role
const isAdminOrOrganizer = ['Admin', 'Organizer'].includes(userRole)

if (!isAdminOrOrganizer) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Only organizers and administrators can delete topics'
  })
}
```

**UI Changes** (`/pages/voting.vue`):
```typescript
const canDeleteTopic = (topic: DiscussionTopic) => {
  return isAdmin.value // Only admins/organizers can delete topics
}
```

### 2. Topic Editing Permissions (Unchanged)
- Users can edit topics they created
- Organizers and administrators can edit any topic
- Maintains content ownership while allowing moderation

## Group Viewing Improvements

### 1. Enhanced Voting Dashboard
**Location**: `/pages/admin/voting-dashboard.vue`

#### New Features
- **Participant Count Display**: Shows number of participants for each group
- **Detailed View Button**: For groups with >8 participants, shows "View All Participants" button
- **Participant Details Dialog**: Modal showing full participant list with proper formatting

#### Implementation
```vue
<!-- Enhanced participant display -->
<div v-else-if="group.participants.length > 8" class="participant-list mt-2">
  <div class="text-caption mb-1">{{ group.participants.length }} participants assigned</div>
  <v-btn
    size="x-small"
    color="primary"
    variant="outlined"
    @click="showParticipantDetailsDialog(group)"
  >
    View All Participants
  </v-btn>
</div>
```

### 2. Enhanced Groups Page
**Location**: `/pages/groups.vue`

#### New Features
- **Participant Preview**: Shows first 6 participants with "+X more" indicator
- **View All Button**: For groups with >6 participants
- **Improved Name Formatting**: Better display of guest users and regular participants
- **Full Participant Dialog**: Detailed view with room assignment information

#### Implementation
```vue
<!-- Participant preview with "View All" option -->
<div class="d-flex align-center justify-space-between mb-2">
  <div class="d-flex align-center">
    <v-icon class="mr-1">mdi-account-group</v-icon>
    <span class="font-weight-medium">{{ group.participants.length }} participants</span>
  </div>
  <v-btn
    v-if="group.participants.length > 6"
    size="small"
    color="info"
    variant="outlined"
    @click="showAllParticipants(group)"
  >
    View All
  </v-btn>
</div>
```

### 3. Participant Name Formatting
**Improved User Experience**: Better display of participant names across the platform.

#### Features
- **Guest Users**: Displays as "Guest [ID]" instead of full email
- **Regular Users**: Shows username part of email
- **Current User**: Highlighted as "You" in participant lists
- **Consistent Formatting**: Same formatting applied across voting dashboard and groups page

#### Implementation
```typescript
function formatParticipantName(participantEmail: string) {
  if (participantEmail.includes('@unconference.guest')) {
    return `Guest ${participantEmail.split('_')[1]?.substring(0, 6).toUpperCase() || 'User'}`
  }
  return participantEmail.split('@')[0] || participantEmail
}
```

## User Experience Benefits

### For Organizers
1. **Better Content Control**: Can remove inappropriate or outdated topics
2. **Improved Group Management**: Detailed view of all participants in each group
3. **Room Assignment Clarity**: Clear display of room assignments with participant lists

### For Participants
1. **Protected Content**: Their topics won't be accidentally deleted by other users
2. **Better Group Visibility**: Can see who they'll be discussing with
3. **Clear Navigation**: Easy access to detailed group information

### For Administrators
1. **Enhanced Moderation**: Full control over topic management
2. **Detailed Analytics**: Better view of group composition and participation
3. **Event Management**: Improved tools for managing active discussions

## Security Considerations

### Topic Deletion Protection
- Prevents malicious or accidental deletion by regular users
- Maintains content stability during active voting and rounds
- Preserves discussion history and voting data

### Data Privacy
- Participant names are formatted appropriately for display
- Guest user identification is anonymized but trackable
- Personal email addresses are not exposed in UI

## Future Enhancements

### Potential Improvements
1. **Bulk Participant Management**: Move participants between groups
2. **Export Functionality**: Export participant lists for external tools
3. **Communication Tools**: Direct messaging or announcements to groups
4. **Attendance Tracking**: Mark participants as present/absent in discussions

### Performance Considerations
- Participant lists are loaded on-demand through dialogs
- Large groups (>50 people) may need pagination
- Consider caching for frequently accessed participant data

# One Participant, One Group Update

## Overview

This update i### Screen Sharing Ready

The **Admin Voting Dashboard** (`/admin/voting-dashboard`) is now perfect for screen sharing during events:
- **Prominent round timer** with visual progress bar
- **Live discussion groups grid** showing all active topics
- **Real-time participant counts** per group and total
- **Room assignments** clearly displayed
- **Retro pixel-art styling** that's easy to read on projectors
- **Automatic updates** every 2 seconds to keep information current

This creates an engaging display that participants can follow during the event.

### Real-Time Round Display

When a round becomes active, the voting page now shows:
- **Live timer** with remaining time
- **All discussion groups** with participant counts
- **Room assignments** for each group
- **User's specific assignment** highlighted
- **Real-time participant count** across all groups

This information updates every 5 seconds, ensuring users always see current round status.ements a new assignment logic for discussion rounds to ensure that each participant can only attend ONE discussion group during a round, based on their voting preferences.

## Changes Made

### New Assignment Logic

**Previous Behavior:**
- Participants could be assigned to multiple groups
- If neither 1st nor 2nd choice topic was selected, they were redistributed evenly across all selected topics
- Voting screen didn't update automatically when rounds started

**New Behavior:**
- Each participant can only be assigned to ONE group
- Assignment priority: 1st choice → 2nd choice → unassigned
- If neither voted topic is selected, participant remains unassigned but can join any discussion
- **Real-time updates**: Voting and groups pages now automatically refresh every 5 seconds to show new rounds

### Real-Time Updates

Added automatic polling functionality to ensure users see round updates immediately:
- **Voting page**: Polls for active round updates every 5 seconds
- **Groups page**: Polls for group assignment updates every 5 seconds  
- **Admin dashboard**: Enhanced existing auto-refresh (every 2 seconds) to include active rounds
- **Admin voting dashboard**: Now displays live round information for screen sharing
- Users now see timer, room assignments, and participant counts in real-time

### Priority System

1. **First Choice Priority**: If a participant's 1st choice topic is selected for the round, they are assigned to that group
2. **Second Choice Fallback**: If 1st choice is not selected but 2nd choice is selected, they are assigned to the 2nd choice group
3. **Unassigned Status**: If neither choice is selected, they receive no specific assignment but can join any available discussion group

### Files Modified

#### Server-Side Logic
- `/server/api/admin/start-round.post.ts` - Updated `createGroupAssignments()` function
- `/server/api/topics/new-round.post.ts` - Updated `createGroupAssignments()` function  
- `/server/api/events/[eventId]/rounds/start.post.ts` - Updated `createGroupAssignments()` function
- `/server/api/my-assignment.get.ts` - Updated unassigned message

#### User Interface
- `/pages/groups.vue` - Updated no assignment message + added real-time polling
- `/pages/groups-new.vue` - Updated no assignment message
- `/pages/voting.vue` - Enhanced with real-time polling and active groups display
- `/pages/admin/voting-dashboard.vue` - Enhanced with live round display for screen sharing

#### Documentation
- `/docs/round-management.md` - Updated assignment logic documentation

## Benefits

### For Participants
- **Clear Expectations**: Know exactly which group you're in (if any)
- **No Confusion**: Never assigned to multiple groups simultaneously
- **Flexible Fallback**: Can still participate if choices aren't selected

### For Organizers
- **Predictable Group Sizes**: Better control over discussion group composition
- **Clearer Reporting**: Easier to track who is assigned where
- **Maintains Engagement**: Unassigned participants can still join discussions

## User Experience

## User Experience

### When Both Choices Are Selected
- Participant is assigned to their 1st choice group
- Clear indication of assignment in UI
- Room location provided if available

### When Only 2nd Choice Is Selected
- Participant is assigned to their 2nd choice group
- UI clearly shows the assignment
- Room location provided if available

### When Neither Choice Is Selected
- Participant receives message: "Neither of your voted topics was selected for this round. You can join any discussion group that interests you."
- No specific room assignment
- Full freedom to choose any active discussion

## Technical Implementation

### Assignment Function Logic

```typescript
// Step 1: Assign to 1st choice topics (if selected)
selectedTopics.forEach(topic => {
  if (topic.firstChoiceVoters) {
    topic.firstChoiceVoters.forEach(voterEmail => {
      if (!assignedVoters.has(voterEmail)) {
        assignment.participants.push(voterEmail)
        assignedVoters.add(voterEmail)
      }
    })
  }
})

// Step 2: Assign to 2nd choice topics (if selected and not already assigned)
selectedTopics.forEach(topic => {
  if (topic.secondChoiceVoters) {
    topic.secondChoiceVoters.forEach(voterEmail => {
      if (!assignedVoters.has(voterEmail)) {
        assignment.participants.push(voterEmail)
        assignedVoters.add(voterEmail)
      }
    })
  }
})

// Step 3: Remaining participants stay unassigned (can join any group)
```

### API Response Changes

The `/api/my-assignment` endpoint now returns a more specific message for unassigned participants:

```json
{
  "hasAssignment": false,
  "message": "Neither of your voted topics was selected for this round. You can join any discussion group that interests you.",
  "roundInfo": { ... }
}
```

## Backward Compatibility

- All existing voting and topic creation functionality remains unchanged
- Previous round history is preserved
- UI gracefully handles both assigned and unassigned states
- No changes required to admin interfaces

## Testing Scenarios

### Scenario 1: 1st Choice Selected
- User votes: Topic A (1st), Topic B (2nd)
- Round selects: Topic A, Topic C
- **Result**: User assigned to Topic A

### Scenario 2: Only 2nd Choice Selected
- User votes: Topic A (1st), Topic B (2nd)
- Round selects: Topic B, Topic C
- **Result**: User assigned to Topic B

### Scenario 3: Neither Choice Selected
- User votes: Topic A (1st), Topic B (2nd)
- Round selects: Topic C, Topic D
- **Result**: User unassigned, can join any discussion

### Scenario 4: No Votes Cast
- User didn't vote for any topics
- Round selects: Topic A, Topic B
- **Result**: User unassigned, can join any discussion

## Migration Notes

This change is immediately effective for new rounds. Existing active rounds will continue with their current assignments until the round ends.

No data migration is required as this only affects the assignment logic, not the data structure.

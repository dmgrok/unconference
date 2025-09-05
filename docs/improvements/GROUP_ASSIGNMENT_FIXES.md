# Group Assignment and Topic Display Fixes

## Issues Fixed

### 1. ✅ Topic Names Showing as IDs Instead of Titles

**Problem**: When starting a round, topics were displayed as "Topic d130774e-f7fe-420e-ac83-061585fff93f" instead of their actual names.

**Root Cause**: The template was using `activeRound.selectedTopics` (which contains IDs) instead of accessing the topic titles from `groupAssignments`.

**Solution Applied**:
- **Updated ActiveRound type** in `/types/topic.ts` to include `topicTitles?: string[]`
- **Enhanced start-round API** in `/server/api/admin/start-round.post.ts` to store topic titles
- **Fixed template** in `/pages/groups.vue` to display actual topic names with participant counts

**Before**:
```vue
<v-chip v-for="topicId in activeRound.selectedTopics">
  Topic {{ topicId }}
</v-chip>
```

**After**:
```vue
<v-chip v-for="group in activeRound.groupAssignments">
  {{ group.topicTitle }}
  <v-badge :content="group.participants.length" color="success" />
</v-chip>
```

### 2. ✅ Automatic Group Assignment Not Working

**Problem**: Users were seeing "No Group Assignment" because participants weren't being automatically assigned to discussion groups.

**Root Cause**: The group assignment logic was correct, but there was no voting data to base assignments on.

**Solutions Applied**:

#### A. Enhanced Quick Round Functionality
- **Updated `/server/api/topics/new-round.post.ts`**:
  - Added automatic group assignment creation
  - Uses preference voting data (weighted: 1st choice = 2 points, 2nd choice = 1 point)
  - Creates active round with proper group assignments
  - Assigns participants based on their voting preferences
  - Distributes unassigned voters evenly across groups

#### B. Fixed Role Permissions
- **Updated role checks** to allow both `Admin` and `Organizer` roles
- Allows organizers to start quick rounds without permission errors

#### C. Improved Assignment Logic
- **First assignment**: Users assigned to their 1st choice topics (if selected)
- **Second assignment**: Remaining users assigned to their 2nd choice topics
- **Final distribution**: Any unassigned users distributed evenly across all groups
- **Room assignment**: Automatically assigns available rooms to each topic

### 3. ✅ Added Sample Voting Data for Testing

**Problem**: No voting data existed, so group assignments couldn't be tested.

**Solution**: Added realistic voting preferences to sample topics:
- "Copilot and MCP servers": 2 first-choice votes, 1 second-choice vote (5 points total)
- "GitHub Actions Hosted Runners": 1 first-choice vote, 2 second-choice votes (4 points total)

## Technical Improvements

### API Enhancements
1. **Better Data Structure**: Active rounds now include both topic IDs and titles
2. **Automatic Assignment**: Group creation automatically assigns participants based on votes
3. **Room Integration**: Automatically assigns available rooms to discussion groups
4. **Comprehensive Logging**: Better logging for debugging group assignment issues

### UI Improvements
1. **Topic Names**: Display actual topic titles instead of cryptic IDs
2. **Participant Counts**: Show number of assigned participants per topic with badges
3. **Better Feedback**: More informative display of group assignments

### Permission Consistency
- All admin endpoints now consistently allow Admin, Organizer, and Super Admin roles
- Organizers can fully manage their events without needing admin privileges

## Testing Results

With the fixes applied:
- ✅ Topic names display correctly (e.g., "Copilot and MCP servers")
- ✅ Participant counts show in badges next to topic names
- ✅ Users are automatically assigned to groups based on their voting preferences
- ✅ Organizers can start both custom and quick rounds
- ✅ Room assignments work automatically

## Future Improvements

1. **Real-time Updates**: Consider adding real-time updates when users join/leave groups
2. **Manual Reassignment**: Allow organizers to manually move participants between groups
3. **Capacity Limits**: Respect room capacity limits when assigning participants
4. **Preference Weighting**: Allow customizable weights for voting preferences

## Files Modified

1. `/types/topic.ts` - Added `topicTitles` to ActiveRound interface
2. `/server/api/admin/start-round.post.ts` - Enhanced to store topic titles
3. `/server/api/topics/new-round.post.ts` - Complete rewrite with group assignment
4. `/pages/groups.vue` - Fixed template to show topic names and participant counts
5. `/data/topics-sample.json` - Added sample voting data for testing
6. `/data/active-round.json` - Updated with proper group assignments

The group assignment system now works end-to-end, properly displaying topic names and automatically assigning participants to discussion groups! 🚀

# Round Management System

The Round Management System provides comprehensive control over discussion rounds in your unconference, including topic selection, timer functionality, and participant redistribution.

## Features

### 1. Pre-Round Planning Screen
- **Round History**: View detailed history of all previous rounds
- **Topic Selection**: Manually select which topics will be discussed in the next round
- **Topic Scoring**: Topics are sorted by preference score (weighted voting: 1st choice = 2 points, 2nd choice = 1 point)
- **Participant Count**: See how many people are interested in each topic

### 2. Round Timer System
- **Configurable Duration**: Set round duration from 5-60 minutes (default: 20 minutes)
- **Live Timer**: Real-time countdown display for all participants
- **Auto-Expiration**: Rounds automatically end when timer reaches zero
- **Visual Progress**: Progress bar showing round completion

### 3. Topic Assignment & Redistribution
- **Automatic Assignment**: Participants are assigned to topics based on their voting preferences
- **Current Topic Display**: Users see their assigned discussion topic prominently
- **Redistribution Logic**: People from unselected topics are redistributed to selected ones
- **Room Integration**: Seamless integration with room assignments

### 4. Enhanced User Experience
- **Active Round Status**: Clear indication when a round is in progress
- **Topic Assignment Display**: Users always know what topic they're discussing
- **Time Awareness**: Countdown timer keeps discussions focused
- **Admin Controls**: Easy round management with proper confirmations

## How It Works

### For Administrators

1. **Access Round Management**
   - Navigate to Admin → Round Management
   - View current round status and timer (if active)

2. **Start a New Round**
   - Click "Start New Round"
   - Review round history and topic preferences
   - Select topics for discussion (up to configurable maximum)
   - Set round duration
   - Confirm selection to start the round

3. **Monitor Active Rounds**
   - View real-time timer
   - See selected topics and participant counts
   - End round early if needed

4. **Quick Round Start**
   - Use "Quick New Round" button on dashboard for traditional round start
   - Awards badges to top topics and resets voting

### For Participants

1. **Round Awareness**
   - See active round status with countdown timer
   - Clear display of assigned discussion topic
   - Visual progress indicators

2. **Topic Assignment**
   - Automatic assignment based on voting preferences
   - Clear indication if no assignment (can join any discussion)
   - Integration with room assignments for location

3. **Between Rounds**
   - Continue proposing and voting on topics
   - See which topics were selected in previous rounds
   - Prepare for next round

## Configuration

### Admin Settings
- **Round Duration**: Default duration for new rounds (5-60 minutes)
- **Max Topics Per Round**: Maximum topics that can be selected per round (1-20)
- **Top Topics Count**: Number of topics to award badges to (1-20)

### Round Selection Logic
1. Topics are sorted by preference score (weighted voting)
2. Frozen topics are excluded from selection
3. Admins can manually select up to the configured maximum
4. Participants from unselected topics are redistributed

## API Endpoints

### Round Management
- `GET /api/admin/round-history` - Get complete round history
- `GET /api/admin/topic-selection` - Get topics available for selection
- `POST /api/admin/start-round` - Start new round with selected topics
- `POST /api/admin/end-round` - End current round early

### Round Status
- `GET /api/active-round` - Get current active round information
- Includes timer status, selected topics, and expiration

## Integration Points

### Topics System
- Topics track `currentRound` when selected
- `selectedForRound` flag indicates current round participation
- Preference voting system provides weighted scoring

### Room Assignments
- Round management integrates with existing room assignment system
- Participants know both their topic and location
- Balanced distribution across available rooms

### User Interface
- Dashboard shows active round status prominently
- Timer is visible to all participants
- Topic assignments are clearly displayed
- Admin controls are contextually shown

## Best Practices

### For Event Organizers
1. **Plan Round Duration**: Consider topic complexity and venue constraints
2. **Topic Selection**: Balance popular topics with diverse interests
3. **Monitor Progress**: Keep an eye on timer and participant engagement
4. **Room Coordination**: Ensure room assignments match selected topics

### For Participants
1. **Vote Early**: Submit preferences before round starts
2. **Stay Informed**: Check dashboard for round status and assignments
3. **Be Flexible**: Join any discussion if not assigned to a specific topic
4. **Respect Timer**: Keep discussions focused within time limits

## Troubleshooting

### Common Issues
- **No Topic Assignment**: Participant didn't vote or their topics weren't selected
- **Timer Not Updating**: Refresh page or check internet connection
- **Round Won't Start**: Ensure at least one topic is selected
- **Missing Round History**: Check file permissions for `data/round-history.json`

### Admin Controls
- Use "End Round" to stop timer early if needed
- "Quick New Round" bypasses topic selection for traditional workflow
- Settings page allows adjustment of default round parameters

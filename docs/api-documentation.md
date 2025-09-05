# API Documentation

This document provides comprehensive documentation for all API endpoints in the Unconference application.

## Authentication

All API endpoints require authentication via session cookies. Users must be logged in through GitHub OAuth or as a guest user.

### Authentication Headers
```
Cookie: nuxt-session=<session-token>
```

## Topics API

### GET /api/topics
Get all discussion topics with voting information.

**Response:**
```json
[
  {
    "id": "topic-123",
    "title": "AI and Machine Learning",
    "description": "Discussion about AI trends",
    "createdBy": "user@example.com",
    "votes": 15,
    "voters": ["user1@example.com", "user2@example.com"],
    "badges": 2,
    "selectedForRound": true,
    "currentRound": 3,
    "frozen": false,
    "firstChoiceVoters": ["user1@example.com"],
    "secondChoiceVoters": ["user2@example.com"],
    "totalPreferenceScore": 8
  }
]
```

### POST /api/topics
Create a new discussion topic.

**Request Body:**
```json
{
  "title": "Topic Title",
  "description": "Topic description"
}
```

**Response:**
```json
{
  "id": "topic-456",
  "title": "Topic Title",
  "description": "Topic description",
  "createdBy": "user@example.com",
  "votes": 0,
  "voters": [],
  "badges": 0,
  "selectedForRound": false,
  "frozen": false,
  "firstChoiceVoters": [],
  "secondChoiceVoters": [],
  "totalPreferenceScore": 0
}
```

### POST /api/topics/new-round
Start a new round (legacy endpoint - awards badges and resets votes).

**Admin Only**

**Response:**
```json
{
  "message": "New round started successfully"
}
```

## Topic Voting API

### POST /api/topics/preferences
Submit or update user's voting preferences.

**Request Body:**
```json
{
  "firstChoice": "topic-123",
  "secondChoice": "topic-456"
}
```

**Response:**
```json
{
  "message": "Preferences updated successfully"
}
```

### GET /api/topics/preferences
Get user's current voting preferences.

**Response:**
```json
{
  "userEmail": "user@example.com",
  "firstChoice": "topic-123",
  "secondChoice": "topic-456",
  "hasVoted": true
}
```

## Individual Topic API

### POST /api/topics/[id]/vote
Vote for a specific topic (legacy voting endpoint).

**Request Body:**
```json
{
  "action": "vote" | "unvote"
}
```

### POST /api/topics/[id]/edit
Edit a topic (creator or admin only).

**Request Body:**
```json
{
  "title": "Updated Title",
  "description": "Updated description"
}
```

### POST /api/topics/[id]/freeze
Freeze a topic to prevent new votes (admin only).

**Response:**
```json
{
  "message": "Topic frozen successfully"
}
```

### POST /api/topics/[id]/cancel-vote
Cancel vote for a topic (legacy endpoint).

## Round Management API

### GET /api/admin/round-history
Get complete history of all rounds.

**Admin Only**

**Response:**
```json
[
  {
    "roundNumber": 3,
    "timestamp": "2024-01-15T10:30:00Z",
    "selectedTopics": [
      {
        "topicId": "topic-123",
        "title": "AI Discussion",
        "participantCount": 12,
        "finalScore": 24
      }
    ],
    "totalParticipants": 45
  }
]
```

### GET /api/admin/topic-selection
Get topics available for round selection.

**Admin Only**

**Response:**
```json
[
  {
    "topicId": "topic-123",
    "title": "AI Discussion",
    "description": "Discussion about AI trends",
    "totalPreferenceScore": 24,
    "participantCount": 12,
    "selected": false
  }
]
```

### POST /api/admin/start-round
Start a new round with selected topics.

**Admin Only**

**Request Body:**
```json
{
  "selectedTopicIds": ["topic-123", "topic-456"],
  "roundDuration": 20
}
```

**Response:**
```json
{
  "message": "New round started successfully",
  "roundNumber": 4,
  "selectedTopics": [
    {
      "id": "topic-123",
      "title": "AI Discussion"
    }
  ],
  "activeRound": {
    "roundNumber": 4,
    "startTime": "2024-01-15T14:00:00Z",
    "duration": 20,
    "selectedTopics": ["topic-123", "topic-456"],
    "isActive": true
  }
}
```

### POST /api/admin/end-round
End the current round early.

**Admin Only**

**Response:**
```json
{
  "message": "Round ended successfully"
}
```

## Active Round API

### GET /api/active-round
Get current active round information.

**Response:**
```json
{
  "roundNumber": 4,
  "startTime": "2024-01-15T14:00:00Z",
  "duration": 20,
  "selectedTopics": ["topic-123", "topic-456"],
  "isActive": true
}
```

## Admin Settings API

### GET /api/admin/settings
Get current admin settings.

**Admin Only**

**Response:**
```json
{
  "maxVotesPerTopic": 12,
  "topTopicsCount": 10,
  "showVoterNames": true,
  "allowTopicSubmission": true,
  "autoStartNewRound": false,
  "roundDurationMinutes": 20,
  "maxTopicsPerRound": 8
}
```

### POST /api/admin/settings
Update admin settings.

**Admin Only**

**Request Body:**
```json
{
  "maxVotesPerTopic": 15,
  "topTopicsCount": 12,
  "showVoterNames": false,
  "allowTopicSubmission": true,
  "autoStartNewRound": false,
  "roundDurationMinutes": 25,
  "maxTopicsPerRound": 10
}
```

## Room Management API

### GET /api/admin/rooms
Get all rooms.

**Admin Only**

**Response:**
```json
[
  {
    "id": "room-1",
    "name": "Conference Room A",
    "capacity": 20,
    "location": "Building 1, Floor 2"
  }
]
```

### POST /api/admin/rooms
Create or update rooms.

**Admin Only**

**Request Body:**
```json
{
  "rooms": [
    {
      "name": "Conference Room A",
      "capacity": 20,
      "location": "Building 1, Floor 2"
    }
  ]
}
```

## Authentication API

### GET /api/auth/google
Initiate Google OAuth flow.

**Query Parameters:**
- `state` (optional): Event code for context preservation
- `redirect_uri` (optional): Custom redirect after login

### GET /api/auth/github  
Initiate GitHub OAuth flow.

**Query Parameters:**
- `state` (optional): Event code for context preservation
- `redirect_uri` (optional): Custom redirect after login

### POST /api/auth/login
Authenticate user with email/password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "eventCode": "EVENT2024",
  "redirectTo": "/dashboard"
}
```

### POST /api/auth/guest-join
Join as guest user.

**Request Body:**
```json
{
  "eventCode": "EVENT2024",
  "guestName": "John Doe"
}
```

## Voting Statistics API

### GET /api/admin/voting-stats
Get comprehensive voting statistics.

**Admin Only**

**Response:**
```json
{
  "totalTopics": 25,
  "totalVotes": 150,
  "totalUsers": 45,
  "topTopics": [
    {
      "id": "topic-123",
      "title": "AI Discussion",
      "totalPreferenceScore": 24,
      "participantCount": 12
    }
  ],
  "votingActivity": {
    "lastHour": 15,
    "last24Hours": 120
  }
}
```

## Groups API

### GET /api/admin/groups
Get discussion groups.

**Admin Only**

**Response:**
```json
[
  {
    "id": "group-1",
    "topicId": "topic-123",
    "topicTitle": "AI Discussion",
    "participants": ["user1@example.com", "user2@example.com"],
    "roomId": "room-1",
    "roomName": "Conference Room A"
  }
]
```

### POST /api/admin/create-groups
Create discussion groups based on voting.

**Admin Only**

**Response:**
```json
{
  "message": "Groups created successfully",
  "groups": [
    {
      "topicId": "topic-123",
      "participants": ["user1@example.com"],
      "roomId": "room-1"
    }
  ]
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid request parameters"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Admin access required"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

## Rate Limiting

API endpoints are subject to rate limiting:
- **General endpoints**: 100 requests per minute per user
- **Voting endpoints**: 10 requests per minute per user
- **Admin endpoints**: 200 requests per minute per admin

## Data Types

### DiscussionTopic
```typescript
interface DiscussionTopic {
  id: string
  title: string
  description: string
  createdBy: string
  votes: number
  voters: string[]
  badges: number
  selectedForRound?: boolean
  frozen?: boolean
  currentRound?: number
  firstChoiceVoters: string[]
  secondChoiceVoters: string[]
  totalPreferenceScore: number
}
```

### ActiveRound
```typescript
interface ActiveRound {
  roundNumber: number
  startTime: string
  duration: number  // minutes
  selectedTopics: string[]  // topic IDs
  isActive: boolean
}
```

### RoundHistory
```typescript
interface RoundHistory {
  roundNumber: number
  timestamp: string
  selectedTopics: {
    topicId: string
    title: string
    participantCount: number
    finalScore: number
  }[]
  totalParticipants: number
}
```

## WebSocket Events (Future)

The application is prepared for real-time updates via WebSocket connections:

- `round:started` - New round started
- `round:ended` - Round ended
- `votes:updated` - Vote counts updated
- `topic:created` - New topic created
- `timer:update` - Round timer update

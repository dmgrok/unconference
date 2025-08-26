# Changelog

All notable changes to the Unconference application will be documented in this file.

## [Unreleased]

### Added
- **Round Management System** - Complete overhaul of round functionality
  - Pre-round planning screen with topic selection interface
  - Real-time round timer with configurable duration (5-60 minutes)
  - Automatic participant assignment based on voting preferences
  - Round history tracking with detailed analytics
  - Manual topic selection for each round (up to configurable maximum)
  - Visual progress indicators and countdown timers
  - Integration with existing room assignment system

- **Enhanced Admin Controls**
  - New Round Management page (`/admin/round-management`)
  - Topic selection interface with preference scoring
  - Round history viewer with past round details
  - Configurable round settings (duration, max topics per round)
  - Advanced round controls alongside existing quick-start option

- **Improved User Experience**
  - Active round status prominently displayed on dashboard
  - Current topic assignment clearly shown to participants
  - Real-time countdown timer visible to all users
  - Automatic redistribution of participants from unselected topics
  - Visual feedback for round progress and time remaining

- **New API Endpoints**
  - `GET /api/admin/round-history` - Retrieve complete round history
  - `GET /api/admin/topic-selection` - Get topics available for selection
  - `POST /api/admin/start-round` - Start new round with selected topics
  - `POST /api/admin/end-round` - End current round early
  - `GET /api/active-round` - Get current round status and timer

- **Enhanced Data Models**
  - `RoundHistory` type for tracking past rounds
  - `ActiveRound` type for current round state
  - `TopicSelection` type for round planning interface
  - Extended `DiscussionTopic` with round tracking

- **Configuration Options**
  - `roundDurationMinutes` setting (default: 20 minutes)
  - `maxTopicsPerRound` setting (default: 8 topics)
  - Admin settings integration for round management

### Changed
- Dashboard now displays active round information prominently
- Topic cards show round assignment status
- Navigation includes new Round Management link for admins
- Settings page includes round management configuration options

### Technical Details
- Added persistent round state tracking via JSON files
- Implemented real-time timer with automatic expiration
- Enhanced voting system integration with round selection
- Backward compatibility maintained with existing "Quick New Round" functionality
- Complete integration with room assignment system

## [Previous Versions]

### Added (Previous Features)
- Preference-based voting system with weighted scoring
- Admin dashboard with voting statistics
- Room management and assignment functionality
- User authentication with role-based access
- Topic creation and editing capabilities
- Badge system for popular topics
- Auto-save functionality for settings
- Dark mode theme support
- Guest user support
- QR code generation for easy access
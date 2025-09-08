# Header Event Display Feature

## Overview

Enhanced the header component to display the currently selected event information across all event detail screens. This provides users with clear context about which event they are currently viewing and managing.

## Features Implemented

### 🔍 **Current Event Display in Header**

**Header Enhancement (`components/UnconferenceHeader.vue`)**
- Shows current event name and code in the header
- Displays event status (Active/Inactive) with appropriate color coding
- Includes visual status indicators with icons
- Responsive design that hides on mobile screens to save space

**Event Information Display:**
- Event name prominently displayed
- Event code shown below the name
- Status chip with color coding:
  - Green for active events
  - Orange/warning for inactive events
- Icons indicate event status at a glance

### 🔄 **Event Selector for Multi-Event Users**

**Smart Event Switching:**
- Dropdown menu appears when users have multiple events
- Allows quick switching between events without going back to events list
- Shows all events with their status and codes
- Maintains current event context when switching

**Multi-Event Support:**
- Automatically loads user's events in the header
- Shows event selector only when user has multiple events
- Preserves current event selection across page navigation
- Updates header information when event context changes

### 📄 **Event Detail Page**

**New Dynamic Route (`pages/events/[eventId].vue`)**
- Dedicated event detail page accessible from events list
- Shows comprehensive event information and statistics
- Provides quick access buttons to all event management pages
- Sets the current event context when accessed
- Updates user session with current event ID

**Event Detail Features:**
- Event overview with name, description, location, dates
- Real-time statistics (participants, topics, rounds, organizers)
- Quick action buttons for voting, dashboard, organizer hub, etc.
- Event sharing functionality with code copying
- Role-based button visibility (organizer-only features)
- Responsive design with statistics cards

### 🔗 **Enhanced Event Navigation**

**Improved Events List Integration:**
- Event cards in events list now properly link to event details
- "Manage Event" button navigates to the new detail page
- Current event context is automatically set when selecting an event
- Seamless navigation between event browsing and event management

## Technical Implementation

### Header Component Updates
```vue
<!-- Current event display with selector -->
<div v-if="showCurrentEvent && currentEvent" class="ml-6 d-flex align-center">
  <v-divider vertical class="mx-3" />
  <div class="event-info">
    <div class="d-flex align-center">
      <v-chip :color="currentEvent.isActive ? 'success' : 'warning'">
        {{ currentEvent.isActive ? 'Active' : 'Inactive' }}
      </v-chip>
      <div>
        <div class="text-body-2 font-weight-medium">{{ currentEvent.name }}</div>
        <div class="text-caption">{{ currentEvent.code }}</div>
      </div>
      <!-- Event selector menu for multiple events -->
    </div>
  </div>
</div>
```

### Event Context Management
- Uses existing `useCurrentEvent` composable for event data
- Leverages `useEventContext` for event ID management
- Integrates with existing `/api/auth/set-current-event` endpoint
- Maintains session state across page navigation

### Responsive Design
- Event info hidden on mobile screens (`display: none` at mobile breakpoint)
- Header remains clean and functional on smaller devices
- Event selector adapts to touch interfaces

## User Experience Flow

### For Users with Single Event:
1. User selects event from events list → navigates to event detail page
2. Event context is set and header shows current event information
3. User navigates to event management pages (voting, dashboard, etc.)
4. Header consistently shows the selected event across all pages

### For Users with Multiple Events:
1. User selects event from events list → navigates to event detail page
2. Header shows current event with dropdown selector
3. User can switch events directly from header without returning to events list
4. Event context updates immediately when switching events
5. All event management pages reflect the newly selected event

### Navigation Pattern:
1. **Events List** `/events` - Browse available events
2. **Event Detail** `/events/[eventId]` - Event overview and quick actions
3. **Event Management** `/voting`, `/dashboard`, etc. - Specific event functions
4. **Header Context** - Always shows current event for context

## Benefits

- **Clear Context**: Users always know which event they're managing
- **Quick Switching**: No need to return to events list for multi-event users
- **Consistent UX**: Event information visible across all event detail screens
- **Better Navigation**: Logical flow from event browsing to event management
- **Mobile Friendly**: Responsive design maintains usability on all devices

## Technical Files Modified

- `components/UnconferenceHeader.vue` - Added event display and selector
- `pages/events/[eventId].vue` - New event detail page
- `pages/events/index.vue` - Updated navigation to event details
- Integration with existing composables and API endpoints

## Future Enhancements

- Add event quick actions in header dropdown (start/stop event)
- Include participant count in header display
- Add event creation date or last activity timestamp
- Implement event favoriting for multi-event users
- Add keyboard shortcuts for event switching

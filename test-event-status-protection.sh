#!/bin/bash

# Enhanced Test script for Event Status Protection
# This script tests that inactive events properly block actions and hide UI elements

echo "🧪 Testing Enhanced Event Status Protection..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BASE_URL="http://localhost:3000"
EVENT_ID="test_event_id"

echo -e "${YELLOW}Prerequisites:${NC}"
echo "1. Server must be running on $BASE_URL"
echo "2. Test event must exist with ID: $EVENT_ID"
echo "3. You must be logged in as an organizer/admin"
echo ""

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "${YELLOW}Testing:${NC} $description"
    echo "  Endpoint: $method $endpoint"
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "HTTPSTATUS:%{http_code}")
    else
        response=$(curl -s -X "$method" "$BASE_URL$endpoint" \
            -w "HTTPSTATUS:%{http_code}")
    fi
    
    http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
    body=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')
    
    if [ "$http_code" = "403" ]; then
        echo -e "  ${GREEN}✓ PASS${NC} - Correctly blocked (HTTP $http_code)"
        echo "  Message: $body"
    else
        echo -e "  ${RED}✗ FAIL${NC} - Expected HTTP 403, got HTTP $http_code"
        echo "  Response: $body"
    fi
    echo ""
}

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    TESTING PROTOCOL                    ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}Step 1: Ensure event is active and test normal operation${NC}"
echo "Please manually verify that the event is active and actions work normally:"
echo "- Voting buttons should be visible and functional"
echo "- Round management buttons should be visible"
echo "- Topic creation should work"
echo "- Admin actions should be available"
echo ""
echo "Press Enter to continue to blocking tests..."
read

echo -e "${YELLOW}Step 2: Close/suspend the event${NC}"
echo "Please manually close or suspend the test event through the admin interface."
echo "You can do this by:"
echo "1. Going to the event management page"
echo "2. Clicking 'Close Event' or having a super admin suspend it"
echo ""
echo "Press Enter when the event is inactive..."
read

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    API ENDPOINT TESTS                  ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

# Test round starting
test_endpoint "POST" "/api/events/$EVENT_ID/rounds/start" \
    "Start new round" \
    '{"selectedTopicIds":["topic1","topic2"],"roundDuration":20}'

# Test topic creation  
test_endpoint "POST" "/api/events/$EVENT_ID/topics" \
    "Create new topic" \
    '{"title":"Test Topic","description":"Test description"}'

# Test admin start round
test_endpoint "POST" "/api/admin/start-round?eventId=$EVENT_ID" \
    "Admin start round" \
    '{"selectedTopicIds":["topic1"],"roundDuration":15}'

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    UI PROTECTION TESTS                 ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}Step 3: Testing UI protection manually${NC}"
echo ""
echo -e "${YELLOW}Please test the following pages in the browser:${NC}"
echo ""

echo -e "${GREEN}📝 /voting${NC} - Voting Page"
echo "  ✓ Should show 'Event is Inactive' warning alert at top"
echo "  ✓ 'Propose Topic' button should be HIDDEN (not just disabled)"
echo "  ✓ 'Manage Rounds' button should be HIDDEN"
echo "  ✓ 'Reset All Votes' button should be HIDDEN"
echo "  ✓ Topic edit/delete/freeze buttons should be HIDDEN"
echo "  ✓ Trying to vote should show alert: 'Voting is disabled when the event is not active'"
echo ""

echo -e "${GREEN}👥 /groups${NC} - Groups & Round Management"
echo "  ✓ Should show 'Event is currently inactive' warning alert"
echo "  ✓ All round management buttons should be HIDDEN:"
echo "    - 'Quick Round' button"
echo "    - 'Start Custom Round' button"
echo "    - 'Extend Round' button (if round was active)"
echo "    - 'End Round' button (if round was active)"
echo "    - 'Configure Rooms' button"
echo "  ✓ 'Round History' button should still be VISIBLE (read-only)"
echo ""

echo -e "${GREEN}⚙️ /admin/round-management${NC} - Admin Round Management"
echo "  ✓ Should show 'Event is currently inactive' warning alert"
echo "  ✓ 'Start New Round' button section should be HIDDEN"
echo "  ✓ Active round management buttons should be HIDDEN"
echo "  ✓ Round history should still be accessible"
echo ""

echo -e "${GREEN}🏠 /admin/rooms${NC} - Room Management"
echo "  ✓ Should show 'Event is currently inactive' warning alert"
echo "  ✓ 'Add Room' button should be HIDDEN"
echo "  ✓ 'Edit' buttons on room cards should be HIDDEN"
echo "  ✓ Room information should still be VISIBLE (read-only)"
echo ""

echo -e "${GREEN}📊 /organizer${NC} - Organizer Dashboard"
echo "  ✓ Should show 'Event is currently inactive' warning alert"
echo "  ✓ Management actions may be limited message"
echo ""

echo -e "${YELLOW}Step 4: Testing vote protection specifically${NC}"
echo ""
echo "On the voting page, try these specific actions:"
echo "1. Click on any topic card to vote"
echo "   → Should show alert: 'Voting is disabled when the event is not active'"
echo "2. If you had previous votes, try to reset them"
echo "   → Reset button should be hidden"
echo "3. Try to propose a new topic"
echo "   → Propose Topic button should be hidden"
echo ""

echo -e "${YELLOW}Step 5: Testing organizer protection${NC}"
echo ""
echo "Verify that even as an organizer/admin, you cannot:"
echo "1. Start any new rounds"
echo "2. Vote on topics" 
echo "3. Create new topics"
echo "4. Edit/delete existing topics"
echo "5. Manage active rounds"
echo ""
echo "But you CAN still:"
echo "1. View all existing data"
echo "2. Access round history"
echo "3. See room configurations"
echo "4. Navigate between pages"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    FINAL VERIFICATION                  ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}Step 6: Reactivate event and verify restoration${NC}"
echo ""
echo "Please reactivate the event and verify that:"
echo "1. Warning alerts disappear"
echo "2. Action buttons become visible again"
echo "3. Voting functionality is restored"
echo "4. Round management becomes available"
echo ""

echo -e "${GREEN}Test complete!${NC}"
echo ""
echo -e "${YELLOW}Expected Results Summary:${NC}"
echo "✓ All action buttons should be HIDDEN (not disabled) when event inactive"
echo "✓ API endpoints should return HTTP 403 with clear error messages"
echo "✓ Warning alerts should be prominently displayed"
echo "✓ Read-only access should be maintained for viewing data"
echo "✓ Functionality should be fully restored when event is reactivated"
echo ""
echo -e "${GREEN}If all checks pass, the event status protection is working correctly!${NC}"

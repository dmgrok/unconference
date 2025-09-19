#!/bin/bash
# Quick API Test Script
# Tests basic functionality of the unconference app

echo "🔧 Testing Unconference App Endpoints"
echo "======================================"

BASE_URL="http://localhost:3005"
echo "Base URL: $BASE_URL"
echo ""

# Test 1: Main page accessibility
echo "📱 Test 1: Main page loads"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Main page loads successfully (HTTP $HTTP_CODE)"
else
    echo "❌ Main page failed to load (HTTP $HTTP_CODE)"
fi
echo ""

# Test 2: Pricing page (if exists)
echo "💰 Test 2: Pricing page accessibility"  
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/pricing")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Pricing page loads successfully (HTTP $HTTP_CODE)"
else
    echo "⚠️  Pricing page not accessible (HTTP $HTTP_CODE) - may require auth"
fi
echo ""

# Test 3: Events create page
echo "🎪 Test 3: Event creation page"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/events/create")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Event creation page loads (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "401" ]; then
    echo "🔒 Event creation requires authentication (HTTP $HTTP_CODE) - expected"
else
    echo "❌ Event creation page error (HTTP $HTTP_CODE)"
fi
echo ""

# Test 4: API health check (if available)
echo "🔌 Test 4: Basic API connectivity"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null)
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API health endpoint accessible (HTTP $HTTP_CODE)"
else
    echo "ℹ️  No health endpoint found (HTTP $HTTP_CODE) - not critical"
fi
echo ""

# Test 5: Pricing tiers API (if public)
echo "💳 Test 5: Pricing API"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/pricing")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Pricing API accessible (HTTP $HTTP_CODE)"
else
    echo "ℹ️  Pricing API not public (HTTP $HTTP_CODE) - may be integrated in components"
fi
echo ""

echo "🎯 Test Summary:"
echo "- Main page should load (✅ expected)"
echo "- Pricing/Events may require authentication (🔒 expected)"
echo "- APIs may not have public endpoints (ℹ️ expected)"
echo ""

echo "🚀 Next Step: Open browser to $BASE_URL for manual testing"
echo "📋 Use the MANUAL_TESTING_SESSION_1.md checklist for comprehensive testing"

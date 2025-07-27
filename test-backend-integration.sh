#!/bin/bash

# Backend Integration Test Script for Posts Feature
# This script tests the connection between frontend and backend

echo "🚀 Testing City Pulse Agent Backend Integration for Posts Feature"
echo "=================================================================="

# Configuration
BACKEND_URL="http://localhost:8000"
FRONTEND_URL="http://localhost:3000"

echo ""
echo "🔗 Configuration:"
echo "   Backend URL: $BACKEND_URL"
echo "   Frontend URL: $FRONTEND_URL"

echo ""
echo "🏥 Testing Backend Health..."
HEALTH_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$BACKEND_URL/health")

if [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "   ✅ Backend is healthy and running"
    echo "   📊 Health Response:"
    cat /tmp/health_response.json | jq '.' 2>/dev/null || cat /tmp/health_response.json
else
    echo "   ❌ Backend health check failed (HTTP $HEALTH_RESPONSE)"
    echo "   💡 Make sure your FastAPI backend is running on port 8000"
    echo ""
    echo "   To start backend:"
    echo "   cd your-backend-directory"
    echo "   python main.py"
    exit 1
fi

echo ""
echo "📡 Testing Posts-Related Endpoints..."

# Test events endpoint (used by PostFeed)
echo "   🔍 Testing events search endpoint..."
EVENTS_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/events_response.json "$BACKEND_URL/events/search?query=recent%20events&lat=12.9120&lng=77.6365&max_results=5")

if [ "$EVENTS_RESPONSE" = "200" ]; then
    echo "   ✅ Events search endpoint working"
    EVENTS_COUNT=$(cat /tmp/events_response.json | jq '.results | length' 2>/dev/null || echo "unknown")
    echo "   📊 Found $EVENTS_COUNT events"
else
    echo "   ⚠️  Events search endpoint issue (HTTP $EVENTS_RESPONSE)"
fi

# Test nearby events endpoint
echo "   📍 Testing nearby events endpoint..."
NEARBY_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/nearby_response.json "$BACKEND_URL/events/nearby?lat=12.9120&lng=77.6365&radius_km=5&max_results=5")

if [ "$NEARBY_RESPONSE" = "200" ]; then
    echo "   ✅ Nearby events endpoint working"
    NEARBY_COUNT=$(cat /tmp/nearby_response.json | jq '.events | length' 2>/dev/null || echo "unknown")
    echo "   📊 Found $NEARBY_COUNT nearby events"
else
    echo "   ⚠️  Nearby events endpoint issue (HTTP $NEARBY_RESPONSE)"
fi

# Test media upload endpoint
echo "   📸 Testing media upload endpoint..."
UPLOAD_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/upload_response.json \
    -X POST \
    -F "files=@/dev/null" \
    -F "user_id=test_user" \
    -F "event_id=test_event" \
    "$BACKEND_URL/media/upload" 2>/dev/null)

if [ "$UPLOAD_RESPONSE" = "200" ] || [ "$UPLOAD_RESPONSE" = "422" ]; then
    echo "   ✅ Media upload endpoint accessible"
else
    echo "   ⚠️  Media upload endpoint issue (HTTP $UPLOAD_RESPONSE)"
fi

# Test enhanced events creation endpoint
echo "   ✨ Testing enhanced events creation endpoint..."
CREATE_RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/create_response.json \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "topic": "community",
        "sub_topic": "community",
        "title": "Test Post from Integration Script",
        "description": "This is a test post created by the integration test script",
        "location": {"lat": 12.9120, "lng": 77.6365},
        "address": "HSR Layout, Bengaluru",
        "severity": "low",
        "media_urls": []
    }' \
    "$BACKEND_URL/events/enhanced" 2>/dev/null)

if [ "$CREATE_RESPONSE" = "200" ]; then
    echo "   ✅ Enhanced events creation working"
    EVENT_ID=$(cat /tmp/create_response.json | jq -r '.event_id' 2>/dev/null || echo "unknown")
    echo "   🆔 Created test event: $EVENT_ID"
else
    echo "   ⚠️  Enhanced events creation issue (HTTP $CREATE_RESPONSE)"
    if [ -f /tmp/create_response.json ]; then
        echo "   📄 Response: $(cat /tmp/create_response.json)"
    fi
fi

echo ""
echo "🌐 Testing Frontend Accessibility..."

# Check if frontend is running
FRONTEND_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "$FRONTEND_URL" 2>/dev/null)

if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "   ✅ Frontend is accessible at $FRONTEND_URL"
    echo "   📱 Posts page: $FRONTEND_URL/posts"
else
    echo "   ❌ Frontend not accessible (HTTP $FRONTEND_RESPONSE)"
    echo "   💡 Make sure your Next.js app is running on port 3000"
    echo ""
    echo "   To start frontend:"
    echo "   npm run dev"
fi

echo ""
echo "📋 Integration Summary:"
echo "======================"

if [ "$HEALTH_RESPONSE" = "200" ] && [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "   ✅ Backend and Frontend are both running"
    echo "   ✅ Posts feature should work with live backend data"
    echo ""
    echo "   🎯 Ready to test:"
    echo "   1. Visit: $FRONTEND_URL/posts"
    echo "   2. Create a new post with media"
    echo "   3. Check that posts load from backend"
    echo "   4. Verify media upload and AI analysis"
    
elif [ "$HEALTH_RESPONSE" = "200" ]; then
    echo "   ✅ Backend is running"
    echo "   ❌ Frontend is not accessible"
    echo "   💡 Start frontend with: npm run dev"
    
elif [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "   ❌ Backend is not running"
    echo "   ✅ Frontend is accessible"
    echo "   💡 Posts will show mock data only"
    echo "   💡 Start backend with: python main.py"
    
else
    echo "   ❌ Both Backend and Frontend need to be started"
    echo "   💡 Start backend: python main.py"
    echo "   💡 Start frontend: npm run dev"
fi

echo ""
echo "🔧 Troubleshooting:"
echo "   - Backend not starting? Check if port 8000 is free"
echo "   - Frontend not starting? Check if port 3000 is free"
echo "   - API errors? Check backend logs for detailed error messages"
echo "   - CORS issues? Backend has CORS enabled for all origins"

# Cleanup
rm -f /tmp/health_response.json /tmp/events_response.json /tmp/nearby_response.json /tmp/upload_response.json /tmp/create_response.json

echo ""
echo "🏁 Test completed!"

#!/bin/bash
echo "=========================================="
echo "🧪 COMPREHENSIVE TEST SUITE"
echo "=========================================="
echo ""

echo "1️⃣  Backend Health Check"
echo "----------------------------------------"
HEALTH=$(curl -s https://alumni-portal-yw7q.onrender.com/health)
echo "$HEALTH"
if echo "$HEALTH" | grep -q "healthy"; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
fi
echo ""

echo "2️⃣  Login Endpoint Test"
echo "----------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST https://alumni-portal-yw7q.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@alumni.mit.edu","password":"password123"}')
echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "✅ Login successful"
    TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('access_token', ''))" 2>/dev/null)
    if [ -n "$TOKEN" ]; then
        echo "✅ Token received: ${TOKEN:0:20}..."
    fi
else
    echo "❌ Login failed"
    if echo "$LOGIN_RESPONSE" | grep -q "Incorrect"; then
        echo "   → Password hash mismatch or user doesn't exist"
    elif echo "$LOGIN_RESPONSE" | grep -q "username"; then
        echo "   → Wrong endpoint format"
    else
        echo "   → Unknown error"
    fi
fi
echo ""

echo "3️⃣  Frontend URL Check"
echo "----------------------------------------"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://alumni-portal-git-main-bhanushri-chintas-projects.vercel.app)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend is accessible (HTTP $FRONTEND_STATUS)"
else
    echo "⚠️  Frontend returned HTTP $FRONTEND_STATUS"
fi
echo ""

echo "4️⃣  API Documentation"
echo "----------------------------------------"
DOCS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://alumni-portal-yw7q.onrender.com/docs)
if [ "$DOCS_STATUS" = "200" ]; then
    echo "✅ API docs available at: https://alumni-portal-yw7q.onrender.com/docs"
else
    echo "⚠️  API docs returned HTTP $DOCS_STATUS"
fi
echo ""

echo "5️⃣  CORS Test"
echo "----------------------------------------"
CORS_RESPONSE=$(curl -s -X OPTIONS https://alumni-portal-yw7q.onrender.com/api/v1/auth/login \
  -H "Origin: https://alumni-portal-git-main-bhanushri-chintas-projects.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v 2>&1 | grep -i "access-control")
if [ -n "$CORS_RESPONSE" ]; then
    echo "✅ CORS headers present"
    echo "$CORS_RESPONSE"
else
    echo "⚠️  CORS headers not found"
fi
echo ""

echo "=========================================="
echo "📊 TEST SUMMARY"
echo "=========================================="
echo "Backend: $(echo "$HEALTH" | grep -q "healthy" && echo "✅ Healthy" || echo "❌ Unhealthy")"
echo "Login: $(echo "$LOGIN_RESPONSE" | grep -q "access_token" && echo "✅ Working" || echo "❌ Failed")"
echo "Frontend: $([ "$FRONTEND_STATUS" = "200" ] && echo "✅ Accessible" || echo "⚠️  Issues")"
echo "API Docs: $([ "$DOCS_STATUS" = "200" ] && echo "✅ Available" || echo "⚠️  Issues")"
echo ""

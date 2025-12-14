#!/bin/bash

API_BASE="https://alumni-portal-yw7q.onrender.com/api/v1"
ORIGIN="https://alumni-portal-hazel-tau.vercel.app"

echo "============================================================"
echo "🧪 Testing Email Service"
echo "============================================================"
echo ""

# 1. Login as Admin
echo "1️⃣  Logging in as Admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mit.edu","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Admin login failed!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Admin login successful!"
echo ""

# 2. Create a new user
TIMESTAMP=$(date +%s)
TEST_EMAIL="test.user.$TIMESTAMP@alumni.mit.edu"

echo "2️⃣  Creating a new user (this will trigger welcome email)..."
echo "   Test Email: $TEST_EMAIL"
echo ""

CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/admin/users" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"testpass123\",
    \"name\": \"Test User\",
    \"graduation_year\": 2024,
    \"major\": \"Computer Science\"
  }")

if echo "$CREATE_RESPONSE" | grep -q '"id"'; then
  echo "✅ User created successfully!"
  echo ""
  echo "📧 Welcome email should have been sent!"
  echo "   Check inbox: $TEST_EMAIL"
  echo ""
  echo "============================================================"
  echo "✅ Email Service Test Complete"
  echo "============================================================"
  echo ""
  echo "📋 What to check:"
  echo "   1. Check the user's email inbox"
  echo "   2. Look for welcome email with login credentials"
  echo "   3. Email should come from your Gmail address"
  echo "   4. Check Render logs for email sending confirmation"
  echo ""
  echo "🔑 Test Login Credentials:"
  echo "   Email: $TEST_EMAIL"
  echo "   Password: testpass123"
else
  echo "❌ User creation failed!"
  echo "Response: $CREATE_RESPONSE"
  echo ""
  echo "This might indicate:"
  echo "- Email service error (check Render logs)"
  echo "- Database issue"
  echo "- SMTP configuration issue"
fi


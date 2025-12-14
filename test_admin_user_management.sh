#!/bin/bash

API_BASE="https://alumni-portal-yw7q.onrender.com/api/v1"
ORIGIN="https://alumni-portal-hazel-tau.vercel.app"

echo "=== Testing Admin User Management ==="
echo ""

# 1. Login as Admin
echo "1. Logging in as Admin (admin@mit.edu)..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Origin: $ORIGIN" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mit.edu","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed!"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful!"
echo "Token: ${TOKEN:0:50}..."
echo ""

# 2. Get Admin Dashboard
echo "2. Getting Admin Dashboard..."
DASHBOARD=$(curl -s -X GET "$API_BASE/admin/dashboard" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN")
echo "Dashboard: $DASHBOARD"
echo ""

# 3. List Users
echo "3. Listing Users..."
USERS=$(curl -s -X GET "$API_BASE/admin/users?page=1&page_size=10" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN")
echo "Users: $USERS" | head -c 500
echo ""
echo ""

# 4. Create New User
echo "4. Creating New User..."
CREATE_USER=$(curl -s -X POST "$API_BASE/admin/users" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.user@alumni.mit.edu",
    "password": "testpass123",
    "name": "Test User",
    "graduation_year": 2023,
    "major": "Test Major"
  }')
echo "Create User Response: $CREATE_USER"
echo ""

# 5. List Users Again (should include new user)
echo "5. Listing Users Again..."
USERS2=$(curl -s -X GET "$API_BASE/admin/users?page=1&page_size=10" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN")
echo "Updated Users List: $USERS2" | head -c 500
echo ""
echo ""

# 6. Test Search
echo "6. Testing User Search..."
SEARCH=$(curl -s -X GET "$API_BASE/admin/users?search=test" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN")
echo "Search Results: $SEARCH"
echo ""

# 7. Get Password Resets
echo "7. Getting Password Reset Requests..."
PASSWORD_RESETS=$(curl -s -X GET "$API_BASE/admin/password-resets?page=1&page_size=10" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN")
echo "Password Resets: $PASSWORD_RESETS"
echo ""

# 8. Get Document Requests
echo "8. Getting Document Requests..."
DOCS=$(curl -s -X GET "$API_BASE/admin/documents?page=1&page_size=10" \
  -H "Origin: $ORIGIN" \
  -H "Authorization: Bearer $TOKEN")
echo "Document Requests: $DOCS" | head -c 500
echo ""
echo ""

echo "=== Test Complete ==="

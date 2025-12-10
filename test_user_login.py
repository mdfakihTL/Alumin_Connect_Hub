#!/usr/bin/env python3
"""
Test user login functionality for all users
"""
import requests
import json
import sys

# API base URL
BASE_URL = "http://localhost:8000"

# Default users to test
TEST_USERS = [
    {"username": "superadmin", "password": "superadmin123", "role": "super_admin"},
    {"username": "university", "password": "university123", "role": "university_admin"},
    {"username": "alumni", "password": "alumni123", "role": "alumni"},
]


def test_login(username: str, password: str):
    """Test login for a user"""
    url = f"{BASE_URL}/api/v1/auth/login"
    payload = {
        "username": username,
        "password": password
    }
    
    try:
        response = requests.post(url, json=payload, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ {username:20} - Login successful")
            print(f"   Access token: {data.get('access_token', 'N/A')[:50]}...")
            print(f"   Token type: {data.get('token_type', 'N/A')}")
            return True, data
        else:
            print(f"❌ {username:20} - Login failed")
            print(f"   Status: {response.status_code}")
            print(f"   Error: {response.text}")
            return False, None
    except requests.exceptions.ConnectionError:
        print(f"❌ {username:20} - Cannot connect to server")
        print(f"   Make sure server is running at {BASE_URL}")
        return False, None
    except Exception as e:
        print(f"❌ {username:20} - Error: {str(e)}")
        return False, None


def test_get_me(access_token: str):
    """Test /auth/me endpoint"""
    url = f"{BASE_URL}/api/v1/auth/me"
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ /auth/me - Success")
            print(f"      Email: {data.get('email')}")
            print(f"      Role: {data.get('role')}")
            print(f"      Active: {data.get('is_active')}")
            print(f"      Verified: {data.get('is_verified')}")
            return True
        else:
            print(f"   ❌ /auth/me - Failed ({response.status_code})")
            return False
    except Exception as e:
        print(f"   ❌ /auth/me - Error: {str(e)}")
        return False


def test_all_users():
    """Test login for all default users"""
    print("=" * 80)
    print("🧪 Testing User Login Functionality")
    print("=" * 80)
    print()
    
    # Check if server is running
    try:
        health = requests.get(f"{BASE_URL}/health", timeout=5)
        if health.status_code != 200:
            print(f"❌ Server health check failed")
            print(f"   Make sure server is running: uvicorn app.main:app --reload")
            sys.exit(1)
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to server at {BASE_URL}")
        print(f"   Make sure server is running: uvicorn app.main:app --reload")
        sys.exit(1)
    
    print(f"✅ Server is running at {BASE_URL}\n")
    
    results = []
    
    for user in TEST_USERS:
        print(f"Testing: {user['username']} ({user['role']})")
        success, token_data = test_login(user['username'], user['password'])
        
        if success and token_data:
            # Test /auth/me endpoint
            test_get_me(token_data['access_token'])
            results.append({"user": user['username'], "status": "success"})
        else:
            results.append({"user": user['username'], "status": "failed"})
        
        print()
    
    # Summary
    print("=" * 80)
    print("📊 Test Summary")
    print("=" * 80)
    
    success_count = sum(1 for r in results if r['status'] == 'success')
    total_count = len(results)
    
    for result in results:
        status_icon = "✅" if result['status'] == 'success' else "❌"
        print(f"{status_icon} {result['user']}: {result['status']}")
    
    print()
    print(f"Total: {success_count}/{total_count} successful")
    
    if success_count == total_count:
        print("✅ All users can login successfully!")
        return 0
    else:
        print("❌ Some users failed to login")
        return 1


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Test user login functionality")
    parser.add_argument("--url", default="http://localhost:8000", help="API base URL")
    parser.add_argument("--user", help="Test specific username")
    parser.add_argument("--password", help="Password for specific user")
    
    args = parser.parse_args()
    
    if args.url:
        BASE_URL = args.url
    
    if args.user:
        # Test single user
        password = args.password or input(f"Enter password for {args.user}: ")
        test_login(args.user, password)
    else:
        # Test all users
        sys.exit(test_all_users())


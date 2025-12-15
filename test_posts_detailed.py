#!/usr/bin/env python3
"""Test posts with detailed error capture"""
import requests
import json
import sys

API_URL = "http://localhost:8000"

print("=" * 80)
print("Testing Post APIs with Detailed Error Capture")
print("=" * 80)

# Login
print("\n1. Logging in...")
try:
    login_response = requests.post(
        f"{API_URL}/api/v1/auth/login",
        json={"username": "superadmin", "password": "superadmin123"},
        timeout=10
    )
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        print(login_response.text)
        sys.exit(1)
    
    token = login_response.json().get("access_token")
    user_info = login_response.json().get("user", {})
    print(f"[OK] Login successful")
    print(f"   User: {user_info.get('name', 'N/A')}")
    print(f"   University ID: {user_info.get('university_id', 'None')}")
    
except Exception as e:
    print(f"[ERROR] Login error: {e}")
    sys.exit(1)

headers = {"Authorization": f"Bearer {token}"}

# Test list posts
print("\n2. Testing GET /api/v1/feed/posts...")
try:
    response = requests.get(
        f"{API_URL}/api/v1/feed/posts",
        headers=headers,
        params={"page": 1, "page_size": 5},
        timeout=10
    )
    
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"[SUCCESS]")
        print(f"   Total posts: {data.get('total', 0)}")
        print(f"   Posts in response: {len(data.get('posts', []))}")
        print(f"   Page: {data.get('page', 1)}")
        print(f"   Page size: {data.get('page_size', 20)}")
        
        if data.get('posts'):
            first_post = data['posts'][0]
            print(f"\n   First post:")
            print(f"   - ID: {first_post.get('id', 'N/A')}")
            print(f"   - Author: {first_post.get('author', {}).get('name', 'N/A')}")
            print(f"   - Content: {first_post.get('content', 'N/A')[:50]}...")
    else:
        print(f"[FAILED]")
        print(f"   Response: {response.text[:500]}")
        try:
            error_data = response.json()
            print(f"   Error detail: {error_data.get('detail', 'N/A')}")
        except:
            pass
            
except Exception as e:
    print(f"[ERROR] Request error: {e}")
    import traceback
    traceback.print_exc()

# Test create post
print("\n3. Testing POST /api/v1/feed/posts...")
try:
    post_data = {
        "type": "text",
        "content": "Test post from detailed test script",
        "tag": "test"
    }
    
    response = requests.post(
        f"{API_URL}/api/v1/feed/posts",
        headers=headers,
        json=post_data,
        timeout=10
    )
    
    print(f"   Status Code: {response.status_code}")
    
    if response.status_code == 201:
        data = response.json()
        print(f"[SUCCESS]")
        print(f"   Post ID: {data.get('id', 'N/A')}")
        print(f"   Content: {data.get('content', 'N/A')[:50]}...")
    else:
        print(f"[FAILED]")
        print(f"   Response: {response.text[:500]}")
        try:
            error_data = response.json()
            print(f"   Error detail: {error_data.get('detail', 'N/A')}")
        except:
            pass
            
except Exception as e:
    print(f"[ERROR] Request error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 80)
print("Test Complete")
print("=" * 80)


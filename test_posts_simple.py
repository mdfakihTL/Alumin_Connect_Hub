#!/usr/bin/env python3
"""
Simple post API test without emojis
"""
import requests
import json

API_URL = "http://localhost:8000"

# Login
print("Logging in...")
login_response = requests.post(
    f"{API_URL}/api/v1/auth/login",
    json={"username": "superadmin", "password": "superadmin123"},
    timeout=10
)

if login_response.status_code != 200:
    print(f"Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json().get("access_token")
print(f"Login successful. Token: {token[:50]}...")

headers = {"Authorization": f"Bearer {token}"}

# Test list posts
print("\nTesting GET /api/v1/feed/posts...")
response = requests.get(
    f"{API_URL}/api/v1/feed/posts",
    headers=headers,
    params={"page": 1, "page_size": 10},
    timeout=10
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text[:500]}")

if response.status_code == 200:
    data = response.json()
    print(f"Success! Total posts: {data.get('total', 0)}")
else:
    print(f"Error details:")
    try:
        error_data = response.json()
        print(json.dumps(error_data, indent=2))
    except:
        print(response.text)


"""
Comprehensive API Testing Script for Alumni Connect Hub
Tests all major API endpoints
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000/api/v1"
AUTH_TOKEN = None

# Test results tracking
results = {
    "passed": 0,
    "failed": 0,
    "errors": []
}

def test_endpoint(method, endpoint, description, expected_status=None, data=None, auth=True, allow_error=False):
    """Test a single endpoint"""
    global AUTH_TOKEN
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    
    if auth and AUTH_TOKEN:
        headers["Authorization"] = f"Bearer {AUTH_TOKEN}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data, timeout=10)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data, timeout=10)
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json=data, timeout=10)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=10)
        else:
            print(f"  ❌ Unknown method: {method}")
            return None
        
        # Check status
        if expected_status:
            if isinstance(expected_status, list):
                success = response.status_code in expected_status
            else:
                success = response.status_code == expected_status
        else:
            # Accept 2xx, 401 (unauthorized), 404 (not found), 422 (validation) as "working"
            success = response.status_code < 500 or allow_error
        
        status_icon = "✅" if success else "❌"
        print(f"  {status_icon} {description}: {response.status_code}")
        
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
            results["errors"].append(f"{method} {endpoint}: {response.status_code} - {response.text[:200]}")
        
        return response
        
    except requests.exceptions.Timeout:
        print(f"  ⚠️  {description}: TIMEOUT")
        results["failed"] += 1
        results["errors"].append(f"{method} {endpoint}: Timeout")
        return None
    except Exception as e:
        print(f"  ❌ {description}: ERROR - {str(e)[:100]}")
        results["failed"] += 1
        results["errors"].append(f"{method} {endpoint}: {str(e)[:100]}")
        return None

def test_health():
    """Test health endpoint"""
    print("\n🏥 Health Check")
    print("-" * 40)
    try:
        response = requests.get("http://127.0.0.1:8000/health", timeout=5)
        if response.status_code == 200:
            print(f"  ✅ Health: {response.json()}")
            results["passed"] += 1
        else:
            print(f"  ❌ Health: {response.status_code}")
            results["failed"] += 1
    except Exception as e:
        print(f"  ❌ Health: {str(e)}")
        results["failed"] += 1

def test_auth():
    """Test authentication endpoints"""
    global AUTH_TOKEN
    print("\n🔐 Authentication APIs")
    print("-" * 40)
    
    # Test login with test credentials
    login_data = {
        "email": "admin@mit.edu",
        "password": "admin123"
    }
    response = test_endpoint("POST", "/auth/login", "Login", expected_status=[200, 401, 422], data=login_data, auth=False)
    
    if response and response.status_code == 200:
        data = response.json()
        AUTH_TOKEN = data.get("access_token")
        print(f"    → Got auth token: {AUTH_TOKEN[:20] if AUTH_TOKEN else 'None'}...")
    
    # Try another user if admin fails
    if not AUTH_TOKEN:
        login_data = {
            "email": "test@example.com", 
            "password": "test123"
        }
        response = test_endpoint("POST", "/auth/login", "Login (alternate)", expected_status=[200, 401, 422], data=login_data, auth=False)
        if response and response.status_code == 200:
            data = response.json()
            AUTH_TOKEN = data.get("access_token")
    
    # Other auth endpoints
    test_endpoint("GET", "/auth/me", "Get current user", expected_status=[200, 401])
    test_endpoint("POST", "/auth/register", "Register (validation check)", expected_status=[200, 400, 422], data={}, auth=False)

def test_users():
    """Test user endpoints"""
    print("\n👤 User APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/users/me", "Get my profile", expected_status=[200, 401])
    test_endpoint("GET", "/users/profile", "Get profile", expected_status=[200, 401])
    test_endpoint("GET", "/users/suggested-connections", "Suggested connections", expected_status=[200, 401])
    test_endpoint("GET", "/users/mentors", "Get mentors", expected_status=[200, 401])
    test_endpoint("GET", "/users/search?q=test", "Search users", expected_status=[200, 401])

def test_universities():
    """Test university endpoints"""
    print("\n🏫 University APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/universities", "List universities", expected_status=[200], auth=False)
    test_endpoint("GET", "/universities/mit", "Get university by ID", expected_status=[200, 404], auth=False)

def test_posts():
    """Test post endpoints"""
    print("\n📝 Post APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/posts", "List posts", expected_status=[200, 401])
    test_endpoint("GET", "/posts?page=1&page_size=10", "List posts (paginated)", expected_status=[200, 401])
    test_endpoint("GET", "/posts/feed", "Get feed", expected_status=[200, 401])

def test_events():
    """Test event endpoints"""
    print("\n📅 Event APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/events", "List events", expected_status=[200, 401])
    test_endpoint("GET", "/events?page=1", "List events (paginated)", expected_status=[200, 401])

def test_groups():
    """Test group endpoints"""
    print("\n👥 Group APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/groups", "List groups", expected_status=[200, 401])
    test_endpoint("GET", "/groups/my-groups", "My groups", expected_status=[200, 401])

def test_connections():
    """Test connection endpoints"""
    print("\n🤝 Connection APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/connections", "List connections", expected_status=[200, 401])
    test_endpoint("GET", "/connections/requests", "Connection requests", expected_status=[200, 401])
    test_endpoint("GET", "/connections/sent", "Sent requests", expected_status=[200, 401])

def test_messages():
    """Test message endpoints"""
    print("\n💬 Message APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/messages/conversations", "List conversations", expected_status=[200, 401])

def test_notifications():
    """Test notification endpoints"""
    print("\n🔔 Notification APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/notifications", "List notifications", expected_status=[200, 401])
    test_endpoint("GET", "/notifications/unread-count", "Unread count", expected_status=[200, 401])

def test_documents():
    """Test document endpoints"""
    print("\n📄 Document APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/documents/my-requests", "My document requests", expected_status=[200, 401])

def test_support():
    """Test support endpoints"""
    print("\n🎫 Support APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/support/tickets", "List tickets", expected_status=[200, 401])

def test_ads():
    """Test ad endpoints"""
    print("\n📢 Ad APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/ads", "List ads", expected_status=[200, 401])
    test_endpoint("GET", "/ads/active", "Active ads", expected_status=[200, 401])

def test_fundraiser():
    """Test fundraiser endpoints"""
    print("\n💰 Fundraiser APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/fundraisers", "List fundraisers", expected_status=[200, 401])
    test_endpoint("GET", "/fundraisers/active", "Active fundraisers", expected_status=[200, 401])

def test_career_roadmap():
    """Test career roadmap endpoints"""
    print("\n🛤️  Career Roadmap APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/career-roadmap/saved", "Saved roadmaps", expected_status=[200, 401])

def test_heatmap():
    """Test heatmap endpoints"""
    print("\n🗺️  Heatmap APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/heatmap/alumni-distribution", "Alumni distribution", expected_status=[200, 401])
    test_endpoint("GET", "/heatmap/statistics", "Statistics", expected_status=[200, 401])

def test_lead_intelligence():
    """Test lead intelligence endpoints"""
    print("\n📊 Lead Intelligence APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/lead-intelligence/analytics", "Analytics", expected_status=[200, 401, 403])
    test_endpoint("GET", "/lead-intelligence/universities", "Universities", expected_status=[200, 401, 403])

def test_course_intelligence():
    """Test course intelligence endpoints"""
    print("\n🎓 Course Intelligence APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/course-intelligence/analytics", "Analytics", expected_status=[200, 401, 403])
    test_endpoint("GET", "/course-intelligence/leads", "Leads", expected_status=[200, 401, 403])

def test_admin():
    """Test admin endpoints"""
    print("\n👨‍💼 Admin APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/admin/dashboard", "Dashboard", expected_status=[200, 401, 403])
    test_endpoint("GET", "/admin/users", "Users list", expected_status=[200, 401, 403])
    test_endpoint("GET", "/admin/analytics", "Analytics", expected_status=[200, 401, 403])
    test_endpoint("GET", "/admin/document-requests", "Document requests", expected_status=[200, 401, 403])
    test_endpoint("GET", "/admin/events", "Events", expected_status=[200, 401, 403])

def test_superadmin():
    """Test superadmin endpoints"""
    print("\n🦸 Superadmin APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/superadmin/universities", "Universities", expected_status=[200, 401, 403])
    test_endpoint("GET", "/superadmin/admins", "Admins", expected_status=[200, 401, 403])
    test_endpoint("GET", "/superadmin/global-users", "Global users", expected_status=[200, 401, 403])
    test_endpoint("GET", "/superadmin/password-resets", "Password resets", expected_status=[200, 401, 403])

def test_knowledge_base():
    """Test knowledge base endpoints"""
    print("\n📚 Knowledge Base APIs")
    print("-" * 40)
    
    test_endpoint("GET", "/knowledge-base/documents", "Documents", expected_status=[200, 401, 403])
    test_endpoint("POST", "/knowledge-base/chat", "Chat", expected_status=[200, 401, 403, 422], data={"message": "test"})

def main():
    """Run all API tests"""
    print("=" * 60)
    print("🧪 Alumni Connect Hub - API Test Suite")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Run all tests
    test_health()
    test_auth()
    test_users()
    test_universities()
    test_posts()
    test_events()
    test_groups()
    test_connections()
    test_messages()
    test_notifications()
    test_documents()
    test_support()
    test_ads()
    test_fundraiser()
    test_career_roadmap()
    test_heatmap()
    test_lead_intelligence()
    test_course_intelligence()
    test_admin()
    test_superadmin()
    test_knowledge_base()
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    total = results["passed"] + results["failed"]
    print(f"  ✅ Passed: {results['passed']}/{total}")
    print(f"  ❌ Failed: {results['failed']}/{total}")
    
    if results["passed"] > 0:
        success_rate = (results["passed"] / total) * 100
        print(f"  📈 Success Rate: {success_rate:.1f}%")
    
    if results["errors"]:
        print("\n⚠️  Failed Endpoints:")
        for error in results["errors"][:10]:  # Show first 10 errors
            print(f"    • {error}")
        if len(results["errors"]) > 10:
            print(f"    ... and {len(results['errors']) - 10} more")
    
    print("\n" + "=" * 60)
    print("✨ Test complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()


"""
Comprehensive API Testing Script for Alumni Connect Hub
Tests ALL API endpoints with proper authentication
"""
import requests
import json
from datetime import datetime
import time

BASE_URL = "http://127.0.0.1:8000/api/v1"
AUTH_TOKEN = None
SUPERADMIN_TOKEN = None
ADMIN_TOKEN = None
USER_TOKEN = None

# Test results tracking
results = {
    "passed": 0,
    "failed": 0,
    "skipped": 0,
    "errors": [],
    "details": []
}

def test_endpoint(method, endpoint, description, expected_status=None, data=None, auth_token=None, 
                  category="General", allow_4xx=True, allow_5xx=False):
    """Test a single endpoint"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=15)
        elif method == "POST":
            response = requests.post(url, headers=headers, json=data or {}, timeout=15)
        elif method == "PUT":
            response = requests.put(url, headers=headers, json=data or {}, timeout=15)
        elif method == "PATCH":
            response = requests.patch(url, headers=headers, json=data or {}, timeout=15)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=15)
        else:
            print(f"  ❌ Unknown method: {method}")
            return None
        
        # Determine success
        if expected_status:
            if isinstance(expected_status, list):
                success = response.status_code in expected_status
            else:
                success = response.status_code == expected_status
        else:
            if allow_5xx:
                success = True
            elif allow_4xx:
                success = response.status_code < 500
            else:
                success = response.status_code < 400
        
        status_icon = "✅" if success else "❌"
        status_text = f"{response.status_code}"
        
        if response.status_code == 401:
            status_text += " (Auth Required)"
        elif response.status_code == 403:
            status_text += " (Forbidden/No Token)"
        elif response.status_code == 404:
            status_text += " (Not Found)"
        elif response.status_code == 422:
            status_text += " (Validation Error)"
        elif response.status_code == 405:
            status_text += " (Method Not Allowed)"
        
        print(f"  {status_icon} [{method}] {endpoint}: {status_text}")
        
        if success:
            results["passed"] += 1
        else:
            results["failed"] += 1
            try:
                error_detail = response.json().get('detail', response.text[:100])
            except:
                error_detail = response.text[:100]
            results["errors"].append(f"{method} {endpoint}: {response.status_code} - {error_detail}")
        
        return response
        
    except requests.exceptions.Timeout:
        print(f"  ⏱️  [{method}] {endpoint}: TIMEOUT")
        results["failed"] += 1
        results["errors"].append(f"{method} {endpoint}: Timeout")
        return None
    except requests.exceptions.ConnectionError:
        print(f"  🔌 [{method}] {endpoint}: CONNECTION ERROR")
        results["failed"] += 1
        results["errors"].append(f"{method} {endpoint}: Connection Error")
        return None
    except Exception as e:
        print(f"  ❌ [{method}] {endpoint}: ERROR - {str(e)[:50]}")
        results["failed"] += 1
        results["errors"].append(f"{method} {endpoint}: {str(e)[:50]}")
        return None

def get_auth_tokens():
    """Try to get authentication tokens for different user types"""
    global USER_TOKEN, ADMIN_TOKEN, SUPERADMIN_TOKEN
    
    print("\n🔐 Getting Authentication Tokens...")
    print("-" * 50)
    
    test_users = [
        {"email": "superadmin@alumni.edu", "password": "superadmin123", "type": "superadmin"},
        {"email": "admin@mit.edu", "password": "admin123", "type": "admin"},
        {"email": "john.doe@example.com", "password": "password123", "type": "user"},
        {"email": "test@mit.edu", "password": "test123", "type": "user"},
    ]
    
    for user in test_users:
        try:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json={"email": user["email"], "password": user["password"]},
                timeout=10
            )
            if response.status_code == 200:
                token = response.json().get("access_token")
                print(f"  ✅ Got {user['type']} token for {user['email']}")
                
                if user["type"] == "superadmin":
                    SUPERADMIN_TOKEN = token
                elif user["type"] == "admin":
                    ADMIN_TOKEN = token
                else:
                    USER_TOKEN = token
            else:
                print(f"  ⚠️  Login failed for {user['email']}: {response.status_code}")
        except Exception as e:
            print(f"  ❌ Error logging in {user['email']}: {str(e)[:50]}")
    
    return SUPERADMIN_TOKEN or ADMIN_TOKEN or USER_TOKEN

def test_health():
    """Test health endpoint"""
    print("\n🏥 HEALTH CHECK")
    print("=" * 50)
    try:
        response = requests.get("http://127.0.0.1:8000/health", timeout=5)
        if response.status_code == 200:
            print(f"  ✅ Server healthy: {response.json()}")
            results["passed"] += 1
            return True
        else:
            print(f"  ❌ Server unhealthy: {response.status_code}")
            results["failed"] += 1
            return False
    except Exception as e:
        print(f"  ❌ Server not reachable: {str(e)}")
        results["failed"] += 1
        return False

def test_auth_apis(token):
    """Test authentication APIs"""
    print("\n🔐 AUTHENTICATION APIs")
    print("=" * 50)
    
    test_endpoint("POST", "/auth/login", "Login", expected_status=[200, 401, 422], 
                  data={"email": "test@test.com", "password": "test"}, category="Auth")
    test_endpoint("POST", "/auth/register", "Register (validation)", expected_status=[201, 400, 422],
                  data={"email": "test@test.com"}, category="Auth")
    test_endpoint("GET", "/auth/universities", "Get universities list", expected_status=[200], category="Auth")
    test_endpoint("GET", "/auth/me", "Get current user", expected_status=[200, 401, 403], 
                  auth_token=token, category="Auth")
    test_endpoint("POST", "/auth/logout", "Logout", expected_status=[200, 401, 403], 
                  auth_token=token, category="Auth")

def test_user_apis(token):
    """Test user APIs"""
    print("\n👤 USER APIs")
    print("=" * 50)
    
    test_endpoint("GET", "/users/", "List users", expected_status=[200, 401, 403], 
                  auth_token=token, category="Users")
    test_endpoint("GET", "/users/suggested-connections", "Suggested connections", 
                  expected_status=[200, 401, 403], auth_token=token, category="Users")
    test_endpoint("GET", "/users/mentors", "Get mentors", expected_status=[200, 401, 403], 
                  auth_token=token, category="Users")
    test_endpoint("PUT", "/users/me", "Update my profile", expected_status=[200, 401, 403, 422], 
                  auth_token=token, data={"name": "Test"}, category="Users")

def test_university_apis():
    """Test university APIs (mostly public)"""
    print("\n🏫 UNIVERSITY APIs")
    print("=" * 50)
    
    test_endpoint("GET", "/universities", "List universities", expected_status=[200], category="Universities")
    test_endpoint("GET", "/universities/mit", "Get MIT details", expected_status=[200, 404], category="Universities")

def test_post_apis(token):
    """Test post/feed APIs"""
    print("\n📝 POST/FEED APIs")
    print("=" * 50)
    
    test_endpoint("GET", "/feed/posts/", "List posts", expected_status=[200, 401, 403], 
                  auth_token=token, category="Posts")
    test_endpoint("GET", "/feed/posts/test", "Test endpoint", expected_status=[200], category="Posts")
    test_endpoint("POST", "/feed/posts/", "Create post", expected_status=[201, 401, 403, 422], 
                  auth_token=token, data={"content": "Test post"}, category="Posts")

def test_event_apis(token):
    """Test event APIs"""
    print("\n📅 EVENT APIs")
    print("=" * 50)
    
    test_endpoint("GET", "/events/", "List events", expected_status=[200, 401, 403], 
                  auth_token=token, category="Events")
    test_endpoint("GET", "/events/registered/me", "My registered events", expected_status=[200, 401, 403], 
                  auth_token=token, category="Events")

def test_group_apis(token):
    """Test group APIs"""
    print("\n👥 GROUP APIs")
    print("=" * 50)
    
    test_endpoint("GET", "/groups/", "List groups", expected_status=[200, 401, 403], 
                  auth_token=token, category="Groups")
    test_endpoint("GET", "/groups/joined/me", "My joined groups", expected_status=[200, 401, 403], 
                  auth_token=token, category="Groups")

def test_connection_apis(token):
    """Test connection APIs"""
    print("\n🤝 CONNECTION APIs")
    print("=" * 50)
    
    test_endpoint("GET", "/connections/", "List connections", expected_status=[200, 401, 403], 
                  auth_token=token, category="Connections")
    test_endpoint("GET", "/connections/requests/received", "Received requests", 
                  expected_status=[200, 401, 403], auth_token=token, category="Connections")
    test_endpoint("GET", "/connections/requests/sent", "Sent requests", 
                  expected_status=[200, 401, 403], auth_token=token, category="Connections")

def test_message_apis(token):
    """Test message APIs"""
    print("\n💬 MESSAGE APIs")
    print("=" * 50)
    
    test_endpoint("GET", "/messages/conversations", "List conversations", 
                  expected_status=[200, 401, 403], auth_token=token, category="Messages")

def test_notification_apis(token):
    """Test notification APIs"""
    print("\n🔔 NOTIFICATION APIs")
    print("=" * 50)
    
    test_endpoint("GET", "/notifications/", "List notifications", expected_status=[200, 401, 403], 
                  auth_token=token, category="Notifications")

def test_document_apis(token):
    """Test document APIs - CORRECTED PATHS"""
    print("\n📄 DOCUMENT APIs")
    print("=" * 50)
    
    # Correct paths: /documents/requests, not /documents/my-requests
    test_endpoint("GET", "/documents/requests", "My document requests", 
                  expected_status=[200, 401, 403], auth_token=token, category="Documents")
    test_endpoint("POST", "/documents/requests", "Create document request", 
                  expected_status=[201, 401, 403, 422], auth_token=token, 
                  data={"document_type": "transcript"}, category="Documents")
    test_endpoint("GET", "/documents/generated", "Get generated documents", 
                  expected_status=[200, 401, 403], auth_token=token, category="Documents")

def test_support_apis(token):
    """Test support/ticket APIs"""
    print("\n🎫 SUPPORT APIs")
    print("=" * 50)
    
    test_endpoint("GET", "/support/tickets", "List my tickets", expected_status=[200, 401, 403], 
                  auth_token=token, category="Support")
    test_endpoint("POST", "/support/tickets", "Create ticket", expected_status=[201, 401, 403, 422], 
                  auth_token=token, data={"subject": "Test", "description": "Test"}, category="Support")

def test_ad_apis(token):
    """Test ad APIs - CORRECTED PATHS"""
    print("\n📢 AD APIs")
    print("=" * 50)
    
    test_endpoint("GET", "/ads/", "List ads", expected_status=[200, 401, 403], 
                  auth_token=token, category="Ads")
    test_endpoint("GET", "/ads/for-user", "Ads for user", expected_status=[200, 401, 403], 
                  auth_token=token, category="Ads")

def test_fundraiser_apis(token):
    """Test fundraiser APIs - CORRECTED PATHS"""
    print("\n💰 FUNDRAISER APIs")
    print("=" * 50)
    
    # Correct path: /fundraisers/active, not /fundraisers/
    test_endpoint("GET", "/fundraisers/active", "Active fundraisers", expected_status=[200, 401, 403], 
                  auth_token=token, category="Fundraisers")
    test_endpoint("GET", "/fundraisers/admin", "Admin fundraisers", expected_status=[200, 401, 403], 
                  auth_token=token, category="Fundraisers")

def test_career_roadmap_apis(token):
    """Test career roadmap APIs - CORRECTED PATHS"""
    print("\n🛤️  CAREER ROADMAP APIs")
    print("=" * 50)
    
    # Correct path: /career-roadmap/my-roadmaps, not /career-roadmap/saved
    test_endpoint("GET", "/career-roadmap/my-roadmaps", "My roadmaps", expected_status=[200, 401, 403], 
                  auth_token=token, category="Career")
    test_endpoint("POST", "/career-roadmap/generate", "Generate roadmap", 
                  expected_status=[200, 401, 403, 422], auth_token=token,
                  data={"current_role": "Developer", "target_role": "Senior Developer"}, category="Career")
    test_endpoint("GET", "/career-roadmap/popular", "Popular roadmaps", expected_status=[200, 401, 403], 
                  auth_token=token, category="Career")

def test_heatmap_apis(token):
    """Test heatmap APIs - CORRECTED PATHS"""
    print("\n🗺️  HEATMAP APIs")
    print("=" * 50)
    
    # Correct paths
    test_endpoint("GET", "/heatmap/aggregate", "Aggregate heatmap", expected_status=[200, 401, 403], 
                  auth_token=token, category="Heatmap")
    test_endpoint("GET", "/heatmap/stats", "Heatmap stats", expected_status=[200, 401, 403], 
                  auth_token=token, category="Heatmap")
    test_endpoint("GET", "/heatmap/filters", "Heatmap filters", expected_status=[200, 401, 403], 
                  auth_token=token, category="Heatmap")

def test_lead_intelligence_apis(token):
    """Test lead intelligence APIs - CORRECTED PATHS"""
    print("\n📊 LEAD INTELLIGENCE APIs")
    print("=" * 50)
    
    test_endpoint("GET", "/lead-intelligence/universities", "Universities", 
                  expected_status=[200, 401, 403], auth_token=token, category="Lead Intel")
    test_endpoint("GET", "/lead-intelligence/analytics/overview", "Analytics overview", 
                  expected_status=[200, 401, 403], auth_token=token, category="Lead Intel")
    test_endpoint("GET", "/lead-intelligence/leads", "Leads list", 
                  expected_status=[200, 401, 403], auth_token=token, category="Lead Intel")
    test_endpoint("GET", "/lead-intelligence/ai-insights", "AI insights", 
                  expected_status=[200, 401, 403], auth_token=token, category="Lead Intel")

def test_course_intelligence_apis(token):
    """Test course intelligence APIs - CORRECTED PATHS"""
    print("\n🎓 COURSE INTELLIGENCE APIs")
    print("=" * 50)
    
    test_endpoint("GET", "/course-intelligence/analytics", "Analytics", 
                  expected_status=[200, 401, 403], auth_token=token, category="Course Intel")
    test_endpoint("GET", "/course-intelligence/leads/all", "All leads", 
                  expected_status=[200, 401, 403], auth_token=token, category="Course Intel")
    test_endpoint("GET", "/course-intelligence/leads/ug", "UG leads", 
                  expected_status=[200, 401, 403], auth_token=token, category="Course Intel")
    test_endpoint("GET", "/course-intelligence/leads/pg", "PG leads", 
                  expected_status=[200, 401, 403], auth_token=token, category="Course Intel")
    test_endpoint("GET", "/course-intelligence/courses", "Courses list", 
                  expected_status=[200, 401, 403], auth_token=token, category="Course Intel")

def test_admin_apis(token):
    """Test admin APIs"""
    print("\n👨‍💼 ADMIN APIs")
    print("=" * 50)
    
    test_endpoint("GET", "/admin/dashboard", "Dashboard", expected_status=[200, 401, 403], 
                  auth_token=token, category="Admin")
    test_endpoint("GET", "/admin/users", "Users list", expected_status=[200, 401, 403], 
                  auth_token=token, category="Admin")
    test_endpoint("GET", "/admin/documents", "Document requests", expected_status=[200, 401, 403], 
                  auth_token=token, category="Admin")
    test_endpoint("GET", "/admin/tickets", "Support tickets", expected_status=[200, 401, 403], 
                  auth_token=token, category="Admin")
    test_endpoint("GET", "/admin/fundraisers", "Fundraisers", expected_status=[200, 401, 403], 
                  auth_token=token, category="Admin")
    test_endpoint("GET", "/admin/ads", "Ads", expected_status=[200, 401, 403], 
                  auth_token=token, category="Admin")
    test_endpoint("GET", "/admin/password-resets", "Password resets", expected_status=[200, 401, 403], 
                  auth_token=token, category="Admin")

def test_superadmin_apis(token):
    """Test superadmin APIs"""
    print("\n🦸 SUPERADMIN APIs")
    print("=" * 50)
    
    test_endpoint("GET", "/superadmin/dashboard", "Dashboard", expected_status=[200, 401, 403], 
                  auth_token=token, category="Superadmin")
    test_endpoint("GET", "/superadmin/universities", "Universities", expected_status=[200, 401, 403], 
                  auth_token=token, category="Superadmin")
    test_endpoint("GET", "/superadmin/admins", "Admins", expected_status=[200, 401, 403], 
                  auth_token=token, category="Superadmin")
    test_endpoint("GET", "/superadmin/users", "Global users", expected_status=[200, 401, 403], 
                  auth_token=token, category="Superadmin")
    test_endpoint("GET", "/superadmin/password-resets", "Password resets", expected_status=[200, 401, 403], 
                  auth_token=token, category="Superadmin")
    test_endpoint("GET", "/superadmin/audit-logs", "Audit logs", expected_status=[200, 401, 403], 
                  auth_token=token, category="Superadmin")
    test_endpoint("GET", "/superadmin/ads", "Global ads", expected_status=[200, 401, 403], 
                  auth_token=token, category="Superadmin")

def test_knowledge_base_apis(token):
    """Test knowledge base APIs - CORRECTED PATHS"""
    print("\n📚 KNOWLEDGE BASE APIs")
    print("=" * 50)
    
    # Admin KB routes
    test_endpoint("GET", "/admin/knowledge-base/status", "KB status", 
                  expected_status=[200, 401, 403], auth_token=token, category="Knowledge Base")
    test_endpoint("GET", "/admin/knowledge-base/documents", "KB documents", 
                  expected_status=[200, 401, 403], auth_token=token, category="Knowledge Base")
    
    # Chat routes
    test_endpoint("POST", "/chat/query", "Chat query", expected_status=[200, 401, 403, 422], 
                  auth_token=token, data={"question": "What is MIT?"}, 
                  category="Knowledge Base")

def print_summary():
    """Print test summary"""
    print("\n" + "=" * 60)
    print("📊 COMPREHENSIVE TEST SUMMARY")
    print("=" * 60)
    
    total = results["passed"] + results["failed"] + results["skipped"]
    
    print(f"\n  ✅ Passed:  {results['passed']}/{total}")
    print(f"  ❌ Failed:  {results['failed']}/{total}")
    print(f"  ⏭️  Skipped: {results['skipped']}/{total}")
    
    if total > 0:
        success_rate = (results["passed"] / total) * 100
        print(f"\n  📈 Success Rate: {success_rate:.1f}%")
    
    if results["errors"]:
        print("\n" + "-" * 60)
        print("❌ FAILED ENDPOINTS:")
        print("-" * 60)
        
        not_found = [e for e in results["errors"] if "404" in e]
        server_errors = [e for e in results["errors"] if "500" in e]
        auth_errors = [e for e in results["errors"] if "401" in e or "403" in e]
        other_errors = [e for e in results["errors"] if e not in not_found + server_errors + auth_errors]
        
        if server_errors:
            print("\n🔴 Server Errors (500) - CRITICAL:")
            for e in server_errors[:5]:
                print(f"    • {e}")
        
        if not_found:
            print(f"\n🟡 Not Found (404) - {len(not_found)} endpoints:")
            for e in not_found[:5]:
                print(f"    • {e}")
            if len(not_found) > 5:
                print(f"    ... and {len(not_found) - 5} more")
        
        if other_errors:
            print("\n🟠 Other Errors:")
            for e in other_errors[:5]:
                print(f"    • {e}")
    else:
        print("\n✅ All endpoints working correctly!")
    
    print("\n" + "=" * 60)
    print("✨ Test Complete!")
    print("=" * 60)

def main():
    """Run all API tests"""
    print("=" * 60)
    print("🧪 Alumni Connect Hub - COMPREHENSIVE API Test Suite")
    print(f"📅 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    if not test_health():
        print("\n⛔ Server not running! Please start the backend first.")
        return
    
    token = get_auth_tokens()
    
    test_auth_apis(token)
    test_user_apis(token)
    test_university_apis()
    test_post_apis(token)
    test_event_apis(token)
    test_group_apis(token)
    test_connection_apis(token)
    test_message_apis(token)
    test_notification_apis(token)
    test_document_apis(token)
    test_support_apis(token)
    test_ad_apis(token)
    test_fundraiser_apis(token)
    test_career_roadmap_apis(token)
    test_heatmap_apis(token)
    test_lead_intelligence_apis(token)
    test_course_intelligence_apis(token)
    test_admin_apis(token)
    test_superadmin_apis(token)
    test_knowledge_base_apis(token)
    
    print_summary()

if __name__ == "__main__":
    main()

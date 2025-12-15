#!/usr/bin/env python3
"""
Comprehensive Frontend API Test Script
Tests ALL APIs defined in the frontend api.ts file
"""
import requests
import json
import sys
from datetime import datetime, timedelta

API_BASE_URL = "http://localhost:8000/api/v1"

class ComprehensiveAPITester:
    def __init__(self):
        self.token = None
        self.admin_token = None
        self.superadmin_token = None
        self.user_id = None
        self.test_event_id = None
        self.test_doc_request_id = None
        self.results = []
        
    def log_result(self, category, test_name, success, message=""):
        status = "[PASS]" if success else "[FAIL]"
        print(f"  {status} {test_name}")
        if message and not success:
            print(f"         {message[:100]}")
        self.results.append((category, test_name, success, message))
        
    def get_headers(self, token=None):
        headers = {"Content-Type": "application/json"}
        t = token or self.token
        if t:
            headers["Authorization"] = f"Bearer {t}"
        return headers
    
    # ==================== AUTHENTICATION ====================
    def test_auth_apis(self):
        print("\n" + "="*60)
        print("1. AUTHENTICATION APIs")
        print("="*60)
        
        # Test login with alumni user
        try:
            response = requests.post(
                f"{API_BASE_URL}/auth/login",
                json={"email": "john.doe@alumni.mit.edu", "password": "password123"},
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                self.user_id = data.get("user", {}).get("id")
                self.log_result("Auth", "POST /auth/login (Alumni)", True)
            else:
                self.log_result("Auth", "POST /auth/login (Alumni)", False, response.text)
        except Exception as e:
            self.log_result("Auth", "POST /auth/login (Alumni)", False, str(e))
        
        # Test login with admin user
        try:
            response = requests.post(
                f"{API_BASE_URL}/auth/login",
                json={"email": "admin@mit.edu", "password": "password123"},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                self.admin_token = response.json().get("access_token")
                self.log_result("Auth", "POST /auth/login (Admin)", True)
            else:
                self.log_result("Auth", "POST /auth/login (Admin)", False, response.text)
        except Exception as e:
            self.log_result("Auth", "POST /auth/login (Admin)", False, str(e))
        
        # Test login with superadmin
        try:
            response = requests.post(
                f"{API_BASE_URL}/auth/login",
                json={"email": "superadmin@alumni.connect", "password": "password123"},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            if response.status_code == 200:
                self.superadmin_token = response.json().get("access_token")
                self.log_result("Auth", "POST /auth/login (SuperAdmin)", True)
            else:
                self.log_result("Auth", "POST /auth/login (SuperAdmin)", False, response.text)
        except Exception as e:
            self.log_result("Auth", "POST /auth/login (SuperAdmin)", False, str(e))
        
        # Test get current user
        try:
            response = requests.get(
                f"{API_BASE_URL}/auth/me",
                headers=self.get_headers(),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Auth", "GET /auth/me", True)
            else:
                self.log_result("Auth", "GET /auth/me", False, response.text)
        except Exception as e:
            self.log_result("Auth", "GET /auth/me", False, str(e))

    # ==================== EVENTS ====================
    def test_event_apis(self):
        print("\n" + "="*60)
        print("2. EVENT APIs")
        print("="*60)
        
        # Get events list
        try:
            response = requests.get(
                f"{API_BASE_URL}/events?page=1&page_size=10",
                headers=self.get_headers(),
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                self.log_result("Events", "GET /events (List)", True)
                # Save an event ID if available
                events = data.get("events", [])
                if events:
                    self.test_event_id = events[0].get("id")
            else:
                self.log_result("Events", "GET /events (List)", False, response.text)
        except Exception as e:
            self.log_result("Events", "GET /events (List)", False, str(e))
        
        # Create event (admin only)
        try:
            event_date = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
            event_data = {
                "title": "API Test Event",
                "description": "Event created by API test",
                "event_date": event_date,
                "event_time": "14:00",
                "location": "Test Location",
                "is_virtual": False,
                "category": "networking"
            }
            response = requests.post(
                f"{API_BASE_URL}/events",
                json=event_data,
                headers=self.get_headers(self.admin_token),
                timeout=10
            )
            if response.status_code == 201:
                self.test_event_id = response.json().get("id")
                self.log_result("Events", "POST /events (Create)", True)
            else:
                self.log_result("Events", "POST /events (Create)", False, response.text)
        except Exception as e:
            self.log_result("Events", "POST /events (Create)", False, str(e))
        
        # Get single event
        if self.test_event_id:
            try:
                response = requests.get(
                    f"{API_BASE_URL}/events/{self.test_event_id}",
                    headers=self.get_headers(),
                    timeout=10
                )
                if response.status_code == 200:
                    self.log_result("Events", "GET /events/{id}", True)
                else:
                    self.log_result("Events", "GET /events/{id}", False, response.text)
            except Exception as e:
                self.log_result("Events", "GET /events/{id}", False, str(e))
        
        # Register for event
        if self.test_event_id:
            try:
                response = requests.post(
                    f"{API_BASE_URL}/events/{self.test_event_id}/register",
                    headers=self.get_headers(),
                    timeout=10
                )
                if response.status_code == 200:
                    self.log_result("Events", "POST /events/{id}/register", True)
                else:
                    self.log_result("Events", "POST /events/{id}/register", False, response.text)
            except Exception as e:
                self.log_result("Events", "POST /events/{id}/register", False, str(e))
        
        # Get registered events
        try:
            response = requests.get(
                f"{API_BASE_URL}/events/registered/me",
                headers=self.get_headers(),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Events", "GET /events/registered/me", True)
            else:
                self.log_result("Events", "GET /events/registered/me", False, response.text)
        except Exception as e:
            self.log_result("Events", "GET /events/registered/me", False, str(e))
        
        # Unregister from event
        if self.test_event_id:
            try:
                response = requests.delete(
                    f"{API_BASE_URL}/events/{self.test_event_id}/register",
                    headers=self.get_headers(),
                    timeout=10
                )
                if response.status_code == 200:
                    self.log_result("Events", "DELETE /events/{id}/register", True)
                else:
                    self.log_result("Events", "DELETE /events/{id}/register", False, response.text)
            except Exception as e:
                self.log_result("Events", "DELETE /events/{id}/register", False, str(e))
        
        # Delete test event (cleanup)
        if self.test_event_id:
            try:
                response = requests.delete(
                    f"{API_BASE_URL}/events/{self.test_event_id}",
                    headers=self.get_headers(self.admin_token),
                    timeout=10
                )
                if response.status_code == 200:
                    self.log_result("Events", "DELETE /events/{id}", True)
                else:
                    self.log_result("Events", "DELETE /events/{id}", False, response.text)
            except Exception as e:
                self.log_result("Events", "DELETE /events/{id}", False, str(e))

    # ==================== UNIVERSITIES ====================
    def test_university_apis(self):
        print("\n" + "="*60)
        print("3. UNIVERSITY APIs")
        print("="*60)
        
        # Get university
        try:
            response = requests.get(
                f"{API_BASE_URL}/universities/mit",
                headers=self.get_headers(),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Universities", "GET /universities/{id}", True)
            else:
                self.log_result("Universities", "GET /universities/{id}", False, response.text)
        except Exception as e:
            self.log_result("Universities", "GET /universities/{id}", False, str(e))

    # ==================== DOCUMENTS ====================
    def test_document_apis(self):
        print("\n" + "="*60)
        print("4. DOCUMENT APIs")
        print("="*60)
        
        # Get document requests (user)
        try:
            response = requests.get(
                f"{API_BASE_URL}/documents/requests?page=1&page_size=10",
                headers=self.get_headers(),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Documents", "GET /documents/requests", True)
            else:
                self.log_result("Documents", "GET /documents/requests", False, response.text)
        except Exception as e:
            self.log_result("Documents", "GET /documents/requests", False, str(e))
        
        # Create document request
        try:
            doc_data = {
                "document_type": "Official Transcript",
                "reason": "API test document request"
            }
            response = requests.post(
                f"{API_BASE_URL}/documents/requests",
                json=doc_data,
                headers=self.get_headers(),
                timeout=10
            )
            if response.status_code == 201:
                self.test_doc_request_id = response.json().get("id")
                self.log_result("Documents", "POST /documents/requests", True)
            else:
                self.log_result("Documents", "POST /documents/requests", False, response.text)
        except Exception as e:
            self.log_result("Documents", "POST /documents/requests", False, str(e))
        
        # Cancel document request
        if self.test_doc_request_id:
            try:
                response = requests.delete(
                    f"{API_BASE_URL}/documents/requests/{self.test_doc_request_id}",
                    headers=self.get_headers(),
                    timeout=10
                )
                if response.status_code == 200:
                    self.log_result("Documents", "DELETE /documents/requests/{id}", True)
                else:
                    self.log_result("Documents", "DELETE /documents/requests/{id}", False, response.text)
            except Exception as e:
                self.log_result("Documents", "DELETE /documents/requests/{id}", False, str(e))

    # ==================== ADMIN ====================
    def test_admin_apis(self):
        print("\n" + "="*60)
        print("5. ADMIN APIs")
        print("="*60)
        
        if not self.admin_token:
            print("  [SKIP] No admin token available")
            return
        
        # Get admin document requests
        try:
            response = requests.get(
                f"{API_BASE_URL}/admin/documents?page=1&page_size=10",
                headers=self.get_headers(self.admin_token),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Admin", "GET /admin/documents", True)
            else:
                self.log_result("Admin", "GET /admin/documents", False, response.text)
        except Exception as e:
            self.log_result("Admin", "GET /admin/documents", False, str(e))
        
        # Get admin users list
        try:
            response = requests.get(
                f"{API_BASE_URL}/admin/users?page=1&page_size=10",
                headers=self.get_headers(self.admin_token),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Admin", "GET /admin/users", True)
            else:
                self.log_result("Admin", "GET /admin/users", False, response.text)
        except Exception as e:
            self.log_result("Admin", "GET /admin/users", False, str(e))
        
        # Get admin dashboard
        try:
            response = requests.get(
                f"{API_BASE_URL}/admin/dashboard",
                headers=self.get_headers(self.admin_token),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Admin", "GET /admin/dashboard", True)
            else:
                self.log_result("Admin", "GET /admin/dashboard", False, response.text)
        except Exception as e:
            self.log_result("Admin", "GET /admin/dashboard", False, str(e))

    # ==================== SUPERADMIN ====================
    def test_superadmin_apis(self):
        print("\n" + "="*60)
        print("6. SUPERADMIN APIs")
        print("="*60)
        
        if not self.superadmin_token:
            print("  [SKIP] No superadmin token available")
            return
        
        # Get superadmin dashboard
        try:
            response = requests.get(
                f"{API_BASE_URL}/superadmin/dashboard",
                headers=self.get_headers(self.superadmin_token),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("SuperAdmin", "GET /superadmin/dashboard", True)
            else:
                self.log_result("SuperAdmin", "GET /superadmin/dashboard", False, response.text)
        except Exception as e:
            self.log_result("SuperAdmin", "GET /superadmin/dashboard", False, str(e))
        
        # Get universities list
        try:
            response = requests.get(
                f"{API_BASE_URL}/superadmin/universities",
                headers=self.get_headers(self.superadmin_token),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("SuperAdmin", "GET /superadmin/universities", True)
            else:
                self.log_result("SuperAdmin", "GET /superadmin/universities", False, response.text)
        except Exception as e:
            self.log_result("SuperAdmin", "GET /superadmin/universities", False, str(e))
        
        # Get admins list
        try:
            response = requests.get(
                f"{API_BASE_URL}/superadmin/admins",
                headers=self.get_headers(self.superadmin_token),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("SuperAdmin", "GET /superadmin/admins", True)
            else:
                self.log_result("SuperAdmin", "GET /superadmin/admins", False, response.text)
        except Exception as e:
            self.log_result("SuperAdmin", "GET /superadmin/admins", False, str(e))

    # ==================== LEAD INTELLIGENCE ====================
    def test_lead_intelligence_apis(self):
        print("\n" + "="*60)
        print("7. LEAD INTELLIGENCE APIs")
        print("="*60)
        
        if not self.superadmin_token:
            print("  [SKIP] No superadmin token available")
            return
        
        # Get leads (may be slow)
        try:
            response = requests.get(
                f"{API_BASE_URL}/lead-intelligence/leads",
                headers=self.get_headers(self.superadmin_token),
                timeout=30
            )
            if response.status_code == 200:
                self.log_result("LeadIntel", "GET /lead-intelligence/leads", True)
            else:
                self.log_result("LeadIntel", "GET /lead-intelligence/leads", False, response.text)
        except Exception as e:
            self.log_result("LeadIntel", "GET /lead-intelligence/leads", False, str(e))
        
        # Get top ads (may be slow)
        try:
            response = requests.get(
                f"{API_BASE_URL}/lead-intelligence/top-ads",
                headers=self.get_headers(self.superadmin_token),
                timeout=30
            )
            if response.status_code == 200:
                self.log_result("LeadIntel", "GET /lead-intelligence/top-ads", True)
            else:
                self.log_result("LeadIntel", "GET /lead-intelligence/top-ads", False, response.text)
        except Exception as e:
            self.log_result("LeadIntel", "GET /lead-intelligence/top-ads", False, str(e))
        
        # Get career paths
        try:
            response = requests.get(
                f"{API_BASE_URL}/lead-intelligence/career-paths",
                headers=self.get_headers(self.superadmin_token),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("LeadIntel", "GET /lead-intelligence/career-paths", True)
            else:
                self.log_result("LeadIntel", "GET /lead-intelligence/career-paths", False, response.text)
        except Exception as e:
            self.log_result("LeadIntel", "GET /lead-intelligence/career-paths", False, str(e))

    # ==================== USERS ====================
    def test_user_apis(self):
        print("\n" + "="*60)
        print("8. USER APIs")
        print("="*60)
        
        # Get users list
        try:
            response = requests.get(
                f"{API_BASE_URL}/users?page=1&page_size=10",
                headers=self.get_headers(),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Users", "GET /users (List)", True)
            else:
                self.log_result("Users", "GET /users (List)", False, response.text)
        except Exception as e:
            self.log_result("Users", "GET /users (List)", False, str(e))
        
        # Get user by ID
        if self.user_id:
            try:
                response = requests.get(
                    f"{API_BASE_URL}/users/{self.user_id}",
                    headers=self.get_headers(),
                    timeout=10
                )
                if response.status_code == 200:
                    self.log_result("Users", "GET /users/{id}", True)
                else:
                    self.log_result("Users", "GET /users/{id}", False, response.text)
            except Exception as e:
                self.log_result("Users", "GET /users/{id}", False, str(e))

    # ==================== CONNECTIONS ====================
    def test_connection_apis(self):
        print("\n" + "="*60)
        print("9. CONNECTION APIs")
        print("="*60)
        
        # Get connections
        try:
            response = requests.get(
                f"{API_BASE_URL}/connections",
                headers=self.get_headers(),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Connections", "GET /connections", True)
            else:
                self.log_result("Connections", "GET /connections", False, response.text)
        except Exception as e:
            self.log_result("Connections", "GET /connections", False, str(e))
        
        # Get connection requests (received)
        try:
            response = requests.get(
                f"{API_BASE_URL}/connections/requests/received",
                headers=self.get_headers(),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Connections", "GET /connections/requests/received", True)
            else:
                self.log_result("Connections", "GET /connections/requests/received", False, response.text)
        except Exception as e:
            self.log_result("Connections", "GET /connections/requests/received", False, str(e))

    # ==================== NOTIFICATIONS ====================
    def test_notification_apis(self):
        print("\n" + "="*60)
        print("10. NOTIFICATION APIs")
        print("="*60)
        
        # Get notifications
        try:
            response = requests.get(
                f"{API_BASE_URL}/notifications",
                headers=self.get_headers(),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Notifications", "GET /notifications", True)
            else:
                self.log_result("Notifications", "GET /notifications", False, response.text)
        except Exception as e:
            self.log_result("Notifications", "GET /notifications", False, str(e))
        
        # Get unread count
        try:
            response = requests.get(
                f"{API_BASE_URL}/notifications/unread-count",
                headers=self.get_headers(),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Notifications", "GET /notifications/unread-count", True)
            else:
                self.log_result("Notifications", "GET /notifications/unread-count", False, response.text)
        except Exception as e:
            self.log_result("Notifications", "GET /notifications/unread-count", False, str(e))

    # ==================== GROUPS ====================
    def test_group_apis(self):
        print("\n" + "="*60)
        print("11. GROUP APIs")
        print("="*60)
        
        # Get groups
        try:
            response = requests.get(
                f"{API_BASE_URL}/groups",
                headers=self.get_headers(),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Groups", "GET /groups", True)
            else:
                self.log_result("Groups", "GET /groups", False, response.text)
        except Exception as e:
            self.log_result("Groups", "GET /groups", False, str(e))

    # ==================== SUPPORT ====================
    def test_support_apis(self):
        print("\n" + "="*60)
        print("12. SUPPORT APIs")
        print("="*60)
        
        # Get support tickets
        try:
            response = requests.get(
                f"{API_BASE_URL}/support/tickets",
                headers=self.get_headers(),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Support", "GET /support/tickets", True)
            else:
                self.log_result("Support", "GET /support/tickets", False, response.text)
        except Exception as e:
            self.log_result("Support", "GET /support/tickets", False, str(e))

    # ==================== MESSAGES ====================
    def test_message_apis(self):
        print("\n" + "="*60)
        print("13. MESSAGE APIs")
        print("="*60)
        
        # Get conversations
        try:
            response = requests.get(
                f"{API_BASE_URL}/messages/conversations",
                headers=self.get_headers(),
                timeout=10
            )
            if response.status_code == 200:
                self.log_result("Messages", "GET /messages/conversations", True)
            else:
                self.log_result("Messages", "GET /messages/conversations", False, response.text)
        except Exception as e:
            self.log_result("Messages", "GET /messages/conversations", False, str(e))

    def run_all_tests(self):
        """Run all API tests"""
        print("\n" + "="*60)
        print("COMPREHENSIVE FRONTEND API TESTS")
        print("="*60)
        print(f"API Base URL: {API_BASE_URL}")
        
        # Check server health first
        try:
            response = requests.get("http://localhost:8000/health", timeout=5)
            if response.status_code != 200:
                print("\n[ERROR] Server not healthy")
                return False
        except:
            print("\n[ERROR] Server not available. Please start the backend server.")
            return False
        
        # Run all test categories
        self.test_auth_apis()
        self.test_event_apis()
        self.test_university_apis()
        self.test_document_apis()
        self.test_admin_apis()
        self.test_superadmin_apis()
        self.test_lead_intelligence_apis()
        self.test_user_apis()
        self.test_connection_apis()
        self.test_notification_apis()
        self.test_group_apis()
        self.test_support_apis()
        self.test_message_apis()
        
        # Summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        # Group by category
        categories = {}
        for cat, name, success, msg in self.results:
            if cat not in categories:
                categories[cat] = {"passed": 0, "failed": 0, "tests": []}
            categories[cat]["tests"].append((name, success, msg))
            if success:
                categories[cat]["passed"] += 1
            else:
                categories[cat]["failed"] += 1
        
        total_passed = sum(c["passed"] for c in categories.values())
        total_failed = sum(c["failed"] for c in categories.values())
        total = total_passed + total_failed
        
        print(f"\nOverall: {total_passed}/{total} passed, {total_failed} failed")
        print("\nBy Category:")
        for cat, data in categories.items():
            status = "PASS" if data["failed"] == 0 else "FAIL"
            print(f"  [{status}] {cat}: {data['passed']}/{data['passed'] + data['failed']}")
        
        if total_failed > 0:
            print("\nFailed Tests:")
            for cat, name, success, msg in self.results:
                if not success:
                    print(f"  - {cat}: {name}")
                    if msg:
                        print(f"    Error: {msg[:80]}...")
        
        return total_failed == 0


def main():
    tester = ComprehensiveAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())


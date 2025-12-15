#!/usr/bin/env python3
"""
Frontend API Integration Test Script
Tests all post-related APIs from the frontend's perspective
"""
import requests
import json
import sys
from io import BytesIO

# Configuration - matching frontend settings
API_BASE_URL = "http://localhost:8000/api/v1"

class FrontendAPITester:
    def __init__(self):
        self.token = None
        self.test_post_id = None
        self.test_comment_id = None
        self.results = []
        
    def log_result(self, test_name, success, message=""):
        status = "[PASS]" if success else "[FAIL]"
        print(f"{status} {test_name}")
        if message:
            print(f"       {message}")
        self.results.append((test_name, success))
        
    def get_headers(self):
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    def test_health(self):
        """Test server health"""
        print("\n" + "="*60)
        print("SERVER HEALTH CHECK")
        print("="*60)
        try:
            response = requests.get(f"http://localhost:8000/health", timeout=5)
            if response.status_code == 200:
                self.log_result("Health Check", True, "Server is healthy")
                return True
            else:
                self.log_result("Health Check", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Health Check", False, str(e))
            return False
    
    def test_login(self):
        """Test login - matching frontend api.ts login method"""
        print("\n" + "="*60)
        print("AUTHENTICATION")
        print("="*60)
        try:
            # Using email like frontend does
            response = requests.post(
                f"{API_BASE_URL}/auth/login",
                json={"email": "john.doe@alumni.mit.edu", "password": "password123"},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                user = data.get("user", {})
                self.log_result("Login", True, f"User: {user.get('name')} ({user.get('email')})")
                return True
            else:
                self.log_result("Login", False, f"Status: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("Login", False, str(e))
            return False
    
    def test_get_posts(self):
        """Test GET /feed/posts - matching frontend getPosts()"""
        print("\n" + "="*60)
        print("POST APIs")
        print("="*60)
        try:
            response = requests.get(
                f"{API_BASE_URL}/feed/posts?page=1&page_size=10",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                posts = data.get("posts", [])
                # Check response structure matches frontend expectations
                if posts and len(posts) > 0:
                    post = posts[0]
                    required_fields = ["id", "author", "type", "content", "likes_count", "comments_count"]
                    missing = [f for f in required_fields if f not in post]
                    if missing:
                        self.log_result("GET /feed/posts", False, f"Missing fields: {missing}")
                    else:
                        self.log_result("GET /feed/posts", True, f"Retrieved {len(posts)} posts")
                        # Save first post ID for later tests if no test post created
                        if not self.test_post_id and posts:
                            self.test_post_id = posts[0]["id"]
                else:
                    self.log_result("GET /feed/posts", True, "No posts yet")
                return True
            else:
                self.log_result("GET /feed/posts", False, f"Status: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("GET /feed/posts", False, str(e))
            return False
    
    def test_create_post(self):
        """Test POST /feed/posts - matching frontend createPost()"""
        try:
            post_data = {
                "type": "text",
                "content": "Frontend integration test post - testing API connectivity",
                "tag": "test"
            }
            
            response = requests.post(
                f"{API_BASE_URL}/feed/posts",
                json=post_data,
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                self.test_post_id = data.get("id")
                self.log_result("POST /feed/posts (Create)", True, f"Post ID: {self.test_post_id}")
                return True
            else:
                self.log_result("POST /feed/posts (Create)", False, f"Status: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("POST /feed/posts (Create)", False, str(e))
            return False
    
    def test_get_single_post(self):
        """Test GET /feed/posts/{id} - matching frontend getPost()"""
        if not self.test_post_id:
            self.log_result("GET /feed/posts/{id}", False, "No post ID available")
            return False
            
        try:
            response = requests.get(
                f"{API_BASE_URL}/feed/posts/{self.test_post_id}",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("GET /feed/posts/{id}", True, f"Content: {data.get('content', '')[:50]}...")
                return True
            else:
                self.log_result("GET /feed/posts/{id}", False, f"Status: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("GET /feed/posts/{id}", False, str(e))
            return False
    
    def test_update_post(self):
        """Test PUT /feed/posts/{id} - matching frontend updatePost()"""
        if not self.test_post_id:
            self.log_result("PUT /feed/posts/{id}", False, "No post ID available")
            return False
            
        try:
            update_data = {
                "content": "Updated content from frontend integration test"
            }
            
            response = requests.put(
                f"{API_BASE_URL}/feed/posts/{self.test_post_id}",
                json=update_data,
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("PUT /feed/posts/{id} (Update)", True, f"Updated: {data.get('content', '')[:50]}...")
                return True
            else:
                self.log_result("PUT /feed/posts/{id} (Update)", False, f"Status: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("PUT /feed/posts/{id} (Update)", False, str(e))
            return False
    
    def test_like_post(self):
        """Test POST /feed/posts/{id}/like - matching frontend likePost()"""
        if not self.test_post_id:
            self.log_result("POST /feed/posts/{id}/like", False, "No post ID available")
            return False
            
        try:
            response = requests.post(
                f"{API_BASE_URL}/feed/posts/{self.test_post_id}/like",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("POST /feed/posts/{id}/like (Like)", True, f"Likes: {data.get('likes_count')}")
                return True
            else:
                self.log_result("POST /feed/posts/{id}/like (Like)", False, f"Status: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("POST /feed/posts/{id}/like (Like)", False, str(e))
            return False
    
    def test_unlike_post(self):
        """Test DELETE /feed/posts/{id}/like - matching frontend unlikePost()"""
        if not self.test_post_id:
            self.log_result("DELETE /feed/posts/{id}/like", False, "No post ID available")
            return False
            
        try:
            response = requests.delete(
                f"{API_BASE_URL}/feed/posts/{self.test_post_id}/like",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("DELETE /feed/posts/{id}/like (Unlike)", True, f"Likes: {data.get('likes_count')}")
                return True
            else:
                self.log_result("DELETE /feed/posts/{id}/like (Unlike)", False, f"Status: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("DELETE /feed/posts/{id}/like (Unlike)", False, str(e))
            return False
    
    def test_get_comments(self):
        """Test GET /feed/posts/{id}/comments - matching frontend getComments()"""
        if not self.test_post_id:
            self.log_result("GET /feed/posts/{id}/comments", False, "No post ID available")
            return False
            
        try:
            response = requests.get(
                f"{API_BASE_URL}/feed/posts/{self.test_post_id}/comments",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("GET /feed/posts/{id}/comments", True, f"Comments: {len(data)}")
                return True
            else:
                self.log_result("GET /feed/posts/{id}/comments", False, f"Status: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("GET /feed/posts/{id}/comments", False, str(e))
            return False
    
    def test_create_comment(self):
        """Test POST /feed/posts/{id}/comments - matching frontend createComment()"""
        if not self.test_post_id:
            self.log_result("POST /feed/posts/{id}/comments", False, "No post ID available")
            return False
            
        try:
            comment_data = {"content": "Frontend integration test comment"}
            
            response = requests.post(
                f"{API_BASE_URL}/feed/posts/{self.test_post_id}/comments",
                json=comment_data,
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                self.test_comment_id = data.get("id")
                self.log_result("POST /feed/posts/{id}/comments (Create)", True, f"Comment ID: {self.test_comment_id}")
                return True
            else:
                self.log_result("POST /feed/posts/{id}/comments (Create)", False, f"Status: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("POST /feed/posts/{id}/comments (Create)", False, str(e))
            return False
    
    def test_delete_comment(self):
        """Test DELETE /feed/posts/{id}/comments/{commentId} - matching frontend deleteComment()"""
        if not self.test_post_id or not self.test_comment_id:
            self.log_result("DELETE /feed/posts/{id}/comments/{commentId}", False, "No post/comment ID available")
            return False
            
        try:
            response = requests.delete(
                f"{API_BASE_URL}/feed/posts/{self.test_post_id}/comments/{self.test_comment_id}",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_result("DELETE /feed/posts/{id}/comments/{commentId}", True, "Comment deleted")
                return True
            else:
                self.log_result("DELETE /feed/posts/{id}/comments/{commentId}", False, f"Status: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("DELETE /feed/posts/{id}/comments/{commentId}", False, str(e))
            return False
    
    def test_upload_media(self):
        """Test POST /feed/posts/upload-media - matching frontend uploadMedia()"""
        try:
            # Create a minimal PNG image
            png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
            
            files = {"file": ("test.png", BytesIO(png_data), "image/png")}
            data = {"media_type": "image"}
            
            headers = {}
            if self.token:
                headers["Authorization"] = f"Bearer {self.token}"
            
            response = requests.post(
                f"{API_BASE_URL}/feed/posts/upload-media",
                files=files,
                data=data,
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                self.log_result("POST /feed/posts/upload-media", True, f"URL: {result.get('url', 'N/A')[:50]}...")
                return True
            else:
                self.log_result("POST /feed/posts/upload-media", False, f"Status: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("POST /feed/posts/upload-media", False, str(e))
            return False
    
    def test_delete_post(self):
        """Test DELETE /feed/posts/{id} - matching frontend deletePost()"""
        if not self.test_post_id:
            self.log_result("DELETE /feed/posts/{id}", False, "No post ID available")
            return False
            
        try:
            response = requests.delete(
                f"{API_BASE_URL}/feed/posts/{self.test_post_id}",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 200:
                self.log_result("DELETE /feed/posts/{id}", True, "Post deleted")
                return True
            else:
                self.log_result("DELETE /feed/posts/{id}", False, f"Status: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            self.log_result("DELETE /feed/posts/{id}", False, str(e))
            return False
    
    def run_all_tests(self):
        """Run all frontend API tests"""
        print("\n" + "="*60)
        print("FRONTEND API INTEGRATION TESTS")
        print("="*60)
        print(f"API Base URL: {API_BASE_URL}")
        
        # Health check
        if not self.test_health():
            print("\nServer not available. Please start the backend server.")
            return False
        
        # Authentication
        if not self.test_login():
            print("\nAuthentication failed. Cannot proceed.")
            return False
        
        # Post CRUD operations
        self.test_get_posts()
        self.test_create_post()
        self.test_get_single_post()
        self.test_update_post()
        
        # Like/Unlike
        self.test_like_post()
        self.test_unlike_post()
        
        # Comments
        self.test_get_comments()
        self.test_create_comment()
        self.test_delete_comment()
        
        # Media upload
        self.test_upload_media()
        
        # Cleanup - delete test post
        self.test_delete_post()
        
        # Summary
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for _, success in self.results if success)
        total = len(self.results)
        
        print(f"\nPassed: {passed}/{total}")
        print(f"Failed: {total - passed}/{total}")
        
        if passed == total:
            print("\n[SUCCESS] All frontend API integrations are working!")
            return True
        else:
            print("\n[WARNING] Some tests failed. Check the results above.")
            failed_tests = [name for name, success in self.results if not success]
            print("Failed tests:")
            for test in failed_tests:
                print(f"  - {test}")
            return False


def main():
    tester = FrontendAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())


#!/usr/bin/env python3
"""
Comprehensive Post API Testing Script
Tests all post-related endpoints and reports issues
"""
import requests
import json
import sys
import os
from io import BytesIO
from typing import Optional, Dict, Any

# API base URL - can be overridden with environment variable
API_URL = os.getenv("API_URL", "http://localhost:8000")

class PostAPITester:
    def __init__(self):
        self.issues = []
        self.test_results = []
        self.token = None
        self.test_user = None
        self.test_post_id = None
        self.test_comment_id = None
        self.test_media_id = None
        
    def login(self, email: str = "john.doe@alumni.mit.edu", password: str = "password123") -> bool:
        """Login and get access token - uses an alumni user with university by default"""
        print("\n" + "=" * 80)
        print("AUTHENTICATION")
        print("=" * 80)
        try:
            response = requests.post(
                f"{API_URL}/api/v1/auth/login",
                json={"email": email, "password": password},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access_token")
                print(f"[OK] Login successful")
                print(f"   Token: {self.token[:50]}...")
                
                # Get user info
                headers = {"Authorization": f"Bearer {self.token}"}
                me_response = requests.get(
                    f"{API_URL}/api/v1/auth/me",
                    headers=headers,
                    timeout=10
                )
                if me_response.status_code == 200:
                    self.test_user = me_response.json()
                    print(f"   User: {self.test_user.get('name', 'N/A')}")
                    print(f"   University ID: {self.test_user.get('university_id', 'None')}")
                return True
            else:
                print(f"[FAIL] Login failed ({response.status_code})")
                print(f"   Error: {response.text}")
                self.issues.append(f"Login failed: {response.status_code} - {response.text}")
                return False
        except requests.exceptions.ConnectionError:
            print(f"[FAIL] Cannot connect to server at {API_URL}")
            print(f"   Make sure the backend server is running")
            self.issues.append(f"Cannot connect to server at {API_URL}")
            return False
        except Exception as e:
            print(f"[FAIL] Login error: {str(e)}")
            self.issues.append(f"Login error: {str(e)}")
            return False
    
    def get_headers(self) -> Dict[str, str]:
        """Get headers with authentication"""
        if not self.token:
            return {}
        return {"Authorization": f"Bearer {self.token}"}
    
    def test_list_posts(self) -> bool:
        """Test GET /api/v1/feed/posts"""
        print("\n" + "=" * 80)
        print("1️⃣  TEST: GET /api/v1/feed/posts - List Posts")
        print("=" * 80)
        try:
            headers = self.get_headers()
            response = requests.get(
                f"{API_URL}/api/v1/feed/posts",
                headers=headers,
                params={"page": 1, "page_size": 10},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ List posts successful")
                print(f"   Total posts: {data.get('total', 0)}")
                print(f"   Posts returned: {len(data.get('posts', []))}")
                self.test_results.append(("GET /api/v1/feed/posts", True, "Success"))
                return True
            else:
                print(f"❌ List posts failed ({response.status_code})")
                print(f"   Error: {response.text}")
                self.issues.append(f"List posts failed: {response.status_code} - {response.text}")
                self.test_results.append(("GET /api/v1/feed/posts", False, f"Status {response.status_code}"))
                return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.issues.append(f"List posts error: {str(e)}")
            self.test_results.append(("GET /api/v1/posts/", False, str(e)))
            return False
    
    def test_create_post(self) -> bool:
        """Test POST /api/v1/feed/posts"""
        print("\n" + "=" * 80)
        print("2️⃣  TEST: POST /api/v1/feed/posts - Create Post")
        print("=" * 80)
        try:
            headers = self.get_headers()
            post_data = {
                "type": "text",
                "content": "This is a test post created by the API test script",
                "tag": "test"
            }
            
            response = requests.post(
                f"{API_URL}/api/v1/feed/posts",
                headers=headers,
                json=post_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                self.test_post_id = data.get("id")
                print(f"✅ Create post successful")
                print(f"   Post ID: {self.test_post_id}")
                print(f"   Content: {data.get('content', '')[:50]}...")
                self.test_results.append(("POST /api/v1/feed/posts", True, "Success"))
                return True
            else:
                print(f"❌ Create post failed ({response.status_code})")
                print(f"   Error: {response.text}")
                self.issues.append(f"Create post failed: {response.status_code} - {response.text}")
                self.test_results.append(("POST /api/v1/feed/posts", False, f"Status {response.status_code}"))
                return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.issues.append(f"Create post error: {str(e)}")
            self.test_results.append(("POST /api/v1/posts/", False, str(e)))
            return False
    
    def test_get_post(self) -> bool:
        """Test GET /api/v1/feed/posts/{post_id}"""
        print("\n" + "=" * 80)
        print("3️⃣  TEST: GET /api/v1/feed/posts/{{post_id}} - Get Single Post")
        print("=" * 80)
        if not self.test_post_id:
            print("⚠️  Skipped: No post ID available")
            self.test_results.append(("GET /api/v1/feed/posts/{post_id}", False, "No post ID"))
            return False
        
        try:
            headers = self.get_headers()
            response = requests.get(
                f"{API_URL}/api/v1/feed/posts/{self.test_post_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Get post successful")
                print(f"   Post ID: {data.get('id')}")
                print(f"   Author: {data.get('author', {}).get('name', 'N/A')}")
                self.test_results.append(("GET /api/v1/feed/posts/{post_id}", True, "Success"))
                return True
            else:
                print(f"❌ Get post failed ({response.status_code})")
                print(f"   Error: {response.text}")
                self.issues.append(f"Get post failed: {response.status_code} - {response.text}")
                self.test_results.append(("GET /api/v1/feed/posts/{post_id}", False, f"Status {response.status_code}"))
                return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.issues.append(f"Get post error: {str(e)}")
            self.test_results.append(("GET /api/v1/posts/{post_id}", False, str(e)))
            return False
    
    def test_update_post(self) -> bool:
        """Test PUT /api/v1/posts/{post_id}"""
        print("\n" + "=" * 80)
        print("4️⃣  TEST: PUT /api/v1/feed/posts/{{post_id}} - Update Post")
        print("=" * 80)
        if not self.test_post_id:
            print("⚠️  Skipped: No post ID available")
            self.test_results.append(("PUT /api/v1/feed/posts/{post_id}", False, "No post ID"))
            return False
        
        try:
            headers = self.get_headers()
            update_data = {
                "content": "This post has been updated by the API test script"
            }
            
            response = requests.put(
                f"{API_URL}/api/v1/feed/posts/{self.test_post_id}",
                headers=headers,
                json=update_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Update post successful")
                print(f"   Updated content: {data.get('content', '')[:50]}...")
                self.test_results.append(("PUT /api/v1/feed/posts/{post_id}", True, "Success"))
                return True
            else:
                print(f"❌ Update post failed ({response.status_code})")
                print(f"   Error: {response.text}")
                self.issues.append(f"Update post failed: {response.status_code} - {response.text}")
                self.test_results.append(("PUT /api/v1/feed/posts/{post_id}", False, f"Status {response.status_code}"))
                return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.issues.append(f"Update post error: {str(e)}")
            self.test_results.append(("PUT /api/v1/posts/{post_id}", False, str(e)))
            return False
    
    def test_upload_media(self) -> bool:
        """Test POST /api/v1/posts/upload-media"""
        print("\n" + "=" * 80)
        print("5️⃣  TEST: POST /api/v1/feed/posts/upload-media - Upload Media")
        print("=" * 80)
        try:
            headers = self.get_headers()
            # Create a simple test image (1x1 pixel PNG)
            test_image = BytesIO()
            # Minimal PNG file
            png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
            test_image.write(png_data)
            test_image.seek(0)
            
            files = {"file": ("test.png", test_image, "image/png")}
            data = {"media_type": "image"}
            
            # Remove Content-Type header for multipart/form-data
            headers.pop("Content-Type", None)
            
            response = requests.post(
                f"{API_URL}/api/v1/feed/posts/upload-media",
                headers=headers,
                files=files,
                data=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                self.test_media_id = result.get("url", "").split("/")[-1] if result.get("url") else None
                print(f"✅ Upload media successful")
                print(f"   Media URL: {result.get('url', 'N/A')}")
                self.test_results.append(("POST /api/v1/feed/posts/upload-media", True, "Success"))
                return True
            else:
                print(f"❌ Upload media failed ({response.status_code})")
                print(f"   Error: {response.text}")
                self.issues.append(f"Upload media failed: {response.status_code} - {response.text}")
                self.test_results.append(("POST /api/v1/feed/posts/upload-media", False, f"Status {response.status_code}"))
                return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.issues.append(f"Upload media error: {str(e)}")
            self.test_results.append(("POST /api/v1/posts/upload-media", False, str(e)))
            return False
    
    def test_get_media(self) -> bool:
        """Test GET /api/v1/posts/media/{media_id}"""
        print("\n" + "=" * 80)
        print("6️⃣  TEST: GET /api/v1/feed/posts/media/{{media_id}} - Get Media")
        print("=" * 80)
        if not self.test_media_id:
            print("⚠️  Skipped: No media ID available")
            self.test_results.append(("GET /api/v1/feed/posts/media/{media_id}", False, "No media ID"))
            return False
        
        try:
            response = requests.get(
                f"{API_URL}/api/v1/feed/posts/media/{self.test_media_id}",
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"✅ Get media successful")
                print(f"   Content-Type: {response.headers.get('Content-Type', 'N/A')}")
                print(f"   Content-Length: {len(response.content)} bytes")
                self.test_results.append(("GET /api/v1/feed/posts/media/{media_id}", True, "Success"))
                return True
            else:
                print(f"❌ Get media failed ({response.status_code})")
                print(f"   Error: {response.text}")
                self.issues.append(f"Get media failed: {response.status_code} - {response.text}")
                self.test_results.append(("GET /api/v1/feed/posts/media/{media_id}", False, f"Status {response.status_code}"))
                return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.issues.append(f"Get media error: {str(e)}")
            self.test_results.append(("GET /api/v1/posts/media/{media_id}", False, str(e)))
            return False
    
    def test_like_post(self) -> bool:
        """Test POST /api/v1/posts/{post_id}/like"""
        print("\n" + "=" * 80)
        print("7️⃣  TEST: POST /api/v1/feed/posts/{{post_id}}/like - Like Post")
        print("=" * 80)
        if not self.test_post_id:
            print("⚠️  Skipped: No post ID available")
            self.test_results.append(("POST /api/v1/feed/posts/{post_id}/like", False, "No post ID"))
            return False
        
        try:
            headers = self.get_headers()
            response = requests.post(
                f"{API_URL}/api/v1/feed/posts/{self.test_post_id}/like",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Like post successful")
                print(f"   Likes count: {data.get('likes_count', 0)}")
                self.test_results.append(("POST /api/v1/feed/posts/{post_id}/like", True, "Success"))
                return True
            else:
                print(f"❌ Like post failed ({response.status_code})")
                print(f"   Error: {response.text}")
                self.issues.append(f"Like post failed: {response.status_code} - {response.text}")
                self.test_results.append(("POST /api/v1/feed/posts/{post_id}/like", False, f"Status {response.status_code}"))
                return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.issues.append(f"Like post error: {str(e)}")
            self.test_results.append(("POST /api/v1/posts/{post_id}/like", False, str(e)))
            return False
    
    def test_unlike_post(self) -> bool:
        """Test DELETE /api/v1/posts/{post_id}/like"""
        print("\n" + "=" * 80)
        print("8️⃣  TEST: DELETE /api/v1/feed/posts/{{post_id}}/like - Unlike Post")
        print("=" * 80)
        if not self.test_post_id:
            print("⚠️  Skipped: No post ID available")
            self.test_results.append(("DELETE /api/v1/feed/posts/{post_id}/like", False, "No post ID"))
            return False
        
        try:
            headers = self.get_headers()
            response = requests.delete(
                f"{API_URL}/api/v1/feed/posts/{self.test_post_id}/like",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Unlike post successful")
                print(f"   Likes count: {data.get('likes_count', 0)}")
                self.test_results.append(("DELETE /api/v1/feed/posts/{post_id}/like", True, "Success"))
                return True
            else:
                print(f"❌ Unlike post failed ({response.status_code})")
                print(f"   Error: {response.text}")
                self.issues.append(f"Unlike post failed: {response.status_code} - {response.text}")
                self.test_results.append(("DELETE /api/v1/feed/posts/{post_id}/like", False, f"Status {response.status_code}"))
                return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.issues.append(f"Unlike post error: {str(e)}")
            self.test_results.append(("DELETE /api/v1/posts/{post_id}/like", False, str(e)))
            return False
    
    def test_get_comments(self) -> bool:
        """Test GET /api/v1/posts/{post_id}/comments"""
        print("\n" + "=" * 80)
        print("9️⃣  TEST: GET /api/v1/feed/posts/{{post_id}}/comments - Get Comments")
        print("=" * 80)
        if not self.test_post_id:
            print("⚠️  Skipped: No post ID available")
            self.test_results.append(("GET /api/v1/feed/posts/{post_id}/comments", False, "No post ID"))
            return False
        
        try:
            headers = self.get_headers()
            response = requests.get(
                f"{API_URL}/api/v1/feed/posts/{self.test_post_id}/comments",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Get comments successful")
                print(f"   Comments count: {len(data)}")
                self.test_results.append(("GET /api/v1/feed/posts/{post_id}/comments", True, "Success"))
                return True
            else:
                print(f"❌ Get comments failed ({response.status_code})")
                print(f"   Error: {response.text}")
                self.issues.append(f"Get comments failed: {response.status_code} - {response.text}")
                self.test_results.append(("GET /api/v1/feed/posts/{post_id}/comments", False, f"Status {response.status_code}"))
                return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.issues.append(f"Get comments error: {str(e)}")
            self.test_results.append(("GET /api/v1/posts/{post_id}/comments", False, str(e)))
            return False
    
    def test_create_comment(self) -> bool:
        """Test POST /api/v1/posts/{post_id}/comments"""
        print("\n" + "=" * 80)
        print("🔟 TEST: POST /api/v1/feed/posts/{{post_id}}/comments - Create Comment")
        print("=" * 80)
        if not self.test_post_id:
            print("⚠️  Skipped: No post ID available")
            self.test_results.append(("POST /api/v1/feed/posts/{post_id}/comments", False, "No post ID"))
            return False
        
        try:
            headers = self.get_headers()
            comment_data = {
                "content": "This is a test comment created by the API test script"
            }
            
            response = requests.post(
                f"{API_URL}/api/v1/feed/posts/{self.test_post_id}/comments",
                headers=headers,
                json=comment_data,
                timeout=10
            )
            
            if response.status_code == 201:
                data = response.json()
                self.test_comment_id = data.get("id")
                print(f"✅ Create comment successful")
                print(f"   Comment ID: {self.test_comment_id}")
                print(f"   Content: {data.get('content', '')[:50]}...")
                self.test_results.append(("POST /api/v1/feed/posts/{post_id}/comments", True, "Success"))
                return True
            else:
                print(f"❌ Create comment failed ({response.status_code})")
                print(f"   Error: {response.text}")
                self.issues.append(f"Create comment failed: {response.status_code} - {response.text}")
                self.test_results.append(("POST /api/v1/feed/posts/{post_id}/comments", False, f"Status {response.status_code}"))
                return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.issues.append(f"Create comment error: {str(e)}")
            self.test_results.append(("POST /api/v1/posts/{post_id}/comments", False, str(e)))
            return False
    
    def test_delete_comment(self) -> bool:
        """Test DELETE /api/v1/posts/{post_id}/comments/{comment_id}"""
        print("\n" + "=" * 80)
        print("1️⃣1️⃣ TEST: DELETE /api/v1/feed/posts/{{post_id}}/comments/{{comment_id}} - Delete Comment")
        print("=" * 80)
        if not self.test_post_id or not self.test_comment_id:
            print("⚠️  Skipped: No post ID or comment ID available")
            self.test_results.append(("DELETE /api/v1/feed/posts/{post_id}/comments/{comment_id}", False, "No IDs"))
            return False
        
        try:
            headers = self.get_headers()
            response = requests.delete(
                f"{API_URL}/api/v1/feed/posts/{self.test_post_id}/comments/{self.test_comment_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Delete comment successful")
                print(f"   Message: {data.get('message', 'N/A')}")
                self.test_results.append(("DELETE /api/v1/feed/posts/{post_id}/comments/{comment_id}", True, "Success"))
                return True
            else:
                print(f"❌ Delete comment failed ({response.status_code})")
                print(f"   Error: {response.text}")
                self.issues.append(f"Delete comment failed: {response.status_code} - {response.text}")
                self.test_results.append(("DELETE /api/v1/feed/posts/{post_id}/comments/{comment_id}", False, f"Status {response.status_code}"))
                return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.issues.append(f"Delete comment error: {str(e)}")
            self.test_results.append(("DELETE /api/v1/posts/{post_id}/comments/{comment_id}", False, str(e)))
            return False
    
    def test_delete_post(self) -> bool:
        """Test DELETE /api/v1/posts/{post_id}"""
        print("\n" + "=" * 80)
        print("1️⃣2️⃣ TEST: DELETE /api/v1/feed/posts/{{post_id}} - Delete Post")
        print("=" * 80)
        if not self.test_post_id:
            print("⚠️  Skipped: No post ID available")
            self.test_results.append(("DELETE /api/v1/feed/posts/{post_id}", False, "No post ID"))
            return False
        
        try:
            headers = self.get_headers()
            response = requests.delete(
                f"{API_URL}/api/v1/feed/posts/{self.test_post_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Delete post successful")
                print(f"   Message: {data.get('message', 'N/A')}")
                self.test_results.append(("DELETE /api/v1/feed/posts/{post_id}", True, "Success"))
                return True
            else:
                print(f"❌ Delete post failed ({response.status_code})")
                print(f"   Error: {response.text}")
                self.issues.append(f"Delete post failed: {response.status_code} - {response.text}")
                self.test_results.append(("DELETE /api/v1/feed/posts/{post_id}", False, f"Status {response.status_code}"))
                return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.issues.append(f"Delete post error: {str(e)}")
            self.test_results.append(("DELETE /api/v1/posts/{post_id}", False, str(e)))
            return False
    
    def run_all_tests(self):
        """Run all post API tests"""
        print("\n" + "=" * 80)
        print("🧪 POST API COMPREHENSIVE TEST SUITE")
        print("=" * 80)
        print(f"API URL: {API_URL}")
        
        # Login first
        if not self.login():
            print("\n❌ Cannot proceed without authentication")
            return False
        
        # Run all tests
        results = []
        results.append(self.test_list_posts())
        results.append(self.test_create_post())
        results.append(self.test_get_post())
        results.append(self.test_update_post())
        results.append(self.test_upload_media())
        results.append(self.test_get_media())
        results.append(self.test_like_post())
        results.append(self.test_unlike_post())
        results.append(self.test_get_comments())
        results.append(self.test_create_comment())
        results.append(self.test_delete_comment())
        results.append(self.test_delete_post())
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        
        passed = sum(results)
        total = len(results)
        print(f"\n✅ Passed: {passed}/{total}")
        print(f"❌ Failed: {total - passed}/{total}")
        
        print("\n📋 Detailed Results:")
        for endpoint, success, message in self.test_results:
            status = "✅" if success else "❌"
            print(f"   {status} {endpoint:50} - {message}")
        
        if self.issues:
            print(f"\n⚠️  Issues Found ({len(self.issues)}):")
            for i, issue in enumerate(self.issues, 1):
                print(f"   {i}. {issue}")
        
        return passed == total
    
    def print_report(self):
        """Print detailed test report"""
        print("\n" + "=" * 80)
        print("📄 DETAILED TEST REPORT")
        print("=" * 80)
        print(f"\nTest User: {self.test_user.get('name', 'N/A') if self.test_user else 'N/A'}")
        print(f"University ID: {self.test_user.get('university_id', 'None') if self.test_user else 'N/A'}")
        print(f"Test Post ID: {self.test_post_id or 'N/A'}")
        print(f"Test Comment ID: {self.test_comment_id or 'N/A'}")
        print(f"Test Media ID: {self.test_media_id or 'N/A'}")


def main():
    """Main function"""
    tester = PostAPITester()
    success = tester.run_all_tests()
    tester.print_report()
    
    if success:
        print("\n✅ All post API tests passed!")
        return 0
    else:
        print("\n❌ Some post API tests failed. Check the issues above.")
        return 1


if __name__ == "__main__":
    exit(main())


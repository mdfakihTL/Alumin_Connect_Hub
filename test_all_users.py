#!/usr/bin/env python3
"""
Comprehensive test script to verify all user profiles are active and working
"""
import sys
import requests
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import verify_password

# Default test users
TEST_USERS = [
    {"username": "superadmin", "password": "superadmin123", "role": "super_admin", "email": "superadmin@alumni-portal.com"},
    {"username": "university", "password": "university123", "role": "university_admin", "email": "university@alumni-portal.com"},
    {"username": "alumni", "password": "alumni123", "role": "alumni", "email": "alumni@example.com"},
]

API_URL = "http://localhost:8000"


def check_database_users():
    """Check all users in database"""
    print("=" * 80)
    print("📊 Checking Database Users")
    print("=" * 80)
    print()
    
    db = SessionLocal()
    try:
        users = db.query(User).order_by(User.id).all()
        
        if not users:
            print("❌ No users found in database")
            return False
        
        print(f"Found {len(users)} user(s) in database:\n")
        print(f"{'ID':<5} {'Email':<40} {'Username':<20} {'Role':<20} {'Active':<10} {'Verified':<10}")
        print("-" * 105)
        
        all_active = True
        all_verified = True
        
        for user in users:
            active_icon = "✅" if user.is_active else "❌"
            verified_icon = "✅" if user.is_verified else "❌"
            
            if not user.is_active:
                all_active = False
            if not user.is_verified:
                all_verified = False
            
            print(f"{user.id:<5} {user.email:<40} {user.username:<20} {user.role.value:<20} {active_icon:<10} {verified_icon:<10}")
        
        print()
        print(f"Summary:")
        active_count = sum(1 for u in users if u.is_active)
        verified_count = sum(1 for u in users if u.is_verified)
        print(f"  ✅ Active users: {active_count}/{len(users)}")
        print(f"  ✅ Verified users: {verified_count}/{len(users)}")
        
        if all_active and all_verified:
            print("\n✅ All users are active and verified in database!")
            return True
        else:
            print("\n⚠️  Some users are not active or verified")
            return False
            
    except Exception as e:
        print(f"❌ Error checking database: {str(e)}")
        return False
    finally:
        db.close()


def test_password_verification():
    """Test password verification for all users"""
    print("\n" + "=" * 80)
    print("🔐 Testing Password Verification")
    print("=" * 80)
    print()
    
    db = SessionLocal()
    try:
        all_pass = True
        
        for test_user in TEST_USERS:
            user = db.query(User).filter(User.username == test_user['username']).first()
            
            if not user:
                print(f"❌ {test_user['username']:20} - User not found")
                all_pass = False
                continue
            
            if verify_password(test_user['password'], user.hashed_password):
                print(f"✅ {test_user['username']:20} - Password verified")
            else:
                print(f"❌ {test_user['username']:20} - Password verification failed")
                all_pass = False
        
        if all_pass:
            print("\n✅ All passwords are correctly hashed and verifiable!")
            return True
        else:
            print("\n❌ Some password verifications failed")
            return False
            
    except Exception as e:
        print(f"❌ Error testing passwords: {str(e)}")
        return False
    finally:
        db.close()


def test_api_login():
    """Test login via API"""
    print("\n" + "=" * 80)
    print("🌐 Testing API Login")
    print("=" * 80)
    print()
    
    # Check if server is running
    try:
        health = requests.get(f"{API_URL}/health", timeout=5)
        if health.status_code != 200:
            print(f"❌ Server health check failed")
            print(f"   Make sure server is running: uvicorn app.main:app --reload")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ Cannot connect to server at {API_URL}")
        print(f"   Make sure server is running: uvicorn app.main:app --reload")
        return False
    
    print(f"✅ Server is running at {API_URL}\n")
    
    all_pass = True
    
    for test_user in TEST_USERS:
        print(f"Testing: {test_user['username']} ({test_user['role']})")
        
        try:
            response = requests.post(
                f"{API_URL}/api/v1/auth/login",
                json={
                    "username": test_user['username'],
                    "password": test_user['password']
                },
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"  ✅ Login successful")
                print(f"     Token: {data.get('access_token', 'N/A')[:50]}...")
                
                # Test /auth/me endpoint
                headers = {"Authorization": f"Bearer {data.get('access_token')}"}
                me_response = requests.get(f"{API_URL}/api/v1/auth/me", headers=headers, timeout=5)
                
                if me_response.status_code == 200:
                    me_data = me_response.json()
                    print(f"  ✅ /auth/me successful")
                    print(f"     Email: {me_data.get('email')}")
                    print(f"     Role: {me_data.get('role')}")
                else:
                    print(f"  ⚠️  /auth/me failed ({me_response.status_code})")
                    
            else:
                print(f"  ❌ Login failed ({response.status_code})")
                print(f"     Error: {response.text[:100]}")
                all_pass = False
                
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            all_pass = False
        
        print()
    
    if all_pass:
        print("✅ All API logins successful!")
        return True
    else:
        print("❌ Some API logins failed")
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 80)
    print("🧪 Comprehensive User Profile Test")
    print("=" * 80)
    print()
    
    results = {
        "database": False,
        "passwords": False,
        "api": False
    }
    
    # Test 1: Database check
    results["database"] = check_database_users()
    
    # Test 2: Password verification
    results["passwords"] = test_password_verification()
    
    # Test 3: API login
    results["api"] = test_api_login()
    
    # Final summary
    print("\n" + "=" * 80)
    print("📊 Final Summary")
    print("=" * 80)
    print()
    
    for test_name, result in results.items():
        icon = "✅" if result else "❌"
        status = "PASS" if result else "FAIL"
        print(f"{icon} {test_name.upper():20} - {status}")
    
    print()
    
    if all(results.values()):
        print("🎉 All tests passed! All user profiles are active and working!")
        return 0
    else:
        print("⚠️  Some tests failed. Check the output above for details.")
        return 1


if __name__ == "__main__":
    sys.exit(main())


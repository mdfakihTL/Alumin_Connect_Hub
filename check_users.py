#!/usr/bin/env python3
"""
Script to check all user profiles and their active status
"""
import sys
from sqlalchemy import text
from app.db.session import sync_engine, SessionLocal
from app.models.user import User, UserRole
from app.core.logging import logger


def check_all_users():
    """Check all users and their status"""
    db = SessionLocal()
    try:
        # Get all users
        users = db.query(User).order_by(User.id).all()
        
        if not users:
            print("❌ No users found in database")
            return
        
        print(f"\n📊 Found {len(users)} user(s) in database:\n")
        print("=" * 100)
        print(f"{'ID':<5} {'Email':<35} {'Username':<20} {'Role':<20} {'Active':<10} {'Verified':<10}")
        print("=" * 100)
        
        active_count = 0
        verified_count = 0
        
        for user in users:
            active_status = "✅ Yes" if user.is_active else "❌ No"
            verified_status = "✅ Yes" if user.is_verified else "❌ No"
            
            if user.is_active:
                active_count += 1
            if user.is_verified:
                verified_count += 1
            
            print(f"{user.id:<5} {user.email:<35} {user.username:<20} {user.role.value:<20} {active_status:<10} {verified_status:<10}")
        
        print("=" * 100)
        print(f"\n📈 Summary:")
        print(f"   Total users: {len(users)}")
        print(f"   Active users: {active_count} ✅")
        print(f"   Inactive users: {len(users) - active_count} ❌")
        print(f"   Verified users: {verified_count} ✅")
        print(f"   Unverified users: {len(users) - verified_count} ❌")
        
        # Check by role
        print(f"\n👥 Users by Role:")
        for role in UserRole:
            role_users = [u for u in users if u.role == role]
            active_role = [u for u in role_users if u.is_active]
            print(f"   {role.value}: {len(role_users)} total, {len(active_role)} active")
        
        # Check for issues
        print(f"\n🔍 Status Check:")
        issues = []
        
        if active_count == 0:
            issues.append("⚠️  No active users found!")
        
        inactive_users = [u for u in users if not u.is_active]
        if inactive_users:
            issues.append(f"⚠️  {len(inactive_users)} user(s) are inactive:")
            for u in inactive_users:
                issues.append(f"      - {u.email} ({u.username})")
        
        unverified_users = [u for u in users if not u.is_verified]
        if unverified_users:
            issues.append(f"⚠️  {len(unverified_users)} user(s) are not verified:")
            for u in unverified_users:
                issues.append(f"      - {u.email} ({u.username})")
        
        if not issues:
            print("   ✅ All users are active and verified!")
        else:
            for issue in issues:
                print(f"   {issue}")
        
        print()
        
    except Exception as e:
        logger.error(f"Error checking users: {str(e)}")
        print(f"❌ Error: {str(e)}")
        sys.exit(1)
    finally:
        db.close()


def test_user_login(username: str, password: str):
    """Test if a user can login"""
    from app.core.security import verify_password
    from app.db.session import SessionLocal
    
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"❌ User '{username}' not found")
            return False
        
        if not user.is_active:
            print(f"❌ User '{username}' is inactive")
            return False
        
        # Note: We can't verify password without the actual password
        # This just checks if user exists and is active
        print(f"✅ User '{username}' exists and is active")
        print(f"   Email: {user.email}")
        print(f"   Role: {user.role.value}")
        print(f"   Verified: {'Yes' if user.is_verified else 'No'}")
        return True
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Check user profiles and status")
    parser.add_argument("--test-login", type=str, help="Test if a specific username exists and is active")
    args = parser.parse_args()
    
    if args.test_login:
        test_user_login(args.test_login, "")
    else:
        check_all_users()


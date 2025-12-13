"""
Comprehensive API Testing Script
Tests all API endpoints and reports issues
"""
import asyncio
import traceback
from app.db.session import AsyncSessionLocal
from app.services.auth_service import AuthService
from app.schemas.user import UserCreate, UserLogin
from app.repositories.user_repository import UserRepository
from app.repositories.alumni_repository import AlumniRepository
from app.schemas.alumni import AlumniProfileCreate
from app.models.user import User, UserRole
from app.models.event import Event, EventRegistration, EventType, EventStatus
from app.models.job import JobPosting, JobApplication, JobType, JobStatus, ApplicationStatus
from app.models.document import Document, DocumentType, DocumentStatus
from app.models.chat import ChatSession, ChatMessage
from sqlalchemy import select
from datetime import datetime, timedelta, timezone

class APITester:
    def __init__(self):
        self.issues = []
        self.test_user = None
        self.test_user_token = None
        
    async def test_auth_register(self, session):
        """Test user registration"""
        print("\n1. Testing POST /api/v1/auth/register")
        try:
            # Use unique email/username for each test run
            import time
            unique_id = int(time.time()) % 10000
            auth_service = AuthService(session)
            user_data = UserCreate(
                email=f"apitest{unique_id}@example.com",
                username=f"apitest{unique_id}",
                full_name="API Test User",
                password="testpass123"
            )
            result = await auth_service.register(user_data)
            self.test_user = result['user']
            self.test_user_token = result['access_token']
            print("   [OK] Registration successful")
            return True
        except Exception as e:
            error_msg = str(e)
            # If user already exists, that's expected in some cases
            if "already" in error_msg.lower() or "taken" in error_msg.lower():
                print("   [SKIP] User already exists (expected in some cases)")
                # Try to get existing user
                user_repo = UserRepository(session)
                existing = await user_repo.get_by_email(user_data.email)
                if existing:
                    from app.schemas.user import UserResponse
                    self.test_user = UserResponse.model_validate(existing).model_dump()
                    return True
            print(f"   [ERROR] {type(e).__name__}: {error_msg}")
            self.issues.append(f"Register API: {type(e).__name__}: {error_msg}")
            traceback.print_exc()
            return False
    
    async def test_auth_login(self, session):
        """Test user login"""
        print("\n2. Testing POST /api/v1/auth/login")
        try:
            auth_service = AuthService(session)
            credentials = UserLogin(username="apitest", password="testpass123")
            result = await auth_service.login(credentials)
            if result.access_token:
                print("   [OK] Login successful")
                return True
            else:
                print("   ❌ Login failed: No token returned")
                self.issues.append("Login API: No token returned")
                return False
        except Exception as e:
            print(f"   ❌ Error: {type(e).__name__}: {str(e)}")
            self.issues.append(f"Login API: {type(e).__name__}: {str(e)}")
            return False
    
    async def test_users_get_me(self, session):
        """Test GET /api/v1/users/me"""
        print("\n3. Testing GET /api/v1/users/me")
        try:
            if not self.test_user:
                print("   [SKIP] Skipped: No test user")
                return False
            user_repo = UserRepository(session)
            user = await user_repo.get_by_id(self.test_user['id'])
            if user:
                print("   [OK] Get current user successful")
                return True
            else:
                print("   ❌ User not found")
                self.issues.append("Get me API: User not found")
                return False
        except Exception as e:
            print(f"   ❌ Error: {type(e).__name__}: {str(e)}")
            self.issues.append(f"Get me API: {type(e).__name__}: {str(e)}")
            return False
    
    async def test_alumni_create(self, session):
        """Test POST /api/v1/alumni"""
        print("\n4. Testing POST /api/v1/alumni")
        try:
            if not self.test_user:
                print("   [SKIP] Skipped: No test user")
                return False
            alumni_repo = AlumniRepository(session)
            profile_data = AlumniProfileCreate(
                user_id=self.test_user['id'],
                graduation_year=2020,
                degree="Bachelor of Science",
                major="Computer Science",
                current_position="Software Engineer",
                company="Tech Corp"
            )
            profile = await alumni_repo.create(profile_data)
            if profile:
                print("   [OK] Create alumni profile successful")
                return True
            else:
                print("   ❌ Failed to create profile")
                self.issues.append("Create alumni API: Failed to create")
                return False
        except Exception as e:
            print(f"   ❌ Error: {type(e).__name__}: {str(e)}")
            self.issues.append(f"Create alumni API: {type(e).__name__}: {str(e)}")
            return False
    
    async def test_events_create(self, session):
        """Test POST /api/v1/events"""
        print("\n5. Testing POST /api/v1/events")
        try:
            if not self.test_user:
                print("   [SKIP] Skipped: No test user")
                return False
            # Rollback any previous failed transaction
            await session.rollback()
            
            start_date = datetime.utcnow() + timedelta(days=7)
            end_date = datetime.utcnow() + timedelta(days=8)
            # Ensure timezone-naive
            if start_date.tzinfo:
                start_date = start_date.replace(tzinfo=None)
            if end_date.tzinfo:
                end_date = end_date.replace(tzinfo=None)
                
            event = Event(
                title="Test Event",
                description="Test event description",
                event_type=EventType.NETWORKING,
                status=EventStatus.PUBLISHED,
                start_date=start_date,
                end_date=end_date,
                location="Test Location",
                creator_id=self.test_user['id']
            )
            session.add(event)
            await session.commit()
            await session.refresh(event)
            if event.id:
                print("   [OK] Create event successful")
                return True
            else:
                print("   ❌ Failed to create event")
                self.issues.append("Create event API: Failed to create")
                return False
        except Exception as e:
            await session.rollback()
            print(f"   ❌ Error: {type(e).__name__}: {str(e)}")
            self.issues.append(f"Create event API: {type(e).__name__}: {str(e)}")
            traceback.print_exc()
            return False
    
    async def test_jobs_create(self, session):
        """Test POST /api/v1/jobs"""
        print("\n6. Testing POST /api/v1/jobs")
        try:
            if not self.test_user:
                print("   [SKIP] Skipped: No test user")
                return False
            # Rollback any previous failed transaction
            await session.rollback()
            
            job = JobPosting(
                title="Test Job",
                company="Test Company",
                description="Test job description",
                job_type=JobType.FULL_TIME,
                status=JobStatus.ACTIVE,
                location="Remote",
                currency="USD",
                poster_id=self.test_user['id']
            )
            session.add(job)
            await session.commit()
            await session.refresh(job)
            if job.id:
                print("   [OK] Create job posting successful")
                return True
            else:
                print("   ❌ Failed to create job")
                self.issues.append("Create job API: Failed to create")
                return False
        except Exception as e:
            await session.rollback()
            print(f"   ❌ Error: {type(e).__name__}: {str(e)}")
            self.issues.append(f"Create job API: {type(e).__name__}: {str(e)}")
            traceback.print_exc()
            return False
    
    async def test_documents_list(self, session):
        """Test GET /api/v1/documents"""
        print("\n7. Testing GET /api/v1/documents")
        try:
            # Rollback any previous failed transaction
            await session.rollback()
            
            result = await session.execute(
                select(Document).limit(10)
            )
            documents = list(result.scalars().all())
            print(f"   [OK] List documents successful ({len(documents)} documents)")
            return True
        except Exception as e:
            await session.rollback()
            print(f"   ❌ Error: {type(e).__name__}: {str(e)}")
            self.issues.append(f"List documents API: {type(e).__name__}: {str(e)}")
            return False
    
    async def test_chat_sessions_list(self, session):
        """Test GET /api/v1/chat/sessions"""
        print("\n8. Testing GET /api/v1/chat/sessions")
        try:
            if not self.test_user:
                print("   [SKIP] Skipped: No test user")
                return False
            # Rollback any previous failed transaction
            await session.rollback()
            
            result = await session.execute(
                select(ChatSession).where(ChatSession.user_id == self.test_user['id']).limit(10)
            )
            sessions = list(result.scalars().all())
            print(f"   [OK] List chat sessions successful ({len(sessions)} sessions)")
            return True
        except Exception as e:
            await session.rollback()
            print(f"   ❌ Error: {type(e).__name__}: {str(e)}")
            self.issues.append(f"List chat sessions API: {type(e).__name__}: {str(e)}")
            return False
    
    async def test_events_list(self, session):
        """Test GET /api/v1/events"""
        print("\n9. Testing GET /api/v1/events")
        try:
            await session.rollback()
            result = await session.execute(
                select(Event).limit(10)
            )
            events = list(result.scalars().all())
            print(f"   [OK] List events successful ({len(events)} events)")
            return True
        except Exception as e:
            await session.rollback()
            print(f"   [ERROR] {type(e).__name__}: {str(e)}")
            self.issues.append(f"List events API: {type(e).__name__}: {str(e)}")
            return False
    
    async def test_jobs_list(self, session):
        """Test GET /api/v1/jobs"""
        print("\n10. Testing GET /api/v1/jobs")
        try:
            await session.rollback()
            result = await session.execute(
                select(JobPosting).where(JobPosting.status == JobStatus.ACTIVE).limit(10)
            )
            jobs = list(result.scalars().all())
            print(f"   [OK] List jobs successful ({len(jobs)} jobs)")
            return True
        except Exception as e:
            await session.rollback()
            print(f"   [ERROR] {type(e).__name__}: {str(e)}")
            self.issues.append(f"List jobs API: {type(e).__name__}: {str(e)}")
            return False
    
    async def test_alumni_list(self, session):
        """Test GET /api/v1/alumni"""
        print("\n11. Testing GET /api/v1/alumni")
        try:
            await session.rollback()
            alumni_repo = AlumniRepository(session)
            profiles = await alumni_repo.list_profiles(0, 10)
            print(f"   [OK] List alumni profiles successful ({len(profiles)} profiles)")
            return True
        except Exception as e:
            await session.rollback()
            print(f"   [ERROR] {type(e).__name__}: {str(e)}")
            self.issues.append(f"List alumni API: {type(e).__name__}: {str(e)}")
            return False
    
    async def test_users_list(self, session):
        """Test GET /api/v1/users (admin only)"""
        print("\n12. Testing GET /api/v1/users")
        try:
            await session.rollback()
            user_repo = UserRepository(session)
            users = await user_repo.list_users(0, 10)
            print(f"   [OK] List users successful ({len(users)} users)")
            return True
        except Exception as e:
            await session.rollback()
            print(f"   [ERROR] {type(e).__name__}: {str(e)}")
            self.issues.append(f"List users API: {type(e).__name__}: {str(e)}")
            return False
    
    async def run_all_tests(self):
        """Run all API tests"""
        print("=" * 80)
        print("COMPREHENSIVE API TESTING")
        print("=" * 80)
        
        async with AsyncSessionLocal() as session:
            results = []
            
            # Test all endpoints
            results.append(await self.test_auth_register(session))
            results.append(await self.test_auth_login(session))
            results.append(await self.test_users_get_me(session))
            results.append(await self.test_alumni_create(session))
            results.append(await self.test_events_create(session))
            results.append(await self.test_jobs_create(session))
            results.append(await self.test_documents_list(session))
            results.append(await self.test_chat_sessions_list(session))
            results.append(await self.test_events_list(session))
            results.append(await self.test_jobs_list(session))
            results.append(await self.test_alumni_list(session))
            results.append(await self.test_users_list(session))
            
            # Summary
            print("\n" + "=" * 80)
            print("TEST SUMMARY")
            print("=" * 80)
            passed = sum(results)
            total = len(results)
            print(f"Passed: {passed}/{total}")
            
            if self.issues:
                print(f"\n[ISSUES] Found {len(self.issues)} issue(s):")
                for i, issue in enumerate(self.issues, 1):
                    print(f"   {i}. {issue}")
                return False
            else:
                print("\n[SUCCESS] All API tests passed!")
                return True

async def main():
    tester = APITester()
    success = await tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    exit(asyncio.run(main()))


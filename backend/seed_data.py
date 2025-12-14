"""
Seed Data Script for Alumni Connect Hub
Run this script to populate the database with initial test data.
Usage: python seed_data.py
"""

import os
import sys
from datetime import datetime, timedelta
import json

# Add the app directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, create_tables
from app.core.security import get_password_hash
from app.models.user import User, UserProfile, UserRole
from app.models.university import University
from app.models.post import Post, PostType, Comment, Like
from app.models.event import Event, EventRegistration
from app.models.group import Group, GroupMember, GroupMessage
from app.models.connection import Connection, ConnectionRequest, ConnectionStatus
from app.models.message import Conversation, Message
from app.models.support import SupportTicket, TicketResponse, TicketStatus, TicketPriority, TicketCategory
from app.models.notification import Notification, NotificationType
from app.models.fundraiser import Fundraiser
from app.models.ad import Ad
from app.models.mentor import Mentor
from app.models.lead_intelligence import AdClick, AdImpression, CareerRoadmapRequest, CareerRoadmapView


def seed_universities(db: Session):
    """Create sample universities with branding colors."""
    universities = [
        {
            "id": "mit",
            "name": "Massachusetts Institute of Technology",
            "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/1200px-MIT_logo.svg.png",
            "colors": json.dumps({
                "light": {"primary": "#A31F34", "secondary": "#8A8B8C", "accent": "#000000"},
                "dark": {"primary": "#A31F34", "secondary": "#C2C3C4", "accent": "#FFFFFF"}
            }),
            "is_enabled": True
        },
        {
            "id": "stanford",
            "name": "Stanford University",
            "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Stanford_Cardinal_logo.svg/1200px-Stanford_Cardinal_logo.svg.png",
            "colors": json.dumps({
                "light": {"primary": "#8C1515", "secondary": "#4D4F53", "accent": "#007C92"},
                "dark": {"primary": "#8C1515", "secondary": "#B1B3B3", "accent": "#53868B"}
            }),
            "is_enabled": True
        },
        {
            "id": "harvard",
            "name": "Harvard University",
            "logo": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Harvard_University_logo.svg/1200px-Harvard_University_logo.svg.png",
            "colors": json.dumps({
                "light": {"primary": "#A51C30", "secondary": "#1E1E1E", "accent": "#C1A370"},
                "dark": {"primary": "#A51C30", "secondary": "#E0E0E0", "accent": "#C1A370"}
            }),
            "is_enabled": True
        }
    ]
    
    for uni_data in universities:
        existing = db.query(University).filter(University.id == uni_data["id"]).first()
        if not existing:
            uni = University(**uni_data)
            db.add(uni)
    
    db.commit()
    print(f"✓ Created {len(universities)} universities")


def seed_users(db: Session):
    """Create sample users with different roles."""
    users_data = [
        # Super Admin
        {
            "email": "superadmin@alumni.connect",
            "name": "Super Administrator",
            "role": UserRole.SUPERADMIN,
            "university_id": None,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=superadmin"
        },
        # MIT Admin
        {
            "email": "admin@mit.edu",
            "name": "MIT Admin",
            "role": UserRole.ADMIN,
            "university_id": "mit",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=mitadmin"
        },
        # Stanford Admin
        {
            "email": "admin@stanford.edu",
            "name": "Stanford Admin",
            "role": UserRole.ADMIN,
            "university_id": "stanford",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=stanfordadmin"
        },
        # MIT Alumni
        {
            "email": "john.doe@alumni.mit.edu",
            "name": "John Doe",
            "role": UserRole.ALUMNI,
            "university_id": "mit",
            "graduation_year": 2020,
            "major": "Computer Science",
            "is_mentor": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=johndoe"
        },
        {
            "email": "jane.smith@alumni.mit.edu",
            "name": "Jane Smith",
            "role": UserRole.ALUMNI,
            "university_id": "mit",
            "graduation_year": 2019,
            "major": "Electrical Engineering",
            "is_mentor": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=janesmith"
        },
        {
            "email": "bob.wilson@alumni.mit.edu",
            "name": "Bob Wilson",
            "role": UserRole.ALUMNI,
            "university_id": "mit",
            "graduation_year": 2021,
            "major": "Mechanical Engineering",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=bobwilson"
        },
        # Stanford Alumni
        {
            "email": "alice.johnson@alumni.stanford.edu",
            "name": "Alice Johnson",
            "role": UserRole.ALUMNI,
            "university_id": "stanford",
            "graduation_year": 2018,
            "major": "Business Administration",
            "is_mentor": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=alicejohnson"
        },
        {
            "email": "charlie.brown@alumni.stanford.edu",
            "name": "Charlie Brown",
            "role": UserRole.ALUMNI,
            "university_id": "stanford",
            "graduation_year": 2020,
            "major": "Data Science",
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=charliebrown"
        },
        {
            "email": "david.lee@alumni.stanford.edu",
            "name": "David Lee",
            "role": UserRole.ALUMNI,
            "university_id": "stanford",
            "graduation_year": 2019,
            "major": "Medicine",
            "is_mentor": True,
            "avatar": "https://api.dicebear.com/7.x/avataaars/svg?seed=davidlee"
        }
    ]
    
    created_users = []
    for user_data in users_data:
        existing = db.query(User).filter(User.email == user_data["email"]).first()
        if not existing:
            # Generate username from email for database compatibility
            username = user_data["email"].split('@')[0] if user_data["email"] else None
            
            user = User(
                email=user_data["email"],
                username=username,  # Set username for database compatibility
                hashed_password=get_password_hash("password123"),
                name=user_data["name"],
                role=user_data["role"],
                university_id=user_data.get("university_id"),
                graduation_year=user_data.get("graduation_year"),
                major=user_data.get("major"),
                is_mentor=user_data.get("is_mentor", False),
                avatar=user_data.get("avatar")
            )
            db.add(user)
            db.flush()
            
            # Create profile for alumni
            if user.role == UserRole.ALUMNI:
                profile = UserProfile(
                    user_id=user.id,
                    bio=f"Alumni of {user.major}" if user.major else "Alumni",
                    job_title="Software Engineer" if user.major == "Computer Science" else "Professional",
                    company="Tech Company",
                    location="San Francisco, CA"
                )
                db.add(profile)
            
            created_users.append(user)
    
    db.commit()
    print(f"✓ Created {len(created_users)} users")
    return created_users


def seed_posts(db: Session):
    """Create sample posts."""
    # Get some users
    users = db.query(User).filter(User.role == UserRole.ALUMNI).limit(5).all()
    
    if not users:
        print("⚠ No users found for posts")
        return
    
    posts_data = [
        {
            "type": PostType.TEXT,
            "content": "Just started my new role as a Senior Software Engineer at Google! Excited for this new chapter. 🎉",
            "tag": "career-milestone"
        },
        {
            "type": PostType.IMAGE,
            "content": "Throwback to our graduation day! Can't believe it's been years already.",
            "media_url": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800"
        },
        {
            "type": PostType.JOB,
            "content": "We're hiring! Looking for talented engineers to join our team.",
            "job_title": "Full Stack Developer",
            "company": "TechStartup Inc",
            "location": "Remote"
        },
        {
            "type": PostType.TEXT,
            "content": "Just completed my MBA while working full-time. Hard work pays off!",
            "tag": "achievement"
        },
        {
            "type": PostType.TEXT,
            "content": "Volunteered at the local food bank today with fellow alumni. Great to give back to the community!",
            "tag": "volunteering"
        },
        {
            "type": PostType.ANNOUNCEMENT,
            "content": "Don't forget to register for the Annual Alumni Reunion next month! See you all there."
        }
    ]
    
    for i, post_data in enumerate(posts_data):
        user = users[i % len(users)]
        post = Post(
            author_id=user.id,
            university_id=user.university_id,
            **post_data
        )
        db.add(post)
    
    db.commit()
    print(f"✓ Created {len(posts_data)} posts")


def seed_events(db: Session):
    """Create sample events."""
    universities = db.query(University).all()
    users = db.query(User).filter(User.role.in_([UserRole.ALUMNI, UserRole.ADMIN])).all()
    
    if not universities or not users:
        print("⚠ No universities or users found for events")
        return
    
    events_data = [
        {
            "title": "Annual Alumni Reunion 2024",
            "description": "Join us for the biggest alumni gathering of the year! Network, reconnect, and celebrate.",
            "event_date": "Dec 15, 2024",
            "event_time": "6:00 PM",
            "location": "Main Campus Auditorium",
            "category": "networking",
            "image": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800"
        },
        {
            "title": "Tech Industry Panel Discussion",
            "description": "Hear from industry leaders about the future of technology and career opportunities.",
            "event_date": "Dec 20, 2024",
            "event_time": "2:00 PM",
            "location": "Virtual",
            "is_virtual": True,
            "meeting_link": "https://zoom.us/j/123456789",
            "category": "career"
        },
        {
            "title": "Startup Pitch Night",
            "description": "Watch alumni entrepreneurs pitch their startups to investors.",
            "event_date": "Jan 10, 2025",
            "event_time": "7:00 PM",
            "location": "Innovation Hub",
            "category": "entrepreneurship"
        },
        {
            "title": "Alumni Mentorship Mixer",
            "description": "Connect with mentors and mentees in an informal setting.",
            "event_date": "Jan 15, 2025",
            "event_time": "5:30 PM",
            "location": "Alumni Center",
            "category": "mentorship"
        }
    ]
    
    for i, event_data in enumerate(events_data):
        uni = universities[i % len(universities)]
        organizer = users[i % len(users)]
        
        event = Event(
            university_id=uni.id,
            organizer_id=organizer.id,
            **event_data
        )
        db.add(event)
    
    db.commit()
    print(f"✓ Created {len(events_data)} events")


def seed_groups(db: Session):
    """Create sample groups."""
    universities = db.query(University).all()
    users = db.query(User).filter(User.role == UserRole.ALUMNI).all()
    
    if not universities or not users:
        print("⚠ No universities or users found for groups")
        return
    
    groups_data = [
        {
            "name": "Tech Alumni Network",
            "description": "A community for tech professionals to share knowledge and opportunities.",
            "category": "technology",
            "avatar": "https://api.dicebear.com/7.x/shapes/svg?seed=tech"
        },
        {
            "name": "Startup Founders Club",
            "description": "For alumni who have founded or are interested in founding startups.",
            "category": "entrepreneurship",
            "avatar": "https://api.dicebear.com/7.x/shapes/svg?seed=startup"
        },
        {
            "name": "Class of 2020",
            "description": "Stay connected with your graduating class!",
            "category": "social",
            "avatar": "https://api.dicebear.com/7.x/shapes/svg?seed=2020"
        },
        {
            "name": "Women in STEM",
            "description": "Empowering women in science, technology, engineering, and mathematics.",
            "category": "professional",
            "avatar": "https://api.dicebear.com/7.x/shapes/svg?seed=womeninstem"
        },
        {
            "name": "Finance & Consulting",
            "description": "For alumni working in finance, consulting, and related fields.",
            "category": "professional",
            "avatar": "https://api.dicebear.com/7.x/shapes/svg?seed=finance"
        }
    ]
    
    for i, group_data in enumerate(groups_data):
        uni = universities[i % len(universities)]
        creator = users[i % len(users)]
        
        group = Group(
            university_id=uni.id,
            creator_id=creator.id,
            **group_data
        )
        db.add(group)
        db.flush()
        
        # Add creator as admin member
        membership = GroupMember(
            group_id=group.id,
            user_id=creator.id,
            is_admin=True
        )
        db.add(membership)
    
    db.commit()
    print(f"✓ Created {len(groups_data)} groups")


def seed_connections(db: Session):
    """Create sample connections between users."""
    users = db.query(User).filter(User.role == UserRole.ALUMNI).all()
    
    if len(users) < 2:
        print("⚠ Not enough users for connections")
        return
    
    # Create some connections
    connections_count = 0
    for i in range(len(users) - 1):
        for j in range(i + 1, min(i + 3, len(users))):  # Connect each user to 2-3 others
            connection = Connection(
                user_id=users[i].id,
                connected_user_id=users[j].id
            )
            db.add(connection)
            connections_count += 1
    
    db.commit()
    print(f"✓ Created {connections_count} connections")


def seed_fundraisers(db: Session):
    """Create sample fundraisers."""
    universities = db.query(University).all()
    
    if not universities:
        print("⚠ No universities found for fundraisers")
        return
    
    fundraisers_data = [
        {
            "title": "Scholarship Fund 2024",
            "description": "Help us provide scholarships to deserving students from underrepresented backgrounds.",
            "goal_amount": 100000,
            "current_amount": 45000,
            "donation_link": "https://donate.example.com/scholarship",
            "image": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800"
        },
        {
            "title": "New Research Lab Equipment",
            "description": "Support cutting-edge research by funding new laboratory equipment.",
            "goal_amount": 250000,
            "current_amount": 125000,
            "donation_link": "https://donate.example.com/research"
        },
        {
            "title": "Campus Sustainability Initiative",
            "description": "Help make our campus carbon-neutral by 2030.",
            "goal_amount": 500000,
            "current_amount": 180000,
            "donation_link": "https://donate.example.com/sustainability"
        }
    ]
    
    for i, fundraiser_data in enumerate(fundraisers_data):
        uni = universities[i % len(universities)]
        
        fundraiser = Fundraiser(
            university_id=uni.id,
            **fundraiser_data
        )
        db.add(fundraiser)
    
    db.commit()
    print(f"✓ Created {len(fundraisers_data)} fundraisers")


def seed_ads(db: Session):
    """Create sample ads."""
    universities = db.query(University).all()
    
    ads_data = [
        {
            "title": "Master's Degree Programs",
            "description": "Advance your career with our world-class graduate programs.",
            "image": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800",
            "link": "https://example.com/masters",
            "type": "general",
            "university_id": None  # Global ad
        },
        {
            "title": "Alumni Credit Card",
            "description": "Exclusive benefits for alumni. Apply today!",
            "image": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800",
            "link": "https://example.com/creditcard",
            "type": "compact",
            "university_id": None
        }
    ]
    
    # Add university-specific ads
    for uni in universities[:2]:
        ads_data.append({
            "title": f"{uni.name} Career Fair",
            "description": "Connect with top employers at our annual career fair.",
            "image": "https://images.unsplash.com/photo-1560439514-4e9645039924?w=800",
            "link": f"https://{uni.id}.edu/careerfair",
            "type": "general",
            "university_id": uni.id
        })
    
    for ad_data in ads_data:
        ad = Ad(**ad_data)
        db.add(ad)
    
    db.commit()
    print(f"✓ Created {len(ads_data)} ads")


def seed_notifications(db: Session):
    """Create sample notifications."""
    users = db.query(User).filter(User.role == UserRole.ALUMNI).all()
    
    if not users:
        print("⚠ No users found for notifications")
        return
    
    notifications_data = [
        {
            "type": NotificationType.CONNECTION,
            "title": "New Connection Request",
            "message": "John Doe wants to connect with you."
        },
        {
            "type": NotificationType.LIKE,
            "title": "Post Liked",
            "message": "Jane Smith liked your post."
        },
        {
            "type": NotificationType.COMMENT,
            "title": "New Comment",
            "message": "Bob Wilson commented on your post."
        },
        {
            "type": NotificationType.EVENT,
            "title": "Event Reminder",
            "message": "Annual Alumni Reunion is tomorrow!"
        },
        {
            "type": NotificationType.ANNOUNCEMENT,
            "title": "University Update",
            "message": "New features have been added to the alumni portal."
        }
    ]
    
    for i, notif_data in enumerate(notifications_data):
        user = users[i % len(users)]
        notification = Notification(
            user_id=user.id,
            avatar="https://api.dicebear.com/7.x/avataaars/svg?seed=notif" + str(i),
            **notif_data
        )
        db.add(notification)
    
    db.commit()
    print(f"✓ Created {len(notifications_data)} notifications")


def seed_mentors(db: Session):
    """Create mentor profiles."""
    mentors = db.query(User).filter(User.is_mentor == True).all()
    
    if not mentors:
        print("⚠ No mentors found")
        return
    
    expertise_options = [
        ["Python", "Machine Learning", "Data Science"],
        ["JavaScript", "React", "Node.js"],
        ["Leadership", "Strategy", "Operations"],
        ["Medicine", "Research", "Healthcare"]
    ]
    
    for i, user in enumerate(mentors):
        existing = db.query(Mentor).filter(Mentor.user_id == user.id).first()
        if not existing:
            mentor = Mentor(
                user_id=user.id,
                title="Senior " + (user.major or "Professional"),
                company="Tech Company",
                location="San Francisco, CA",
                expertise=json.dumps(expertise_options[i % len(expertise_options)]),
                bio=f"Experienced professional with {5 + i} years in the industry.",
                availability="Medium",
                years_experience=5 + i,
                match_score=85 + (i * 3)
            )
            db.add(mentor)
    
    db.commit()
    print(f"✓ Created {len(mentors)} mentor profiles")


def seed_lead_intelligence(db: Session):
    """Seed lead intelligence data (ad clicks and career roadmap requests)."""
    users = db.query(User).filter(User.role == UserRole.ALUMNI).all()
    ads = db.query(Ad).all()
    universities = db.query(University).all()
    
    if not users or not ads:
        print("⚠ No users or ads found for lead intelligence")
        return
    
    # Career goals for roadmaps
    career_goals = [
        "Tech Lead", "VP Engineering", "Product Director", "Startup Founder",
        "C-Suite", "Data Scientist", "Machine Learning Engineer", "Product Manager",
        "Engineering Manager", "CTO", "CEO", "VP Product"
    ]
    
    ad_clicks_count = 0
    ad_impressions_count = 0
    roadmap_requests_count = 0
    roadmap_views_count = 0
    
    for user in users:
        # Create ad impressions and clicks
        for ad in ads[:3]:  # Each user interacts with up to 3 ads
            # Create impressions (more than clicks)
            num_impressions = 5 + (hash(f"{user.id}{ad.id}") % 10)
            for _ in range(num_impressions):
                impression = AdImpression(
                    user_id=user.id,
                    ad_id=ad.id,
                    university_id=user.university_id
                )
                db.add(impression)
                ad_impressions_count += 1
            
            # Create clicks (some users click)
            if hash(f"{user.id}{ad.id}") % 3 == 0:  # ~33% click rate
                num_clicks = 1 + (hash(f"{user.id}{ad.id}") % 3)
                for _ in range(num_clicks):
                    click = AdClick(
                        user_id=user.id,
                        ad_id=ad.id,
                        university_id=user.university_id
                    )
                    db.add(click)
                    ad_clicks_count += 1
        
        # Create career roadmap requests and views
        if hash(user.id) % 2 == 0:  # ~50% of users request roadmaps
            career_goal = career_goals[hash(user.id) % len(career_goals)]
            
            roadmap_request = CareerRoadmapRequest(
                user_id=user.id,
                university_id=user.university_id,
                career_goal=career_goal,
                target_position=career_goal,
                current_position=user.major or "Software Engineer",
                experience_level=["entry", "mid", "senior", "executive"][hash(user.id) % 4],
                industry="Technology"
            )
            db.add(roadmap_request)
            db.flush()
            roadmap_requests_count += 1
            
            # Create views for the roadmap
            num_views = 1 + (hash(user.id) % 5)
            for _ in range(num_views):
                view = CareerRoadmapView(
                    user_id=user.id,
                    roadmap_request_id=roadmap_request.id,
                    career_goal=career_goal,
                    university_id=user.university_id
                )
                db.add(view)
                roadmap_views_count += 1
    
    db.commit()
    print(f"✓ Created {ad_clicks_count} ad clicks")
    print(f"✓ Created {ad_impressions_count} ad impressions")
    print(f"✓ Created {roadmap_requests_count} career roadmap requests")
    print(f"✓ Created {roadmap_views_count} career roadmap views")


def main():
    """Main function to seed all data."""
    print("\n🌱 Starting database seeding...\n")
    
    # Create tables
    create_tables()
    print("✓ Database tables created/verified\n")
    
    # Get database session
    db = SessionLocal()
    
    try:
        # Seed data in order
        seed_universities(db)
        seed_users(db)
        seed_posts(db)
        seed_events(db)
        seed_groups(db)
        seed_connections(db)
        seed_fundraisers(db)
        seed_ads(db)
        seed_notifications(db)
        seed_mentors(db)
        seed_lead_intelligence(db)
        
        print("\n✅ Database seeding completed successfully!")
        print("\n📝 Test Credentials:")
        print("   Super Admin: superadmin@alumni.connect / password123")
        print("   MIT Admin:   admin@mit.edu / password123")
        print("   MIT Alumni:  john.doe@alumni.mit.edu / password123")
        print("   Stanford Admin: admin@stanford.edu / password123")
        print("   Stanford Alumni: alice.johnson@alumni.stanford.edu / password123")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()


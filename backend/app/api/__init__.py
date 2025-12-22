from fastapi import APIRouter

from app.api.routes import (
    auth, users, posts, events, groups,
    connections, messages, documents, support,
    notifications, admin, superadmin, universities, lead_intelligence,
    knowledge_base, ads, career_roadmap, course_intelligence, heatmap,
    fundraiser
)

# Create main API router
api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(posts.router, prefix="/feed/posts", tags=["Posts"])
api_router.include_router(events.router, prefix="/events", tags=["Events"])
api_router.include_router(groups.router, prefix="/groups", tags=["Groups"])
api_router.include_router(connections.router, prefix="/connections", tags=["Connections"])
api_router.include_router(messages.router, prefix="/messages", tags=["Messages"])
api_router.include_router(documents.router, prefix="/documents", tags=["Documents"])
api_router.include_router(support.router, prefix="/support", tags=["Support"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(superadmin.router, prefix="/superadmin", tags=["Super Admin"])
api_router.include_router(lead_intelligence.router, prefix="/lead-intelligence", tags=["Lead Intelligence"])
api_router.include_router(universities.router, prefix="/universities", tags=["Universities"])

# Knowledge Base routes (MVP/Demo - single university: MIT)
api_router.include_router(knowledge_base.knowledge_base_router, tags=["Knowledge Base"])

# Ads routes (for alumni to view ads)
api_router.include_router(ads.router, prefix="/ads", tags=["Ads"])

# Career Roadmap routes (AI-powered career planning)
api_router.include_router(career_roadmap.router, tags=["Career Roadmap"])

# Course Intelligence routes (for selling courses to leads)
api_router.include_router(course_intelligence.router, prefix="/course-intelligence", tags=["Course Intelligence"])

# Heat Map routes (alumni discovery map)
api_router.include_router(heatmap.router, prefix="/heatmap", tags=["Heat Map"])

# Fundraiser routes (donation campaigns with click tracking)
api_router.include_router(fundraiser.router, prefix="/fundraisers", tags=["Fundraisers"])

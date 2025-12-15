# Import all models to register them with SQLAlchemy
from app.models.user import User, UserProfile, UserRole
from app.models.university import University
from app.models.post import Post, Comment, Like, PostType, PostTag
from app.models.event import Event, EventRegistration
from app.models.group import Group, GroupMember, GroupMessage
from app.models.connection import Connection, ConnectionRequest, ConnectionStatus
from app.models.message import Conversation, Message
from app.models.document import DocumentRequest, GeneratedDocument, DocumentStatus
from app.models.support import SupportTicket, TicketResponse, TicketStatus, TicketPriority, TicketCategory
from app.models.notification import Notification, NotificationType
from app.models.mentor import Mentor, MentorMatch
from app.models.fundraiser import Fundraiser
from app.models.ad import Ad
from app.models.lead_intelligence import AdClick, AdImpression, CareerRoadmapRequest, CareerRoadmapView
from app.models.media import Media

__all__ = [
    "User", "UserProfile", "UserRole",
    "University",
    "Post", "Comment", "Like", "PostType", "PostTag",
    "Event", "EventRegistration",
    "Group", "GroupMember", "GroupMessage",
    "Connection", "ConnectionRequest", "ConnectionStatus",
    "Conversation", "Message",
    "DocumentRequest", "GeneratedDocument", "DocumentStatus",
    "SupportTicket", "TicketResponse", "TicketStatus", "TicketPriority", "TicketCategory",
    "Notification", "NotificationType",
    "Mentor", "MentorMatch",
    "Fundraiser",
    "Ad",
    "AdClick", "AdImpression", "CareerRoadmapRequest", "CareerRoadmapView",
    "Media"
]

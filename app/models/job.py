"""
Job posting and application models
"""
from sqlalchemy import Column, String, Text, ForeignKey, Integer, Boolean, DateTime, Enum as SQLEnum, Numeric
from sqlalchemy.orm import relationship
import enum
from app.db.base import BaseModel


class JobType(str, enum.Enum):
    """Job types"""
    FULL_TIME = "full_time"
    PART_TIME = "part_time"
    CONTRACT = "contract"
    INTERNSHIP = "internship"
    FREELANCE = "freelance"


class JobStatus(str, enum.Enum):
    """Job posting status"""
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"
    EXPIRED = "expired"


class ApplicationStatus(str, enum.Enum):
    """Application status"""
    PENDING = "pending"
    REVIEWING = "reviewing"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"
    ACCEPTED = "accepted"


class JobPosting(BaseModel):
    """Job posting model"""
    __tablename__ = "job_postings"

    title = Column(String(255), nullable=False, index=True)
    company = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False)
    requirements = Column(Text, nullable=True)
    location = Column(String(255), nullable=True)
    job_type = Column(SQLEnum(JobType), nullable=False)
    status = Column(SQLEnum(JobStatus), default=JobStatus.DRAFT, nullable=False)
    salary_min = Column(Numeric(10, 2), nullable=True)
    salary_max = Column(Numeric(10, 2), nullable=True)
    currency = Column(String(10), default="USD", nullable=False)
    application_deadline = Column(DateTime, nullable=True)
    application_url = Column(String(512), nullable=True)
    contact_email = Column(String(255), nullable=True)
    is_featured = Column(Boolean, default=False, nullable=False)
    poster_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=False)

    # Relationships
    poster = relationship("User", back_populates="job_postings")
    applications = relationship("JobApplication", back_populates="job_posting", cascade="all, delete-orphan")


class JobApplication(BaseModel):
    """Job application model"""
    __tablename__ = "job_applications"

    job_posting_id = Column(Integer, ForeignKey("job_postings.id", ondelete="CASCADE"), nullable=False, index=True)
    applicant_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    cover_letter = Column(Text, nullable=True)
    resume_url = Column(String(512), nullable=True)
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.PENDING, nullable=False)
    applied_date = Column(DateTime, nullable=False)
    notes = Column(Text, nullable=True)

    # Relationships
    job_posting = relationship("JobPosting", back_populates="applications")
    applicant = relationship("User")



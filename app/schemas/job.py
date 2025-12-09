"""
Job posting schemas
"""
from typing import Optional
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, ConfigDict
from app.models.job import JobType, JobStatus, ApplicationStatus


class JobPostingBase(BaseModel):
    """Base job posting schema"""
    title: str = Field(..., min_length=1, max_length=255)
    company: str = Field(..., min_length=1, max_length=255)
    description: str = Field(..., min_length=1)
    requirements: Optional[str] = None
    location: Optional[str] = None
    job_type: JobType
    salary_min: Optional[Decimal] = None
    salary_max: Optional[Decimal] = None
    currency: str = "USD"
    application_deadline: Optional[datetime] = None
    application_url: Optional[str] = None
    contact_email: Optional[str] = None
    is_featured: bool = False


class JobPostingCreate(JobPostingBase):
    """Schema for creating job posting"""
    pass


class JobPostingUpdate(BaseModel):
    """Schema for updating job posting"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    company: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, min_length=1)
    requirements: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[JobType] = None
    status: Optional[JobStatus] = None
    salary_min: Optional[Decimal] = None
    salary_max: Optional[Decimal] = None
    currency: Optional[str] = None
    application_deadline: Optional[datetime] = None
    application_url: Optional[str] = None
    contact_email: Optional[str] = None
    is_featured: Optional[bool] = None


class JobPostingResponse(JobPostingBase):
    """Job posting response schema"""
    id: int
    status: JobStatus
    poster_id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JobApplicationCreate(BaseModel):
    """Schema for job application"""
    job_posting_id: int
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None


class JobApplicationResponse(BaseModel):
    """Job application response schema"""
    id: int
    job_posting_id: int
    applicant_id: int
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    status: ApplicationStatus
    applied_date: datetime
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)



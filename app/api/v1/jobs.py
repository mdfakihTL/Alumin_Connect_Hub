"""
Job posting endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_async_session
from app.schemas.job import JobPostingCreate, JobPostingUpdate, JobPostingResponse, JobApplicationCreate, JobApplicationResponse
from app.api.dependencies import get_current_active_user
from app.models.user import User
from sqlalchemy import select
from app.models.job import JobPosting, JobApplication, JobStatus
from datetime import datetime

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("/", response_model=JobPostingResponse, status_code=status.HTTP_201_CREATED)
async def create_job_posting(
    job_data: JobPostingCreate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Create a new job posting"""
    job = JobPosting(
        **job_data.model_dump(),
        poster_id=current_user.id
    )
    session.add(job)
    await session.commit()
    await session.refresh(job)
    return job


@router.get("/", response_model=List[JobPostingResponse])
async def list_jobs(
    skip: int = 0,
    limit: int = 100,
    session: AsyncSession = Depends(get_async_session)
):
    """List all job postings"""
    result = await session.execute(
        select(JobPosting)
        .where(JobPosting.status == JobStatus.ACTIVE)
        .offset(skip)
        .limit(limit)
        .order_by(JobPosting.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/{job_id}", response_model=JobPostingResponse)
async def get_job(
    job_id: int,
    session: AsyncSession = Depends(get_async_session)
):
    """Get job posting by ID"""
    result = await session.execute(select(JobPosting).where(JobPosting.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )
    return job


@router.post("/{job_id}/apply", response_model=JobApplicationResponse, status_code=status.HTTP_201_CREATED)
async def apply_for_job(
    job_id: int,
    application_data: JobApplicationCreate,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Apply for a job"""
    # Check if job exists
    result = await session.execute(select(JobPosting).where(JobPosting.id == job_id))
    job = result.scalar_one_or_none()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found"
        )

    # Check if already applied
    existing = await session.execute(
        select(JobApplication).where(
            JobApplication.job_posting_id == job_id,
            JobApplication.applicant_id == current_user.id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already applied for this job"
        )

    application = JobApplication(
        job_posting_id=job_id,
        applicant_id=current_user.id,
        cover_letter=application_data.cover_letter,
        resume_url=application_data.resume_url,
        applied_date=datetime.utcnow()
    )
    session.add(application)
    await session.commit()
    await session.refresh(application)
    return application



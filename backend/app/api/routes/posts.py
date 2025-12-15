from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form, Response
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime
import os
import base64

from app.core.database import get_db
from app.core.security import get_current_active_user
from app.models.user import User, UserProfile
from app.models.post import Post, Comment, Like, PostType
from app.models.media import Media
from app.schemas.post import (
    PostCreate, PostUpdate, PostResponse, PostListResponse,
    CommentCreate, CommentResponse, AuthorResponse
)
from app.services.s3_service import s3_service

router = APIRouter()


def format_time(dt: datetime) -> str:
    """Format datetime as relative time."""
    if not dt:
        return ""
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.total_seconds() < 60:
        return "Just now"
    elif diff.total_seconds() < 3600:
        mins = int(diff.total_seconds() / 60)
        return f"{mins}m ago"
    elif diff.total_seconds() < 86400:
        hours = int(diff.total_seconds() / 3600)
        return f"{hours}h ago"
    elif diff.days < 7:
        return f"{diff.days}d ago"
    else:
        return dt.strftime("%b %d, %Y")


def get_author_response(user: User, db: Session) -> AuthorResponse:
    """Get author response from user."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
    return AuthorResponse(
        id=user.id,
        name=user.name,
        avatar=user.avatar,
        title=profile.job_title if profile else None,
        company=profile.company if profile else None
    )


@router.get("/", response_model=PostListResponse)
async def list_posts(
    university_id: Optional[str] = None,
    post_type: Optional[str] = None,
    tag: Optional[str] = None,
    author_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List posts with pagination and filtering.
    """
    query = db.query(Post).filter(Post.is_active == True)
    
    if university_id:
        query = query.filter(Post.university_id == university_id)
    else:
        # By default, show posts from user's university
        if current_user.university_id:
            query = query.filter(Post.university_id == current_user.university_id)
    
    if post_type:
        try:
            query = query.filter(Post.type == PostType(post_type))
        except ValueError:
            pass
    
    if tag:
        query = query.filter(Post.tag == tag)
    
    if author_id:
        query = query.filter(Post.author_id == author_id)
    
    query = query.order_by(Post.created_at.desc())
    
    total = query.count()
    posts = query.offset((page - 1) * page_size).limit(page_size).all()
    
    post_responses = []
    for post in posts:
        author = db.query(User).filter(User.id == post.author_id).first()
        if not author:
            continue
        
        # Check if current user liked this post
        is_liked = db.query(Like).filter(
            Like.post_id == post.id,
            Like.user_id == current_user.id
        ).first() is not None
        
        post_responses.append(PostResponse(
            id=post.id,
            author=get_author_response(author, db),
            type=post.type.value,
            content=post.content,
            media_url=post.media_url,
            video_url=post.video_url,
            thumbnail_url=post.thumbnail_url,
            tag=post.tag,
            job_title=post.job_title,
            company=post.company,
            location=post.location,
            likes_count=post.likes_count,
            comments_count=post.comments_count,
            shares_count=post.shares_count,
            is_liked=is_liked,
            time=format_time(post.created_at),
            created_at=post.created_at
        ))
    
    return PostListResponse(
        posts=post_responses,
        total=total,
        page=page,
        page_size=page_size
    )


@router.post("/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: PostCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Create a new post.
    """
    try:
        post_type = PostType(post_data.type)
    except ValueError:
        post_type = PostType.TEXT
    
    post = Post(
        author_id=current_user.id,
        university_id=current_user.university_id,
        type=post_type,
        content=post_data.content,
        media_url=post_data.media_url,
        video_url=post_data.video_url,
        thumbnail_url=post_data.thumbnail_url,
        tag=post_data.tag,
        job_title=post_data.job_title,
        company=post_data.company,
        location=post_data.location
    )
    
    db.add(post)
    
    # Update user's post count
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if profile:
        profile.posts_count += 1
    
    db.commit()
    db.refresh(post)
    
    return PostResponse(
        id=post.id,
        author=get_author_response(current_user, db),
        type=post.type.value,
        content=post.content,
        media_url=post.media_url,
        video_url=post.video_url,
        thumbnail_url=post.thumbnail_url,
        tag=post.tag,
        job_title=post.job_title,
        company=post.company,
        location=post.location,
        likes_count=0,
        comments_count=0,
        shares_count=0,
        is_liked=False,
        time="Just now",
        created_at=post.created_at
    )


@router.post("/upload-media", response_model=dict)
async def upload_media(
    file: UploadFile = File(...),
    media_type: str = Form(...),  # "image" or "video"
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Upload media file (image or video) - TEMPORARY: Stores in database instead of S3
    """
    from app.core.logging import logger
    from app.models.media import Media
    import base64
    
    if media_type not in ["image", "video"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="media_type must be 'image' or 'video'"
        )
    
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must have a filename"
        )
    
    # Read file content
    file_content = await file.read()
    file_size = len(file_content)
    
    # Check file size (max 10MB for images, 50MB for videos when storing in DB)
    max_size = 10 * 1024 * 1024 if media_type == "image" else 50 * 1024 * 1024
    
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size: {max_size / (1024*1024):.0f}MB (DB storage limit)"
        )
    
    logger.info(f"Uploading {media_type} to database: {file.filename} ({file_size} bytes) by user {current_user.id}")
    
    try:
        # Encode file as base64 for database storage
        file_data_base64 = base64.b64encode(file_content).decode('utf-8')
        
        # Store in database
        media = Media(
            filename=file.filename,
            content_type=file.content_type or 'application/octet-stream',
            file_data=file_data_base64,
            file_size=file_size
        )
        db.add(media)
        db.commit()
        db.refresh(media)
        
        # Return URL that points to our media endpoint
        base_url = os.getenv("API_BASE_URL", "https://alumni-portal-yw7q.onrender.com")
        url = f"{base_url}/api/v1/posts/media/{media.id}"
        
        logger.info(f"Media stored in database successfully: {media.id}")
        return {"url": url, "type": media_type}
        
    except Exception as e:
        logger.error(f"Error storing media in database: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload media file: {str(e)}"
        )


@router.get("/media/{media_id}")
async def get_media(
    media_id: str,
    db: Session = Depends(get_db)
):
    """
    Serve media file from database (temporary solution until S3 is configured)
    """
    media = db.query(Media).filter(Media.id == media_id).first()
    
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found"
        )
    
    # Decode base64 data
    try:
        file_data = base64.b64decode(media.file_data)
        return Response(
            content=file_data,
            media_type=media.content_type,
            headers={
                "Content-Disposition": f'inline; filename="{media.filename}"',
                "Cache-Control": "public, max-age=31536000"
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error serving media: {str(e)}"
        )


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get a specific post.
    """
    post = db.query(Post).filter(Post.id == post_id, Post.is_active == True).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    author = db.query(User).filter(User.id == post.author_id).first()
    if not author:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post author not found"
        )
    
    is_liked = db.query(Like).filter(
        Like.post_id == post.id,
        Like.user_id == current_user.id
    ).first() is not None
    
    return PostResponse(
        id=post.id,
        author=get_author_response(author, db),
        type=post.type.value,
        content=post.content,
        media_url=post.media_url,
        video_url=post.video_url,
        thumbnail_url=post.thumbnail_url,
        tag=post.tag,
        job_title=post.job_title,
        company=post.company,
        location=post.location,
        likes_count=post.likes_count,
        comments_count=post.comments_count,
        shares_count=post.shares_count,
        is_liked=is_liked,
        time=format_time(post.created_at),
        created_at=post.created_at
    )


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update a post.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this post"
        )
    
    if post_data.content is not None:
        post.content = post_data.content
    if post_data.media_url is not None:
        post.media_url = post_data.media_url
    if post_data.tag is not None:
        post.tag = post_data.tag
    if post_data.job_title is not None:
        post.job_title = post_data.job_title
    if post_data.company is not None:
        post.company = post_data.company
    if post_data.location is not None:
        post.location = post_data.location
    
    db.commit()
    db.refresh(post)
    
    is_liked = db.query(Like).filter(
        Like.post_id == post.id,
        Like.user_id == current_user.id
    ).first() is not None
    
    return PostResponse(
        id=post.id,
        author=get_author_response(current_user, db),
        type=post.type.value,
        content=post.content,
        media_url=post.media_url,
        video_url=post.video_url,
        thumbnail_url=post.thumbnail_url,
        tag=post.tag,
        job_title=post.job_title,
        company=post.company,
        location=post.location,
        likes_count=post.likes_count,
        comments_count=post.comments_count,
        shares_count=post.shares_count,
        is_liked=is_liked,
        time=format_time(post.created_at),
        created_at=post.created_at
    )


@router.delete("/{post_id}")
async def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a post.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    if post.author_id != current_user.id and current_user.role.value not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post"
        )
    
    post.is_active = False
    
    # Update user's post count
    profile = db.query(UserProfile).filter(UserProfile.user_id == post.author_id).first()
    if profile:
        profile.posts_count = max(0, profile.posts_count - 1)
    
    db.commit()
    
    return {"message": "Post deleted successfully", "success": True}


@router.post("/{post_id}/like")
async def like_post(
    post_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Like a post.
    """
    post = db.query(Post).filter(Post.id == post_id, Post.is_active == True).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    existing_like = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == current_user.id
    ).first()
    
    if existing_like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already liked this post"
        )
    
    like = Like(post_id=post_id, user_id=current_user.id)
    db.add(like)
    post.likes_count += 1
    db.commit()
    
    return {"message": "Post liked", "success": True, "likes_count": post.likes_count}


@router.delete("/{post_id}/like")
async def unlike_post(
    post_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Unlike a post.
    """
    post = db.query(Post).filter(Post.id == post_id).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    like = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == current_user.id
    ).first()
    
    if not like:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not liked this post"
        )
    
    db.delete(like)
    post.likes_count = max(0, post.likes_count - 1)
    db.commit()
    
    return {"message": "Post unliked", "success": True, "likes_count": post.likes_count}


@router.get("/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(
    post_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get comments for a post.
    """
    post = db.query(Post).filter(Post.id == post_id, Post.is_active == True).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    comments = db.query(Comment).filter(
        Comment.post_id == post_id
    ).order_by(Comment.created_at.asc()).all()
    
    comment_responses = []
    for comment in comments:
        author = db.query(User).filter(User.id == comment.author_id).first()
        if author:
            comment_responses.append(CommentResponse(
                id=comment.id,
                author=get_author_response(author, db),
                content=comment.content,
                created_at=comment.created_at
            ))
    
    return comment_responses


@router.post("/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Add a comment to a post.
    """
    post = db.query(Post).filter(Post.id == post_id, Post.is_active == True).first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    comment = Comment(
        post_id=post_id,
        author_id=current_user.id,
        content=comment_data.content
    )
    
    db.add(comment)
    post.comments_count += 1
    db.commit()
    db.refresh(comment)
    
    return CommentResponse(
        id=comment.id,
        author=get_author_response(current_user, db),
        content=comment.content,
        created_at=comment.created_at
    )


@router.delete("/{post_id}/comments/{comment_id}")
async def delete_comment(
    post_id: str,
    comment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Delete a comment.
    """
    comment = db.query(Comment).filter(
        Comment.id == comment_id,
        Comment.post_id == post_id
    ).first()
    
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    if comment.author_id != current_user.id and current_user.role.value not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )
    
    post = db.query(Post).filter(Post.id == post_id).first()
    if post:
        post.comments_count = max(0, post.comments_count - 1)
    
    db.delete(comment)
    db.commit()
    
    return {"message": "Comment deleted", "success": True}

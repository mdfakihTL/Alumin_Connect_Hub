"""
File upload and processing utilities
"""
import os
import aiofiles
from typing import Optional, Tuple
from pathlib import Path
from fastapi import UploadFile
from app.core.config import settings
from app.core.logging import logger
from app.models.document import DocumentType


def get_file_extension(filename: str) -> str:
    """Get file extension from filename"""
    return Path(filename).suffix.lower().lstrip('.')


def is_allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    ext = get_file_extension(filename)
    return ext in settings.ALLOWED_EXTENSIONS


def get_document_type(filename: str) -> DocumentType:
    """Get document type from filename"""
    ext = get_file_extension(filename)
    ext_map = {
        'pdf': DocumentType.PDF,
        'doc': DocumentType.DOC,
        'docx': DocumentType.DOCX,
        'txt': DocumentType.TXT,
        'md': DocumentType.MD,
    }
    return ext_map.get(ext, DocumentType.OTHER)


async def save_upload_file(upload_file: UploadFile, user_id: int) -> Tuple[Optional[str], Optional[str]]:
    """
    Save uploaded file to disk
    Returns: (file_path, file_name) or (None, None) on error
    """
    if not is_allowed_file(upload_file.filename):
        logger.warning(f"File type not allowed: {upload_file.filename}")
        return None, None

    # Create upload directory if it doesn't exist
    upload_dir = Path(settings.UPLOAD_DIR) / str(user_id)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate unique filename
    file_ext = get_file_extension(upload_file.filename)
    import uuid
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    file_path = upload_dir / unique_filename

    try:
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            content = await upload_file.read()
            if len(content) > settings.MAX_UPLOAD_SIZE:
                logger.warning(f"File too large: {upload_file.filename}")
                return None, None
            await f.write(content)

        return str(file_path), unique_filename
    except Exception as e:
        logger.error(f"Error saving file: {str(e)}")
        return None, None


async def read_file_content(file_path: str) -> Optional[str]:
    """Read text content from file"""
    try:
        async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
            return await f.read()
    except Exception as e:
        logger.error(f"Error reading file: {str(e)}")
        return None


async def extract_text_from_file(file_path: str, file_type: DocumentType) -> Optional[str]:
    """Extract text from various file types"""
    if file_type == DocumentType.TXT or file_type == DocumentType.MD:
        return await read_file_content(file_path)
    elif file_type == DocumentType.PDF:
        # For PDF, you would use a library like PyPDF2 or pdfplumber
        # This is a placeholder
        try:
            import PyPDF2
            text = ""
            with open(file_path, 'rb') as f:
                pdf_reader = PyPDF2.PdfReader(f)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            return text
        except ImportError:
            logger.warning("PyPDF2 not installed. PDF text extraction not available.")
            return None
        except Exception as e:
            logger.error(f"Error extracting PDF text: {str(e)}")
            return None
    else:
        logger.warning(f"Text extraction not implemented for {file_type}")
        return None



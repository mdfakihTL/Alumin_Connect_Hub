"""
MIT Knowledge Base Service - MVP/Demo Version

This is a DUMMY implementation for hackathon/demo purposes.
It uses simple keyword matching instead of vector embeddings.

WHAT'S DUMMY (will change in production):
- No vector database (using keyword matching)
- No authentication on admin endpoints
- Single university hardcoded (MIT)
- In-memory document storage (reloads on restart)
- Simple chunking strategy
- Basic keyword retrieval (not semantic)

WHAT WILL CHANGE FOR PRODUCTION:
- Add Pinecone/FAISS for vector embeddings
- Add proper authentication
- Support multiple universities
- Use S3 for document storage
- Implement proper RAG with embeddings
"""

import os
import re
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass, field
import logging

logger = logging.getLogger(__name__)

# ==============================================================================
# CONSTANTS - Hardcoded for MVP
# ==============================================================================

# DUMMY: Single university hardcoded
UNIVERSITY_ID = "mit"
UNIVERSITY_NAME = "Massachusetts Institute of Technology"

# Path to knowledge base folder (relative to backend directory)
# On Render, this will be: /opt/render/project/src/backend/data/knowledge_base/mit/
BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
KNOWLEDGE_BASE_PATH = BASE_DIR / "data" / "knowledge_base" / UNIVERSITY_ID

# Chunking settings
CHUNK_SIZE = 500  # Characters per chunk
CHUNK_OVERLAP = 50  # Overlap between chunks for context continuity


# ==============================================================================
# DATA CLASSES
# ==============================================================================

@dataclass
class DocumentChunk:
    """Represents a chunk of a document."""
    chunk_id: str
    document_name: str
    content: str
    university_id: str = UNIVERSITY_ID
    
    def __repr__(self):
        return f"Chunk({self.chunk_id}: {self.content[:50]}...)"


@dataclass
class KnowledgeBase:
    """
    In-memory knowledge base storage.
    
    DUMMY: This is stored in memory and resets on app restart.
    In production, use a proper database or vector store.
    """
    university_id: str = UNIVERSITY_ID
    university_name: str = UNIVERSITY_NAME
    documents: Dict[str, str] = field(default_factory=dict)  # filename -> full content
    chunks: List[DocumentChunk] = field(default_factory=list)
    
    def clear(self):
        """Clear all documents and chunks."""
        self.documents.clear()
        self.chunks.clear()


# ==============================================================================
# GLOBAL KNOWLEDGE BASE INSTANCE
# ==============================================================================

# DUMMY: Global in-memory storage
knowledge_base = KnowledgeBase()


# ==============================================================================
# DOCUMENT PROCESSING FUNCTIONS
# ==============================================================================

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> List[str]:
    """
    Split text into overlapping chunks.
    
    DUMMY: Simple character-based chunking.
    In production, use sentence-aware or semantic chunking.
    
    Args:
        text: The text to chunk
        chunk_size: Maximum characters per chunk
        overlap: Number of overlapping characters between chunks
        
    Returns:
        List of text chunks
    """
    if not text or len(text) <= chunk_size:
        return [text] if text else []
    
    chunks = []
    start = 0
    
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        
        # Try to end at a sentence or word boundary
        if end < len(text):
            # Look for sentence end
            last_period = chunk.rfind('.')
            last_newline = chunk.rfind('\n')
            break_point = max(last_period, last_newline)
            
            if break_point > chunk_size // 2:
                chunk = chunk[:break_point + 1]
                end = start + break_point + 1
        
        chunks.append(chunk.strip())
        start = end - overlap
        
    return [c for c in chunks if c]  # Remove empty chunks


def load_document(filepath: Path) -> Optional[str]:
    """
    Load a single document from disk.
    
    Args:
        filepath: Path to the .txt file
        
    Returns:
        Document content or None if failed
    """
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        logger.info(f"Loaded document: {filepath.name} ({len(content)} chars)")
        return content
    except Exception as e:
        logger.error(f"Failed to load document {filepath}: {e}")
        return None


def load_all_documents() -> int:
    """
    Load all .txt documents from the knowledge base folder.
    
    This function:
    1. Clears existing in-memory data
    2. Reads all .txt files from /data/knowledge_base/mit/
    3. Chunks each document
    4. Stores chunks in memory
    
    Returns:
        Number of documents loaded
    """
    global knowledge_base
    
    # Clear existing data
    knowledge_base.clear()
    
    # Ensure directory exists
    KNOWLEDGE_BASE_PATH.mkdir(parents=True, exist_ok=True)
    
    # Find all .txt files
    txt_files = list(KNOWLEDGE_BASE_PATH.glob("*.txt"))
    logger.info(f"Found {len(txt_files)} .txt files in {KNOWLEDGE_BASE_PATH}")
    
    chunk_counter = 0
    
    for filepath in txt_files:
        content = load_document(filepath)
        if content:
            # Store full document
            knowledge_base.documents[filepath.name] = content
            
            # Create chunks
            text_chunks = chunk_text(content)
            for i, chunk_content in enumerate(text_chunks):
                chunk = DocumentChunk(
                    chunk_id=f"{filepath.stem}_chunk_{i}",
                    document_name=filepath.name,
                    content=chunk_content,
                    university_id=UNIVERSITY_ID
                )
                knowledge_base.chunks.append(chunk)
                chunk_counter += 1
    
    logger.info(f"Loaded {len(knowledge_base.documents)} documents, {chunk_counter} chunks")
    return len(knowledge_base.documents)


# ==============================================================================
# RETRIEVAL FUNCTIONS - SIMPLE KEYWORD MATCHING
# ==============================================================================

def calculate_relevance_score(query: str, chunk: DocumentChunk) -> float:
    """
    Calculate relevance score using simple keyword matching.
    
    DUMMY: This uses basic keyword overlap, not semantic similarity.
    In production, use vector embeddings and cosine similarity.
    
    Args:
        query: User's question
        chunk: Document chunk to score
        
    Returns:
        Relevance score (0.0 to 1.0)
    """
    # Normalize text
    query_lower = query.lower()
    content_lower = chunk.content.lower()
    
    # Extract keywords (simple tokenization)
    query_words = set(re.findall(r'\b\w+\b', query_lower))
    content_words = set(re.findall(r'\b\w+\b', content_lower))
    
    # Remove common stop words
    stop_words = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 
                  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                  'would', 'could', 'should', 'may', 'might', 'must', 'shall',
                  'can', 'need', 'to', 'of', 'in', 'for', 'on', 'with', 'at',
                  'by', 'from', 'as', 'into', 'through', 'during', 'before',
                  'after', 'above', 'below', 'between', 'under', 'again',
                  'further', 'then', 'once', 'here', 'there', 'when', 'where',
                  'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other',
                  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
                  'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if',
                  'or', 'because', 'until', 'while', 'what', 'which', 'who',
                  'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our',
                  'you', 'your', 'it', 'its', 'they', 'them', 'their'}
    
    query_keywords = query_words - stop_words
    content_keywords = content_words - stop_words
    
    if not query_keywords:
        return 0.0
    
    # Calculate overlap
    matching_keywords = query_keywords & content_keywords
    score = len(matching_keywords) / len(query_keywords)
    
    # Bonus for exact phrase matches
    for word in query_keywords:
        if word in content_lower:
            score += 0.1
    
    return min(score, 1.0)


def retrieve_relevant_chunks(query: str, top_k: int = 3) -> List[DocumentChunk]:
    """
    Retrieve the most relevant chunks for a query.
    
    DUMMY: Uses keyword matching. In production, use vector similarity search.
    
    Args:
        query: User's question
        top_k: Number of chunks to return
        
    Returns:
        List of most relevant chunks
    """
    if not knowledge_base.chunks:
        logger.warning("No chunks in knowledge base")
        return []
    
    # Score all chunks
    scored_chunks = []
    for chunk in knowledge_base.chunks:
        score = calculate_relevance_score(query, chunk)
        if score > 0:
            scored_chunks.append((score, chunk))
    
    # Sort by score (descending)
    scored_chunks.sort(key=lambda x: x[0], reverse=True)
    
    # Return top k
    top_chunks = [chunk for score, chunk in scored_chunks[:top_k]]
    
    logger.info(f"Retrieved {len(top_chunks)} chunks for query: {query[:50]}...")
    return top_chunks


def build_context(chunks: List[DocumentChunk]) -> str:
    """
    Build context string from retrieved chunks.
    
    Args:
        chunks: List of relevant chunks
        
    Returns:
        Combined context string
    """
    if not chunks:
        return ""
    
    context_parts = []
    for i, chunk in enumerate(chunks, 1):
        context_parts.append(f"[Source: {chunk.document_name}]\n{chunk.content}")
    
    return "\n\n---\n\n".join(context_parts)


# ==============================================================================
# ADMIN FUNCTIONS
# ==============================================================================

def save_uploaded_document(filename: str, content: bytes) -> bool:
    """
    Save an uploaded document to the knowledge base folder.
    
    DUMMY: No authentication or validation.
    In production, add auth, virus scanning, etc.
    
    Args:
        filename: Name of the file
        content: File content as bytes
        
    Returns:
        True if successful
    """
    try:
        # Ensure directory exists
        KNOWLEDGE_BASE_PATH.mkdir(parents=True, exist_ok=True)
        
        # Sanitize filename
        safe_filename = re.sub(r'[^\w\-_\.]', '_', filename)
        if not safe_filename.endswith('.txt'):
            safe_filename += '.txt'
        
        filepath = KNOWLEDGE_BASE_PATH / safe_filename
        
        # Save file
        with open(filepath, 'wb') as f:
            f.write(content)
        
        logger.info(f"Saved document: {safe_filename}")
        
        # Reload all documents to update chunks
        load_all_documents()
        
        return True
    except Exception as e:
        logger.error(f"Failed to save document {filename}: {e}")
        return False


def list_documents() -> List[Dict]:
    """
    List all documents in the knowledge base.
    
    Returns:
        List of document info dicts
    """
    documents = []
    
    if KNOWLEDGE_BASE_PATH.exists():
        for filepath in KNOWLEDGE_BASE_PATH.glob("*.txt"):
            stat = filepath.stat()
            documents.append({
                "filename": filepath.name,
                "size_bytes": stat.st_size,
                "university_id": UNIVERSITY_ID
            })
    
    return documents


def delete_document(filename: str) -> bool:
    """
    Delete a document from the knowledge base.
    
    Args:
        filename: Name of the file to delete
        
    Returns:
        True if successful
    """
    try:
        filepath = KNOWLEDGE_BASE_PATH / filename
        if filepath.exists():
            filepath.unlink()
            logger.info(f"Deleted document: {filename}")
            # Reload documents
            load_all_documents()
            return True
        return False
    except Exception as e:
        logger.error(f"Failed to delete document {filename}: {e}")
        return False


# ==============================================================================
# STATUS FUNCTIONS
# ==============================================================================

def get_knowledge_base_status() -> Dict:
    """
    Get current status of the knowledge base.
    
    Returns:
        Status dictionary
    """
    return {
        "university_id": UNIVERSITY_ID,
        "university_name": UNIVERSITY_NAME,
        "document_count": len(knowledge_base.documents),
        "chunk_count": len(knowledge_base.chunks),
        "documents": list(knowledge_base.documents.keys()),
        "storage_path": str(KNOWLEDGE_BASE_PATH),
        "is_dummy": True,  # Flag indicating this is a demo implementation
        "notes": "This is a dummy MVP implementation using keyword matching. "
                 "Production will use vector embeddings for semantic search."
    }


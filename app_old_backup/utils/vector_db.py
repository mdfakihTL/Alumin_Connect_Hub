"""
Vector database integration with ChromaDB
"""
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from app.core.config import settings
from app.core.logging import logger


class VectorDBService:
    """Service for vector database operations"""

    def __init__(self):
        try:
            self.client = chromadb.PersistentClient(
                path=settings.CHROMA_PERSIST_DIRECTORY,
                settings=Settings(anonymized_telemetry=False)
            )
            self.collection = self.client.get_or_create_collection(
                name=settings.CHROMA_COLLECTION_NAME,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info("ChromaDB initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing ChromaDB: {str(e)}")
            self.client = None
            self.collection = None

    def add_document(
        self,
        document_id: str,
        embeddings: List[List[float]],
        texts: List[str],
        metadatas: List[Dict[str, Any]],
        ids: Optional[List[str]] = None
    ) -> bool:
        """Add document chunks to vector database"""
        if not self.collection:
            logger.error("ChromaDB collection not initialized")
            return False

        try:
            if ids is None:
                ids = [f"{document_id}_chunk_{i}" for i in range(len(texts))]

            self.collection.add(
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
                ids=ids
            )
            logger.info(f"Added {len(texts)} chunks for document {document_id}")
            return True
        except Exception as e:
            logger.error(f"Error adding document to vector DB: {str(e)}")
            return False

    def search(
        self,
        query_embedding: List[float],
        n_results: int = 10,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar documents"""
        if not self.collection:
            logger.error("ChromaDB collection not initialized")
            return []

        try:
            where = filter_metadata if filter_metadata else None
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where
            )

            # Format results
            formatted_results = []
            if results['ids'] and len(results['ids'][0]) > 0:
                for i in range(len(results['ids'][0])):
                    formatted_results.append({
                        'id': results['ids'][0][i],
                        'document': results['documents'][0][i],
                        'metadata': results['metadatas'][0][i],
                        'distance': results['distances'][0][i] if 'distances' in results else None
                    })
            return formatted_results
        except Exception as e:
            logger.error(f"Error searching vector DB: {str(e)}")
            return []

    def delete_document(self, document_id: str) -> bool:
        """Delete all chunks for a document"""
        if not self.collection:
            logger.error("ChromaDB collection not initialized")
            return False

        try:
            # Get all chunks for this document
            results = self.collection.get(where={"document_id": document_id})
            if results['ids']:
                self.collection.delete(ids=results['ids'])
                logger.info(f"Deleted {len(results['ids'])} chunks for document {document_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting document from vector DB: {str(e)}")
            return False

    def get_collection_stats(self) -> Dict[str, Any]:
        """Get collection statistics"""
        if not self.collection:
            return {"error": "Collection not initialized"}

        try:
            count = self.collection.count()
            return {
                "count": count,
                "name": settings.CHROMA_COLLECTION_NAME
            }
        except Exception as e:
            logger.error(f"Error getting collection stats: {str(e)}")
            return {"error": str(e)}


# Global instance
vector_db_service = VectorDBService()



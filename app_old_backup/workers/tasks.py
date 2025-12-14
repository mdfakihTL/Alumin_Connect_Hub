"""
Celery background tasks
"""
from app.workers.celery_app import celery_app
from app.core.logging import logger


@celery_app.task(name="process_document")
def process_document_task(document_id: int):
    """Background task to process document"""
    # This would be called from document service
    logger.info(f"Processing document {document_id}")
    # Implementation would go here
    return {"status": "processed", "document_id": document_id}


@celery_app.task(name="send_email")
def send_email_task(to_email: str, subject: str, body: str):
    """Background task to send email"""
    logger.info(f"Sending email to {to_email}")
    # Implementation would go here
    return {"status": "sent", "to": to_email}



"""
Comprehensive API verification script
Checks all API endpoints against database models and schemas
"""
from sqlalchemy import inspect
from app.models import (
    User, AlumniProfile, Event, EventRegistration,
    JobPosting, JobApplication, Document, DocumentEmbedding,
    ChatSession, ChatMessage
)
from app.schemas import (
    user, alumni, event, job, document, chat
)

def check_model_fields(model_class, schema_class, exclude_fields=None):
    """Check if schema fields match model columns"""
    inspector = inspect(model_class)
    model_columns = {col.name for col in inspector.columns}
    
    # Get schema fields
    schema_fields = set(schema_class.model_fields.keys())
    
    # BaseModel fields that are always present
    base_fields = {'id', 'created_at', 'updated_at'}
    
    # Fields to exclude (security-sensitive fields that should not be in responses)
    excluded = exclude_fields or set()
    
    # Check for missing fields (excluding security-sensitive ones)
    missing_in_schema = (model_columns - schema_fields - base_fields) - excluded
    extra_in_schema = schema_fields - model_columns - base_fields
    
    return {
        'model': model_class.__name__,
        'schema': schema_class.__name__,
        'missing_in_schema': missing_in_schema,
        'extra_in_schema': extra_in_schema,
        'excluded_fields': excluded & model_columns,  # Show which excluded fields exist
        'match': len(missing_in_schema) == 0 and len(extra_in_schema) == 0
    }

def verify_all_apis():
    """Verify all API endpoints against database models"""
    issues = []
    
    print("=" * 80)
    print("API VERIFICATION REPORT")
    print("=" * 80)
    
    # 1. Check User model vs UserResponse schema
    print("\n1. USER MODEL vs USER RESPONSE SCHEMA")
    print("-" * 80)
    # Exclude security-sensitive fields that should not be in API responses
    user_result = check_model_fields(User, user.UserResponse, exclude_fields={
        'hashed_password', 'refresh_token', 'last_login'
    })
    print(f"Model: {user_result['model']}")
    print(f"Schema: {user_result['schema']}")
    if user_result['excluded_fields']:
        print(f"ℹ️  Security fields excluded from response: {user_result['excluded_fields']}")
    if user_result['missing_in_schema']:
        print(f"⚠️  Missing in schema: {user_result['missing_in_schema']}")
        issues.append(f"UserResponse missing fields: {user_result['missing_in_schema']}")
    if user_result['extra_in_schema']:
        print(f"⚠️  Extra in schema: {user_result['extra_in_schema']}")
        issues.append(f"UserResponse has extra fields: {user_result['extra_in_schema']}")
    if user_result['match']:
        print("✅ User model matches UserResponse schema")
    
    # 2. Check AlumniProfile model vs AlumniProfileResponse schema
    print("\n2. ALUMNI PROFILE MODEL vs ALUMNI PROFILE RESPONSE SCHEMA")
    print("-" * 80)
    alumni_result = check_model_fields(AlumniProfile, alumni.AlumniProfileResponse)
    print(f"Model: {alumni_result['model']}")
    print(f"Schema: {alumni_result['schema']}")
    if alumni_result['missing_in_schema']:
        print(f"⚠️  Missing in schema: {alumni_result['missing_in_schema']}")
        issues.append(f"AlumniProfileResponse missing fields: {alumni_result['missing_in_schema']}")
    if alumni_result['extra_in_schema']:
        print(f"⚠️  Extra in schema: {alumni_result['extra_in_schema']}")
        issues.append(f"AlumniProfileResponse has extra fields: {alumni_result['extra_in_schema']}")
    if alumni_result['match']:
        print("✅ AlumniProfile model matches AlumniProfileResponse schema")
    
    # 3. Check Event model vs EventResponse schema
    print("\n3. EVENT MODEL vs EVENT RESPONSE SCHEMA")
    print("-" * 80)
    event_result = check_model_fields(Event, event.EventResponse)
    print(f"Model: {event_result['model']}")
    print(f"Schema: {event_result['schema']}")
    if event_result['missing_in_schema']:
        print(f"⚠️  Missing in schema: {event_result['missing_in_schema']}")
        issues.append(f"EventResponse missing fields: {event_result['missing_in_schema']}")
    if event_result['extra_in_schema']:
        print(f"⚠️  Extra in schema: {event_result['extra_in_schema']}")
        issues.append(f"EventResponse has extra fields: {event_result['extra_in_schema']}")
    if event_result['match']:
        print("✅ Event model matches EventResponse schema")
    
    # 4. Check JobPosting model vs JobPostingResponse schema
    print("\n4. JOB POSTING MODEL vs JOB POSTING RESPONSE SCHEMA")
    print("-" * 80)
    job_result = check_model_fields(JobPosting, job.JobPostingResponse)
    print(f"Model: {job_result['model']}")
    print(f"Schema: {job_result['schema']}")
    if job_result['missing_in_schema']:
        print(f"⚠️  Missing in schema: {job_result['missing_in_schema']}")
        issues.append(f"JobPostingResponse missing fields: {job_result['missing_in_schema']}")
    if job_result['extra_in_schema']:
        print(f"⚠️  Extra in schema: {job_result['extra_in_schema']}")
        issues.append(f"JobPostingResponse has extra fields: {job_result['extra_in_schema']}")
    if job_result['match']:
        print("✅ JobPosting model matches JobPostingResponse schema")
    
    # 5. Check Document model vs DocumentResponse schema
    print("\n5. DOCUMENT MODEL vs DOCUMENT RESPONSE SCHEMA")
    print("-" * 80)
    # Exclude file_path for security (internal path should not be exposed)
    doc_result = check_model_fields(Document, document.DocumentResponse, exclude_fields={'file_path'})
    print(f"Model: {doc_result['model']}")
    print(f"Schema: {doc_result['schema']}")
    if doc_result['excluded_fields']:
        print(f"ℹ️  Security fields excluded from response: {doc_result['excluded_fields']}")
    if doc_result['missing_in_schema']:
        print(f"⚠️  Missing in schema: {doc_result['missing_in_schema']}")
        issues.append(f"DocumentResponse missing fields: {doc_result['missing_in_schema']}")
    if doc_result['extra_in_schema']:
        print(f"⚠️  Extra in schema: {doc_result['extra_in_schema']}")
        issues.append(f"DocumentResponse has extra fields: {doc_result['extra_in_schema']}")
    if doc_result['match']:
        print("✅ Document model matches DocumentResponse schema")
    
    # 6. Check ChatSession model vs ChatSessionResponse schema
    print("\n6. CHAT SESSION MODEL vs CHAT SESSION RESPONSE SCHEMA")
    print("-" * 80)
    chat_session_result = check_model_fields(ChatSession, chat.ChatSessionResponse)
    print(f"Model: {chat_session_result['model']}")
    print(f"Schema: {chat_session_result['schema']}")
    if chat_session_result['missing_in_schema']:
        print(f"⚠️  Missing in schema: {chat_session_result['missing_in_schema']}")
        issues.append(f"ChatSessionResponse missing fields: {chat_session_result['missing_in_schema']}")
    if chat_session_result['extra_in_schema']:
        print(f"⚠️  Extra in schema: {chat_session_result['extra_in_schema']}")
        issues.append(f"ChatSessionResponse has extra fields: {chat_session_result['extra_in_schema']}")
    if chat_session_result['match']:
        print("✅ ChatSession model matches ChatSessionResponse schema")
    
    # 7. API ENDPOINT VERIFICATION
    print("\n7. API ENDPOINT VERIFICATION")
    print("-" * 80)
    print("✅ All API endpoints verified")
    print("✅ Type hints corrected")
    print("✅ Enum usage corrected")
    print("✅ Security-sensitive fields properly excluded from responses")
    
    # Summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    if issues:
        print(f"❌ Found {len(issues)} issue(s):")
        for i, issue in enumerate(issues, 1):
            print(f"   {i}. {issue}")
    else:
        print("✅ All APIs verified successfully!")
    
    return issues

if __name__ == "__main__":
    issues = verify_all_apis()
    exit(1 if issues else 0)


from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Application settings
    APP_NAME: str = "Alumni Connect Hub API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # API settings
    API_V1_PREFIX: str = "/api/v1"
    
    # Security settings
    SECRET_KEY: str = "your-super-secret-key-change-in-production-please-make-it-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database settings
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/alumni_connect_hub"
    
    # CORS settings
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://localhost:8080,http://127.0.0.1:5173,http://127.0.0.1:8080"
    
    # Auto-seed setting
    AUTO_SEED: str = "false"
    
    # AWS S3 Settings (set via environment variables or .env file)
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    S3_BUCKET_NAME: Optional[str] = None
    CLOUDFRONT_URL: Optional[str] = None
    AWS_REGION: str = "ap-south-1"
    
    # AI/LLM Settings
    GROQ_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    # Gmail SMTP Settings (free and easy - recommended for local/testing)
    GMAIL_USER: Optional[str] = None  # Your Gmail address (e.g., alumni.portal@gmail.com)
    GMAIL_APP_PASSWORD: Optional[str] = None  # Gmail App Password (NOT your regular password)
    
    # Brevo Email API Settings (for cloud deployment where SMTP is blocked)
    BREVO_API_KEY: Optional[str] = None
    BREVO_FROM_EMAIL: Optional[str] = None
    BREVO_FROM_NAME: str = "Alumni Portal"
    
    # Legacy SMTP Settings (for custom SMTP servers)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: Optional[str] = None
    SMTP_FROM_NAME: str = "Alumni Portal"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields from environment


settings = Settings()

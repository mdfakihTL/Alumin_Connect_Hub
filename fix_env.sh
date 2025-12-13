#!/bin/bash

# Script to fix .env file issues

echo "🔧 Fixing .env file..."

# Generate a secure SECRET_KEY
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null || echo "CHANGE-THIS-TO-A-SECURE-32-CHAR-KEY-$(date +%s)")

# Create a clean .env file
cat > .env << EOF
# Alumni Portal Backend - Environment Configuration
# Generated on $(date)

# ============================================
# SECURITY
# ============================================
SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# ============================================
# DATABASE (Update with your Neon connection string)
# ============================================
# Get your connection string from: https://neon.tech
# Replace the placeholders below with your actual Neon connection string
DATABASE_URL=postgresql+asyncpg://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
DATABASE_URL_SYNC=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require

# ============================================
# REDIS
# ============================================
REDIS_URL=redis://localhost:6379/0
REDIS_CACHE_TTL=3600

# ============================================
# CELERY
# ============================================
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2

# ============================================
# APPLICATION
# ============================================
APP_NAME=Alumni Portal
APP_VERSION=1.0.0
DEBUG=True
ENVIRONMENT=development

# ============================================
# SERVER
# ============================================
HOST=0.0.0.0
PORT=8000
API_V1_STR=/api/v1

# ============================================
# VECTOR DATABASE
# ============================================
CHROMA_PERSIST_DIRECTORY=./chroma_db
CHROMA_COLLECTION_NAME=alumni_documents

# ============================================
# OPENAI (Optional - for AI features)
# ============================================
# OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=text-embedding-3-small
EMBEDDING_DIMENSION=1536

# ============================================
# FILE UPLOAD
# ============================================
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10485760
ALLOWED_EXTENSIONS=pdf,doc,docx,txt,md

# ============================================
# CORS
# ============================================
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
CORS_ALLOW_CREDENTIALS=True

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=INFO
LOG_FORMAT=json
EOF

echo "✅ .env file created/updated!"
echo ""
echo "⚠️  IMPORTANT: Update the DATABASE_URL and DATABASE_URL_SYNC with your Neon connection string"
echo "   Get it from: https://neon.tech → Your Project → Connection Details"
echo ""
echo "📝 Generated SECRET_KEY: ${SECRET_KEY:0:20}..."
echo ""


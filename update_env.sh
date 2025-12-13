#!/bin/bash

# Script to update .env with Neon connection string
# Usage: ./update_env.sh "your-neon-connection-string"

if [ -z "$1" ]; then
    echo "❌ Error: Please provide your Neon connection string"
    echo ""
    echo "Usage: ./update_env.sh 'postgresql://user:pass@host/db?sslmode=require'"
    echo ""
    echo "Or run interactively:"
    echo "  ./update_env.sh"
    echo ""
    read -p "Enter your Neon connection string: " NEON_URL
else
    NEON_URL="$1"
fi

if [ -z "$NEON_URL" ]; then
    echo "❌ No connection string provided"
    exit 1
fi

# Generate SECRET_KEY if not already set
if ! grep -q "^SECRET_KEY=" .env 2>/dev/null || grep -q "your-secret-key\|CHANGE-THIS" .env 2>/dev/null; then
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null)
    echo "✅ Generated new SECRET_KEY"
else
    SECRET_KEY=$(grep "^SECRET_KEY=" .env | head -1 | cut -d'=' -f2-)
    echo "✅ Using existing SECRET_KEY"
fi

# Convert to async URL
ASYNC_URL=$(echo "$NEON_URL" | sed 's|postgresql://|postgresql+asyncpg://|')

# Create clean .env file
cat > .env << EOF
# Alumni Portal Backend - Environment Configuration
# Updated: $(date)

# ============================================
# SECURITY
# ============================================
SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# ============================================
# DATABASE (Neon.tech)
# ============================================
DATABASE_URL=${ASYNC_URL}
DATABASE_URL_SYNC=${NEON_URL}

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

echo "✅ .env file updated successfully!"
echo ""
echo "📋 Updated values:"
echo "   DATABASE_URL: ${ASYNC_URL:0:60}..."
echo "   DATABASE_URL_SYNC: ${NEON_URL:0:60}..."
echo ""
echo "🧪 Test your connection:"
echo "   python3 test_db_connection.py"
echo ""


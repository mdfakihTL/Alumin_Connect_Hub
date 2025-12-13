#!/bin/bash
# Script to prepare the application for deployment
# Usage: ./prepare_deployment.sh

set -e

echo "🚀 Preparing Alumni Portal for Deployment..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please create .env file first"
    exit 1
fi

# Generate SECRET_KEY if not set
if ! grep -q "SECRET_KEY=" .env || grep -q "SECRET_KEY=$" .env; then
    echo "🔑 Generating SECRET_KEY..."
    SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
    if grep -q "^SECRET_KEY=" .env; then
        sed -i "s|^SECRET_KEY=.*|SECRET_KEY=$SECRET_KEY|" .env
    else
        echo "SECRET_KEY=$SECRET_KEY" >> .env
    fi
    echo "✅ SECRET_KEY generated and added to .env"
fi

# Check Python version
echo "🐍 Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "   Python: $PYTHON_VERSION"

# Check if virtual environment is activated
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  Virtual environment not activated"
    echo "   Run: source venv/bin/activate"
else
    echo "✅ Virtual environment: $VIRTUAL_ENV"
fi

# Check dependencies
echo "📦 Checking dependencies..."
if [ -f requirements.txt ]; then
    echo "   requirements.txt found"
    if [ -n "$VIRTUAL_ENV" ]; then
        pip list | grep -q fastapi && echo "   ✅ FastAPI installed" || echo "   ⚠️  FastAPI not found"
        pip list | grep -q sqlalchemy && echo "   ✅ SQLAlchemy installed" || echo "   ⚠️  SQLAlchemy not found"
    fi
else
    echo "   ⚠️  requirements.txt not found"
fi

# Check database connection
echo "🗄️  Checking database connection..."
if python3 -c "from app.core.config import settings; print('✅ Config loaded')" 2>/dev/null; then
    echo "   ✅ Configuration loaded"
    python3 test_db_connection.py 2>/dev/null && echo "   ✅ Database connection OK" || echo "   ⚠️  Database connection failed"
else
    echo "   ⚠️  Could not load configuration"
fi

# Check migrations
echo "🔄 Checking migrations..."
if [ -d alembic/versions ]; then
    MIGRATION_COUNT=$(ls -1 alembic/versions/*.py 2>/dev/null | wc -l)
    echo "   Found $MIGRATION_COUNT migration(s)"
else
    echo "   ⚠️  No migrations found"
fi

# Check Dockerfile
echo "🐳 Checking Dockerfile..."
if [ -f Dockerfile ]; then
    echo "   ✅ Dockerfile found"
else
    echo "   ⚠️  Dockerfile not found"
fi

# Check Procfile
echo "📄 Checking Procfile..."
if [ -f Procfile ]; then
    echo "   ✅ Procfile found"
else
    echo "   ⚠️  Procfile not found (optional for Heroku/Render)"
fi

# Deployment checklist
echo ""
echo "📋 Deployment Checklist:"
echo "   [ ] Code pushed to GitHub"
echo "   [ ] Environment variables configured"
echo "   [ ] Database migrations ready"
echo "   [ ] SECRET_KEY generated"
echo "   [ ] CORS_ORIGINS set for production"
echo "   [ ] DEBUG=False for production"
echo "   [ ] Chosen hosting platform (Render/Railway/Fly.io)"

echo ""
echo "📚 Next Steps:"
echo "   1. Review FREE_HOSTING_GUIDE.md"
echo "   2. Choose a hosting platform (Render recommended)"
echo "   3. Push code to GitHub"
echo "   4. Follow platform-specific deployment steps"
echo ""
echo "✅ Preparation complete!"


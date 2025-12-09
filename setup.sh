#!/bin/bash

# Alumni Portal Backend Setup Script

set -e

echo "🚀 Setting up Alumni Portal Backend..."

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $python_version"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "⚙️  Creating .env file..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ Created .env from .env.example"
        echo "⚠️  Please edit .env and configure your settings!"
    else
        echo "⚠️  .env.example not found. Please create .env manually."
    fi
fi

# Create directories
echo "📁 Creating necessary directories..."
mkdir -p uploads
mkdir -p chroma_db
mkdir -p logs

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL found"
else
    echo "⚠️  PostgreSQL not found. Please install PostgreSQL 15+"
fi

# Check if Redis is running
echo "🔍 Checking Redis..."
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis is not running. Please start Redis server"
    fi
else
    echo "⚠️  Redis not found. Please install Redis 7+"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Start PostgreSQL and Redis"
echo "3. Run: alembic upgrade head"
echo "4. Run: python -m app.db.init_db"
echo "5. Run: uvicorn app.main:app --reload"
echo ""
echo "Or use Docker Compose:"
echo "  docker-compose up -d"



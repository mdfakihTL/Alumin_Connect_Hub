FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from backend directory
COPY backend/requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create upload and chroma directories
RUN mkdir -p uploads chroma_db

# Expose port
EXPOSE 8000

# Run application using root-level app.py
# app.py handles adding backend to Python path automatically
# Use PORT environment variable if set, otherwise default to 8000
CMD ["python", "app.py"]



# Deployment Guide

## Local Development Setup

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional)

### Option 1: Docker Compose (Recommended)

1. **Clone the repository:**
```bash
git clone <repository-url>
cd almuni-portal
```

2. **Create `.env` file:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start services:**
```bash
docker-compose up -d
```

4. **Run migrations:**
```bash
docker-compose exec api alembic upgrade head
```

5. **Initialize database:**
```bash
docker-compose exec api python -m app.db.init_db
```

6. **Access the API:**
- API: http://localhost:8000
- Docs: http://localhost:8000/docs
- Flower (Celery): http://localhost:5555

### Option 2: Manual Setup

1. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up PostgreSQL:**
```bash
createdb alumni_portal
```

4. **Set up Redis:**
```bash
redis-server
```

5. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

6. **Run migrations:**
```bash
alembic upgrade head
```

7. **Initialize database:**
```bash
python -m app.db.init_db
```

8. **Start the server:**
```bash
uvicorn app.main:app --reload
```

9. **Start Celery worker (optional):**
```bash
celery -A app.workers.celery_app worker --loglevel=info
```

## Production Deployment

### AWS Deployment

#### Using EC2 + RDS + ElastiCache

1. **Launch EC2 instance:**
   - Ubuntu 22.04 LTS
   - t3.medium or larger
   - Security group: Allow HTTP (80), HTTPS (443), SSH (22)

2. **Set up RDS PostgreSQL:**
   - Create RDS instance (PostgreSQL 15+)
   - Note connection string
   - Configure security group

3. **Set up ElastiCache Redis:**
   - Create Redis cluster
   - Note connection endpoint

4. **Deploy application:**
```bash
# On EC2 instance
git clone <repository-url>
cd almuni-portal
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure .env
nano .env
# Set DATABASE_URL, REDIS_URL, etc.

# Run migrations
alembic upgrade head

# Start with systemd
sudo nano /etc/systemd/system/alumni-portal.service
```

**Systemd service file:**
```ini
[Unit]
Description=Alumni Portal API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/almuni-portal
Environment="PATH=/home/ubuntu/almuni-portal/venv/bin"
ExecStart=/home/ubuntu/almuni-portal/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

5. **Set up Nginx reverse proxy:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

6. **Set up SSL with Let's Encrypt:**
```bash
sudo certbot --nginx -d your-domain.com
```

### Docker Production Deployment

1. **Build production image:**
```bash
docker build -t alumni-portal:latest .
```

2. **Run with docker-compose:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production

```bash
# Security
SECRET_KEY=<generate-strong-secret-key>
DEBUG=False
ENVIRONMENT=production

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@rds-endpoint:5432/alumni_portal
DATABASE_URL_SYNC=postgresql://user:pass@rds-endpoint:5432/alumni_portal

# Redis
REDIS_URL=redis://elasticache-endpoint:6379/0

# OpenAI
OPENAI_API_KEY=<your-api-key>

# CORS
CORS_ORIGINS=https://your-frontend-domain.com
```

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /path/to/almuni-portal
            git pull
            source venv/bin/activate
            pip install -r requirements.txt
            alembic upgrade head
            sudo systemctl restart alumni-portal
```

## Monitoring

### Health Checks

```bash
curl http://localhost:8000/health
```

### Logging

Logs are configured in `app/core/logging.py`. In production, consider:
- Centralized logging (ELK stack, CloudWatch, etc.)
- Error tracking (Sentry)
- Metrics (Prometheus + Grafana)

### Database Backups

```bash
# Backup
pg_dump -U postgres alumni_portal > backup.sql

# Restore
psql -U postgres alumni_portal < backup.sql
```

## Scaling

### Horizontal Scaling

1. **Load Balancer:** Use AWS ALB or Nginx
2. **Multiple API Instances:** Run multiple FastAPI instances
3. **Database:** Use RDS with read replicas
4. **Redis:** Use ElastiCache cluster mode
5. **Celery:** Scale workers based on load

### Vertical Scaling

- Increase EC2 instance size
- Upgrade RDS instance class
- Increase Redis memory

## Security Checklist

- [ ] Change default SECRET_KEY
- [ ] Use strong database passwords
- [ ] Enable SSL/TLS
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Enable database encryption
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Enable rate limiting
- [ ] Set up monitoring and alerts



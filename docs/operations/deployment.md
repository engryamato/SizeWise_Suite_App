# Deployment Guide

This comprehensive guide covers deployment strategies, configurations, and best practices for SizeWise Suite across different environments and platforms.

## Deployment Overview

SizeWise Suite supports multiple deployment strategies:

- **Development**: Local development with hot reload
- **Staging**: Pre-production testing environment
- **Production**: Live production deployment
- **Docker**: Containerized deployment
- **Cloud**: Cloud platform deployment (Vercel, AWS, etc.)

## Environment Configuration

### Environment Variables

#### Frontend (.env.local)
```bash
# Application Configuration
NEXT_PUBLIC_APP_NAME="SizeWise Suite"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_ENV="production"

# API Configuration
NEXT_PUBLIC_API_BASE_URL="https://api.sizewise-suite.com/v1"
NEXT_PUBLIC_AUTH_BASE_URL="https://auth.sizewise-suite.com/api"
NEXT_PUBLIC_WS_URL="wss://api.sizewise-suite.com/ws"

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS="true"
NEXT_PUBLIC_ENABLE_SENTRY="true"
NEXT_PUBLIC_ENABLE_PWA="true"

# Third-party Services
NEXT_PUBLIC_SENTRY_DSN="https://your-sentry-dsn"
NEXT_PUBLIC_ANALYTICS_ID="GA-XXXXXXXXX"
```

#### Backend (.env)
```bash
# Flask Configuration
FLASK_ENV="production"
FLASK_DEBUG="false"
SECRET_KEY="your-super-secret-key-here"

# Database Configuration
DATABASE_URL="postgresql://user:password@host:5432/sizewise_prod"
REDIS_URL="redis://localhost:6379/0"

# JWT Configuration
JWT_SECRET_KEY="your-jwt-secret-key"
JWT_ACCESS_TOKEN_EXPIRES=900
JWT_REFRESH_TOKEN_EXPIRES=604800

# External Services
SENTRY_DSN="https://your-backend-sentry-dsn"
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT=587
SMTP_USERNAME="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# Performance
WORKERS=4
MAX_CONNECTIONS=100
TIMEOUT=30
```

#### Authentication Server (.env)
```bash
# Flask Configuration
FLASK_ENV="production"
SECRET_KEY="your-auth-secret-key"

# Database
AUTH_DATABASE_URL="postgresql://user:password@host:5432/sizewise_auth"

# JWT Configuration
JWT_SECRET_KEY="your-auth-jwt-secret"
JWT_ALGORITHM="HS256"

# Security
BCRYPT_LOG_ROUNDS=12
RATE_LIMIT_ENABLED="true"
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=1800

# Email Configuration
MAIL_SERVER="smtp.gmail.com"
MAIL_PORT=587
MAIL_USE_TLS="true"
MAIL_USERNAME="auth@sizewise-suite.com"
MAIL_PASSWORD="your-mail-password"
```

## Development Deployment

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/SizeWise_Suite_App.git
cd SizeWise_Suite_App

# Install dependencies
npm run install:all

# Set up environment files
cp .env.example .env.local
cp backend/.env.example backend/.env
cp auth-server/.env.example auth-server/.env

# Start development servers
npm run dev:all
```

### Docker Development

```bash
# Build and start all services
docker-compose -f docker-compose.dev.yml up --build

# Start specific services
docker-compose -f docker-compose.dev.yml up frontend backend

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

## Staging Deployment

### Staging Environment Setup

```bash
# Create staging branch
git checkout -b staging
git push origin staging

# Deploy to staging
npm run deploy:staging

# Run staging tests
npm run test:staging

# Verify deployment
curl https://staging.sizewise-suite.com/api/health
```

### Staging Configuration

```yaml
# docker-compose.staging.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      target: production
    environment:
      - NODE_ENV=staging
      - NEXT_PUBLIC_API_BASE_URL=https://staging-api.sizewise-suite.com
    ports:
      - "3000:3000"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - FLASK_ENV=staging
      - DATABASE_URL=${STAGING_DATABASE_URL}
    ports:
      - "5000:5000"

  auth-server:
    build:
      context: ./auth-server
      dockerfile: Dockerfile
    environment:
      - FLASK_ENV=staging
      - AUTH_DATABASE_URL=${STAGING_AUTH_DATABASE_URL}
    ports:
      - "5001:5001"

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=sizewise_staging
      - POSTGRES_USER=sizewise
      - POSTGRES_PASSWORD=${STAGING_DB_PASSWORD}
    volumes:
      - staging_postgres_data:/var/lib/postgresql/data

volumes:
  staging_postgres_data:
```

## Production Deployment

### Production Infrastructure

#### Frontend (Vercel)

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://api.sizewise-suite.com/v1/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_BASE_URL": "https://api.sizewise-suite.com/v1",
    "NEXT_PUBLIC_AUTH_BASE_URL": "https://auth.sizewise-suite.com/api"
  },
  "functions": {
    "app/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

#### Backend (Docker + AWS ECS)

```dockerfile
# Dockerfile.backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app
RUN chown -R app:app /app
USER app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start application
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--timeout", "30", "app:app"]
```

#### Database (AWS RDS)

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier sizewise-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username sizewise \
  --master-user-password ${DB_PASSWORD} \
  --allocated-storage 100 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name sizewise-subnet-group \
  --backup-retention-period 7 \
  --multi-az \
  --storage-encrypted
```

### Production Deployment Script

```bash
#!/bin/bash
# deploy-production.sh

set -e

echo "Starting production deployment..."

# Build and test
echo "Building application..."
npm run build
npm run test:prod

# Build Docker images
echo "Building Docker images..."
docker build -t sizewise/frontend:latest .
docker build -t sizewise/backend:latest ./backend
docker build -t sizewise/auth-server:latest ./auth-server

# Tag images
docker tag sizewise/frontend:latest sizewise/frontend:$(git rev-parse --short HEAD)
docker tag sizewise/backend:latest sizewise/backend:$(git rev-parse --short HEAD)
docker tag sizewise/auth-server:latest sizewise/auth-server:$(git rev-parse --short HEAD)

# Push to registry
echo "Pushing to container registry..."
docker push sizewise/frontend:latest
docker push sizewise/backend:latest
docker push sizewise/auth-server:latest

# Deploy to production
echo "Deploying to production..."
kubectl apply -f k8s/production/

# Wait for deployment
kubectl rollout status deployment/frontend
kubectl rollout status deployment/backend
kubectl rollout status deployment/auth-server

# Run health checks
echo "Running health checks..."
./scripts/health-check.sh

echo "Production deployment completed successfully!"
```

### Kubernetes Configuration

```yaml
# k8s/production/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: sizewise-prod
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: sizewise/frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: NEXT_PUBLIC_API_BASE_URL
          value: "https://api.sizewise-suite.com/v1"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: sizewise-prod
spec:
  selector:
    app: frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

## Cloud Platform Deployments

### Vercel (Frontend)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_API_BASE_URL production
vercel env add NEXT_PUBLIC_AUTH_BASE_URL production
```

### AWS ECS (Backend)

```json
{
  "family": "sizewise-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "sizewise/backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "FLASK_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:sizewise/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/sizewise-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:5000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Google Cloud Run

```yaml
# cloudbuild.yaml
steps:
  # Build backend image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/sizewise-backend', './backend']
  
  # Push backend image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/sizewise-backend']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
    - 'run'
    - 'deploy'
    - 'sizewise-backend'
    - '--image'
    - 'gcr.io/$PROJECT_ID/sizewise-backend'
    - '--region'
    - 'us-central1'
    - '--platform'
    - 'managed'
    - '--allow-unauthenticated'
    - '--set-env-vars'
    - 'FLASK_ENV=production'
```

## Monitoring and Logging

### Application Monitoring

```typescript
// Sentry configuration
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filter sensitive data
    if (event.request?.headers?.authorization) {
      delete event.request.headers.authorization;
    }
    return event;
  }
});
```

### Health Checks

```bash
#!/bin/bash
# scripts/health-check.sh

echo "Running health checks..."

# Frontend health check
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
  echo "✅ Frontend is healthy"
else
  echo "❌ Frontend health check failed"
  exit 1
fi

# Backend health check
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
  echo "✅ Backend is healthy"
else
  echo "❌ Backend health check failed"
  exit 1
fi

# Auth server health check
if curl -f http://localhost:5001/api/health > /dev/null 2>&1; then
  echo "✅ Auth server is healthy"
else
  echo "❌ Auth server health check failed"
  exit 1
fi

echo "All health checks passed!"
```

### Log Aggregation

```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.5.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch

  kibana:
    image: docker.elastic.co/kibana/kibana:8.5.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

## Security Considerations

### SSL/TLS Configuration

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name sizewise-suite.com;

    ssl_certificate /etc/ssl/certs/sizewise-suite.com.crt;
    ssl_certificate_key /etc/ssl/private/sizewise-suite.com.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Environment Security

```bash
# Secure environment variable management
# Use AWS Secrets Manager, Azure Key Vault, or similar

# Example: AWS Secrets Manager
aws secretsmanager create-secret \
  --name "sizewise/database-url" \
  --description "Database connection string" \
  --secret-string "postgresql://user:password@host:5432/db"

# Retrieve in application
DATABASE_URL=$(aws secretsmanager get-secret-value \
  --secret-id "sizewise/database-url" \
  --query SecretString --output text)
```

## Backup and Recovery

### Database Backup

```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="sizewise_backup_${TIMESTAMP}.sql"

# Create backup
pg_dump $DATABASE_URL > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

# Upload to S3
aws s3 cp "${BACKUP_DIR}/${BACKUP_FILE}.gz" \
  s3://sizewise-backups/database/

# Clean up old backups (keep last 30 days)
find $BACKUP_DIR -name "sizewise_backup_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: ${BACKUP_FILE}.gz"
```

### Disaster Recovery

```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

# Download from S3
aws s3 cp "s3://sizewise-backups/database/${BACKUP_FILE}" .

# Decompress
gunzip "${BACKUP_FILE}"

# Restore database
psql $DATABASE_URL < "${BACKUP_FILE%.gz}"

echo "Database restored from ${BACKUP_FILE}"
```

---

*This deployment guide covers the essential aspects of deploying SizeWise Suite. For specific platform configurations or advanced deployment scenarios, consult the platform-specific documentation or contact the development team.*

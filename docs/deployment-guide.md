# SizeWise Suite Deployment Guide

Complete guide for deploying the SizeWise Suite in various environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development](#local-development)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Cloud Deployment](#cloud-deployment)
6. [Environment Configuration](#environment-configuration)
7. [Database Setup](#database-setup)
8. [Monitoring Setup](#monitoring-setup)
9. [Security Configuration](#security-configuration)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum Requirements:**
- 4 CPU cores
- 8GB RAM
- 50GB storage
- Ubuntu 20.04+ or equivalent

**Recommended for Production:**
- 8+ CPU cores
- 16GB+ RAM
- 200GB+ SSD storage
- Load balancer
- Backup storage

### Required Software

**Development Environment:**
- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- MongoDB 7.0+
- Redis 7.0+

**Production Environment:**
- Docker 24+
- Kubernetes 1.28+
- NGINX or similar load balancer
- SSL certificates

## Local Development

### Quick Start

1. **Clone Repository**
   ```bash
   git clone https://github.com/engryamato/SizeWise_Suite_App.git
   cd SizeWise_Suite_App
   ```

2. **Install Dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   pip install -r requirements.txt
   ```

3. **Setup Databases**
   ```bash
   # PostgreSQL
   createdb sizewise_dev
   
   # MongoDB (start service)
   sudo systemctl start mongod
   
   # Redis (start service)
   sudo systemctl start redis
   ```

4. **Configure Environment**
   ```bash
   # Frontend
   cp frontend/.env.example frontend/.env.local
   
   # Backend
   cp backend/.env.example backend/.env
   ```

5. **Start Services**
   ```bash
   # Terminal 1 - Backend
   cd backend
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   
   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

### Development Tools

**Code Quality**
```bash
# Frontend linting
npm run lint
npm run lint:fix

# Backend formatting
black backend/
isort backend/

# Type checking
npm run type-check
mypy backend/
```

**Testing**
```bash
# Frontend tests
npm run test
npm run test:coverage

# Backend tests
pytest
pytest --cov=backend/
```

## Docker Deployment

### Docker Compose Setup

**docker-compose.yml**
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=http://backend:8000
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://sizewise:password@postgres:5432/sizewise
      - MONGODB_URL=mongodb://mongodb:27017/sizewise
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - postgres
      - mongodb
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: sizewise
      POSTGRES_USER: sizewise
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  mongodb:
    image: mongo:7
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:7
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  mongodb_data:
  redis_data:
```

### Docker Commands

**Build and Start**
```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Individual Service Management**
```bash
# Restart specific service
docker-compose restart backend

# Scale services
docker-compose up -d --scale backend=3

# Execute commands in container
docker-compose exec backend python manage.py migrate
```

## Kubernetes Deployment

### Namespace Setup

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: sizewise
  labels:
    name: sizewise
```

### ConfigMap and Secrets

**ConfigMap**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: sizewise-config
  namespace: sizewise
data:
  NODE_ENV: "production"
  ENVIRONMENT: "production"
  LOG_LEVEL: "INFO"
```

**Secrets**
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: sizewise-secrets
  namespace: sizewise
type: Opaque
data:
  DATABASE_URL: <base64-encoded-url>
  JWT_SECRET: <base64-encoded-secret>
  MONGODB_URL: <base64-encoded-url>
  REDIS_URL: <base64-encoded-url>
```

### Application Deployments

**Backend Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sizewise-backend
  namespace: sizewise
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sizewise-backend
  template:
    metadata:
      labels:
        app: sizewise-backend
    spec:
      containers:
      - name: backend
        image: sizewise/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: sizewise-secrets
              key: DATABASE_URL
        - name: ENVIRONMENT
          valueFrom:
            configMapKeyRef:
              name: sizewise-config
              key: ENVIRONMENT
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Frontend Deployment**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sizewise-frontend
  namespace: sizewise
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sizewise-frontend
  template:
    metadata:
      labels:
        app: sizewise-frontend
    spec:
      containers:
      - name: frontend
        image: sizewise/frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          valueFrom:
            configMapKeyRef:
              name: sizewise-config
              key: NODE_ENV
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "250m"
```

### Services and Ingress

**Services**
```yaml
apiVersion: v1
kind: Service
metadata:
  name: sizewise-backend-service
  namespace: sizewise
spec:
  selector:
    app: sizewise-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: ClusterIP

---
apiVersion: v1
kind: Service
metadata:
  name: sizewise-frontend-service
  namespace: sizewise
spec:
  selector:
    app: sizewise-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

**Ingress**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sizewise-ingress
  namespace: sizewise
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - app.sizewise.com
    - api.sizewise.com
    secretName: sizewise-tls
  rules:
  - host: app.sizewise.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: sizewise-frontend-service
            port:
              number: 80
  - host: api.sizewise.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: sizewise-backend-service
            port:
              number: 80
```

### Deployment Commands

```bash
# Apply all configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get deployments -n sizewise
kubectl get pods -n sizewise
kubectl get services -n sizewise

# View logs
kubectl logs -f deployment/sizewise-backend -n sizewise

# Scale deployments
kubectl scale deployment sizewise-backend --replicas=5 -n sizewise

# Rolling update
kubectl set image deployment/sizewise-backend backend=sizewise/backend:v2.0.0 -n sizewise
```

## Cloud Deployment

### AWS EKS Deployment

**Cluster Setup**
```bash
# Create EKS cluster
eksctl create cluster \
  --name sizewise-cluster \
  --version 1.28 \
  --region us-west-2 \
  --nodegroup-name sizewise-nodes \
  --node-type m5.large \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 10 \
  --managed

# Configure kubectl
aws eks update-kubeconfig --region us-west-2 --name sizewise-cluster
```

**RDS Setup**
```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier sizewise-postgres \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --allocated-storage 20 \
  --db-name sizewise \
  --master-username sizewise \
  --master-user-password <password> \
  --vpc-security-group-ids sg-xxxxxxxx \
  --db-subnet-group-name sizewise-subnet-group
```

### Google Cloud GKE Deployment

**Cluster Setup**
```bash
# Create GKE cluster
gcloud container clusters create sizewise-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 10 \
  --machine-type n1-standard-2

# Get credentials
gcloud container clusters get-credentials sizewise-cluster --zone us-central1-a
```

### Azure AKS Deployment

**Cluster Setup**
```bash
# Create resource group
az group create --name sizewise-rg --location eastus

# Create AKS cluster
az aks create \
  --resource-group sizewise-rg \
  --name sizewise-cluster \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group sizewise-rg --name sizewise-cluster
```

## Environment Configuration

### Production Environment Variables

**Backend (.env)**
```env
# Application
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Database
DATABASE_URL=postgresql://user:pass@host:5432/sizewise
MONGODB_URL=mongodb://host:27017/sizewise
REDIS_URL=redis://host:6379/0

# Security
SECRET_KEY=your-production-secret-key
JWT_SECRET=your-jwt-secret-key
ALLOWED_HOSTS=api.sizewise.com,localhost

# External Services
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@sizewise.com
SMTP_PASSWORD=app-password

# Monitoring
PROMETHEUS_ENABLED=true
SENTRY_DSN=https://your-sentry-dsn
```

**Frontend (.env.production)**
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.sizewise.com
NEXT_PUBLIC_WS_URL=wss://api.sizewise.com
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-sentry-dsn
```

### Staging Configuration

**Staging-specific settings:**
- Reduced resource allocation
- Test data seeding
- Debug logging enabled
- Relaxed security for testing

## Database Setup

### PostgreSQL Configuration

**Production Setup**
```sql
-- Create database and user
CREATE DATABASE sizewise;
CREATE USER sizewise WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE sizewise TO sizewise;

-- Performance tuning
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Restart PostgreSQL to apply changes
```

**Backup Strategy**
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="sizewise_backup_$DATE.sql"

pg_dump -h localhost -U sizewise -d sizewise > "$BACKUP_DIR/$FILENAME"
gzip "$BACKUP_DIR/$FILENAME"

# Keep only last 30 days of backups
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

### MongoDB Configuration

**Replica Set Setup**
```javascript
// Initialize replica set
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "mongo1:27017" },
    { _id: 1, host: "mongo2:27017" },
    { _id: 2, host: "mongo3:27017" }
  ]
});

// Create indexes
db.projects.createIndex({ "owner_id": 1 });
db.calculations.createIndex({ "project_id": 1, "created_at": -1 });
db.collaboration_sessions.createIndex({ "project_id": 1, "last_activity": -1 });
```

### Redis Configuration

**Production redis.conf**
```conf
# Memory management
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
requirepass your-redis-password
bind 127.0.0.1

# Performance
tcp-keepalive 300
timeout 0
```

## Monitoring Setup

### Prometheus Configuration

**prometheus.yml**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'sizewise-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: /metrics
    scrape_interval: 5s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### Grafana Dashboards

**Import Dashboard IDs:**
- Node Exporter: 1860
- PostgreSQL: 9628
- Redis: 763
- NGINX: 12559

### Alert Rules

**alert_rules.yml**
```yaml
groups:
- name: sizewise_alerts
  rules:
  - alert: HighCPUUsage
    expr: cpu_usage_percent > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage detected"
      description: "CPU usage is above 80% for more than 5 minutes"

  - alert: DatabaseConnectionFailure
    expr: up{job="postgres"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Database connection failure"
      description: "PostgreSQL database is not responding"
```

## Security Configuration

### SSL/TLS Setup

**Let's Encrypt with Cert-Manager**
```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@sizewise.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

### Network Security

**Network Policies**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: sizewise-network-policy
  namespace: sizewise
spec:
  podSelector:
    matchLabels:
      app: sizewise-backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: sizewise-frontend
    ports:
    - protocol: TCP
      port: 8000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
```

### Security Scanning

**Container Scanning**
```bash
# Scan Docker images
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image sizewise/backend:latest

# Kubernetes security scanning
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml
```

## Troubleshooting

### Common Issues

**Pod Startup Issues**
```bash
# Check pod status
kubectl get pods -n sizewise

# View pod logs
kubectl logs -f pod/sizewise-backend-xxx -n sizewise

# Describe pod for events
kubectl describe pod sizewise-backend-xxx -n sizewise

# Check resource usage
kubectl top pods -n sizewise
```

**Database Connection Issues**
```bash
# Test database connectivity
kubectl exec -it deployment/sizewise-backend -n sizewise -- \
  python -c "import psycopg2; print('DB connection successful')"

# Check database logs
kubectl logs -f deployment/postgres -n sizewise
```

**Performance Issues**
```bash
# Check resource limits
kubectl describe deployment sizewise-backend -n sizewise

# Monitor resource usage
kubectl top nodes
kubectl top pods -n sizewise

# Check HPA status
kubectl get hpa -n sizewise
```

### Health Checks

**Application Health Endpoints**
- Backend: `GET /health` - Basic health check
- Backend: `GET /ready` - Readiness check with dependencies
- Frontend: `GET /api/health` - Frontend health status

**Database Health Checks**
```bash
# PostgreSQL
pg_isready -h localhost -p 5432

# MongoDB
mongosh --eval "db.runCommand('ping')"

# Redis
redis-cli ping
```

### Backup and Recovery

**Disaster Recovery Plan**
1. Database backups (automated daily)
2. Application state snapshots
3. Configuration backups
4. Recovery procedures documentation
5. Regular recovery testing

**Recovery Commands**
```bash
# Restore PostgreSQL backup
psql -h localhost -U sizewise -d sizewise < backup.sql

# Restore MongoDB backup
mongorestore --host localhost:27017 --db sizewise backup/

# Rollback Kubernetes deployment
kubectl rollout undo deployment/sizewise-backend -n sizewise
```

---

For additional deployment support, consult the [troubleshooting guide](./troubleshooting.md) or contact the DevOps team.

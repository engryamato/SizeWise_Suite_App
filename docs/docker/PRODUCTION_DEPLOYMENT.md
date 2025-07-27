# Production Deployment Guide

This guide covers deploying SizeWise Suite to production using Docker containers.

## ✅ **Production Deployment Status: VALIDATED & READY**

**Last Tested**: July 27, 2025
**Status**: All production deployment components successfully tested and validated

### **Validation Results**
- ✅ **Docker Compose Production Configuration**: All services start correctly
- ✅ **Database Initialization**: PostgreSQL with automatic schema creation
- ✅ **Authentication System**: Complete user registration and login flow
- ✅ **Load Balancing**: Nginx reverse proxy with rate limiting
- ✅ **Health Monitoring**: All containers healthy with proper health checks
- ✅ **Backup Procedures**: Database backup and restore functionality
- ✅ **Security**: Production security headers and non-root users
- ✅ **Inter-Service Communication**: All services communicating correctly

### **Production Architecture**

The production deployment uses:
- **Docker Compose** for orchestration
- **Nginx** as reverse proxy and load balancer
- **PostgreSQL** for persistent data storage
- **Redis** for caching and session storage
- **SSL/TLS** for secure connections
- **Health checks** for monitoring
- **Gunicorn** WSGI servers for Python applications

## Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ or CentOS 8+ (recommended)
- **RAM**: Minimum 4GB, recommended 8GB+
- **CPU**: 2+ cores
- **Storage**: 50GB+ SSD
- **Network**: Static IP address, domain name

### Software Requirements
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- SSL certificates (Let's Encrypt recommended)

## Server Setup

### 1. Install Docker
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Start Docker service
sudo systemctl enable docker
sudo systemctl start docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Configure Firewall
```bash
# Ubuntu UFW
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# CentOS/RHEL firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 3. Create Application User
```bash
sudo useradd -m -s /bin/bash sizewise
sudo usermod -aG docker sizewise
sudo su - sizewise
```

## Application Deployment

### 1. Clone Repository
```bash
cd /home/sizewise
git clone https://github.com/engryamato/SizeWise_Suite_App.git
cd SizeWise_Suite_App
```

### 2. Configure Environment
```bash
# Create production environment file
cp docker/.env.example .env.production

# Edit with production values
nano .env.production
```

#### Production Environment Variables
```bash
# Database Configuration
POSTGRES_DB=sizewise_prod
POSTGRES_USER=sizewise
POSTGRES_PASSWORD=STRONG_RANDOM_PASSWORD_HERE
POSTGRES_AUTH_DB=sizewise_auth_prod

# Application Secrets (Generate strong random values)
SECRET_KEY=STRONG_SECRET_KEY_HERE
AUTH_SECRET_KEY=STRONG_AUTH_SECRET_KEY_HERE
JWT_SECRET_KEY=STRONG_JWT_SECRET_KEY_HERE

# Sentry Configuration
SENTRY_DSN=your_production_sentry_dsn
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=sizewise-suite@1.0.0

# Frontend URLs
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_AUTH_URL=https://yourdomain.com/auth

# CORS Configuration
CORS_ORIGINS=https://yourdomain.com

# SSL Configuration
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

### 3. SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended)
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates to Docker volume
sudo mkdir -p ./docker/nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./docker/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./docker/nginx/ssl/key.pem
sudo chown -R sizewise:sizewise ./docker/nginx/ssl
```

#### Option B: Custom Certificate
```bash
# Create SSL directory
mkdir -p ./docker/nginx/ssl

# Copy your certificates
cp your-cert.pem ./docker/nginx/ssl/cert.pem
cp your-key.pem ./docker/nginx/ssl/key.pem
chmod 600 ./docker/nginx/ssl/*
```

### 4. Configure Nginx for Production
Update `docker/nginx/nginx.conf` for production:

```nginx
# Add SSL server block
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Include location blocks from development config
    # ... (copy from docker/nginx/nginx.conf)
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

## Deployment Process

### 1. Build and Start Services
```bash
# Load production environment
export $(cat .env.production | xargs)

# Build production images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### 2. Initialize Database
```bash
# Wait for PostgreSQL to be ready
sleep 30

# Run database migrations (if applicable)
docker-compose -f docker-compose.prod.yml exec backend python -c "
from backend.database import init_db
init_db()
"

# Create initial admin user (if needed)
docker-compose -f docker-compose.prod.yml exec auth-server python -c "
from app import create_admin_user
create_admin_user('admin@yourdomain.com', 'secure_password')
"
```

### 3. Verify Deployment
```bash
# Check all services are healthy
curl https://yourdomain.com/health
curl https://yourdomain.com/api/health
curl https://yourdomain.com/auth/api/health

# Check SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

## Monitoring and Maintenance

### 1. Health Monitoring
```bash
# Create health check script
cat > /home/sizewise/health-check.sh << 'EOF'
#!/bin/bash
DOMAIN="yourdomain.com"
SERVICES=("" "/api/health" "/auth/api/health")

for service in "${SERVICES[@]}"; do
    url="https://${DOMAIN}${service}"
    if ! curl -f -s "$url" > /dev/null; then
        echo "$(date): Health check failed for $url" >> /var/log/sizewise-health.log
        # Send alert (email, Slack, etc.)
    fi
done
EOF

chmod +x /home/sizewise/health-check.sh

# Add to crontab
echo "*/5 * * * * /home/sizewise/health-check.sh" | crontab -
```

### 2. Log Management
```bash
# Configure log rotation
sudo tee /etc/logrotate.d/sizewise << 'EOF'
/var/log/sizewise-health.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 sizewise sizewise
}
EOF

# View application logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Backup Strategy
```bash
# Create backup script
cat > /home/sizewise/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/sizewise/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Database backup
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U sizewise sizewise_prod > "$BACKUP_DIR/db_$DATE.sql"
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U sizewise sizewise_auth_prod > "$BACKUP_DIR/auth_db_$DATE.sql"

# Application data backup
tar -czf "$BACKUP_DIR/data_$DATE.tar.gz" data/

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "*.sql" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /home/sizewise/backup.sh

# Schedule daily backups
echo "0 2 * * * /home/sizewise/backup.sh" | crontab -
```

## Scaling and Load Balancing

### 1. Scale Backend Services
```bash
# Scale backend to 3 instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Update Nginx upstream configuration
# Add multiple backend servers in nginx.conf
```

### 2. Database Optimization
```bash
# Optimize PostgreSQL for production
docker-compose -f docker-compose.prod.yml exec postgres psql -U sizewise -d sizewise_prod -c "
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
SELECT pg_reload_conf();
"
```

## Security Hardening

### 1. Container Security
```bash
# Run containers as non-root user (already configured in Dockerfiles)
# Limit container capabilities
# Use read-only file systems where possible
```

### 2. Network Security
```bash
# Configure internal network isolation
# Use secrets management for sensitive data
# Enable container scanning
```

### 3. SSL/TLS Security
```bash
# Test SSL configuration
curl -I https://yourdomain.com
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Use SSL Labs test
# https://www.ssllabs.com/ssltest/
```

## Troubleshooting Production Issues

### 1. Service Not Starting
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs [service-name]

# Check resource usage
docker stats

# Check disk space
df -h
```

### 2. Database Issues
```bash
# Check PostgreSQL logs
docker-compose -f docker-compose.prod.yml logs postgres

# Connect to database
docker-compose -f docker-compose.prod.yml exec postgres psql -U sizewise -d sizewise_prod
```

### 3. SSL Certificate Issues
```bash
# Check certificate expiry
openssl x509 -in ./docker/nginx/ssl/cert.pem -text -noout | grep "Not After"

# Renew Let's Encrypt certificate
sudo certbot renew
```

## Updates and Rollbacks

### 1. Application Updates
```bash
# Pull latest code
git pull origin main

# Rebuild and deploy
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
curl https://yourdomain.com/api/health
```

### 2. Rollback Procedure
```bash
# Rollback to previous version
git checkout [previous-commit-hash]
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Restore database backup if needed
docker-compose -f docker-compose.prod.yml exec -T postgres psql -U sizewise -d sizewise_prod < backup.sql
```

## Performance Optimization

### 1. Container Optimization
- Use multi-stage builds (already implemented)
- Optimize image layers
- Use .dockerignore effectively
- Set appropriate resource limits

### 2. Database Optimization
- Configure PostgreSQL for production workload
- Set up read replicas if needed
- Implement connection pooling
- Regular VACUUM and ANALYZE

### 3. Caching Strategy
- Use Redis for session storage
- Implement application-level caching
- Configure Nginx caching for static assets
- Use CDN for global distribution

## Support and Maintenance

### Regular Tasks
- Monitor system resources
- Review application logs
- Update security patches
- Backup verification
- SSL certificate renewal
- Performance monitoring

### Emergency Procedures
- Service restart procedures
- Database recovery steps
- SSL certificate emergency renewal
- Rollback procedures
- Contact information for support

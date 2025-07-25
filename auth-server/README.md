# SizeWise Suite Authentication Server

Flask-based authentication and tier management API for the SizeWise Suite hybrid authentication system.

## Features

- **User Authentication**: Registration, login, logout with JWT tokens
- **Tier Management**: Trial, Free, and Premium tier enforcement
- **Session Management**: Secure session handling with refresh tokens
- **Trial System**: Automatic 14-day trial with Premium features
- **Offline Support**: Designed to work with offline-first client architecture

## Quick Start

### 1. Install Dependencies

```bash
cd auth-server
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Run Development Server

```bash
python run.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - User logout

### Tier Management

- `GET /api/user/tier-status` - Get user's current tier and features
- `POST /api/admin/update-tier` - Update user tier (admin)

### Utility

- `GET /api/health` - Health check
- `GET /api/tiers` - Get tier configurations

## Database Schema

### Users Table
- User account information
- Tier assignments (trial, free, premium)
- Trial and subscription expiration dates

### User Sessions Table
- JWT token management
- Session tracking and security

### Tier Configurations Table
- Feature definitions for each tier
- Configurable limits and permissions

## Tier System

### Trial Tier (14 days)
- Unlimited projects and segments
- High-resolution exports
- No watermarks
- No API access

### Free Tier
- 3 projects maximum
- 25 segments per project
- Standard resolution exports
- Watermarked exports
- No API access

### Premium Tier
- Unlimited projects and segments
- High-resolution exports
- No watermarks
- API access

## Security Features

- Password hashing with Werkzeug
- JWT token authentication
- Session management and tracking
- CORS protection
- Request rate limiting ready
- Secure token refresh mechanism

## Production Deployment

### Environment Variables

```bash
FLASK_ENV=production
SECRET_KEY=your-production-secret-key
JWT_SECRET_KEY=your-production-jwt-secret
DATABASE_URL=postgresql://user:pass@host/db
PORT=5000
```

### Using Gunicorn

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

## Development

### Database Migrations

```bash
# Initialize migrations (first time only)
flask db init

# Create migration
flask db migrate -m "Description"

# Apply migration
flask db upgrade
```

### Testing

```bash
# Run tests
python -m pytest tests/

# Run with coverage
python -m pytest --cov=app tests/
```

## Integration with SizeWise Suite

This server is designed to work with the SizeWise Suite desktop application's hybrid authentication system:

1. **Offline-First**: Client works fully offline with cached credentials
2. **Periodic Sync**: Client syncs with server for tier validation
3. **Graceful Degradation**: Extended offline periods use cached tier status
4. **Super Admin Bypass**: Super admin authentication bypasses server entirely

## API Usage Examples

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe",
    "company": "ACME Corp"
  }'
```

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Tier Status

```bash
curl -X GET http://localhost:5000/api/user/tier-status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

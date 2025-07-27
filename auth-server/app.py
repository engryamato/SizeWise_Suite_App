"""
SizeWise Suite Hybrid Authentication Server
Flask-based authentication and tier management API
"""

import os
import logging
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import uuid
from functools import wraps
from sentry_config import init_sentry, capture_auth_event, capture_auth_error

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Initialize Sentry monitoring
init_sentry(app, environment=os.environ.get('FLASK_ENV', 'development'))

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'sizewise-auth-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///sizewise_auth.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
# Enable CORS for frontend communication
# Support both local development and containerized environments
default_origins = 'http://localhost:3000,http://127.0.0.1:3000'
cors_origins = os.environ.get('CORS_ORIGINS', default_origins).split(',')
CORS(app, origins=cors_origins)

# =============================================================================
# Database Models
# =============================================================================

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    company = db.Column(db.String(255))
    tier = db.Column(db.String(20), default='trial', nullable=False)
    trial_expires = db.Column(db.DateTime)
    subscription_expires = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    sessions = db.relationship('UserSession', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'company': self.company,
            'tier': self.tier,
            'trial_expires': self.trial_expires.isoformat() if self.trial_expires else None,
            'subscription_expires': self.subscription_expires.isoformat() if self.subscription_expires else None,
            'created_at': self.created_at.isoformat(),
            'last_login': self.last_login.isoformat() if self.last_login else None,
        }

class UserSession(db.Model):
    __tablename__ = 'user_sessions'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    token_hash = db.Column(db.String(255), nullable=False)
    refresh_token_hash = db.Column(db.String(255))
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_used = db.Column(db.DateTime, default=datetime.utcnow)
    user_agent = db.Column(db.Text)
    ip_address = db.Column(db.String(45))

class TierConfiguration(db.Model):
    __tablename__ = 'tier_configurations'
    
    tier = db.Column(db.String(20), primary_key=True)
    max_projects = db.Column(db.Integer, default=-1)  # -1 means unlimited
    max_segments_per_project = db.Column(db.Integer, default=-1)
    high_res_exports = db.Column(db.Boolean, default=True)
    watermarked_exports = db.Column(db.Boolean, default=False)
    api_access = db.Column(db.Boolean, default=False)
    trial_duration_days = db.Column(db.Integer, default=14)
    
    def to_dict(self):
        return {
            'tier': self.tier,
            'max_projects': self.max_projects,
            'max_segments_per_project': self.max_segments_per_project,
            'high_res_exports': self.high_res_exports,
            'watermarked_exports': self.watermarked_exports,
            'api_access': self.api_access,
            'trial_duration_days': self.trial_duration_days,
        }

# =============================================================================
# JWT Token Management
# =============================================================================

def generate_tokens(user_id):
    """Generate access and refresh tokens for user"""
    access_payload = {
        'user_id': user_id,
        'type': 'access',
        'exp': datetime.utcnow() + app.config['JWT_ACCESS_TOKEN_EXPIRES'],
        'iat': datetime.utcnow()
    }
    
    refresh_payload = {
        'user_id': user_id,
        'type': 'refresh',
        'exp': datetime.utcnow() + app.config['JWT_REFRESH_TOKEN_EXPIRES'],
        'iat': datetime.utcnow()
    }
    
    access_token = jwt.encode(access_payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')
    refresh_token = jwt.encode(refresh_payload, app.config['JWT_SECRET_KEY'], algorithm='HS256')
    
    return access_token, refresh_token

def verify_token(token):
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """Decorator to require valid JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            payload = verify_token(token)
            if not payload or payload.get('type') != 'access':
                return jsonify({'error': 'Invalid token'}), 401
            
            current_user = User.query.get(payload['user_id'])
            if not current_user or not current_user.is_active:
                return jsonify({'error': 'User not found or inactive'}), 401
            
            # Update last used time for session
            session = UserSession.query.filter_by(
                user_id=current_user.id,
                token_hash=generate_password_hash(token)
            ).first()
            if session:
                session.last_used = datetime.utcnow()
                db.session.commit()
            
            return f(current_user, *args, **kwargs)
        except Exception as e:
            logger.error(f"Token verification error: {str(e)}")
            return jsonify({'error': 'Invalid token'}), 401
    
    return decorated

# =============================================================================
# Authentication Endpoints
# =============================================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register new user with 14-day trial"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'name']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 409
        
        # Create new user with trial
        user = User(
            email=data['email'].lower().strip(),
            name=data['name'].strip(),
            company=data.get('company', '').strip(),
            tier='trial',
            trial_expires=datetime.utcnow() + timedelta(days=14)
        )
        user.set_password(data['password'])
        
        db.session.add(user)
        db.session.commit()
        
        # Generate tokens
        access_token, refresh_token = generate_tokens(user.id)
        
        # Create session record
        session = UserSession(
            user_id=user.id,
            token_hash=generate_password_hash(access_token),
            refresh_token_hash=generate_password_hash(refresh_token),
            expires_at=datetime.utcnow() + app.config['JWT_ACCESS_TOKEN_EXPIRES'],
            user_agent=request.headers.get('User-Agent', ''),
            ip_address=request.remote_addr
        )
        db.session.add(session)
        db.session.commit()
        
        logger.info(f"New user registered: {user.email}")
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'token': access_token,
            'refresh_token': refresh_token
        }), 201
        
    except Exception as e:
        logger.error(f"Registration error: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Authenticate user and return tokens"""
    try:
        data = request.get_json()
        
        if not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password are required'}), 400
        
        # Find user
        user = User.query.filter_by(email=data['email'].lower().strip()).first()
        
        if not user or not user.check_password(data['password']):
            return jsonify({'error': 'Invalid email or password'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 401
        
        # Update last login
        user.last_login = datetime.utcnow()
        
        # Generate tokens
        access_token, refresh_token = generate_tokens(user.id)
        
        # Create session record
        session = UserSession(
            user_id=user.id,
            token_hash=generate_password_hash(access_token),
            refresh_token_hash=generate_password_hash(refresh_token),
            expires_at=datetime.utcnow() + app.config['JWT_ACCESS_TOKEN_EXPIRES'],
            user_agent=request.headers.get('User-Agent', ''),
            ip_address=request.remote_addr
        )
        db.session.add(session)
        db.session.commit()
        
        logger.info(f"User logged in: {user.email}")

        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'token': access_token,
            'refresh_token': refresh_token
        }), 200

    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/auth/refresh', methods=['POST'])
def refresh_token():
    """Refresh access token using refresh token"""
    try:
        data = request.get_json()
        refresh_token = data.get('refresh_token')

        if not refresh_token:
            return jsonify({'error': 'Refresh token is required'}), 400

        # Verify refresh token
        payload = verify_token(refresh_token)
        if not payload or payload.get('type') != 'refresh':
            return jsonify({'error': 'Invalid refresh token'}), 401

        # Find user and session
        user = User.query.get(payload['user_id'])
        if not user or not user.is_active:
            return jsonify({'error': 'User not found or inactive'}), 401

        session = UserSession.query.filter_by(
            user_id=user.id,
            refresh_token_hash=generate_password_hash(refresh_token)
        ).first()

        if not session or session.expires_at < datetime.utcnow():
            return jsonify({'error': 'Session expired'}), 401

        # Generate new tokens
        new_access_token, new_refresh_token = generate_tokens(user.id)

        # Update session
        session.token_hash = generate_password_hash(new_access_token)
        session.refresh_token_hash = generate_password_hash(new_refresh_token)
        session.expires_at = datetime.utcnow() + app.config['JWT_ACCESS_TOKEN_EXPIRES']
        session.last_used = datetime.utcnow()

        db.session.commit()

        return jsonify({
            'success': True,
            'token': new_access_token,
            'refresh_token': new_refresh_token
        }), 200

    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return jsonify({'error': 'Token refresh failed'}), 500

@app.route('/api/auth/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout user and invalidate session"""
    try:
        token = request.headers.get('Authorization')
        if token.startswith('Bearer '):
            token = token[7:]

        # Find and delete session
        session = UserSession.query.filter_by(
            user_id=current_user.id,
            token_hash=generate_password_hash(token)
        ).first()

        if session:
            db.session.delete(session)
            db.session.commit()

        logger.info(f"User logged out: {current_user.email}")

        return jsonify({'success': True, 'message': 'Logged out successfully'}), 200

    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({'error': 'Logout failed'}), 500

# =============================================================================
# Tier Management Endpoints
# =============================================================================

@app.route('/api/user/tier-status', methods=['GET'])
@token_required
def get_tier_status(current_user):
    """Get current user's tier status and features"""
    try:
        # Get tier configuration
        tier_config = TierConfiguration.query.get(current_user.tier)
        if not tier_config:
            # Default configuration if not found
            tier_config = TierConfiguration(
                tier=current_user.tier,
                max_projects=3 if current_user.tier == 'free' else -1,
                max_segments_per_project=25 if current_user.tier == 'free' else -1,
                high_res_exports=current_user.tier != 'free',
                watermarked_exports=current_user.tier == 'free',
                api_access=current_user.tier == 'premium'
            )

        # Check if trial has expired
        current_tier = current_user.tier
        if current_user.tier == 'trial' and current_user.trial_expires:
            if datetime.utcnow() > current_user.trial_expires:
                # Auto-convert expired trial to free tier
                current_user.tier = 'free'
                db.session.commit()
                current_tier = 'free'

                # Get free tier configuration
                tier_config = TierConfiguration.query.get('free')
                if not tier_config:
                    tier_config = TierConfiguration(
                        tier='free',
                        max_projects=3,
                        max_segments_per_project=25,
                        high_res_exports=False,
                        watermarked_exports=True,
                        api_access=False
                    )

        # TODO: Get actual usage statistics from project data
        # For now, return mock data
        usage_stats = {
            'projects_count': 0,
            'segments_count': 0
        }

        return jsonify({
            'success': True,
            'tier': current_tier,
            'trial_expires': current_user.trial_expires.isoformat() if current_user.trial_expires else None,
            'subscription_expires': current_user.subscription_expires.isoformat() if current_user.subscription_expires else None,
            'features': {
                'max_projects': tier_config.max_projects,
                'max_segments_per_project': tier_config.max_segments_per_project,
                'high_res_exports': tier_config.high_res_exports,
                'watermarked_exports': tier_config.watermarked_exports,
                'api_access': tier_config.api_access
            },
            'usage': usage_stats
        }), 200

    except Exception as e:
        logger.error(f"Tier status error: {str(e)}")
        return jsonify({'error': 'Failed to get tier status'}), 500


@app.route('/api/admin/update-tier', methods=['POST'])
@token_required
def update_user_tier(current_user):
    """Update user tier (admin only)"""
    try:
        # Check if current user is admin (for now, any authenticated user can update)
        # In production, implement proper admin role checking

        data = request.get_json()
        user_id = data.get('user_id')
        new_tier = data.get('tier')
        subscription_expires = data.get('subscription_expires')

        if not user_id or not new_tier:
            return jsonify({'error': 'user_id and tier are required'}), 400

        # Find target user
        target_user = User.query.get(user_id)
        if not target_user:
            return jsonify({'error': 'User not found'}), 404

        # Update tier
        target_user.tier = new_tier
        target_user.updated_at = datetime.utcnow()

        if subscription_expires:
            target_user.subscription_expires = datetime.fromisoformat(
                subscription_expires.replace('Z', '+00:00')
            )

        db.session.commit()

        logger.info(f"User tier updated: {target_user.email} -> {new_tier}")

        return jsonify({
            'success': True,
            'user': target_user.to_dict()
        }), 200

    except Exception as e:
        logger.error(f"Tier update error: {str(e)}")
        return jsonify({'error': 'Failed to update tier'}), 500


# =============================================================================
# Utility Endpoints
# =============================================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    }), 200


@app.route('/api/tiers', methods=['GET'])
def get_tier_configurations():
    """Get all tier configurations"""
    try:
        tiers = TierConfiguration.query.all()
        return jsonify({
            'success': True,
            'tiers': [tier.to_dict() for tier in tiers]
        }), 200
    except Exception as e:
        logger.error(f"Get tiers error: {str(e)}")
        return jsonify({'error': 'Failed to get tier configurations'}), 500


# =============================================================================
# Database Initialization
# =============================================================================

def init_database():
    """Initialize database with default tier configurations"""
    with app.app_context():
        # Create tables
        db.create_all()

        # Check if tier configurations exist
        if TierConfiguration.query.count() == 0:
            # Create default tier configurations
            tiers = [
                TierConfiguration(
                    tier='free',
                    max_projects=3,
                    max_segments_per_project=25,
                    high_res_exports=False,
                    watermarked_exports=True,
                    api_access=False,
                    trial_duration_days=0
                ),
                TierConfiguration(
                    tier='trial',
                    max_projects=-1,
                    max_segments_per_project=-1,
                    high_res_exports=True,
                    watermarked_exports=False,
                    api_access=False,
                    trial_duration_days=14
                ),
                TierConfiguration(
                    tier='premium',
                    max_projects=-1,
                    max_segments_per_project=-1,
                    high_res_exports=True,
                    watermarked_exports=False,
                    api_access=True,
                    trial_duration_days=0
                )
            ]

            for tier in tiers:
                db.session.add(tier)

            db.session.commit()
            logger.info("Default tier configurations created")


# =============================================================================
# Application Entry Point
# =============================================================================

if __name__ == '__main__':
    init_database()

    # Run development server
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'

    logger.info(f"Starting SizeWise Auth Server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug)

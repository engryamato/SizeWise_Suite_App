"""
Hardened Session Management for SizeWise Suite
Implements secure session handling with Redis store, device fingerprinting, and anomaly detection
"""

import os
import json
import time
import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple, List
from dataclasses import dataclass, asdict
from enum import Enum

import redis
from flask import request, g
from user_agents import parse as parse_user_agent
from werkzeug.security import generate_password_hash, check_password_hash


logger = logging.getLogger(__name__)


class SessionStatus(Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"
    SUSPICIOUS = "suspicious"


class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class DeviceFingerprint:
    """Device fingerprint for session validation"""
    user_agent_hash: str
    ip_address: str
    browser_family: str
    browser_version: str
    os_family: str
    os_version: str
    device_family: str
    language: Optional[str] = None
    timezone: Optional[str] = None
    screen_resolution: Optional[str] = None
    
    def to_dict(self) -> dict:
        return asdict(self)
    
    @classmethod
    def from_dict(cls, data: dict):
        return cls(**data)
    
    def generate_hash(self) -> str:
        """Generate unique hash for device identification"""
        fingerprint_data = f"{self.user_agent_hash}:{self.ip_address}:{self.browser_family}:{self.os_family}"
        return hashlib.sha256(fingerprint_data.encode()).hexdigest()[:16]


@dataclass
class SessionMetadata:
    """Session metadata for tracking and analysis"""
    session_id: str
    user_id: str
    device_fingerprint: DeviceFingerprint
    created_at: datetime
    last_accessed: datetime
    access_count: int = 0
    privilege_level: str = "user"
    status: SessionStatus = SessionStatus.ACTIVE
    risk_level: RiskLevel = RiskLevel.LOW
    suspicious_activities: List[Dict] = None
    
    def __post_init__(self):
        if self.suspicious_activities is None:
            self.suspicious_activities = []
    
    def to_dict(self) -> dict:
        data = asdict(self)
        data['created_at'] = self.created_at.isoformat()
        data['last_accessed'] = self.last_accessed.isoformat()
        data['status'] = self.status.value
        data['risk_level'] = self.risk_level.value
        data['device_fingerprint'] = self.device_fingerprint.to_dict()
        return data
    
    @classmethod
    def from_dict(cls, data: dict):
        data['created_at'] = datetime.fromisoformat(data['created_at'])
        data['last_accessed'] = datetime.fromisoformat(data['last_accessed'])
        data['status'] = SessionStatus(data['status'])
        data['risk_level'] = RiskLevel(data['risk_level'])
        data['device_fingerprint'] = DeviceFingerprint.from_dict(data['device_fingerprint'])
        if data.get('suspicious_activities') is None:
            data['suspicious_activities'] = []
        return cls(**data)


class HardenedSessionManager:
    """
    Hardened session management with Redis storage, device fingerprinting,
    and anomaly detection capabilities
    """
    
    def __init__(self, redis_url: str = None, config: dict = None):
        """Initialize the session manager"""
        self.config = {
            # Session timeouts (in seconds)
            'idle_timeout': 30 * 60,  # 30 minutes
            'absolute_timeout': 24 * 60 * 60,  # 24 hours
            
            # Security settings
            'max_concurrent_sessions': 3,
            'session_rotation_on_privilege_change': True,
            'device_fingerprint_required': True,
            
            # Anomaly detection
            'max_ip_changes_per_hour': 2,
            'max_user_agent_changes_per_session': 1,
            'suspicious_activity_threshold': 5,
            
            # Redis settings
            'redis_key_prefix': 'sizewise:session:',
            'redis_key_ttl': 24 * 60 * 60 + 300,  # 24h + 5min buffer
            
            **(config or {})
        }
        
        # Initialize Redis connection
        redis_url = redis_url or os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
        self.redis_client = redis.from_url(redis_url, decode_responses=True)
        
        # Test Redis connection
        try:
            self.redis_client.ping()
            logger.info("Redis connection established successfully")
        except redis.ConnectionError as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    def create_device_fingerprint(self, 
                                 user_agent: str = None, 
                                 ip_address: str = None,
                                 additional_data: dict = None) -> DeviceFingerprint:
        """Create device fingerprint from request data"""
        user_agent = user_agent or request.headers.get('User-Agent', '')
        ip_address = ip_address or self._get_client_ip()
        
        # Parse user agent
        parsed_ua = parse_user_agent(user_agent)
        
        # Create fingerprint
        fingerprint = DeviceFingerprint(
            user_agent_hash=hashlib.sha256(user_agent.encode()).hexdigest(),
            ip_address=ip_address,
            browser_family=parsed_ua.browser.family,
            browser_version=f"{parsed_ua.browser.version[0]}.{parsed_ua.browser.version[1]}" 
                           if len(parsed_ua.browser.version) >= 2 else str(parsed_ua.browser.version[0]),
            os_family=parsed_ua.os.family,
            os_version=f"{parsed_ua.os.version[0]}.{parsed_ua.os.version[1]}" 
                      if len(parsed_ua.os.version) >= 2 else str(parsed_ua.os.version[0]),
            device_family=parsed_ua.device.family,
            language=request.headers.get('Accept-Language', '').split(',')[0] if request else None,
            timezone=additional_data.get('timezone') if additional_data else None,
            screen_resolution=additional_data.get('screen_resolution') if additional_data else None
        )
        
        return fingerprint
    
    def create_session(self, 
                      user_id: str, 
                      privilege_level: str = "user",
                      additional_data: dict = None) -> Tuple[str, SessionMetadata]:
        """Create a new secure session"""
        
        # Generate secure session ID
        session_id = self._generate_session_id()
        
        # Create device fingerprint
        device_fingerprint = self.create_device_fingerprint(additional_data=additional_data)
        
        # Check for existing sessions and enforce limits
        self._enforce_session_limits(user_id)
        
        # Create session metadata
        now = datetime.utcnow()
        session_metadata = SessionMetadata(
            session_id=session_id,
            user_id=user_id,
            device_fingerprint=device_fingerprint,
            created_at=now,
            last_accessed=now,
            privilege_level=privilege_level,
            status=SessionStatus.ACTIVE,
            risk_level=RiskLevel.LOW
        )
        
        # Store in Redis
        self._store_session(session_metadata)
        
        # Log session creation
        logger.info(f"Session created for user {user_id}: {session_id}")
        
        return session_id, session_metadata
    
    def validate_session(self, session_id: str) -> Tuple[bool, Optional[SessionMetadata], Optional[str]]:
        """
        Validate session and return metadata
        Returns (is_valid, session_metadata, error_message)
        """
        
        # Retrieve session from Redis
        session_metadata = self._get_session(session_id)
        if not session_metadata:
            return False, None, "Session not found"
        
        # Check if session is expired or revoked
        if session_metadata.status != SessionStatus.ACTIVE:
            return False, session_metadata, f"Session is {session_metadata.status.value}"
        
        # Check timeouts
        now = datetime.utcnow()
        
        # Check idle timeout
        idle_time = (now - session_metadata.last_accessed).total_seconds()
        if idle_time > self.config['idle_timeout']:
            session_metadata.status = SessionStatus.EXPIRED
            self._store_session(session_metadata)
            return False, session_metadata, "Session expired due to inactivity"
        
        # Check absolute timeout
        session_age = (now - session_metadata.created_at).total_seconds()
        if session_age > self.config['absolute_timeout']:
            session_metadata.status = SessionStatus.EXPIRED
            self._store_session(session_metadata)
            return False, session_metadata, "Session expired due to maximum age"
        
        # Perform anomaly detection
        risk_assessment = self._assess_session_risk(session_metadata)
        if risk_assessment['risk_level'] == RiskLevel.CRITICAL:
            session_metadata.status = SessionStatus.SUSPICIOUS
            session_metadata.risk_level = RiskLevel.CRITICAL
            session_metadata.suspicious_activities.extend(risk_assessment['activities'])
            self._store_session(session_metadata)
            return False, session_metadata, "Session flagged as suspicious"
        
        # Update session activity
        session_metadata.last_accessed = now
        session_metadata.access_count += 1
        session_metadata.risk_level = risk_assessment['risk_level']
        if risk_assessment['activities']:
            session_metadata.suspicious_activities.extend(risk_assessment['activities'])
        
        # Store updated metadata
        self._store_session(session_metadata)
        
        return True, session_metadata, None
    
    def rotate_session(self, current_session_id: str, 
                      new_privilege_level: str = None) -> Tuple[str, Optional[SessionMetadata]]:
        """
        Rotate session ID for privilege escalation or security reasons
        Returns (new_session_id, session_metadata)
        """
        
        # Get current session
        current_session = self._get_session(current_session_id)
        if not current_session:
            return None, None
        
        # Revoke current session
        current_session.status = SessionStatus.REVOKED
        self._store_session(current_session)
        
        # Create new session with same user but new ID
        new_session_id, new_session_metadata = self.create_session(
            user_id=current_session.user_id,
            privilege_level=new_privilege_level or current_session.privilege_level
        )
        
        logger.info(f"Session rotated: {current_session_id} -> {new_session_id}")
        
        return new_session_id, new_session_metadata
    
    def revoke_session(self, session_id: str) -> bool:
        """Revoke a specific session"""
        session_metadata = self._get_session(session_id)
        if not session_metadata:
            return False
        
        session_metadata.status = SessionStatus.REVOKED
        self._store_session(session_metadata)
        
        logger.info(f"Session revoked: {session_id}")
        return True
    
    def revoke_all_user_sessions(self, user_id: str) -> int:
        """Revoke all sessions for a user"""
        revoked_count = 0
        
        # Get all session keys for user
        pattern = f"{self.config['redis_key_prefix']}{user_id}:*"
        session_keys = self.redis_client.keys(pattern)
        
        for key in session_keys:
            session_data = self.redis_client.get(key)
            if session_data:
                try:
                    metadata = SessionMetadata.from_dict(json.loads(session_data))
                    metadata.status = SessionStatus.REVOKED
                    self._store_session(metadata)
                    revoked_count += 1
                except Exception as e:
                    logger.error(f"Error revoking session {key}: {e}")
        
        logger.info(f"Revoked {revoked_count} sessions for user {user_id}")
        return revoked_count
    
    def get_user_sessions(self, user_id: str) -> List[SessionMetadata]:
        """Get all active sessions for a user"""
        sessions = []
        
        # Get all session keys for user
        pattern = f"{self.config['redis_key_prefix']}{user_id}:*"
        session_keys = self.redis_client.keys(pattern)
        
        for key in session_keys:
            session_data = self.redis_client.get(key)
            if session_data:
                try:
                    metadata = SessionMetadata.from_dict(json.loads(session_data))
                    if metadata.status == SessionStatus.ACTIVE:
                        sessions.append(metadata)
                except Exception as e:
                    logger.error(f"Error loading session {key}: {e}")
        
        return sessions
    
    def cleanup_expired_sessions(self) -> int:
        """Clean up expired sessions from Redis"""
        cleaned_count = 0
        now = datetime.utcnow()
        
        # Get all session keys
        pattern = f"{self.config['redis_key_prefix']}*"
        session_keys = self.redis_client.keys(pattern)
        
        for key in session_keys:
            session_data = self.redis_client.get(key)
            if session_data:
                try:
                    metadata = SessionMetadata.from_dict(json.loads(session_data))
                    
                    # Check if session should be cleaned up
                    session_age = (now - metadata.created_at).total_seconds()
                    idle_time = (now - metadata.last_accessed).total_seconds()
                    
                    if (session_age > self.config['absolute_timeout'] or 
                        idle_time > self.config['idle_timeout'] or 
                        metadata.status != SessionStatus.ACTIVE):
                        
                        self.redis_client.delete(key)
                        cleaned_count += 1
                        
                except Exception as e:
                    logger.error(f"Error cleaning session {key}: {e}")
        
        logger.info(f"Cleaned up {cleaned_count} expired sessions")
        return cleaned_count
    
    def _generate_session_id(self) -> str:
        """Generate cryptographically secure session ID"""
        return secrets.token_urlsafe(32)
    
    def _get_client_ip(self) -> str:
        """Get client IP address considering proxies"""
        if request:
            # Check for forwarded headers
            forwarded_for = request.headers.get('X-Forwarded-For')
            if forwarded_for:
                return forwarded_for.split(',')[0].strip()
            
            real_ip = request.headers.get('X-Real-IP')
            if real_ip:
                return real_ip
            
            return request.remote_addr
        
        return 'unknown'
    
    def _store_session(self, session_metadata: SessionMetadata):
        """Store session metadata in Redis"""
        key = f"{self.config['redis_key_prefix']}{session_metadata.user_id}:{session_metadata.session_id}"
        data = json.dumps(session_metadata.to_dict())
        
        self.redis_client.setex(
            key, 
            self.config['redis_key_ttl'], 
            data
        )
    
    def _get_session(self, session_id: str) -> Optional[SessionMetadata]:
        """Retrieve session metadata from Redis"""
        # We need to search by session_id across all users
        pattern = f"{self.config['redis_key_prefix']}*:{session_id}"
        keys = self.redis_client.keys(pattern)
        
        if not keys:
            return None
        
        # Should only be one key
        session_data = self.redis_client.get(keys[0])
        if not session_data:
            return None
        
        try:
            return SessionMetadata.from_dict(json.loads(session_data))
        except Exception as e:
            logger.error(f"Error deserializing session data: {e}")
            return None
    
    def _enforce_session_limits(self, user_id: str):
        """Enforce maximum concurrent sessions per user"""
        active_sessions = self.get_user_sessions(user_id)
        
        if len(active_sessions) >= self.config['max_concurrent_sessions']:
            # Revoke oldest session
            oldest_session = min(active_sessions, key=lambda s: s.created_at)
            self.revoke_session(oldest_session.session_id)
            logger.info(f"Revoked oldest session for user {user_id} due to session limit")
    
    def _assess_session_risk(self, session_metadata: SessionMetadata) -> Dict:
        """Assess risk level of current session based on various factors"""
        activities = []
        risk_level = RiskLevel.LOW
        
        # Check device fingerprint changes
        current_fingerprint = self.create_device_fingerprint()
        stored_fingerprint = session_metadata.device_fingerprint
        
        # IP address changes
        if current_fingerprint.ip_address != stored_fingerprint.ip_address:
            activities.append({
                'type': 'ip_change',
                'timestamp': datetime.utcnow().isoformat(),
                'old_ip': stored_fingerprint.ip_address,
                'new_ip': current_fingerprint.ip_address
            })
            risk_level = max(risk_level, RiskLevel.MEDIUM)
        
        # User agent changes
        if current_fingerprint.user_agent_hash != stored_fingerprint.user_agent_hash:
            activities.append({
                'type': 'user_agent_change', 
                'timestamp': datetime.utcnow().isoformat(),
                'old_ua': stored_fingerprint.user_agent_hash,
                'new_ua': current_fingerprint.user_agent_hash
            })
            risk_level = max(risk_level, RiskLevel.HIGH)
        
        # Browser/OS changes
        if (current_fingerprint.browser_family != stored_fingerprint.browser_family or
            current_fingerprint.os_family != stored_fingerprint.os_family):
            activities.append({
                'type': 'device_change',
                'timestamp': datetime.utcnow().isoformat(),
                'details': 'Browser or OS family changed'
            })
            risk_level = RiskLevel.CRITICAL
        
        # Check session activity patterns
        if session_metadata.access_count > 1000:  # Very high activity
            activities.append({
                'type': 'high_activity',
                'timestamp': datetime.utcnow().isoformat(),
                'access_count': session_metadata.access_count
            })
            risk_level = max(risk_level, RiskLevel.MEDIUM)
        
        # Accumulated suspicious activities
        if len(session_metadata.suspicious_activities) >= self.config['suspicious_activity_threshold']:
            risk_level = RiskLevel.CRITICAL
        
        return {
            'risk_level': risk_level,
            'activities': activities
        }


# Global session manager instance
session_manager = None


def init_session_manager(app, redis_url: str = None, config: dict = None):
    """Initialize global session manager"""
    global session_manager
    session_manager = HardenedSessionManager(redis_url=redis_url, config=config)
    
    # Register cleanup task if using scheduler
    try:
        from flask_apscheduler import APScheduler
        scheduler = APScheduler()
        scheduler.init_app(app)
        
        # Clean up expired sessions every hour
        scheduler.add_job(
            id='cleanup_sessions',
            func=session_manager.cleanup_expired_sessions,
            trigger='interval',
            hours=1
        )
        
        scheduler.start()
    except ImportError:
        logger.warning("APScheduler not available - manual session cleanup required")
    
    return session_manager


def get_session_manager() -> HardenedSessionManager:
    """Get the global session manager instance"""
    if session_manager is None:
        raise RuntimeError("Session manager not initialized")
    return session_manager

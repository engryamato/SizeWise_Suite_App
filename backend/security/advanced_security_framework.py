"""
Advanced Security Framework for SizeWise Suite
Comprehensive enterprise-grade security implementation with MFA, RBAC, audit trails, and encryption.
"""

import asyncio
import hashlib
import hmac
import json
import secrets
import time
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Set, Any
from dataclasses import dataclass, asdict
import pyotp
import qrcode
from io import BytesIO
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Permission(Enum):
    """System permissions for RBAC"""
    # Project permissions
    PROJECT_CREATE = "project:create"
    PROJECT_READ = "project:read"
    PROJECT_UPDATE = "project:update"
    PROJECT_DELETE = "project:delete"
    PROJECT_SHARE = "project:share"
    
    # Calculation permissions
    CALC_BASIC = "calculation:basic"
    CALC_ADVANCED = "calculation:advanced"
    CALC_EXPORT = "calculation:export"
    
    # Collaboration permissions
    COLLAB_JOIN = "collaboration:join"
    COLLAB_MODERATE = "collaboration:moderate"
    
    # Admin permissions
    USER_MANAGE = "user:manage"
    SYSTEM_CONFIG = "system:config"
    AUDIT_VIEW = "audit:view"
    
    # Security permissions
    SECURITY_ADMIN = "security:admin"
    MFA_MANAGE = "mfa:manage"

@dataclass
class Role:
    """Role definition with permissions"""
    name: str
    permissions: Set[Permission]
    description: str
    is_system_role: bool = True

@dataclass
class AuditEvent:
    """Security audit event"""
    event_id: str
    user_id: str
    action: str
    resource_type: str
    resource_id: Optional[str]
    timestamp: datetime
    ip_address: str
    user_agent: str
    details: Dict[str, Any]
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    session_id: Optional[str] = None

@dataclass
class SecurityPolicy:
    """Security policy configuration"""
    password_min_length: int = 12
    password_require_uppercase: bool = True
    password_require_lowercase: bool = True
    password_require_numbers: bool = True
    password_require_symbols: bool = True
    password_max_age_days: int = 90
    session_timeout_minutes: int = 480  # 8 hours
    max_failed_attempts: int = 5
    lockout_duration_minutes: int = 30
    mfa_required: bool = True
    audit_retention_days: int = 2555  # 7 years
    encryption_algorithm: str = "AES-256"

class EncryptionService:
    """Data encryption service"""
    
    def __init__(self, master_key: str):
        self.master_key = master_key.encode()
        self.fernet = self._create_fernet()
    
    def _create_fernet(self) -> Fernet:
        """Create Fernet cipher from master key"""
        # In production, use unique salt per encryption
        salt = b'sizewise_security_2024_v1'
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.master_key))
        return Fernet(key)
    
    def encrypt_data(self, data: str) -> str:
        """Encrypt sensitive data"""
        try:
            encrypted = self.fernet.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt sensitive data"""
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self.fernet.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise
    
    def encrypt_file(self, file_path: str) -> str:
        """Encrypt file and return encrypted file path"""
        try:
            with open(file_path, 'rb') as file:
                file_data = file.read()
            
            encrypted_data = self.fernet.encrypt(file_data)
            encrypted_path = f"{file_path}.encrypted"
            
            with open(encrypted_path, 'wb') as encrypted_file:
                encrypted_file.write(encrypted_data)
            
            logger.info(f"File encrypted: {file_path} -> {encrypted_path}")
            return encrypted_path
        except Exception as e:
            logger.error(f"File encryption failed: {e}")
            raise

class MFAService:
    """Multi-Factor Authentication service"""
    
    def __init__(self):
        self.issuer_name = "SizeWise Suite"
        self.backup_codes_count = 10
    
    def generate_secret(self, user_id: str) -> str:
        """Generate TOTP secret for user"""
        secret = pyotp.random_base32()
        logger.info(f"Generated MFA secret for user: {user_id}")
        return secret
    
    def generate_qr_code(self, user_email: str, secret: str) -> bytes:
        """Generate QR code for authenticator app setup"""
        try:
            totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
                name=user_email,
                issuer_name=self.issuer_name
            )
            
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(totp_uri)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = BytesIO()
            img.save(buffer, format='PNG')
            
            logger.info(f"Generated QR code for user: {user_email}")
            return buffer.getvalue()
        except Exception as e:
            logger.error(f"QR code generation failed: {e}")
            raise
    
    def verify_token(self, secret: str, token: str) -> bool:
        """Verify TOTP token"""
        try:
            totp = pyotp.TOTP(secret)
            is_valid = totp.verify(token, valid_window=1)
            logger.info(f"TOTP verification result: {is_valid}")
            return is_valid
        except Exception as e:
            logger.error(f"TOTP verification failed: {e}")
            return False
    
    def generate_backup_codes(self, user_id: str) -> List[str]:
        """Generate backup codes for account recovery"""
        codes = []
        for _ in range(self.backup_codes_count):
            code = secrets.token_hex(4).upper()
            codes.append(f"{code[:4]}-{code[4:]}")
        
        logger.info(f"Generated {len(codes)} backup codes for user: {user_id}")
        return codes
    
    def verify_backup_code(self, stored_codes: List[str], provided_code: str) -> bool:
        """Verify backup code and mark as used"""
        formatted_code = provided_code.upper().replace(" ", "").replace("-", "")
        for i, stored_code in enumerate(stored_codes):
            stored_formatted = stored_code.replace("-", "")
            if hmac.compare_digest(stored_formatted, formatted_code):
                # Mark code as used by removing it
                stored_codes.pop(i)
                logger.info("Backup code verified and marked as used")
                return True
        
        logger.warning("Invalid backup code provided")
        return False

class RBACService:
    """Role-Based Access Control service"""
    
    def __init__(self):
        self.roles = self._initialize_default_roles()
        self.user_roles: Dict[str, List[str]] = {}
    
    def _initialize_default_roles(self) -> Dict[str, Role]:
        """Initialize default system roles"""
        return {
            "viewer": Role(
                name="Viewer",
                permissions={
                    Permission.PROJECT_READ,
                    Permission.CALC_BASIC,
                    Permission.COLLAB_JOIN
                },
                description="Read-only access to projects and basic calculations"
            ),
            "engineer": Role(
                name="Engineer",
                permissions={
                    Permission.PROJECT_CREATE,
                    Permission.PROJECT_READ,
                    Permission.PROJECT_UPDATE,
                    Permission.CALC_BASIC,
                    Permission.CALC_ADVANCED,
                    Permission.CALC_EXPORT,
                    Permission.COLLAB_JOIN
                },
                description="Full engineering capabilities"
            ),
            "project_manager": Role(
                name="Project Manager",
                permissions={
                    Permission.PROJECT_CREATE,
                    Permission.PROJECT_READ,
                    Permission.PROJECT_UPDATE,
                    Permission.PROJECT_DELETE,
                    Permission.PROJECT_SHARE,
                    Permission.CALC_BASIC,
                    Permission.CALC_ADVANCED,
                    Permission.CALC_EXPORT,
                    Permission.COLLAB_JOIN,
                    Permission.COLLAB_MODERATE
                },
                description="Project management with team collaboration"
            ),
            "admin": Role(
                name="Administrator",
                permissions=set(Permission),  # All permissions
                description="Full system administration"
            )
        }
    
    def assign_role(self, user_id: str, role_name: str) -> bool:
        """Assign role to user"""
        if role_name not in self.roles:
            logger.error(f"Role not found: {role_name}")
            return False
        
        if user_id not in self.user_roles:
            self.user_roles[user_id] = []
        
        if role_name not in self.user_roles[user_id]:
            self.user_roles[user_id].append(role_name)
            logger.info(f"Assigned role '{role_name}' to user: {user_id}")
        
        return True
    
    def remove_role(self, user_id: str, role_name: str) -> bool:
        """Remove role from user"""
        if user_id in self.user_roles and role_name in self.user_roles[user_id]:
            self.user_roles[user_id].remove(role_name)
            logger.info(f"Removed role '{role_name}' from user: {user_id}")
            return True
        return False
    
    def check_permission(self, user_id: str, required_permission: Permission) -> bool:
        """Check if user has required permission"""
        user_roles = self.user_roles.get(user_id, [])
        
        for role_name in user_roles:
            role = self.roles.get(role_name)
            if role and required_permission in role.permissions:
                return True
        
        return False
    
    def get_user_permissions(self, user_id: str) -> Set[Permission]:
        """Get all permissions for user"""
        permissions = set()
        user_roles = self.user_roles.get(user_id, [])
        
        for role_name in user_roles:
            role = self.roles.get(role_name)
            if role:
                permissions.update(role.permissions)
        
        return permissions
    
    def create_custom_role(self, role_name: str, permissions: Set[Permission], description: str) -> bool:
        """Create custom role"""
        if role_name in self.roles:
            logger.error(f"Role already exists: {role_name}")
            return False
        
        self.roles[role_name] = Role(
            name=role_name,
            permissions=permissions,
            description=description,
            is_system_role=False
        )
        
        logger.info(f"Created custom role: {role_name}")
        return True

class SecurityAuditService:
    """Security audit and logging service"""
    
    def __init__(self, db_service=None):
        self.db = db_service
        self.audit_events: List[AuditEvent] = []  # In-memory storage for demo
        self.policy = SecurityPolicy()
    
    def generate_event_id(self) -> str:
        """Generate unique event ID"""
        return f"audit_{int(time.time())}_{secrets.token_hex(8)}"
    
    async def log_event(self, event: AuditEvent):
        """Log security event to audit trail"""
        try:
            # Store in database if available
            if self.db:
                await self.db.audit_events.insert_one(asdict(event))
            else:
                # Store in memory for demo
                self.audit_events.append(event)
            
            logger.info(f"Audit event logged: {event.action} by {event.user_id}")
            
            # Alert on high-risk events
            if event.risk_level in ["HIGH", "CRITICAL"]:
                await self.send_security_alert(event)
                
        except Exception as e:
            logger.error(f"Failed to log audit event: {e}")
    
    async def log_authentication(self, user_id: str, success: bool, ip_address: str, user_agent: str, session_id: str = None):
        """Log authentication attempt"""
        event = AuditEvent(
            event_id=self.generate_event_id(),
            user_id=user_id,
            action="authentication",
            resource_type="user",
            resource_id=user_id,
            timestamp=datetime.utcnow(),
            ip_address=ip_address,
            user_agent=user_agent,
            details={"success": success, "method": "password"},
            risk_level="MEDIUM" if not success else "LOW",
            session_id=session_id
        )
        await self.log_event(event)
    
    async def log_mfa_verification(self, user_id: str, success: bool, method: str, ip_address: str):
        """Log MFA verification attempt"""
        event = AuditEvent(
            event_id=self.generate_event_id(),
            user_id=user_id,
            action="mfa_verification",
            resource_type="user",
            resource_id=user_id,
            timestamp=datetime.utcnow(),
            ip_address=ip_address,
            user_agent="",
            details={"success": success, "method": method},
            risk_level="HIGH" if not success else "LOW"
        )
        await self.log_event(event)
    
    async def log_data_access(self, user_id: str, resource_type: str, resource_id: str, action: str, ip_address: str = ""):
        """Log data access event"""
        event = AuditEvent(
            event_id=self.generate_event_id(),
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            timestamp=datetime.utcnow(),
            ip_address=ip_address,
            user_agent="",
            details={"action": action},
            risk_level="LOW"
        )
        await self.log_event(event)
    
    async def log_permission_denied(self, user_id: str, attempted_action: str, resource_type: str, ip_address: str):
        """Log permission denied event"""
        event = AuditEvent(
            event_id=self.generate_event_id(),
            user_id=user_id,
            action="permission_denied",
            resource_type=resource_type,
            resource_id=None,
            timestamp=datetime.utcnow(),
            ip_address=ip_address,
            user_agent="",
            details={"attempted_action": attempted_action},
            risk_level="MEDIUM"
        )
        await self.log_event(event)
    
    async def send_security_alert(self, event: AuditEvent):
        """Send security alert for high-risk events"""
        alert_message = f"Security Alert: {event.action} by {event.user_id} at {event.timestamp}"
        logger.warning(f"SECURITY ALERT: {alert_message}")
        # In production, integrate with alerting system (email, Slack, etc.)
    
    def get_audit_events(self, user_id: str = None, start_date: datetime = None, end_date: datetime = None) -> List[AuditEvent]:
        """Retrieve audit events with filtering"""
        events = self.audit_events.copy()
        
        if user_id:
            events = [e for e in events if e.user_id == user_id]
        
        if start_date:
            events = [e for e in events if e.timestamp >= start_date]
        
        if end_date:
            events = [e for e in events if e.timestamp <= end_date]
        
        return sorted(events, key=lambda x: x.timestamp, reverse=True)

class AdvancedSecurityFramework:
    """Main security framework orchestrator"""
    
    def __init__(self, master_key: str, db_service=None):
        self.encryption = EncryptionService(master_key)
        self.mfa = MFAService()
        self.rbac = RBACService()
        self.audit = SecurityAuditService(db_service)
        self.policy = SecurityPolicy()
        
        logger.info("Advanced Security Framework initialized")
    
    async def authenticate_user(self, user_id: str, password: str, mfa_token: str = None, ip_address: str = "", user_agent: str = "") -> Dict[str, Any]:
        """Complete user authentication with MFA"""
        try:
            # Step 1: Password verification (simulated)
            password_valid = await self._verify_password(user_id, password)
            
            if not password_valid:
                await self.audit.log_authentication(user_id, False, ip_address, user_agent)
                return {"success": False, "error": "Invalid credentials"}
            
            # Step 2: MFA verification if required
            if self.policy.mfa_required:
                if not mfa_token:
                    return {"success": False, "error": "MFA token required", "mfa_required": True}
                
                mfa_valid = await self._verify_mfa(user_id, mfa_token, ip_address)
                if not mfa_valid:
                    return {"success": False, "error": "Invalid MFA token"}
            
            # Step 3: Generate session
            session_id = self._generate_session_id()
            
            # Log successful authentication
            await self.audit.log_authentication(user_id, True, ip_address, user_agent, session_id)
            
            return {
                "success": True,
                "session_id": session_id,
                "permissions": list(self.rbac.get_user_permissions(user_id))
            }
            
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return {"success": False, "error": "Authentication failed"}
    
    async def _verify_password(self, user_id: str, password: str) -> bool:
        """Verify user password (simulated)"""
        # In production, verify against hashed password in database
        return len(password) >= self.policy.password_min_length
    
    async def _verify_mfa(self, user_id: str, token: str, ip_address: str) -> bool:
        """Verify MFA token"""
        # In production, get user's MFA secret from database
        secret = "JBSWY3DPEHPK3PXP"  # Demo secret
        
        is_valid = self.mfa.verify_token(secret, token)
        await self.audit.log_mfa_verification(user_id, is_valid, "totp", ip_address)
        
        return is_valid
    
    def _generate_session_id(self) -> str:
        """Generate secure session ID"""
        return secrets.token_urlsafe(32)
    
    def validate_password_policy(self, password: str) -> Dict[str, Any]:
        """Validate password against security policy"""
        errors = []
        
        if len(password) < self.policy.password_min_length:
            errors.append(f"Password must be at least {self.policy.password_min_length} characters")
        
        if self.policy.password_require_uppercase and not any(c.isupper() for c in password):
            errors.append("Password must contain uppercase letters")
        
        if self.policy.password_require_lowercase and not any(c.islower() for c in password):
            errors.append("Password must contain lowercase letters")
        
        if self.policy.password_require_numbers and not any(c.isdigit() for c in password):
            errors.append("Password must contain numbers")
        
        if self.policy.password_require_symbols and not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
            errors.append("Password must contain special characters")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }

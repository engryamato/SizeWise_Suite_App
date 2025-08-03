"""
Secure Credential Management System for SizeWise Suite
Replaces hardcoded credentials with secure environment-based configuration
"""

import os
import json
import base64
import secrets
import logging
from typing import Dict, Any, Optional, Union
from pathlib import Path
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import structlog

logger = structlog.get_logger()

class CredentialManager:
    """Secure credential management with encryption and environment variable support"""
    
    def __init__(self, encryption_key: Optional[str] = None):
        """Initialize credential manager with optional encryption"""
        self.encryption_key = encryption_key
        self.fernet = None
        
        if encryption_key:
            self._initialize_encryption(encryption_key)
        
        # Default credential mappings
        self.credential_mappings = {
            # Database credentials
            'database': {
                'postgres_user': 'POSTGRES_USER',
                'postgres_password': 'POSTGRES_PASSWORD',
                'postgres_db': 'POSTGRES_DB',
                'postgres_host': 'POSTGRES_HOST',
                'postgres_port': 'POSTGRES_PORT',
                'mongodb_username': 'MONGODB_USERNAME',
                'mongodb_password': 'MONGODB_PASSWORD',
                'mongodb_host': 'MONGODB_HOST',
                'mongodb_connection_string': 'MONGODB_CONNECTION_STRING',
                'redis_password': 'REDIS_PASSWORD',
                'redis_host': 'REDIS_HOST',
                'redis_port': 'REDIS_PORT',
            },
            
            # Application secrets
            'application': {
                'secret_key': 'SECRET_KEY',
                'jwt_secret_key': 'JWT_SECRET_KEY',
                'auth_secret_key': 'AUTH_SECRET_KEY',
                'encryption_key': 'ENCRYPTION_KEY',
                'flask_secret_key': 'FLASK_SECRET_KEY',
            },
            
            # External API keys
            'external_apis': {
                'sentry_dsn': 'SENTRY_DSN',
                'external_api_key': 'EXTERNAL_API_KEY',
                'github_token': 'GITHUB_TOKEN',
                'aws_access_key_id': 'AWS_ACCESS_KEY_ID',
                'aws_secret_access_key': 'AWS_SECRET_ACCESS_KEY',
            },
            
            # Monitoring and observability
            'monitoring': {
                'prometheus_username': 'PROMETHEUS_USERNAME',
                'prometheus_password': 'PROMETHEUS_PASSWORD',
                'grafana_admin_password': 'GRAFANA_ADMIN_PASSWORD',
            }
        }
        
        # Secure defaults for development
        self.secure_defaults = {
            'SECRET_KEY': self._generate_secure_key(32),
            'JWT_SECRET_KEY': self._generate_secure_key(32),
            'AUTH_SECRET_KEY': self._generate_secure_key(32),
            'ENCRYPTION_KEY': self._generate_secure_key(32),
            'FLASK_SECRET_KEY': self._generate_secure_key(32),
        }
    
    def _initialize_encryption(self, key: str):
        """Initialize Fernet encryption with provided key"""
        try:
            # If key is not base64 encoded, derive it
            if len(key) != 44 or not key.endswith('='):
                # Derive key from password using PBKDF2
                salt = b'sizewise_salt_2024'  # In production, use random salt
                kdf = PBKDF2HMAC(
                    algorithm=hashes.SHA256(),
                    length=32,
                    salt=salt,
                    iterations=100000,
                )
                derived_key = base64.urlsafe_b64encode(kdf.derive(key.encode()))
                self.fernet = Fernet(derived_key)
            else:
                self.fernet = Fernet(key.encode())
                
            logger.info("Encryption initialized for credential manager")
            
        except Exception as e:
            logger.error(f"Failed to initialize encryption: {e}")
            self.fernet = None
    
    def _generate_secure_key(self, length: int = 32) -> str:
        """Generate a cryptographically secure random key"""
        return secrets.token_urlsafe(length)
    
    def get_credential(self, category: str, credential_name: str, default: Optional[str] = None) -> Optional[str]:
        """Get credential from environment variables with fallback to secure defaults"""
        try:
            # Get environment variable name
            if category not in self.credential_mappings:
                logger.warning(f"Unknown credential category: {category}")
                return default
            
            if credential_name not in self.credential_mappings[category]:
                logger.warning(f"Unknown credential: {category}.{credential_name}")
                return default
            
            env_var = self.credential_mappings[category][credential_name]
            
            # Try to get from environment
            value = os.getenv(env_var)
            
            if value:
                # Decrypt if encrypted
                if self.fernet and value.startswith('enc:'):
                    try:
                        encrypted_value = value[4:]  # Remove 'enc:' prefix
                        decrypted = self.fernet.decrypt(encrypted_value.encode())
                        return decrypted.decode()
                    except Exception as e:
                        logger.error(f"Failed to decrypt credential {env_var}: {e}")
                        return default
                
                return value
            
            # Fallback to secure defaults for critical keys
            if env_var in self.secure_defaults:
                logger.warning(f"Using secure default for {env_var} - set environment variable in production")
                return self.secure_defaults[env_var]
            
            # Log missing credential
            if not default:
                logger.warning(f"Missing credential: {env_var}")
            
            return default
            
        except Exception as e:
            logger.error(f"Error getting credential {category}.{credential_name}: {e}")
            return default
    
    def set_credential(self, category: str, credential_name: str, value: str, encrypt: bool = True) -> bool:
        """Set credential in environment (for runtime configuration)"""
        try:
            if category not in self.credential_mappings:
                logger.error(f"Unknown credential category: {category}")
                return False
            
            if credential_name not in self.credential_mappings[category]:
                logger.error(f"Unknown credential: {category}.{credential_name}")
                return False
            
            env_var = self.credential_mappings[category][credential_name]
            
            # Encrypt if requested and encryption is available
            if encrypt and self.fernet:
                try:
                    encrypted = self.fernet.encrypt(value.encode())
                    value = f"enc:{encrypted.decode()}"
                except Exception as e:
                    logger.error(f"Failed to encrypt credential {env_var}: {e}")
                    return False
            
            # Set environment variable
            os.environ[env_var] = value
            logger.info(f"Credential set: {env_var}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error setting credential {category}.{credential_name}: {e}")
            return False
    
    def get_database_config(self) -> Dict[str, Any]:
        """Get complete database configuration"""
        return {
            'postgres': {
                'user': self.get_credential('database', 'postgres_user', 'sizewise'),
                'password': self.get_credential('database', 'postgres_password', 'changeme'),
                'database': self.get_credential('database', 'postgres_db', 'sizewise_db'),
                'host': self.get_credential('database', 'postgres_host', 'localhost'),
                'port': int(self.get_credential('database', 'postgres_port', '5432')),
            },
            'mongodb': {
                'username': self.get_credential('database', 'mongodb_username'),
                'password': self.get_credential('database', 'mongodb_password'),
                'host': self.get_credential('database', 'mongodb_host'),
                'connection_string': self.get_credential('database', 'mongodb_connection_string'),
            },
            'redis': {
                'password': self.get_credential('database', 'redis_password'),
                'host': self.get_credential('database', 'redis_host', 'localhost'),
                'port': int(self.get_credential('database', 'redis_port', '6379')),
            }
        }
    
    def get_application_secrets(self) -> Dict[str, str]:
        """Get application secret keys"""
        return {
            'secret_key': self.get_credential('application', 'secret_key'),
            'jwt_secret_key': self.get_credential('application', 'jwt_secret_key'),
            'auth_secret_key': self.get_credential('application', 'auth_secret_key'),
            'encryption_key': self.get_credential('application', 'encryption_key'),
            'flask_secret_key': self.get_credential('application', 'flask_secret_key'),
        }
    
    def get_external_api_keys(self) -> Dict[str, Optional[str]]:
        """Get external API keys"""
        return {
            'sentry_dsn': self.get_credential('external_apis', 'sentry_dsn'),
            'external_api_key': self.get_credential('external_apis', 'external_api_key'),
            'github_token': self.get_credential('external_apis', 'github_token'),
            'aws_access_key_id': self.get_credential('external_apis', 'aws_access_key_id'),
            'aws_secret_access_key': self.get_credential('external_apis', 'aws_secret_access_key'),
        }
    
    def validate_credentials(self) -> Dict[str, Any]:
        """Validate that all required credentials are available"""
        validation_results = {
            'valid': True,
            'missing_credentials': [],
            'using_defaults': [],
            'recommendations': []
        }
        
        # Required credentials for production
        required_credentials = [
            ('application', 'secret_key'),
            ('application', 'jwt_secret_key'),
            ('database', 'postgres_password'),
        ]
        
        for category, credential_name in required_credentials:
            env_var = self.credential_mappings[category][credential_name]
            value = os.getenv(env_var)
            
            if not value:
                if env_var in self.secure_defaults:
                    validation_results['using_defaults'].append(env_var)
                    validation_results['recommendations'].append(
                        f"Set {env_var} environment variable for production use"
                    )
                else:
                    validation_results['missing_credentials'].append(env_var)
                    validation_results['valid'] = False
        
        # Check for weak passwords
        weak_patterns = ['password', 'changeme', 'admin', '123456']
        for category in self.credential_mappings:
            for credential_name in self.credential_mappings[category]:
                value = self.get_credential(category, credential_name)
                if value and any(pattern in value.lower() for pattern in weak_patterns):
                    env_var = self.credential_mappings[category][credential_name]
                    validation_results['recommendations'].append(
                        f"Consider using a stronger value for {env_var}"
                    )
        
        return validation_results
    
    def generate_env_template(self, include_examples: bool = True) -> str:
        """Generate .env template with all required credentials"""
        template_lines = [
            "# SizeWise Suite Environment Configuration",
            "# Generated by Credential Manager",
            "# Copy this file to .env and fill in your values",
            "",
        ]
        
        for category, credentials in self.credential_mappings.items():
            template_lines.append(f"# {category.title()} Configuration")
            
            for credential_name, env_var in credentials.items():
                if include_examples:
                    if 'password' in credential_name or 'secret' in credential_name or 'key' in credential_name:
                        example = f"your_secure_{credential_name}_here"
                    elif 'host' in credential_name:
                        example = "localhost"
                    elif 'port' in credential_name:
                        example = "5432" if 'postgres' in credential_name else "6379"
                    elif 'db' in credential_name:
                        example = "sizewise_db"
                    else:
                        example = f"your_{credential_name}_here"
                    
                    template_lines.append(f"{env_var}={example}")
                else:
                    template_lines.append(f"{env_var}=")
            
            template_lines.append("")
        
        return "\n".join(template_lines)


# Global credential manager instance
_credential_manager = None

def get_credential_manager(encryption_key: Optional[str] = None) -> CredentialManager:
    """Get global credential manager instance"""
    global _credential_manager
    
    if _credential_manager is None:
        _credential_manager = CredentialManager(encryption_key)
    
    return _credential_manager

def get_secure_config() -> Dict[str, Any]:
    """Get secure configuration for the application"""
    manager = get_credential_manager()
    
    return {
        'database': manager.get_database_config(),
        'application': manager.get_application_secrets(),
        'external_apis': manager.get_external_api_keys(),
        'validation': manager.validate_credentials()
    }

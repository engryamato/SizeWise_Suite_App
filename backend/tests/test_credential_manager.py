"""
Test suite for secure credential management system
Validates credential security, encryption, and environment variable handling
"""

import pytest
import os
import tempfile
from unittest.mock import Mock, patch
from backend.security.credential_manager import CredentialManager, get_credential_manager, get_secure_config


class TestCredentialManager:
    """Test cases for CredentialManager class"""
    
    def setup_method(self):
        """Setup test environment"""
        # Clear any existing environment variables
        self.original_env = {}
        test_vars = [
            'SECRET_KEY', 'JWT_SECRET_KEY', 'POSTGRES_PASSWORD', 
            'MONGODB_USERNAME', 'MONGODB_PASSWORD', 'REDIS_PASSWORD'
        ]
        
        for var in test_vars:
            if var in os.environ:
                self.original_env[var] = os.environ[var]
                del os.environ[var]
        
        self.manager = CredentialManager()
    
    def teardown_method(self):
        """Cleanup test environment"""
        # Restore original environment variables
        for var, value in self.original_env.items():
            os.environ[var] = value
    
    def test_initialization_without_encryption(self):
        """Test credential manager initialization without encryption"""
        manager = CredentialManager()
        assert manager.fernet is None
        assert len(manager.credential_mappings) > 0
        assert 'database' in manager.credential_mappings
        assert 'application' in manager.credential_mappings
    
    def test_initialization_with_encryption(self):
        """Test credential manager initialization with encryption"""
        encryption_key = "test_encryption_key_for_sizewise"
        manager = CredentialManager(encryption_key)
        assert manager.fernet is not None
    
    def test_generate_secure_key(self):
        """Test secure key generation"""
        key1 = self.manager._generate_secure_key(32)
        key2 = self.manager._generate_secure_key(32)
        
        assert len(key1) > 30  # URL-safe base64 encoding
        assert len(key2) > 30
        assert key1 != key2  # Should be unique
    
    def test_get_credential_from_environment(self):
        """Test getting credential from environment variable"""
        os.environ['SECRET_KEY'] = 'test_secret_key'
        
        result = self.manager.get_credential('application', 'secret_key')
        assert result == 'test_secret_key'
    
    def test_get_credential_with_default(self):
        """Test getting credential with default value"""
        result = self.manager.get_credential('application', 'secret_key', 'default_value')
        assert result == 'default_value'
    
    def test_get_credential_with_secure_default(self):
        """Test getting credential with secure default"""
        result = self.manager.get_credential('application', 'secret_key')
        
        # Should return a secure default
        assert result is not None
        assert len(result) > 20
        assert result != 'secret_key'  # Should not be the credential name
    
    def test_get_credential_unknown_category(self):
        """Test getting credential from unknown category"""
        result = self.manager.get_credential('unknown_category', 'test_credential', 'default')
        assert result == 'default'
    
    def test_get_credential_unknown_credential(self):
        """Test getting unknown credential"""
        result = self.manager.get_credential('application', 'unknown_credential', 'default')
        assert result == 'default'
    
    def test_set_credential_without_encryption(self):
        """Test setting credential without encryption"""
        success = self.manager.set_credential('application', 'secret_key', 'new_secret', encrypt=False)
        assert success is True
        assert os.environ['SECRET_KEY'] == 'new_secret'
    
    def test_set_credential_with_encryption(self):
        """Test setting credential with encryption"""
        encryption_key = "test_encryption_key_for_sizewise"
        manager = CredentialManager(encryption_key)
        
        success = manager.set_credential('application', 'secret_key', 'encrypted_secret', encrypt=True)
        assert success is True
        
        # Environment variable should contain encrypted value
        env_value = os.environ['SECRET_KEY']
        assert env_value.startswith('enc:')
        
        # Should be able to retrieve decrypted value
        result = manager.get_credential('application', 'secret_key')
        assert result == 'encrypted_secret'
    
    def test_set_credential_unknown_category(self):
        """Test setting credential in unknown category"""
        success = self.manager.set_credential('unknown_category', 'test_credential', 'value')
        assert success is False
    
    def test_get_database_config(self):
        """Test getting complete database configuration"""
        # Set some test environment variables
        os.environ['POSTGRES_USER'] = 'test_user'
        os.environ['POSTGRES_PASSWORD'] = 'test_password'
        os.environ['POSTGRES_DB'] = 'test_db'
        
        config = self.manager.get_database_config()
        
        assert 'postgres' in config
        assert 'mongodb' in config
        assert 'redis' in config
        
        assert config['postgres']['user'] == 'test_user'
        assert config['postgres']['password'] == 'test_password'
        assert config['postgres']['database'] == 'test_db'
        assert config['postgres']['host'] == 'localhost'  # Default
        assert config['postgres']['port'] == 5432  # Default
    
    def test_get_application_secrets(self):
        """Test getting application secret keys"""
        secrets = self.manager.get_application_secrets()
        
        assert 'secret_key' in secrets
        assert 'jwt_secret_key' in secrets
        assert 'auth_secret_key' in secrets
        assert 'encryption_key' in secrets
        assert 'flask_secret_key' in secrets
        
        # All secrets should be non-empty
        for key, value in secrets.items():
            assert value is not None
            assert len(value) > 20  # Should be secure length
    
    def test_get_external_api_keys(self):
        """Test getting external API keys"""
        # Set a test API key
        os.environ['SENTRY_DSN'] = 'https://test@sentry.io/123456'
        
        api_keys = self.manager.get_external_api_keys()
        
        assert 'sentry_dsn' in api_keys
        assert 'external_api_key' in api_keys
        assert 'github_token' in api_keys
        
        assert api_keys['sentry_dsn'] == 'https://test@sentry.io/123456'
    
    def test_validate_credentials_all_present(self):
        """Test credential validation when all required credentials are present"""
        # Set required credentials
        os.environ['SECRET_KEY'] = 'strong_secret_key_for_testing'
        os.environ['JWT_SECRET_KEY'] = 'strong_jwt_secret_key_for_testing'
        os.environ['POSTGRES_PASSWORD'] = 'strong_postgres_password'
        
        validation = self.manager.validate_credentials()
        
        assert validation['valid'] is True
        assert len(validation['missing_credentials']) == 0
    
    def test_validate_credentials_missing_required(self):
        """Test credential validation when required credentials are missing"""
        # Don't set any credentials
        validation = self.manager.validate_credentials()
        
        # Should use defaults for some, but still flag as using defaults
        assert len(validation['using_defaults']) > 0
        assert len(validation['recommendations']) > 0
    
    def test_validate_credentials_weak_passwords(self):
        """Test credential validation detects weak passwords"""
        os.environ['POSTGRES_PASSWORD'] = 'password123'  # Weak password
        
        validation = self.manager.validate_credentials()
        
        # Should have recommendations about weak passwords
        assert len(validation['recommendations']) > 0
        weak_password_warning = any('stronger value' in rec for rec in validation['recommendations'])
        assert weak_password_warning
    
    def test_generate_env_template_with_examples(self):
        """Test generating .env template with examples"""
        template = self.manager.generate_env_template(include_examples=True)
        
        assert 'SizeWise Suite Environment Configuration' in template
        assert 'SECRET_KEY=' in template
        assert 'POSTGRES_PASSWORD=' in template
        assert 'your_secure_' in template  # Should have example values
    
    def test_generate_env_template_without_examples(self):
        """Test generating .env template without examples"""
        template = self.manager.generate_env_template(include_examples=False)
        
        assert 'SizeWise Suite Environment Configuration' in template
        assert 'SECRET_KEY=' in template
        assert 'POSTGRES_PASSWORD=' in template
        assert 'your_secure_' not in template  # Should not have example values


class TestCredentialManagerGlobalFunctions:
    """Test cases for global credential manager functions"""
    
    def test_get_credential_manager_singleton(self):
        """Test that get_credential_manager returns singleton instance"""
        manager1 = get_credential_manager()
        manager2 = get_credential_manager()
        
        assert manager1 is manager2  # Should be the same instance
    
    def test_get_credential_manager_with_encryption(self):
        """Test getting credential manager with encryption key"""
        # Reset global instance
        import backend.security.credential_manager
        backend.security.credential_manager._credential_manager = None
        
        encryption_key = "test_encryption_key"
        manager = get_credential_manager(encryption_key)
        
        assert manager.fernet is not None
    
    def test_get_secure_config(self):
        """Test getting secure configuration"""
        config = get_secure_config()
        
        assert 'database' in config
        assert 'application' in config
        assert 'external_apis' in config
        assert 'validation' in config
        
        # Database config should have all sections
        assert 'postgres' in config['database']
        assert 'mongodb' in config['database']
        assert 'redis' in config['database']
        
        # Application config should have secrets
        assert 'secret_key' in config['application']
        assert 'jwt_secret_key' in config['application']
        
        # Validation should have results
        assert 'valid' in config['validation']
        assert 'missing_credentials' in config['validation']


class TestCredentialManagerIntegration:
    """Integration tests for credential manager"""
    
    def test_mongodb_config_integration(self):
        """Test integration with MongoDB configuration"""
        # Set MongoDB credentials
        os.environ['MONGODB_USERNAME'] = 'test_mongo_user'
        os.environ['MONGODB_PASSWORD'] = 'test_mongo_password'
        os.environ['MONGODB_HOST'] = 'test.mongodb.net'
        
        manager = CredentialManager()
        db_config = manager.get_database_config()
        
        assert db_config['mongodb']['username'] == 'test_mongo_user'
        assert db_config['mongodb']['password'] == 'test_mongo_password'
        assert db_config['mongodb']['host'] == 'test.mongodb.net'
        
        # Cleanup
        del os.environ['MONGODB_USERNAME']
        del os.environ['MONGODB_PASSWORD']
        del os.environ['MONGODB_HOST']
    
    def test_flask_app_integration(self):
        """Test integration with Flask application configuration"""
        os.environ['SECRET_KEY'] = 'flask_test_secret_key'
        
        manager = CredentialManager()
        app_secrets = manager.get_application_secrets()
        
        assert app_secrets['secret_key'] == 'flask_test_secret_key'
        
        # Cleanup
        del os.environ['SECRET_KEY']
    
    def test_encryption_roundtrip(self):
        """Test encryption and decryption roundtrip"""
        encryption_key = "test_encryption_key_for_roundtrip"
        manager = CredentialManager(encryption_key)
        
        original_value = "super_secret_credential_value"
        
        # Set encrypted credential
        success = manager.set_credential('application', 'secret_key', original_value, encrypt=True)
        assert success is True
        
        # Retrieve and verify
        retrieved_value = manager.get_credential('application', 'secret_key')
        assert retrieved_value == original_value
        
        # Verify it was actually encrypted in environment
        env_value = os.environ['SECRET_KEY']
        assert env_value.startswith('enc:')
        assert original_value not in env_value


if __name__ == '__main__':
    pytest.main([__file__])

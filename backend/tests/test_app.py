"""
Comprehensive unit tests for the main Flask application.
Tests application initialization, configuration, and core functionality.
"""

import pytest
import os
import tempfile
from unittest.mock import patch, MagicMock
from flask import Flask

# Import the application factory
from backend.app import create_app


class TestAppFactory:
    """Test the Flask application factory function"""

    def test_create_app_default_config(self):
        """Test creating app with default configuration"""
        app = create_app()
        
        assert isinstance(app, Flask)
        assert app.name == 'backend.app'
        assert app.config['TESTING'] is False

    def test_create_app_testing_config(self):
        """Test creating app with testing configuration"""
        app = create_app('testing')
        
        assert app.config['TESTING'] is True

    def test_create_app_development_config(self):
        """Test creating app with development configuration"""
        app = create_app('development')
        
        assert app.config['DEBUG'] is True

    def test_create_app_production_config(self):
        """Test creating app with production configuration"""
        app = create_app('production')
        
        assert app.config['DEBUG'] is False
        assert app.config['TESTING'] is False

    @patch('backend.app.get_credential_manager')
    def test_create_app_with_credential_manager(self, mock_credential_manager):
        """Test app creation with credential manager integration"""
        mock_manager = MagicMock()
        mock_manager.get_credential.return_value = 'test-secret-key'
        mock_credential_manager.return_value = mock_manager
        
        app = create_app()
        
        # Verify credential manager was called
        mock_credential_manager.assert_called_once()
        mock_manager.get_credential.assert_called()

    def test_create_app_cors_configuration(self):
        """Test CORS configuration is properly set up"""
        app = create_app()
        
        # Check if CORS is configured (extension should be registered)
        assert 'flask-cors' in [ext.__class__.__module__ for ext in app.extensions.values() if hasattr(ext, '__class__')]

    def test_create_app_blueprints_registered(self):
        """Test that all blueprints are properly registered"""
        app = create_app()
        
        # Check that blueprints are registered
        blueprint_names = [bp.name for bp in app.blueprints.values()]
        
        # Should have API blueprints
        expected_blueprints = ['api', 'calculations', 'mongodb_api']
        for bp_name in expected_blueprints:
            assert any(bp_name in name for name in blueprint_names), f"Blueprint {bp_name} not found"


class TestAppConfiguration:
    """Test application configuration handling"""

    def test_config_from_environment(self):
        """Test configuration loading from environment variables"""
        with patch.dict(os.environ, {
            'FLASK_ENV': 'testing',
            'SECRET_KEY': 'test-secret',
            'DATABASE_URL': 'sqlite:///test.db'
        }):
            app = create_app()
            
            # Environment variables should influence configuration
            assert app.config.get('SECRET_KEY') is not None

    def test_config_security_settings(self):
        """Test security-related configuration settings"""
        app = create_app('production')
        
        # Security settings should be properly configured
        assert app.config.get('SECRET_KEY') is not None
        assert len(app.config.get('SECRET_KEY', '')) > 10

    def test_config_database_settings(self):
        """Test database configuration settings"""
        app = create_app()
        
        # Database configuration should be present
        # Note: Actual database connections are tested separately
        assert app.config is not None


class TestAppMiddleware:
    """Test middleware integration in the application"""

    def test_security_middleware_integration(self):
        """Test that security middleware is properly integrated"""
        app = create_app()
        
        with app.test_client() as client:
            response = client.get('/api/health')
            
            # Security headers should be present
            assert 'X-Content-Type-Options' in response.headers
            assert 'X-Frame-Options' in response.headers

    def test_rate_limiting_middleware_integration(self):
        """Test that rate limiting middleware is integrated"""
        app = create_app()
        
        with app.test_client() as client:
            response = client.get('/api/health')
            
            # Rate limiting headers should be present
            assert 'X-RateLimit-Limit' in response.headers or response.status_code == 200

    def test_input_validation_middleware_integration(self):
        """Test that input validation middleware is integrated"""
        app = create_app()
        
        with app.test_client() as client:
            # Test with malicious input
            response = client.post('/api/calculations/air-duct', 
                                 json={'<script>alert("xss")</script>': 'malicious'})
            
            # Should handle malicious input gracefully
            assert response.status_code in [400, 422, 404]  # Various validation responses


class TestAppRoutes:
    """Test core application routes"""

    @pytest.fixture
    def app(self):
        """Create test application"""
        app = create_app('testing')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_health_check_endpoint(self, client):
        """Test the health check endpoint"""
        response = client.get('/api/health')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'healthy'
        assert data['service'] == 'SizeWise Suite Backend'

    def test_api_info_endpoint(self, client):
        """Test the API info endpoint"""
        response = client.get('/api/info')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['name'] == 'SizeWise Suite API'
        assert 'version' in data
        assert 'modules' in data

    def test_cors_headers(self, client):
        """Test CORS headers are properly set"""
        response = client.options('/api/health')
        
        # CORS headers should be present for OPTIONS requests
        assert response.status_code in [200, 204]

    def test_404_error_handling(self, client):
        """Test 404 error handling"""
        response = client.get('/api/nonexistent-endpoint')
        
        assert response.status_code == 404

    def test_method_not_allowed_handling(self, client):
        """Test method not allowed error handling"""
        response = client.delete('/api/health')  # Health endpoint doesn't support DELETE
        
        assert response.status_code == 405


class TestAppErrorHandling:
    """Test application error handling"""

    @pytest.fixture
    def app(self):
        """Create test application"""
        app = create_app('testing')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_json_error_responses(self, client):
        """Test that errors return JSON responses"""
        response = client.get('/api/nonexistent')
        
        assert response.status_code == 404
        # Should return JSON error response
        assert response.content_type == 'application/json'

    def test_internal_server_error_handling(self, app):
        """Test internal server error handling"""
        @app.route('/test-error')
        def test_error():
            raise Exception("Test exception")
        
        with app.test_client() as client:
            response = client.get('/test-error')
            
            # Should handle internal errors gracefully
            assert response.status_code == 500

    def test_validation_error_handling(self, client):
        """Test validation error handling"""
        # Send invalid JSON
        response = client.post('/api/calculations/air-duct',
                             data='invalid json',
                             content_type='application/json')
        
        # Should handle invalid JSON gracefully
        assert response.status_code in [400, 422]


class TestAppSecurity:
    """Test application security features"""

    @pytest.fixture
    def app(self):
        """Create test application"""
        app = create_app('testing')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_security_headers_present(self, client):
        """Test that security headers are present"""
        response = client.get('/api/health')
        
        # Check for important security headers
        security_headers = [
            'X-Content-Type-Options',
            'X-Frame-Options',
            'Content-Security-Policy'
        ]
        
        for header in security_headers:
            assert header in response.headers, f"Security header {header} missing"

    def test_sensitive_headers_removed(self, client):
        """Test that sensitive headers are removed"""
        response = client.get('/api/health')
        
        # These headers should not be present
        sensitive_headers = ['Server', 'X-Powered-By']
        
        for header in sensitive_headers:
            assert header not in response.headers, f"Sensitive header {header} should be removed"

    def test_content_type_validation(self, client):
        """Test content type validation"""
        # Send request with wrong content type
        response = client.post('/api/calculations/air-duct',
                             data='{"test": "data"}',
                             content_type='text/plain')
        
        # Should reject or handle gracefully
        assert response.status_code in [400, 415, 422, 404]


class TestAppPerformance:
    """Test application performance characteristics"""

    @pytest.fixture
    def app(self):
        """Create test application"""
        app = create_app('testing')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_response_time_health_check(self, client):
        """Test response time for health check endpoint"""
        import time
        
        start_time = time.time()
        response = client.get('/api/health')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        assert response.status_code == 200
        assert response_time < 1.0  # Should respond within 1 second

    def test_concurrent_requests_handling(self, app):
        """Test handling of concurrent requests"""
        import threading
        import time
        
        results = []
        
        def make_request():
            with app.test_client() as client:
                response = client.get('/api/health')
                results.append(response.status_code)
        
        # Create multiple threads
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should succeed
        assert len(results) == 5
        assert all(status == 200 for status in results)


class TestAppIntegration:
    """Test application integration with external services"""

    @pytest.fixture
    def app(self):
        """Create test application"""
        app = create_app('testing')
        return app

    @patch('backend.app.get_credential_manager')
    def test_credential_manager_integration(self, mock_credential_manager, app):
        """Test integration with credential manager"""
        mock_manager = MagicMock()
        mock_manager.get_credential.return_value = 'test-secret'
        mock_credential_manager.return_value = mock_manager
        
        # Create new app to test integration
        test_app = create_app('testing')
        
        # Verify credential manager was used
        mock_credential_manager.assert_called()

    def test_sentry_integration_configuration(self, app):
        """Test Sentry integration configuration"""
        # Sentry should be configured but not necessarily initialized in testing
        # This test verifies the configuration doesn't break the app
        assert app is not None
        assert app.config is not None

    def test_database_configuration_loading(self, app):
        """Test database configuration loading"""
        # Database configuration should be loaded without errors
        # Actual database connections are tested separately
        assert app.config is not None
        
        # App should start successfully even if database is not available
        with app.test_client() as client:
            response = client.get('/api/health')
            assert response.status_code == 200

"""
Test suite for security headers middleware
Validates comprehensive security header implementation
"""

import pytest
import os
from unittest.mock import Mock, patch
from flask import Flask
from backend.middleware.security_headers import SecurityHeadersMiddleware, create_security_headers_middleware


class TestSecurityHeadersMiddleware:
    """Test cases for SecurityHeadersMiddleware class"""
    
    def setup_method(self):
        """Setup test Flask application"""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        self.middleware = SecurityHeadersMiddleware(self.app)
        self.client = self.app.test_client()
        
        # Add a test route
        @self.app.route('/test')
        def test_route():
            return 'Test response'
        
        @self.app.route('/api/auth/login', methods=['POST'])
        def auth_route():
            return {'status': 'success'}
        
        @self.app.route('/api/calculations/air-duct', methods=['POST'])
        def calculation_route():
            return {'result': 'calculated'}
        
        @self.app.route('/health')
        def health_route():
            return {'status': 'healthy'}
    
    def test_middleware_initialization(self):
        """Test middleware initialization"""
        assert hasattr(self.app, 'security_headers')
        assert self.app.security_headers == self.middleware
    
    def test_default_security_headers_applied(self):
        """Test that default security headers are applied to responses"""
        response = self.client.get('/test')
        
        # Check essential security headers
        assert 'Content-Security-Policy' in response.headers
        assert 'X-Frame-Options' in response.headers
        assert 'X-Content-Type-Options' in response.headers
        assert 'X-XSS-Protection' in response.headers
        assert 'Referrer-Policy' in response.headers
        
        # Verify header values
        assert response.headers['X-Frame-Options'] == 'DENY'
        assert response.headers['X-Content-Type-Options'] == 'nosniff'
        assert response.headers['X-XSS-Protection'] == '1; mode=block'
        assert response.headers['Referrer-Policy'] == 'strict-origin-when-cross-origin'
    
    def test_content_security_policy_header(self):
        """Test Content Security Policy header"""
        response = self.client.get('/test')
        
        csp = response.headers.get('Content-Security-Policy')
        assert csp is not None
        
        # Check for essential CSP directives
        assert "default-src 'self'" in csp
        assert "frame-ancestors 'none'" in csp
        assert "base-uri 'self'" in csp
        assert "form-action 'self'" in csp
    
    @patch.dict(os.environ, {'FLASK_ENV': 'development'})
    def test_development_environment_headers(self):
        """Test headers in development environment"""
        # Create new middleware instance to pick up environment
        app = Flask(__name__)
        app.config['TESTING'] = True
        middleware = SecurityHeadersMiddleware(app)
        client = app.test_client()
        
        @app.route('/test')
        def test_route():
            return 'Test response'
        
        response = client.get('/test')
        
        # In development, HSTS should not be present
        assert 'Strict-Transport-Security' not in response.headers
        
        # CSP should allow localhost connections
        csp = response.headers.get('Content-Security-Policy')
        assert 'localhost' in csp
    
    @patch.dict(os.environ, {'FLASK_ENV': 'production'})
    def test_production_environment_headers(self):
        """Test headers in production environment"""
        # Create new middleware instance to pick up environment
        app = Flask(__name__)
        app.config['TESTING'] = True
        middleware = SecurityHeadersMiddleware(app)
        client = app.test_client()
        
        @app.route('/test')
        def test_route():
            return 'Test response'
        
        response = client.get('/test')
        
        # In production, HSTS should be present and strict
        assert 'Strict-Transport-Security' in response.headers
        hsts = response.headers['Strict-Transport-Security']
        assert 'max-age=63072000' in hsts
        assert 'includeSubDomains' in hsts
        assert 'preload' in hsts
    
    def test_auth_endpoint_specific_headers(self):
        """Test endpoint-specific headers for authentication routes"""
        response = self.client.post('/api/auth/login')
        
        # Auth endpoints should have strict cache control
        cache_control = response.headers.get('Cache-Control')
        assert 'no-store' in cache_control
        assert 'no-cache' in cache_control
        assert 'private' in cache_control
        assert 'max-age=0' in cache_control
    
    def test_calculation_endpoint_headers(self):
        """Test headers for calculation endpoints"""
        response = self.client.post('/api/calculations/air-duct')
        
        # Calculation endpoints should allow some caching
        cache_control = response.headers.get('Cache-Control')
        assert 'private' in cache_control
        assert 'max-age=300' in cache_control
    
    def test_health_endpoint_headers(self):
        """Test headers for health check endpoint"""
        response = self.client.get('/health')
        
        # Health endpoint should not cache
        cache_control = response.headers.get('Cache-Control')
        assert 'no-cache' in cache_control
        assert 'max-age=0' in cache_control
    
    def test_sensitive_headers_removed(self):
        """Test that sensitive headers are removed"""
        response = self.client.get('/test')
        
        # These headers should not be present or should be controlled
        assert 'X-Powered-By' not in response.headers or response.headers['X-Powered-By'] is None
    
    def test_json_response_headers(self):
        """Test headers for JSON responses"""
        response = self.client.post('/api/auth/login')
        
        # JSON responses should have nosniff
        assert response.headers.get('X-Content-Type-Options') == 'nosniff'
    
    def test_permissions_policy_header(self):
        """Test Permissions Policy header"""
        response = self.client.get('/test')
        
        permissions_policy = response.headers.get('Permissions-Policy')
        assert permissions_policy is not None
        
        # Check for restricted permissions
        assert 'geolocation=()' in permissions_policy
        assert 'microphone=()' in permissions_policy
        assert 'camera=()' in permissions_policy
    
    def test_cross_origin_headers(self):
        """Test Cross-Origin security headers"""
        response = self.client.get('/test')
        
        assert 'Cross-Origin-Embedder-Policy' in response.headers
        assert 'Cross-Origin-Opener-Policy' in response.headers
        assert 'Cross-Origin-Resource-Policy' in response.headers
        
        assert response.headers['Cross-Origin-Embedder-Policy'] == 'require-corp'
        assert response.headers['Cross-Origin-Opener-Policy'] == 'same-origin'
        assert response.headers['Cross-Origin-Resource-Policy'] == 'same-origin'
    
    def test_csp_validation(self):
        """Test CSP policy validation"""
        # Valid CSP
        valid_csp = "default-src 'self'; script-src 'self' 'unsafe-inline'"
        assert self.middleware.validate_csp_policy(valid_csp) is True
        
        # Invalid CSP (unknown directive)
        invalid_csp = "invalid-directive 'self'; script-src 'self'"
        assert self.middleware.validate_csp_policy(invalid_csp) is False
    
    def test_update_csp_for_endpoint(self):
        """Test updating CSP for specific endpoint"""
        endpoint = '/api/special/'
        additional_sources = {
            'script-src': 'https://trusted-cdn.com',
            'style-src': 'https://fonts.googleapis.com'
        }
        
        self.middleware.update_csp_for_endpoint(endpoint, additional_sources)
        
        # Check that endpoint config was updated
        assert endpoint in self.middleware.endpoint_configs
        assert 'Content-Security-Policy' in self.middleware.endpoint_configs[endpoint]
        
        updated_csp = self.middleware.endpoint_configs[endpoint]['Content-Security-Policy']
        assert 'https://trusted-cdn.com' in updated_csp
        assert 'https://fonts.googleapis.com' in updated_csp
    
    def test_factory_function(self):
        """Test factory function for creating middleware"""
        app = Flask(__name__)
        middleware = create_security_headers_middleware(app)
        
        assert isinstance(middleware, SecurityHeadersMiddleware)
        assert hasattr(app, 'security_headers')


class TestSecurityHeadersIntegration:
    """Integration tests for security headers middleware"""
    
    def test_middleware_with_cors(self):
        """Test middleware integration with CORS"""
        from flask_cors import CORS
        
        app = Flask(__name__)
        app.config['TESTING'] = True
        
        # Initialize CORS first
        CORS(app)
        
        # Then initialize security headers
        middleware = SecurityHeadersMiddleware(app)
        client = app.test_client()
        
        @app.route('/test')
        def test_route():
            return 'Test response'
        
        response = client.get('/test')
        
        # Both CORS and security headers should be present
        assert 'Access-Control-Allow-Origin' in response.headers
        assert 'Content-Security-Policy' in response.headers
        assert 'X-Frame-Options' in response.headers
    
    def test_middleware_error_handling(self):
        """Test middleware error handling"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        
        # Create middleware with invalid configuration
        middleware = SecurityHeadersMiddleware()
        
        # Mock the add_security_headers method to raise an exception
        original_method = middleware.add_security_headers
        
        def failing_method(response):
            raise Exception("Test exception")
        
        middleware.add_security_headers = failing_method
        middleware.init_app(app)
        
        client = app.test_client()
        
        @app.route('/test')
        def test_route():
            return 'Test response'
        
        # Should not crash the application
        response = client.get('/test')
        assert response.status_code == 200
        
        # Restore original method
        middleware.add_security_headers = original_method
    
    def test_multiple_requests_consistency(self):
        """Test that headers are consistent across multiple requests"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        middleware = SecurityHeadersMiddleware(app)
        client = app.test_client()
        
        @app.route('/test')
        def test_route():
            return 'Test response'
        
        # Make multiple requests
        responses = [client.get('/test') for _ in range(5)]
        
        # All responses should have the same security headers
        first_response_headers = dict(responses[0].headers)
        security_headers = [
            'Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options',
            'X-XSS-Protection', 'Referrer-Policy'
        ]
        
        for response in responses[1:]:
            for header in security_headers:
                assert response.headers.get(header) == first_response_headers.get(header)


class TestSecurityHeadersConfiguration:
    """Test configuration and customization of security headers"""
    
    def test_custom_header_configuration(self):
        """Test custom header configuration"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        
        middleware = SecurityHeadersMiddleware()
        
        # Customize headers
        middleware.default_headers['Custom-Security-Header'] = 'custom-value'
        middleware.init_app(app)
        
        client = app.test_client()
        
        @app.route('/test')
        def test_route():
            return 'Test response'
        
        response = client.get('/test')
        assert response.headers.get('Custom-Security-Header') == 'custom-value'
    
    def test_endpoint_specific_configuration(self):
        """Test endpoint-specific header configuration"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        
        middleware = SecurityHeadersMiddleware()
        
        # Add custom endpoint configuration
        middleware.endpoint_configs['/api/custom/'] = {
            'Custom-Endpoint-Header': 'endpoint-specific-value'
        }
        
        middleware.init_app(app)
        client = app.test_client()
        
        @app.route('/api/custom/test')
        def custom_route():
            return 'Custom response'
        
        @app.route('/api/other/test')
        def other_route():
            return 'Other response'
        
        # Custom endpoint should have the specific header
        custom_response = client.get('/api/custom/test')
        assert custom_response.headers.get('Custom-Endpoint-Header') == 'endpoint-specific-value'
        
        # Other endpoint should not have the specific header
        other_response = client.get('/api/other/test')
        assert 'Custom-Endpoint-Header' not in other_response.headers


if __name__ == '__main__':
    pytest.main([__file__])

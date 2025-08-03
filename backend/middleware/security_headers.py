"""
Security Headers Middleware for SizeWise Suite
Implements comprehensive security headers for all HTTP responses
"""

import logging
from typing import Dict, Any, Optional
from flask import Flask, request, g
import structlog

logger = structlog.get_logger()

class SecurityHeadersMiddleware:
    """Middleware for adding comprehensive security headers to all HTTP responses"""
    
    def __init__(self, app: Optional[Flask] = None):
        """Initialize security headers middleware"""
        self.app = app
        
        # Default security headers configuration
        self.default_headers = {
            # Content Security Policy - Strict policy for HVAC application
            'Content-Security-Policy': (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https://api.sizewise.com wss://api.sizewise.com; "
                "frame-ancestors 'none'; "
                "base-uri 'self'; "
                "form-action 'self'; "
                "upgrade-insecure-requests"
            ),
            
            # Strict Transport Security - Force HTTPS
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
            
            # X-Frame-Options - Prevent clickjacking
            'X-Frame-Options': 'DENY',
            
            # X-Content-Type-Options - Prevent MIME sniffing
            'X-Content-Type-Options': 'nosniff',
            
            # X-XSS-Protection - Enable XSS filtering
            'X-XSS-Protection': '1; mode=block',
            
            # Referrer Policy - Control referrer information
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            
            # Permissions Policy - Control browser features
            'Permissions-Policy': (
                'geolocation=(), '
                'microphone=(), '
                'camera=(), '
                'payment=(), '
                'usb=(), '
                'magnetometer=(), '
                'gyroscope=(), '
                'speaker=()'
            ),
            
            # Cross-Origin Embedder Policy
            'Cross-Origin-Embedder-Policy': 'require-corp',
            
            # Cross-Origin Opener Policy
            'Cross-Origin-Opener-Policy': 'same-origin',
            
            # Cross-Origin Resource Policy
            'Cross-Origin-Resource-Policy': 'same-origin',
            
            # Cache Control for sensitive endpoints
            'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            'Pragma': 'no-cache',
            'Expires': '0',
            
            # Server identification
            'Server': 'SizeWise-Suite/1.0',
            
            # X-Powered-By removal (handled by removing the header)
            'X-Powered-By': None,  # This will remove the header
        }
        
        # Environment-specific configurations
        self.environment_configs = {
            'development': {
                'Content-Security-Policy': (
                    "default-src 'self'; "
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com; "
                    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                    "font-src 'self' https://fonts.gstatic.com; "
                    "img-src 'self' data: https:; "
                    "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*; "
                    "frame-ancestors 'none'; "
                    "base-uri 'self'; "
                    "form-action 'self'"
                ),
                'Strict-Transport-Security': None,  # Don't enforce HTTPS in development
            },
            'production': {
                # Use stricter policies in production
                'Content-Security-Policy': (
                    "default-src 'self'; "
                    "script-src 'self'; "
                    "style-src 'self' https://fonts.googleapis.com; "
                    "font-src 'self' https://fonts.gstatic.com; "
                    "img-src 'self' data:; "
                    "connect-src 'self' https://api.sizewise.com wss://api.sizewise.com; "
                    "frame-ancestors 'none'; "
                    "base-uri 'self'; "
                    "form-action 'self'; "
                    "upgrade-insecure-requests"
                ),
                'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
            }
        }
        
        # Endpoint-specific header configurations
        self.endpoint_configs = {
            '/api/auth/': {
                'Cache-Control': 'no-store, no-cache, must-revalidate, private, max-age=0',
                'Set-Cookie': 'Secure; HttpOnly; SameSite=Strict',
            },
            '/api/calculations/': {
                'Cache-Control': 'private, max-age=300',  # Cache calculations for 5 minutes
            },
            '/api/exports/': {
                'Content-Disposition': 'attachment',
                'Cache-Control': 'no-store, no-cache, must-revalidate, private',
            },
            '/health': {
                'Cache-Control': 'no-cache, max-age=0',
            }
        }
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """Initialize middleware with Flask app"""
        # Add after_request handler for all responses
        app.after_request(self.add_security_headers)
        
        # Store middleware instance in app
        app.security_headers = self
        
        logger.info("Security headers middleware initialized")
    
    def get_environment(self) -> str:
        """Determine current environment"""
        import os
        return os.getenv('FLASK_ENV', 'development').lower()
    
    def get_headers_for_request(self) -> Dict[str, Any]:
        """Get security headers for current request"""
        headers = self.default_headers.copy()
        
        # Apply environment-specific configurations
        environment = self.get_environment()
        if environment in self.environment_configs:
            env_config = self.environment_configs[environment]
            for header, value in env_config.items():
                if value is None:
                    # Remove header if value is None
                    headers.pop(header, None)
                else:
                    headers[header] = value
        
        # Apply endpoint-specific configurations
        request_path = request.path
        for endpoint_pattern, endpoint_config in self.endpoint_configs.items():
            if request_path.startswith(endpoint_pattern):
                headers.update(endpoint_config)
                break
        
        return headers
    
    def add_security_headers(self, response):
        """Add security headers to response"""
        try:
            # Get headers for this request
            headers = self.get_headers_for_request()
            
            # Add each header to the response
            for header_name, header_value in headers.items():
                if header_value is None:
                    # Remove header if value is None
                    response.headers.pop(header_name, None)
                else:
                    response.headers[header_name] = header_value
            
            # Remove potentially sensitive headers
            sensitive_headers = ['X-Powered-By', 'Server']
            for header in sensitive_headers:
                if header not in headers:  # Only remove if not explicitly set
                    response.headers.pop(header, None)
            
            # Add security-related headers based on response content
            self._add_content_specific_headers(response)
            
            # Log security headers for debugging (in development only)
            if self.get_environment() == 'development':
                self._log_security_headers(response)
            
        except Exception as e:
            logger.error(f"Error adding security headers: {e}")
        
        return response
    
    def _add_content_specific_headers(self, response):
        """Add headers based on response content type"""
        content_type = response.headers.get('Content-Type', '').lower()
        
        # JSON API responses
        if 'application/json' in content_type:
            response.headers['X-Content-Type-Options'] = 'nosniff'
            
            # For API responses, ensure no caching of sensitive data
            if any(path in request.path for path in ['/api/auth/', '/api/user/', '/api/admin/']):
                response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, private'
        
        # File downloads
        elif any(content_type.startswith(t) for t in ['application/pdf', 'application/zip', 'text/csv']):
            response.headers['Content-Disposition'] = 'attachment'
            response.headers['X-Content-Type-Options'] = 'nosniff'
        
        # HTML responses
        elif 'text/html' in content_type:
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
    
    def _log_security_headers(self, response):
        """Log security headers for debugging (development only)"""
        security_header_names = [
            'Content-Security-Policy', 'Strict-Transport-Security', 'X-Frame-Options',
            'X-Content-Type-Options', 'X-XSS-Protection', 'Referrer-Policy'
        ]
        
        applied_headers = {}
        for header_name in security_header_names:
            if header_name in response.headers:
                applied_headers[header_name] = response.headers[header_name]
        
        if applied_headers:
            logger.debug("Security headers applied", 
                        endpoint=request.path, 
                        headers=applied_headers)
    
    def validate_csp_policy(self, policy: str) -> bool:
        """Validate Content Security Policy syntax"""
        try:
            # Basic CSP validation
            directives = policy.split(';')
            valid_directives = [
                'default-src', 'script-src', 'style-src', 'img-src', 'connect-src',
                'font-src', 'object-src', 'media-src', 'frame-src', 'sandbox',
                'report-uri', 'child-src', 'form-action', 'frame-ancestors',
                'plugin-types', 'base-uri', 'report-to', 'worker-src',
                'manifest-src', 'prefetch-src', 'navigate-to', 'upgrade-insecure-requests'
            ]
            
            for directive in directives:
                directive = directive.strip()
                if not directive:
                    continue
                
                directive_name = directive.split()[0]
                if directive_name not in valid_directives:
                    logger.warning(f"Unknown CSP directive: {directive_name}")
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"CSP validation error: {e}")
            return False
    
    def update_csp_for_endpoint(self, endpoint_pattern: str, additional_sources: Dict[str, str]):
        """Update CSP policy for specific endpoint"""
        if endpoint_pattern not in self.endpoint_configs:
            self.endpoint_configs[endpoint_pattern] = {}
        
        # Build updated CSP policy
        current_csp = self.default_headers.get('Content-Security-Policy', '')
        
        # Parse current CSP and add additional sources
        directives = {}
        for directive in current_csp.split(';'):
            directive = directive.strip()
            if directive:
                parts = directive.split()
                if parts:
                    directive_name = parts[0]
                    sources = parts[1:] if len(parts) > 1 else []
                    directives[directive_name] = sources
        
        # Add additional sources
        for directive_name, additional_source in additional_sources.items():
            if directive_name in directives:
                if additional_source not in directives[directive_name]:
                    directives[directive_name].append(additional_source)
            else:
                directives[directive_name] = [additional_source]
        
        # Rebuild CSP policy
        new_csp = '; '.join([
            f"{directive} {' '.join(sources)}" if sources else directive
            for directive, sources in directives.items()
        ])
        
        if self.validate_csp_policy(new_csp):
            self.endpoint_configs[endpoint_pattern]['Content-Security-Policy'] = new_csp
            logger.info(f"Updated CSP for endpoint {endpoint_pattern}")
        else:
            logger.error(f"Invalid CSP policy for endpoint {endpoint_pattern}")


def create_security_headers_middleware(app: Flask) -> SecurityHeadersMiddleware:
    """Factory function to create and configure security headers middleware"""
    return SecurityHeadersMiddleware(app)

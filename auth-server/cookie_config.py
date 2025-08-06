"""
Secure Cookie Configuration for SizeWise Suite
Implements secure cookie handling with httpOnly, secure, and SameSite attributes
"""

import os
import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional, Any

from flask import Flask, make_response, request, current_app
from werkzeug.security import generate_password_hash


class SecureCookieManager:
    """
    Manages secure cookies with proper security attributes and token handling
    """
    
    def __init__(self, app: Flask = None, config: Dict = None):
        """Initialize secure cookie manager"""
        self.config = {
            # Cookie security settings
            'secure_cookies': True,  # Use secure flag (HTTPS only)
            'httponly_cookies': True,  # Prevent XSS access
            'samesite_policy': 'Lax',  # CSRF protection
            'cookie_domain': None,  # Auto-detect or specify
            'cookie_path': '/',
            
            # Session cookie settings
            'session_cookie_name': 'sizewise_session',
            'session_cookie_max_age': 30 * 60,  # 30 minutes idle timeout
            'session_cookie_absolute_max_age': 24 * 60 * 60,  # 24 hours absolute
            
            # CSRF protection
            'csrf_token_name': 'csrf_token',
            'csrf_cookie_name': 'sizewise_csrf',
            'csrf_header_name': 'X-CSRF-Token',
            
            # Remember me functionality
            'remember_cookie_name': 'sizewise_remember',
            'remember_cookie_max_age': 30 * 24 * 60 * 60,  # 30 days
            
            # Override with provided config
            **(config or {})
        }
        
        if app:
            self.init_app(app)
    
    def init_app(self, app: Flask):
        """Initialize app with secure cookie settings"""
        # Configure Flask session cookies
        app.config.update({
            'SESSION_COOKIE_NAME': self.config['session_cookie_name'],
            'SESSION_COOKIE_HTTPONLY': self.config['httponly_cookies'],
            'SESSION_COOKIE_SECURE': self.config['secure_cookies'],
            'SESSION_COOKIE_SAMESITE': self.config['samesite_policy'],
            'PERMANENT_SESSION_LIFETIME': timedelta(seconds=self.config['session_cookie_max_age']),
        })
        
        # Set cookie domain if specified
        if self.config['cookie_domain']:
            app.config['SESSION_COOKIE_DOMAIN'] = self.config['cookie_domain']
        
        # Auto-detect secure settings based on environment
        if os.environ.get('FLASK_ENV') == 'development':
            app.config['SESSION_COOKIE_SECURE'] = False
            self.config['secure_cookies'] = False
    
    def set_session_cookie(self, 
                          response, 
                          session_id: str, 
                          max_age: int = None,
                          remember: bool = False) -> None:
        """
        Set secure session cookie with proper attributes
        
        Args:
            response: Flask response object
            session_id: Session identifier
            max_age: Cookie max age in seconds
            remember: Whether this is a "remember me" session
        """
        
        cookie_name = self.config['session_cookie_name']
        max_age = max_age or (
            self.config['remember_cookie_max_age'] if remember 
            else self.config['session_cookie_max_age']
        )
        
        # Set the cookie with security attributes
        response.set_cookie(
            cookie_name,
            value=session_id,
            max_age=max_age,
            secure=self.config['secure_cookies'],
            httponly=self.config['httponly_cookies'],
            samesite=self.config['samesite_policy'],
            domain=self.config['cookie_domain'],
            path=self.config['cookie_path']
        )
    
    def set_csrf_cookie(self, response, csrf_token: str) -> None:
        """
        Set CSRF protection cookie
        
        Args:
            response: Flask response object
            csrf_token: CSRF token value
        """
        
        response.set_cookie(
            self.config['csrf_cookie_name'],
            value=csrf_token,
            max_age=self.config['session_cookie_max_age'],
            secure=self.config['secure_cookies'],
            httponly=False,  # JavaScript needs to read this for AJAX requests
            samesite=self.config['samesite_policy'],
            domain=self.config['cookie_domain'],
            path=self.config['cookie_path']
        )
    
    def clear_session_cookie(self, response) -> None:
        """Clear session cookie"""
        response.set_cookie(
            self.config['session_cookie_name'],
            value='',
            expires=0,
            secure=self.config['secure_cookies'],
            httponly=self.config['httponly_cookies'],
            samesite=self.config['samesite_policy'],
            domain=self.config['cookie_domain'],
            path=self.config['cookie_path']
        )
    
    def clear_csrf_cookie(self, response) -> None:
        """Clear CSRF cookie"""
        response.set_cookie(
            self.config['csrf_cookie_name'],
            value='',
            expires=0,
            secure=self.config['secure_cookies'],
            httponly=False,
            samesite=self.config['samesite_policy'],
            domain=self.config['cookie_domain'],
            path=self.config['cookie_path']
        )
    
    def clear_all_cookies(self, response) -> None:
        """Clear all application cookies"""
        self.clear_session_cookie(response)
        self.clear_csrf_cookie(response)
        
        # Clear remember me cookie if it exists
        response.set_cookie(
            self.config['remember_cookie_name'],
            value='',
            expires=0,
            secure=self.config['secure_cookies'],
            httponly=self.config['httponly_cookies'],
            samesite=self.config['samesite_policy'],
            domain=self.config['cookie_domain'],
            path=self.config['cookie_path']
        )
    
    def get_session_cookie(self) -> Optional[str]:
        """Get session cookie value from request"""
        return request.cookies.get(self.config['session_cookie_name'])
    
    def get_csrf_token(self) -> Optional[str]:
        """Get CSRF token from cookie or header"""
        # Try cookie first
        csrf_token = request.cookies.get(self.config['csrf_cookie_name'])
        
        # Try header if no cookie
        if not csrf_token:
            csrf_token = request.headers.get(self.config['csrf_header_name'])
        
        return csrf_token
    
    def generate_csrf_token(self) -> str:
        """Generate a secure CSRF token"""
        return secrets.token_urlsafe(32)
    
    def validate_csrf_token(self, provided_token: str) -> bool:
        """
        Validate CSRF token
        
        Args:
            provided_token: Token provided in request
            
        Returns:
            bool: True if token is valid
        """
        
        stored_token = self.get_csrf_token()
        
        if not stored_token or not provided_token:
            return False
        
        # Use secrets.compare_digest to prevent timing attacks
        return secrets.compare_digest(stored_token, provided_token)
    
    def create_secure_response(self, 
                             data: Any, 
                             status_code: int = 200,
                             session_id: str = None,
                             csrf_token: str = None,
                             clear_cookies: bool = False) -> Any:
        """
        Create response with secure cookies
        
        Args:
            data: Response data (dict for JSON, str for text)
            status_code: HTTP status code
            session_id: Session ID to set in cookie
            csrf_token: CSRF token to set in cookie
            clear_cookies: Whether to clear all cookies
            
        Returns:
            Flask response object
        """
        
        if isinstance(data, dict):
            from flask import jsonify
            response = make_response(jsonify(data), status_code)
        else:
            response = make_response(data, status_code)
        
        # Clear cookies if requested
        if clear_cookies:
            self.clear_all_cookies(response)
            return response
        
        # Set session cookie
        if session_id:
            self.set_session_cookie(response, session_id)
        
        # Set CSRF cookie
        if csrf_token:
            self.set_csrf_cookie(response, csrf_token)
        
        # Add security headers
        self._add_security_headers(response)
        
        return response
    
    def _add_security_headers(self, response) -> None:
        """Add security headers to response"""
        
        # Prevent XSS
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self'; "
            "frame-ancestors 'none';"
        )
        response.headers['Content-Security-Policy'] = csp
        
        # HSTS (only in production with HTTPS)
        if self.config['secure_cookies'] and current_app.env != 'development':
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'


class CSRFProtection:
    """
    CSRF Protection middleware
    """
    
    def __init__(self, cookie_manager: SecureCookieManager):
        self.cookie_manager = cookie_manager
        
        # Methods that require CSRF protection
        self.protected_methods = {'POST', 'PUT', 'PATCH', 'DELETE'}
        
        # Endpoints that are exempt from CSRF protection
        self.exempt_endpoints = set()
    
    def exempt(self, endpoint: str) -> None:
        """Add endpoint to CSRF exemption list"""
        self.exempt_endpoints.add(endpoint)
    
    def protect_request(self) -> bool:
        """
        Check if current request needs CSRF protection
        
        Returns:
            bool: True if protection is required and valid, False if invalid
        """
        
        # Skip if method doesn't need protection
        if request.method not in self.protected_methods:
            return True
        
        # Skip if endpoint is exempt
        if request.endpoint in self.exempt_endpoints:
            return True
        
        # Get CSRF token from form or header
        csrf_token = None
        
        # Try form data first
        if request.form:
            csrf_token = request.form.get(self.cookie_manager.config['csrf_token_name'])
        
        # Try JSON data
        if not csrf_token and request.is_json:
            json_data = request.get_json(silent=True)
            if json_data:
                csrf_token = json_data.get(self.cookie_manager.config['csrf_token_name'])
        
        # Try header
        if not csrf_token:
            csrf_token = request.headers.get(self.cookie_manager.config['csrf_header_name'])
        
        # Validate token
        return self.cookie_manager.validate_csrf_token(csrf_token)


# Global instances
cookie_manager = None
csrf_protection = None


def init_secure_cookies(app: Flask, config: Dict = None) -> SecureCookieManager:
    """
    Initialize secure cookie management for Flask app
    
    Args:
        app: Flask application
        config: Cookie configuration dictionary
        
    Returns:
        SecureCookieManager instance
    """
    
    global cookie_manager, csrf_protection
    
    cookie_manager = SecureCookieManager(app, config)
    csrf_protection = CSRFProtection(cookie_manager)
    
    return cookie_manager


def get_cookie_manager() -> SecureCookieManager:
    """Get the global cookie manager instance"""
    if cookie_manager is None:
        raise RuntimeError("Cookie manager not initialized")
    return cookie_manager


def get_csrf_protection() -> CSRFProtection:
    """Get the global CSRF protection instance"""
    if csrf_protection is None:
        raise RuntimeError("CSRF protection not initialized")
    return csrf_protection

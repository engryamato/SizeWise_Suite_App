"""
Advanced Rate Limiting Middleware for SizeWise Suite
Implements Redis-based distributed rate limiting with configurable rules
"""

import time
import json
import logging
from typing import Dict, Optional, Tuple, Any
from functools import wraps
from flask import request, jsonify, g
import redis
from datetime import datetime, timedelta

# Configure logging
logger = logging.getLogger(__name__)

class RateLimiter:
    """Redis-based distributed rate limiter with multiple algorithms"""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        """Initialize rate limiter with Redis client"""
        self.redis_client = redis_client or redis.Redis(
            host='localhost', 
            port=6379, 
            db=0, 
            decode_responses=True
        )
        
        # Default rate limit configurations
        self.default_limits = {
            'anonymous': {'requests': 100, 'window': 60},  # 100 req/min for anonymous
            'authenticated': {'requests': 1000, 'window': 60},  # 1000 req/min for authenticated
            'premium': {'requests': 5000, 'window': 60},  # 5000 req/min for premium users
        }
        
        # Endpoint-specific limits
        self.endpoint_limits = {
            '/api/calculations/hvac': {'requests': 200, 'window': 60},
            '/api/calculations/complex': {'requests': 50, 'window': 60},
            '/api/export/pdf': {'requests': 20, 'window': 60},
            '/api/export/excel': {'requests': 30, 'window': 60},
            '/api/3d/render': {'requests': 100, 'window': 60},
        }
        
        logger.info("Rate limiter initialized with Redis backend")
    
    def get_client_identifier(self) -> str:
        """Get unique identifier for the client"""
        # Try to get authenticated user ID first
        user_id = getattr(g, 'user_id', None)
        if user_id:
            return f"user:{user_id}"
        
        # Fall back to IP address for anonymous users
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        if ip_address:
            # Handle multiple IPs in X-Forwarded-For header
            ip_address = ip_address.split(',')[0].strip()
        
        return f"ip:{ip_address}"
    
    def get_user_tier(self) -> str:
        """Determine user tier for rate limiting"""
        user_tier = getattr(g, 'user_tier', None)
        if user_tier in ['premium', 'enterprise']:
            return 'premium'
        elif getattr(g, 'user_id', None):
            return 'authenticated'
        else:
            return 'anonymous'
    
    def get_rate_limit_config(self, endpoint: str) -> Dict[str, int]:
        """Get rate limit configuration for endpoint and user"""
        # Check for endpoint-specific limits first
        if endpoint in self.endpoint_limits:
            return self.endpoint_limits[endpoint]
        
        # Fall back to user tier limits
        user_tier = self.get_user_tier()
        return self.default_limits[user_tier]
    
    def is_rate_limited(self, endpoint: str) -> Tuple[bool, Dict[str, Any]]:
        """Check if request should be rate limited"""
        try:
            client_id = self.get_client_identifier()
            config = self.get_rate_limit_config(endpoint)
            
            # Create Redis key
            window_start = int(time.time()) // config['window'] * config['window']
            key = f"rate_limit:{client_id}:{endpoint}:{window_start}"
            
            # Get current count
            current_count = self.redis_client.get(key)
            current_count = int(current_count) if current_count else 0
            
            # Check if limit exceeded
            if current_count >= config['requests']:
                return True, {
                    'limit': config['requests'],
                    'window': config['window'],
                    'current': current_count,
                    'reset_time': window_start + config['window']
                }
            
            # Increment counter
            pipe = self.redis_client.pipeline()
            pipe.incr(key)
            pipe.expire(key, config['window'])
            pipe.execute()
            
            return False, {
                'limit': config['requests'],
                'window': config['window'],
                'current': current_count + 1,
                'reset_time': window_start + config['window']
            }
            
        except Exception as e:
            logger.error(f"Rate limiting error: {e}")
            # Fail open - allow request if Redis is down
            return False, {'error': 'Rate limiting unavailable'}
    
    def add_rate_limit_headers(self, response, rate_info: Dict[str, Any]):
        """Add rate limiting headers to response"""
        if 'error' not in rate_info:
            response.headers['X-RateLimit-Limit'] = str(rate_info['limit'])
            response.headers['X-RateLimit-Remaining'] = str(max(0, rate_info['limit'] - rate_info['current']))
            response.headers['X-RateLimit-Reset'] = str(rate_info['reset_time'])
            response.headers['X-RateLimit-Window'] = str(rate_info['window'])
        
        return response


def rate_limit(endpoint_override: Optional[str] = None):
    """Decorator for applying rate limiting to Flask routes"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Initialize rate limiter
            limiter = RateLimiter()
            
            # Determine endpoint
            endpoint = endpoint_override or request.endpoint or request.path
            
            # Check rate limit
            is_limited, rate_info = limiter.is_rate_limited(endpoint)
            
            if is_limited:
                response = jsonify({
                    'error': 'Rate limit exceeded',
                    'message': f'Too many requests. Limit: {rate_info["limit"]} per {rate_info["window"]} seconds',
                    'retry_after': rate_info['reset_time'] - int(time.time())
                })
                response.status_code = 429
                return limiter.add_rate_limit_headers(response, rate_info)
            
            # Execute the original function
            result = f(*args, **kwargs)
            
            # Add rate limit headers to successful responses
            if hasattr(result, 'headers'):
                result = limiter.add_rate_limit_headers(result, rate_info)
            
            return result
        
        return decorated_function
    return decorator


class RateLimitMiddleware:
    """Flask middleware for automatic rate limiting"""
    
    def __init__(self, app=None, redis_client=None):
        self.app = app
        self.limiter = RateLimiter(redis_client)
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize middleware with Flask app"""
        app.before_request(self.before_request)
        app.after_request(self.after_request)
        
        # Store limiter in app context
        app.rate_limiter = self.limiter
        
        logger.info("Rate limiting middleware initialized")
    
    def before_request(self):
        """Check rate limits before processing request"""
        # Skip rate limiting for certain paths
        if self.should_skip_rate_limiting():
            return None
        
        endpoint = request.endpoint or request.path
        is_limited, rate_info = self.limiter.is_rate_limited(endpoint)
        
        if is_limited:
            response = jsonify({
                'error': 'Rate limit exceeded',
                'message': f'Too many requests. Limit: {rate_info["limit"]} per {rate_info["window"]} seconds',
                'retry_after': rate_info['reset_time'] - int(time.time()),
                'documentation': 'https://docs.sizewise.com/api/rate-limits'
            })
            response.status_code = 429
            return self.limiter.add_rate_limit_headers(response, rate_info)
        
        # Store rate info for after_request
        g.rate_info = rate_info
    
    def after_request(self, response):
        """Add rate limit headers to response"""
        if hasattr(g, 'rate_info') and not self.should_skip_rate_limiting():
            response = self.limiter.add_rate_limit_headers(response, g.rate_info)
        
        return response
    
    def should_skip_rate_limiting(self) -> bool:
        """Determine if rate limiting should be skipped for this request"""
        # Skip for health checks and static assets
        skip_paths = ['/health', '/metrics', '/static/', '/favicon.ico']
        
        for path in skip_paths:
            if request.path.startswith(path):
                return True
        
        # Skip for OPTIONS requests (CORS preflight)
        if request.method == 'OPTIONS':
            return True
        
        return False

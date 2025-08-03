"""
Test suite for rate limiting middleware
Validates rate limiting functionality and performance
"""

import pytest
import time
import asyncio
from unittest.mock import Mock, patch
from flask import Flask, jsonify, g
import redis
from backend.middleware.rate_limiter import RateLimiter, RateLimitMiddleware, rate_limit
from tests.fixtures.test_data_factory import TestDataFactory, UserTier


class TestRateLimiter:
    """Test cases for RateLimiter class"""
    
    def setup_method(self):
        """Setup test environment"""
        # Create Flask app for testing
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True

        # Mock Redis client
        self.mock_redis = Mock()
        self.limiter = RateLimiter(self.mock_redis)
    
    def test_get_client_identifier_authenticated(self):
        """Test client identifier for authenticated users"""
        with self.app.test_request_context('/'):
            with patch('backend.middleware.rate_limiter.g') as mock_g:
                mock_g.user_id = 'user123'
                identifier = self.limiter.get_client_identifier()
                assert identifier == 'user:user123'
    
    def test_get_client_identifier_anonymous(self):
        """Test client identifier for anonymous users"""
        with self.app.test_request_context('/', environ_base={'REMOTE_ADDR': '192.168.1.1'}):
            with patch('backend.middleware.rate_limiter.g') as mock_g:
                mock_g.user_id = None
                identifier = self.limiter.get_client_identifier()
                assert identifier == 'ip:192.168.1.1'
    
    def test_get_user_tier_premium(self):
        """Test user tier detection for premium users"""
        with self.app.test_request_context('/'):
            with patch('backend.middleware.rate_limiter.g') as mock_g:
                mock_g.user_tier = 'premium'
                tier = self.limiter.get_user_tier()
                assert tier == 'premium'

    def test_get_user_tier_authenticated(self):
        """Test user tier detection for authenticated users"""
        with self.app.test_request_context('/'):
            with patch('backend.middleware.rate_limiter.g') as mock_g:
                mock_g.user_tier = None
                mock_g.user_id = 'user123'
                tier = self.limiter.get_user_tier()
                assert tier == 'authenticated'

    def test_get_user_tier_anonymous(self):
        """Test user tier detection for anonymous users"""
        with self.app.test_request_context('/'):
            with patch('backend.middleware.rate_limiter.g') as mock_g:
                mock_g.user_tier = None
                mock_g.user_id = None
                tier = self.limiter.get_user_tier()
                assert tier == 'anonymous'
    
    def test_rate_limit_config_endpoint_specific(self):
        """Test endpoint-specific rate limit configuration"""
        config = self.limiter.get_rate_limit_config('/api/calculations/hvac')
        assert config['requests'] == 200
        assert config['window'] == 60
    
    def test_rate_limit_config_user_tier(self):
        """Test user tier-based rate limit configuration"""
        with self.app.test_request_context('/'):
            with patch('backend.middleware.rate_limiter.g') as mock_g:
                mock_g.user_tier = 'premium'
                config = self.limiter.get_rate_limit_config('/api/unknown')
                assert config['requests'] == 5000
                assert config['window'] == 60
    
    def test_is_rate_limited_under_limit(self):
        """Test rate limiting when under limit"""
        # Mock Redis responses
        self.mock_redis.get.return_value = '5'  # Current count
        self.mock_redis.pipeline.return_value.incr.return_value = None
        self.mock_redis.pipeline.return_value.expire.return_value = None
        self.mock_redis.pipeline.return_value.execute.return_value = None
        
        with self.app.test_request_context('/'):
            with patch('backend.middleware.rate_limiter.g') as mock_g, \
                 patch('time.time', return_value=1000):
                mock_g.user_id = 'user123'

                is_limited, rate_info = self.limiter.is_rate_limited('/api/test')

                assert not is_limited
                assert rate_info['current'] == 6  # 5 + 1
                assert rate_info['limit'] == 1000  # authenticated user limit
    
    def test_is_rate_limited_over_limit(self):
        """Test rate limiting when over limit"""
        # Mock Redis responses
        self.mock_redis.get.return_value = '1000'  # At limit
        
        with self.app.test_request_context('/'):
            with patch('backend.middleware.rate_limiter.g') as mock_g, \
                 patch('time.time', return_value=1000):
                mock_g.user_id = 'user123'

                is_limited, rate_info = self.limiter.is_rate_limited('/api/test')

                assert is_limited
                assert rate_info['current'] == 1000
                assert rate_info['limit'] == 1000
    
    def test_is_rate_limited_redis_error(self):
        """Test rate limiting when Redis is unavailable"""
        # Mock Redis error
        self.mock_redis.get.side_effect = Exception("Redis connection failed")
        
        with self.app.test_request_context('/'):
            with patch('backend.middleware.rate_limiter.g') as mock_g:
                mock_g.user_id = 'user123'

                is_limited, rate_info = self.limiter.is_rate_limited('/api/test')

                # Should fail open (allow request)
                assert not is_limited
                assert 'error' in rate_info
    
    def test_add_rate_limit_headers(self):
        """Test adding rate limit headers to response"""
        mock_response = Mock()
        mock_response.headers = {}
        
        rate_info = {
            'limit': 1000,
            'current': 50,
            'reset_time': 1234567890,
            'window': 60
        }
        
        result = self.limiter.add_rate_limit_headers(mock_response, rate_info)
        
        assert result.headers['X-RateLimit-Limit'] == '1000'
        assert result.headers['X-RateLimit-Remaining'] == '950'
        assert result.headers['X-RateLimit-Reset'] == '1234567890'
        assert result.headers['X-RateLimit-Window'] == '60'


class TestRateLimitDecorator:
    """Test cases for rate_limit decorator"""
    
    def setup_method(self):
        """Setup test environment"""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
    
    def test_rate_limit_decorator_success(self):
        """Test rate limit decorator when under limit"""
        with self.app.test_request_context():
            @rate_limit()
            def test_endpoint():
                return jsonify({'message': 'success'})
            
            with patch.object(RateLimiter, 'is_rate_limited', return_value=(False, {
                'limit': 100, 'current': 1, 'reset_time': int(time.time()) + 60, 'window': 60
            })):
                response = test_endpoint()
                assert response.status_code == 200
    
    def test_rate_limit_decorator_blocked(self):
        """Test rate limit decorator when over limit"""
        with self.app.test_request_context():
            @rate_limit()
            def test_endpoint():
                return jsonify({'message': 'success'})
            
            rate_info = {
                'limit': 100,
                'current': 100,
                'reset_time': int(time.time()) + 60,
                'window': 60
            }
            
            with patch.object(RateLimiter, 'is_rate_limited', return_value=(True, rate_info)):
                response = test_endpoint()
                assert response.status_code == 429
                assert 'Rate limit exceeded' in response.get_json()['error']


class TestRateLimitMiddleware:
    """Test cases for RateLimitMiddleware class"""
    
    def setup_method(self):
        """Setup test environment"""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        
        # Add a test route
        @self.app.route('/api/test')
        def test_route():
            return jsonify({'message': 'success'})
        
        @self.app.route('/health')
        def health_route():
            return jsonify({'status': 'ok'})
    
    def test_middleware_initialization(self):
        """Test middleware initialization"""
        middleware = RateLimitMiddleware(self.app)
        assert hasattr(self.app, 'rate_limiter')
        assert middleware.limiter is not None
    
    def test_middleware_skip_health_check(self):
        """Test middleware skips health check endpoints"""
        middleware = RateLimitMiddleware(self.app)
        
        with self.app.test_request_context('/health'):
            assert middleware.should_skip_rate_limiting() is True
    
    def test_middleware_skip_options_request(self):
        """Test middleware skips OPTIONS requests"""
        middleware = RateLimitMiddleware(self.app)
        
        with self.app.test_request_context('/api/test', method='OPTIONS'):
            assert middleware.should_skip_rate_limiting() is True
    
    def test_middleware_process_normal_request(self):
        """Test middleware processes normal requests"""
        middleware = RateLimitMiddleware(self.app)
        
        with self.app.test_request_context('/api/test'):
            assert middleware.should_skip_rate_limiting() is False


class TestRateLimitingIntegration:
    """Integration tests for rate limiting"""
    
    def setup_method(self):
        """Setup test environment"""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        
        # Initialize middleware
        self.middleware = RateLimitMiddleware(self.app)
        
        # Add test routes
        @self.app.route('/api/test')
        def test_route():
            return jsonify({'message': 'success'})
        
        self.client = self.app.test_client()
    
    def test_rate_limiting_headers_added(self):
        """Test that rate limiting headers are added to responses"""
        with patch.object(RateLimiter, 'is_rate_limited') as mock_rate_check:
            mock_rate_check.return_value = (False, {
                'limit': 100,
                'current': 1,
                'reset_time': int(time.time()) + 60,
                'window': 60
            })
            
            response = self.client.get('/api/test')
            
            assert response.status_code == 200
            assert 'X-RateLimit-Limit' in response.headers
            assert 'X-RateLimit-Remaining' in response.headers
            assert 'X-RateLimit-Reset' in response.headers
    
    def test_rate_limiting_blocks_requests(self):
        """Test that rate limiting blocks excessive requests"""
        with patch.object(RateLimiter, 'is_rate_limited') as mock_rate_check:
            mock_rate_check.return_value = (True, {
                'limit': 100,
                'current': 100,
                'reset_time': int(time.time()) + 60,
                'window': 60
            })
            
            response = self.client.get('/api/test')
            
            assert response.status_code == 429
            data = response.get_json()
            assert 'Rate limit exceeded' in data['error']
            assert 'retry_after' in data


if __name__ == '__main__':
    pytest.main([__file__])

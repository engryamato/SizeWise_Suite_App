#!/usr/bin/env python3
"""
Redis Caching Layer
SizeWise Suite - Phase 4: Performance Optimization

High-performance Redis caching for HVAC calculations, lookup tables,
and API responses to achieve <200ms response times.
"""

import json
import redis
import hashlib
import pickle
from typing import Any, Optional, Dict, List, Union
from datetime import datetime, timedelta
from functools import wraps
import structlog
import os

logger = structlog.get_logger()

class RedisCache:
    """High-performance Redis caching layer for SizeWise Suite."""
    
    def __init__(self, 
                 host: str = None, 
                 port: int = None, 
                 password: str = None,
                 db: int = 0):
        """Initialize Redis cache with connection pooling."""
        
        # Get Redis configuration from environment
        self.host = host or os.getenv('REDIS_HOST', 'localhost')
        self.port = port or int(os.getenv('REDIS_PORT', 6379))
        self.password = password or os.getenv('REDIS_PASSWORD')
        self.db = db
        
        # Cache TTL configurations (in seconds)
        self.ttl_config = {
            'hvac_calculations': 3600,      # 1 hour for calculation results
            'lookup_tables': 86400,         # 24 hours for material properties
            'api_responses': 300,           # 5 minutes for API responses
            'user_data': 1800,              # 30 minutes for user-specific data
            'project_data': 3600,           # 1 hour for project data
            'validation_results': 7200,     # 2 hours for validation results
            'export_cache': 600,            # 10 minutes for export results
            'default': 1800                 # 30 minutes default
        }
        
        self.client = None
        self.enabled = os.getenv('REDIS_ENABLED', 'true').lower() == 'true'
        
        if self.enabled:
            self._connect()
    
    def _connect(self):
        """Establish Redis connection with error handling."""
        try:
            # Create connection pool for better performance
            pool = redis.ConnectionPool(
                host=self.host,
                port=self.port,
                password=self.password,
                db=self.db,
                max_connections=20,
                retry_on_timeout=True,
                socket_connect_timeout=2,
                socket_timeout=2
            )
            
            self.client = redis.Redis(connection_pool=pool)
            
            # Test connection
            self.client.ping()
            logger.info("Redis cache connected successfully", 
                       host=self.host, port=self.port, db=self.db)
            
        except redis.ConnectionError as e:
            logger.warning("Redis connection failed - caching disabled", error=str(e))
            self.enabled = False
            self.client = None
        except Exception as e:
            logger.error("Redis initialization failed", error=str(e))
            self.enabled = False
            self.client = None
    
    def _generate_key(self, prefix: str, *args, **kwargs) -> str:
        """Generate consistent cache key from arguments."""
        # Create a deterministic key from all arguments
        key_data = {
            'args': args,
            'kwargs': sorted(kwargs.items()) if kwargs else {}
        }
        
        # Hash the key data for consistent keys
        key_string = json.dumps(key_data, sort_keys=True, default=str)
        key_hash = hashlib.md5(key_string.encode()).hexdigest()[:16]
        
        return f"sizewise:{prefix}:{key_hash}"
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache with error handling."""
        if not self.enabled or not self.client:
            return None
        
        try:
            value = self.client.get(key)
            if value:
                # Try JSON first, then pickle for complex objects
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return pickle.loads(value)
            return None
            
        except Exception as e:
            logger.warning("Cache get failed", key=key, error=str(e))
            return None
    
    def set(self, key: str, value: Any, ttl: int = None, cache_type: str = 'default') -> bool:
        """Set value in cache with TTL."""
        if not self.enabled or not self.client:
            return False
        
        try:
            # Determine TTL
            ttl = ttl or self.ttl_config.get(cache_type, self.ttl_config['default'])
            
            # Serialize value
            try:
                serialized = json.dumps(value, default=str)
            except (TypeError, ValueError):
                # Fall back to pickle for complex objects
                serialized = pickle.dumps(value)
            
            # Set with TTL
            result = self.client.setex(key, ttl, serialized)
            
            if result:
                logger.debug("Cache set successful", key=key, ttl=ttl)
            
            return result
            
        except Exception as e:
            logger.warning("Cache set failed", key=key, error=str(e))
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache."""
        if not self.enabled or not self.client:
            return False
        
        try:
            result = self.client.delete(key)
            logger.debug("Cache delete", key=key, deleted=bool(result))
            return bool(result)
            
        except Exception as e:
            logger.warning("Cache delete failed", key=key, error=str(e))
            return False
    
    def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern."""
        if not self.enabled or not self.client:
            return 0
        
        try:
            keys = self.client.keys(pattern)
            if keys:
                deleted = self.client.delete(*keys)
                logger.info("Cache pattern cleared", pattern=pattern, deleted=deleted)
                return deleted
            return 0
            
        except Exception as e:
            logger.warning("Cache pattern clear failed", pattern=pattern, error=str(e))
            return 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        if not self.enabled or not self.client:
            return {"enabled": False}
        
        try:
            info = self.client.info()
            return {
                "enabled": True,
                "connected_clients": info.get('connected_clients', 0),
                "used_memory": info.get('used_memory_human', '0B'),
                "keyspace_hits": info.get('keyspace_hits', 0),
                "keyspace_misses": info.get('keyspace_misses', 0),
                "hit_rate": self._calculate_hit_rate(info),
                "total_keys": sum(info.get(f'db{i}', {}).get('keys', 0) for i in range(16))
            }
            
        except Exception as e:
            logger.warning("Cache stats failed", error=str(e))
            return {"enabled": True, "error": str(e)}
    
    def _calculate_hit_rate(self, info: Dict) -> float:
        """Calculate cache hit rate percentage."""
        hits = info.get('keyspace_hits', 0)
        misses = info.get('keyspace_misses', 0)
        total = hits + misses
        
        if total == 0:
            return 0.0
        
        return round((hits / total) * 100, 2)

# Global cache instance
redis_cache = RedisCache()

def cache_result(cache_type: str = 'default', ttl: int = None, key_prefix: str = None):
    """Decorator to cache function results."""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            prefix = key_prefix or f"func:{func.__name__}"
            cache_key = redis_cache._generate_key(prefix, *args, **kwargs)
            
            # Try to get from cache
            cached_result = redis_cache.get(cache_key)
            if cached_result is not None:
                logger.debug("Cache hit", function=func.__name__, key=cache_key)
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            redis_cache.set(cache_key, result, ttl=ttl, cache_type=cache_type)
            logger.debug("Cache miss - result cached", function=func.__name__, key=cache_key)
            
            return result
        
        return wrapper
    return decorator

def cache_hvac_calculation(ttl: int = None):
    """Specialized decorator for HVAC calculations."""
    return cache_result(cache_type='hvac_calculations', ttl=ttl, key_prefix='hvac_calc')

def cache_lookup_table(ttl: int = None):
    """Specialized decorator for lookup tables."""
    return cache_result(cache_type='lookup_tables', ttl=ttl, key_prefix='lookup')

def cache_api_response(ttl: int = None):
    """Specialized decorator for API responses."""
    return cache_result(cache_type='api_responses', ttl=ttl, key_prefix='api')

def invalidate_cache_pattern(pattern: str):
    """Invalidate cache entries matching pattern."""
    return redis_cache.clear_pattern(f"sizewise:{pattern}*")

def get_cache_stats() -> Dict[str, Any]:
    """Get comprehensive cache statistics."""
    return redis_cache.get_stats()

# Cache warming functions for HVAC data
def warm_hvac_cache():
    """Pre-populate cache with common HVAC lookup data."""
    if not redis_cache.enabled:
        return
    
    logger.info("Warming HVAC cache with common lookup data...")
    
    # Common duct materials and their roughness factors
    materials = {
        'galvanized_steel': 0.0005,
        'aluminum': 0.0003,
        'stainless_steel': 0.0005,
        'pvc': 0.0001,
        'fiberglass': 0.003
    }
    
    # Cache material properties
    for material, roughness in materials.items():
        key = redis_cache._generate_key('material_roughness', material)
        redis_cache.set(key, roughness, cache_type='lookup_tables')
    
    # Common CFM ranges and their typical velocities
    cfm_velocity_map = {
        500: 1200, 1000: 1500, 1500: 1800, 2000: 2000, 2500: 2200,
        3000: 2400, 4000: 2600, 5000: 2800, 6000: 3000
    }
    
    for cfm, velocity in cfm_velocity_map.items():
        key = redis_cache._generate_key('cfm_velocity', cfm)
        redis_cache.set(key, velocity, cache_type='lookup_tables')
    
    logger.info("HVAC cache warming completed")

# Initialize cache warming on import
if redis_cache.enabled:
    warm_hvac_cache()

"""
Cache Management API Blueprint
SizeWise Suite - Phase 4: Performance Optimization

Provides endpoints for cache invalidation and management across all caching layers.
"""

from flask import Blueprint, request, jsonify, g
import structlog
from typing import List, Dict, Any
import asyncio
import json

# Import caching services
try:
    from ..caching.redis_cache import redis_cache, invalidate_cache_pattern, get_cache_stats
    from ..microservices.DistributedCache import DistributedCache
except ImportError:
    # Fallback for development
    redis_cache = None
    invalidate_cache_pattern = lambda pattern: True
    get_cache_stats = lambda: {}

logger = structlog.get_logger(__name__)

cache_bp = Blueprint('cache', __name__, url_prefix='/api/cache')

# Cache invalidation patterns for different entities
INVALIDATION_PATTERNS = {
    'project': [
        'sizewise:project:{project_id}:*',
        'sizewise:user:{user_id}:projects',
        'sizewise:calculations:{project_id}:*',
        'sizewise:exports:{project_id}:*'
    ],
    'calculation': [
        'sizewise:calc:{project_id}:*',
        'sizewise:hvac_calc:*',
        'sizewise:api:calculations:*',
        'sizewise:validation:{project_id}:*'
    ],
    'user': [
        'sizewise:user:{user_id}:*',
        'sizewise:auth:{user_id}:*',
        'sizewise:preferences:{user_id}:*'
    ],
    'lookup_table': [
        'sizewise:lookup:*',
        'sizewise:material:*',
        'sizewise:hvac_calc:*'  # Calculations depend on lookup tables
    ],
    'fitting': [
        'sizewise:fitting:{project_id}:*',
        'sizewise:3d_model:{project_id}:*',
        'sizewise:geometry:*'
    ],
    'export': [
        'sizewise:export:{project_id}:*',
        'sizewise:pdf:{project_id}:*',
        'sizewise:excel:{project_id}:*',
        'sizewise:bim:{project_id}:*'
    ],
    'sync': [
        'sizewise:sync:{user_id}:*',
        'sizewise:offline:{user_id}:*',
        'sizewise:changeset:*'
    ]
}

@cache_bp.route('/invalidate', methods=['POST'])
def invalidate_cache():
    """
    Invalidate cache patterns.
    
    Request body:
    {
        "patterns": ["pattern1", "pattern2"],
        "entity": "project",  // optional, uses predefined patterns
        "project_id": "uuid", // optional, for pattern substitution
        "user_id": "uuid"     // optional, for pattern substitution
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400

        patterns = data.get('patterns', [])
        entity = data.get('entity')
        project_id = data.get('project_id')
        user_id = data.get('user_id')

        # Use predefined patterns if entity is specified
        if entity and entity in INVALIDATION_PATTERNS:
            entity_patterns = INVALIDATION_PATTERNS[entity]
            # Substitute placeholders
            for pattern in entity_patterns:
                substituted_pattern = pattern.format(
                    project_id=project_id or '*',
                    user_id=user_id or '*'
                )
                patterns.append(substituted_pattern)

        if not patterns:
            return jsonify({'error': 'No patterns to invalidate'}), 400

        # Invalidate patterns
        invalidated_count = 0
        errors = []

        for pattern in patterns:
            try:
                result = invalidate_cache_pattern(pattern)
                if result:
                    invalidated_count += 1
                    logger.info("Cache pattern invalidated", pattern=pattern)
                else:
                    errors.append(f"Failed to invalidate pattern: {pattern}")
            except Exception as e:
                error_msg = f"Error invalidating pattern {pattern}: {str(e)}"
                errors.append(error_msg)
                logger.error("Cache invalidation error", pattern=pattern, error=str(e))

        response = {
            'success': True,
            'invalidated_count': invalidated_count,
            'patterns': patterns
        }

        if errors:
            response['errors'] = errors
            response['partial_success'] = True

        return jsonify(response)

    except Exception as e:
        logger.error("Cache invalidation request failed", error=str(e))
        return jsonify({
            'error': 'Cache invalidation failed',
            'details': str(e)
        }), 500

@cache_bp.route('/clear', methods=['POST'])
def clear_cache():
    """
    Clear all cache entries (emergency function).
    """
    try:
        if not redis_cache or not redis_cache.enabled:
            return jsonify({'error': 'Cache not available'}), 503

        # Clear all cache entries
        result = redis_cache.clear_all()
        
        logger.warning("All cache entries cleared", user_id=getattr(g, 'user_id', 'unknown'))
        
        return jsonify({
            'success': True,
            'message': 'All cache entries cleared',
            'cleared': result
        })

    except Exception as e:
        logger.error("Cache clear failed", error=str(e))
        return jsonify({
            'error': 'Cache clear failed',
            'details': str(e)
        }), 500

@cache_bp.route('/stats', methods=['GET'])
def get_cache_statistics():
    """
    Get comprehensive cache statistics.
    """
    try:
        stats = get_cache_stats()
        
        # Add additional metrics
        stats['timestamp'] = int(asyncio.get_event_loop().time() * 1000)
        stats['available'] = redis_cache.enabled if redis_cache else False
        
        return jsonify(stats)

    except Exception as e:
        logger.error("Failed to get cache stats", error=str(e))
        return jsonify({
            'error': 'Failed to get cache statistics',
            'details': str(e),
            'available': False
        }), 500

@cache_bp.route('/invalidate/entity', methods=['POST'])
def invalidate_entity():
    """
    Invalidate cache for a specific entity with automatic pattern generation.
    
    Request body:
    {
        "entity": "project",
        "entity_id": "uuid",
        "project_id": "uuid",
        "user_id": "uuid",
        "cascade": true  // optional, trigger cascade invalidation
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body required'}), 400

        entity = data.get('entity')
        if not entity:
            return jsonify({'error': 'Entity type required'}), 400

        if entity not in INVALIDATION_PATTERNS:
            return jsonify({'error': f'Unknown entity type: {entity}'}), 400

        entity_id = data.get('entity_id')
        project_id = data.get('project_id')
        user_id = data.get('user_id')
        cascade = data.get('cascade', False)

        # Generate patterns for the entity
        patterns = []
        for pattern_template in INVALIDATION_PATTERNS[entity]:
            pattern = pattern_template.format(
                entity_id=entity_id or '*',
                project_id=project_id or '*',
                user_id=user_id or '*'
            )
            patterns.append(pattern)

        # Invalidate patterns
        invalidated_count = 0
        for pattern in patterns:
            try:
                if invalidate_cache_pattern(pattern):
                    invalidated_count += 1
            except Exception as e:
                logger.error("Pattern invalidation failed", pattern=pattern, error=str(e))

        # Handle cascade invalidation
        cascade_results = []
        if cascade:
            cascade_entities = get_cascade_entities(entity)
            for cascade_entity in cascade_entities:
                try:
                    cascade_patterns = []
                    for pattern_template in INVALIDATION_PATTERNS[cascade_entity]:
                        pattern = pattern_template.format(
                            entity_id=entity_id or '*',
                            project_id=project_id or '*',
                            user_id=user_id or '*'
                        )
                        cascade_patterns.append(pattern)
                    
                    cascade_count = 0
                    for pattern in cascade_patterns:
                        if invalidate_cache_pattern(pattern):
                            cascade_count += 1
                    
                    cascade_results.append({
                        'entity': cascade_entity,
                        'patterns': cascade_patterns,
                        'invalidated': cascade_count
                    })
                except Exception as e:
                    logger.error("Cascade invalidation failed", 
                               entity=cascade_entity, error=str(e))

        logger.info("Entity cache invalidation completed",
                   entity=entity, patterns=patterns, 
                   invalidated_count=invalidated_count)

        response = {
            'success': True,
            'entity': entity,
            'patterns': patterns,
            'invalidated_count': invalidated_count
        }

        if cascade_results:
            response['cascade_results'] = cascade_results

        return jsonify(response)

    except Exception as e:
        logger.error("Entity cache invalidation failed", error=str(e))
        return jsonify({
            'error': 'Entity cache invalidation failed',
            'details': str(e)
        }), 500

def get_cascade_entities(entity: str) -> List[str]:
    """Get entities that should be invalidated when the given entity changes."""
    cascade_map = {
        'project': ['calculation', 'export', 'fitting'],
        'lookup_table': ['calculation'],  # Calculations depend on lookup tables
        'user': ['sync'],
        'calculation': [],  # No cascades
        'fitting': [],
        'export': [],
        'sync': []
    }
    return cascade_map.get(entity, [])

@cache_bp.route('/warm', methods=['POST'])
def warm_cache():
    """
    Warm cache with common data.
    """
    try:
        data = request.get_json() or {}
        entity_types = data.get('entities', ['lookup_table'])
        
        warmed_entities = []
        
        for entity_type in entity_types:
            try:
                if entity_type == 'lookup_table':
                    # Warm lookup tables
                    from ..caching.redis_cache import warm_hvac_cache
                    warm_hvac_cache()
                    warmed_entities.append('lookup_table')
                
                # Add more warming strategies as needed
                
            except Exception as e:
                logger.error("Cache warming failed for entity", 
                           entity=entity_type, error=str(e))
        
        return jsonify({
            'success': True,
            'warmed_entities': warmed_entities,
            'message': f'Cache warmed for {len(warmed_entities)} entity types'
        })
        
    except Exception as e:
        logger.error("Cache warming failed", error=str(e))
        return jsonify({
            'error': 'Cache warming failed',
            'details': str(e)
        }), 500

@cache_bp.route('/health', methods=['GET'])
def cache_health():
    """
    Check cache system health.
    """
    try:
        health_status = {
            'redis_available': redis_cache.enabled if redis_cache else False,
            'redis_connected': False,
            'timestamp': int(asyncio.get_event_loop().time() * 1000)
        }
        
        if redis_cache and redis_cache.enabled:
            try:
                # Test Redis connection
                test_key = 'health_check'
                redis_cache.set(test_key, 'ok', ttl=10)
                result = redis_cache.get(test_key)
                health_status['redis_connected'] = result == 'ok'
                redis_cache.delete(test_key)
            except Exception as e:
                health_status['redis_error'] = str(e)
        
        status_code = 200 if health_status['redis_connected'] else 503
        return jsonify(health_status), status_code
        
    except Exception as e:
        logger.error("Cache health check failed", error=str(e))
        return jsonify({
            'error': 'Cache health check failed',
            'details': str(e)
        }), 500

"""
CDN Management API Blueprint
SizeWise Suite - Phase 4: Performance Optimization

Provides endpoints for CDN asset management, purging, and performance monitoring.
"""

from flask import Blueprint, request, jsonify, g
import structlog
import os
import hashlib
import mimetypes
from typing import Dict, List, Any
import requests
from datetime import datetime, timedelta

logger = structlog.get_logger(__name__)

cdn_bp = Blueprint('cdn', __name__, url_prefix='/api/cdn')

# CDN Configuration
CDN_CONFIG = {
    'enabled': os.getenv('CDN_ENABLED', 'false').lower() == 'true',
    'base_url': os.getenv('CDN_BASE_URL', 'https://cdn.sizewise.app'),
    'api_key': os.getenv('CDN_API_KEY'),
    'regions': ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
    'default_region': 'us-east-1'
}

# Asset type configurations
ASSET_CONFIGS = {
    'images': {
        'extensions': ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'],
        'max_age': 31536000,  # 1 year
        'compression': True,
        'optimization': True
    },
    'models': {
        'extensions': ['glb', 'gltf', 'obj', 'fbx', 'dae'],
        'max_age': 2592000,   # 30 days
        'compression': True,
        'optimization': False
    },
    'documents': {
        'extensions': ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
        'max_age': 86400,     # 1 day
        'compression': True,
        'optimization': False
    },
    'fonts': {
        'extensions': ['woff', 'woff2', 'ttf', 'otf', 'eot'],
        'max_age': 31536000,  # 1 year
        'compression': False,
        'optimization': False
    }
}

@cdn_bp.route('/purge', methods=['POST'])
def purge_asset():
    """
    Purge specific asset from CDN cache.
    
    Request body:
    {
        "assetPath": "/images/logo.png",
        "regions": ["us-east-1", "eu-west-1"]  // optional
    }
    """
    try:
        if not CDN_CONFIG['enabled']:
            return jsonify({'error': 'CDN not enabled'}), 503

        data = request.get_json()
        if not data or 'assetPath' not in data:
            return jsonify({'error': 'assetPath required'}), 400

        asset_path = data['assetPath']
        regions = data.get('regions', CDN_CONFIG['regions'])

        # Validate asset path
        if not asset_path.startswith('/'):
            asset_path = '/' + asset_path

        purge_results = []
        
        for region in regions:
            try:
                result = purge_asset_from_region(asset_path, region)
                purge_results.append({
                    'region': region,
                    'success': result['success'],
                    'message': result.get('message', '')
                })
            except Exception as e:
                purge_results.append({
                    'region': region,
                    'success': False,
                    'error': str(e)
                })

        success_count = sum(1 for result in purge_results if result['success'])
        
        logger.info("CDN purge completed", 
                   asset_path=asset_path, 
                   regions=regions,
                   success_count=success_count)

        return jsonify({
            'success': success_count > 0,
            'asset_path': asset_path,
            'results': purge_results,
            'purged_regions': success_count
        })

    except Exception as e:
        logger.error("CDN purge failed", error=str(e))
        return jsonify({
            'error': 'CDN purge failed',
            'details': str(e)
        }), 500

@cdn_bp.route('/warm', methods=['POST'])
def warm_cache():
    """
    Warm CDN cache with specified assets.
    
    Request body:
    {
        "assetPaths": ["/images/logo.png", "/models/duct.glb"],
        "regions": ["us-east-1"]  // optional
    }
    """
    try:
        if not CDN_CONFIG['enabled']:
            return jsonify({'error': 'CDN not enabled'}), 503

        data = request.get_json()
        if not data or 'assetPaths' not in data:
            return jsonify({'error': 'assetPaths required'}), 400

        asset_paths = data['assetPaths']
        regions = data.get('regions', [CDN_CONFIG['default_region']])

        if not isinstance(asset_paths, list):
            return jsonify({'error': 'assetPaths must be an array'}), 400

        warm_results = []
        
        for asset_path in asset_paths:
            for region in regions:
                try:
                    result = warm_asset_in_region(asset_path, region)
                    warm_results.append({
                        'asset_path': asset_path,
                        'region': region,
                        'success': result['success'],
                        'response_time': result.get('response_time', 0)
                    })
                except Exception as e:
                    warm_results.append({
                        'asset_path': asset_path,
                        'region': region,
                        'success': False,
                        'error': str(e)
                    })

        success_count = sum(1 for result in warm_results if result['success'])
        
        logger.info("CDN cache warming completed",
                   asset_count=len(asset_paths),
                   regions=regions,
                   success_count=success_count)

        return jsonify({
            'success': success_count > 0,
            'results': warm_results,
            'warmed_assets': success_count
        })

    except Exception as e:
        logger.error("CDN cache warming failed", error=str(e))
        return jsonify({
            'error': 'CDN cache warming failed',
            'details': str(e)
        }), 500

@cdn_bp.route('/stats', methods=['GET'])
def get_cdn_stats():
    """
    Get CDN performance statistics.
    """
    try:
        if not CDN_CONFIG['enabled']:
            return jsonify({'error': 'CDN not enabled'}), 503

        # Get stats from CDN provider (mock implementation)
        stats = get_cdn_performance_stats()
        
        return jsonify({
            'enabled': True,
            'regions': CDN_CONFIG['regions'],
            'base_url': CDN_CONFIG['base_url'],
            'stats': stats,
            'timestamp': datetime.utcnow().isoformat()
        })

    except Exception as e:
        logger.error("Failed to get CDN stats", error=str(e))
        return jsonify({
            'error': 'Failed to get CDN statistics',
            'details': str(e)
        }), 500

@cdn_bp.route('/optimize', methods=['POST'])
def optimize_asset():
    """
    Optimize asset for CDN delivery.
    
    Request body:
    {
        "assetPath": "/images/large-image.jpg",
        "optimizations": {
            "quality": 85,
            "format": "webp",
            "width": 1920,
            "height": 1080
        }
    }
    """
    try:
        if not CDN_CONFIG['enabled']:
            return jsonify({'error': 'CDN not enabled'}), 503

        data = request.get_json()
        if not data or 'assetPath' not in data:
            return jsonify({'error': 'assetPath required'}), 400

        asset_path = data['assetPath']
        optimizations = data.get('optimizations', {})

        # Determine asset type
        asset_type = get_asset_type(asset_path)
        if not asset_type:
            return jsonify({'error': 'Unsupported asset type'}), 400

        # Apply optimizations based on asset type
        optimization_result = apply_asset_optimizations(asset_path, asset_type, optimizations)
        
        logger.info("Asset optimization completed",
                   asset_path=asset_path,
                   asset_type=asset_type,
                   optimizations=optimizations)

        return jsonify({
            'success': True,
            'asset_path': asset_path,
            'asset_type': asset_type,
            'optimizations_applied': optimization_result['optimizations'],
            'size_reduction': optimization_result.get('size_reduction', 0),
            'optimized_url': optimization_result['optimized_url']
        })

    except Exception as e:
        logger.error("Asset optimization failed", error=str(e))
        return jsonify({
            'error': 'Asset optimization failed',
            'details': str(e)
        }), 500

@cdn_bp.route('/health', methods=['GET'])
def cdn_health():
    """
    Check CDN health across all regions.
    """
    try:
        health_results = []
        
        for region in CDN_CONFIG['regions']:
            try:
                health = check_region_health(region)
                health_results.append({
                    'region': region,
                    'healthy': health['healthy'],
                    'response_time': health['response_time'],
                    'last_check': health['timestamp']
                })
            except Exception as e:
                health_results.append({
                    'region': region,
                    'healthy': False,
                    'error': str(e),
                    'last_check': datetime.utcnow().isoformat()
                })

        healthy_regions = sum(1 for result in health_results if result['healthy'])
        overall_healthy = healthy_regions > 0

        return jsonify({
            'overall_healthy': overall_healthy,
            'healthy_regions': healthy_regions,
            'total_regions': len(CDN_CONFIG['regions']),
            'regions': health_results,
            'cdn_enabled': CDN_CONFIG['enabled']
        }), 200 if overall_healthy else 503

    except Exception as e:
        logger.error("CDN health check failed", error=str(e))
        return jsonify({
            'error': 'CDN health check failed',
            'details': str(e)
        }), 500

# Helper functions

def purge_asset_from_region(asset_path: str, region: str) -> Dict[str, Any]:
    """Purge asset from specific CDN region."""
    # Mock implementation - replace with actual CDN provider API
    try:
        # Simulate API call to CDN provider
        url = f"{CDN_CONFIG['base_url']}/purge"
        headers = {'Authorization': f"Bearer {CDN_CONFIG['api_key']}"}
        payload = {
            'path': asset_path,
            'region': region
        }
        
        # In real implementation, make actual HTTP request
        # response = requests.post(url, json=payload, headers=headers)
        
        return {
            'success': True,
            'message': f'Asset purged from {region}'
        }
    except Exception as e:
        return {
            'success': False,
            'message': str(e)
        }

def warm_asset_in_region(asset_path: str, region: str) -> Dict[str, Any]:
    """Warm asset cache in specific CDN region."""
    try:
        start_time = datetime.utcnow()
        
        # Simulate cache warming by making HEAD request
        asset_url = f"{CDN_CONFIG['base_url']}/{region}{asset_path}"
        
        # In real implementation, make actual HTTP request
        # response = requests.head(asset_url, timeout=10)
        
        response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        return {
            'success': True,
            'response_time': response_time
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def get_cdn_performance_stats() -> Dict[str, Any]:
    """Get CDN performance statistics."""
    # Mock implementation - replace with actual CDN provider API
    return {
        'total_requests': 1250000,
        'cache_hit_rate': 0.94,
        'bandwidth_saved': '2.5TB',
        'avg_response_time': 45,
        'regions': {
            'us-east-1': {'requests': 500000, 'hit_rate': 0.95},
            'us-west-2': {'requests': 300000, 'hit_rate': 0.93},
            'eu-west-1': {'requests': 250000, 'hit_rate': 0.94},
            'ap-southeast-1': {'requests': 200000, 'hit_rate': 0.92}
        }
    }

def get_asset_type(asset_path: str) -> str:
    """Determine asset type from file extension."""
    extension = asset_path.split('.')[-1].lower()
    
    for asset_type, config in ASSET_CONFIGS.items():
        if extension in config['extensions']:
            return asset_type
    
    return None

def apply_asset_optimizations(asset_path: str, asset_type: str, optimizations: Dict[str, Any]) -> Dict[str, Any]:
    """Apply optimizations to asset."""
    # Mock implementation - replace with actual optimization logic
    config = ASSET_CONFIGS.get(asset_type, {})
    
    applied_optimizations = []
    size_reduction = 0
    
    if config.get('compression') and optimizations.get('compress', True):
        applied_optimizations.append('compression')
        size_reduction += 30  # 30% reduction
    
    if asset_type == 'images':
        if optimizations.get('quality'):
            applied_optimizations.append(f"quality_{optimizations['quality']}")
            size_reduction += 20
        
        if optimizations.get('format'):
            applied_optimizations.append(f"format_{optimizations['format']}")
            size_reduction += 25
    
    optimized_url = f"{CDN_CONFIG['base_url']}/optimized{asset_path}"
    
    return {
        'optimizations': applied_optimizations,
        'size_reduction': min(size_reduction, 80),  # Cap at 80%
        'optimized_url': optimized_url
    }

def check_region_health(region: str) -> Dict[str, Any]:
    """Check health of specific CDN region."""
    try:
        start_time = datetime.utcnow()
        
        # Simulate health check
        health_url = f"{CDN_CONFIG['base_url']}/{region}/health"
        
        # In real implementation, make actual HTTP request
        # response = requests.get(health_url, timeout=5)
        
        response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        return {
            'healthy': True,
            'response_time': response_time,
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            'healthy': False,
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }

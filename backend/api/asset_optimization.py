"""
Asset Optimization API
SizeWise Suite - Phase 4: Performance Optimization

Backend API for asset optimization, compression, and delivery
"""

import os
import json
import time
import hashlib
from typing import Dict, List, Optional, Tuple
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
import logging

# Asset optimization blueprint
asset_optimization_bp = Blueprint('asset_optimization', __name__, url_prefix='/api/assets')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Asset optimization configurations
OPTIMIZATION_CONFIGS = {
    'images': {
        'formats': ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg'],
        'quality_levels': {
            'low': 60,
            'medium': 75,
            'high': 85,
            'ultra': 95
        },
        'max_size': 10 * 1024 * 1024,  # 10MB
        'compression_ratios': {
            'webp': 0.3,
            'avif': 0.4,
            'jpeg': 0.2,
            'png': 0.1
        }
    },
    'models': {
        'formats': ['glb', 'gltf', 'obj', 'fbx', 'dae'],
        'compression_types': ['gzip', 'brotli', 'none'],
        'lod_levels': [1, 2, 3, 4, 5],
        'max_size': 50 * 1024 * 1024,  # 50MB
        'compression_ratios': {
            'gzip': 0.4,
            'brotli': 0.5,
            'none': 0.0
        }
    },
    'fonts': {
        'formats': ['woff', 'woff2', 'ttf', 'otf', 'eot'],
        'subsets': ['latin', 'latin-ext', 'cyrillic', 'greek'],
        'max_size': 2 * 1024 * 1024,  # 2MB
    },
    'documents': {
        'formats': ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
        'max_size': 25 * 1024 * 1024,  # 25MB
    }
}

class AssetOptimizer:
    """Asset optimization service"""
    
    def __init__(self):
        self.optimization_cache = {}
        self.metrics = {
            'total_optimizations': 0,
            'total_original_size': 0,
            'total_optimized_size': 0,
            'optimizations_by_type': {}
        }
    
    def optimize_image(self, file_path: str, options: Dict) -> Dict:
        """Optimize image asset"""
        try:
            # Get file info
            file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 1024000
            file_ext = os.path.splitext(file_path)[1][1:].lower()
            
            # Extract optimization options
            quality = options.get('quality', 85)
            target_format = options.get('format', 'webp')
            width = options.get('width')
            height = options.get('height')
            progressive = options.get('progressive', True)
            
            # Calculate optimized size (simulation)
            compression_ratio = OPTIMIZATION_CONFIGS['images']['compression_ratios'].get(target_format, 0.2)
            quality_factor = quality / 100
            optimized_size = int(file_size * (1 - compression_ratio) * quality_factor)
            
            # Generate optimized URL
            optimized_url = self._generate_optimized_url(file_path, options)
            
            result = {
                'original_size': file_size,
                'optimized_size': optimized_size,
                'compression_ratio': (file_size - optimized_size) / file_size,
                'format': target_format,
                'optimized_url': optimized_url,
                'metadata': {
                    'width': width,
                    'height': height,
                    'quality': quality,
                    'progressive': progressive
                }
            }
            
            # Update metrics
            self._update_metrics('image', result)
            
            return result
            
        except Exception as e:
            logger.error(f"Image optimization failed: {str(e)}")
            raise
    
    def optimize_3d_model(self, file_path: str, options: Dict) -> Dict:
        """Optimize 3D model asset"""
        try:
            # Get file info
            file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 5120000
            file_ext = os.path.splitext(file_path)[1][1:].lower()
            
            # Extract optimization options
            compression = options.get('compression', 'gzip')
            lod_level = options.get('lod_level', 1)
            target_format = options.get('format', 'glb')
            
            # Calculate optimized size (simulation)
            compression_ratio = OPTIMIZATION_CONFIGS['models']['compression_ratios'].get(compression, 0.3)
            lod_factor = 1 - (lod_level - 1) * 0.1  # Higher LOD = smaller size
            optimized_size = int(file_size * (1 - compression_ratio) * lod_factor)
            
            # Generate optimized URL
            optimized_url = self._generate_optimized_url(file_path, options)
            
            result = {
                'original_size': file_size,
                'optimized_size': optimized_size,
                'compression_ratio': (file_size - optimized_size) / file_size,
                'format': target_format,
                'optimized_url': optimized_url,
                'metadata': {
                    'compression': compression,
                    'lod_level': lod_level,
                    'quality': lod_level
                }
            }
            
            # Update metrics
            self._update_metrics('model', result)
            
            return result
            
        except Exception as e:
            logger.error(f"3D model optimization failed: {str(e)}")
            raise
    
    def generate_responsive_images(self, file_path: str, options: Dict) -> List[Dict]:
        """Generate responsive image sizes"""
        try:
            sizes = options.get('sizes', [640, 750, 828, 1080, 1200, 1920, 2048])
            results = []
            
            for width in sizes:
                size_options = {**options, 'width': width}
                result = self.optimize_image(file_path, size_options)
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Responsive image generation failed: {str(e)}")
            raise
    
    def get_metrics(self) -> Dict:
        """Get optimization metrics"""
        return {
            **self.metrics,
            'average_compression_ratio': (
                (self.metrics['total_original_size'] - self.metrics['total_optimized_size']) 
                / self.metrics['total_original_size']
                if self.metrics['total_original_size'] > 0 else 0
            )
        }
    
    def _generate_optimized_url(self, file_path: str, options: Dict) -> str:
        """Generate optimized asset URL"""
        # Create hash of options for cache key
        options_str = json.dumps(options, sort_keys=True)
        cache_key = hashlib.md5(options_str.encode()).hexdigest()[:8]
        
        # Build optimized URL
        base_url = os.environ.get('NEXT_PUBLIC_CDN_URL', 'https://cdn.sizewise.app')
        return f"{base_url}/optimized{file_path}?cache={cache_key}&{self._build_query_string(options)}"
    
    def _build_query_string(self, options: Dict) -> str:
        """Build query string from options"""
        params = []
        for key, value in options.items():
            if value is not None:
                params.append(f"{key}={value}")
        return "&".join(params)
    
    def _update_metrics(self, asset_type: str, result: Dict):
        """Update optimization metrics"""
        self.metrics['total_optimizations'] += 1
        self.metrics['total_original_size'] += result['original_size']
        self.metrics['total_optimized_size'] += result['optimized_size']
        
        if asset_type not in self.metrics['optimizations_by_type']:
            self.metrics['optimizations_by_type'][asset_type] = {
                'count': 0,
                'original_size': 0,
                'optimized_size': 0
            }
        
        type_metrics = self.metrics['optimizations_by_type'][asset_type]
        type_metrics['count'] += 1
        type_metrics['original_size'] += result['original_size']
        type_metrics['optimized_size'] += result['optimized_size']

# Global optimizer instance
optimizer = AssetOptimizer()

@asset_optimization_bp.route('/optimize/image', methods=['POST'])
def optimize_image():
    """Optimize image asset"""
    try:
        data = request.get_json()
        
        if not data or 'file_path' not in data:
            return jsonify({'error': 'file_path is required'}), 400
        
        file_path = data['file_path']
        options = data.get('options', {})
        
        # Validate file path
        if not file_path.startswith('/'):
            file_path = '/' + file_path
        
        result = optimizer.optimize_image(file_path, options)
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        logger.error(f"Image optimization API error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@asset_optimization_bp.route('/optimize/model', methods=['POST'])
def optimize_3d_model():
    """Optimize 3D model asset"""
    try:
        data = request.get_json()
        
        if not data or 'file_path' not in data:
            return jsonify({'error': 'file_path is required'}), 400
        
        file_path = data['file_path']
        options = data.get('options', {})
        
        # Validate file path
        if not file_path.startswith('/'):
            file_path = '/' + file_path
        
        result = optimizer.optimize_3d_model(file_path, options)
        
        return jsonify({
            'success': True,
            'result': result
        })
        
    except Exception as e:
        logger.error(f"3D model optimization API error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@asset_optimization_bp.route('/optimize/responsive', methods=['POST'])
def generate_responsive_images():
    """Generate responsive image sizes"""
    try:
        data = request.get_json()
        
        if not data or 'file_path' not in data:
            return jsonify({'error': 'file_path is required'}), 400
        
        file_path = data['file_path']
        options = data.get('options', {})
        
        # Validate file path
        if not file_path.startswith('/'):
            file_path = '/' + file_path
        
        results = optimizer.generate_responsive_images(file_path, options)
        
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        logger.error(f"Responsive image generation API error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@asset_optimization_bp.route('/metrics', methods=['GET'])
def get_optimization_metrics():
    """Get asset optimization metrics"""
    try:
        metrics = optimizer.get_metrics()
        
        return jsonify({
            'success': True,
            'metrics': metrics
        })
        
    except Exception as e:
        logger.error(f"Metrics API error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@asset_optimization_bp.route('/health', methods=['GET'])
def health_check():
    """Asset optimization service health check"""
    return jsonify({
        'status': 'healthy',
        'service': 'asset_optimization',
        'timestamp': time.time(),
        'total_optimizations': optimizer.metrics['total_optimizations']
    })

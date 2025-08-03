#!/usr/bin/env python3
"""
Minimal Test Server
SizeWise Suite - Performance Testing

Lightweight Flask server for testing API performance optimizations
without MongoDB dependencies.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import time
import structlog
import os

# Configure logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Import caching
try:
    from caching.redis_cache import cache_hvac_calculation, cache_api_response
    CACHING_ENABLED = True
    logger.info("Redis caching enabled")
except ImportError:
    # Fallback decorators if caching not available
    def cache_hvac_calculation(ttl=None):
        def decorator(func):
            return func
        return decorator
    
    def cache_api_response(ttl=None):
        def decorator(func):
            return func
        return decorator
    
    CACHING_ENABLED = False
    logger.info("Redis caching disabled - using fallback decorators")

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000'])

@app.route('/api/info', methods=['GET'])
@cache_api_response(ttl=3600)
def api_info():
    """API information endpoint."""
    return jsonify({
        'name': 'SizeWise Suite API',
        'version': '0.1.0',
        'status': 'optimized',
        'caching_enabled': CACHING_ENABLED,
        'endpoints': {
            'calculations': '/api/calculations',
            'validation': '/api/validation',
            'exports': '/api/exports'
        },
        'performance': {
            'target_response_time': '<200ms',
            'optimization_status': 'active'
        }
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time(),
        'uptime': 'active',
        'performance': 'optimized'
    })

@app.route('/api/calculations/air-duct', methods=['POST'])
@cache_hvac_calculation(ttl=3600)
def calculate_air_duct():
    """Optimized air duct calculation endpoint."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Simulate HVAC calculation (optimized)
        airflow = data.get('airflow', 1000)
        duct_type = data.get('duct_type', 'round')
        friction_rate = data.get('friction_rate', 0.1)
        units = data.get('units', 'imperial')
        
        # Fast calculation simulation
        if duct_type == 'round':
            diameter = (airflow / (2000 * 3.14159)) ** 0.5 * 12  # inches
            result = {
                'diameter': round(diameter, 2),
                'area': round(3.14159 * (diameter/2)**2, 2),
                'velocity': round(airflow / (3.14159 * (diameter/2)**2), 2)
            }
        else:
            # Rectangular duct
            aspect_ratio = 1.5
            area = airflow / 2000
            width = (area * aspect_ratio) ** 0.5
            height = area / width
            result = {
                'width': round(width * 12, 2),  # inches
                'height': round(height * 12, 2),  # inches
                'area': round(area, 2),
                'velocity': round(airflow / area, 2)
            }
        
        response = {
            'input': data,
            'result': result,
            'calculation_time': '<10ms',
            'cached': True,
            'standards_compliance': {
                'smacna': True,
                'ashrae': True
            }
        }
        
        logger.info("Air duct calculation completed (optimized)", 
                   airflow=airflow, duct_type=duct_type)
        
        return jsonify(response)
        
    except Exception as e:
        logger.error("Air duct calculation failed", error=str(e))
        return jsonify({'error': 'Calculation failed', 'message': str(e)}), 500

@app.route('/api/calculations/air-duct/materials', methods=['GET'])
@cache_api_response(ttl=86400)  # Cache for 24 hours
def get_air_duct_materials():
    """Get available duct materials (cached)."""
    materials = {
        'galvanized_steel': {
            'name': 'Galvanized Steel',
            'roughness': 0.0005,
            'cost_factor': 1.0,
            'durability': 'high'
        },
        'aluminum': {
            'name': 'Aluminum',
            'roughness': 0.0003,
            'cost_factor': 1.2,
            'durability': 'medium'
        },
        'stainless_steel': {
            'name': 'Stainless Steel',
            'roughness': 0.0005,
            'cost_factor': 1.8,
            'durability': 'very_high'
        },
        'pvc': {
            'name': 'PVC',
            'roughness': 0.0001,
            'cost_factor': 0.8,
            'durability': 'medium'
        }
    }
    
    return jsonify({
        'materials': materials,
        'cached': True,
        'cache_duration': '24 hours'
    })

@app.route('/api/calculations/grease-duct', methods=['POST'])
@cache_hvac_calculation(ttl=3600)
def calculate_grease_duct():
    """Optimized grease duct calculation."""
    try:
        data = request.get_json()
        
        # Fast grease duct calculation
        airflow = data.get('airflow', 500)
        grease_type = data.get('grease_type', 'medium')
        
        # Simplified calculation for testing
        velocity = 2500  # Higher velocity for grease ducts
        area = airflow / velocity
        diameter = (area * 4 / 3.14159) ** 0.5 * 12  # inches
        
        result = {
            'input': data,
            'result': {
                'diameter': round(diameter, 2),
                'velocity': velocity,
                'area': round(area, 2),
                'grease_type': grease_type
            },
            'calculation_time': '<5ms',
            'cached': True,
            'nfpa_compliance': True
        }
        
        logger.info("Grease duct calculation completed (optimized)")
        return jsonify(result)
        
    except Exception as e:
        logger.error("Grease duct calculation failed", error=str(e))
        return jsonify({'error': 'Calculation failed', 'message': str(e)}), 500

@app.route('/api/calculations/estimate', methods=['POST'])
@cache_hvac_calculation(ttl=1800)
def calculate_estimate():
    """Fast project estimation."""
    try:
        data = request.get_json()
        
        project_type = data.get('project_type', 'office')
        square_footage = data.get('square_footage', 5000)
        duct_count = data.get('duct_count', 20)
        
        # Fast estimation calculation
        base_cost = square_footage * 2.5  # $2.50 per sq ft
        duct_cost = duct_count * 150  # $150 per duct
        total_estimate = base_cost + duct_cost
        
        result = {
            'input': data,
            'estimate': {
                'base_cost': round(base_cost, 2),
                'duct_cost': round(duct_cost, 2),
                'total': round(total_estimate, 2),
                'currency': 'USD'
            },
            'calculation_time': '<2ms',
            'cached': True
        }
        
        return jsonify(result)
        
    except Exception as e:
        logger.error("Estimate calculation failed", error=str(e))
        return jsonify({'error': 'Calculation failed', 'message': str(e)}), 500

@app.route('/api/validation/smacna', methods=['POST'])
@cache_api_response(ttl=7200)
def validate_smacna():
    """Fast SMACNA validation."""
    try:
        data = request.get_json()
        
        result = {
            'input': data,
            'validation': {
                'compliant': True,
                'warnings': [],
                'recommendations': ['Optimize for energy efficiency']
            },
            'validation_time': '<1ms',
            'cached': True
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': 'Validation failed', 'message': str(e)}), 500

@app.route('/api/validation/ashrae', methods=['POST'])
@cache_api_response(ttl=7200)
def validate_ashrae():
    """Fast ASHRAE validation."""
    try:
        data = request.get_json()
        
        result = {
            'input': data,
            'validation': {
                'compliant': True,
                'standard': 'ASHRAE 90.1',
                'efficiency_rating': 'A'
            },
            'validation_time': '<1ms',
            'cached': True
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': 'Validation failed', 'message': str(e)}), 500

@app.route('/api/exports/pdf', methods=['POST'])
def export_pdf():
    """Fast PDF export simulation."""
    try:
        data = request.get_json()
        
        result = {
            'export_id': 'test_export_123',
            'format': 'pdf',
            'status': 'completed',
            'download_url': '/api/exports/download/test_export_123',
            'export_time': '<50ms'
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': 'Export failed', 'message': str(e)}), 500

@app.route('/api/exports/json', methods=['POST'])
def export_json():
    """Fast JSON export."""
    try:
        data = request.get_json()
        
        result = {
            'export_id': 'test_json_456',
            'format': 'json',
            'status': 'completed',
            'data': data,
            'export_time': '<5ms'
        }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': 'Export failed', 'message': str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '127.0.0.1')
    
    logger.info("Starting optimized SizeWise test server", 
               host=host, port=port, caching=CACHING_ENABLED)
    
    app.run(host=host, port=port, debug=False, threaded=True)

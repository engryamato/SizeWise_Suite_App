"""
SizeWise Suite Backend Application

Main Flask application for the SizeWise Suite HVAC engineering platform.
Provides API endpoints for calculations, validation, and data export.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys
from dotenv import load_dotenv
import structlog

# Add parent directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

# Configure structured logging
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

def create_app(config_name='development'):
    """Application factory pattern for Flask app creation."""
    app = Flask(__name__)
    
    # Enable CORS for frontend communication
    CORS(app, origins=['http://localhost:3000', 'http://127.0.0.1:3000'])
    
    # Configuration
    app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Register blueprints
    from app.services.backend.api.calculations import calculations_bp
    from app.services.backend.api.validation import validation_bp
    from app.services.backend.api.exports import exports_bp
    
    app.register_blueprint(calculations_bp, url_prefix='/api/calculations')
    app.register_blueprint(validation_bp, url_prefix='/api/validation')
    app.register_blueprint(exports_bp, url_prefix='/api/exports')
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        """Health check endpoint for monitoring."""
        return jsonify({
            'status': 'healthy',
            'service': 'SizeWise Suite Backend',
            'version': '0.1.0'
        })
    
    # API info endpoint
    @app.route('/api/info')
    def api_info():
        """API information endpoint."""
        return jsonify({
            'name': 'SizeWise Suite API',
            'version': '0.1.0',
            'description': 'HVAC engineering and estimating platform API',
            'modules': [
                'air-duct-sizer',
                'grease-duct-sizer',
                'engine-exhaust-sizer',
                'boiler-vent-sizer',
                'estimating-app'
            ],
            'endpoints': {
                'calculations': '/api/calculations',
                'validation': '/api/validation',
                'exports': '/api/exports',
                'health': '/api/health'
            }
        })
    
    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        logger.warning("Bad request", error=str(error))
        return jsonify({'error': 'Bad request', 'message': str(error)}), 400
    
    @app.errorhandler(404)
    def not_found(error):
        logger.warning("Not found", error=str(error))
        return jsonify({'error': 'Not found', 'message': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        logger.error("Internal server error", error=str(error))
        return jsonify({'error': 'Internal server error', 'message': 'An unexpected error occurred'}), 500
    
    logger.info("SizeWise Suite backend application created", config=config_name)
    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '127.0.0.1')
    
    logger.info("Starting SizeWise Suite backend", host=host, port=port)
    app.run(host=host, port=port, debug=app.config['DEBUG'])

"""
SizeWise Suite Backend Application

Main Flask application for the SizeWise Suite HVAC engineering platform.
Provides API endpoints for calculations, validation, and data export.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys
import asyncio
from dotenv import load_dotenv
import structlog
from sentry_config import init_sentry
from config.mongodb_config import mongodb_config, init_mongodb_collections
from middleware.rate_limiter import RateLimitMiddleware
from middleware.input_validator import InputValidationMiddleware
from middleware.security_headers import SecurityHeadersMiddleware
from security.credential_manager import get_credential_manager
from monitoring.flask_integration import init_monitoring

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

    # Initialize Sentry monitoring
    init_sentry(app, environment=config_name)

    # Enable CORS for frontend communication
    # Support both local development and containerized environments
    default_origins = 'http://localhost:3000,http://127.0.0.1:3000'
    cors_origins = os.getenv('CORS_ORIGINS', default_origins).split(',')
    CORS(app, origins=cors_origins)

    # Initialize security middleware
    rate_limiter = RateLimitMiddleware(app)
    input_validator = InputValidationMiddleware(app)
    security_headers = SecurityHeadersMiddleware(app)
    logger.info("Security middleware initialized (rate limiting + input validation + security headers)")

    # Initialize monitoring dashboard
    init_monitoring(app)
    logger.info("Monitoring dashboard initialized")

    # Configuration using secure credential manager
    credential_manager = get_credential_manager()

    app.config['DEBUG'] = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'

    # Use secure credential manager for sensitive configuration
    if credential_manager:
        app.config['SECRET_KEY'] = credential_manager.get_credential('application', 'secret_key')

        # Validate credentials on startup
        validation = credential_manager.validate_credentials()
        if not validation['valid']:
            logger.warning("Missing required credentials", missing=validation['missing_credentials'])
        if validation['using_defaults']:
            logger.warning("Using default credentials - set environment variables for production",
                         defaults=validation['using_defaults'])
    else:
        # Fallback for development
        app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
        logger.warning("Credential manager not available, using environment variables directly")
    
    # Initialize API versioning
    from backend.middleware.api_versioning import init_api_versioning, get_default_versioning_config, get_api_version_info
    versioning_config = get_default_versioning_config()
    init_api_versioning(app, versioning_config)

    # Register blueprints with versioning support
    from backend.api.calculations import calculations_bp
    from backend.api.validation import validation_bp
    from backend.api.exports import exports_bp
    from backend.api.mongodb_api import mongodb_bp
    from backend.api.cdn_management import cdn_bp
    from backend.api.asset_optimization import asset_optimization_bp
    from backend.api.migration import migration_bp

    # Register v1 API endpoints
    app.register_blueprint(calculations_bp, url_prefix='/api/v1/calculations')
    app.register_blueprint(validation_bp, url_prefix='/api/v1/validation')
    app.register_blueprint(exports_bp, url_prefix='/api/v1/exports')
    app.register_blueprint(mongodb_bp, url_prefix='/api/v1/mongodb')
    app.register_blueprint(cdn_bp, url_prefix='/api/v1')
    app.register_blueprint(asset_optimization_bp, url_prefix='/api/v1')
    app.register_blueprint(migration_bp, url_prefix='/api/v1')

    # Maintain backward compatibility with non-versioned endpoints
    app.register_blueprint(calculations_bp, url_prefix='/api/calculations')
    app.register_blueprint(validation_bp, url_prefix='/api/validation')
    app.register_blueprint(exports_bp, url_prefix='/api/exports')
    app.register_blueprint(mongodb_bp, url_prefix='/api/mongodb')
    app.register_blueprint(migration_bp, url_prefix='/api')
    
    # Initialize MongoDB with timeout and fallback
    mongodb_enabled = os.getenv('MONGODB_ENABLED', 'false').lower() == 'true'
    if mongodb_enabled:
        try:
            # Run async initialization with timeout
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            # Use asyncio.wait_for with timeout to prevent hanging
            loop.run_until_complete(
                asyncio.wait_for(init_mongodb_collections(), timeout=2.0)
            )
            loop.close()
            logger.info("MongoDB initialized successfully")
        except asyncio.TimeoutError:
            logger.warning("MongoDB initialization timed out - continuing without MongoDB")
        except Exception as e:
            logger.warning("Failed to initialize MongoDB - continuing without MongoDB", error=str(e))
    else:
        logger.info("MongoDB disabled - skipping initialization")

    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        """Health check endpoint for monitoring."""
        mongodb_status = "unknown"
        try:
            # Test MongoDB connection
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            mongodb_connected = loop.run_until_complete(mongodb_config.test_connection())
            loop.close()
            mongodb_status = "connected" if mongodb_connected else "disconnected"
        except Exception:
            mongodb_status = "error"

        return jsonify({
            'status': 'healthy',
            'service': 'SizeWise Suite Backend',
            'version': '0.1.0',
            'mongodb_status': mongodb_status
        })
    
    # API info endpoint with versioning information
    @app.route('/api/info')
    @app.route('/api/v1/info')
    def api_info():
        """API information endpoint with versioning details."""
        base_info = {
            'name': 'SizeWise Suite API',
            'version': '1.0.0',
            'description': 'HVAC engineering and estimating platform API',
            'modules': [
                'air-duct-sizer',
                'grease-duct-sizer',
                'engine-exhaust-sizer',
                'boiler-vent-sizer',
                'estimating-app'
            ],
            'endpoints': {
                'calculations': '/api/v1/calculations',
                'validation': '/api/v1/validation',
                'exports': '/api/v1/exports',
                'mongodb': '/api/v1/mongodb',
                'health': '/api/health',
                'sentry-debug': '/api/sentry-debug'
            },
            'legacy_endpoints': {
                'calculations': '/api/calculations',
                'validation': '/api/validation',
                'exports': '/api/exports',
                'mongodb': '/api/mongodb'
            }
        }

        # Add versioning information
        versioning_info = get_api_version_info()
        if versioning_info:
            base_info.update({
                'versioning': versioning_info
            })

        return jsonify(base_info)

    # Sentry verification endpoint
    @app.route('/api/sentry-debug')
    def sentry_debug():
        """Sentry verification endpoint - triggers an error for testing."""
        logger.info("Sentry debug endpoint accessed")
        1/0  # raises an error
        return jsonify({'message': 'This should not be reached'})  # pragma: no cover
    
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

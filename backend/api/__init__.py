"""
SizeWise Suite API Package

Contains all API endpoints for the SizeWise Suite backend.
"""

# Import API modules for easier access
try:
    from . import analytics_routes
    from . import calculations
    from . import compliance_routes
    from . import exports
    from . import mongodb_api
    from . import validation
except ImportError as e:
    # Handle import errors gracefully for testing
    print(f"Warning: Could not import API module: {e}")

__all__ = [
    'analytics_routes',
    'calculations',
    'compliance_routes',
    'exports',
    'mongodb_api',
    'validation'
]

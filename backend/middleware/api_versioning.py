"""
API Versioning Middleware for SizeWise Suite Backend

Provides comprehensive API versioning with backward compatibility,
deprecation management, and migration support for Flask applications.
"""

import re
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from functools import wraps
from flask import request, jsonify, g, current_app
from dataclasses import dataclass

# =============================================================================
# Version Data Classes
# =============================================================================

@dataclass
class ApiVersion:
    major: int
    minor: int
    patch: int
    prerelease: Optional[str] = None
    build: Optional[str] = None
    
    def __str__(self) -> str:
        version_str = f"{self.major}.{self.minor}.{self.patch}"
        if self.prerelease:
            version_str += f"-{self.prerelease}"
        if self.build:
            version_str += f"+{self.build}"
        return version_str
    
    def __eq__(self, other) -> bool:
        if not isinstance(other, ApiVersion):
            return False
        return (self.major, self.minor, self.patch, self.prerelease) == \
               (other.major, other.minor, other.patch, other.prerelease)
    
    def __lt__(self, other) -> bool:
        if not isinstance(other, ApiVersion):
            return NotImplemented
        return (self.major, self.minor, self.patch) < (other.major, other.minor, other.patch)

@dataclass
class VersionedEndpoint:
    path: str
    version: ApiVersion
    method: str
    handler: callable
    deprecated: bool = False
    deprecation_date: Optional[datetime] = None
    removal_date: Optional[datetime] = None
    replaced_by: Optional[str] = None
    description: str = ""
    changes: List[str] = None
    
    def __post_init__(self):
        if self.changes is None:
            self.changes = []

@dataclass
class VersioningConfig:
    current_version: ApiVersion
    supported_versions: List[ApiVersion]
    default_version: ApiVersion
    versioning_strategy: str = 'url'  # 'url', 'header', 'query', 'content-type'
    strict_versioning: bool = False
    deprecation_warning_months: int = 3
    deprecation_support_months: int = 6

# =============================================================================
# Version Utilities
# =============================================================================

class VersionUtils:
    @staticmethod
    def parse_version(version_string: str) -> ApiVersion:
        """Parse version string to ApiVersion object."""
        pattern = r'^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9.-]+))?(?:\+([a-zA-Z0-9.-]+))?$'
        match = re.match(pattern, version_string)
        
        if not match:
            raise ValueError(f"Invalid version format: {version_string}")
        
        return ApiVersion(
            major=int(match.group(1)),
            minor=int(match.group(2)),
            patch=int(match.group(3)),
            prerelease=match.group(4),
            build=match.group(5)
        )
    
    @staticmethod
    def is_compatible(requested: ApiVersion, available: ApiVersion) -> bool:
        """Check if requested version is compatible with available version."""
        # Major version must match for compatibility
        if requested.major != available.major:
            return False
        
        # Minor version can be backward compatible
        if requested.minor > available.minor:
            return False
        
        return True
    
    @staticmethod
    def compare_versions(a: ApiVersion, b: ApiVersion) -> int:
        """Compare two versions. Returns -1, 0, or 1."""
        if a < b:
            return -1
        elif a == b:
            return 0
        else:
            return 1

# =============================================================================
# API Version Manager
# =============================================================================

class ApiVersionManager:
    def __init__(self, config: VersioningConfig):
        self.config = config
        self.endpoints: Dict[str, List[VersionedEndpoint]] = {}
        self.logger = logging.getLogger(__name__)
    
    def register_endpoint(self, endpoint: VersionedEndpoint) -> None:
        """Register a versioned endpoint."""
        key = f"{endpoint.method}:{endpoint.path}"
        
        if key not in self.endpoints:
            self.endpoints[key] = []
        
        # Check for duplicate versions
        for existing in self.endpoints[key]:
            if existing.version == endpoint.version:
                raise ValueError(f"Endpoint {key} already registered for version {endpoint.version}")
        
        self.endpoints[key].append(endpoint)
        # Sort by version (latest first)
        self.endpoints[key].sort(key=lambda e: (e.version.major, e.version.minor, e.version.patch), reverse=True)
    
    def get_endpoint(self, method: str, path: str, requested_version: Optional[ApiVersion] = None) -> Optional[VersionedEndpoint]:
        """Get endpoint for specific version."""
        key = f"{method}:{path}"
        endpoints = self.endpoints.get(key, [])
        
        if not endpoints:
            return None
        
        target_version = requested_version or self.config.default_version
        
        # Find exact match first
        for endpoint in endpoints:
            if endpoint.version == target_version:
                return endpoint
        
        # Find compatible version (backward compatibility)
        for endpoint in endpoints:
            if VersionUtils.is_compatible(target_version, endpoint.version):
                return endpoint
        
        # Return latest if no compatible version found and strict versioning is disabled
        if not self.config.strict_versioning:
            return endpoints[0]  # Latest version (sorted)
        
        return None
    
    def extract_version_from_request(self) -> Optional[ApiVersion]:
        """Extract version from current Flask request."""
        try:
            if self.config.versioning_strategy == 'url':
                return self._extract_version_from_url()
            elif self.config.versioning_strategy == 'header':
                return self._extract_version_from_header()
            elif self.config.versioning_strategy == 'query':
                return self._extract_version_from_query()
            elif self.config.versioning_strategy == 'content-type':
                return self._extract_version_from_content_type()
        except Exception as e:
            self.logger.warning(f"Failed to extract version from request: {e}")
        
        return None
    
    def generate_version_headers(self, endpoint: VersionedEndpoint) -> Dict[str, str]:
        """Generate version-related response headers."""
        headers = {
            'API-Version': str(endpoint.version),
            'API-Supported-Versions': ', '.join(str(v) for v in self.config.supported_versions)
        }
        
        if endpoint.deprecated:
            headers['API-Deprecation'] = 'true'
            
            if endpoint.deprecation_date:
                headers['API-Deprecation-Date'] = endpoint.deprecation_date.isoformat()
            
            if endpoint.removal_date:
                headers['API-Removal-Date'] = endpoint.removal_date.isoformat()
            
            if endpoint.replaced_by:
                headers['API-Replaced-By'] = endpoint.replaced_by
        
        return headers
    
    def _extract_version_from_url(self) -> Optional[ApiVersion]:
        """Extract version from URL path."""
        path = request.path
        match = re.search(r'/v(\d+)(?:\.(\d+))?(?:\.(\d+))?', path)
        if match:
            return ApiVersion(
                major=int(match.group(1)),
                minor=int(match.group(2) or '0'),
                patch=int(match.group(3) or '0')
            )
        return None
    
    def _extract_version_from_header(self) -> Optional[ApiVersion]:
        """Extract version from API-Version header."""
        version_header = request.headers.get('API-Version')
        if version_header:
            return VersionUtils.parse_version(version_header)
        return None
    
    def _extract_version_from_query(self) -> Optional[ApiVersion]:
        """Extract version from query parameter."""
        version_param = request.args.get('version') or request.args.get('v')
        if version_param:
            return VersionUtils.parse_version(version_param)
        return None
    
    def _extract_version_from_content_type(self) -> Optional[ApiVersion]:
        """Extract version from Content-Type header."""
        content_type = request.headers.get('Content-Type', '')
        match = re.search(r'application/vnd\.sizewise\.v(\d+)(?:\.(\d+))?(?:\.(\d+))?\+json', content_type)
        if match:
            return ApiVersion(
                major=int(match.group(1)),
                minor=int(match.group(2) or '0'),
                patch=int(match.group(3) or '0')
            )
        return None

# =============================================================================
# Flask Middleware and Decorators
# =============================================================================

# Global version manager instance
version_manager: Optional[ApiVersionManager] = None

def init_api_versioning(app, config: VersioningConfig):
    """Initialize API versioning for Flask app."""
    global version_manager
    version_manager = ApiVersionManager(config)
    
    @app.before_request
    def before_request():
        """Extract and validate API version before each request."""
        if not request.path.startswith('/api/'):
            return  # Skip non-API requests
        
        requested_version = version_manager.extract_version_from_request()
        g.api_version = requested_version or config.default_version
        g.version_manager = version_manager

def versioned_endpoint(version: str, path: str, methods: List[str] = None, 
                      deprecated: bool = False, deprecation_date: Optional[str] = None,
                      removal_date: Optional[str] = None, replaced_by: Optional[str] = None,
                      description: str = ""):
    """Decorator for versioned API endpoints."""
    if methods is None:
        methods = ['GET']
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get version manager from Flask g
            vm = getattr(g, 'version_manager', None)
            if not vm:
                return jsonify({'error': 'API versioning not initialized'}), 500
            
            # Get current request version
            current_version = getattr(g, 'api_version', None)
            if not current_version:
                return jsonify({'error': 'API version not specified'}), 400
            
            # Find appropriate endpoint
            endpoint = vm.get_endpoint(request.method, path, current_version)
            if not endpoint:
                return jsonify({
                    'error': 'API version not supported',
                    'requested_version': str(current_version),
                    'supported_versions': [str(v) for v in vm.config.supported_versions]
                }), 400
            
            # Execute the function
            response = func(*args, **kwargs)
            
            # Add version headers to response
            if hasattr(response, 'headers'):
                version_headers = vm.generate_version_headers(endpoint)
                for key, value in version_headers.items():
                    response.headers[key] = value
            
            return response
        
        # Register the endpoint
        if version_manager:
            parsed_version = VersionUtils.parse_version(version)
            dep_date = datetime.fromisoformat(deprecation_date) if deprecation_date else None
            rem_date = datetime.fromisoformat(removal_date) if removal_date else None
            
            for method in methods:
                endpoint = VersionedEndpoint(
                    path=path,
                    version=parsed_version,
                    method=method,
                    handler=func,
                    deprecated=deprecated,
                    deprecation_date=dep_date,
                    removal_date=rem_date,
                    replaced_by=replaced_by,
                    description=description
                )
                version_manager.register_endpoint(endpoint)
        
        return wrapper
    return decorator

# =============================================================================
# Default Configuration for SizeWise Suite
# =============================================================================

def get_default_versioning_config() -> VersioningConfig:
    """Get default versioning configuration for SizeWise Suite."""
    return VersioningConfig(
        current_version=VersionUtils.parse_version('1.0.0'),
        supported_versions=[
            VersionUtils.parse_version('1.0.0')
        ],
        default_version=VersionUtils.parse_version('1.0.0'),
        versioning_strategy='url',
        strict_versioning=False,
        deprecation_warning_months=3,
        deprecation_support_months=6
    )

# =============================================================================
# Utility Functions
# =============================================================================

def get_api_version_info() -> Dict[str, Any]:
    """Get API version information for the /api/info endpoint."""
    if not version_manager:
        return {}
    
    config = version_manager.config
    return {
        'current_version': str(config.current_version),
        'supported_versions': [str(v) for v in config.supported_versions],
        'default_version': str(config.default_version),
        'versioning_strategy': config.versioning_strategy,
        'strict_versioning': config.strict_versioning,
        'deprecation_policy': {
            'warning_period_months': config.deprecation_warning_months,
            'support_period_months': config.deprecation_support_months
        }
    }

"""
API Migration Endpoints for SizeWise Suite

Provides endpoints for API version migration guidance,
compatibility checking, and automated migration support.
"""

from flask import Blueprint, jsonify, request
from backend.middleware.api_versioning import VersionUtils, version_manager
import logging

# Create blueprint
migration_bp = Blueprint('migration', __name__)
logger = logging.getLogger(__name__)

# =============================================================================
# Migration Data
# =============================================================================

MIGRATION_GUIDES = {
    '1.0.0->1.1.0': {
        'description': 'Minor update with enhanced HVAC calculations and new validation endpoints',
        'breaking_changes': [],
        'auto_migration': True,
        'estimated_time': '5 minutes',
        'steps': [
            {
                'step': 1,
                'title': 'Update API calls to use new validation endpoints',
                'description': 'New validation endpoints provide enhanced error reporting',
                'code_example': '''
# Before
POST /api/calculations/validate

# After (optional, backward compatible)
POST /api/validation/hvac-parameters
                ''',
                'required': False
            }
        ]
    },
    '1.1.0->2.0.0': {
        'description': 'Major update with restructured authentication and enhanced project management',
        'breaking_changes': [
            'Authentication endpoints moved from /auth to /api/auth',
            'Project creation requires additional metadata fields',
            'Response format changed for calculation endpoints',
            'New required authentication headers'
        ],
        'auto_migration': False,
        'estimated_time': '1-2 hours',
        'migration_guide_url': '/docs/migration/v1-to-v2',
        'steps': [
            {
                'step': 1,
                'title': 'Update authentication endpoints',
                'description': 'All authentication endpoints have been moved to /api/auth prefix',
                'code_example': '''
# Before
POST /auth/login
POST /auth/register

# After
POST /api/auth/login
POST /api/auth/register
                ''',
                'required': True,
                'estimated_time': '15 minutes'
            },
            {
                'step': 2,
                'title': 'Update project creation calls',
                'description': 'Project creation now requires additional metadata',
                'code_example': '''
# Before
{
  "name": "Project Name",
  "description": "Description"
}

# After
{
  "name": "Project Name",
  "description": "Description",
  "metadata": {
    "created_by": "user_id",
    "project_type": "hvac_design",
    "version": "2.0.0"
  }
}
                ''',
                'required': True,
                'estimated_time': '30 minutes'
            },
            {
                'step': 3,
                'title': 'Update calculation response handling',
                'description': 'Calculation responses now include additional validation data',
                'code_example': '''
# Before
{
  "result": { ... },
  "success": true
}

# After
{
  "result": { ... },
  "success": true,
  "validation": {
    "warnings": [...],
    "compliance": {...}
  },
  "metadata": {
    "calculation_time": "2024-01-01T00:00:00Z",
    "version": "2.0.0"
  }
}
                ''',
                'required': True,
                'estimated_time': '20 minutes'
            }
        ]
    }
}

# =============================================================================
# Migration Endpoints
# =============================================================================

@migration_bp.route('/migration/<from_version>/to/<to_version>', methods=['GET'])
def get_migration_guide(from_version: str, to_version: str):
    """Get migration guide for upgrading from one version to another."""
    try:
        # Validate version formats
        from_ver = VersionUtils.parse_version(from_version)
        to_ver = VersionUtils.parse_version(to_version)
        
        # Check if migration guide exists
        migration_key = f"{from_version}->{to_version}"
        migration_guide = MIGRATION_GUIDES.get(migration_key)
        
        if not migration_guide:
            return jsonify({
                'error': 'Migration guide not found',
                'from_version': from_version,
                'to_version': to_version,
                'available_migrations': list(MIGRATION_GUIDES.keys())
            }), 404
        
        return jsonify({
            'success': True,
            'migration': {
                'from_version': from_version,
                'to_version': to_version,
                'description': migration_guide['description'],
                'breaking_changes': migration_guide['breaking_changes'],
                'auto_migration': migration_guide['auto_migration'],
                'estimated_time': migration_guide['estimated_time'],
                'migration_guide_url': migration_guide.get('migration_guide_url'),
                'steps': migration_guide['steps']
            }
        })
        
    except ValueError as e:
        return jsonify({
            'error': 'Invalid version format',
            'message': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Failed to get migration guide: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to retrieve migration guide'
        }), 500

@migration_bp.route('/migration/compatibility', methods=['POST'])
def check_compatibility():
    """Check compatibility between API versions."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        from_version_str = data.get('from_version')
        to_version_str = data.get('to_version')
        
        if not from_version_str or not to_version_str:
            return jsonify({
                'error': 'Missing version parameters',
                'required': ['from_version', 'to_version']
            }), 400
        
        # Parse versions
        from_version = VersionUtils.parse_version(from_version_str)
        to_version = VersionUtils.parse_version(to_version_str)
        
        # Check compatibility
        compatible = VersionUtils.is_compatible(from_version, to_version)
        
        # Get migration info if available
        migration_key = f"{from_version_str}->{to_version_str}"
        migration_available = migration_key in MIGRATION_GUIDES
        
        result = {
            'success': True,
            'compatibility': {
                'from_version': from_version_str,
                'to_version': to_version_str,
                'compatible': compatible,
                'migration_available': migration_available,
                'migration_required': not compatible,
                'version_comparison': VersionUtils.compare_versions(from_version, to_version)
            }
        }
        
        if migration_available:
            migration_info = MIGRATION_GUIDES[migration_key]
            result['compatibility'].update({
                'breaking_changes': migration_info['breaking_changes'],
                'auto_migration': migration_info['auto_migration'],
                'estimated_migration_time': migration_info['estimated_time']
            })
        
        return jsonify(result)
        
    except ValueError as e:
        return jsonify({
            'error': 'Invalid version format',
            'message': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Failed to check compatibility: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to check version compatibility'
        }), 500

@migration_bp.route('/migration/available', methods=['GET'])
def get_available_migrations():
    """Get list of all available migration guides."""
    try:
        migrations = []
        
        for migration_key, migration_data in MIGRATION_GUIDES.items():
            from_version, to_version = migration_key.split('->')
            migrations.append({
                'from_version': from_version,
                'to_version': to_version,
                'description': migration_data['description'],
                'breaking_changes_count': len(migration_data['breaking_changes']),
                'auto_migration': migration_data['auto_migration'],
                'estimated_time': migration_data['estimated_time'],
                'steps_count': len(migration_data['steps'])
            })
        
        return jsonify({
            'success': True,
            'available_migrations': migrations,
            'total_count': len(migrations)
        })
        
    except Exception as e:
        logger.error(f"Failed to get available migrations: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to retrieve available migrations'
        }), 500

@migration_bp.route('/migration/validate-request', methods=['POST'])
def validate_migration_request():
    """Validate a migration request and provide recommendations."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        current_version_str = data.get('current_version')
        target_version_str = data.get('target_version')
        
        if not current_version_str or not target_version_str:
            return jsonify({
                'error': 'Missing version parameters',
                'required': ['current_version', 'target_version']
            }), 400
        
        # Parse versions
        current_version = VersionUtils.parse_version(current_version_str)
        target_version = VersionUtils.parse_version(target_version_str)
        
        # Validate migration request
        validation_result = {
            'valid': True,
            'warnings': [],
            'errors': [],
            'recommendations': []
        }
        
        # Check if downgrade
        if VersionUtils.compare_versions(current_version, target_version) > 0:
            validation_result['warnings'].append('Downgrading API versions is not recommended')
            validation_result['recommendations'].append('Consider maintaining current version or upgrading instead')
        
        # Check if same version
        if VersionUtils.compare_versions(current_version, target_version) == 0:
            validation_result['warnings'].append('Current and target versions are the same')
            validation_result['recommendations'].append('No migration needed')
        
        # Check if migration path exists
        migration_key = f"{current_version_str}->{target_version_str}"
        if migration_key not in MIGRATION_GUIDES:
            validation_result['warnings'].append('No direct migration guide available')
            validation_result['recommendations'].append('Check for multi-step migration path or contact support')
        
        # Check version support
        if version_manager:
            supported_versions = version_manager.config.supported_versions
            target_supported = any(
                VersionUtils.compare_versions(target_version, v) == 0 
                for v in supported_versions
            )
            
            if not target_supported:
                validation_result['errors'].append(f'Target version {target_version_str} is not supported')
                validation_result['valid'] = False
        
        return jsonify({
            'success': True,
            'validation': validation_result,
            'migration_info': {
                'current_version': current_version_str,
                'target_version': target_version_str,
                'migration_available': migration_key in MIGRATION_GUIDES
            }
        })
        
    except ValueError as e:
        return jsonify({
            'error': 'Invalid version format',
            'message': str(e)
        }), 400
    except Exception as e:
        logger.error(f"Failed to validate migration request: {e}")
        return jsonify({
            'error': 'Internal server error',
            'message': 'Failed to validate migration request'
        }), 500

"""
Enhanced Input Validation Middleware for SizeWise Suite
Provides comprehensive input sanitization and validation without breaking existing API contracts
"""

import re
import html
import json
import logging
from typing import Dict, Any, List, Optional, Union
from functools import wraps
from flask import request, jsonify, g
from pydantic import BaseModel, ValidationError, Field
import bleach
from jsonschema import validate, ValidationError as JSONSchemaValidationError

# Configure logging
logger = logging.getLogger(__name__)

class InputSanitizer:
    """Advanced input sanitization with HVAC-specific rules"""
    
    def __init__(self):
        """Initialize sanitizer with security rules"""
        # Allowed HTML tags for rich text fields (very restrictive)
        self.allowed_tags = ['b', 'i', 'u', 'em', 'strong', 'p', 'br']
        self.allowed_attributes = {}
        
        # Dangerous patterns to detect and remove
        self.dangerous_patterns = [
            r'<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>',  # Script tags
            r'javascript:',  # JavaScript URLs
            r'vbscript:',    # VBScript URLs
            r'data:text/html',  # Data URLs with HTML
            r'on\w+\s*=',    # Event handlers
            r'expression\s*\(',  # CSS expressions
            r'@import',      # CSS imports
            r'<iframe',      # Iframes
            r'<object',      # Objects
            r'<embed',       # Embeds
            r'<link',        # Links
            r'<meta',        # Meta tags
        ]
        
        # SQL injection patterns
        self.sql_patterns = [
            r'(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)',
            r'(--|#|\/\*|\*\/)',  # SQL comments
            r'(\bOR\b.*=.*\bOR\b)',  # OR injection
            r'(\bAND\b.*=.*\bAND\b)',  # AND injection
            r'(\'.*\'|\".*\")',  # String literals
        ]
        
        # Path traversal patterns
        self.path_traversal_patterns = [
            r'\.\.\/',
            r'\.\.\\',
            r'%2e%2e%2f',
            r'%2e%2e%5c',
        ]
        
        # HVAC-specific validation patterns
        self.hvac_patterns = {
            'duct_size': r'^\d{1,3}x\d{1,3}$|^\d{1,3}$',  # e.g., "12x8" or "12"
            'material': r'^[a-zA-Z_]+$',  # Only letters and underscores
            'units': r'^(imperial|metric)$',
            'duct_type': r'^(rectangular|round|oval)$',
            'calculation_type': r'^(air_duct|grease_duct|engine_exhaust|boiler_vent)$',
        }
    
    def sanitize_string(self, value: str, field_name: str = '') -> str:
        """Sanitize string input with context-aware rules"""
        if not isinstance(value, str):
            return str(value)
        
        # Remove null bytes
        value = value.replace('\x00', '')
        
        # Check for dangerous patterns
        for pattern in self.dangerous_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                logger.warning(f"Dangerous pattern detected in field '{field_name}': {pattern}")
                value = re.sub(pattern, '', value, flags=re.IGNORECASE)
        
        # Check for SQL injection patterns
        for pattern in self.sql_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                logger.warning(f"SQL injection pattern detected in field '{field_name}': {pattern}")
                # For SQL patterns, we're more aggressive and reject the input
                raise ValueError(f"Invalid input detected in field '{field_name}'")
        
        # Check for path traversal
        for pattern in self.path_traversal_patterns:
            if re.search(pattern, value, re.IGNORECASE):
                logger.warning(f"Path traversal pattern detected in field '{field_name}': {pattern}")
                value = re.sub(pattern, '', value, flags=re.IGNORECASE)
        
        # HTML escape for safety (but preserve some formatting for description fields)
        if field_name in ['description', 'notes', 'comments']:
            # Use bleach for rich text fields
            value = bleach.clean(value, tags=self.allowed_tags, attributes=self.allowed_attributes)
        else:
            # HTML escape for regular fields
            value = html.escape(value)
        
        # Validate HVAC-specific fields
        if field_name in self.hvac_patterns:
            pattern = self.hvac_patterns[field_name]
            if not re.match(pattern, value):
                raise ValueError(f"Invalid format for HVAC field '{field_name}': {value}")
        
        return value.strip()
    
    def sanitize_number(self, value: Union[int, float, str], field_name: str = '') -> Union[int, float]:
        """Sanitize numeric input with HVAC-specific ranges"""
        try:
            # Convert to appropriate numeric type
            if isinstance(value, str):
                # Remove any non-numeric characters except decimal point and minus
                cleaned = re.sub(r'[^\d\.\-]', '', value)
                if '.' in cleaned:
                    num_value = float(cleaned)
                else:
                    num_value = int(cleaned)
            else:
                num_value = value
            
            # HVAC-specific range validation
            hvac_ranges = {
                'airflow': (0, 100000),  # CFM or L/s
                'velocity': (0, 10000),  # FPM or m/s
                'pressure': (0, 50),     # inches WC or Pa
                'friction_rate': (0.001, 2.0),  # inches WC per 100 ft
                'temperature': (-50, 500),  # °F or °C
                'humidity': (0, 100),    # %
                'duct_width': (1, 120),  # inches or cm
                'duct_height': (1, 120), # inches or cm
                'diameter': (1, 120),    # inches or cm
                'length': (0, 10000),    # feet or meters
            }
            
            if field_name in hvac_ranges:
                min_val, max_val = hvac_ranges[field_name]
                if not (min_val <= num_value <= max_val):
                    raise ValueError(f"Value {num_value} for field '{field_name}' is outside valid range [{min_val}, {max_val}]")
            
            return num_value
            
        except (ValueError, TypeError) as e:
            logger.warning(f"Invalid numeric value for field '{field_name}': {value}")
            raise ValueError(f"Invalid numeric value for field '{field_name}': {value}")
    
    def sanitize_dict(self, data: Dict[str, Any], schema_name: str = '') -> Dict[str, Any]:
        """Recursively sanitize dictionary data"""
        if not isinstance(data, dict):
            raise ValueError("Expected dictionary input")
        
        sanitized = {}
        
        for key, value in data.items():
            # Sanitize the key itself
            clean_key = self.sanitize_string(key, 'key')
            
            # Sanitize the value based on type
            if isinstance(value, str):
                sanitized[clean_key] = self.sanitize_string(value, clean_key)
            elif isinstance(value, (int, float)):
                sanitized[clean_key] = self.sanitize_number(value, clean_key)
            elif isinstance(value, dict):
                sanitized[clean_key] = self.sanitize_dict(value, f"{schema_name}.{clean_key}")
            elif isinstance(value, list):
                sanitized[clean_key] = self.sanitize_list(value, f"{schema_name}.{clean_key}")
            elif isinstance(value, bool):
                sanitized[clean_key] = bool(value)
            elif value is None:
                sanitized[clean_key] = None
            else:
                # Convert unknown types to string and sanitize
                sanitized[clean_key] = self.sanitize_string(str(value), clean_key)
        
        return sanitized
    
    def sanitize_list(self, data: List[Any], field_name: str = '') -> List[Any]:
        """Sanitize list data"""
        if not isinstance(data, list):
            raise ValueError("Expected list input")
        
        sanitized = []
        
        for i, item in enumerate(data):
            item_field = f"{field_name}[{i}]"
            
            if isinstance(item, str):
                sanitized.append(self.sanitize_string(item, item_field))
            elif isinstance(item, (int, float)):
                sanitized.append(self.sanitize_number(item, item_field))
            elif isinstance(item, dict):
                sanitized.append(self.sanitize_dict(item, item_field))
            elif isinstance(item, list):
                sanitized.append(self.sanitize_list(item, item_field))
            elif isinstance(item, bool):
                sanitized.append(bool(item))
            elif item is None:
                sanitized.append(None)
            else:
                sanitized.append(self.sanitize_string(str(item), item_field))
        
        return sanitized


class InputValidator:
    """Enhanced input validator with JSON schema and business logic validation"""
    
    def __init__(self):
        """Initialize validator with schemas and sanitizer"""
        self.sanitizer = InputSanitizer()
        self.schemas = self._load_validation_schemas()
    
    def _load_validation_schemas(self) -> Dict[str, Dict[str, Any]]:
        """Load validation schemas for different API endpoints"""
        return {
            'air_duct_calculation': {
                "type": "object",
                "properties": {
                    "airflow": {"type": "number", "minimum": 1, "maximum": 100000},
                    "duct_type": {"type": "string", "enum": ["rectangular", "round", "oval"]},
                    "friction_rate": {"type": "number", "minimum": 0.001, "maximum": 2.0},
                    "units": {"type": "string", "enum": ["imperial", "metric"]},
                    "material": {"type": "string", "enum": ["galvanized_steel", "aluminum", "stainless_steel", "pvc", "fiberglass"]},
                    "insulation": {"type": "boolean"},
                    "velocity_limit": {"type": "number", "minimum": 100, "maximum": 10000},
                    "dimensions": {
                        "type": "object",
                        "properties": {
                            "width": {"type": "number", "minimum": 1, "maximum": 120},
                            "height": {"type": "number", "minimum": 1, "maximum": 120},
                            "diameter": {"type": "number", "minimum": 1, "maximum": 120}
                        }
                    }
                },
                "required": ["airflow", "duct_type", "friction_rate", "units"],
                "additionalProperties": False
            },
            'project': {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "minLength": 1, "maxLength": 255},
                    "description": {"type": "string", "maxLength": 2000},
                    "units": {"type": "string", "enum": ["imperial", "metric"]},
                    "location": {"type": "string", "maxLength": 500},
                    "client": {"type": "string", "maxLength": 255},
                    "engineer": {"type": "string", "maxLength": 255}
                },
                "required": ["name", "units"],
                "additionalProperties": False
            }
        }
    
    def validate_and_sanitize(self, data: Any, schema_name: str = None) -> Dict[str, Any]:
        """Validate and sanitize input data"""
        try:
            # First, sanitize the input
            if isinstance(data, dict):
                sanitized_data = self.sanitizer.sanitize_dict(data, schema_name or 'unknown')
            elif isinstance(data, list):
                sanitized_data = self.sanitizer.sanitize_list(data, schema_name or 'unknown')
            else:
                raise ValueError("Input must be a dictionary or list")
            
            # Then validate against schema if provided
            if schema_name and schema_name in self.schemas:
                validate(instance=sanitized_data, schema=self.schemas[schema_name])
                logger.info(f"Input validation passed for schema: {schema_name}")
            
            return {
                'valid': True,
                'data': sanitized_data,
                'errors': [],
                'warnings': []
            }
            
        except ValueError as e:
            logger.warning(f"Input validation failed: {str(e)}")
            return {
                'valid': False,
                'data': None,
                'errors': [str(e)],
                'warnings': []
            }
        except JSONSchemaValidationError as e:
            logger.warning(f"Schema validation failed: {str(e)}")
            return {
                'valid': False,
                'data': None,
                'errors': [f"Schema validation failed: {e.message}"],
                'warnings': []
            }
        except Exception as e:
            logger.error(f"Unexpected validation error: {str(e)}")
            return {
                'valid': False,
                'data': None,
                'errors': [f"Validation error: {str(e)}"],
                'warnings': []
            }


def validate_input(schema_name: str = None, required: bool = True):
    """Decorator for validating and sanitizing API input"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get request data
            if request.is_json:
                data = request.get_json()
            else:
                data = request.form.to_dict()
            
            if required and not data:
                return jsonify({
                    'error': 'No input data provided',
                    'message': 'Request must include valid JSON data'
                }), 400
            
            if data:
                # Validate and sanitize input
                validator = InputValidator()
                result = validator.validate_and_sanitize(data, schema_name)
                
                if not result['valid']:
                    return jsonify({
                        'error': 'Input validation failed',
                        'details': result['errors'],
                        'warnings': result['warnings']
                    }), 400
                
                # Store sanitized data in Flask's g object for use in the route
                g.validated_data = result['data']
                g.validation_warnings = result['warnings']
            
            # Call the original function
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator


class InputValidationMiddleware:
    """Flask middleware for automatic input validation"""
    
    def __init__(self, app=None):
        self.app = app
        self.validator = InputValidator()
        
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize middleware with Flask app"""
        app.before_request(self.before_request)
        
        # Store validator in app context
        app.input_validator = self.validator
        
        logger.info("Input validation middleware initialized")
    
    def before_request(self):
        """Validate input before processing request"""
        # Skip validation for certain request types
        if self.should_skip_validation():
            return None
        
        # Only validate requests with JSON data
        if not request.is_json:
            return None
        
        try:
            data = request.get_json()
            if data:
                # Determine schema based on endpoint
                schema_name = self.get_schema_for_endpoint(request.endpoint)
                
                # Validate and sanitize
                result = self.validator.validate_and_sanitize(data, schema_name)
                
                if not result['valid']:
                    return jsonify({
                        'error': 'Input validation failed',
                        'details': result['errors'],
                        'endpoint': request.endpoint,
                        'documentation': 'https://docs.sizewise.com/api/validation'
                    }), 400
                
                # Store validated data
                g.validated_data = result['data']
                g.validation_warnings = result['warnings']
                
        except Exception as e:
            logger.error(f"Input validation middleware error: {str(e)}")
            return jsonify({
                'error': 'Input validation error',
                'message': 'Unable to process request data'
            }), 400
    
    def should_skip_validation(self) -> bool:
        """Determine if validation should be skipped"""
        # Skip for GET requests, health checks, and static assets
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        
        skip_paths = ['/health', '/metrics', '/static/', '/favicon.ico']
        for path in skip_paths:
            if request.path.startswith(path):
                return True
        
        return False
    
    def get_schema_for_endpoint(self, endpoint: str) -> Optional[str]:
        """Map endpoint to validation schema"""
        endpoint_schema_map = {
            'calculations.calculate_air_duct': 'air_duct_calculation',
            'projects.create_project': 'project',
            'projects.update_project': 'project',
        }
        
        return endpoint_schema_map.get(endpoint)

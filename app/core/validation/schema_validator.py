"""
Schema Validator

Provides JSON schema validation using both Pydantic and JSONSchema for comprehensive validation.
"""

import json
from typing import Dict, Any, List, Optional, Union
from pydantic import BaseModel, ValidationError, Field
from jsonschema import validate, ValidationError as JSONSchemaValidationError
import structlog

logger = structlog.get_logger()

class ValidationResult:
    """Container for validation results."""
    
    def __init__(self, is_valid: bool = True, errors: List[str] = None, warnings: List[str] = None):
        self.is_valid = is_valid
        self.errors = errors or []
        self.warnings = warnings or []
    
    def add_error(self, error: str):
        """Add an error to the validation result."""
        self.errors.append(error)
        self.is_valid = False
    
    def add_warning(self, warning: str):
        """Add a warning to the validation result."""
        self.warnings.append(warning)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert validation result to dictionary."""
        return {
            'is_valid': self.is_valid,
            'errors': self.errors,
            'warnings': self.warnings
        }

class SchemaValidator:
    """Main schema validation class using Pydantic and JSONSchema."""
    
    def __init__(self):
        self.schemas = {}
        self.pydantic_models = {}
        self._load_schemas()
    
    def _load_schemas(self):
        """Load predefined schemas for HVAC calculations."""
        
        # Air Duct Sizer Schema
        self.schemas['air_duct_input'] = {
            "type": "object",
            "properties": {
                "airflow": {
                    "type": "number",
                    "minimum": 1,
                    "maximum": 100000,
                    "description": "Airflow in CFM or L/s"
                },
                "duct_type": {
                    "type": "string",
                    "enum": ["rectangular", "round"],
                    "description": "Type of duct"
                },
                "friction_rate": {
                    "type": "number",
                    "minimum": 0.01,
                    "maximum": 1.0,
                    "description": "Friction rate in inches w.g. per 100 ft or Pa/m"
                },
                "units": {
                    "type": "string",
                    "enum": ["imperial", "metric"],
                    "description": "Unit system"
                },
                "material": {
                    "type": "string",
                    "enum": ["galvanized_steel", "aluminum", "stainless_steel", "pvc", "fiberglass"],
                    "default": "galvanized_steel"
                },
                "insulation": {
                    "type": "boolean",
                    "default": False
                }
            },
            "required": ["airflow", "duct_type", "friction_rate", "units"],
            "additionalProperties": False
        }
        
        # Project Schema
        self.schemas['project'] = {
            "type": "object",
            "properties": {
                "id": {"type": ["string", "integer"]},
                "name": {
                    "type": "string",
                    "minLength": 1,
                    "maxLength": 255
                },
                "description": {
                    "type": "string",
                    "maxLength": 1000
                },
                "created": {
                    "type": "string",
                    "format": "date-time"
                },
                "modified": {
                    "type": "string",
                    "format": "date-time"
                },
                "units": {
                    "type": "string",
                    "enum": ["imperial", "metric"]
                },
                "calculations": {
                    "type": "array",
                    "items": {"type": "object"}
                }
            },
            "required": ["name", "units"],
            "additionalProperties": False
        }
        
        # Calculation Result Schema
        self.schemas['calculation_result'] = {
            "type": "object",
            "properties": {
                "id": {"type": ["string", "integer"]},
                "module_id": {"type": "string"},
                "project_id": {"type": ["string", "integer"]},
                "input_data": {"type": "object"},
                "results": {"type": "object"},
                "compliance": {"type": "object"},
                "created": {
                    "type": "string",
                    "format": "date-time"
                },
                "version": {"type": "string"}
            },
            "required": ["module_id", "input_data", "results"],
            "additionalProperties": False
        }
        
        logger.info("Loaded validation schemas", schema_count=len(self.schemas))
    
    def validate_json_schema(self, data: Dict[str, Any], schema_name: str) -> ValidationResult:
        """Validate data against a JSON schema."""
        result = ValidationResult()
        
        if schema_name not in self.schemas:
            result.add_error(f"Schema '{schema_name}' not found")
            return result
        
        try:
            validate(instance=data, schema=self.schemas[schema_name])
            logger.debug("JSON schema validation passed", schema=schema_name)
        except JSONSchemaValidationError as e:
            result.add_error(f"Schema validation failed: {e.message}")
            logger.warning("JSON schema validation failed", schema=schema_name, error=str(e))
        except Exception as e:
            result.add_error(f"Validation error: {str(e)}")
            logger.error("Unexpected validation error", schema=schema_name, error=str(e))
        
        return result
    
    def validate_air_duct_input(self, data: Dict[str, Any]) -> ValidationResult:
        """Validate air duct calculation input data."""
        result = self.validate_json_schema(data, 'air_duct_input')
        
        # Additional business logic validation
        if result.is_valid:
            airflow = data.get('airflow', 0)
            friction_rate = data.get('friction_rate', 0)
            
            # Check for reasonable airflow values
            if airflow < 50:
                result.add_warning("Airflow is very low. Verify this is correct.")
            elif airflow > 50000:
                result.add_warning("Airflow is very high. Verify this is correct.")
            
            # Check friction rate
            if friction_rate < 0.02:
                result.add_warning("Very low friction rate. This may result in oversized ducts.")
            elif friction_rate > 0.5:
                result.add_warning("High friction rate. This may result in undersized ducts.")
        
        return result
    
    def validate_project(self, data: Dict[str, Any]) -> ValidationResult:
        """Validate project data."""
        return self.validate_json_schema(data, 'project')
    
    def validate_calculation_result(self, data: Dict[str, Any]) -> ValidationResult:
        """Validate calculation result data."""
        return self.validate_json_schema(data, 'calculation_result')
    
    def get_schema(self, schema_name: str) -> Optional[Dict[str, Any]]:
        """Get a schema by name."""
        return self.schemas.get(schema_name)
    
    def add_schema(self, schema_name: str, schema: Dict[str, Any]):
        """Add a new schema."""
        self.schemas[schema_name] = schema
        logger.info("Added new schema", schema_name=schema_name)
    
    def list_schemas(self) -> List[str]:
        """List all available schema names."""
        return list(self.schemas.keys())

# Pydantic Models for type-safe validation
class AirDuctInput(BaseModel):
    """Pydantic model for air duct calculation input."""
    airflow: float = Field(..., gt=0, le=100000, description="Airflow in CFM or L/s")
    duct_type: str = Field(..., pattern="^(rectangular|round)$", description="Type of duct")
    friction_rate: float = Field(..., gt=0, le=1.0, description="Friction rate")
    units: str = Field(..., pattern="^(imperial|metric)$", description="Unit system")
    material: str = Field("galvanized_steel", pattern="^(galvanized_steel|aluminum|stainless_steel|pvc|fiberglass)$")
    insulation: bool = Field(False, description="Whether duct is insulated")

class Project(BaseModel):
    """Pydantic model for project data."""
    id: Optional[Union[str, int]] = None
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    created: Optional[str] = None
    modified: Optional[str] = None
    units: str = Field(..., pattern="^(imperial|metric)$")
    calculations: List[Dict[str, Any]] = Field(default_factory=list)

class CalculationResult(BaseModel):
    """Pydantic model for calculation results."""
    id: Optional[Union[str, int]] = None
    module_id: str
    project_id: Optional[Union[str, int]] = None
    input_data: Dict[str, Any]
    results: Dict[str, Any]
    compliance: Optional[Dict[str, Any]] = None
    created: Optional[str] = None
    version: Optional[str] = None

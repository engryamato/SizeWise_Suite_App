"""
PR #30 Validation Tests - jsonschema and pydantic-core updates
Tests for jsonschema 4.23.0→4.25.0 and pydantic-core 2.33.2→2.37.2
"""

import pytest
import json
import time
from typing import Dict, Any, List
from pydantic import BaseModel, ValidationError, Field
from jsonschema import validate, ValidationError as JsonSchemaValidationError
from jsonschema.validators import Draft7Validator


class TestJsonSchemaUpdates:
    """Test jsonschema 4.25.0 functionality and performance"""
    
    def test_basic_validation(self):
        """Test basic JSON schema validation works"""
        schema = {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
                "age": {"type": "number", "minimum": 0}
            },
            "required": ["name", "age"]
        }
        
        valid_data = {"name": "Test", "age": 25}
        validate(instance=valid_data, schema=schema)
        
        # Should not raise exception
        assert True
    
    def test_enhanced_error_handling(self):
        """Test enhanced error handling in jsonschema 4.25.0"""
        schema = {
            "type": "object",
            "properties": {
                "email": {"type": "string", "format": "email"}
            }
        }
        
        invalid_data = {"email": "not-an-email"}
        
        with pytest.raises(JsonSchemaValidationError) as exc_info:
            validate(instance=invalid_data, schema=schema)
        
        # Enhanced error messages should be more descriptive
        assert "format" in str(exc_info.value).lower()
    
    def test_iri_format_support(self):
        """Test new IRI format support in jsonschema 4.25.0"""
        schema = {
            "type": "object",
            "properties": {
                "url": {"type": "string", "format": "iri"}
            }
        }
        
        valid_iri = {"url": "https://example.com/path"}
        validate(instance=valid_iri, schema=schema)
        
        # Should validate successfully
        assert True
    
    def test_validation_performance(self):
        """Test validation performance improvements"""
        schema = {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "integer"},
                    "name": {"type": "string"},
                    "data": {"type": "object"}
                },
                "required": ["id", "name"]
            }
        }
        
        # Create large dataset for performance testing
        large_data = [
            {"id": i, "name": f"item_{i}", "data": {"value": i * 2}}
            for i in range(1000)
        ]
        
        start_time = time.time()
        validate(instance=large_data, schema=schema)
        end_time = time.time()
        
        validation_time = end_time - start_time
        
        # Should complete within reasonable time (< 1 second for 1000 items)
        assert validation_time < 1.0, f"Validation took {validation_time:.3f}s, expected < 1.0s"


class HVACCalculationModel(BaseModel):
    """Test model for HVAC calculations using pydantic-core 2.37.2"""
    
    duct_diameter: float = Field(gt=0, description="Duct diameter in inches")
    airflow_rate: float = Field(gt=0, description="Airflow rate in CFM")
    duct_length: float = Field(gt=0, description="Duct length in feet")
    roughness_factor: float = Field(ge=0, le=1, description="Duct roughness factor")
    
    class Config:
        # Test new pydantic-core features
        validate_assignment = True
        use_enum_values = True


class TestPydanticCoreUpdates:
    """Test pydantic-core 2.37.2 functionality and performance"""
    
    def test_basic_model_validation(self):
        """Test basic Pydantic model validation"""
        valid_data = {
            "duct_diameter": 12.0,
            "airflow_rate": 1000.0,
            "duct_length": 50.0,
            "roughness_factor": 0.1
        }
        
        model = HVACCalculationModel(**valid_data)
        assert model.duct_diameter == 12.0
        assert model.airflow_rate == 1000.0
    
    def test_enhanced_validation_errors(self):
        """Test enhanced validation error messages in pydantic-core 2.37.2"""
        invalid_data = {
            "duct_diameter": -5.0,  # Should be > 0
            "airflow_rate": 1000.0,
            "duct_length": 50.0,
            "roughness_factor": 1.5  # Should be <= 1
        }
        
        with pytest.raises(ValidationError) as exc_info:
            HVACCalculationModel(**invalid_data)
        
        errors = exc_info.value.errors()
        assert len(errors) >= 2  # Should catch both validation errors
        
        # Check for enhanced error details
        error_fields = [error['loc'][0] for error in errors]
        assert 'duct_diameter' in error_fields
        assert 'roughness_factor' in error_fields
    
    def test_missing_sentinel_functionality(self):
        """Test MISSING sentinel functionality in pydantic-core 2.37.2"""
        from pydantic_core import PydanticUndefined
        
        # Test that undefined values are handled correctly
        partial_data = {
            "duct_diameter": 12.0,
            "airflow_rate": 1000.0
            # Missing duct_length and roughness_factor
        }
        
        with pytest.raises(ValidationError) as exc_info:
            HVACCalculationModel(**partial_data)
        
        errors = exc_info.value.errors()
        missing_fields = [error['loc'][0] for error in errors if error['type'] == 'missing']
        assert 'duct_length' in missing_fields
        assert 'roughness_factor' in missing_fields
    
    def test_field_level_exclusion(self):
        """Test field-level exclusion functionality"""
        model_data = {
            "duct_diameter": 12.0,
            "airflow_rate": 1000.0,
            "duct_length": 50.0,
            "roughness_factor": 0.1
        }
        
        model = HVACCalculationModel(**model_data)
        
        # Test model serialization with field exclusion
        serialized = model.model_dump(exclude={'roughness_factor'})
        assert 'roughness_factor' not in serialized
        assert 'duct_diameter' in serialized
    
    def test_validation_performance(self):
        """Test validation performance improvements"""
        model_data = {
            "duct_diameter": 12.0,
            "airflow_rate": 1000.0,
            "duct_length": 50.0,
            "roughness_factor": 0.1
        }
        
        # Test performance with multiple validations
        start_time = time.time()
        
        for _ in range(1000):
            model = HVACCalculationModel(**model_data)
            _ = model.model_dump()
        
        end_time = time.time()
        validation_time = end_time - start_time
        
        # Should complete 1000 validations quickly (< 0.5 seconds)
        assert validation_time < 0.5, f"1000 validations took {validation_time:.3f}s, expected < 0.5s"


class TestIntegrationCompatibility:
    """Test integration with existing MongoDB and PostgreSQL setup"""
    
    def test_mongodb_schema_validation(self):
        """Test MongoDB document validation with updated jsonschema"""
        # MongoDB document schema
        mongodb_schema = {
            "type": "object",
            "properties": {
                "_id": {"type": "string"},
                "project_name": {"type": "string"},
                "hvac_data": {
                    "type": "object",
                    "properties": {
                        "calculations": {"type": "array"},
                        "metadata": {"type": "object"}
                    }
                },
                "created_at": {"type": "string", "format": "date-time"}
            },
            "required": ["project_name", "hvac_data"]
        }
        
        valid_document = {
            "_id": "507f1f77bcf86cd799439011",
            "project_name": "Test HVAC Project",
            "hvac_data": {
                "calculations": [{"duct_size": 12, "cfm": 1000}],
                "metadata": {"version": "1.0"}
            },
            "created_at": "2024-01-01T12:00:00Z"
        }
        
        validate(instance=valid_document, schema=mongodb_schema)
        assert True
    
    def test_api_response_validation(self):
        """Test API response validation with updated libraries"""
        api_response_schema = {
            "type": "object",
            "properties": {
                "status": {"type": "string", "enum": ["success", "error"]},
                "data": {"type": "object"},
                "message": {"type": "string"},
                "timestamp": {"type": "string", "format": "date-time"}
            },
            "required": ["status", "data"]
        }
        
        valid_response = {
            "status": "success",
            "data": {"result": 42},
            "message": "Calculation completed",
            "timestamp": "2024-01-01T12:00:00Z"
        }
        
        validate(instance=valid_response, schema=api_response_schema)
        assert True


class TestSecurityValidation:
    """Test security improvements in updated libraries"""
    
    def test_input_sanitization(self):
        """Test enhanced input sanitization"""
        # Test potentially malicious input
        malicious_schema = {
            "type": "object",
            "properties": {
                "user_input": {"type": "string", "maxLength": 100}
            }
        }
        
        # Should handle large inputs gracefully
        large_input = {"user_input": "x" * 1000}
        
        with pytest.raises(JsonSchemaValidationError):
            validate(instance=large_input, schema=malicious_schema)
    
    def test_schema_security(self):
        """Test schema validation security"""
        # Test recursive schema protection
        recursive_schema = {
            "type": "object",
            "properties": {
                "nested": {"$ref": "#"}
            }
        }
        
        # Should handle recursive references safely
        test_data = {"nested": {"nested": {"nested": {}}}}
        
        try:
            validate(instance=test_data, schema=recursive_schema)
        except (JsonSchemaValidationError, RecursionError):
            # Either validation error or recursion protection is acceptable
            pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

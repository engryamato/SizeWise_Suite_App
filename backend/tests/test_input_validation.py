"""
Test suite for input validation middleware
Validates comprehensive input sanitization and validation functionality
"""

import pytest
import json
from unittest.mock import Mock, patch
from flask import Flask, jsonify, g, request
from backend.middleware.input_validator import (
    InputSanitizer, InputValidator, InputValidationMiddleware, validate_input
)


class TestInputSanitizer:
    """Test cases for InputSanitizer class"""
    
    def setup_method(self):
        """Setup test environment"""
        self.sanitizer = InputSanitizer()
    
    def test_sanitize_string_basic(self):
        """Test basic string sanitization"""
        result = self.sanitizer.sanitize_string("Hello World", "test_field")
        assert result == "Hello World"
    
    def test_sanitize_string_html_escape(self):
        """Test HTML escaping in strings"""
        result = self.sanitizer.sanitize_string("<script>alert('xss')</script>", "test_field")
        assert "<script>" not in result
        assert "alert" not in result
    
    def test_sanitize_string_sql_injection(self):
        """Test SQL injection pattern detection"""
        with pytest.raises(ValueError, match="Invalid input detected"):
            self.sanitizer.sanitize_string("'; DROP TABLE users; --", "test_field")
    
    def test_sanitize_string_path_traversal(self):
        """Test path traversal pattern removal"""
        result = self.sanitizer.sanitize_string("../../../etc/passwd", "test_field")
        assert "../" not in result
        assert result == "etc/passwd"
    
    def test_sanitize_string_hvac_duct_type(self):
        """Test HVAC-specific duct type validation"""
        # Valid duct type
        result = self.sanitizer.sanitize_string("rectangular", "duct_type")
        assert result == "rectangular"
        
        # Invalid duct type
        with pytest.raises(ValueError, match="Invalid format for HVAC field"):
            self.sanitizer.sanitize_string("invalid_type", "duct_type")
    
    def test_sanitize_string_hvac_units(self):
        """Test HVAC units validation"""
        # Valid units
        result = self.sanitizer.sanitize_string("imperial", "units")
        assert result == "imperial"
        
        # Invalid units
        with pytest.raises(ValueError, match="Invalid format for HVAC field"):
            self.sanitizer.sanitize_string("invalid_units", "units")
    
    def test_sanitize_number_valid(self):
        """Test valid number sanitization"""
        result = self.sanitizer.sanitize_number(1000.5, "airflow")
        assert result == 1000.5
    
    def test_sanitize_number_string_conversion(self):
        """Test string to number conversion"""
        result = self.sanitizer.sanitize_number("1000", "airflow")
        assert result == 1000
        
        result = self.sanitizer.sanitize_number("1000.5", "airflow")
        assert result == 1000.5
    
    def test_sanitize_number_hvac_range_validation(self):
        """Test HVAC-specific range validation"""
        # Valid airflow
        result = self.sanitizer.sanitize_number(1000, "airflow")
        assert result == 1000
        
        # Invalid airflow (too high)
        with pytest.raises(ValueError, match="outside valid range"):
            self.sanitizer.sanitize_number(200000, "airflow")
        
        # Invalid airflow (negative)
        with pytest.raises(ValueError, match="outside valid range"):
            self.sanitizer.sanitize_number(-100, "airflow")
    
    def test_sanitize_number_invalid_string(self):
        """Test invalid string number conversion"""
        with pytest.raises(ValueError, match="Invalid numeric value"):
            self.sanitizer.sanitize_number("not_a_number", "airflow")
    
    def test_sanitize_dict_basic(self):
        """Test basic dictionary sanitization"""
        data = {
            "airflow": 1000,
            "duct_type": "rectangular",
            "description": "Test duct"
        }
        
        result = self.sanitizer.sanitize_dict(data, "test_schema")
        
        assert result["airflow"] == 1000
        assert result["duct_type"] == "rectangular"
        assert result["description"] == "Test duct"
    
    def test_sanitize_dict_nested(self):
        """Test nested dictionary sanitization"""
        data = {
            "project": {
                "name": "Test Project",
                "dimensions": {
                    "width": 12,
                    "height": 8
                }
            }
        }
        
        result = self.sanitizer.sanitize_dict(data, "test_schema")
        
        assert result["project"]["name"] == "Test Project"
        assert result["project"]["dimensions"]["width"] == 12
        assert result["project"]["dimensions"]["height"] == 8
    
    def test_sanitize_dict_malicious_content(self):
        """Test dictionary with malicious content"""
        data = {
            "name": "Test<script>alert('xss')</script>",
            "description": "Normal description"
        }
        
        result = self.sanitizer.sanitize_dict(data, "test_schema")
        
        assert "<script>" not in result["name"]
        assert result["description"] == "Normal description"
    
    def test_sanitize_list_basic(self):
        """Test basic list sanitization"""
        data = ["item1", "item2", 123]
        
        result = self.sanitizer.sanitize_list(data, "test_field")
        
        assert result == ["item1", "item2", 123]
    
    def test_sanitize_list_nested(self):
        """Test nested list sanitization"""
        data = [
            {"name": "Item 1", "value": 100},
            {"name": "Item 2", "value": 200}
        ]
        
        result = self.sanitizer.sanitize_list(data, "test_field")
        
        assert len(result) == 2
        assert result[0]["name"] == "Item 1"
        assert result[1]["value"] == 200


class TestInputValidator:
    """Test cases for InputValidator class"""
    
    def setup_method(self):
        """Setup test environment"""
        self.validator = InputValidator()
    
    def test_validate_air_duct_calculation_valid(self):
        """Test valid air duct calculation data"""
        data = {
            "airflow": 1000,
            "duct_type": "rectangular",
            "friction_rate": 0.1,
            "units": "imperial",
            "material": "galvanized_steel"
        }
        
        result = self.validator.validate_and_sanitize(data, "air_duct_calculation")
        
        assert result["valid"] is True
        assert result["data"]["airflow"] == 1000
        assert result["data"]["duct_type"] == "rectangular"
        assert len(result["errors"]) == 0
    
    def test_validate_air_duct_calculation_missing_required(self):
        """Test air duct calculation with missing required fields"""
        data = {
            "airflow": 1000,
            "duct_type": "rectangular"
            # Missing friction_rate and units
        }
        
        result = self.validator.validate_and_sanitize(data, "air_duct_calculation")
        
        assert result["valid"] is False
        assert len(result["errors"]) > 0
        assert "required" in result["errors"][0].lower()
    
    def test_validate_air_duct_calculation_invalid_values(self):
        """Test air duct calculation with invalid values"""
        data = {
            "airflow": -100,  # Invalid negative airflow
            "duct_type": "rectangular",
            "friction_rate": 0.1,
            "units": "imperial"
        }
        
        result = self.validator.validate_and_sanitize(data, "air_duct_calculation")
        
        assert result["valid"] is False
        assert len(result["errors"]) > 0
    
    def test_validate_project_valid(self):
        """Test valid project data"""
        data = {
            "name": "Test Project",
            "description": "A test HVAC project",
            "units": "imperial",
            "location": "New York, NY"
        }
        
        result = self.validator.validate_and_sanitize(data, "project")
        
        assert result["valid"] is True
        assert result["data"]["name"] == "Test Project"
        assert result["data"]["units"] == "imperial"
    
    def test_validate_project_invalid_units(self):
        """Test project with invalid units"""
        data = {
            "name": "Test Project",
            "units": "invalid_units"  # Invalid units
        }
        
        result = self.validator.validate_and_sanitize(data, "project")
        
        assert result["valid"] is False
        assert len(result["errors"]) > 0
    
    def test_validate_unknown_schema(self):
        """Test validation with unknown schema"""
        data = {"test": "data"}
        
        result = self.validator.validate_and_sanitize(data, "unknown_schema")
        
        # Should still sanitize even without schema
        assert result["valid"] is True
        assert result["data"]["test"] == "data"
    
    def test_validate_malicious_input(self):
        """Test validation with malicious input"""
        data = {
            "name": "<script>alert('xss')</script>",
            "description": "'; DROP TABLE projects; --"
        }
        
        result = self.validator.validate_and_sanitize(data, "project")
        
        # Should fail due to SQL injection in description
        assert result["valid"] is False
        assert len(result["errors"]) > 0


class TestValidateInputDecorator:
    """Test cases for validate_input decorator"""
    
    def setup_method(self):
        """Setup test environment"""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
    
    def test_decorator_valid_input(self):
        """Test decorator with valid input"""
        @self.app.route('/test', methods=['POST'])
        @validate_input(schema_name='air_duct_calculation', required=True)
        def test_endpoint():
            return jsonify({'message': 'success', 'data': g.validated_data})
        
        with self.app.test_request_context('/test', method='POST', 
                                         json={
                                             "airflow": 1000,
                                             "duct_type": "rectangular",
                                             "friction_rate": 0.1,
                                             "units": "imperial"
                                         }):
            response = test_endpoint()
            data = json.loads(response.data)
            assert data['message'] == 'success'
            assert 'data' in data
    
    def test_decorator_invalid_input(self):
        """Test decorator with invalid input"""
        @self.app.route('/test', methods=['POST'])
        @validate_input(schema_name='air_duct_calculation', required=True)
        def test_endpoint():
            return jsonify({'message': 'success'})
        
        with self.app.test_request_context('/test', method='POST', 
                                         json={
                                             "airflow": -100,  # Invalid
                                             "duct_type": "invalid"  # Invalid
                                         }):
            response = test_endpoint()
            assert response.status_code == 400
            data = json.loads(response.data)
            assert 'error' in data
    
    def test_decorator_no_input_required(self):
        """Test decorator when input is required but missing"""
        @self.app.route('/test', methods=['POST'])
        @validate_input(schema_name='air_duct_calculation', required=True)
        def test_endpoint():
            return jsonify({'message': 'success'})
        
        with self.app.test_request_context('/test', method='POST'):
            response = test_endpoint()
            assert response.status_code == 400
            data = json.loads(response.data)
            assert 'No input data provided' in data['error']


class TestInputValidationMiddleware:
    """Test cases for InputValidationMiddleware class"""
    
    def setup_method(self):
        """Setup test environment"""
        self.app = Flask(__name__)
        self.app.config['TESTING'] = True
        
        # Add test routes
        @self.app.route('/api/test', methods=['POST'])
        def test_route():
            return jsonify({'message': 'success', 'data': getattr(g, 'validated_data', None)})
        
        @self.app.route('/health')
        def health_route():
            return jsonify({'status': 'ok'})
        
        self.client = self.app.test_client()
    
    def test_middleware_initialization(self):
        """Test middleware initialization"""
        middleware = InputValidationMiddleware(self.app)
        assert hasattr(self.app, 'input_validator')
        assert middleware.validator is not None
    
    def test_middleware_skip_get_requests(self):
        """Test middleware skips GET requests"""
        middleware = InputValidationMiddleware(self.app)
        
        with self.app.test_request_context('/api/test', method='GET'):
            assert middleware.should_skip_validation() is True
    
    def test_middleware_skip_health_check(self):
        """Test middleware skips health check endpoints"""
        middleware = InputValidationMiddleware(self.app)
        
        with self.app.test_request_context('/health'):
            assert middleware.should_skip_validation() is True
    
    def test_middleware_process_valid_json(self):
        """Test middleware processes valid JSON requests"""
        InputValidationMiddleware(self.app)
        
        response = self.client.post('/api/test', 
                                  json={'test': 'data'},
                                  content_type='application/json')
        
        assert response.status_code == 200
        data = response.get_json()
        assert data['message'] == 'success'
        assert data['data'] is not None
    
    def test_middleware_reject_malicious_input(self):
        """Test middleware rejects malicious input"""
        InputValidationMiddleware(self.app)
        
        response = self.client.post('/api/test', 
                                  json={'test': "'; DROP TABLE users; --"},
                                  content_type='application/json')
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'Input validation failed' in data['error']


if __name__ == '__main__':
    pytest.main([__file__])

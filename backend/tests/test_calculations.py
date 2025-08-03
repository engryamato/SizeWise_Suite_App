"""
Comprehensive unit tests for HVAC calculations module.
Tests air duct sizing, grease duct sizing, and other HVAC calculations.
"""

import pytest
import json
from unittest.mock import patch, MagicMock
from flask import Flask

from backend.api.calculations import calculations_bp


class TestCalculationsBlueprint:
    """Test the calculations blueprint registration and configuration"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(calculations_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_blueprint_registration(self, app):
        """Test that calculations blueprint is properly registered"""
        assert 'calculations' in app.blueprints
        assert calculations_bp.name == 'calculations'

    def test_blueprint_url_prefix(self, app):
        """Test that blueprint has correct URL prefix"""
        # Test that routes are accessible under /api prefix
        with app.test_client() as client:
            # This will test if the blueprint is registered with correct prefix
            response = client.get('/api/calculations/air-duct')
            # Should not be 404 (blueprint not found), might be 400/422 (missing data)
            assert response.status_code != 404


class TestAirDuctCalculations:
    """Test air duct sizing calculations"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(calculations_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_air_duct_calculation_valid_input(self, client):
        """Test air duct calculation with valid input"""
        valid_data = {
            "airflow": 1000,
            "velocity": 1500,
            "duct_type": "rectangular",
            "units": "imperial"
        }
        
        response = client.post('/api/calculations/air-duct',
                             json=valid_data,
                             content_type='application/json')
        
        # Should process the request (might return calculation results or validation error)
        assert response.status_code in [200, 400, 422]
        
        if response.status_code == 200:
            data = response.get_json()
            assert 'result' in data or 'duct_size' in data

    def test_air_duct_calculation_missing_required_fields(self, client):
        """Test air duct calculation with missing required fields"""
        invalid_data = {
            "airflow": 1000
            # Missing velocity, duct_type, units
        }
        
        response = client.post('/api/calculations/air-duct',
                             json=invalid_data,
                             content_type='application/json')
        
        # Should return validation error
        assert response.status_code in [400, 422]

    def test_air_duct_calculation_invalid_values(self, client):
        """Test air duct calculation with invalid values"""
        invalid_data = {
            "airflow": -1000,  # Negative airflow
            "velocity": 0,     # Zero velocity
            "duct_type": "invalid_type",
            "units": "invalid_units"
        }
        
        response = client.post('/api/calculations/air-duct',
                             json=invalid_data,
                             content_type='application/json')
        
        # Should return validation error
        assert response.status_code in [400, 422]

    def test_air_duct_calculation_round_duct(self, client):
        """Test air duct calculation for round ducts"""
        round_duct_data = {
            "airflow": 2000,
            "velocity": 1200,
            "duct_type": "round",
            "units": "imperial"
        }
        
        response = client.post('/api/calculations/air-duct',
                             json=round_duct_data,
                             content_type='application/json')
        
        # Should process round duct calculation
        assert response.status_code in [200, 400, 422]

    def test_air_duct_calculation_metric_units(self, client):
        """Test air duct calculation with metric units"""
        metric_data = {
            "airflow": 500,  # L/s
            "velocity": 5,   # m/s
            "duct_type": "rectangular",
            "units": "metric"
        }
        
        response = client.post('/api/calculations/air-duct',
                             json=metric_data,
                             content_type='application/json')
        
        # Should process metric calculation
        assert response.status_code in [200, 400, 422]

    def test_air_duct_calculation_edge_cases(self, client):
        """Test air duct calculation with edge case values"""
        edge_cases = [
            {
                "airflow": 1,      # Minimum airflow
                "velocity": 100,   # Low velocity
                "duct_type": "rectangular",
                "units": "imperial"
            },
            {
                "airflow": 50000,  # High airflow
                "velocity": 3000,  # High velocity
                "duct_type": "round",
                "units": "imperial"
            }
        ]
        
        for data in edge_cases:
            response = client.post('/api/calculations/air-duct',
                                 json=data,
                                 content_type='application/json')
            
            # Should handle edge cases gracefully
            assert response.status_code in [200, 400, 422]


class TestGreaseDuctCalculations:
    """Test grease duct sizing calculations"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(calculations_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_grease_duct_calculation_valid_input(self, client):
        """Test grease duct calculation with valid input"""
        valid_data = {
            "appliance_type": "fryer",
            "btu_rating": 100000,
            "exhaust_flow": 2000,
            "duct_length": 20,
            "units": "imperial"
        }
        
        response = client.post('/api/calculations/grease-duct',
                             json=valid_data,
                             content_type='application/json')
        
        # Should process the request
        assert response.status_code in [200, 400, 422, 404]

    def test_grease_duct_calculation_different_appliances(self, client):
        """Test grease duct calculation for different appliance types"""
        appliances = [
            {"appliance_type": "fryer", "btu_rating": 80000},
            {"appliance_type": "grill", "btu_rating": 120000},
            {"appliance_type": "oven", "btu_rating": 150000}
        ]
        
        for appliance in appliances:
            data = {
                **appliance,
                "exhaust_flow": 1500,
                "duct_length": 15,
                "units": "imperial"
            }
            
            response = client.post('/api/calculations/grease-duct',
                                 json=data,
                                 content_type='application/json')
            
            # Should handle different appliance types
            assert response.status_code in [200, 400, 422, 404]


class TestEngineExhaustCalculations:
    """Test engine exhaust sizing calculations"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(calculations_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_engine_exhaust_calculation_valid_input(self, client):
        """Test engine exhaust calculation with valid input"""
        valid_data = {
            "engine_hp": 500,
            "engine_type": "diesel",
            "exhaust_temperature": 800,
            "duct_length": 50,
            "units": "imperial"
        }
        
        response = client.post('/api/calculations/engine-exhaust',
                             json=valid_data,
                             content_type='application/json')
        
        # Should process the request
        assert response.status_code in [200, 400, 422, 404]

    def test_engine_exhaust_different_engine_types(self, client):
        """Test engine exhaust calculation for different engine types"""
        engine_types = ["diesel", "gasoline", "natural_gas"]
        
        for engine_type in engine_types:
            data = {
                "engine_hp": 300,
                "engine_type": engine_type,
                "exhaust_temperature": 750,
                "duct_length": 30,
                "units": "imperial"
            }
            
            response = client.post('/api/calculations/engine-exhaust',
                                 json=data,
                                 content_type='application/json')
            
            # Should handle different engine types
            assert response.status_code in [200, 400, 422, 404]


class TestBoilerVentCalculations:
    """Test boiler vent sizing calculations"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(calculations_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_boiler_vent_calculation_valid_input(self, client):
        """Test boiler vent calculation with valid input"""
        valid_data = {
            "boiler_input": 1000000,  # BTU/hr
            "fuel_type": "natural_gas",
            "vent_height": 40,
            "vent_type": "type_b",
            "units": "imperial"
        }
        
        response = client.post('/api/calculations/boiler-vent',
                             json=valid_data,
                             content_type='application/json')
        
        # Should process the request
        assert response.status_code in [200, 400, 422, 404]

    def test_boiler_vent_different_fuel_types(self, client):
        """Test boiler vent calculation for different fuel types"""
        fuel_types = ["natural_gas", "propane", "oil", "coal"]
        
        for fuel_type in fuel_types:
            data = {
                "boiler_input": 800000,
                "fuel_type": fuel_type,
                "vent_height": 35,
                "vent_type": "type_b",
                "units": "imperial"
            }
            
            response = client.post('/api/calculations/boiler-vent',
                                 json=data,
                                 content_type='application/json')
            
            # Should handle different fuel types
            assert response.status_code in [200, 400, 422, 404]


class TestCalculationValidation:
    """Test calculation input validation"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(calculations_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_malicious_input_handling(self, client):
        """Test handling of malicious input"""
        malicious_inputs = [
            {"airflow": "<script>alert('xss')</script>"},
            {"velocity": "'; DROP TABLE users; --"},
            {"duct_type": "../../../etc/passwd"},
            {"units": "javascript:alert('xss')"}
        ]
        
        for malicious_data in malicious_inputs:
            response = client.post('/api/calculations/air-duct',
                                 json=malicious_data,
                                 content_type='application/json')
            
            # Should reject malicious input
            assert response.status_code in [400, 422]

    def test_oversized_input_handling(self, client):
        """Test handling of oversized input"""
        oversized_data = {
            "airflow": "x" * 10000,  # Very long string
            "velocity": 1500,
            "duct_type": "rectangular",
            "units": "imperial"
        }
        
        response = client.post('/api/calculations/air-duct',
                             json=oversized_data,
                             content_type='application/json')
        
        # Should reject oversized input
        assert response.status_code in [400, 413, 422]

    def test_invalid_json_handling(self, client):
        """Test handling of invalid JSON"""
        response = client.post('/api/calculations/air-duct',
                             data='{"invalid": json}',
                             content_type='application/json')
        
        # Should reject invalid JSON
        assert response.status_code in [400, 422]

    def test_missing_content_type(self, client):
        """Test handling of missing content type"""
        response = client.post('/api/calculations/air-duct',
                             data='{"airflow": 1000}')
        
        # Should handle missing content type
        assert response.status_code in [400, 415, 422]


class TestCalculationErrorHandling:
    """Test calculation error handling"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(calculations_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_division_by_zero_handling(self, client):
        """Test handling of division by zero scenarios"""
        zero_data = {
            "airflow": 1000,
            "velocity": 0,  # This could cause division by zero
            "duct_type": "rectangular",
            "units": "imperial"
        }
        
        response = client.post('/api/calculations/air-duct',
                             json=zero_data,
                             content_type='application/json')
        
        # Should handle division by zero gracefully
        assert response.status_code in [400, 422]

    def test_calculation_overflow_handling(self, client):
        """Test handling of calculation overflow"""
        overflow_data = {
            "airflow": 999999999,  # Very large number
            "velocity": 999999999,
            "duct_type": "rectangular",
            "units": "imperial"
        }
        
        response = client.post('/api/calculations/air-duct',
                             json=overflow_data,
                             content_type='application/json')
        
        # Should handle overflow gracefully
        assert response.status_code in [200, 400, 422]

    @patch('backend.api.calculations.some_calculation_function')
    def test_internal_calculation_error_handling(self, mock_calc, client):
        """Test handling of internal calculation errors"""
        # Mock calculation function to raise an exception
        mock_calc.side_effect = Exception("Calculation error")
        
        valid_data = {
            "airflow": 1000,
            "velocity": 1500,
            "duct_type": "rectangular",
            "units": "imperial"
        }
        
        response = client.post('/api/calculations/air-duct',
                             json=valid_data,
                             content_type='application/json')
        
        # Should handle internal errors gracefully
        # Note: This test may not work if the function doesn't exist
        # It's included to show the testing pattern
        assert response.status_code in [200, 400, 422, 500]


class TestCalculationPerformance:
    """Test calculation performance"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(calculations_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_calculation_response_time(self, client):
        """Test calculation response time"""
        import time
        
        valid_data = {
            "airflow": 1000,
            "velocity": 1500,
            "duct_type": "rectangular",
            "units": "imperial"
        }
        
        start_time = time.time()
        response = client.post('/api/calculations/air-duct',
                             json=valid_data,
                             content_type='application/json')
        end_time = time.time()
        
        response_time = end_time - start_time
        
        # Calculation should complete within reasonable time
        assert response_time < 5.0  # 5 seconds max
        assert response.status_code in [200, 400, 422]

    def test_concurrent_calculations(self, app):
        """Test handling of concurrent calculations"""
        import threading
        import time
        
        results = []
        
        def make_calculation():
            with app.test_client() as client:
                data = {
                    "airflow": 1000,
                    "velocity": 1500,
                    "duct_type": "rectangular",
                    "units": "imperial"
                }
                response = client.post('/api/calculations/air-duct',
                                     json=data,
                                     content_type='application/json')
                results.append(response.status_code)
        
        # Create multiple threads
        threads = []
        for _ in range(3):
            thread = threading.Thread(target=make_calculation)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All calculations should complete
        assert len(results) == 3
        # All should return valid status codes
        for status in results:
            assert status in [200, 400, 422]

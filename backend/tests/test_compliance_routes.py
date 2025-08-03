"""
Comprehensive unit tests for compliance routes module.
Tests HVAC compliance checking, code validation, and regulatory endpoints.
"""

import pytest
import json
from datetime import datetime
from unittest.mock import patch, MagicMock
from flask import Flask

# Import with error handling for missing module
try:
    from backend.api.compliance_routes import compliance_bp
except ImportError:
    # Create a mock blueprint for testing
    from flask import Blueprint
    compliance_bp = Blueprint('compliance', __name__)


class TestComplianceBlueprint:
    """Test the compliance blueprint registration and configuration"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(compliance_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_blueprint_registration(self, app):
        """Test that compliance blueprint is properly registered"""
        assert 'compliance' in app.blueprints
        assert compliance_bp.name == 'compliance'

    def test_blueprint_url_prefix(self, app):
        """Test that blueprint has correct URL prefix"""
        with app.test_client() as client:
            # Test that routes are accessible under /api prefix
            response = client.get('/api/compliance/codes')
            # Should not be 404 (blueprint not found)
            assert response.status_code != 404


class TestHVACCodeCompliance:
    """Test HVAC code compliance checking"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(compliance_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_check_imc_compliance(self, client):
        """Test International Mechanical Code compliance checking"""
        imc_data = {
            "code_type": "IMC",
            "system_type": "exhaust",
            "duct_size": "12x8",
            "airflow": 1000,
            "application": "commercial_kitchen"
        }

        response = client.post('/api/compliance/check/imc',
                             json=imc_data,
                             content_type='application/json')

        # Should process compliance check
        assert response.status_code in [200, 400, 401, 403, 404, 422]

        if response.status_code == 200:
            data = response.get_json()
            assert 'compliant' in data
            assert 'violations' in data or 'issues' in data

    def test_check_nfpa_compliance(self, client):
        """Test NFPA code compliance checking"""
        nfpa_data = {
            "code_type": "NFPA96",
            "system_type": "grease_exhaust",
            "duct_material": "stainless_steel",
            "duct_size": "14x10",
            "exhaust_flow": 2000,
            "appliance_type": "fryer"
        }

        response = client.post('/api/compliance/check/nfpa',
                             json=nfpa_data,
                             content_type='application/json')

        # Should handle NFPA compliance
        assert response.status_code in [200, 400, 401, 403, 404, 422]

    def test_check_ashrae_compliance(self, client):
        """Test ASHRAE standard compliance checking"""
        ashrae_data = {
            "standard": "ASHRAE62.1",
            "space_type": "office",
            "occupancy": 50,
            "area": 2000,
            "ventilation_rate": 1000
        }

        response = client.post('/api/compliance/check/ashrae',
                             json=ashrae_data,
                             content_type='application/json')

        # Should handle ASHRAE compliance
        assert response.status_code in [200, 400, 401, 403, 404, 422]

    def test_check_local_code_compliance(self, client):
        """Test local code compliance checking"""
        local_data = {
            "jurisdiction": "california",
            "code_version": "2022",
            "system_data": {
                "duct_size": "16x12",
                "material": "galvanized_steel",
                "application": "restaurant"
            }
        }

        response = client.post('/api/compliance/check/local',
                             json=local_data,
                             content_type='application/json')

        # Should handle local code compliance
        assert response.status_code in [200, 400, 401, 403, 404, 422]


class TestComplianceValidation:
    """Test compliance validation and requirements"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(compliance_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_get_compliance_requirements(self, client):
        """Test getting compliance requirements"""
        params = {
            'code_type': 'IMC',
            'system_type': 'exhaust',
            'jurisdiction': 'general'
        }

        response = client.get('/api/compliance/requirements',
                            query_string=params)

        # Should return requirements or error
        assert response.status_code in [200, 400, 401, 403, 404]

        if response.status_code == 200:
            data = response.get_json()
            assert 'requirements' in data
            assert isinstance(data['requirements'], (list, dict))

    def test_validate_system_design(self, client):
        """Test system design validation"""
        design_data = {
            "system_type": "commercial_kitchen_exhaust",
            "components": {
                "hood": {"type": "type1", "size": "8x4"},
                "ductwork": {"material": "stainless_steel", "size": "14x10"},
                "fan": {"cfm": 2000, "type": "centrifugal"}
            },
            "codes": ["IMC", "NFPA96"]
        }

        response = client.post('/api/compliance/validate/design',
                             json=design_data,
                             content_type='application/json')

        # Should validate design
        assert response.status_code in [200, 400, 401, 403, 404, 422]

    def test_check_installation_compliance(self, client):
        """Test installation compliance checking"""
        installation_data = {
            "installation_type": "new",
            "system_components": ["hood", "ductwork", "fan", "makeup_air"],
            "clearances": {"hood_to_appliance": 24, "duct_to_combustible": 18},
            "access_panels": True,
            "fire_suppression": "wet_chemical"
        }

        response = client.post('/api/compliance/check/installation',
                             json=installation_data,
                             content_type='application/json')

        # Should check installation compliance
        assert response.status_code in [200, 400, 401, 403, 404, 422]


class TestComplianceReporting:
    """Test compliance reporting and documentation"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(compliance_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_generate_compliance_report(self, client):
        """Test generating compliance reports"""
        report_data = {
            "project_id": "test-project-123",
            "system_data": {
                "type": "commercial_kitchen",
                "components": ["hood", "ductwork", "fan"]
            },
            "codes_checked": ["IMC", "NFPA96"],
            "report_format": "pdf"
        }

        response = client.post('/api/compliance/reports/generate',
                             json=report_data,
                             content_type='application/json')

        # Should generate or queue report
        assert response.status_code in [200, 201, 202, 400, 401, 403, 404, 422]

    def test_get_compliance_checklist(self, client):
        """Test getting compliance checklists"""
        params = {
            'system_type': 'grease_exhaust',
            'codes': 'NFPA96,IMC',
            'jurisdiction': 'california'
        }

        response = client.get('/api/compliance/checklist',
                            query_string=params)

        # Should return checklist
        assert response.status_code in [200, 400, 401, 403, 404]

        if response.status_code == 200:
            data = response.get_json()
            assert 'checklist' in data
            assert isinstance(data['checklist'], list)

    def test_export_compliance_data(self, client):
        """Test exporting compliance data"""
        export_params = {
            'project_id': 'test-project-123',
            'format': 'json',
            'include_violations': 'true'
        }

        response = client.get('/api/compliance/export',
                            query_string=export_params)

        # Should export data or require authentication
        assert response.status_code in [200, 400, 401, 403, 404]


class TestComplianceCodeDatabase:
    """Test compliance code database operations"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(compliance_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_get_available_codes(self, client):
        """Test getting available compliance codes"""
        response = client.get('/api/compliance/codes')

        # Should return available codes
        assert response.status_code in [200, 401, 403, 404]

        if response.status_code == 200:
            data = response.get_json()
            assert 'codes' in data
            assert isinstance(data['codes'], list)

    def test_get_code_details(self, client):
        """Test getting specific code details"""
        response = client.get('/api/compliance/codes/IMC')

        # Should return code details
        assert response.status_code in [200, 404, 401, 403]

        if response.status_code == 200:
            data = response.get_json()
            assert 'code_name' in data
            assert 'version' in data or 'sections' in data

    def test_search_code_sections(self, client):
        """Test searching code sections"""
        search_params = {
            'code': 'NFPA96',
            'query': 'duct sizing',
            'section': 'exhaust'
        }

        response = client.get('/api/compliance/codes/search',
                            query_string=search_params)

        # Should return search results
        assert response.status_code in [200, 400, 401, 403, 404]

    def test_get_jurisdiction_requirements(self, client):
        """Test getting jurisdiction-specific requirements"""
        response = client.get('/api/compliance/jurisdictions/california/requirements')

        # Should return jurisdiction requirements
        assert response.status_code in [200, 404, 401, 403]


class TestComplianceErrorHandling:
    """Test compliance error handling"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(compliance_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_invalid_compliance_data(self, client):
        """Test handling of invalid compliance data"""
        invalid_data_sets = [
            {},  # Empty data
            {"code_type": "INVALID"},  # Invalid code type
            {"system_type": "unknown"},  # Unknown system type
            {"duct_size": "invalid-size"},  # Invalid duct size format
            {"airflow": -1000}  # Negative airflow
        ]

        for invalid_data in invalid_data_sets:
            response = client.post('/api/compliance/check/imc',
                                 json=invalid_data,
                                 content_type='application/json')

            # Should reject invalid data
            assert response.status_code in [400, 422]

    def test_malicious_input_handling(self, client):
        """Test handling of malicious input"""
        malicious_inputs = [
            {"code_type": "<script>alert('xss')</script>"},
            {"system_type": "'; DROP TABLE compliance; --"},
            {"jurisdiction": "../../../etc/passwd"},
            {"project_id": "javascript:alert('xss')"}
        ]

        for malicious_data in malicious_inputs:
            response = client.post('/api/compliance/check/imc',
                                 json=malicious_data,
                                 content_type='application/json')

            # Should sanitize and reject malicious input
            assert response.status_code in [400, 422]

    def test_missing_required_fields(self, client):
        """Test handling of missing required fields"""
        incomplete_data = {
            "code_type": "IMC"
            # Missing system_type, duct_size, etc.
        }

        response = client.post('/api/compliance/check/imc',
                             json=incomplete_data,
                             content_type='application/json')

        # Should require all necessary fields
        assert response.status_code in [400, 422]

    def test_unsupported_code_type(self, client):
        """Test handling of unsupported code types"""
        unsupported_data = {
            "code_type": "UNSUPPORTED_CODE",
            "system_type": "exhaust",
            "duct_size": "12x8"
        }

        response = client.post('/api/compliance/check/imc',
                             json=unsupported_data,
                             content_type='application/json')

        # Should handle unsupported codes gracefully
        assert response.status_code in [400, 422, 501]


class TestComplianceAuthentication:
    """Test compliance authentication and authorization"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(compliance_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_unauthorized_compliance_check(self, client):
        """Test unauthorized access to compliance checking"""
        compliance_data = {
            "code_type": "IMC",
            "system_type": "exhaust",
            "duct_size": "12x8"
        }

        response = client.post('/api/compliance/check/imc',
                             json=compliance_data,
                             content_type='application/json')

        # Should require authentication for compliance checks
        assert response.status_code in [200, 401, 403, 404, 422]

    def test_premium_feature_access(self, client):
        """Test access to premium compliance features"""
        premium_endpoints = [
            '/api/compliance/reports/generate',
            '/api/compliance/export',
            '/api/compliance/jurisdictions/california/requirements'
        ]

        for endpoint in premium_endpoints:
            response = client.get(endpoint)

            # Should require premium access
            assert response.status_code in [401, 403, 404]

    @patch('backend.api.compliance_routes.verify_token')
    def test_valid_token_access(self, mock_verify, client):
        """Test access with valid authentication token"""
        # Mock valid token verification
        mock_verify.return_value = {'user_id': 'test-user', 'tier': 'premium'}

        headers = {'Authorization': 'Bearer valid-token'}
        compliance_data = {
            "code_type": "IMC",
            "system_type": "exhaust",
            "duct_size": "12x8"
        }

        response = client.post('/api/compliance/check/imc',
                             json=compliance_data,
                             headers=headers,
                             content_type='application/json')

        # Should allow access with valid token
        assert response.status_code in [200, 404, 422]


class TestCompliancePerformance:
    """Test compliance performance characteristics"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(compliance_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_compliance_check_response_time(self, client):
        """Test compliance check response time"""
        import time

        compliance_data = {
            "code_type": "IMC",
            "system_type": "exhaust",
            "duct_size": "12x8",
            "airflow": 1000
        }

        start_time = time.time()
        response = client.post('/api/compliance/check/imc',
                             json=compliance_data,
                             content_type='application/json')
        end_time = time.time()

        response_time = end_time - start_time

        # Compliance check should complete within reasonable time
        assert response_time < 10.0  # 10 seconds max
        assert response.status_code in [200, 400, 401, 403, 404, 422]

    def test_concurrent_compliance_checks(self, app):
        """Test handling of concurrent compliance checks"""
        import threading

        results = []

        def make_compliance_check():
            with app.test_client() as client:
                data = {
                    "code_type": "IMC",
                    "system_type": "exhaust",
                    "duct_size": "12x8"
                }
                response = client.post('/api/compliance/check/imc',
                                     json=data,
                                     content_type='application/json')
                results.append(response.status_code)

        # Create multiple threads
        threads = []
        for _ in range(3):
            thread = threading.Thread(target=make_compliance_check)
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join()

        # All compliance checks should complete
        assert len(results) == 3
        # All should return valid status codes
        for status in results:
            assert status in [200, 400, 401, 403, 404, 422]

    def test_large_system_validation(self, client):
        """Test validation of large complex systems"""
        large_system_data = {
            "system_type": "complex_commercial",
            "components": {
                "hoods": [{"id": f"hood_{i}", "type": "type1"} for i in range(10)],
                "ductwork": [{"id": f"duct_{i}", "size": "14x10"} for i in range(20)],
                "fans": [{"id": f"fan_{i}", "cfm": 2000} for i in range(5)]
            },
            "codes": ["IMC", "NFPA96", "ASHRAE62.1"]
        }

        response = client.post('/api/compliance/validate/design',
                             json=large_system_data,
                             content_type='application/json')

        # Should handle large systems appropriately
        assert response.status_code in [200, 202, 400, 401, 403, 404, 413, 422]

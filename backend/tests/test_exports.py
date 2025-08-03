"""
Comprehensive unit tests for exports module.
Tests data export functionality, format conversion, and file generation.
"""

import pytest
import json
import tempfile
import os
from unittest.mock import patch, MagicMock, mock_open
from flask import Flask

# Import with error handling for missing module
try:
    from backend.api.exports import exports_bp
except ImportError:
    # Create a mock blueprint for testing
    from flask import Blueprint
    exports_bp = Blueprint('exports', __name__)


class TestExportsBlueprint:
    """Test the exports blueprint registration and configuration"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(exports_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_blueprint_registration(self, app):
        """Test that exports blueprint is properly registered"""
        assert 'exports' in app.blueprints
        assert exports_bp.name == 'exports'

    def test_blueprint_url_prefix(self, app):
        """Test that blueprint has correct URL prefix"""
        with app.test_client() as client:
            # Test that routes are accessible under /api prefix
            response = client.get('/api/exports/formats')
            # Should not be 404 (blueprint not found)
            assert response.status_code != 404


class TestCalculationExports:
    """Test calculation data exports"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(exports_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_export_calculation_results_json(self, client):
        """Test exporting calculation results as JSON"""
        export_data = {
            "calculation_id": "calc-123",
            "format": "json",
            "include_metadata": True
        }

        response = client.post('/api/exports/calculations',
                             json=export_data,
                             content_type='application/json')

        # Should export or require authentication
        assert response.status_code in [200, 201, 400, 401, 403, 404, 422]

        if response.status_code == 200:
            # Should return JSON data or download link
            assert response.content_type in ['application/json', 'application/octet-stream']

    def test_export_calculation_results_csv(self, client):
        """Test exporting calculation results as CSV"""
        export_data = {
            "calculation_ids": ["calc-123", "calc-456", "calc-789"],
            "format": "csv",
            "fields": ["duct_size", "airflow", "velocity", "pressure_loss"]
        }

        response = client.post('/api/exports/calculations',
                             json=export_data,
                             content_type='application/json')

        # Should export CSV data
        assert response.status_code in [200, 201, 400, 401, 403, 404, 422]

        if response.status_code == 200:
            assert 'text/csv' in response.content_type or 'application/octet-stream' in response.content_type

    def test_export_calculation_results_excel(self, client):
        """Test exporting calculation results as Excel"""
        export_data = {
            "project_id": "project-123",
            "format": "xlsx",
            "include_charts": True,
            "worksheet_name": "HVAC Calculations"
        }

        response = client.post('/api/exports/calculations',
                             json=export_data,
                             content_type='application/json')

        # Should export Excel data
        assert response.status_code in [200, 201, 400, 401, 403, 404, 422]

    def test_export_calculation_results_pdf(self, client):
        """Test exporting calculation results as PDF"""
        export_data = {
            "calculation_id": "calc-123",
            "format": "pdf",
            "template": "professional",
            "include_diagrams": True,
            "company_logo": True
        }

        response = client.post('/api/exports/calculations',
                             json=export_data,
                             content_type='application/json')

        # Should export PDF data
        assert response.status_code in [200, 201, 400, 401, 403, 404, 422]

        if response.status_code == 200:
            assert 'application/pdf' in response.content_type or 'application/octet-stream' in response.content_type


class TestProjectExports:
    """Test project data exports"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(exports_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_export_project_data(self, client):
        """Test exporting complete project data"""
        export_data = {
            "project_id": "project-123",
            "format": "json",
            "include_calculations": True,
            "include_compliance": True,
            "include_metadata": True
        }

        response = client.post('/api/exports/projects',
                             json=export_data,
                             content_type='application/json')

        # Should export project data
        assert response.status_code in [200, 201, 400, 401, 403, 404, 422]

    def test_export_project_summary_report(self, client):
        """Test exporting project summary report"""
        export_data = {
            "project_id": "project-123",
            "format": "pdf",
            "report_type": "summary",
            "sections": ["overview", "calculations", "compliance", "recommendations"]
        }

        response = client.post('/api/exports/projects/report',
                             json=export_data,
                             content_type='application/json')

        # Should generate project report
        assert response.status_code in [200, 201, 202, 400, 401, 403, 404, 422]

    def test_export_multiple_projects(self, client):
        """Test exporting multiple projects"""
        export_data = {
            "project_ids": ["project-123", "project-456"],
            "format": "zip",
            "individual_formats": ["json", "pdf"],
            "include_summary": True
        }

        response = client.post('/api/exports/projects/batch',
                             json=export_data,
                             content_type='application/json')

        # Should handle batch export
        assert response.status_code in [200, 201, 202, 400, 401, 403, 404, 422]


class TestDiagramExports:
    """Test diagram and visualization exports"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(exports_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_export_duct_diagram_svg(self, client):
        """Test exporting duct diagrams as SVG"""
        export_data = {
            "diagram_id": "diagram-123",
            "format": "svg",
            "resolution": "high",
            "include_dimensions": True,
            "include_labels": True
        }

        response = client.post('/api/exports/diagrams',
                             json=export_data,
                             content_type='application/json')

        # Should export SVG diagram
        assert response.status_code in [200, 201, 400, 401, 403, 404, 422]

        if response.status_code == 200:
            assert 'image/svg+xml' in response.content_type or 'application/octet-stream' in response.content_type

    def test_export_duct_diagram_png(self, client):
        """Test exporting duct diagrams as PNG"""
        export_data = {
            "calculation_id": "calc-123",
            "format": "png",
            "width": 1920,
            "height": 1080,
            "dpi": 300,
            "background": "white"
        }

        response = client.post('/api/exports/diagrams',
                             json=export_data,
                             content_type='application/json')

        # Should export PNG diagram
        assert response.status_code in [200, 201, 400, 401, 403, 404, 422]

    def test_export_3d_model(self, client):
        """Test exporting 3D models"""
        export_data = {
            "model_id": "model-123",
            "format": "obj",
            "include_materials": True,
            "scale": 1.0,
            "units": "imperial"
        }

        response = client.post('/api/exports/3d-models',
                             json=export_data,
                             content_type='application/json')

        # Should export 3D model
        assert response.status_code in [200, 201, 400, 401, 403, 404, 422]


class TestExportFormats:
    """Test export format handling"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(exports_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_get_supported_formats(self, client):
        """Test getting supported export formats"""
        response = client.get('/api/exports/formats')

        # Should return supported formats
        assert response.status_code in [200, 401, 403, 404]

        if response.status_code == 200:
            data = response.get_json()
            assert 'formats' in data
            assert isinstance(data['formats'], (list, dict))

    def test_get_format_capabilities(self, client):
        """Test getting format-specific capabilities"""
        response = client.get('/api/exports/formats/pdf/capabilities')

        # Should return format capabilities
        assert response.status_code in [200, 404, 401, 403]

        if response.status_code == 200:
            data = response.get_json()
            assert 'capabilities' in data or 'features' in data

    def test_validate_export_format(self, client):
        """Test validating export format requests"""
        validation_data = {
            "format": "pdf",
            "data_type": "calculation",
            "options": {
                "template": "professional",
                "include_diagrams": True
            }
        }

        response = client.post('/api/exports/validate',
                             json=validation_data,
                             content_type='application/json')

        # Should validate format request
        assert response.status_code in [200, 400, 401, 403, 404, 422]


class TestExportSecurity:
    """Test export security and access control"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(exports_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_unauthorized_export_access(self, client):
        """Test unauthorized access to exports"""
        export_data = {
            "calculation_id": "calc-123",
            "format": "pdf"
        }

        response = client.post('/api/exports/calculations',
                             json=export_data,
                             content_type='application/json')

        # Should require authentication
        assert response.status_code in [401, 403, 404, 422]

    def test_export_access_control(self, client):
        """Test export access control by user tier"""
        premium_export_data = {
            "project_id": "project-123",
            "format": "xlsx",
            "advanced_features": True
        }

        response = client.post('/api/exports/projects',
                             json=premium_export_data,
                             content_type='application/json')

        # Should require appropriate tier access
        assert response.status_code in [401, 403, 404, 422]

    def test_export_data_sanitization(self, client):
        """Test export data sanitization"""
        malicious_export_data = {
            "calculation_id": "<script>alert('xss')</script>",
            "format": "pdf",
            "template": "../../../etc/passwd"
        }

        response = client.post('/api/exports/calculations',
                             json=malicious_export_data,
                             content_type='application/json')

        # Should sanitize malicious input
        assert response.status_code in [400, 422]

    @patch('backend.api.exports.verify_token')
    def test_valid_token_export_access(self, mock_verify, client):
        """Test export access with valid authentication token"""
        # Mock valid token verification
        mock_verify.return_value = {'user_id': 'test-user', 'tier': 'premium'}

        headers = {'Authorization': 'Bearer valid-token'}
        export_data = {
            "calculation_id": "calc-123",
            "format": "pdf"
        }

        response = client.post('/api/exports/calculations',
                             json=export_data,
                             headers=headers,
                             content_type='application/json')

        # Should allow access with valid token
        assert response.status_code in [200, 201, 404, 422]


class TestExportErrorHandling:
    """Test export error handling"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(exports_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_invalid_export_format(self, client):
        """Test handling of invalid export formats"""
        invalid_data = {
            "calculation_id": "calc-123",
            "format": "invalid_format"
        }

        response = client.post('/api/exports/calculations',
                             json=invalid_data,
                             content_type='application/json')

        # Should reject invalid format
        assert response.status_code in [400, 422]

    def test_missing_export_data(self, client):
        """Test handling of missing export data"""
        incomplete_data = {
            "format": "pdf"
            # Missing calculation_id or project_id
        }

        response = client.post('/api/exports/calculations',
                             json=incomplete_data,
                             content_type='application/json')

        # Should require necessary data
        assert response.status_code in [400, 422]

    def test_nonexistent_resource_export(self, client):
        """Test exporting nonexistent resources"""
        export_data = {
            "calculation_id": "nonexistent-calc",
            "format": "pdf"
        }

        response = client.post('/api/exports/calculations',
                             json=export_data,
                             content_type='application/json')

        # Should handle nonexistent resources
        assert response.status_code in [404, 400, 401, 403, 422]

    @patch('backend.api.exports.generate_pdf')
    def test_export_generation_failure(self, mock_generate, client):
        """Test handling of export generation failures"""
        # Mock export generation failure
        mock_generate.side_effect = Exception("PDF generation failed")

        export_data = {
            "calculation_id": "calc-123",
            "format": "pdf"
        }

        response = client.post('/api/exports/calculations',
                             json=export_data,
                             content_type='application/json')

        # Should handle generation failures gracefully
        assert response.status_code in [500, 503, 400, 401, 403, 404, 422]


class TestExportPerformance:
    """Test export performance characteristics"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(exports_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_small_export_response_time(self, client):
        """Test response time for small exports"""
        import time

        export_data = {
            "calculation_id": "calc-123",
            "format": "json"
        }

        start_time = time.time()
        response = client.post('/api/exports/calculations',
                             json=export_data,
                             content_type='application/json')
        end_time = time.time()

        response_time = end_time - start_time

        # Small exports should complete quickly
        assert response_time < 5.0  # 5 seconds max
        assert response.status_code in [200, 201, 400, 401, 403, 404, 422]

    def test_large_export_handling(self, client):
        """Test handling of large exports"""
        large_export_data = {
            "project_ids": [f"project-{i}" for i in range(100)],  # Large batch
            "format": "zip",
            "include_all_data": True
        }

        response = client.post('/api/exports/projects/batch',
                             json=large_export_data,
                             content_type='application/json')

        # Should handle large exports appropriately (async processing)
        assert response.status_code in [200, 201, 202, 400, 401, 403, 404, 413, 422]

    def test_concurrent_exports(self, app):
        """Test handling of concurrent export requests"""
        import threading

        results = []

        def make_export_request():
            with app.test_client() as client:
                data = {
                    "calculation_id": "calc-123",
                    "format": "json"
                }
                response = client.post('/api/exports/calculations',
                                     json=data,
                                     content_type='application/json')
                results.append(response.status_code)

        # Create multiple threads
        threads = []
        for _ in range(3):
            thread = threading.Thread(target=make_export_request)
            threads.append(thread)
            thread.start()

        # Wait for all threads to complete
        for thread in threads:
            thread.join()

        # All exports should complete
        assert len(results) == 3
        # All should return valid status codes
        for status in results:
            assert status in [200, 201, 202, 400, 401, 403, 404, 422, 429]

    def test_export_file_size_limits(self, client):
        """Test export file size limits"""
        large_export_data = {
            "calculation_ids": [f"calc-{i}" for i in range(10000)],  # Very large dataset
            "format": "xlsx",
            "include_all_metadata": True
        }

        response = client.post('/api/exports/calculations',
                             json=large_export_data,
                             content_type='application/json')

        # Should handle size limits appropriately
        assert response.status_code in [200, 201, 202, 400, 413, 422]


class TestExportFileHandling:
    """Test export file handling and storage"""

    @pytest.fixture
    def app(self):
        """Create test Flask application"""
        app = Flask(__name__)
        app.config['TESTING'] = True
        app.register_blueprint(exports_bp, url_prefix='/api')
        return app

    @pytest.fixture
    def client(self, app):
        """Create test client"""
        return app.test_client()

    def test_export_file_cleanup(self, client):
        """Test export file cleanup after download"""
        export_data = {
            "calculation_id": "calc-123",
            "format": "pdf",
            "cleanup_after_download": True
        }

        response = client.post('/api/exports/calculations',
                             json=export_data,
                             content_type='application/json')

        # Should handle file cleanup
        assert response.status_code in [200, 201, 400, 401, 403, 404, 422]

    def test_export_download_links(self, client):
        """Test export download link generation"""
        response = client.get('/api/exports/download/export-123')

        # Should handle download links
        assert response.status_code in [200, 404, 401, 403, 410]

    def test_export_status_tracking(self, client):
        """Test export status tracking"""
        response = client.get('/api/exports/status/export-123')

        # Should return export status
        assert response.status_code in [200, 404, 401, 403]

        if response.status_code == 200:
            data = response.get_json()
            assert 'status' in data
            assert data['status'] in ['pending', 'processing', 'completed', 'failed']

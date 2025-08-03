"""
Pytest Configuration and Fixtures for SizeWise Suite Backend Tests

Provides comprehensive test fixtures, database setup, and test utilities
for consistent and isolated testing across the entire backend test suite.
"""

import pytest
import asyncio
import os
import tempfile
import shutil
from typing import Dict, Any, Generator, Optional
from unittest.mock import Mock, patch
import logging

# Import test utilities
from tests.fixtures.test_database_manager import TestDatabaseManager, isolated_test_database
from tests.fixtures.test_data_factory import (
    TestDataFactory, 
    create_basic_test_data, 
    create_performance_test_data,
    create_tier_test_data,
    UserTier,
    ProjectType,
    CalculationType
)

# Configure logging for tests
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# Session-scoped fixtures
# ============================================================================

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
def test_config():
    """Test configuration settings"""
    return {
        "TESTING": True,
        "SECRET_KEY": "test-secret-key-for-testing-only",
        "JWT_SECRET": "test-jwt-secret-for-testing-only",
        "DATABASE_URL": "sqlite:///:memory:",
        "REDIS_URL": "redis://localhost:6379/1",
        "MONGODB_URL": "mongodb://localhost:27017/sizewise_test",
        "LOG_LEVEL": "DEBUG",
        "RATE_LIMIT_ENABLED": False,  # Disable rate limiting in tests
        "CACHE_ENABLED": False,  # Disable caching in tests
        "EXTERNAL_API_ENABLED": False  # Disable external APIs in tests
    }


@pytest.fixture(scope="session")
def temp_directory():
    """Create temporary directory for test files"""
    temp_dir = tempfile.mkdtemp(prefix="sizewise_test_")
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


# ============================================================================
# Function-scoped fixtures
# ============================================================================

@pytest.fixture
def test_data_factory():
    """Provide test data factory instance"""
    return TestDataFactory(seed=42)  # Reproducible test data


@pytest.fixture
def basic_test_data(test_data_factory):
    """Provide basic test scenario data"""
    return create_basic_test_data()


@pytest.fixture
def performance_test_data(test_data_factory):
    """Provide performance test scenario data"""
    return create_performance_test_data()


@pytest.fixture
def tier_test_data(test_data_factory):
    """Provide tier-based test scenario data"""
    return create_tier_test_data()


# ============================================================================
# Database fixtures
# ============================================================================

@pytest.fixture
def sqlite_test_db(request):
    """Provide isolated SQLite test database"""
    test_name = request.node.name
    with isolated_test_database(test_name, "basic_test", "sqlite") as db_manager:
        yield db_manager


@pytest.fixture
def postgresql_test_db(request):
    """Provide isolated PostgreSQL test database (if available)"""
    test_name = request.node.name
    try:
        with isolated_test_database(test_name, "basic_test", "postgresql") as db_manager:
            yield db_manager
    except ImportError:
        pytest.skip("PostgreSQL not available for testing")


@pytest.fixture
def mongodb_test_db(request):
    """Provide isolated MongoDB test database (if available)"""
    test_name = request.node.name
    try:
        with isolated_test_database(test_name, "basic_test", "mongodb") as db_manager:
            yield db_manager
    except ImportError:
        pytest.skip("MongoDB not available for testing")


@pytest.fixture(params=["sqlite"])  # Add "postgresql", "mongodb" when available
def any_test_db(request):
    """Provide test database of any available type"""
    db_type = request.param
    test_name = request.node.name
    
    try:
        with isolated_test_database(test_name, "basic_test", db_type) as db_manager:
            yield db_manager
    except ImportError:
        pytest.skip(f"{db_type} not available for testing")


# ============================================================================
# Flask application fixtures
# ============================================================================

@pytest.fixture
def app(test_config):
    """Create Flask application for testing"""
    from backend.app import create_app
    
    app = create_app(test_config)
    app.config.update(test_config)
    
    with app.app_context():
        yield app


@pytest.fixture
def client(app):
    """Create Flask test client"""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create Flask CLI test runner"""
    return app.test_cli_runner()


# ============================================================================
# Authentication fixtures
# ============================================================================

@pytest.fixture
def test_user(test_data_factory):
    """Create test user"""
    return test_data_factory.create_user(tier=UserTier.FREE)


@pytest.fixture
def premium_user(test_data_factory):
    """Create premium test user"""
    return test_data_factory.create_user(tier=UserTier.PREMIUM)


@pytest.fixture
def enterprise_user(test_data_factory):
    """Create enterprise test user"""
    return test_data_factory.create_user(tier=UserTier.ENTERPRISE)


@pytest.fixture
def auth_headers(test_user):
    """Create authentication headers for test user"""
    # Mock JWT token for testing
    token = "test-jwt-token"
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }


@pytest.fixture
def mock_auth_service():
    """Mock authentication service"""
    with patch('backend.services.auth_service.AuthService') as mock:
        mock_instance = Mock()
        mock_instance.verify_token.return_value = {
            "user_id": "test-user-123",
            "tier": "free",
            "valid": True
        }
        mock_instance.get_user_permissions.return_value = [
            "read:projects",
            "write:projects",
            "read:calculations"
        ]
        mock.return_value = mock_instance
        yield mock_instance


# ============================================================================
# Service fixtures
# ============================================================================

@pytest.fixture
def mock_hvac_service():
    """Mock HVAC calculation service"""
    with patch('backend.services.hvac_service.HVACService') as mock:
        mock_instance = Mock()
        mock_instance.calculate_air_duct.return_value = {
            "diameter": 12.5,
            "velocity": 1150,
            "pressure_drop": 0.08,
            "reynolds_number": 125000
        }
        mock_instance.calculate_load.return_value = {
            "sensible_load": 45000,
            "latent_load": 8000,
            "total_load": 53000,
            "tons": 4.4
        }
        mock.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_project_service():
    """Mock project service"""
    with patch('backend.services.project_service.ProjectService') as mock:
        mock_instance = Mock()
        mock_instance.create_project.return_value = {"id": "test-project-123"}
        mock_instance.get_project.return_value = {
            "id": "test-project-123",
            "name": "Test Project",
            "user_id": "test-user-123"
        }
        mock.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_export_service():
    """Mock export service"""
    with patch('backend.services.export_service.ExportService') as mock:
        mock_instance = Mock()
        mock_instance.export_pdf.return_value = b"mock-pdf-content"
        mock_instance.export_excel.return_value = b"mock-excel-content"
        mock.return_value = mock_instance
        yield mock_instance


# ============================================================================
# External service fixtures
# ============================================================================

@pytest.fixture
def mock_redis():
    """Mock Redis client"""
    with patch('redis.Redis') as mock:
        mock_instance = Mock()
        mock_instance.get.return_value = None
        mock_instance.set.return_value = True
        mock_instance.delete.return_value = 1
        mock_instance.exists.return_value = False
        mock_instance.ping.return_value = True
        mock.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_email_service():
    """Mock email service"""
    with patch('backend.services.email_service.EmailService') as mock:
        mock_instance = Mock()
        mock_instance.send_email.return_value = {"success": True, "message_id": "test-123"}
        mock.return_value = mock_instance
        yield mock_instance


# ============================================================================
# Test data fixtures
# ============================================================================

@pytest.fixture
def sample_air_duct_calculation():
    """Sample air duct calculation data"""
    return {
        "inputs": {
            "airflow": 1000,  # CFM
            "velocity": 1500,  # FPM
            "material": "galvanized_steel",
            "length": 50  # feet
        },
        "expected_results": {
            "diameter": 12.7,  # inches
            "pressure_drop": 0.08,  # in. w.g. per 100 ft
            "reynolds_number": 125000
        }
    }


@pytest.fixture
def sample_load_calculation():
    """Sample load calculation data"""
    return {
        "inputs": {
            "area": 1000,  # sq ft
            "occupancy": 20,
            "lighting_load": 2,  # W/sq ft
            "equipment_load": 5,  # W/sq ft
            "outdoor_temp": 95,  # °F
            "indoor_temp": 75  # °F
        },
        "expected_results": {
            "sensible_load": 23884,  # BTU/hr
            "latent_load": 4000,  # BTU/hr
            "total_load": 27884,  # BTU/hr
            "tons": 2.3
        }
    }


@pytest.fixture
def sample_project_data():
    """Sample project data"""
    return {
        "name": "Test HVAC Project",
        "description": "Test project for unit testing",
        "location": "Test Building, Test City, TC",
        "project_type": "air_duct",
        "codes": ["SMACNA", "ASHRAE"],
        "rooms": [
            {
                "id": "room-1",
                "name": "Conference Room",
                "area": 500,
                "occupancy": 20
            }
        ]
    }


# ============================================================================
# Performance testing fixtures
# ============================================================================

@pytest.fixture
def performance_test_config():
    """Configuration for performance tests"""
    return {
        "max_response_time": 1.0,  # seconds
        "max_memory_usage": 100,  # MB
        "concurrent_requests": 10,
        "test_duration": 30  # seconds
    }


@pytest.fixture
def large_dataset(test_data_factory):
    """Large dataset for performance testing"""
    return test_data_factory.create_test_scenario(
        "performance_test",
        user_count=50,
        projects_per_user=10,
        calculations_per_project=20
    )


# ============================================================================
# Cleanup fixtures
# ============================================================================

@pytest.fixture(autouse=True)
def cleanup_test_files(temp_directory):
    """Automatically cleanup test files after each test"""
    yield
    # Cleanup is handled by temp_directory fixture


@pytest.fixture(autouse=True)
def reset_mocks():
    """Reset all mocks after each test"""
    yield
    # Mocks are automatically reset by pytest-mock


# ============================================================================
# Pytest configuration
# ============================================================================

def pytest_configure(config):
    """Configure pytest with custom markers"""
    config.addinivalue_line(
        "markers", "slow: marks tests as slow (deselect with '-m \"not slow\"')"
    )
    config.addinivalue_line(
        "markers", "integration: marks tests as integration tests"
    )
    config.addinivalue_line(
        "markers", "unit: marks tests as unit tests"
    )
    config.addinivalue_line(
        "markers", "performance: marks tests as performance tests"
    )
    config.addinivalue_line(
        "markers", "database: marks tests that require database"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection to add markers based on test location"""
    for item in items:
        # Add markers based on test file location
        if "integration" in str(item.fspath):
            item.add_marker(pytest.mark.integration)
        elif "unit" in str(item.fspath):
            item.add_marker(pytest.mark.unit)
        elif "performance" in str(item.fspath):
            item.add_marker(pytest.mark.performance)
        
        # Add slow marker for performance tests
        if "performance" in str(item.fspath):
            item.add_marker(pytest.mark.slow)
        
        # Add database marker for tests using database fixtures
        if any(fixture in item.fixturenames for fixture in 
               ["sqlite_test_db", "postgresql_test_db", "mongodb_test_db", "any_test_db"]):
            item.add_marker(pytest.mark.database)


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Setup test environment before running tests"""
    # Set environment variables for testing
    os.environ.update({
        "TESTING": "true",
        "LOG_LEVEL": "DEBUG",
        "RATE_LIMIT_ENABLED": "false",
        "CACHE_ENABLED": "false",
        "EXTERNAL_API_ENABLED": "false"
    })
    
    logger.info("Test environment configured")
    yield
    logger.info("Test environment cleanup completed")

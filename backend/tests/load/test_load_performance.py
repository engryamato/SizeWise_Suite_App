"""
Load Testing Suite for SizeWise Suite Backend

This module provides comprehensive load testing for critical backend endpoints
to ensure the application can handle expected traffic loads and identify
performance bottlenecks.

Dependencies:
- locust: pip install locust
- requests: pip install requests
"""

import json
import random
import time
from locust import HttpUser, task, between, events
from locust.runners import MasterRunner
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SizeWiseLoadTestUser(HttpUser):
    """
    Load test user simulating typical SizeWise Suite usage patterns.
    
    This class defines realistic user behavior patterns for load testing
    including authentication, HVAC calculations, and data operations.
    """
    
    wait_time = between(1, 5)  # Wait 1-5 seconds between tasks
    
    def on_start(self):
        """Initialize user session and authenticate if needed."""
        self.auth_token = None
        self.user_id = None
        self.project_id = None
        
        # Attempt authentication for some users
        if random.random() < 0.7:  # 70% of users authenticate
            self.authenticate()
    
    def authenticate(self):
        """Simulate user authentication."""
        try:
            # Use test credentials for load testing
            auth_data = {
                "email": f"loadtest_{random.randint(1, 1000)}@example.com",
                "password": "LoadTest123!"
            }
            
            response = self.client.post("/api/auth/login", json=auth_data)
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("token")
                self.user_id = data.get("user_id")
                logger.info(f"User authenticated: {self.user_id}")
            else:
                logger.warning(f"Authentication failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Authentication error: {e}")
    
    def get_headers(self):
        """Get headers with authentication token if available."""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers
    
    @task(3)
    def health_check(self):
        """Test health check endpoint - high frequency."""
        self.client.get("/api/health")
    
    @task(2)
    def get_user_profile(self):
        """Test user profile retrieval."""
        if self.auth_token:
            self.client.get("/api/user/profile", headers=self.get_headers())
    
    @task(5)
    def air_duct_calculation(self):
        """Test air duct sizing calculations - core functionality."""
        calculation_data = {
            "airflow": random.randint(100, 5000),  # CFM
            "duct_type": random.choice(["round", "rectangular"]),
            "material": random.choice(["galvanized_steel", "aluminum", "stainless_steel"]),
            "pressure_class": random.choice(["low", "medium", "high"]),
            "velocity_limit": random.randint(1000, 4000),  # FPM
            "length": random.randint(10, 100),  # feet
            "fittings": [
                {
                    "type": random.choice(["elbow_90", "elbow_45", "tee", "reducer"]),
                    "quantity": random.randint(1, 5)
                }
            ]
        }
        
        with self.client.post(
            "/api/calculations/air-duct-sizer",
            json=calculation_data,
            headers=self.get_headers(),
            catch_response=True
        ) as response:
            if response.status_code == 200:
                result = response.json()
                if "duct_size" in result and "pressure_loss" in result:
                    response.success()
                else:
                    response.failure("Invalid calculation response")
            else:
                response.failure(f"Calculation failed: {response.status_code}")
    
    @task(2)
    def grease_duct_calculation(self):
        """Test grease duct sizing calculations."""
        calculation_data = {
            "airflow": random.randint(500, 3000),  # CFM
            "appliance_type": random.choice(["fryer", "grill", "oven", "range"]),
            "duct_material": "stainless_steel",
            "cleaning_access": True,
            "fire_suppression": random.choice([True, False]),
            "length": random.randint(15, 50)  # feet
        }
        
        self.client.post(
            "/api/calculations/grease-duct-sizer",
            json=calculation_data,
            headers=self.get_headers()
        )
    
    @task(1)
    def create_project(self):
        """Test project creation."""
        if self.auth_token:
            project_data = {
                "name": f"Load Test Project {random.randint(1, 10000)}",
                "description": "Automated load test project",
                "project_type": "hvac_design",
                "location": {
                    "address": "123 Test St",
                    "city": "Test City",
                    "state": "TS",
                    "zip": "12345"
                }
            }
            
            response = self.client.post(
                "/api/projects",
                json=project_data,
                headers=self.get_headers()
            )
            
            if response.status_code == 201:
                data = response.json()
                self.project_id = data.get("project_id")
    
    @task(1)
    def get_projects(self):
        """Test project listing."""
        if self.auth_token:
            self.client.get("/api/projects", headers=self.get_headers())
    
    @task(1)
    def export_calculation(self):
        """Test calculation export functionality."""
        if self.auth_token:
            export_data = {
                "format": random.choice(["pdf", "excel", "csv"]),
                "include_drawings": random.choice([True, False]),
                "include_specifications": True
            }
            
            self.client.post(
                "/api/export/calculation",
                json=export_data,
                headers=self.get_headers()
            )
    
    @task(1)
    def get_calculation_history(self):
        """Test calculation history retrieval."""
        if self.auth_token:
            params = {
                "limit": random.randint(10, 50),
                "offset": random.randint(0, 100)
            }
            self.client.get(
                "/api/calculations/history",
                params=params,
                headers=self.get_headers()
            )


class HeavyLoadUser(HttpUser):
    """
    Heavy load user for stress testing with intensive operations.
    """
    
    wait_time = between(0.5, 2)  # Faster operations for stress testing
    
    def on_start(self):
        """Initialize heavy load user."""
        self.auth_token = None
        # Authenticate immediately for heavy users
        self.authenticate()
    
    def authenticate(self):
        """Authenticate heavy load user."""
        auth_data = {
            "email": f"heavyload_{random.randint(1, 100)}@example.com",
            "password": "HeavyLoad123!"
        }
        
        response = self.client.post("/api/auth/login", json=auth_data)
        if response.status_code == 200:
            data = response.json()
            self.auth_token = data.get("token")
    
    def get_headers(self):
        """Get headers with authentication token."""
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers
    
    @task(10)
    def intensive_calculations(self):
        """Perform intensive HVAC calculations."""
        # Complex air duct calculation with many fittings
        calculation_data = {
            "airflow": random.randint(2000, 10000),
            "duct_type": "rectangular",
            "material": "galvanized_steel",
            "pressure_class": "high",
            "velocity_limit": random.randint(2000, 5000),
            "length": random.randint(50, 200),
            "fittings": [
                {
                    "type": "elbow_90",
                    "quantity": random.randint(5, 15)
                },
                {
                    "type": "tee",
                    "quantity": random.randint(3, 10)
                },
                {
                    "type": "reducer",
                    "quantity": random.randint(2, 8)
                }
            ],
            "insulation": {
                "type": "fiberglass",
                "thickness": random.randint(1, 4)
            }
        }
        
        self.client.post(
            "/api/calculations/air-duct-sizer",
            json=calculation_data,
            headers=self.get_headers()
        )
    
    @task(5)
    def bulk_operations(self):
        """Test bulk data operations."""
        if self.auth_token:
            # Bulk calculation request
            bulk_data = {
                "calculations": [
                    {
                        "type": "air_duct",
                        "airflow": random.randint(100, 1000),
                        "duct_type": "round"
                    }
                    for _ in range(random.randint(5, 20))
                ]
            }
            
            self.client.post(
                "/api/calculations/bulk",
                json=bulk_data,
                headers=self.get_headers()
            )


# Event handlers for load test monitoring
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Log when load test starts."""
    logger.info("Load test starting...")
    if isinstance(environment.runner, MasterRunner):
        logger.info(f"Master runner started with {environment.runner.worker_count} workers")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Log when load test stops and print summary."""
    logger.info("Load test completed")
    
    # Print performance summary
    stats = environment.runner.stats
    logger.info(f"Total requests: {stats.total.num_requests}")
    logger.info(f"Total failures: {stats.total.num_failures}")
    logger.info(f"Average response time: {stats.total.avg_response_time:.2f}ms")
    logger.info(f"Max response time: {stats.total.max_response_time:.2f}ms")
    logger.info(f"Requests per second: {stats.total.current_rps:.2f}")


# Load test configurations
class LoadTestConfig:
    """Configuration for different load test scenarios."""
    
    # Light load: Normal business hours
    LIGHT_LOAD = {
        "users": 10,
        "spawn_rate": 2,
        "run_time": "5m"
    }
    
    # Medium load: Peak usage
    MEDIUM_LOAD = {
        "users": 50,
        "spawn_rate": 5,
        "run_time": "10m"
    }
    
    # Heavy load: Stress testing
    HEAVY_LOAD = {
        "users": 100,
        "spawn_rate": 10,
        "run_time": "15m"
    }
    
    # Spike load: Sudden traffic increase
    SPIKE_LOAD = {
        "users": 200,
        "spawn_rate": 20,
        "run_time": "5m"
    }


if __name__ == "__main__":
    """
    Run load tests directly with different configurations.
    
    Usage:
    python test_load_performance.py
    """
    import subprocess
    import sys
    
    # Default configuration
    config = LoadTestConfig.LIGHT_LOAD
    
    # Check for command line arguments
    if len(sys.argv) > 1:
        test_type = sys.argv[1].lower()
        if test_type == "medium":
            config = LoadTestConfig.MEDIUM_LOAD
        elif test_type == "heavy":
            config = LoadTestConfig.HEAVY_LOAD
        elif test_type == "spike":
            config = LoadTestConfig.SPIKE_LOAD
    
    # Run locust with configuration
    cmd = [
        "locust",
        "-f", __file__,
        "--host", "http://localhost:5000",
        "--users", str(config["users"]),
        "--spawn-rate", str(config["spawn_rate"]),
        "--run-time", config["run_time"],
        "--headless"
    ]
    
    logger.info(f"Starting load test with config: {config}")
    subprocess.run(cmd)

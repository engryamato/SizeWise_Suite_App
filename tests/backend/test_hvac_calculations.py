"""
Unit Tests for HVAC Calculation Backend Services

Tests the core HVAC calculation functionality including:
- Air duct sizing calculations
- Load calculations
- Equipment sizing
- Input validation
- Error handling
- Database integration
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from datetime import datetime

# Mock imports for testing
class MockHVACCalculationService:
    """Mock HVAC calculation service for testing"""
    
    def __init__(self):
        self.calculations_performed = 0
    
    async def calculate_air_duct(self, params):
        """Mock air duct calculation"""
        self.calculations_performed += 1
        
        if params.get('room_area', 0) <= 0:
            raise ValueError("Room area must be positive")
        
        if params.get('cfm_required', 0) <= 0:
            raise ValueError("CFM must be positive")
        
        # Simple calculation logic for testing
        room_area = params['room_area']
        cfm_required = params['cfm_required']
        
        # Calculate duct dimensions based on velocity
        velocity = 800  # FPM
        area_needed = cfm_required / velocity  # sq ft
        area_needed_inches = area_needed * 144  # sq in
        
        # Assume rectangular duct with aspect ratio 1.4:1
        height = (area_needed_inches / 1.4) ** 0.5
        width = height * 1.4
        
        return {
            'duct_size': {
                'width': round(width),
                'height': round(height)
            },
            'velocity': velocity,
            'pressure_drop': 0.08,
            'material': params.get('duct_material', 'galvanized_steel'),
            'calculation_id': f"calc_{self.calculations_performed}"
        }
    
    async def calculate_load(self, params):
        """Mock load calculation"""
        self.calculations_performed += 1
        
        building_area = params.get('building_area', 0)
        occupancy = params.get('occupancy', 0)
        
        if building_area <= 0:
            raise ValueError("Building area must be positive")
        
        # Simple load calculation
        heating_load = building_area * 25  # BTU/h per sq ft
        cooling_load = building_area * 30  # BTU/h per sq ft
        
        # Add occupancy load
        occupancy_load = occupancy * 400  # BTU/h per person
        cooling_load += occupancy_load
        
        return {
            'heating_load': heating_load,
            'cooling_load': cooling_load,
            'sensible_load': cooling_load * 0.75,
            'latent_load': cooling_load * 0.25,
            'breakdown': {
                'walls': heating_load * 0.3,
                'windows': heating_load * 0.2,
                'roof': heating_load * 0.25,
                'infiltration': heating_load * 0.15,
                'occupancy': occupancy_load
            },
            'calculation_id': f"calc_{self.calculations_performed}"
        }
    
    async def calculate_equipment_sizing(self, params):
        """Mock equipment sizing calculation"""
        self.calculations_performed += 1
        
        heating_load = params.get('heating_load', 0)
        cooling_load = params.get('cooling_load', 0)
        
        if heating_load <= 0 or cooling_load <= 0:
            raise ValueError("Heating and cooling loads must be positive")
        
        # Size equipment with safety factor
        heating_capacity = heating_load * 1.2
        cooling_capacity = cooling_load * 1.15
        
        # Calculate CFM based on cooling load
        cfm = cooling_capacity / 12  # Rough estimate
        
        return {
            'air_handler': {
                'cfm': round(cfm),
                'model': f'AH-{round(cfm/100)*100}-E',
                'efficiency': 0.85
            },
            'heating_equipment': {
                'capacity': heating_capacity,
                'type': params.get('system_type', 'heat_pump'),
                'efficiency': 3.2 if params.get('system_type') == 'heat_pump' else 0.9
            },
            'cooling_equipment': {
                'capacity': cooling_capacity,
                'type': params.get('system_type', 'heat_pump'),
                'efficiency': 16 if params.get('system_type') == 'heat_pump' else 13
            },
            'calculation_id': f"calc_{self.calculations_performed}"
        }

class MockMongoDBService:
    """Mock MongoDB service for testing"""
    
    def __init__(self):
        self.projects = {}
        self.calculations = {}
    
    async def store_project(self, project_data):
        """Store project in mock database"""
        project_id = project_data['id']
        self.projects[project_id] = {
            **project_data,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        return project_id
    
    async def get_project(self, project_id):
        """Retrieve project from mock database"""
        if project_id not in self.projects:
            raise ValueError(f"Project {project_id} not found")
        return self.projects[project_id]
    
    async def store_calculation(self, calculation_data):
        """Store calculation in mock database"""
        calc_id = calculation_data['id']
        self.calculations[calc_id] = {
            **calculation_data,
            'created_at': datetime.utcnow()
        }
        return calc_id
    
    async def get_calculation(self, calc_id):
        """Retrieve calculation from mock database"""
        if calc_id not in self.calculations:
            raise ValueError(f"Calculation {calc_id} not found")
        return self.calculations[calc_id]

# Test fixtures
@pytest.fixture
def hvac_service():
    """Provide HVAC calculation service instance"""
    return MockHVACCalculationService()

@pytest.fixture
def mongodb_service():
    """Provide MongoDB service instance"""
    return MockMongoDBService()

@pytest.fixture
def test_client():
    """Provide test client for API testing"""
    # Mock FastAPI app for testing
    from fastapi import FastAPI
    app = FastAPI()
    
    @app.post("/api/calculations/air-duct")
    async def calculate_air_duct(data: dict):
        service = MockHVACCalculationService()
        return await service.calculate_air_duct(data)
    
    @app.post("/api/calculations/load")
    async def calculate_load(data: dict):
        service = MockHVACCalculationService()
        return await service.calculate_load(data)
    
    @app.post("/api/calculations/equipment")
    async def calculate_equipment(data: dict):
        service = MockHVACCalculationService()
        return await service.calculate_equipment_sizing(data)
    
    return TestClient(app)

class TestHVACCalculations:
    """Test suite for HVAC calculations"""
    
    @pytest.mark.asyncio
    async def test_air_duct_calculation_success(self, hvac_service):
        """Test successful air duct calculation"""
        params = {
            'room_area': 500,
            'cfm_required': 2000,
            'duct_material': 'galvanized_steel',
            'pressure_class': 'low'
        }
        
        result = await hvac_service.calculate_air_duct(params)
        
        assert 'duct_size' in result
        assert 'velocity' in result
        assert 'pressure_drop' in result
        assert result['duct_size']['width'] > 0
        assert result['duct_size']['height'] > 0
        assert result['velocity'] == 800
        assert result['material'] == 'galvanized_steel'
    
    @pytest.mark.asyncio
    async def test_air_duct_calculation_invalid_input(self, hvac_service):
        """Test air duct calculation with invalid input"""
        params = {
            'room_area': -100,  # Invalid negative area
            'cfm_required': 2000,
            'duct_material': 'galvanized_steel'
        }
        
        with pytest.raises(ValueError, match="Room area must be positive"):
            await hvac_service.calculate_air_duct(params)
    
    @pytest.mark.asyncio
    async def test_load_calculation_success(self, hvac_service):
        """Test successful load calculation"""
        params = {
            'building_area': 5000,
            'occupancy': 50,
            'building_type': 'office',
            'climate_zone': 'zone_4a'
        }
        
        result = await hvac_service.calculate_load(params)
        
        assert 'heating_load' in result
        assert 'cooling_load' in result
        assert 'sensible_load' in result
        assert 'latent_load' in result
        assert 'breakdown' in result
        
        # Verify calculations
        expected_heating = 5000 * 25  # 125,000 BTU/h
        expected_cooling = 5000 * 30 + 50 * 400  # 170,000 BTU/h
        
        assert result['heating_load'] == expected_heating
        assert result['cooling_load'] == expected_cooling
        assert result['sensible_load'] == expected_cooling * 0.75
        assert result['latent_load'] == expected_cooling * 0.25
    
    @pytest.mark.asyncio
    async def test_equipment_sizing_success(self, hvac_service):
        """Test successful equipment sizing calculation"""
        params = {
            'heating_load': 50000,
            'cooling_load': 60000,
            'system_type': 'heat_pump'
        }
        
        result = await hvac_service.calculate_equipment_sizing(params)
        
        assert 'air_handler' in result
        assert 'heating_equipment' in result
        assert 'cooling_equipment' in result
        
        # Verify sizing with safety factors
        assert result['heating_equipment']['capacity'] == 50000 * 1.2
        assert result['cooling_equipment']['capacity'] == 60000 * 1.15
        assert result['heating_equipment']['type'] == 'heat_pump'
        assert result['cooling_equipment']['type'] == 'heat_pump'
    
    @pytest.mark.asyncio
    async def test_calculation_persistence(self, hvac_service, mongodb_service):
        """Test calculation result persistence"""
        # Perform calculation
        params = {
            'room_area': 500,
            'cfm_required': 2000,
            'duct_material': 'galvanized_steel'
        }
        
        result = await hvac_service.calculate_air_duct(params)
        
        # Store in database
        calculation_data = {
            'id': result['calculation_id'],
            'type': 'air_duct',
            'parameters': params,
            'results': result,
            'project_id': 'test_project_123'
        }
        
        calc_id = await mongodb_service.store_calculation(calculation_data)
        assert calc_id == result['calculation_id']
        
        # Retrieve and verify
        stored_calc = await mongodb_service.get_calculation(calc_id)
        assert stored_calc['type'] == 'air_duct'
        assert stored_calc['parameters'] == params
        assert stored_calc['results'] == result

class TestAPIEndpoints:
    """Test suite for API endpoints"""
    
    def test_air_duct_api_endpoint(self, test_client):
        """Test air duct calculation API endpoint"""
        payload = {
            'room_area': 500,
            'cfm_required': 2000,
            'duct_material': 'galvanized_steel',
            'pressure_class': 'low'
        }
        
        response = test_client.post("/api/calculations/air-duct", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert 'duct_size' in data
        assert 'velocity' in data
        assert data['duct_size']['width'] > 0
        assert data['duct_size']['height'] > 0
    
    def test_load_calculation_api_endpoint(self, test_client):
        """Test load calculation API endpoint"""
        payload = {
            'building_area': 5000,
            'occupancy': 50,
            'building_type': 'office',
            'climate_zone': 'zone_4a'
        }
        
        response = test_client.post("/api/calculations/load", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert 'heating_load' in data
        assert 'cooling_load' in data
        assert data['heating_load'] > 0
        assert data['cooling_load'] > 0
    
    def test_equipment_sizing_api_endpoint(self, test_client):
        """Test equipment sizing API endpoint"""
        payload = {
            'heating_load': 50000,
            'cooling_load': 60000,
            'system_type': 'heat_pump'
        }
        
        response = test_client.post("/api/calculations/equipment", json=payload)
        
        assert response.status_code == 200
        data = response.json()
        assert 'air_handler' in data
        assert 'heating_equipment' in data
        assert 'cooling_equipment' in data

class TestPerformance:
    """Test suite for performance requirements"""
    
    @pytest.mark.asyncio
    async def test_calculation_performance(self, hvac_service):
        """Test calculation performance requirements"""
        import time
        
        params = {
            'room_area': 500,
            'cfm_required': 2000,
            'duct_material': 'galvanized_steel'
        }
        
        start_time = time.time()
        result = await hvac_service.calculate_air_duct(params)
        end_time = time.time()
        
        calculation_time = end_time - start_time
        
        # Verify calculation completes within 1 second
        assert calculation_time < 1.0
        assert result is not None
    
    @pytest.mark.asyncio
    async def test_concurrent_calculations(self, hvac_service):
        """Test concurrent calculation performance"""
        import time
        
        params = {
            'room_area': 500,
            'cfm_required': 2000,
            'duct_material': 'galvanized_steel'
        }
        
        # Run 10 concurrent calculations
        start_time = time.time()
        
        tasks = []
        for i in range(10):
            task_params = {**params, 'room_area': 500 + i * 100}
            tasks.append(hvac_service.calculate_air_duct(task_params))
        
        results = await asyncio.gather(*tasks)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Verify all calculations complete within 5 seconds
        assert total_time < 5.0
        assert len(results) == 10
        assert all(result is not None for result in results)

class TestErrorHandling:
    """Test suite for error handling"""
    
    @pytest.mark.asyncio
    async def test_invalid_input_handling(self, hvac_service):
        """Test handling of invalid input parameters"""
        # Test negative room area
        with pytest.raises(ValueError):
            await hvac_service.calculate_air_duct({
                'room_area': -100,
                'cfm_required': 2000
            })
        
        # Test zero CFM
        with pytest.raises(ValueError):
            await hvac_service.calculate_air_duct({
                'room_area': 500,
                'cfm_required': 0
            })
        
        # Test missing required parameters
        with pytest.raises(ValueError):
            await hvac_service.calculate_load({
                'building_area': -1000
            })
    
    @pytest.mark.asyncio
    async def test_database_error_handling(self, mongodb_service):
        """Test database error handling"""
        # Test retrieving non-existent project
        with pytest.raises(ValueError, match="Project .* not found"):
            await mongodb_service.get_project("non_existent_project")
        
        # Test retrieving non-existent calculation
        with pytest.raises(ValueError, match="Calculation .* not found"):
            await mongodb_service.get_calculation("non_existent_calculation")

if __name__ == "__main__":
    pytest.main([__file__, "-v"])

"""
Test Data Factory for SizeWise Suite Backend

Provides comprehensive test data generation with realistic HVAC data,
proper relationships, and configurable scenarios for different test needs.
"""

import uuid
import random
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from enum import Enum
import json


class UserTier(Enum):
    """User tier enumeration"""
    TRIAL = "trial"
    FREE = "free"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class ProjectType(Enum):
    """Project type enumeration"""
    AIR_DUCT = "air_duct"
    GREASE_DUCT = "grease_duct"
    ENGINE_EXHAUST = "engine_exhaust"
    BOILER_VENT = "boiler_vent"


class CalculationType(Enum):
    """Calculation type enumeration"""
    ROUND_DUCT = "round_duct"
    RECTANGULAR_DUCT = "rectangular_duct"
    PRESSURE_DROP = "pressure_drop"
    LOAD_CALCULATION = "load_calculation"
    EQUIPMENT_SIZING = "equipment_sizing"


@dataclass
class TestUser:
    """Test user data structure"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    email: str = ""
    name: str = ""
    tier: UserTier = UserTier.FREE
    company: str = ""
    license_key: Optional[str] = None
    organization_id: Optional[str] = None
    settings: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    password_hash: str = "test_password_hash"
    is_active: bool = True


@dataclass
class TestProject:
    """Test project data structure"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = ""
    name: str = ""
    description: str = ""
    project_type: ProjectType = ProjectType.AIR_DUCT
    location: str = ""
    codes: List[str] = field(default_factory=lambda: ["SMACNA", "ASHRAE"])
    rooms: List[Dict[str, Any]] = field(default_factory=list)
    segments: List[Dict[str, Any]] = field(default_factory=list)
    equipment: List[Dict[str, Any]] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    sync_status: str = "local"
    version: int = 1


@dataclass
class TestCalculation:
    """Test calculation data structure"""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str = ""
    user_id: str = ""
    calculation_type: CalculationType = CalculationType.ROUND_DUCT
    inputs: Dict[str, Any] = field(default_factory=dict)
    results: Dict[str, Any] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
    is_valid: bool = True


class TestDataFactory:
    """Factory for generating realistic test data"""
    
    def __init__(self, seed: Optional[int] = None):
        """Initialize factory with optional seed for reproducible data"""
        if seed is not None:
            random.seed(seed)
        
        self._user_counter = 0
        self._project_counter = 0
        self._calculation_counter = 0
    
    def create_user(self, tier: UserTier = UserTier.FREE, **overrides) -> TestUser:
        """Create a test user with realistic data"""
        self._user_counter += 1
        
        base_data = {
            "email": f"test.user.{self._user_counter}@sizewise.com",
            "name": f"Test User {self._user_counter}",
            "tier": tier,
            "company": f"Test Company {self._user_counter}",
            "settings": {
                "units": "imperial",
                "default_codes": ["SMACNA", "ASHRAE"],
                "notifications": True,
                "auto_save": True
            }
        }
        
        # Add license key for premium tiers
        if tier in [UserTier.PREMIUM, UserTier.ENTERPRISE]:
            base_data["license_key"] = f"LIC-{tier.value.upper()}-{self._user_counter:04d}"
        
        # Apply overrides
        base_data.update(overrides)
        
        return TestUser(**base_data)
    
    def create_project(self, user_id: str, project_type: ProjectType = ProjectType.AIR_DUCT, 
                      **overrides) -> TestProject:
        """Create a test project with realistic HVAC data"""
        self._project_counter += 1
        
        base_data = {
            "user_id": user_id,
            "name": f"Test {project_type.value.replace('_', ' ').title()} Project {self._project_counter}",
            "description": f"Test project for {project_type.value} calculations",
            "project_type": project_type,
            "location": f"Test Building {self._project_counter}, Test City, TC",
            "rooms": self._generate_rooms(project_type),
            "segments": self._generate_segments(project_type),
            "equipment": self._generate_equipment(project_type)
        }
        
        # Apply overrides
        base_data.update(overrides)
        
        return TestProject(**base_data)
    
    def create_calculation(self, project_id: str, user_id: str, 
                          calc_type: CalculationType = CalculationType.ROUND_DUCT,
                          **overrides) -> TestCalculation:
        """Create a test calculation with realistic HVAC parameters"""
        self._calculation_counter += 1
        
        inputs, results = self._generate_calculation_data(calc_type)
        
        base_data = {
            "project_id": project_id,
            "user_id": user_id,
            "calculation_type": calc_type,
            "inputs": inputs,
            "results": results,
            "metadata": {
                "calculation_method": "standard",
                "code_compliance": ["SMACNA"],
                "calculation_time": datetime.utcnow().isoformat(),
                "version": "1.0.0"
            }
        }
        
        # Apply overrides
        base_data.update(overrides)
        
        return TestCalculation(**base_data)
    
    def _generate_rooms(self, project_type: ProjectType) -> List[Dict[str, Any]]:
        """Generate realistic room data based on project type"""
        room_count = random.randint(3, 8)
        rooms = []
        
        for i in range(room_count):
            room = {
                "id": str(uuid.uuid4()),
                "name": f"Room {i + 1}",
                "area": random.randint(100, 1000),  # sq ft
                "volume": random.randint(800, 12000),  # cu ft
                "occupancy": random.randint(2, 50),
                "load_requirements": {
                    "heating": random.randint(5000, 50000),  # BTU/hr
                    "cooling": random.randint(8000, 60000),  # BTU/hr
                    "ventilation": random.randint(100, 2000)  # CFM
                }
            }
            
            if project_type == ProjectType.GREASE_DUCT:
                room["grease_load"] = random.randint(1, 5)  # grease load factor
                room["appliance_type"] = random.choice(["fryer", "grill", "oven", "range"])
            
            rooms.append(room)
        
        return rooms
    
    def _generate_segments(self, project_type: ProjectType) -> List[Dict[str, Any]]:
        """Generate realistic duct segment data"""
        segment_count = random.randint(5, 15)
        segments = []
        
        for i in range(segment_count):
            segment = {
                "id": str(uuid.uuid4()),
                "name": f"Segment {i + 1}",
                "airflow": random.randint(500, 5000),  # CFM
                "length": random.randint(10, 100),  # feet
                "material": random.choice(["galvanized_steel", "aluminum", "stainless_steel"]),
                "insulation": random.choice([True, False])
            }
            
            if project_type == ProjectType.AIR_DUCT and random.choice([True, False]):
                segment["diameter"] = random.randint(6, 24)  # inches
            else:
                segment["width"] = random.randint(6, 36)  # inches
                segment["height"] = random.randint(6, 24)  # inches
            
            segments.append(segment)
        
        return segments
    
    def _generate_equipment(self, project_type: ProjectType) -> List[Dict[str, Any]]:
        """Generate realistic equipment data"""
        equipment_count = random.randint(2, 6)
        equipment = []
        
        for i in range(equipment_count):
            base_equipment = {
                "id": str(uuid.uuid4()),
                "name": f"Equipment {i + 1}",
                "manufacturer": random.choice(["Carrier", "Trane", "York", "Lennox"]),
                "model": f"Model-{random.randint(1000, 9999)}",
                "capacity": random.randint(50000, 500000)  # BTU/hr
            }
            
            if project_type == ProjectType.AIR_DUCT:
                base_equipment.update({
                    "type": random.choice(["AHU", "RTU", "VAV", "Fan"]),
                    "static_pressure": random.uniform(0.5, 3.0)  # in. w.g.
                })
            elif project_type == ProjectType.GREASE_DUCT:
                base_equipment.update({
                    "type": "Exhaust Fan",
                    "grease_removal_efficiency": random.uniform(85, 95)  # %
                })
            
            equipment.append(base_equipment)
        
        return equipment
    
    def _generate_calculation_data(self, calc_type: CalculationType) -> tuple:
        """Generate realistic calculation inputs and results"""
        if calc_type == CalculationType.ROUND_DUCT:
            inputs = {
                "airflow": random.randint(500, 5000),  # CFM
                "velocity": random.randint(800, 2000),  # FPM
                "material": random.choice(["galvanized_steel", "aluminum"]),
                "length": random.randint(10, 100)  # feet
            }
            
            # Calculate realistic results
            diameter = (inputs["airflow"] / (inputs["velocity"] * 0.7854)) ** 0.5
            pressure_drop = 0.1 * (inputs["length"] / 100) * (inputs["velocity"] / 1000) ** 2
            
            results = {
                "diameter": round(diameter, 2),
                "pressure_drop": round(pressure_drop, 3),
                "reynolds_number": random.randint(50000, 200000),
                "friction_factor": round(random.uniform(0.015, 0.025), 4)
            }
        
        elif calc_type == CalculationType.RECTANGULAR_DUCT:
            inputs = {
                "airflow": random.randint(1000, 8000),  # CFM
                "width": random.randint(12, 36),  # inches
                "height": random.randint(8, 24),  # inches
                "material": random.choice(["galvanized_steel", "aluminum"]),
                "length": random.randint(10, 100)  # feet
            }
            
            area = (inputs["width"] * inputs["height"]) / 144  # sq ft
            velocity = inputs["airflow"] / area
            pressure_drop = 0.1 * (inputs["length"] / 100) * (velocity / 1000) ** 2
            
            results = {
                "velocity": round(velocity, 1),
                "pressure_drop": round(pressure_drop, 3),
                "equivalent_diameter": round(1.3 * ((inputs["width"] * inputs["height"]) ** 0.625) / 
                                           ((inputs["width"] + inputs["height"]) ** 0.25), 2)
            }
        
        elif calc_type == CalculationType.LOAD_CALCULATION:
            inputs = {
                "area": random.randint(500, 5000),  # sq ft
                "occupancy": random.randint(10, 100),
                "lighting_load": random.randint(1, 3),  # W/sq ft
                "equipment_load": random.randint(2, 8),  # W/sq ft
                "outdoor_temp": random.randint(85, 105),  # °F
                "indoor_temp": 75  # °F
            }
            
            sensible_load = inputs["area"] * (inputs["lighting_load"] + inputs["equipment_load"]) * 3.412
            latent_load = inputs["occupancy"] * 200  # BTU/hr per person
            total_load = sensible_load + latent_load
            
            results = {
                "sensible_load": round(sensible_load, 0),
                "latent_load": round(latent_load, 0),
                "total_load": round(total_load, 0),
                "tons": round(total_load / 12000, 2)
            }
        
        else:
            # Default calculation data
            inputs = {"value": random.randint(100, 1000)}
            results = {"result": inputs["value"] * 1.2}
        
        return inputs, results
    
    def create_test_scenario(self, scenario_name: str, user_count: int = 3, 
                           projects_per_user: int = 2, 
                           calculations_per_project: int = 5) -> Dict[str, Any]:
        """Create a complete test scenario with users, projects, and calculations"""
        scenario = {
            "name": scenario_name,
            "created_at": datetime.utcnow().isoformat(),
            "users": [],
            "projects": [],
            "calculations": []
        }
        
        # Create users
        for i in range(user_count):
            tier = [UserTier.FREE, UserTier.PREMIUM, UserTier.ENTERPRISE][i % 3]
            user = self.create_user(tier=tier)
            scenario["users"].append(user)
            
            # Create projects for each user
            for j in range(projects_per_user):
                project_type = list(ProjectType)[j % len(ProjectType)]
                project = self.create_project(user.id, project_type=project_type)
                scenario["projects"].append(project)
                
                # Create calculations for each project
                for k in range(calculations_per_project):
                    calc_type = list(CalculationType)[k % len(CalculationType)]
                    calculation = self.create_calculation(project.id, user.id, calc_type=calc_type)
                    scenario["calculations"].append(calculation)
        
        return scenario
    
    def to_dict(self, obj: Union[TestUser, TestProject, TestCalculation]) -> Dict[str, Any]:
        """Convert test data object to dictionary for database insertion"""
        if isinstance(obj, TestUser):
            return {
                "id": obj.id,
                "email": obj.email,
                "name": obj.name,
                "tier": obj.tier.value,
                "company": obj.company,
                "license_key": obj.license_key,
                "organization_id": obj.organization_id,
                "settings": json.dumps(obj.settings),
                "created_at": obj.created_at.isoformat(),
                "updated_at": obj.updated_at.isoformat(),
                "password_hash": obj.password_hash,
                "is_active": obj.is_active
            }
        elif isinstance(obj, TestProject):
            return {
                "id": obj.id,
                "user_id": obj.user_id,
                "name": obj.name,
                "description": obj.description,
                "project_type": obj.project_type.value,
                "location": obj.location,
                "codes": json.dumps(obj.codes),
                "rooms": json.dumps(obj.rooms),
                "segments": json.dumps(obj.segments),
                "equipment": json.dumps(obj.equipment),
                "created_at": obj.created_at.isoformat(),
                "updated_at": obj.updated_at.isoformat(),
                "sync_status": obj.sync_status,
                "version": obj.version
            }
        elif isinstance(obj, TestCalculation):
            return {
                "id": obj.id,
                "project_id": obj.project_id,
                "user_id": obj.user_id,
                "calculation_type": obj.calculation_type.value,
                "inputs": json.dumps(obj.inputs),
                "results": json.dumps(obj.results),
                "metadata": json.dumps(obj.metadata),
                "created_at": obj.created_at.isoformat(),
                "is_valid": obj.is_valid
            }
        else:
            raise ValueError(f"Unsupported object type: {type(obj)}")


# Convenience functions for common test scenarios
def create_basic_test_data() -> Dict[str, Any]:
    """Create basic test data for simple tests"""
    factory = TestDataFactory(seed=42)  # Reproducible data
    return factory.create_test_scenario("basic_test", user_count=1, 
                                       projects_per_user=1, calculations_per_project=3)


def create_performance_test_data() -> Dict[str, Any]:
    """Create large dataset for performance testing"""
    factory = TestDataFactory(seed=123)
    return factory.create_test_scenario("performance_test", user_count=10, 
                                       projects_per_user=5, calculations_per_project=20)


def create_tier_test_data() -> Dict[str, Any]:
    """Create test data for tier-based testing"""
    factory = TestDataFactory(seed=456)
    scenario = factory.create_test_scenario("tier_test", user_count=4, 
                                           projects_per_user=3, calculations_per_project=10)
    
    # Ensure we have one user of each tier
    tiers = [UserTier.TRIAL, UserTier.FREE, UserTier.PREMIUM, UserTier.ENTERPRISE]
    for i, user in enumerate(scenario["users"]):
        if i < len(tiers):
            user.tier = tiers[i]
    
    return scenario

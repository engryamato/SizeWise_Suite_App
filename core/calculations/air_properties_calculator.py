"""
Air Properties Calculator

Python implementation of air properties calculation service for Phase 4: Cross-Platform Implementation.
Provides equivalent functionality to the TypeScript AirPropertiesCalculator.

@version 3.0.0
@author SizeWise Suite Development Team
"""

import math
import json
import os
from dataclasses import dataclass
from typing import Dict, List, Optional, Union


@dataclass
class AirConditions:
    """Air condition parameters"""
    temperature: float = 70.0  # °F
    pressure: Optional[float] = None  # in. Hg (calculated from altitude if not provided)
    altitude: float = 0.0  # feet above sea level
    humidity: float = 50.0  # % relative humidity


@dataclass
class AirProperties:
    """Air properties calculation result"""
    density: float  # lb/ft³
    viscosity: float  # lb/(ft·hr)
    specific_heat: float  # Btu/(lb·°F)
    thermal_conductivity: float  # Btu/(hr·ft·°F)
    prandtl_number: float  # dimensionless
    temperature: float  # °F (input)
    pressure: float  # in. Hg
    altitude: float  # feet
    humidity: float  # %
    warnings: List[str]


class AirPropertiesCalculator:
    """
    Air properties calculation service providing density, viscosity, and other
    thermodynamic properties for HVAC calculations.
    """
    
    VERSION = "3.0.0"
    
    # Standard conditions
    STANDARD_TEMPERATURE = 70.0  # °F
    STANDARD_PRESSURE = 29.92  # in. Hg
    STANDARD_DENSITY = 0.075  # lb/ft³
    
    # Physical constants
    GAS_CONSTANT_AIR = 53.35  # ft·lbf/(lbm·°R)
    STANDARD_GRAVITY = 32.174  # ft/s²
    
    @classmethod
    def calculate_air_properties(cls, conditions: AirConditions) -> AirProperties:
        """Calculate air properties for given conditions"""
        warnings = []
        
        # Validate inputs
        cls._validate_conditions(conditions, warnings)
        
        # Calculate pressure from altitude if not provided
        pressure = conditions.pressure
        if pressure is None:
            pressure = cls._calculate_pressure_from_altitude(conditions.altitude)
        
        # Calculate air density
        density = cls._calculate_density(conditions.temperature, pressure, conditions.humidity)
        
        # Calculate other properties
        viscosity = cls._calculate_viscosity(conditions.temperature)
        specific_heat = cls._calculate_specific_heat(conditions.temperature, conditions.humidity)
        thermal_conductivity = cls._calculate_thermal_conductivity(conditions.temperature)
        prandtl_number = cls._calculate_prandtl_number(viscosity, specific_heat, thermal_conductivity)
        
        return AirProperties(
            density=density,
            viscosity=viscosity,
            specific_heat=specific_heat,
            thermal_conductivity=thermal_conductivity,
            prandtl_number=prandtl_number,
            temperature=conditions.temperature,
            pressure=pressure,
            altitude=conditions.altitude,
            humidity=conditions.humidity,
            warnings=warnings
        )
    
    @classmethod
    def _validate_conditions(cls, conditions: AirConditions, warnings: List[str]) -> None:
        """Validate air condition inputs"""
        if conditions.temperature < 32 or conditions.temperature > 200:
            warnings.append(f"Temperature {conditions.temperature}°F is outside typical HVAC range (32-200°F)")
        
        if conditions.altitude < 0 or conditions.altitude > 10000:
            warnings.append(f"Altitude {conditions.altitude} ft is outside typical range (0-10,000 ft)")
        
        if conditions.humidity < 0 or conditions.humidity > 100:
            warnings.append(f"Humidity {conditions.humidity}% is outside valid range (0-100%)")
        
        if conditions.pressure is not None:
            if conditions.pressure < 20 or conditions.pressure > 35:
                warnings.append(f"Pressure {conditions.pressure} in. Hg is outside typical range (20-35 in. Hg)")
    
    @classmethod
    def _calculate_pressure_from_altitude(cls, altitude: float) -> float:
        """Calculate atmospheric pressure from altitude"""
        # Standard atmosphere approximation
        # P = P₀ * (1 - 0.0065 * h / T₀)^(g * M / (R * 0.0065))
        # Simplified for HVAC applications
        pressure_ratio = (1 - altitude / 145442.16) ** 5.255876
        return cls.STANDARD_PRESSURE * pressure_ratio
    
    @classmethod
    def _calculate_density(cls, temperature: float, pressure: float, humidity: float) -> float:
        """Calculate air density using ideal gas law with humidity correction"""
        # Convert temperature to absolute (Rankine)
        temp_rankine = temperature + 459.67
        
        # Convert pressure to absolute (psia)
        pressure_psia = pressure * 0.491154
        
        # Calculate dry air density
        dry_density = (pressure_psia * 144) / (cls.GAS_CONSTANT_AIR * temp_rankine)
        
        # Apply humidity correction (simplified)
        # Humid air is less dense than dry air
        humidity_factor = 1 - (humidity / 100) * 0.01  # Approximate correction
        
        return dry_density * humidity_factor
    
    @classmethod
    def _calculate_viscosity(cls, temperature: float) -> float:
        """Calculate dynamic viscosity using Sutherland's formula"""
        # Convert to absolute temperature
        temp_rankine = temperature + 459.67
        
        # Sutherland's formula for air
        # μ = μ₀ * (T/T₀)^(3/2) * (T₀ + S)/(T + S)
        mu_0 = 3.62e-7  # lb/(ft·s) at 70°F
        T_0 = 529.67  # °R (70°F)
        S = 198.6  # Sutherland constant for air
        
        viscosity = mu_0 * (temp_rankine / T_0) ** 1.5 * (T_0 + S) / (temp_rankine + S)
        
        # Convert to lb/(ft·hr)
        return viscosity * 3600
    
    @classmethod
    def _calculate_specific_heat(cls, temperature: float, humidity: float) -> float:
        """Calculate specific heat of humid air"""
        # Specific heat of dry air (temperature dependent)
        cp_dry = 0.240 + 0.000004 * temperature  # Btu/(lb·°F)
        
        # Humidity correction (simplified)
        humidity_correction = 1 + (humidity / 100) * 0.05  # Approximate
        
        return cp_dry * humidity_correction
    
    @classmethod
    def _calculate_thermal_conductivity(cls, temperature: float) -> float:
        """Calculate thermal conductivity of air"""
        # Temperature-dependent thermal conductivity
        # k = k₀ * (T/T₀)^n where n ≈ 0.8 for air
        k_0 = 0.0140  # Btu/(hr·ft·°F) at 70°F
        T_0 = 529.67  # °R (70°F)
        temp_rankine = temperature + 459.67
        
        return k_0 * (temp_rankine / T_0) ** 0.8
    
    @classmethod
    def _calculate_prandtl_number(cls, viscosity: float, specific_heat: float, thermal_conductivity: float) -> float:
        """Calculate Prandtl number"""
        # Pr = μ * cp / k
        # Convert viscosity from lb/(ft·hr) to lb/(ft·s)
        viscosity_fps = viscosity / 3600
        
        # Convert specific heat to consistent units
        cp_consistent = specific_heat * 778.169  # ft·lbf/(lb·°R)
        
        return (viscosity_fps * cp_consistent) / thermal_conductivity
    
    @classmethod
    def get_standard_air_properties(cls) -> AirProperties:
        """Get standard air properties (70°F, sea level, 50% RH)"""
        standard_conditions = AirConditions(
            temperature=cls.STANDARD_TEMPERATURE,
            pressure=cls.STANDARD_PRESSURE,
            altitude=0.0,
            humidity=50.0
        )
        return cls.calculate_air_properties(standard_conditions)
    
    @classmethod
    def calculate_density_ratio(cls, conditions: AirConditions) -> float:
        """Calculate density ratio compared to standard conditions"""
        properties = cls.calculate_air_properties(conditions)
        return properties.density / cls.STANDARD_DENSITY
    
    @classmethod
    def calculate_reynolds_number(cls, velocity: float, hydraulic_diameter: float, conditions: AirConditions) -> float:
        """Calculate Reynolds number for given flow conditions"""
        properties = cls.calculate_air_properties(conditions)
        
        # Convert units for calculation
        velocity_fps = velocity / 60  # FPM to ft/s
        diameter_ft = hydraulic_diameter / 12  # inches to feet
        viscosity_fps = properties.viscosity / 3600  # lb/(ft·hr) to lb/(ft·s)
        
        # Re = ρ * V * D / μ
        reynolds_number = (properties.density * velocity_fps * diameter_ft) / viscosity_fps
        
        return reynolds_number

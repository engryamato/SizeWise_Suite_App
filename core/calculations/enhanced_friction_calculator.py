"""
Enhanced Friction Calculator

Python implementation of the comprehensive friction calculation service
for Phase 4: Cross-Platform Implementation. Provides equivalent functionality
to the TypeScript EnhancedFrictionCalculator.

@version 3.0.0
@author SizeWise Suite Development Team
"""

import math
import json
import os
from enum import Enum
from typing import Dict, List, Optional, Tuple, Union
from dataclasses import dataclass

from .air_properties_calculator import AirPropertiesCalculator, AirConditions


class FrictionMethod(Enum):
    """Friction calculation method options"""
    COLEBROOK_WHITE = "colebrook_white"
    SWAMEE_JAIN = "swamee_jain"
    HAALAND = "haaland"
    CHEN = "chen"
    ZIGRANG_SYLVESTER = "zigrang_sylvester"
    ENHANCED_DARCY = "enhanced_darcy"


class FlowRegime(Enum):
    """Flow regime classification"""
    LAMINAR = "laminar"
    TRANSITIONAL = "transitional"
    TURBULENT_SMOOTH = "turbulent_smooth"
    TURBULENT_ROUGH = "turbulent_rough"
    FULLY_ROUGH = "fully_rough"


class MaterialAge(Enum):
    """Material aging condition"""
    NEW = "new"
    GOOD = "good"
    AVERAGE = "average"
    POOR = "poor"
    VERY_POOR = "very_poor"


class SurfaceCondition(Enum):
    """Surface condition factor"""
    EXCELLENT = "excellent"
    GOOD = "good"
    AVERAGE = "average"
    POOR = "poor"
    VERY_POOR = "very_poor"


@dataclass
class FrictionCalculationInput:
    """Friction calculation input parameters"""
    velocity: float  # FPM
    hydraulic_diameter: float  # inches
    length: float  # feet
    material: str  # Material type
    method: FrictionMethod = FrictionMethod.ENHANCED_DARCY
    material_age: MaterialAge = MaterialAge.GOOD
    surface_condition: SurfaceCondition = SurfaceCondition.GOOD
    air_conditions: Optional[AirConditions] = None
    shape_factor: float = 1.0  # For rectangular ducts
    validation_level: str = "standard"


@dataclass
class MaterialProperties:
    """Material properties for friction calculations"""
    roughness: float  # inches
    aging_factor: float
    surface_factor: float
    combined_roughness: float


@dataclass
class FlowProperties:
    """Flow properties for friction calculations"""
    reynolds_number: float
    flow_regime: FlowRegime
    relative_roughness: float
    friction_factor: float


@dataclass
class FrictionCalculationResult:
    """Friction calculation result"""
    friction_loss: float  # inches w.g.
    friction_rate: float  # inches w.g. per 100 ft
    friction_factor: float  # Darcy friction factor
    method: FrictionMethod
    flow_regime: FlowRegime
    reynolds_number: float
    relative_roughness: float
    material_properties: MaterialProperties
    flow_properties: FlowProperties
    accuracy: float  # Estimated accuracy (0-1)
    warnings: List[str]
    recommendations: List[str]

    def __post_init__(self):
        if self.warnings is None:
            self.warnings = []
        if self.recommendations is None:
            self.recommendations = []


class EnhancedFrictionCalculator:
    """
    Comprehensive friction calculation service providing multiple calculation
    methods, material aging effects, and environmental corrections for HVAC applications.
    """
    
    VERSION = "3.0.0"
    
    # Material aging factors
    AGING_FACTORS = {
        MaterialAge.NEW: 1.0,
        MaterialAge.GOOD: 1.2,
        MaterialAge.AVERAGE: 1.5,
        MaterialAge.POOR: 2.0,
        MaterialAge.VERY_POOR: 3.0
    }
    
    # Surface condition factors
    SURFACE_FACTORS = {
        SurfaceCondition.EXCELLENT: 0.8,
        SurfaceCondition.GOOD: 1.0,
        SurfaceCondition.AVERAGE: 1.3,
        SurfaceCondition.POOR: 1.7,
        SurfaceCondition.VERY_POOR: 2.5
    }
    
    # Base material roughness values (inches)
    MATERIAL_ROUGHNESS = {
        "galvanized_steel": 0.0005,
        "stainless_steel": 0.00015,
        "aluminum": 0.00015,
        "pvc": 0.000005,
        "fiberglass": 0.0003,
        "concrete": 0.01,
        "flexible_duct": 0.003
    }
    
    # Flow regime boundaries
    LAMINAR_LIMIT = 2300
    TRANSITIONAL_LIMIT = 4000
    TURBULENT_SMOOTH_LIMIT = 100000
    FULLY_ROUGH_LIMIT = 1000000
    
    # Method accuracy estimates
    METHOD_ACCURACY = {
        FrictionMethod.COLEBROOK_WHITE: 0.98,
        FrictionMethod.SWAMEE_JAIN: 0.96,
        FrictionMethod.HAALAND: 0.97,
        FrictionMethod.CHEN: 0.96,
        FrictionMethod.ZIGRANG_SYLVESTER: 0.97,
        FrictionMethod.ENHANCED_DARCY: 0.99
    }

    @classmethod
    def calculate_friction_loss(cls, input_params: FrictionCalculationInput) -> FrictionCalculationResult:
        """Calculate friction loss using specified method and conditions"""
        warnings = []
        recommendations = []

        # Validate inputs
        cls._validate_inputs(input_params, warnings)

        # Calculate material properties
        material_props = cls._calculate_material_properties(
            input_params.material,
            input_params.material_age,
            input_params.surface_condition
        )

        # Calculate air properties and Reynolds number
        air_props = AirPropertiesCalculator.calculate_air_properties(
            input_params.air_conditions or AirConditions()
        )
        warnings.extend(air_props.warnings)

        reynolds_number = AirPropertiesCalculator.calculate_reynolds_number(
            input_params.velocity,
            input_params.hydraulic_diameter,
            input_params.air_conditions or AirConditions()
        )

        # Determine flow regime
        flow_regime = cls._classify_flow_regime(reynolds_number, material_props.combined_roughness)

        # Calculate relative roughness
        relative_roughness = material_props.combined_roughness / (input_params.hydraulic_diameter / 12)

        # Calculate friction factor
        friction_factor = cls._calculate_friction_factor(
            input_params.method,
            reynolds_number,
            relative_roughness,
            flow_regime,
            warnings
        )

        # Calculate friction loss
        velocity_fps = input_params.velocity / 60  # Convert FPM to ft/s
        diameter_ft = input_params.hydraulic_diameter / 12  # Convert inches to feet
        
        # Darcy-Weisbach equation: ΔP = f * (L/D) * (ρ * V²) / (2 * gc)
        friction_loss_psf = (friction_factor * (input_params.length / diameter_ft) * 
                            air_props.density * velocity_fps ** 2) / (2 * 32.174)
        
        # Convert to inches w.g.
        friction_loss = friction_loss_psf / 5.202  # psf to inches w.g.
        
        # Apply shape factor for rectangular ducts
        friction_loss *= input_params.shape_factor
        
        # Calculate friction rate
        friction_rate = (friction_loss / input_params.length) * 100

        # Create flow properties
        flow_props = FlowProperties(
            reynolds_number=reynolds_number,
            flow_regime=flow_regime,
            relative_roughness=relative_roughness,
            friction_factor=friction_factor
        )

        # Generate recommendations
        cls._generate_recommendations(input_params, flow_props, recommendations)

        return FrictionCalculationResult(
            friction_loss=friction_loss,
            friction_rate=friction_rate,
            friction_factor=friction_factor,
            method=input_params.method,
            flow_regime=flow_regime,
            reynolds_number=reynolds_number,
            relative_roughness=relative_roughness,
            material_properties=material_props,
            flow_properties=flow_props,
            accuracy=cls.METHOD_ACCURACY[input_params.method],
            warnings=warnings,
            recommendations=recommendations
        )

    @classmethod
    def get_optimal_method(
        cls, 
        reynolds_number: float, 
        relative_roughness: float, 
        accuracy: str = "standard"
    ) -> FrictionMethod:
        """Get optimal calculation method for given flow conditions"""
        if accuracy == "maximum":
            return FrictionMethod.COLEBROOK_WHITE
        
        if reynolds_number < cls.LAMINAR_LIMIT:
            return FrictionMethod.ENHANCED_DARCY  # Handles laminar flow
        
        if relative_roughness < 1e-6:
            return FrictionMethod.SWAMEE_JAIN  # Good for smooth pipes
        
        if reynolds_number > 1e6:
            return FrictionMethod.CHEN  # Good for very rough pipes
        
        return FrictionMethod.HAALAND  # Good general-purpose method

    @classmethod
    def _validate_inputs(cls, input_params: FrictionCalculationInput, warnings: List[str]) -> None:
        """Validate input parameters"""
        if input_params.velocity <= 0:
            raise ValueError("Velocity must be positive")
        
        if input_params.hydraulic_diameter <= 0:
            raise ValueError("Hydraulic diameter must be positive")
        
        if input_params.length <= 0:
            raise ValueError("Length must be positive")
        
        if input_params.material not in cls.MATERIAL_ROUGHNESS:
            warnings.append(f"Unknown material '{input_params.material}', using galvanized steel properties")
        
        if input_params.velocity > 6000:
            warnings.append("High velocity may cause noise and energy efficiency issues")
        
        if input_params.velocity < 500:
            warnings.append("Low velocity may indicate oversized ductwork")

    @classmethod
    def _calculate_material_properties(
        cls,
        material: str,
        material_age: MaterialAge,
        surface_condition: SurfaceCondition
    ) -> MaterialProperties:
        """Calculate material properties including aging and surface effects"""
        base_roughness = cls.MATERIAL_ROUGHNESS.get(material, cls.MATERIAL_ROUGHNESS["galvanized_steel"])
        aging_factor = cls.AGING_FACTORS[material_age]
        surface_factor = cls.SURFACE_FACTORS[surface_condition]
        
        combined_roughness = base_roughness * aging_factor * surface_factor
        
        return MaterialProperties(
            roughness=base_roughness,
            aging_factor=aging_factor,
            surface_factor=surface_factor,
            combined_roughness=combined_roughness
        )

    @classmethod
    def _classify_flow_regime(cls, reynolds_number: float, roughness: float) -> FlowRegime:
        """Classify flow regime based on Reynolds number and roughness"""
        if reynolds_number < cls.LAMINAR_LIMIT:
            return FlowRegime.LAMINAR
        elif reynolds_number < cls.TRANSITIONAL_LIMIT:
            return FlowRegime.TRANSITIONAL
        elif reynolds_number < cls.TURBULENT_SMOOTH_LIMIT:
            return FlowRegime.TURBULENT_SMOOTH
        elif reynolds_number < cls.FULLY_ROUGH_LIMIT:
            return FlowRegime.TURBULENT_ROUGH
        else:
            return FlowRegime.FULLY_ROUGH

    @classmethod
    def _calculate_friction_factor(
        cls,
        method: FrictionMethod,
        reynolds_number: float,
        relative_roughness: float,
        flow_regime: FlowRegime,
        warnings: List[str]
    ) -> float:
        """Calculate friction factor using specified method"""
        if flow_regime == FlowRegime.LAMINAR:
            return 64 / reynolds_number
        
        if method == FrictionMethod.COLEBROOK_WHITE:
            return cls._colebrook_white(reynolds_number, relative_roughness)
        elif method == FrictionMethod.SWAMEE_JAIN:
            return cls._swamee_jain(reynolds_number, relative_roughness)
        elif method == FrictionMethod.HAALAND:
            return cls._haaland(reynolds_number, relative_roughness)
        elif method == FrictionMethod.CHEN:
            return cls._chen(reynolds_number, relative_roughness)
        elif method == FrictionMethod.ZIGRANG_SYLVESTER:
            return cls._zigrang_sylvester(reynolds_number, relative_roughness)
        elif method == FrictionMethod.ENHANCED_DARCY:
            return cls._enhanced_darcy(reynolds_number, relative_roughness, flow_regime)
        else:
            warnings.append(f"Unknown method {method}, using Haaland")
            return cls._haaland(reynolds_number, relative_roughness)

    @classmethod
    def _colebrook_white(cls, reynolds_number: float, relative_roughness: float) -> float:
        """Colebrook-White equation (iterative solution)"""
        # Initial guess using Haaland equation
        f = cls._haaland(reynolds_number, relative_roughness)

        # Safety check for initial guess
        if f <= 0 or not math.isfinite(f):
            return 0.02  # Reasonable default for turbulent flow

        # Newton-Raphson iteration
        for _ in range(10):  # Maximum 10 iterations
            if f <= 0:
                f = 0.02
                break

            sqrt_f = math.sqrt(f)
            f_inv_sqrt = 1 / sqrt_f

            # Safety check for log argument
            log_arg = relative_roughness / 3.7 + 2.51 / (reynolds_number * sqrt_f)
            if log_arg <= 0:
                break

            lhs = -2 * math.log10(log_arg)

            if abs(f_inv_sqrt - lhs) < 1e-6:
                break

            # Newton-Raphson update with safety checks
            denominator_term = relative_roughness / 3.7 + 2.51 / (reynolds_number * sqrt_f)
            if denominator_term <= 0:
                break

            derivative = 2.51 / (reynolds_number * f ** 1.5 * math.log(10) * denominator_term)
            if not math.isfinite(derivative) or derivative == 0:
                break

            f_new = f - (f_inv_sqrt - lhs) / derivative

            # Ensure f stays positive and reasonable
            if f_new <= 0 or f_new > 1.0 or not math.isfinite(f_new):
                break
            f = f_new

        # Final safety check
        return max(0.005, min(1.0, f)) if math.isfinite(f) else 0.02

    @classmethod
    def _swamee_jain(cls, reynolds_number: float, relative_roughness: float) -> float:
        """Swamee-Jain explicit approximation"""
        numerator = 0.25
        log_term = math.log10(relative_roughness / 3.7 + 5.74 / (reynolds_number ** 0.9))
        denominator = log_term ** 2
        return numerator / denominator

    @classmethod
    def _haaland(cls, reynolds_number: float, relative_roughness: float) -> float:
        """Haaland explicit approximation"""
        # Safety checks for inputs
        if reynolds_number <= 0:
            return 0.02
        if relative_roughness < 0:
            relative_roughness = 0

        term1 = relative_roughness / 3.7
        term2 = 6.9 / reynolds_number
        log_arg = term1 ** 1.11 + term2

        # Safety check for log argument
        if log_arg <= 0:
            return 0.02

        log_term = math.log10(log_arg)

        # Safety check for final calculation
        if log_term == 0:
            return 0.02

        result = (-1.8 * log_term) ** (-2)

        # Ensure result is reasonable
        return max(0.005, min(1.0, result)) if math.isfinite(result) else 0.02

    @classmethod
    def _chen(cls, reynolds_number: float, relative_roughness: float) -> float:
        """Chen explicit approximation"""
        A = (relative_roughness / 3.7) ** 1.1098 + 6.8678 / reynolds_number
        B = (relative_roughness / 3.7) ** 1.1098 + 2.8257 / reynolds_number
        log_term = math.log10(A - 5.0452 / reynolds_number * math.log10(B))
        return (-2 * log_term) ** (-2)

    @classmethod
    def _zigrang_sylvester(cls, reynolds_number: float, relative_roughness: float) -> float:
        """Zigrang-Sylvester explicit approximation"""
        A = -0.8686 * math.log10(relative_roughness / 3.7 + 5.74 / (reynolds_number ** 0.9))
        B = A + 0.8686 * math.log10(relative_roughness / 3.7 + 5.74 / (reynolds_number ** 0.9))
        return (A - 0.8686 * math.log10(relative_roughness / 3.7 + 5.74 / (reynolds_number ** 0.9))) ** (-2)

    @classmethod
    def _enhanced_darcy(cls, reynolds_number: float, relative_roughness: float, flow_regime: FlowRegime) -> float:
        """Enhanced Darcy method with flow regime optimization"""
        if flow_regime == FlowRegime.LAMINAR:
            return 64 / reynolds_number
        elif flow_regime == FlowRegime.TRANSITIONAL:
            # Interpolate between laminar and turbulent
            f_laminar = 64 / cls.LAMINAR_LIMIT
            f_turbulent = cls._haaland(cls.TRANSITIONAL_LIMIT, relative_roughness)
            weight = (reynolds_number - cls.LAMINAR_LIMIT) / (cls.TRANSITIONAL_LIMIT - cls.LAMINAR_LIMIT)
            return f_laminar * (1 - weight) + f_turbulent * weight
        else:
            # Use Colebrook-White for maximum accuracy in turbulent flow
            return cls._colebrook_white(reynolds_number, relative_roughness)

    @classmethod
    def _generate_recommendations(
        cls,
        input_params: FrictionCalculationInput,
        flow_props: FlowProperties,
        recommendations: List[str]
    ) -> None:
        """Generate recommendations based on calculation results"""
        # Velocity-based recommendations
        if input_params.velocity < 800:
            recommendations.append("Consider reducing duct size to increase velocity and improve efficiency")
        elif input_params.velocity > 4000:
            recommendations.append("Consider increasing duct size to reduce velocity and noise")
        
        # Material age recommendations
        if input_params.material_age in [MaterialAge.POOR, MaterialAge.VERY_POOR]:
            recommendations.append("Consider duct cleaning or replacement to improve efficiency")
        
        # Flow regime recommendations
        if flow_props.flow_regime == FlowRegime.LAMINAR:
            recommendations.append("Laminar flow detected - verify system design and airflow requirements")
        elif flow_props.flow_regime == FlowRegime.TRANSITIONAL:
            recommendations.append("Transitional flow may cause instability - consider design modifications")
        
        # Method recommendations
        if (input_params.method == FrictionMethod.SWAMEE_JAIN and 
            flow_props.relative_roughness > 0.01):
            recommendations.append("Consider using Colebrook-White method for better accuracy with rough surfaces")

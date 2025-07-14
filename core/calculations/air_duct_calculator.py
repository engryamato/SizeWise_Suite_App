"""
Air Duct Calculator

SMACNA-compliant air duct sizing calculations with friction loss analysis.
"""

import math
from typing import Dict, Any, Optional, Tuple
import structlog
from .base_calculator import BaseCalculator, CalculationResult
from .units_converter import UnitsConverter
from ..validation.hvac_validator import HVACValidator

logger = structlog.get_logger()

class AirDuctCalculator(BaseCalculator):
    """Calculator for air duct sizing per SMACNA standards."""

    def __init__(self):
        super().__init__('air-duct-sizer')
        self.units_converter = UnitsConverter()
        self.hvac_validator = HVACValidator()

        # SMACNA friction chart data (simplified)
        self.friction_chart = self._initialize_friction_chart()

        # Material roughness factors (feet)
        self.roughness_factors = {
            'galvanized_steel': 0.0003,
            'aluminum': 0.0002,
            'stainless_steel': 0.0002,
            'pvc': 0.0001,
            'fiberglass': 0.0005,
            'concrete': 0.003,
            'brick': 0.01
        }

    def _initialize_friction_chart(self) -> Dict[str, Any]:
        """Initialize simplified SMACNA friction chart data."""
        return {
            'round': {
                # Diameter (inches) -> {CFM: velocity, ...}
                4: {100: 1146, 150: 1719, 200: 2292},
                5: {150: 1100, 200: 1467, 300: 2200, 400: 2933},
                6: {200: 1019, 300: 1528, 400: 2037, 500: 2546, 600: 3056},
                8: {400: 1146, 600: 1719, 800: 2292, 1000: 2865, 1200: 3438},
                10: {600: 1100, 900: 1650, 1200: 2200, 1500: 2750, 1800: 3300},
                12: {900: 1146, 1350: 1719, 1800: 2292, 2250: 2865, 2700: 3438},
                14: {1200: 1122, 1800: 1683, 2400: 2244, 3000: 2805},
                16: {1600: 1146, 2400: 1719, 3200: 2292, 4000: 2865},
                18: {2000: 1131, 3000: 1697, 4000: 2262, 5000: 2828},
                20: {2500: 1146, 3750: 1719, 5000: 2292, 6250: 2865},
                24: {3600: 1146, 5400: 1719, 7200: 2292, 9000: 2865}
            }
        }
    
    def validate_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate input data for air duct calculation."""
        validation_result = {
            'is_valid': True,
            'errors': [],
            'warnings': []
        }
        
        # Required fields
        required_fields = ['airflow', 'duct_type', 'friction_rate', 'units']
        for field in required_fields:
            if field not in input_data:
                validation_result['errors'].append(f"Missing required field: {field}")
                validation_result['is_valid'] = False
        
        if not validation_result['is_valid']:
            return validation_result
        
        # Validate airflow
        airflow = input_data.get('airflow', 0)
        if not isinstance(airflow, (int, float)) or airflow <= 0:
            validation_result['errors'].append("Airflow must be a positive number")
            validation_result['is_valid'] = False
        elif airflow < 50:
            validation_result['warnings'].append("Very low airflow - verify this is correct")
        elif airflow > 50000:
            validation_result['warnings'].append("Very high airflow - verify this is correct")
        
        # Validate duct type
        duct_type = input_data.get('duct_type', '')
        if duct_type not in ['rectangular', 'round']:
            validation_result['errors'].append("Duct type must be 'rectangular' or 'round'")
            validation_result['is_valid'] = False
        
        # Validate friction rate
        friction_rate = input_data.get('friction_rate', 0)
        if not isinstance(friction_rate, (int, float)) or friction_rate <= 0:
            validation_result['errors'].append("Friction rate must be a positive number")
            validation_result['is_valid'] = False
        elif friction_rate < 0.02:
            validation_result['warnings'].append("Very low friction rate - may result in oversized ducts")
        elif friction_rate > 0.5:
            validation_result['warnings'].append("High friction rate - may result in undersized ducts")
        
        # Validate units
        units = input_data.get('units', '')
        if units not in ['imperial', 'metric']:
            validation_result['errors'].append("Units must be 'imperial' or 'metric'")
            validation_result['is_valid'] = False
        
        return validation_result
    
    def calculate(self, input_data: Dict[str, Any]) -> CalculationResult:
        """
        Calculate air duct sizing based on SMACNA standards.
        """
        result = self._create_result(input_data)
        
        try:
            # Validate input
            validation = self.validate_input(input_data)
            if not validation['is_valid']:
                for error in validation['errors']:
                    result.add_error(error)
                return result
            
            for warning in validation['warnings']:
                result.add_warning(warning)
            
            # Convert to imperial units for calculation if needed
            calc_data = input_data.copy()
            if input_data['units'] == 'metric':
                calc_data = self._convert_to_imperial(input_data)
            
            # Perform calculation
            if calc_data['duct_type'] == 'round':
                sizing_result = self._calculate_round_duct(calc_data)
            else:
                sizing_result = self._calculate_rectangular_duct(calc_data)
            
            # Add results
            for key, value in sizing_result.items():
                if isinstance(value, dict) and 'value' in value:
                    result.add_result(key, value['value'], value.get('unit'))
                else:
                    result.add_result(key, value)
            
            # Convert results back to original units if needed
            if input_data['units'] == 'metric':
                result = self._convert_results_to_metric(result)
            
            # Validate against HVAC standards
            self._validate_compliance(result, calc_data)
            
            self._log_calculation(input_data, result)
            
        except Exception as e:
            result.add_error(f"Calculation failed: {str(e)}")
            self.logger.error("Air duct calculation failed", error=str(e), input_data=input_data)
        
        return result
    
    def _calculate_round_duct(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate round duct sizing."""
        airflow = data['airflow']
        friction_rate = data['friction_rate']
        
        # Find optimal diameter using friction chart
        diameter = self._find_optimal_round_diameter(airflow, friction_rate)
        
        # Calculate area and velocity
        area = math.pi * (diameter / 12) ** 2 / 4  # sq ft
        velocity = airflow / area  # FPM
        
        # Calculate equivalent diameter (same as diameter for round ducts)
        equivalent_diameter = diameter
        
        # Calculate pressure loss
        pressure_loss = self._calculate_pressure_loss(velocity, 100, diameter, data.get('material', 'galvanized_steel'))
        
        return {
            'duct_size': f'{diameter:.0f}" diameter',
            'diameter': {'value': diameter, 'unit': 'in'},
            'area': {'value': self._round_result(area), 'unit': 'sq_ft'},
            'velocity': {'value': self._round_result(velocity), 'unit': 'fpm'},
            'equivalent_diameter': {'value': diameter, 'unit': 'in'},
            'pressure_loss': {'value': self._round_result(pressure_loss, 4), 'unit': 'in_wg_per_100ft'}
        }
    
    def _calculate_rectangular_duct(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate rectangular duct sizing."""
        airflow = data['airflow']
        friction_rate = data['friction_rate']
        
        # Find optimal dimensions
        width, height = self._find_optimal_rectangular_dimensions(airflow, friction_rate)
        
        # Calculate area and velocity
        area = (width * height) / 144  # sq ft
        velocity = airflow / area  # FPM
        
        # Calculate equivalent diameter and hydraulic diameter
        equivalent_diameter = self.hvac_validator.calculate_equivalent_diameter(width, height)
        hydraulic_diameter = self.hvac_validator.calculate_hydraulic_diameter(width, height)
        aspect_ratio = self.hvac_validator.calculate_aspect_ratio(width, height)

        # Validate aspect ratio
        aspect_validation = self.hvac_validator.validate_aspect_ratio(width, height)

        # Calculate pressure loss
        pressure_loss = self._calculate_pressure_loss(velocity, 100, equivalent_diameter, data.get('material', 'galvanized_steel'))

        results = {
            'duct_size': f'{width:.0f}" x {height:.0f}"',
            'width': {'value': width, 'unit': 'in'},
            'height': {'value': height, 'unit': 'in'},
            'area': {'value': self._round_result(area), 'unit': 'sq_ft'},
            'velocity': {'value': self._round_result(velocity), 'unit': 'fpm'},
            'equivalent_diameter': {'value': self._round_result(equivalent_diameter), 'unit': 'in'},
            'hydraulic_diameter': {'value': self._round_result(hydraulic_diameter), 'unit': 'in'},
            'aspect_ratio': {'value': self._round_result(aspect_ratio, 2), 'unit': 'ratio'},
            'pressure_loss': {'value': self._round_result(pressure_loss, 4), 'unit': 'in_wg_per_100ft'}
        }

        # Add aspect ratio validation warnings to the result
        if not aspect_validation['compliant']:
            # This will be handled by the validation system
            pass

        return results
    
    def _find_optimal_round_diameter(self, airflow: float, target_friction: float) -> float:
        """
        Find optimal round duct diameter using SMACNA friction chart method.

        Args:
            airflow: Airflow in CFM
            target_friction: Target friction rate in inches w.g. per 100 feet

        Returns:
            Optimal diameter in inches
        """
        # SMACNA standard round duct sizes (inches)
        standard_sizes = [
            3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24,
            26, 28, 30, 32, 36, 40, 42, 48
        ]

        best_diameter = None
        best_score = float('inf')

        for diameter in standard_sizes:
            # Calculate area and velocity
            area = math.pi * (diameter / 12) ** 2 / 4  # sq ft
            velocity = airflow / area  # FPM

            # Check ASHRAE velocity limits
            if velocity < 400:  # Too low - poor air distribution
                continue
            if velocity > 2500:  # Too high - noise and pressure loss
                continue

            # Calculate actual friction rate
            actual_friction = self._calculate_pressure_loss(velocity, 100, diameter, 'galvanized_steel')

            # Score based on how close to target friction and optimal velocity range
            friction_score = abs(actual_friction - target_friction) / target_friction

            # Prefer velocities in optimal range (1000-2000 FPM for supply ducts)
            if 1000 <= velocity <= 2000:
                velocity_score = 0
            elif 800 <= velocity < 1000 or 2000 < velocity <= 2200:
                velocity_score = 0.1
            else:
                velocity_score = 0.3

            total_score = friction_score + velocity_score

            if total_score < best_score:
                best_score = total_score
                best_diameter = diameter

        # Fallback if no suitable diameter found
        if best_diameter is None:
            # Use simple area calculation with 1500 FPM target
            estimated_area = airflow / 1500
            estimated_diameter = math.sqrt(4 * estimated_area / math.pi) * 12
            best_diameter = min(standard_sizes, key=lambda d: abs(d - estimated_diameter))

        return float(best_diameter)
    
    def _find_optimal_rectangular_dimensions(self, airflow: float, target_friction: float) -> Tuple[float, float]:
        """
        Find optimal rectangular duct dimensions using SMACNA standards.

        Args:
            airflow: Airflow in CFM
            target_friction: Target friction rate in inches w.g. per 100 feet

        Returns:
            Tuple of (width, height) in inches
        """
        # SMACNA standard rectangular duct sizes (inches)
        standard_sizes = [
            4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24,
            26, 28, 30, 32, 36, 40, 42, 48, 54, 60
        ]

        best_width = None
        best_height = None
        best_score = float('inf')

        # Try different aspect ratios (SMACNA recommends 1:1 to 4:1)
        aspect_ratios = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0]

        for aspect_ratio in aspect_ratios:
            # Calculate dimensions for this aspect ratio
            estimated_area = airflow / 1500  # Target 1500 FPM
            height = math.sqrt(estimated_area / aspect_ratio) * 12  # inches
            width = aspect_ratio * height

            # Round to nearest standard sizes
            height_std = min(standard_sizes, key=lambda h: abs(h - height))
            width_std = min(standard_sizes, key=lambda w: abs(w - width))

            # Calculate actual area and velocity
            area = (width_std * height_std) / 144  # sq ft
            velocity = airflow / area  # FPM

            # Check ASHRAE velocity limits
            if velocity < 400 or velocity > 2500:
                continue

            # Calculate equivalent diameter and friction
            equiv_diameter = self.hvac_validator.calculate_equivalent_diameter(width_std, height_std)
            actual_friction = self._calculate_pressure_loss(velocity, 100, equiv_diameter, 'galvanized_steel')

            # Calculate actual aspect ratio
            actual_aspect_ratio = max(width_std, height_std) / min(width_std, height_std)

            # Score the solution
            friction_score = abs(actual_friction - target_friction) / target_friction

            # Prefer velocities in optimal range (1000-2000 FPM)
            if 1000 <= velocity <= 2000:
                velocity_score = 0
            elif 800 <= velocity < 1000 or 2000 < velocity <= 2200:
                velocity_score = 0.1
            else:
                velocity_score = 0.3

            # Prefer aspect ratios closer to 2:1 or 3:1 (optimal for fabrication)
            if 2.0 <= actual_aspect_ratio <= 3.0:
                aspect_score = 0
            elif 1.5 <= actual_aspect_ratio < 2.0 or 3.0 < actual_aspect_ratio <= 3.5:
                aspect_score = 0.1
            else:
                aspect_score = 0.2

            total_score = friction_score + velocity_score + aspect_score

            if total_score < best_score:
                best_score = total_score
                best_width = width_std
                best_height = height_std

        # Fallback if no suitable dimensions found
        if best_width is None or best_height is None:
            estimated_area = airflow / 1500
            height = math.sqrt(estimated_area / 2.5) * 12  # 2.5:1 aspect ratio
            width = 2.5 * height

            best_height = min(standard_sizes, key=lambda h: abs(h - height))
            best_width = min(standard_sizes, key=lambda w: abs(w - width))

        return float(best_width), float(best_height)

    def _calculate_pressure_loss(self, velocity: float, length: float, diameter: float, material: str) -> float:
        """
        Calculate pressure loss using Darcy-Weisbach equation per SMACNA standards.

        Args:
            velocity: Air velocity in FPM
            length: Duct length in feet
            diameter: Hydraulic diameter in inches
            material: Duct material type

        Returns:
            Pressure loss in inches of water per 100 feet
        """
        if velocity <= 0 or length <= 0 or diameter <= 0:
            return 0.0

        # Get material roughness factor (feet)
        roughness = self.roughness_factors.get(material, 0.0003)

        # Convert inputs to consistent units
        velocity_fps = velocity / 60  # Convert FPM to FPS
        diameter_ft = diameter / 12   # Convert inches to feet

        # Air properties at standard conditions (70°F, 14.7 psia)
        air_density = 0.075  # lb/ft³
        kinematic_viscosity = 1.57e-4  # ft²/s

        # Calculate Reynolds number
        reynolds = (velocity_fps * diameter_ft) / kinematic_viscosity

        # Calculate friction factor using Colebrook-White equation
        friction_factor = self._calculate_friction_factor(reynolds, roughness, diameter_ft)

        # Darcy-Weisbach equation for pressure loss
        # ΔP = f * (L/D) * (ρ * V²) / (2 * gc)
        # Convert to inches of water per 100 feet

        velocity_head = (velocity_fps ** 2) / (2 * 32.174)  # ft
        pressure_loss_ft = friction_factor * (length / diameter_ft) * velocity_head

        # Convert to inches of water per 100 feet
        pressure_loss_in_wg_per_100ft = (pressure_loss_ft * 12) * (100 / length) * (air_density / 62.4)

        return pressure_loss_in_wg_per_100ft

    def _calculate_friction_factor(self, reynolds: float, roughness: float, diameter: float) -> float:
        """
        Calculate friction factor using Colebrook-White equation with iterative solution.

        Args:
            reynolds: Reynolds number
            roughness: Surface roughness in feet
            diameter: Diameter in feet

        Returns:
            Friction factor (dimensionless)
        """
        if reynolds <= 0:
            return 0.0

        # Relative roughness
        relative_roughness = roughness / diameter

        if reynolds < 2300:
            # Laminar flow
            return 64 / reynolds
        elif reynolds < 4000:
            # Transition region - use interpolation
            f_laminar = 64 / 2300
            f_turbulent = self._colebrook_white_turbulent(4000, relative_roughness)
            # Linear interpolation
            factor = (reynolds - 2300) / (4000 - 2300)
            return f_laminar * (1 - factor) + f_turbulent * factor
        else:
            # Turbulent flow - use Colebrook-White equation
            return self._colebrook_white_turbulent(reynolds, relative_roughness)

    def _colebrook_white_turbulent(self, reynolds: float, relative_roughness: float) -> float:
        """
        Solve Colebrook-White equation for turbulent flow using iterative method.

        1/√f = -2 * log10(ε/D/3.7 + 2.51/(Re*√f))
        """
        # Initial guess using Swamee-Jain approximation
        f = 0.25 / (math.log10(relative_roughness / 3.7 + 5.74 / (reynolds ** 0.9))) ** 2

        # Iterative solution (Newton-Raphson method)
        for _ in range(10):  # Usually converges in 3-4 iterations
            f_sqrt = math.sqrt(f)
            term1 = relative_roughness / 3.7
            term2 = 2.51 / (reynolds * f_sqrt)

            # Function: F = 1/√f + 2*log10(ε/D/3.7 + 2.51/(Re*√f))
            F = 1 / f_sqrt + 2 * math.log10(term1 + term2)

            # Derivative: F' = -0.5/f^(3/2) - 2*2.51/(ln(10)*Re*f*(ε/D/3.7 + 2.51/(Re*√f)))
            df_df = -0.5 / (f ** 1.5) - (2 * 2.51) / (math.log(10) * reynolds * f * (term1 + term2))

            # Newton-Raphson update
            f_new = f - F / df_df

            # Check convergence
            if abs(f_new - f) < 1e-8:
                break

            f = max(f_new, 1e-6)  # Ensure positive value

        return f

    def _convert_to_imperial(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert metric input data to imperial for calculation."""
        converted = data.copy()

        # Convert airflow from L/s to CFM
        if 'airflow' in data:
            converted['airflow'] = self.units_converter.convert(data['airflow'], 'lps', 'cfm')

        # Convert friction rate from Pa/m to in. w.g./100 ft
        if 'friction_rate' in data:
            # Pa/m to in. w.g./100 ft conversion
            converted['friction_rate'] = data['friction_rate'] * 0.00401463 * 30.48

        converted['units'] = 'imperial'
        return converted

    def _convert_results_to_metric(self, result: CalculationResult) -> CalculationResult:
        """Convert calculation results from imperial to metric."""
        conversions = {
            'diameter': ('in', 'mm'),
            'width': ('in', 'mm'),
            'height': ('in', 'mm'),
            'area': ('sq_ft', 'sq_m'),
            'velocity': ('fpm', 'mps'),
            'equivalent_diameter': ('in', 'mm'),
            'pressure_loss': ('in_wg_per_100ft', 'pa_per_m')
        }

        for key, (from_unit, to_unit) in conversions.items():
            if key in result.results:
                if isinstance(result.results[key], dict) and 'value' in result.results[key]:
                    original_value = result.results[key]['value']
                    if from_unit == 'in_wg_per_100ft' and to_unit == 'pa_per_m':
                        # Special conversion for pressure loss
                        converted_value = original_value * 248.84 / 30.48
                    else:
                        converted_value = self.units_converter.convert(original_value, from_unit.replace('_per_100ft', '').replace('_per_m', ''), to_unit.replace('_per_100ft', '').replace('_per_m', ''))

                    result.results[key] = {
                        'value': self._round_result(converted_value),
                        'unit': to_unit
                    }

        # Update duct size string
        if 'duct_size' in result.results:
            if 'diameter' in result.results:
                diameter_mm = result.results['diameter']['value']
                result.results['duct_size'] = f'{diameter_mm:.0f}mm diameter'
            elif 'width' in result.results and 'height' in result.results:
                width_mm = result.results['width']['value']
                height_mm = result.results['height']['value']
                result.results['duct_size'] = f'{width_mm:.0f}mm x {height_mm:.0f}mm'

        return result

    def _validate_compliance(self, result: CalculationResult, calc_data: Dict[str, Any]):
        """Validate calculation results against HVAC standards."""
        # Extract velocity for validation
        velocity = None
        if 'velocity' in result.results:
            if isinstance(result.results['velocity'], dict):
                velocity = result.results['velocity']['value']
            else:
                velocity = result.results['velocity']

        if velocity is not None:
            # Prepare data for HVAC validator
            validation_data = {
                'velocity': velocity,
                'friction_rate': calc_data.get('friction_rate', 0),
                'duct_type': calc_data.get('duct_type', ''),
                'airflow': calc_data.get('airflow', 0)
            }

            # Add dimensions for rectangular ducts
            if calc_data.get('duct_type') == 'rectangular':
                if 'width' in result.results and 'height' in result.results:
                    width = result.results['width']['value'] if isinstance(result.results['width'], dict) else result.results['width']
                    height = result.results['height']['value'] if isinstance(result.results['height'], dict) else result.results['height']
                    validation_data['dimensions'] = {'width': width, 'height': height}

            # Validate against SMACNA standards
            smacna_result = self.hvac_validator.validate_smacna_compliance(validation_data)

            # Add compliance results
            result.add_compliance_check(
                'smacna', 'velocity', smacna_result.is_valid,
                velocity, 2500, 'Velocity within SMACNA limits'
            )

            # Add any errors or warnings from validation
            for error in smacna_result.errors:
                result.add_error(f"SMACNA: {error}")

            for warning in smacna_result.warnings:
                result.add_warning(f"SMACNA: {warning}")

    def get_standard_sizes(self, duct_type: str) -> list:
        """Get list of standard duct sizes."""
        if duct_type == 'round':
            return [4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36]
        else:  # rectangular
            sizes = [4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 42, 48]
            return [(w, h) for w in sizes for h in sizes if w >= h and w/h <= 4]

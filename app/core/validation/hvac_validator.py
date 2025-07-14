"""
HVAC Validator

Provides HVAC-specific validation logic for standards compliance (SMACNA, NFPA, ASHRAE).
"""

from typing import Dict, Any, List, Optional
import math
import structlog
from .schema_validator import ValidationResult

logger = structlog.get_logger()

class HVACValidator:
    """HVAC standards validation and compliance checking."""

    def __init__(self):
        self.standards = {
            'smacna': {
                'version': '2006',
                'max_velocity': {
                    'supply': 2500,  # FPM
                    'return': 2000,  # FPM
                    'exhaust': 2500  # FPM
                },
                'min_velocity': {
                    'supply': 600,   # FPM
                    'return': 500,   # FPM
                    'exhaust': 500   # FPM
                },
                'max_friction_rate': 0.5,  # in. w.g. per 100 ft
                'min_friction_rate': 0.02  # in. w.g. per 100 ft
            },
            'nfpa': {
                'version': '96-2021',
                'grease_duct': {
                    'min_velocity': 1500,  # FPM
                    'max_velocity': 3000,  # FPM
                    'min_slope': 0.25,     # inches per foot
                    'access_panel_spacing': 12  # feet
                }
            },
            'ashrae': {
                'version': '2021',
                'comfort_velocity': {
                    'occupied_zone': 50,   # FPM max
                    'unoccupied_zone': 200 # FPM max
                }
            }
        }

    def validate_smacna_compliance(self, calculation_data: Dict[str, Any]) -> ValidationResult:
        """Validate calculation against SMACNA standards."""
        result = ValidationResult()

        try:
            # Extract relevant data
            velocity = calculation_data.get('velocity', 0)
            friction_rate = calculation_data.get('friction_rate', 0)
            duct_type = calculation_data.get('duct_type', '')
            airflow = calculation_data.get('airflow', 0)

            smacna = self.standards['smacna']

            # Velocity validation
            if velocity > smacna['max_velocity']['supply']:
                result.add_error(f"Velocity {velocity} FPM exceeds SMACNA maximum of {smacna['max_velocity']['supply']} FPM")
            elif velocity < smacna['min_velocity']['supply']:
                result.add_warning(f"Velocity {velocity} FPM is below SMACNA recommended minimum of {smacna['min_velocity']['supply']} FPM")

            # Friction rate validation
            if friction_rate > smacna['max_friction_rate']:
                result.add_error(f"Friction rate {friction_rate} exceeds SMACNA maximum of {smacna['max_friction_rate']} in. w.g./100 ft")
            elif friction_rate < smacna['min_friction_rate']:
                result.add_warning(f"Friction rate {friction_rate} is below SMACNA recommended minimum of {smacna['min_friction_rate']} in. w.g./100 ft")

            # Duct sizing validation
            if duct_type == 'rectangular':
                dimensions = calculation_data.get('dimensions', {})
                width = dimensions.get('width', 0)
                height = dimensions.get('height', 0)

                if width > 0 and height > 0:
                    aspect_ratio = max(width, height) / min(width, height)
                    if aspect_ratio > 4:
                        result.add_warning(f"Aspect ratio {aspect_ratio:.1f}:1 exceeds recommended maximum of 4:1")

            # Additional SMACNA checks
            if airflow > 0 and velocity > 0:
                calculated_area = airflow / velocity  # sq ft
                if calculated_area < 0.1:
                    result.add_warning("Very small duct area. Consider minimum duct size requirements.")

            logger.info("SMACNA validation completed",
                       velocity=velocity,
                       friction_rate=friction_rate,
                       compliant=result.is_valid)

        except Exception as e:
            result.add_error(f"SMACNA validation error: {str(e)}")
            logger.error("SMACNA validation failed", error=str(e))

        return result

    def validate_nfpa_compliance(self, calculation_data: Dict[str, Any]) -> ValidationResult:
        """Validate calculation against NFPA 96 standards for grease ducts."""
        result = ValidationResult()

        try:
            velocity = calculation_data.get('velocity', 0)
            duct_type = calculation_data.get('duct_type', '')

            if duct_type == 'grease':
                nfpa = self.standards['nfpa']['grease_duct']

                # Velocity validation for grease ducts
                if velocity < nfpa['min_velocity']:
                    result.add_error(f"Grease duct velocity {velocity} FPM is below NFPA 96 minimum of {nfpa['min_velocity']} FPM")
                elif velocity > nfpa['max_velocity']:
                    result.add_warning(f"Grease duct velocity {velocity} FPM exceeds NFPA 96 recommended maximum of {nfpa['max_velocity']} FPM")

                # Slope validation
                slope = calculation_data.get('slope', 0)
                if slope < nfpa['min_slope']:
                    result.add_error(f"Grease duct slope {slope} in/ft is below NFPA 96 minimum of {nfpa['min_slope']} in/ft")

                # Access panel spacing
                length = calculation_data.get('length', 0)
                if length > nfpa['access_panel_spacing']:
                    result.add_warning(f"Duct length {length} ft may require access panels per NFPA 96 (every {nfpa['access_panel_spacing']} ft)")

            logger.info("NFPA validation completed", compliant=result.is_valid)

        except Exception as e:
            result.add_error(f"NFPA validation error: {str(e)}")
            logger.error("NFPA validation failed", error=str(e))

        return result

    def validate_ashrae_compliance(self, calculation_data: Dict[str, Any]) -> ValidationResult:
        """Validate calculation against ASHRAE standards."""
        result = ValidationResult()

        try:
            velocity = calculation_data.get('velocity', 0)
            location = calculation_data.get('location', 'unoccupied')

            ashrae = self.standards['ashrae']['comfort_velocity']

            if location == 'occupied':
                if velocity > ashrae['occupied_zone']:
                    result.add_warning(f"Velocity {velocity} FPM in occupied zone exceeds ASHRAE comfort limit of {ashrae['occupied_zone']} FPM")
            else:
                if velocity > ashrae['unoccupied_zone']:
                    result.add_warning(f"Velocity {velocity} FPM exceeds ASHRAE general limit of {ashrae['unoccupied_zone']} FPM")

            logger.info("ASHRAE validation completed", compliant=result.is_valid)

        except Exception as e:
            result.add_error(f"ASHRAE validation error: {str(e)}")
            logger.error("ASHRAE validation failed", error=str(e))

        return result

    def validate_all_standards(self, calculation_data: Dict[str, Any]) -> Dict[str, ValidationResult]:
        """Validate against all applicable standards."""
        results = {}

        # Always check SMACNA for general ductwork
        results['smacna'] = self.validate_smacna_compliance(calculation_data)

        # Check NFPA if it's a grease duct
        duct_type = calculation_data.get('duct_type', '')
        if duct_type == 'grease':
            results['nfpa'] = self.validate_nfpa_compliance(calculation_data)

        # Check ASHRAE for comfort considerations
        results['ashrae'] = self.validate_ashrae_compliance(calculation_data)

        return results

    def calculate_equivalent_diameter(self, width: float, height: float) -> float:
        """
        Calculate equivalent diameter for rectangular duct per SMACNA standards.

        Args:
            width: Duct width in inches
            height: Duct height in inches

        Returns:
            Equivalent diameter in inches
        """
        if width <= 0 or height <= 0:
            return 0

        # SMACNA equivalent diameter formula
        # De = 1.3 * (a*b)^0.625 / (a+b)^0.25
        return 1.3 * ((width * height) ** 0.625) / ((width + height) ** 0.25)

    def calculate_hydraulic_diameter(self, width: float, height: float) -> float:
        """
        Calculate hydraulic diameter for rectangular duct.

        Args:
            width: Duct width in inches
            height: Duct height in inches

        Returns:
            Hydraulic diameter in inches
        """
        if width <= 0 or height <= 0:
            return 0

        # Hydraulic diameter formula: Dh = 4*A/P
        area = width * height
        perimeter = 2 * (width + height)
        return 4 * area / perimeter

    def calculate_aspect_ratio(self, width: float, height: float) -> float:
        """
        Calculate aspect ratio for rectangular duct.

        Args:
            width: Duct width in inches
            height: Duct height in inches

        Returns:
            Aspect ratio (larger dimension / smaller dimension)
        """
        if width <= 0 or height <= 0:
            return 0

        return max(width, height) / min(width, height)

    def validate_aspect_ratio(self, width: float, height: float) -> Dict[str, Any]:
        """
        Validate aspect ratio per SMACNA standards.

        Args:
            width: Duct width in inches
            height: Duct height in inches

        Returns:
            Validation result with compliance status and warnings
        """
        aspect_ratio = self.calculate_aspect_ratio(width, height)

        result = {
            'aspect_ratio': aspect_ratio,
            'compliant': True,
            'warnings': [],
            'recommendations': []
        }

        # SMACNA recommendations for aspect ratio
        if aspect_ratio > 4.0:
            result['compliant'] = False
            result['warnings'].append(
                f"Aspect ratio {aspect_ratio:.1f}:1 exceeds SMACNA maximum of 4:1"
            )
            result['recommendations'].append(
                "Consider using round duct or reducing aspect ratio for better performance"
            )
        elif aspect_ratio > 3.0:
            result['warnings'].append(
                f"Aspect ratio {aspect_ratio:.1f}:1 is high - consider optimization"
            )
            result['recommendations'].append(
                "Aspect ratios between 2:1 and 3:1 are optimal for fabrication and performance"
            )
        elif aspect_ratio < 1.5:
            result['warnings'].append(
                f"Aspect ratio {aspect_ratio:.1f}:1 is very low - may be inefficient"
            )
            result['recommendations'].append(
                "Consider increasing aspect ratio for better material utilization"
            )

        return result

    def calculate_velocity(self, airflow: float, area: float) -> float:
        """Calculate velocity from airflow and area."""
        if area <= 0:
            return 0
        return airflow / area

    def calculate_friction_loss(self, velocity: float, length: float, equivalent_diameter: float,
                              roughness: float = 0.0003) -> float:
        """Calculate friction loss using Darcy-Weisbach equation."""
        if velocity <= 0 or length <= 0 or equivalent_diameter <= 0:
            return 0

        # Convert to consistent units and calculate
        reynolds = (velocity * equivalent_diameter) / 1.5e-4  # Approximate for air

        # Friction factor (simplified Colebrook equation)
        if reynolds > 2300:  # Turbulent flow
            friction_factor = 0.25 / (math.log10(roughness / (3.7 * equivalent_diameter) + 5.74 / (reynolds ** 0.9))) ** 2
        else:  # Laminar flow
            friction_factor = 64 / reynolds

        # Pressure loss in inches of water
        pressure_loss = friction_factor * (length / equivalent_diameter) * (velocity ** 2) / (2 * 32.174 * 12)

        return pressure_loss

    def get_standard_info(self, standard_name: str) -> Optional[Dict[str, Any]]:
        """Get information about a specific standard."""
        return self.standards.get(standard_name)

    def list_standards(self) -> List[str]:
        """List all available standards."""
        return list(self.standards.keys())

    def validate_velocity_enhanced(self, velocity: float, room_type: str = 'office', duct_type: str = 'supply') -> Dict[str, Any]:
        """
        Validate air velocity per ASHRAE 2021 Fundamentals Chapter 21 standards.

        Args:
            velocity: Air velocity in FPM
            room_type: Type of room/space
            duct_type: Type of duct (supply, return, exhaust)

        Returns:
            Validation result with compliance status and warnings
        """
        result = {
            'velocity': velocity,
            'room_type': room_type,
            'duct_type': duct_type,
            'compliant': True,
            'warnings': [],
            'errors': [],
            'standard_reference': 'ASHRAE 2021 Fundamentals Chapter 21'
        }

        # ASHRAE velocity limits by room type and duct type
        velocity_limits = {
            'supply': {
                'office': {'min': 400, 'max': 1500, 'recommended_max': 1200, 'optimal': 1000},
                'conference': {'min': 300, 'max': 1200, 'recommended_max': 1000, 'optimal': 800},
                'classroom': {'min': 300, 'max': 1200, 'recommended_max': 1000, 'optimal': 800},
                'retail': {'min': 400, 'max': 1800, 'recommended_max': 1500, 'optimal': 1200},
                'warehouse': {'min': 600, 'max': 2500, 'recommended_max': 2000, 'optimal': 1500},
                'kitchen': {'min': 800, 'max': 2000, 'recommended_max': 1800, 'optimal': 1500},
                'mechanical': {'min': 1000, 'max': 3000, 'recommended_max': 2500, 'optimal': 2000},
                'hospital': {'min': 300, 'max': 1000, 'recommended_max': 800, 'optimal': 600},
                'laboratory': {'min': 1000, 'max': 2500, 'recommended_max': 2000, 'optimal': 1500}
            },
            'return': {
                'office': {'min': 300, 'max': 1200, 'recommended_max': 1000, 'optimal': 800},
                'conference': {'min': 300, 'max': 1000, 'recommended_max': 800, 'optimal': 600},
                'classroom': {'min': 300, 'max': 1000, 'recommended_max': 800, 'optimal': 600},
                'retail': {'min': 400, 'max': 1500, 'recommended_max': 1200, 'optimal': 1000},
                'warehouse': {'min': 500, 'max': 2000, 'recommended_max': 1500, 'optimal': 1200},
                'kitchen': {'min': 600, 'max': 1500, 'recommended_max': 1200, 'optimal': 1000},
                'mechanical': {'min': 800, 'max': 2500, 'recommended_max': 2000, 'optimal': 1500}
            },
            'exhaust': {
                'office': {'min': 500, 'max': 2000, 'recommended_max': 1500, 'optimal': 1200},
                'kitchen': {'min': 1200, 'max': 3000, 'recommended_max': 2500, 'optimal': 2000},
                'laboratory': {'min': 1500, 'max': 3500, 'recommended_max': 3000, 'optimal': 2500},
                'bathroom': {'min': 800, 'max': 2000, 'recommended_max': 1500, 'optimal': 1200}
            }
        }

        # Get limits for the specific duct type and room type
        duct_limits = velocity_limits.get(duct_type, velocity_limits['supply'])
        limits = duct_limits.get(room_type, duct_limits.get('office', duct_limits[list(duct_limits.keys())[0]]))

        # Validate velocity
        if velocity < limits['min']:
            result['compliant'] = False
            result['errors'].append(
                f"Velocity {velocity:.0f} FPM is below minimum {limits['min']} FPM for {room_type} {duct_type} duct (ASHRAE 2021)"
            )
        elif velocity > limits['max']:
            result['compliant'] = False
            result['errors'].append(
                f"Velocity {velocity:.0f} FPM exceeds maximum {limits['max']} FPM for {room_type} {duct_type} duct (ASHRAE 2021)"
            )
        elif velocity > limits['recommended_max']:
            result['warnings'].append(
                f"Velocity {velocity:.0f} FPM exceeds recommended maximum {limits['recommended_max']} FPM for {room_type} {duct_type} duct"
            )
        elif velocity < limits['optimal'] * 0.8:
            result['warnings'].append(
                f"Velocity {velocity:.0f} FPM is below optimal range ({limits['optimal']} FPM ±20%) for {room_type} {duct_type} duct"
            )
        elif velocity > limits['optimal'] * 1.2:
            result['warnings'].append(
                f"Velocity {velocity:.0f} FPM is above optimal range ({limits['optimal']} FPM ±20%) for {room_type} {duct_type} duct"
            )

        return result

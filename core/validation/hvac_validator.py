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
        """Calculate equivalent diameter for rectangular duct."""
        if width <= 0 or height <= 0:
            return 0
        
        # SMACNA equivalent diameter formula
        return 1.3 * ((width * height) ** 0.625) / ((width + height) ** 0.25)
    
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

"""
Air Duct Sizer Logic

Business logic for air duct sizing calculations.
"""

import sys
import os
from typing import Dict, Any

# Add project root to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))

from app.core.calculations.air_duct_calculator import AirDuctCalculator
from app.core.validation.schema_validator import SchemaValidator
import structlog

logger = structlog.get_logger()

class AirDuctSizerLogic:
    """Business logic for the Air Duct Sizer module."""
    
    def __init__(self):
        self.calculator = AirDuctCalculator()
        self.validator = SchemaValidator()
    
    def calculate_duct_size(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate air duct size based on input parameters.
        
        Args:
            input_data: Dictionary containing calculation parameters
            
        Returns:
            Dictionary with calculation results and validation information
        """
        try:
            # Validate input data
            validation_result = self.validator.validate_air_duct_input(input_data)
            
            if not validation_result.is_valid:
                return {
                    'success': False,
                    'errors': validation_result.errors,
                    'warnings': validation_result.warnings
                }
            
            # Perform calculation
            calc_result = self.calculator.calculate(input_data)
            
            # Format response
            response = {
                'success': calc_result.is_valid(),
                'input_data': calc_result.input_data,
                'results': calc_result.results,
                'compliance': calc_result.compliance,
                'warnings': calc_result.warnings + validation_result.warnings,
                'errors': calc_result.errors,
                'metadata': calc_result.metadata
            }
            
            logger.info("Air duct calculation completed", 
                       success=response['success'],
                       warnings_count=len(response['warnings']),
                       errors_count=len(response['errors']))
            
            return response
            
        except Exception as e:
            logger.error("Air duct calculation failed", error=str(e))
            return {
                'success': False,
                'errors': [f"Calculation failed: {str(e)}"],
                'warnings': []
            }
    
    def validate_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate input data without performing calculation.
        
        Args:
            input_data: Dictionary containing input parameters
            
        Returns:
            Dictionary with validation results
        """
        try:
            validation_result = self.validator.validate_air_duct_input(input_data)
            
            return {
                'is_valid': validation_result.is_valid,
                'errors': validation_result.errors,
                'warnings': validation_result.warnings
            }
            
        except Exception as e:
            logger.error("Input validation failed", error=str(e))
            return {
                'is_valid': False,
                'errors': [f"Validation failed: {str(e)}"],
                'warnings': []
            }
    
    def get_standard_sizes(self, duct_type: str) -> Dict[str, Any]:
        """
        Get standard duct sizes for the specified type.
        
        Args:
            duct_type: 'round' or 'rectangular'
            
        Returns:
            Dictionary with standard sizes
        """
        try:
            sizes = self.calculator.get_standard_sizes(duct_type)
            
            return {
                'success': True,
                'duct_type': duct_type,
                'sizes': sizes
            }
            
        except Exception as e:
            logger.error("Failed to get standard sizes", error=str(e))
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_material_options(self) -> Dict[str, Any]:
        """Get available duct material options."""
        materials = {
            'galvanized_steel': {
                'name': 'Galvanized Steel',
                'roughness': 0.0003,
                'description': 'Standard galvanized steel ductwork'
            },
            'aluminum': {
                'name': 'Aluminum',
                'roughness': 0.0002,
                'description': 'Lightweight aluminum ductwork'
            },
            'stainless_steel': {
                'name': 'Stainless Steel',
                'roughness': 0.0002,
                'description': 'Corrosion-resistant stainless steel'
            },
            'pvc': {
                'name': 'PVC',
                'roughness': 0.0001,
                'description': 'Plastic PVC ductwork'
            },
            'fiberglass': {
                'name': 'Fiberglass',
                'roughness': 0.0005,
                'description': 'Insulated fiberglass ductwork'
            }
        }
        
        return {
            'success': True,
            'materials': materials
        }
    
    def get_calculation_info(self) -> Dict[str, Any]:
        """Get information about the calculation module."""
        return {
            'module_id': 'air-duct-sizer',
            'name': 'Air Duct Sizer',
            'version': '0.1.0',
            'description': 'SMACNA-compliant air duct sizing calculations',
            'standards': ['SMACNA 2006'],
            'supported_units': ['imperial', 'metric'],
            'duct_types': ['round', 'rectangular'],
            'parameters': {
                'required': ['airflow', 'duct_type', 'friction_rate', 'units'],
                'optional': ['material', 'insulation']
            }
        }

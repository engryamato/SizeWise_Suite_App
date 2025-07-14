"""
Base Calculator

Abstract base class for all HVAC calculation modules.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import structlog
from datetime import datetime

logger = structlog.get_logger()

class CalculationResult:
    """Container for calculation results."""
    
    def __init__(self, module_id: str, input_data: Dict[str, Any]):
        self.module_id = module_id
        self.input_data = input_data
        self.results = {}
        self.compliance = {}
        self.warnings = []
        self.errors = []
        self.metadata = {
            'calculated_at': datetime.now().isoformat(),
            'version': '0.1.0'
        }
    
    def add_result(self, key: str, value: Any, unit: Optional[str] = None):
        """Add a calculation result."""
        if unit:
            self.results[key] = {'value': value, 'unit': unit}
        else:
            self.results[key] = value
    
    def add_compliance_check(self, standard: str, parameter: str, passed: bool, 
                           value: Any = None, limit: Any = None, message: str = None):
        """Add a compliance check result."""
        if standard not in self.compliance:
            self.compliance[standard] = {}
        
        self.compliance[standard][parameter] = {
            'passed': passed,
            'value': value,
            'limit': limit,
            'message': message
        }
    
    def add_warning(self, message: str):
        """Add a warning message."""
        self.warnings.append(message)
    
    def add_error(self, message: str):
        """Add an error message."""
        self.errors.append(message)
    
    def is_valid(self) -> bool:
        """Check if calculation completed without errors."""
        return len(self.errors) == 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary."""
        return {
            'module_id': self.module_id,
            'input_data': self.input_data,
            'results': self.results,
            'compliance': self.compliance,
            'warnings': self.warnings,
            'errors': self.errors,
            'metadata': self.metadata
        }

class BaseCalculator(ABC):
    """Abstract base class for all calculators."""
    
    def __init__(self, module_id: str):
        self.module_id = module_id
        self.logger = structlog.get_logger().bind(module=module_id)
    
    @abstractmethod
    def calculate(self, input_data: Dict[str, Any]) -> CalculationResult:
        """
        Perform the calculation.
        
        Args:
            input_data: Dictionary containing input parameters
            
        Returns:
            CalculationResult object with results and compliance information
        """
        pass
    
    @abstractmethod
    def validate_input(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validate input data.
        
        Args:
            input_data: Dictionary containing input parameters
            
        Returns:
            Dictionary with validation results
        """
        pass
    
    def _create_result(self, input_data: Dict[str, Any]) -> CalculationResult:
        """Create a new calculation result object."""
        return CalculationResult(self.module_id, input_data)
    
    def _log_calculation(self, input_data: Dict[str, Any], result: CalculationResult):
        """Log calculation details."""
        self.logger.info(
            "Calculation completed",
            input_data=input_data,
            success=result.is_valid(),
            warnings_count=len(result.warnings),
            errors_count=len(result.errors)
        )
    
    def _safe_divide(self, numerator: float, denominator: float, default: float = 0.0) -> float:
        """Safely divide two numbers, returning default if denominator is zero."""
        if denominator == 0:
            return default
        return numerator / denominator
    
    def _round_result(self, value: float, precision: int = 2) -> float:
        """Round a result to specified precision."""
        if isinstance(value, (int, float)):
            return round(value, precision)
        return value
    
    def _validate_positive(self, value: float, name: str, result: CalculationResult) -> bool:
        """Validate that a value is positive."""
        if value <= 0:
            result.add_error(f"{name} must be positive, got {value}")
            return False
        return True
    
    def _validate_range(self, value: float, name: str, min_val: float, max_val: float, 
                       result: CalculationResult) -> bool:
        """Validate that a value is within a specified range."""
        if value < min_val or value > max_val:
            result.add_error(f"{name} must be between {min_val} and {max_val}, got {value}")
            return False
        return True
    
    def _check_reasonable_value(self, value: float, name: str, typical_min: float, 
                               typical_max: float, result: CalculationResult):
        """Check if a value is within reasonable/typical ranges and add warnings if not."""
        if value < typical_min:
            result.add_warning(f"{name} value {value} is unusually low (typical minimum: {typical_min})")
        elif value > typical_max:
            result.add_warning(f"{name} value {value} is unusually high (typical maximum: {typical_max})")
    
    def get_module_info(self) -> Dict[str, Any]:
        """Get information about this calculator module."""
        return {
            'module_id': self.module_id,
            'version': '0.1.0',
            'description': self.__doc__ or 'HVAC calculation module',
            'supported_units': ['imperial', 'metric']
        }

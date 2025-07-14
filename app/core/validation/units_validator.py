"""
Units Validator

Validates unit conversions and ensures consistency across the application.
"""

from typing import Dict, Any, List, Optional, Tuple
import structlog
from .schema_validator import ValidationResult

logger = structlog.get_logger()

class UnitsValidator:
    """Validates units and unit conversions."""
    
    def __init__(self):
        self.valid_units = {
            'imperial': {
                'length': ['ft', 'in', 'yd'],
                'area': ['sq_ft', 'sq_in'],
                'volume': ['cu_ft', 'cu_in'],
                'flow': ['cfm', 'cfs'],
                'pressure': ['in_wg', 'psi', 'psf'],
                'velocity': ['fpm', 'fps', 'mph'],
                'temperature': ['f', 'r'],
                'mass': ['lb', 'oz'],
                'force': ['lbf'],
                'power': ['hp', 'btu_hr']
            },
            'metric': {
                'length': ['m', 'mm', 'cm', 'km'],
                'area': ['sq_m', 'sq_mm', 'sq_cm'],
                'volume': ['cu_m', 'l', 'ml'],
                'flow': ['cms', 'lps', 'lpm'],
                'pressure': ['pa', 'kpa', 'bar'],
                'velocity': ['mps', 'kmh'],
                'temperature': ['c', 'k'],
                'mass': ['kg', 'g'],
                'force': ['n'],
                'power': ['w', 'kw']
            }
        }
        
        self.unit_categories = {
            # Imperial units
            'ft': 'length', 'in': 'length', 'yd': 'length',
            'sq_ft': 'area', 'sq_in': 'area',
            'cu_ft': 'volume', 'cu_in': 'volume',
            'cfm': 'flow', 'cfs': 'flow',
            'in_wg': 'pressure', 'psi': 'pressure', 'psf': 'pressure',
            'fpm': 'velocity', 'fps': 'velocity', 'mph': 'velocity',
            'f': 'temperature', 'r': 'temperature',
            'lb': 'mass', 'oz': 'mass',
            'lbf': 'force',
            'hp': 'power', 'btu_hr': 'power',
            
            # Metric units
            'm': 'length', 'mm': 'length', 'cm': 'length', 'km': 'length',
            'sq_m': 'area', 'sq_mm': 'area', 'sq_cm': 'area',
            'cu_m': 'volume', 'l': 'volume', 'ml': 'volume',
            'cms': 'flow', 'lps': 'flow', 'lpm': 'flow',
            'pa': 'pressure', 'kpa': 'pressure', 'bar': 'pressure',
            'mps': 'velocity', 'kmh': 'velocity',
            'c': 'temperature', 'k': 'temperature',
            'kg': 'mass', 'g': 'mass',
            'n': 'force',
            'w': 'power', 'kw': 'power'
        }
        
        # Conversion factors to base units
        self.conversion_factors = {
            # Length to meters
            'ft': 0.3048, 'in': 0.0254, 'yd': 0.9144, 'mm': 0.001, 'cm': 0.01, 'km': 1000, 'm': 1,
            
            # Area to square meters
            'sq_ft': 0.092903, 'sq_in': 0.00064516, 'sq_mm': 1e-6, 'sq_cm': 1e-4, 'sq_m': 1,
            
            # Volume to cubic meters
            'cu_ft': 0.0283168, 'cu_in': 1.6387e-5, 'l': 0.001, 'ml': 1e-6, 'cu_m': 1,
            
            # Flow to cubic meters per second
            'cfm': 0.000471947, 'cfs': 0.0283168, 'lps': 0.001, 'lpm': 1.6667e-5, 'cms': 1,
            
            # Pressure to Pascals
            'in_wg': 248.84, 'psi': 6894.76, 'psf': 47.8803, 'kpa': 1000, 'bar': 100000, 'pa': 1,
            
            # Velocity to meters per second
            'fpm': 0.00508, 'fps': 0.3048, 'mph': 0.44704, 'kmh': 0.277778, 'mps': 1,
            
            # Mass to kilograms
            'lb': 0.453592, 'oz': 0.0283495, 'g': 0.001, 'kg': 1,
            
            # Force to Newtons
            'lbf': 4.44822, 'n': 1,
            
            # Power to Watts
            'hp': 745.7, 'btu_hr': 0.293071, 'kw': 1000, 'w': 1
        }
    
    def validate_unit(self, unit: str, expected_category: Optional[str] = None) -> ValidationResult:
        """Validate a single unit."""
        result = ValidationResult()
        
        if not unit:
            result.add_error("Unit cannot be empty")
            return result
        
        unit_lower = unit.lower()
        
        if unit_lower not in self.unit_categories:
            result.add_error(f"Unknown unit: {unit}")
            return result
        
        if expected_category:
            actual_category = self.unit_categories[unit_lower]
            if actual_category != expected_category:
                result.add_error(f"Unit {unit} is {actual_category}, expected {expected_category}")
        
        return result
    
    def validate_unit_consistency(self, data: Dict[str, Any], unit_system: str) -> ValidationResult:
        """Validate that all units in data are consistent with the specified unit system."""
        result = ValidationResult()
        
        if unit_system not in ['imperial', 'metric']:
            result.add_error(f"Invalid unit system: {unit_system}")
            return result
        
        # Check each field that might contain units
        unit_fields = ['length_unit', 'area_unit', 'flow_unit', 'pressure_unit', 'velocity_unit']
        
        for field in unit_fields:
            if field in data:
                unit = data[field].lower()
                if unit in self.unit_categories:
                    category = self.unit_categories[unit]
                    valid_units = self.valid_units[unit_system][category]
                    
                    if unit not in valid_units:
                        result.add_error(f"Unit {unit} is not valid for {unit_system} system in category {category}")
        
        return result
    
    def validate_conversion(self, from_unit: str, to_unit: str, value: float) -> ValidationResult:
        """Validate a unit conversion."""
        result = ValidationResult()
        
        # Validate individual units
        from_validation = self.validate_unit(from_unit)
        to_validation = self.validate_unit(to_unit)
        
        if not from_validation.is_valid:
            result.errors.extend(from_validation.errors)
        if not to_validation.is_valid:
            result.errors.extend(to_validation.errors)
        
        if not result.is_valid:
            return result
        
        # Check if units are in the same category
        from_category = self.unit_categories[from_unit.lower()]
        to_category = self.unit_categories[to_unit.lower()]
        
        if from_category != to_category:
            result.add_error(f"Cannot convert between different categories: {from_category} to {to_category}")
            return result
        
        # Validate value
        if not isinstance(value, (int, float)):
            result.add_error("Value must be a number")
            return result
        
        # Check for reasonable values
        if value < 0 and from_category not in ['temperature']:
            result.add_warning("Negative values may not be meaningful for this unit type")
        
        if abs(value) > 1e10:
            result.add_warning("Very large values may cause precision issues")
        
        return result
    
    def get_unit_category(self, unit: str) -> Optional[str]:
        """Get the category of a unit."""
        return self.unit_categories.get(unit.lower())
    
    def get_valid_units(self, unit_system: str, category: str) -> List[str]:
        """Get valid units for a system and category."""
        if unit_system not in self.valid_units:
            return []
        if category not in self.valid_units[unit_system]:
            return []
        return self.valid_units[unit_system][category]
    
    def is_compatible(self, unit1: str, unit2: str) -> bool:
        """Check if two units are compatible (same category)."""
        cat1 = self.get_unit_category(unit1)
        cat2 = self.get_unit_category(unit2)
        return cat1 is not None and cat1 == cat2
    
    def get_conversion_factor(self, from_unit: str, to_unit: str) -> Optional[float]:
        """Get conversion factor between two units."""
        from_unit_lower = from_unit.lower()
        to_unit_lower = to_unit.lower()
        
        if not self.is_compatible(from_unit, to_unit):
            return None
        
        if from_unit_lower not in self.conversion_factors or to_unit_lower not in self.conversion_factors:
            return None
        
        # Convert through base unit
        from_factor = self.conversion_factors[from_unit_lower]
        to_factor = self.conversion_factors[to_unit_lower]
        
        return from_factor / to_factor
    
    def convert_value(self, value: float, from_unit: str, to_unit: str) -> Tuple[Optional[float], ValidationResult]:
        """Convert a value between units."""
        result = self.validate_conversion(from_unit, to_unit, value)
        
        if not result.is_valid:
            return None, result
        
        factor = self.get_conversion_factor(from_unit, to_unit)
        if factor is None:
            result.add_error(f"No conversion available from {from_unit} to {to_unit}")
            return None, result
        
        # Handle temperature conversions separately (they have offsets)
        if self.get_unit_category(from_unit) == 'temperature':
            converted_value = self._convert_temperature(value, from_unit, to_unit)
        else:
            converted_value = value * factor
        
        return converted_value, result
    
    def _convert_temperature(self, value: float, from_unit: str, to_unit: str) -> float:
        """Convert temperature values (handles offsets)."""
        from_unit_lower = from_unit.lower()
        to_unit_lower = to_unit.lower()
        
        # Convert to Celsius first
        if from_unit_lower == 'f':
            celsius = (value - 32) * 5/9
        elif from_unit_lower == 'k':
            celsius = value - 273.15
        elif from_unit_lower == 'r':
            celsius = (value - 491.67) * 5/9
        else:  # Celsius
            celsius = value
        
        # Convert from Celsius to target
        if to_unit_lower == 'f':
            return celsius * 9/5 + 32
        elif to_unit_lower == 'k':
            return celsius + 273.15
        elif to_unit_lower == 'r':
            return (celsius + 273.15) * 9/5
        else:  # Celsius
            return celsius
    
    def validate_hvac_units(self, calculation_data: Dict[str, Any]) -> ValidationResult:
        """Validate units specific to HVAC calculations."""
        result = ValidationResult()
        
        # Common HVAC unit validations
        if 'airflow' in calculation_data and 'flow_unit' in calculation_data:
            flow_unit = calculation_data['flow_unit']
            if self.get_unit_category(flow_unit) != 'flow':
                result.add_error(f"Airflow unit {flow_unit} is not a valid flow unit")
        
        if 'pressure' in calculation_data and 'pressure_unit' in calculation_data:
            pressure_unit = calculation_data['pressure_unit']
            if self.get_unit_category(pressure_unit) != 'pressure':
                result.add_error(f"Pressure unit {pressure_unit} is not a valid pressure unit")
        
        if 'velocity' in calculation_data and 'velocity_unit' in calculation_data:
            velocity_unit = calculation_data['velocity_unit']
            if self.get_unit_category(velocity_unit) != 'velocity':
                result.add_error(f"Velocity unit {velocity_unit} is not a valid velocity unit")
        
        return result

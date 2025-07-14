"""
Units Converter

Comprehensive unit conversion system for HVAC calculations.
"""

import math
from typing import Dict, Any, Optional, Union
import structlog

logger = structlog.get_logger()

class UnitsConverter:
    """Handles unit conversions between Imperial and Metric systems."""
    
    def __init__(self):
        # Conversion factors to base SI units
        self.conversions = {
            # Length conversions (to meters)
            'length': {
                'ft': 0.3048,
                'in': 0.0254,
                'yd': 0.9144,
                'm': 1.0,
                'mm': 0.001,
                'cm': 0.01,
                'km': 1000.0
            },
            
            # Area conversions (to square meters)
            'area': {
                'sq_ft': 0.092903,
                'sq_in': 0.00064516,
                'sq_m': 1.0,
                'sq_mm': 1e-6,
                'sq_cm': 1e-4
            },
            
            # Volume conversions (to cubic meters)
            'volume': {
                'cu_ft': 0.0283168,
                'cu_in': 1.6387e-5,
                'cu_m': 1.0,
                'l': 0.001,
                'ml': 1e-6,
                'gal': 0.00378541  # US gallon
            },
            
            # Flow rate conversions (to cubic meters per second)
            'flow': {
                'cfm': 0.000471947,  # cubic feet per minute
                'cfs': 0.0283168,    # cubic feet per second
                'cms': 1.0,          # cubic meters per second
                'lps': 0.001,        # liters per second
                'lpm': 1.6667e-5,    # liters per minute
                'gpm': 6.309e-5      # gallons per minute
            },
            
            # Pressure conversions (to Pascals)
            'pressure': {
                'in_wg': 248.84,     # inches of water gauge
                'in_hg': 3386.39,    # inches of mercury
                'psi': 6894.76,      # pounds per square inch
                'psf': 47.8803,      # pounds per square foot
                'pa': 1.0,           # Pascals
                'kpa': 1000.0,       # kiloPascals
                'bar': 100000.0,     # bar
                'atm': 101325.0      # atmosphere
            },
            
            # Velocity conversions (to meters per second)
            'velocity': {
                'fpm': 0.00508,      # feet per minute
                'fps': 0.3048,       # feet per second
                'mph': 0.44704,      # miles per hour
                'mps': 1.0,          # meters per second
                'kmh': 0.277778,     # kilometers per hour
                'kts': 0.514444      # knots
            },
            
            # Mass conversions (to kilograms)
            'mass': {
                'lb': 0.453592,      # pounds
                'oz': 0.0283495,     # ounces
                'kg': 1.0,           # kilograms
                'g': 0.001,          # grams
                'ton': 907.185       # US ton
            },
            
            # Force conversions (to Newtons)
            'force': {
                'lbf': 4.44822,      # pound-force
                'n': 1.0,            # Newtons
                'kn': 1000.0,        # kiloNewtons
                'dyne': 1e-5         # dyne
            },
            
            # Power conversions (to Watts)
            'power': {
                'hp': 745.7,         # horsepower
                'btu_hr': 0.293071,  # BTU per hour
                'w': 1.0,            # Watts
                'kw': 1000.0,        # kiloWatts
                'ton_ref': 3516.85   # tons of refrigeration
            },
            
            # Energy conversions (to Joules)
            'energy': {
                'btu': 1055.06,      # British thermal unit
                'j': 1.0,            # Joules
                'kj': 1000.0,        # kiloJoules
                'kwh': 3.6e6,        # kilowatt-hour
                'cal': 4.184,        # calorie
                'kcal': 4184.0       # kilocalorie
            }
        }
        
        # Temperature conversions (special handling due to offsets)
        self.temperature_conversions = {
            'f_to_c': lambda f: (f - 32) * 5/9,
            'c_to_f': lambda c: c * 9/5 + 32,
            'k_to_c': lambda k: k - 273.15,
            'c_to_k': lambda c: c + 273.15,
            'r_to_f': lambda r: r - 459.67,
            'f_to_r': lambda f: f + 459.67
        }
        
        # Default units for each system
        self.default_units = {
            'imperial': {
                'length': 'ft',
                'length_small': 'in',
                'area': 'sq_ft',
                'volume': 'cu_ft',
                'flow': 'cfm',
                'pressure': 'in_wg',
                'velocity': 'fpm',
                'temperature': 'f',
                'mass': 'lb',
                'force': 'lbf',
                'power': 'hp',
                'energy': 'btu'
            },
            'metric': {
                'length': 'm',
                'length_small': 'mm',
                'area': 'sq_m',
                'volume': 'cu_m',
                'flow': 'lps',
                'pressure': 'pa',
                'velocity': 'mps',
                'temperature': 'c',
                'mass': 'kg',
                'force': 'n',
                'power': 'w',
                'energy': 'j'
            }
        }
    
    def convert(self, value: float, from_unit: str, to_unit: str) -> float:
        """
        Convert a value from one unit to another.
        
        Args:
            value: The value to convert
            from_unit: Source unit
            to_unit: Target unit
            
        Returns:
            Converted value
            
        Raises:
            ValueError: If units are incompatible or unknown
        """
        if from_unit == to_unit:
            return value
        
        # Handle temperature conversions separately
        if self._is_temperature_unit(from_unit) or self._is_temperature_unit(to_unit):
            return self._convert_temperature(value, from_unit, to_unit)
        
        # Find the category for both units
        from_category = self._get_unit_category(from_unit)
        to_category = self._get_unit_category(to_unit)
        
        if from_category != to_category:
            raise ValueError(f"Cannot convert between {from_category} and {to_category}")
        
        if from_category is None:
            raise ValueError(f"Unknown unit: {from_unit}")
        
        # Get conversion factors
        from_factor = self.conversions[from_category][from_unit]
        to_factor = self.conversions[from_category][to_unit]
        
        # Convert through base unit
        base_value = value * from_factor
        converted_value = base_value / to_factor
        
        logger.debug("Unit conversion", 
                    value=value, from_unit=from_unit, to_unit=to_unit, 
                    result=converted_value)
        
        return converted_value
    
    def _convert_temperature(self, value: float, from_unit: str, to_unit: str) -> float:
        """Convert temperature values."""
        if from_unit == to_unit:
            return value
        
        # Convert to Celsius first
        if from_unit == 'f':
            celsius = self.temperature_conversions['f_to_c'](value)
        elif from_unit == 'k':
            celsius = self.temperature_conversions['k_to_c'](value)
        elif from_unit == 'r':
            fahrenheit = self.temperature_conversions['r_to_f'](value)
            celsius = self.temperature_conversions['f_to_c'](fahrenheit)
        else:  # Assume Celsius
            celsius = value
        
        # Convert from Celsius to target
        if to_unit == 'f':
            return self.temperature_conversions['c_to_f'](celsius)
        elif to_unit == 'k':
            return self.temperature_conversions['c_to_k'](celsius)
        elif to_unit == 'r':
            fahrenheit = self.temperature_conversions['c_to_f'](celsius)
            return self.temperature_conversions['f_to_r'](fahrenheit)
        else:  # Celsius
            return celsius
    
    def _is_temperature_unit(self, unit: str) -> bool:
        """Check if a unit is a temperature unit."""
        return unit.lower() in ['f', 'c', 'k', 'r']
    
    def _get_unit_category(self, unit: str) -> Optional[str]:
        """Get the category of a unit."""
        for category, units in self.conversions.items():
            if unit in units:
                return category
        return None
    
    def convert_calculation_data(self, data: Dict[str, Any], target_system: str) -> Dict[str, Any]:
        """
        Convert all units in calculation data to target system.
        
        Args:
            data: Dictionary containing calculation data with units
            target_system: 'imperial' or 'metric'
            
        Returns:
            Dictionary with converted values
        """
        if target_system not in ['imperial', 'metric']:
            raise ValueError("Target system must be 'imperial' or 'metric'")
        
        converted_data = data.copy()
        current_system = data.get('units', 'imperial')
        
        if current_system == target_system:
            return converted_data
        
        # Define conversion mappings for common HVAC parameters
        conversion_map = {
            'airflow': ('flow', 'cfm' if target_system == 'imperial' else 'lps'),
            'velocity': ('velocity', 'fpm' if target_system == 'imperial' else 'mps'),
            'pressure': ('pressure', 'in_wg' if target_system == 'imperial' else 'pa'),
            'friction_rate': ('pressure', 'in_wg' if target_system == 'imperial' else 'pa'),
            'length': ('length', 'ft' if target_system == 'imperial' else 'm'),
            'width': ('length', 'in' if target_system == 'imperial' else 'mm'),
            'height': ('length', 'in' if target_system == 'imperial' else 'mm'),
            'diameter': ('length', 'in' if target_system == 'imperial' else 'mm'),
            'area': ('area', 'sq_ft' if target_system == 'imperial' else 'sq_m'),
            'temperature': ('temperature', 'f' if target_system == 'imperial' else 'c')
        }
        
        for param, (category, target_unit) in conversion_map.items():
            if param in data and isinstance(data[param], (int, float)):
                # Determine source unit
                source_unit = self._get_source_unit(param, current_system, category)
                
                try:
                    converted_value = self.convert(data[param], source_unit, target_unit)
                    converted_data[param] = converted_value
                    logger.debug(f"Converted {param}", 
                               original=data[param], 
                               converted=converted_value,
                               from_unit=source_unit,
                               to_unit=target_unit)
                except ValueError as e:
                    logger.warning(f"Could not convert {param}", error=str(e))
        
        converted_data['units'] = target_system
        return converted_data
    
    def _get_source_unit(self, parameter: str, system: str, category: str) -> str:
        """Get the source unit for a parameter based on system and category."""
        if category == 'length':
            if parameter in ['width', 'height', 'diameter']:
                return self.default_units[system]['length_small']
            else:
                return self.default_units[system]['length']
        else:
            return self.default_units[system][category]
    
    def get_unit_label(self, category: str, system: str, small: bool = False) -> str:
        """Get the unit label for display purposes."""
        if category == 'length' and small:
            return self.default_units[system]['length_small']
        return self.default_units[system].get(category, '')
    
    def format_value_with_units(self, value: float, category: str, system: str, 
                               precision: int = 2, small: bool = False) -> str:
        """Format a value with appropriate units for display."""
        unit = self.get_unit_label(category, system, small)
        formatted_value = round(value, precision)
        return f"{formatted_value} {unit}"
    
    def get_conversion_factor(self, from_unit: str, to_unit: str) -> float:
        """Get the conversion factor between two units."""
        if from_unit == to_unit:
            return 1.0
        
        try:
            return self.convert(1.0, from_unit, to_unit)
        except ValueError:
            return 1.0
    
    def list_units(self, category: Optional[str] = None) -> Dict[str, list]:
        """List all available units, optionally filtered by category."""
        if category:
            return {category: list(self.conversions.get(category, {}).keys())}
        return {cat: list(units.keys()) for cat, units in self.conversions.items()}

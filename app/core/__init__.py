"""
SizeWise Suite Core Package

Provides core calculation, validation, and unit conversion services.
"""

from .calculations import AirDuctCalculator, UnitsConverter, BaseCalculator
from .validation import SchemaValidator, HVACValidator, UnitsValidator

__all__ = [
    'AirDuctCalculator',
    'UnitsConverter', 
    'BaseCalculator',
    'SchemaValidator',
    'HVACValidator',
    'UnitsValidator'
]

__version__ = '0.1.0'

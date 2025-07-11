"""
Air Duct Calculator Backend Tests
"""

import unittest
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from core.calculations.air_duct_calculator import AirDuctCalculator
from core.validation.schema_validator import SchemaValidator


class TestAirDuctCalculator(unittest.TestCase):
    """Test cases for the Air Duct Calculator."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.calculator = AirDuctCalculator()
        self.validator = SchemaValidator()
    
    def test_rectangular_duct_calculation(self):
        """Test rectangular duct sizing calculation."""
        input_data = {
            'airflow': 1000,
            'duct_type': 'rectangular',
            'friction_rate': 0.08,
            'units': 'imperial'
        }
        
        result = self.calculator.calculate(input_data)
        
        self.assertTrue(result.is_valid())
        self.assertIn('duct_size', result.results)
        self.assertIn('velocity', result.results)
        self.assertIn('area', result.results)
        self.assertIn('equivalent_diameter', result.results)
        
        # Check that velocity is reasonable
        velocity = result.results['velocity']['value']
        self.assertGreater(velocity, 500)  # Minimum reasonable velocity
        self.assertLess(velocity, 3000)    # Maximum reasonable velocity
    
    def test_round_duct_calculation(self):
        """Test round duct sizing calculation."""
        input_data = {
            'airflow': 1500,
            'duct_type': 'round',
            'friction_rate': 0.1,
            'units': 'imperial'
        }
        
        result = self.calculator.calculate(input_data)
        
        self.assertTrue(result.is_valid())
        self.assertIn('diameter', result.results)
        self.assertIn('velocity', result.results)
        self.assertIn('area', result.results)
        
        # For round ducts, equivalent diameter should equal diameter
        diameter = result.results['diameter']['value']
        equiv_diameter = result.results['equivalent_diameter']['value']
        self.assertAlmostEqual(diameter, equiv_diameter, places=1)
    
    def test_input_validation(self):
        """Test input validation."""
        # Test missing required field
        invalid_input = {
            'duct_type': 'rectangular',
            'friction_rate': 0.08,
            'units': 'imperial'
            # Missing airflow
        }
        
        validation = self.calculator.validate_input(invalid_input)
        self.assertFalse(validation['is_valid'])
        self.assertIn('Missing required field: airflow', validation['errors'])
    
    def test_negative_airflow_validation(self):
        """Test validation of negative airflow."""
        invalid_input = {
            'airflow': -100,
            'duct_type': 'rectangular',
            'friction_rate': 0.08,
            'units': 'imperial'
        }
        
        validation = self.calculator.validate_input(invalid_input)
        self.assertFalse(validation['is_valid'])
        self.assertIn('Airflow must be a positive number', validation['errors'])
    
    def test_invalid_duct_type(self):
        """Test validation of invalid duct type."""
        invalid_input = {
            'airflow': 1000,
            'duct_type': 'invalid',
            'friction_rate': 0.08,
            'units': 'imperial'
        }
        
        validation = self.calculator.validate_input(invalid_input)
        self.assertFalse(validation['is_valid'])
        self.assertIn('Duct type must be \'rectangular\' or \'round\'', validation['errors'])
    
    def test_low_airflow_warning(self):
        """Test warning for very low airflow."""
        input_data = {
            'airflow': 25,
            'duct_type': 'rectangular',
            'friction_rate': 0.08,
            'units': 'imperial'
        }
        
        validation = self.calculator.validate_input(input_data)
        self.assertTrue(validation['is_valid'])
        self.assertIn('Very low airflow - verify this is correct', validation['warnings'])
    
    def test_high_airflow_warning(self):
        """Test warning for very high airflow."""
        input_data = {
            'airflow': 60000,
            'duct_type': 'rectangular',
            'friction_rate': 0.08,
            'units': 'imperial'
        }
        
        validation = self.calculator.validate_input(input_data)
        self.assertTrue(validation['is_valid'])
        self.assertIn('Very high airflow - verify this is correct', validation['warnings'])
    
    def test_low_friction_rate_warning(self):
        """Test warning for very low friction rate."""
        input_data = {
            'airflow': 1000,
            'duct_type': 'rectangular',
            'friction_rate': 0.01,
            'units': 'imperial'
        }
        
        validation = self.calculator.validate_input(input_data)
        self.assertTrue(validation['is_valid'])
        self.assertIn('Very low friction rate - may result in oversized ducts', validation['warnings'])
    
    def test_high_friction_rate_warning(self):
        """Test warning for high friction rate."""
        input_data = {
            'airflow': 1000,
            'duct_type': 'rectangular',
            'friction_rate': 0.6,
            'units': 'imperial'
        }
        
        validation = self.calculator.validate_input(input_data)
        self.assertTrue(validation['is_valid'])
        self.assertIn('High friction rate - may result in undersized ducts', validation['warnings'])
    
    def test_metric_units_conversion(self):
        """Test calculation with metric units."""
        input_data = {
            'airflow': 500,  # L/s
            'duct_type': 'rectangular',
            'friction_rate': 1.0,  # Pa/m
            'units': 'metric'
        }
        
        result = self.calculator.calculate(input_data)
        
        self.assertTrue(result.is_valid())
        self.assertIn('duct_size', result.results)
        self.assertIn('velocity', result.results)
        
        # Results should be in metric units
        velocity = result.results['velocity']
        if isinstance(velocity, dict):
            self.assertEqual(velocity['unit'], 'mps')
    
    def test_standard_sizes(self):
        """Test getting standard duct sizes."""
        round_sizes = self.calculator.get_standard_sizes('round')
        self.assertIsInstance(round_sizes, list)
        self.assertIn(12, round_sizes)
        self.assertIn(16, round_sizes)
        
        rect_sizes = self.calculator.get_standard_sizes('rectangular')
        self.assertIsInstance(rect_sizes, list)
        self.assertTrue(len(rect_sizes) > 0)
    
    def test_pressure_loss_calculation(self):
        """Test pressure loss calculation."""
        # Test with known values
        velocity = 1500  # FPM
        length = 100     # feet
        diameter = 12    # inches
        material = 'galvanized_steel'
        
        pressure_loss = self.calculator._calculate_pressure_loss(velocity, length, diameter, material)
        
        self.assertGreater(pressure_loss, 0)
        self.assertLess(pressure_loss, 10)  # Should be reasonable value
    
    def test_equivalent_diameter_calculation(self):
        """Test equivalent diameter calculation for rectangular ducts."""
        from core.validation.hvac_validator import HVACValidator
        
        hvac_validator = HVACValidator()
        
        # Test with known dimensions
        width = 12  # inches
        height = 8  # inches
        
        equiv_diameter = hvac_validator.calculate_equivalent_diameter(width, height)
        
        self.assertGreater(equiv_diameter, 0)
        self.assertLess(equiv_diameter, max(width, height))
        self.assertGreater(equiv_diameter, min(width, height))


class TestSchemaValidator(unittest.TestCase):
    """Test cases for the Schema Validator."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.validator = SchemaValidator()
    
    def test_valid_air_duct_input(self):
        """Test validation of valid air duct input."""
        valid_input = {
            'airflow': 1000,
            'duct_type': 'rectangular',
            'friction_rate': 0.08,
            'units': 'imperial'
        }
        
        result = self.validator.validate_air_duct_input(valid_input)
        
        self.assertTrue(result.is_valid)
        self.assertEqual(len(result.errors), 0)
    
    def test_invalid_air_duct_input(self):
        """Test validation of invalid air duct input."""
        invalid_input = {
            'airflow': -100,  # Invalid negative value
            'duct_type': 'invalid',  # Invalid type
            'friction_rate': 2.0,  # Too high
            'units': 'invalid'  # Invalid units
        }
        
        result = self.validator.validate_air_duct_input(invalid_input)
        
        self.assertFalse(result.is_valid)
        self.assertGreater(len(result.errors), 0)


if __name__ == '__main__':
    unittest.main()

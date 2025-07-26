"""
Test suite for Advanced Calculation Modules (Python implementation)

Tests for VelocityPressureCalculator and EnhancedFrictionCalculator
to ensure cross-platform compatibility with TypeScript implementation.

@version 3.0.0
@author SizeWise Suite Development Team
"""

import unittest
import math
from typing import Dict, Any

from velocity_pressure_calculator import (
    VelocityPressureCalculator,
    VelocityPressureMethod,
    VelocityPressureInput,
    DuctGeometry,
    ValidationLevel
)
from enhanced_friction_calculator import (
    EnhancedFrictionCalculator,
    FrictionMethod,
    FrictionCalculationInput,
    MaterialAge,
    SurfaceCondition,
    FlowRegime
)
from air_properties_calculator import AirConditions


class TestVelocityPressureCalculator(unittest.TestCase):
    """Test cases for VelocityPressureCalculator"""

    def test_basic_velocity_pressure_calculation(self):
        """Test basic velocity pressure calculation using formula method"""
        input_params = VelocityPressureInput(
            velocity=2000,
            method=VelocityPressureMethod.FORMULA
        )
        
        result = VelocityPressureCalculator.calculate_velocity_pressure(input_params)
        
        # Expected: VP = (2000/4005)² ≈ 0.249 in. w.g.
        expected_vp = (2000 / 4005) ** 2
        self.assertAlmostEqual(result.velocity_pressure, expected_vp, places=4)
        self.assertEqual(result.method, VelocityPressureMethod.FORMULA)
        self.assertEqual(result.velocity, 2000)
        self.assertGreater(result.accuracy, 0.9)

    def test_enhanced_formula_method(self):
        """Test enhanced formula method with corrections"""
        input_params = VelocityPressureInput(
            velocity=2000,
            method=VelocityPressureMethod.ENHANCED_FORMULA
        )
        
        result = VelocityPressureCalculator.calculate_velocity_pressure(input_params)
        
        # Should be close to formula method but with minor corrections
        base_vp = (2000 / 4005) ** 2
        self.assertAlmostEqual(result.velocity_pressure, base_vp, delta=0.01)
        self.assertEqual(result.method, VelocityPressureMethod.ENHANCED_FORMULA)

    def test_environmental_corrections(self):
        """Test velocity pressure calculation with environmental conditions"""
        air_conditions = AirConditions(
            temperature=85,  # Higher temperature
            altitude=3000,   # Higher altitude
            humidity=60      # Higher humidity
        )
        
        input_params = VelocityPressureInput(
            velocity=2000,
            method=VelocityPressureMethod.ENHANCED_FORMULA,
            air_conditions=air_conditions
        )
        
        result = VelocityPressureCalculator.calculate_velocity_pressure(input_params)
        
        # Higher temperature and altitude should reduce density and VP
        standard_result = VelocityPressureCalculator.calculate_velocity_pressure(
            VelocityPressureInput(velocity=2000, method=VelocityPressureMethod.ENHANCED_FORMULA)
        )
        
        self.assertLess(result.velocity_pressure, standard_result.velocity_pressure)
        self.assertLess(result.density_ratio, 1.0)

    def test_inverse_calculation(self):
        """Test inverse velocity pressure calculation"""
        velocity_pressure = 0.25  # in. w.g.
        
        result = VelocityPressureCalculator.calculate_velocity_from_pressure(velocity_pressure)
        
        # Expected: V = 4005 * sqrt(0.25) = 2002.5 FPM
        expected_velocity = 4005 * math.sqrt(velocity_pressure)
        self.assertAlmostEqual(result["velocity"], expected_velocity, places=1)

    def test_optimal_method_selection(self):
        """Test optimal method selection logic"""
        # Low velocity - should prefer enhanced formula
        method = VelocityPressureCalculator.get_optimal_method(1000)
        self.assertEqual(method, VelocityPressureMethod.ENHANCED_FORMULA)
        
        # Standard velocity range - should prefer lookup table or interpolated
        method = VelocityPressureCalculator.get_optimal_method(2000, accuracy="high")
        self.assertIn(method, [VelocityPressureMethod.LOOKUP_TABLE, VelocityPressureMethod.INTERPOLATED])
        
        # High accuracy requirement in CFD range
        method = VelocityPressureCalculator.get_optimal_method(3000, accuracy="maximum")
        self.assertEqual(method, VelocityPressureMethod.CFD_CORRECTED)

    def test_validation_warnings(self):
        """Test input validation and warning generation"""
        input_params = VelocityPressureInput(
            velocity=15000,  # Very high velocity
            method=VelocityPressureMethod.FORMULA,
            validation_level=ValidationLevel.STRICT
        )
        
        result = VelocityPressureCalculator.calculate_velocity_pressure(input_params)
        
        # Should generate warnings for high velocity
        self.assertGreater(len(result.warnings), 0)
        self.assertTrue(any("velocity" in warning.lower() for warning in result.warnings))


class TestEnhancedFrictionCalculator(unittest.TestCase):
    """Test cases for EnhancedFrictionCalculator"""

    def test_basic_friction_calculation(self):
        """Test basic friction loss calculation"""
        input_params = FrictionCalculationInput(
            velocity=2000,
            hydraulic_diameter=12,
            length=100,
            material="galvanized_steel",
            method=FrictionMethod.HAALAND
        )
        
        result = EnhancedFrictionCalculator.calculate_friction_loss(input_params)
        
        # Verify basic properties
        self.assertGreater(result.friction_loss, 0)
        self.assertGreater(result.friction_rate, 0)
        self.assertGreater(result.friction_factor, 0)
        self.assertEqual(result.method, FrictionMethod.HAALAND)
        self.assertGreater(result.reynolds_number, 0)

    def test_material_aging_effects(self):
        """Test material aging effects on friction calculations"""
        base_input = FrictionCalculationInput(
            velocity=2000,
            hydraulic_diameter=12,
            length=100,
            material="galvanized_steel",
            material_age=MaterialAge.NEW,
            method=FrictionMethod.ENHANCED_DARCY
        )
        
        aged_input = FrictionCalculationInput(
            velocity=2000,
            hydraulic_diameter=12,
            length=100,
            material="galvanized_steel",
            material_age=MaterialAge.POOR,
            method=FrictionMethod.ENHANCED_DARCY
        )
        
        base_result = EnhancedFrictionCalculator.calculate_friction_loss(base_input)
        aged_result = EnhancedFrictionCalculator.calculate_friction_loss(aged_input)
        
        # Aged material should have higher friction loss
        self.assertGreater(aged_result.friction_loss, base_result.friction_loss)
        self.assertGreater(aged_result.material_properties.aging_factor, 1.0)

    def test_surface_condition_effects(self):
        """Test surface condition effects on friction calculations"""
        excellent_input = FrictionCalculationInput(
            velocity=2000,
            hydraulic_diameter=12,
            length=100,
            material="galvanized_steel",
            surface_condition=SurfaceCondition.EXCELLENT,
            method=FrictionMethod.ENHANCED_DARCY
        )
        
        poor_input = FrictionCalculationInput(
            velocity=2000,
            hydraulic_diameter=12,
            length=100,
            material="galvanized_steel",
            surface_condition=SurfaceCondition.POOR,
            method=FrictionMethod.ENHANCED_DARCY
        )
        
        excellent_result = EnhancedFrictionCalculator.calculate_friction_loss(excellent_input)
        poor_result = EnhancedFrictionCalculator.calculate_friction_loss(poor_input)
        
        # Poor surface condition should have higher friction loss
        self.assertGreater(poor_result.friction_loss, excellent_result.friction_loss)
        self.assertLess(excellent_result.material_properties.surface_factor, 1.0)
        self.assertGreater(poor_result.material_properties.surface_factor, 1.0)

    def test_flow_regime_classification(self):
        """Test flow regime classification"""
        # Low velocity - should be laminar or transitional
        low_velocity_input = FrictionCalculationInput(
            velocity=200,
            hydraulic_diameter=12,
            length=100,
            material="galvanized_steel"
        )
        
        low_result = EnhancedFrictionCalculator.calculate_friction_loss(low_velocity_input)
        self.assertIn(low_result.flow_regime, [FlowRegime.LAMINAR, FlowRegime.TRANSITIONAL])
        
        # High velocity - should be turbulent
        high_velocity_input = FrictionCalculationInput(
            velocity=4000,
            hydraulic_diameter=12,
            length=100,
            material="galvanized_steel"
        )
        
        high_result = EnhancedFrictionCalculator.calculate_friction_loss(high_velocity_input)
        self.assertIn(high_result.flow_regime, [
            FlowRegime.TURBULENT_SMOOTH, 
            FlowRegime.TURBULENT_ROUGH, 
            FlowRegime.FULLY_ROUGH
        ])

    def test_method_comparison(self):
        """Test different friction calculation methods"""
        input_params = FrictionCalculationInput(
            velocity=2000,
            hydraulic_diameter=12,
            length=100,
            material="galvanized_steel"
        )
        
        methods = [
            FrictionMethod.COLEBROOK_WHITE,
            FrictionMethod.HAALAND,
            FrictionMethod.SWAMEE_JAIN,
            FrictionMethod.ENHANCED_DARCY
        ]
        
        results = {}
        for method in methods:
            input_params.method = method
            result = EnhancedFrictionCalculator.calculate_friction_loss(input_params)
            results[method] = result.friction_loss
        
        # All methods should give reasonable results within 20% of each other
        values = list(results.values())
        max_val = max(values)
        min_val = min(values)
        self.assertLess((max_val - min_val) / min_val, 0.2)

    def test_optimal_method_selection(self):
        """Test optimal method selection logic"""
        # High accuracy requirement
        method = EnhancedFrictionCalculator.get_optimal_method(50000, 0.001, "maximum")
        self.assertEqual(method, FrictionMethod.COLEBROOK_WHITE)
        
        # Smooth pipe
        method = EnhancedFrictionCalculator.get_optimal_method(50000, 1e-7, "standard")
        self.assertEqual(method, FrictionMethod.SWAMEE_JAIN)
        
        # Very rough pipe
        method = EnhancedFrictionCalculator.get_optimal_method(2000000, 0.01, "standard")
        self.assertEqual(method, FrictionMethod.CHEN)


class TestIntegration(unittest.TestCase):
    """Integration tests for both calculators"""

    def test_complete_duct_analysis(self):
        """Test complete duct analysis using both calculators"""
        # Common parameters
        velocity = 2000  # FPM
        hydraulic_diameter = 12  # inches
        length = 100  # feet
        air_conditions = AirConditions(temperature=75, altitude=1000, humidity=50)
        
        # Calculate velocity pressure
        vp_input = VelocityPressureInput(
            velocity=velocity,
            method=VelocityPressureMethod.ENHANCED_FORMULA,
            air_conditions=air_conditions
        )
        vp_result = VelocityPressureCalculator.calculate_velocity_pressure(vp_input)
        
        # Calculate friction loss
        friction_input = FrictionCalculationInput(
            velocity=velocity,
            hydraulic_diameter=hydraulic_diameter,
            length=length,
            material="galvanized_steel",
            air_conditions=air_conditions,
            method=FrictionMethod.ENHANCED_DARCY
        )
        friction_result = EnhancedFrictionCalculator.calculate_friction_loss(friction_input)
        
        # Verify results are reasonable
        self.assertGreater(vp_result.velocity_pressure, 0)
        self.assertGreater(friction_result.friction_loss, 0)
        
        # Total pressure loss would be velocity pressure + friction loss
        total_pressure_loss = vp_result.velocity_pressure + friction_result.friction_loss
        self.assertGreater(total_pressure_loss, vp_result.velocity_pressure)
        
        # Verify environmental corrections are consistent
        self.assertAlmostEqual(vp_result.air_density, friction_result.flow_properties.reynolds_number / 
                              (velocity / 60 * hydraulic_diameter / 12) * 
                              friction_result.material_properties.combined_roughness, delta=0.1)


def run_validation_tests():
    """Run all validation tests and return summary"""
    print("=== PYTHON ADVANCED CALCULATION MODULES VALIDATION ===\n")
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test cases
    suite.addTests(loader.loadTestsFromTestCase(TestVelocityPressureCalculator))
    suite.addTests(loader.loadTestsFromTestCase(TestEnhancedFrictionCalculator))
    suite.addTests(loader.loadTestsFromTestCase(TestIntegration))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print(f"\n=== TEST SUMMARY ===")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.wasSuccessful():
        print("✅ All tests passed - Python implementation validated")
        return True
    else:
        print("❌ Some tests failed - review implementation")
        return False


if __name__ == "__main__":
    run_validation_tests()

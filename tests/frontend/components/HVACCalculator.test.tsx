/**
 * Unit Tests for HVAC Calculator Component
 *
 * Tests the core HVAC calculation functionality including:
 * - Air duct sizing calculations
 * - Load calculations
 * - Equipment sizing
 * - Input validation
 * - Error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock components and services for testing
const MockHVACCalculator = () => (
  <div>
    <label htmlFor="calc-type">Calculation Type</label>
    <select id="calc-type" data-testid="calculation-type">
      <option value="air_duct">Air Duct</option>
      <option value="load_calculation">Load Calculation</option>
      <option value="equipment_sizing">Equipment Sizing</option>
    </select>

    <label htmlFor="room-area">Room Area (sq ft)</label>
    <input id="room-area" type="number" data-testid="room-area" />

    <label htmlFor="cfm-required">CFM Required</label>
    <input id="cfm-required" type="number" data-testid="cfm-required" />

    <label htmlFor="duct-material">Duct Material</label>
    <select id="duct-material" data-testid="duct-material">
      <option value="galvanized_steel">Galvanized Steel</option>
      <option value="aluminum">Aluminum</option>
    </select>

    <button type="button" data-testid="calculate-btn">Calculate</button>
    <div data-testid="results" style={{ display: 'none' }}>
      <div data-testid="duct-size">Duct Size: 14" × 10"</div>
      <div data-testid="velocity">Velocity: 800 FPM</div>
      <div data-testid="pressure-drop">Pressure Drop: 0.08 in. w.g.</div>
    </div>
  </div>
);

// Mock the calculation service
const mockCalculationService = {
  calculateAirDuct: jest.fn(),
  calculateLoad: jest.fn(),
  calculateEquipmentSizing: jest.fn(),
};

// Test wrapper with context
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <HVACCalculationProvider>
    {children}
  </HVACCalculationProvider>
);

describe('HVACCalculator Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Air Duct Calculations', () => {
    test('calculates air duct sizing correctly for standard inputs', async () => {
      const user = userEvent.setup();
      
      // Mock successful calculation
      MockedCalculationService.calculateAirDuct.mockResolvedValue({
        ductSize: { width: 14, height: 10 },
        velocity: 800,
        pressureDrop: 0.08,
        material: 'galvanized_steel'
      });

      render(
        <TestWrapper>
          <HVACCalculator />
        </TestWrapper>
      );

      // Select air duct calculation type
      await user.selectOptions(screen.getByLabelText('Calculation Type'), 'air_duct');

      // Input test data
      await user.type(screen.getByLabelText('Room Area (sq ft)'), '500');
      await user.type(screen.getByLabelText('CFM Required'), '2000');
      await user.selectOptions(screen.getByLabelText('Duct Material'), 'galvanized_steel');

      // Trigger calculation
      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Wait for results
      await waitFor(() => {
        expect(screen.getByText('Duct Size: 14" × 10"')).toBeInTheDocument();
        expect(screen.getByText('Velocity: 800 FPM')).toBeInTheDocument();
        expect(screen.getByText('Pressure Drop: 0.08 in. w.g.')).toBeInTheDocument();
      });

      // Verify service was called with correct parameters
      expect(MockedCalculationService.calculateAirDuct).toHaveBeenCalledWith({
        roomArea: 500,
        cfmRequired: 2000,
        ductMaterial: 'galvanized_steel',
        pressureClass: 'low'
      });
    });

    test('handles invalid input values gracefully', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <HVACCalculator />
        </TestWrapper>
      );

      await user.selectOptions(screen.getByLabelText('Calculation Type'), 'air_duct');

      // Input invalid data
      await user.type(screen.getByLabelText('Room Area (sq ft)'), '-100');
      await user.type(screen.getByLabelText('CFM Required'), 'invalid');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Check for validation errors
      await waitFor(() => {
        expect(screen.getByText('Room area must be positive')).toBeInTheDocument();
        expect(screen.getByText('CFM must be a valid number')).toBeInTheDocument();
      });

      // Verify service was not called
      expect(MockedCalculationService.calculateAirDuct).not.toHaveBeenCalled();
    });

    test('displays loading state during calculation', async () => {
      const user = userEvent.setup();

      // Mock delayed response
      MockedCalculationService.calculateAirDuct.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          ductSize: { width: 12, height: 8 },
          velocity: 750,
          pressureDrop: 0.06
        }), 1000))
      );

      render(
        <TestWrapper>
          <HVACCalculator />
        </TestWrapper>
      );

      await user.selectOptions(screen.getByLabelText('Calculation Type'), 'air_duct');
      await user.type(screen.getByLabelText('Room Area (sq ft)'), '400');
      await user.type(screen.getByLabelText('CFM Required'), '1500');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      // Check loading state
      expect(screen.getByText('Calculating...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /calculating/i })).toBeDisabled();

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText('Duct Size: 12" × 8"')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Load Calculations', () => {
    test('calculates heating and cooling loads correctly', async () => {
      const user = userEvent.setup();

      MockedCalculationService.calculateLoad.mockResolvedValue({
        heatingLoad: 45000,
        coolingLoad: 52000,
        sensibleLoad: 40000,
        latentLoad: 12000,
        breakdown: {
          walls: 15000,
          windows: 8000,
          roof: 12000,
          infiltration: 10000,
          occupancy: 7000
        }
      });

      render(
        <TestWrapper>
          <HVACCalculator />
        </TestWrapper>
      );

      await user.selectOptions(screen.getByLabelText('Calculation Type'), 'load_calculation');

      // Input building data
      await user.type(screen.getByLabelText('Building Area (sq ft)'), '5000');
      await user.type(screen.getByLabelText('Occupancy'), '50');
      await user.selectOptions(screen.getByLabelText('Building Type'), 'office');
      await user.selectOptions(screen.getByLabelText('Climate Zone'), 'zone_4a');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      await waitFor(() => {
        expect(screen.getByText('Heating Load: 45,000 BTU/h')).toBeInTheDocument();
        expect(screen.getByText('Cooling Load: 52,000 BTU/h')).toBeInTheDocument();
        expect(screen.getByText('Sensible Load: 40,000 BTU/h')).toBeInTheDocument();
        expect(screen.getByText('Latent Load: 12,000 BTU/h')).toBeInTheDocument();
      });
    });

    test('shows load breakdown details', async () => {
      const user = userEvent.setup();

      MockedCalculationService.calculateLoad.mockResolvedValue({
        heatingLoad: 45000,
        coolingLoad: 52000,
        breakdown: {
          walls: 15000,
          windows: 8000,
          roof: 12000,
          infiltration: 10000,
          occupancy: 7000
        }
      });

      render(
        <TestWrapper>
          <HVACCalculator />
        </TestWrapper>
      );

      await user.selectOptions(screen.getByLabelText('Calculation Type'), 'load_calculation');
      await user.type(screen.getByLabelText('Building Area (sq ft)'), '5000');
      await user.click(screen.getByRole('button', { name: /calculate/i }));

      await waitFor(() => {
        expect(screen.getByText('Heating Load: 45,000 BTU/h')).toBeInTheDocument();
      });

      // Expand breakdown details
      await user.click(screen.getByRole('button', { name: /show breakdown/i }));

      expect(screen.getByText('Walls: 15,000 BTU/h')).toBeInTheDocument();
      expect(screen.getByText('Windows: 8,000 BTU/h')).toBeInTheDocument();
      expect(screen.getByText('Roof: 12,000 BTU/h')).toBeInTheDocument();
      expect(screen.getByText('Infiltration: 10,000 BTU/h')).toBeInTheDocument();
      expect(screen.getByText('Occupancy: 7,000 BTU/h')).toBeInTheDocument();
    });
  });

  describe('Equipment Sizing', () => {
    test('calculates equipment sizing based on load requirements', async () => {
      const user = userEvent.setup();

      MockedCalculationService.calculateEquipmentSizing.mockResolvedValue({
        airHandler: {
          cfm: 2000,
          model: 'AH-2000-E',
          efficiency: 0.85
        },
        heatingEquipment: {
          capacity: 50000,
          type: 'heat_pump',
          efficiency: 3.2
        },
        coolingEquipment: {
          capacity: 60000,
          type: 'heat_pump',
          efficiency: 16
        }
      });

      render(
        <TestWrapper>
          <HVACCalculator />
        </TestWrapper>
      );

      await user.selectOptions(screen.getByLabelText('Calculation Type'), 'equipment_sizing');

      await user.type(screen.getByLabelText('Heating Load (BTU/h)'), '50000');
      await user.type(screen.getByLabelText('Cooling Load (BTU/h)'), '60000');
      await user.selectOptions(screen.getByLabelText('System Type'), 'heat_pump');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      await waitFor(() => {
        expect(screen.getByText('Air Handler: AH-2000-E (2,000 CFM)')).toBeInTheDocument();
        expect(screen.getByText('Heating: Heat Pump (50,000 BTU/h, COP 3.2)')).toBeInTheDocument();
        expect(screen.getByText('Cooling: Heat Pump (60,000 BTU/h, SEER 16)')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    test('handles calculation service errors gracefully', async () => {
      const user = userEvent.setup();

      MockedCalculationService.calculateAirDuct.mockRejectedValue(
        new Error('Calculation service unavailable')
      );

      render(
        <TestWrapper>
          <HVACCalculator />
        </TestWrapper>
      );

      await user.selectOptions(screen.getByLabelText('Calculation Type'), 'air_duct');
      await user.type(screen.getByLabelText('Room Area (sq ft)'), '500');
      await user.type(screen.getByLabelText('CFM Required'), '2000');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      await waitFor(() => {
        expect(screen.getByText('Calculation failed. Please try again.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });
    });

    test('allows retry after error', async () => {
      const user = userEvent.setup();

      // First call fails, second succeeds
      MockedCalculationService.calculateAirDuct
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ductSize: { width: 14, height: 10 },
          velocity: 800,
          pressureDrop: 0.08
        });

      render(
        <TestWrapper>
          <HVACCalculator />
        </TestWrapper>
      );

      await user.selectOptions(screen.getByLabelText('Calculation Type'), 'air_duct');
      await user.type(screen.getByLabelText('Room Area (sq ft)'), '500');
      await user.type(screen.getByLabelText('CFM Required'), '2000');

      // First attempt fails
      await user.click(screen.getByRole('button', { name: /calculate/i }));

      await waitFor(() => {
        expect(screen.getByText('Calculation failed. Please try again.')).toBeInTheDocument();
      });

      // Retry succeeds
      await user.click(screen.getByRole('button', { name: /retry/i }));

      await waitFor(() => {
        expect(screen.getByText('Duct Size: 14" × 10"')).toBeInTheDocument();
      });
    });
  });

  describe('Input Validation', () => {
    test('validates required fields', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <HVACCalculator />
        </TestWrapper>
      );

      await user.selectOptions(screen.getByLabelText('Calculation Type'), 'air_duct');

      // Try to calculate without required inputs
      await user.click(screen.getByRole('button', { name: /calculate/i }));

      await waitFor(() => {
        expect(screen.getByText('Room area is required')).toBeInTheDocument();
        expect(screen.getByText('CFM is required')).toBeInTheDocument();
      });
    });

    test('validates numeric ranges', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <HVACCalculator />
        </TestWrapper>
      );

      await user.selectOptions(screen.getByLabelText('Calculation Type'), 'air_duct');

      // Input values outside valid ranges
      await user.type(screen.getByLabelText('Room Area (sq ft)'), '0');
      await user.type(screen.getByLabelText('CFM Required'), '100000');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      await waitFor(() => {
        expect(screen.getByText('Room area must be greater than 0')).toBeInTheDocument();
        expect(screen.getByText('CFM must be less than 50,000')).toBeInTheDocument();
      });
    });
  });

  describe('Results Display', () => {
    test('formats results correctly', async () => {
      const user = userEvent.setup();

      MockedCalculationService.calculateAirDuct.mockResolvedValue({
        ductSize: { width: 14.5, height: 10.25 },
        velocity: 823.7,
        pressureDrop: 0.0847,
        material: 'galvanized_steel'
      });

      render(
        <TestWrapper>
          <HVACCalculator />
        </TestWrapper>
      );

      await user.selectOptions(screen.getByLabelText('Calculation Type'), 'air_duct');
      await user.type(screen.getByLabelText('Room Area (sq ft)'), '500');
      await user.type(screen.getByLabelText('CFM Required'), '2000');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      await waitFor(() => {
        // Check proper formatting and rounding
        expect(screen.getByText('Duct Size: 14.5" × 10.25"')).toBeInTheDocument();
        expect(screen.getByText('Velocity: 824 FPM')).toBeInTheDocument();
        expect(screen.getByText('Pressure Drop: 0.085 in. w.g.')).toBeInTheDocument();
      });
    });

    test('allows saving calculation results', async () => {
      const user = userEvent.setup();

      MockedCalculationService.calculateAirDuct.mockResolvedValue({
        ductSize: { width: 14, height: 10 },
        velocity: 800,
        pressureDrop: 0.08
      });

      render(
        <TestWrapper>
          <HVACCalculator />
        </TestWrapper>
      );

      await user.selectOptions(screen.getByLabelText('Calculation Type'), 'air_duct');
      await user.type(screen.getByLabelText('Room Area (sq ft)'), '500');
      await user.type(screen.getByLabelText('CFM Required'), '2000');

      await user.click(screen.getByRole('button', { name: /calculate/i }));

      await waitFor(() => {
        expect(screen.getByText('Duct Size: 14" × 10"')).toBeInTheDocument();
      });

      // Save results
      await user.click(screen.getByRole('button', { name: /save results/i }));

      await waitFor(() => {
        expect(screen.getByText('Results saved successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <HVACCalculator />
        </TestWrapper>
      );

      // Check for proper labeling
      expect(screen.getByLabelText('Calculation Type')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /calculate/i })).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <HVACCalculator />
        </TestWrapper>
      );

      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText('Calculation Type')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('Room Area (sq ft)')).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText('CFM Required')).toHaveFocus();
    });
  });
});

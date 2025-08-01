import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock lucide-react icons to prevent import issues
jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  Ruler: () => <div data-testid="ruler-icon">Ruler</div>,
  Calculator: () => <div data-testid="calculator-icon">Calculator</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
}))

import { ScaleCalibrationPanel } from '@/components/canvas/ScaleCalibrationPanel'

// Mock the stores
const mockSetPlanScale = jest.fn()
const mockUpdateUIScale = jest.fn()

jest.mock('@/stores/project-store', () => ({
  useProjectStore: () => ({
    setPlanScale: mockSetPlanScale,
  }),
}))

jest.mock('@/stores/ui-store', () => ({
  useUIStore: () => ({
    setPlanScale: mockUpdateUIScale,
    planScale: { pixelsPerMeter: 1 },
  }),
}))

describe('ScaleCalibrationPanel', () => {
  const defaultProps = {
    isVisible: true,
    onClose: jest.fn(),
    pixelDistance: 100,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render when visible', () => {
    render(<ScaleCalibrationPanel {...defaultProps} />)

    expect(screen.getByText('Scale Calibration')).toBeInTheDocument()
    expect(screen.getByText('Set the scale by measuring a known distance on your plan')).toBeInTheDocument()
    // Check for the text parts using more flexible matching
    expect(screen.getByText(/Measured line distance:/)).toBeInTheDocument()
    expect(screen.getByText(/100\.0/)).toBeInTheDocument()
    expect(screen.getByText(/pixels/)).toBeInTheDocument()
  })

  it('should not render when not visible', () => {
    render(<ScaleCalibrationPanel {...defaultProps} isVisible={false} />)
    
    expect(screen.queryByText('Scale Calibration')).not.toBeInTheDocument()
  })

  it('should calculate scale correctly with default feet units', async () => {
    const user = userEvent.setup()
    render(<ScaleCalibrationPanel {...defaultProps} />)
    
    // Set measured distance to 2 feet
    const measuredInput = screen.getByDisplayValue('1')
    await user.clear(measuredInput)
    await user.type(measuredInput, '2')
    
    // Set actual distance to 20 feet
    const actualInput = screen.getByDisplayValue('10')
    await user.clear(actualInput)
    await user.type(actualInput, '20')
    
    // Click Set Scale button
    const setScaleButton = screen.getByText('Set Scale')
    await user.click(setScaleButton)
    
    // Wait for the calculation
    await waitFor(() => {
      // Expected scale: 20 feet / 100 pixels = 0.2 ft/px
      expect(mockSetPlanScale).toHaveBeenCalledWith(0.2)
      // UI store is called with an object
      expect(mockUpdateUIScale).toHaveBeenCalledWith({ pixelsPerMeter: 0.2 })
    })
  })

  it('should handle unit conversion correctly', async () => {
    const user = userEvent.setup()
    render(<ScaleCalibrationPanel {...defaultProps} />)
    
    // Set measured distance to 12 inches
    const measuredInput = screen.getByDisplayValue('1')
    await user.clear(measuredInput)
    await user.type(measuredInput, '12')
    
    // Change measured unit to inches
    const measuredUnitSelect = screen.getAllByRole('combobox')[0]
    await user.selectOptions(measuredUnitSelect, 'in')
    
    // Set actual distance to 10 feet
    const actualInput = screen.getByDisplayValue('10')
    await user.clear(actualInput)
    await user.type(actualInput, '10')
    
    // Click Set Scale button
    const setScaleButton = screen.getByText('Set Scale')
    await user.click(setScaleButton)
    
    await waitFor(() => {
      // 12 inches = 1 foot, so scale should be 10 feet / 100 pixels = 0.1 ft/px
      expect(mockSetPlanScale).toHaveBeenCalledWith(0.1)
      expect(mockUpdateUIScale).toHaveBeenCalledWith({ pixelsPerMeter: 0.1 })
    })
  })

  it('should show validation error for invalid inputs', async () => {
    const user = userEvent.setup()
    render(<ScaleCalibrationPanel {...defaultProps} />)

    // Set valid inputs first to enable the button
    const measuredInput = screen.getByDisplayValue('1')
    await user.clear(measuredInput)
    await user.type(measuredInput, '5')

    const actualInput = screen.getByDisplayValue('10')
    await user.clear(actualInput)
    await user.type(actualInput, '10')

    // Wait for preview scale to be calculated
    await waitFor(() => {
      expect(screen.getByText(/Preview Scale:/)).toBeInTheDocument()
    })

    // Now set invalid measured distance
    await user.clear(measuredInput)
    await user.type(measuredInput, '-5')

    // Button should be disabled now, but let's test the validation logic by forcing a click
    const setScaleButton = screen.getByText('Set Scale')

    // The button should be disabled when inputs are invalid
    // Find the actual button element, not the span inside it
    const buttonElement = screen.getByRole('button', { name: /Set Scale/ })
    expect(buttonElement).toBeDisabled()
  })

  it('should show preview scale calculation', async () => {
    const user = userEvent.setup()
    render(<ScaleCalibrationPanel {...defaultProps} />)
    
    // Set measured distance to 5 feet
    const measuredInput = screen.getByDisplayValue('1')
    await user.clear(measuredInput)
    await user.type(measuredInput, '5')
    
    // Set actual distance to 50 feet
    const actualInput = screen.getByDisplayValue('10')
    await user.clear(actualInput)
    await user.type(actualInput, '50')
    
    await waitFor(() => {
      // Expected preview scale: 50 feet / 100 pixels = 0.5 ft/px
      // Check for the specific preview scale text (not the current scale)
      expect(screen.getByText(/Preview Scale:/)).toBeInTheDocument()
      expect(screen.getByText(/0\.500000/)).toBeInTheDocument()
      // Check that the preview scale section exists
      const previewSection = screen.getByText(/Preview Scale:/).closest('div')
      expect(previewSection).toHaveTextContent('0.500000 ft/pixel')
    })
  })

  it('should handle close button correctly', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    render(<ScaleCalibrationPanel {...defaultProps} onClose={onClose} />)

    const closeButton = screen.getByLabelText('Close')
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('should handle cancel button correctly', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    render(<ScaleCalibrationPanel {...defaultProps} onClose={onClose} />)

    const cancelButton = screen.getByText('Cancel')
    await user.click(cancelButton)

    expect(onClose).toHaveBeenCalled()
  })

  it('should disable set scale button when inputs are invalid', () => {
    render(<ScaleCalibrationPanel {...defaultProps} pixelDistance={0} />)

    // Find the actual button element, not just the text span
    const setScaleButton = screen.getByRole('button', { name: /Set Scale/ })
    expect(setScaleButton).toBeDisabled()
  })

  it('should support all unit types', async () => {
    const user = userEvent.setup()
    render(<ScaleCalibrationPanel {...defaultProps} />)
    
    const measuredUnitSelect = screen.getAllByRole('combobox')[0]
    const actualUnitSelect = screen.getAllByRole('combobox')[1]
    
    // Check all unit options are available
    const expectedUnits = ['inches', 'feet', 'meters', 'cm', 'mm']
    
    for (const unit of expectedUnits) {
      expect(screen.getAllByText(unit)).toHaveLength(2) // One for each select
    }
  })
})

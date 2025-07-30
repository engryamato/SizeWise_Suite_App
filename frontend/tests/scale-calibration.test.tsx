import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
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
    planScale: 1,
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
    expect(screen.getByText('Measured line distance: 100.0 pixels')).toBeInTheDocument()
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
      expect(mockUpdateUIScale).toHaveBeenCalledWith(0.2)
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
    })
  })

  it('should show validation error for invalid inputs', async () => {
    const user = userEvent.setup()
    render(<ScaleCalibrationPanel {...defaultProps} />)
    
    // Set invalid measured distance
    const measuredInput = screen.getByDisplayValue('1')
    await user.clear(measuredInput)
    await user.type(measuredInput, '0')
    
    // Click Set Scale button
    const setScaleButton = screen.getByText('Set Scale')
    await user.click(setScaleButton)
    
    await waitFor(() => {
      expect(screen.getByText('Measured distance must be a positive number')).toBeInTheDocument()
    })
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
      expect(screen.getByText(/Preview Scale: 0\.500000 ft\/pixel/)).toBeInTheDocument()
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
    
    const setScaleButton = screen.getByText('Set Scale')
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

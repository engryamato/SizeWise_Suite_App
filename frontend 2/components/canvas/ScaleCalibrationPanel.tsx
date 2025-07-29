'use client'

import React, { useState, useEffect } from 'react'
import { X, Ruler, Calculator, Check } from 'lucide-react'
import { useProjectStore } from '@/stores/project-store'
import { useUIStore } from '@/stores/ui-store'

interface ScaleCalibrationPanelProps {
  isVisible: boolean
  onClose: () => void
  pixelDistance: number
}

export const ScaleCalibrationPanel: React.FC<ScaleCalibrationPanelProps> = ({
  isVisible,
  onClose,
  pixelDistance
}) => {
  const { setPlanScale } = useProjectStore()
  const { setPlanScale: updateUIScale, planScale } = useUIStore()
  
  // Form state
  const [measuredValue, setMeasuredValue] = useState<string>('1')
  const [measuredUnit, setMeasuredUnit] = useState<string>('ft')
  const [actualValue, setActualValue] = useState<string>('10')
  const [actualUnit, setActualUnit] = useState<string>('ft')
  const [isCalculating, setIsCalculating] = useState(false)
  const [validationError, setValidationError] = useState<string>('')

  // Reset form when panel opens
  useEffect(() => {
    if (isVisible) {
      setMeasuredValue('1')
      setMeasuredUnit('ft')
      setActualValue('10')
      setActualUnit('ft')
      setValidationError('')
    }
  }, [isVisible])

  // Unit conversion to feet (base unit)
  const convertToFeet = (value: number, unit: string): number => {
    switch (unit) {
      case 'in': return value / 12
      case 'ft': return value
      case 'm': return value * 3.28084
      case 'cm': return value * 0.0328084
      case 'mm': return value * 0.00328084
      default: return value
    }
  }

  // Validate inputs
  const validateInputs = (): boolean => {
    const measured = parseFloat(measuredValue)
    const actual = parseFloat(actualValue)

    if (isNaN(measured) || measured <= 0) {
      setValidationError('Measured distance must be a positive number')
      return false
    }

    if (isNaN(actual) || actual <= 0) {
      setValidationError('Actual distance must be a positive number')
      return false
    }

    if (pixelDistance <= 0) {
      setValidationError('Invalid pixel distance. Please draw a line on the plan first.')
      return false
    }

    setValidationError('')
    return true
  }

  // Calculate and apply scale
  const handleCalculateScale = async () => {
    if (!validateInputs()) return

    setIsCalculating(true)
    
    try {
      const measured = parseFloat(measuredValue)
      const actual = parseFloat(actualValue)
      
      // Convert both measurements to feet for consistency
      const measuredInFeet = convertToFeet(measured, measuredUnit)
      const actualInFeet = convertToFeet(actual, actualUnit)
      
      // Calculate scale: real-world distance per pixel
      const newScale = actualInFeet / pixelDistance
      
      // Update both stores
      setPlanScale(newScale)
      updateUIScale(newScale)
      
      // Small delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500))
      
      onClose()
    } catch (error) {
      setValidationError('Error calculating scale. Please check your inputs.')
    } finally {
      setIsCalculating(false)
    }
  }

  // Calculate preview scale
  const getPreviewScale = (): number | null => {
    const measured = parseFloat(measuredValue)
    const actual = parseFloat(actualValue)
    
    if (isNaN(measured) || isNaN(actual) || measured <= 0 || actual <= 0 || pixelDistance <= 0) {
      return null
    }
    
    const measuredInFeet = convertToFeet(measured, measuredUnit)
    const actualInFeet = convertToFeet(actual, actualUnit)
    
    return actualInFeet / pixelDistance
  }

  const previewScale = getPreviewScale()

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Ruler className="w-6 h-6" />
              <h3 className="text-lg font-semibold">Scale Calibration</h3>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-2">
            Set the scale by measuring a known distance on your plan
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Pixel Distance Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calculator className="w-4 h-4" />
              <span>Measured line distance: <strong>{pixelDistance.toFixed(1)} pixels</strong></span>
            </div>
          </div>

          {/* Measured Distance Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distance you measured on the plan:
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={measuredValue}
                onChange={(e) => setMeasuredValue(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1.0"
                step="0.01"
                min="0.01"
              />
              <select
                value={measuredUnit}
                onChange={(e) => setMeasuredUnit(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="in">inches</option>
                <option value="ft">feet</option>
                <option value="m">meters</option>
                <option value="cm">cm</option>
                <option value="mm">mm</option>
              </select>
            </div>
          </div>

          {/* Actual Distance Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Actual real-world distance:
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                value={actualValue}
                onChange={(e) => setActualValue(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="10.0"
                step="0.01"
                min="0.01"
              />
              <select
                value={actualUnit}
                onChange={(e) => setActualUnit(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="in">inches</option>
                <option value="ft">feet</option>
                <option value="m">meters</option>
                <option value="cm">cm</option>
                <option value="mm">mm</option>
              </select>
            </div>
          </div>

          {/* Preview Scale */}
          {previewScale && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-800">
                <strong>Preview Scale:</strong> {previewScale.toFixed(6)} ft/pixel
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Current scale: {planScale.toFixed(6)} ft/pixel
              </div>
            </div>
          )}

          {/* Validation Error */}
          {validationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{validationError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCalculateScale}
            disabled={isCalculating || !previewScale}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {isCalculating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Setting...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Set Scale</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { Segment } from '@/types/air-duct-sizer'
import { useProjectStore } from '@/stores/project-store'
import { useCalculationStore, useDebouncedCalculation } from '@/stores/calculation-store'
import { useUnitsDisplay } from '@/hooks/useUnitsDisplay'

interface SegmentPanelProps {
  segment: Segment
}

export const SegmentPanel: React.FC<SegmentPanelProps> = ({ segment }) => {
  const { updateSegment } = useProjectStore()
  const { materials, calculateVelocity, calculateEquivalentDiameter } = useCalculationStore()
  const debouncedCalculate = useDebouncedCalculation()
  const { formatLength, formatFlow, getUnitLabel } = useUnitsDisplay()
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    type: segment.type,
    material: segment.material,
    size: { ...segment.size },
    length: segment.length,
    airflow: segment.airflow || 0,
  })
  
  // Trigger calculation when form data changes
  useEffect(() => {
    if (formData.airflow > 0 && (formData.size.width || formData.size.diameter)) {
      const calculationInput = {
        airflow: formData.airflow,
        duct_type: (formData.size.diameter ? 'round' : 'rectangular') as 'round' | 'rectangular',
        friction_rate: 0.08, // Default friction rate
        units: 'imperial' as const,
        material: formData.material,
      }
      
      debouncedCalculate.calculate('duct-sizing', calculationInput)
    }
  }, [formData, segment.segment_id, debouncedCalculate])
  
  const handleSave = () => {
    updateSegment(segment.segment_id, formData)
    setIsEditing(false)
  }
  
  const handleCancel = () => {
    setFormData({
      type: segment.type,
      material: segment.material,
      size: { ...segment.size },
      length: segment.length,
      airflow: segment.airflow || 0,
    })
    setIsEditing(false)
  }
  
  // Calculate derived values
  const area = formData.size.diameter 
    ? Math.PI * Math.pow(formData.size.diameter / 2, 2) / 144 // Round duct area in sq ft
    : (formData.size.width && formData.size.height) 
      ? (formData.size.width * formData.size.height) / 144 // Rectangular duct area in sq ft
      : 0
  
  const velocity = formData.airflow && area > 0
    ? formData.size.diameter
      ? calculateVelocity(formData.airflow, { width: formData.size.diameter, height: formData.size.diameter }) // For round ducts, use diameter as both dimensions
      : calculateVelocity(formData.airflow, { width: formData.size.width || 0, height: formData.size.height || 0 })
    : 0
  
  const equivalentDiameter = (formData.size.width && formData.size.height) 
    ? calculateEquivalentDiameter(formData.size.width, formData.size.height)
    : formData.size.diameter || 0
  
  const segmentTypes = ['straight', 'elbow', 'branch', 'reducer', 'tee', 'transition']
  const materialOptions = materials
  
  return (
    <div className="p-4 space-y-6">
      {/* Segment Properties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Segment Properties</h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Edit
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={handleSave}
                className="text-sm text-green-600 hover:text-green-700"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="text-sm text-gray-600 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            {isEditing ? (
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {segmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900 capitalize">{segment.type}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material
            </label>
            {isEditing ? (
              <select
                value={formData.material}
                onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {materialOptions.map((material) => (
                  <option key={material} value={material}>
                    {material}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900">{segment.material}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Length ({getUnitLabel('length')})
            </label>
            {isEditing ? (
              <input
                type="number"
                step="0.1"
                value={formData.length}
                onChange={(e) => setFormData({ ...formData, length: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0.1"
              />
            ) : (
              <p className="text-gray-900">{segment.length.toFixed(1)}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Duct Size */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Duct Size</h3>
        
        {formData.size.diameter ? (
          // Round duct
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diameter ({getUnitLabel('length', true)})
            </label>
            {isEditing ? (
              <input
                type="number"
                value={formData.size.diameter}
                onChange={(e) => setFormData({
                  ...formData,
                  size: { diameter: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="4"
                max="48"
              />
            ) : (
              <p className="text-gray-900">Ø{segment.size.diameter}&quot;</p>
            )}
          </div>
        ) : (
          // Rectangular duct
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width ({getUnitLabel('length', true)})
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.size.width || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    size: { ...formData.size, width: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="4"
                  max="48"
                />
              ) : (
                <p className="text-gray-900">{segment.size.width}&quot;</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height ({getUnitLabel('length', true)})
              </label>
              {isEditing ? (
                <input
                  type="number"
                  value={formData.size.height || 0}
                  onChange={(e) => setFormData({
                    ...formData,
                    size: { ...formData.size, height: Number(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="4"
                  max="48"
                />
              ) : (
                <p className="text-gray-900">{segment.size.height}&quot;</p>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="text-sm text-gray-600 space-y-1">
            <div>Area: {area.toFixed(2)} sq ft</div>
            {equivalentDiameter > 0 && !formData.size.diameter && (
              <div>Equivalent Diameter: {equivalentDiameter.toFixed(1)}&quot;</div>
            )}
          </div>
        </div>
      </div>
      
      {/* Airflow */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Airflow</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Airflow ({getUnitLabel('flow')})
          </label>
          {isEditing ? (
            <input
              type="number"
              value={formData.airflow}
              onChange={(e) => setFormData({ ...formData, airflow: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          ) : (
            <p className="text-gray-900">{segment.airflow ? formatFlow(segment.airflow, 0) : 'Not specified'}</p>
          )}
        </div>
        
        {velocity > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Calculated Values</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div>Velocity: {velocity.toFixed(0)} FPM</div>
              {velocity > 2000 && (
                <div className="text-red-600 font-medium">⚠ High velocity - consider larger duct</div>
              )}
              {velocity < 600 && (
                <div className="text-yellow-600 font-medium">⚠ Low velocity - check design</div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Warnings */}
      {segment.warnings && segment.warnings.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Warnings</h3>
          <div className="space-y-2">
            {segment.warnings.map((warning, index) => (
              <div
                key={index}
                className={`p-3 rounded-md ${
                  warning.severity === 'critical' 
                    ? 'bg-red-50 border border-red-200' 
                    : warning.severity === 'warning'
                    ? 'bg-yellow-50 border border-yellow-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className={`text-sm font-medium ${
                  warning.severity === 'critical' 
                    ? 'text-red-800' 
                    : warning.severity === 'warning'
                    ? 'text-yellow-800'
                    : 'text-blue-800'
                }`}>
                  {warning.message}
                </div>
                {warning.code_ref && (
                  <div className="text-xs text-gray-600 mt-1">
                    Reference: {warning.code_ref}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

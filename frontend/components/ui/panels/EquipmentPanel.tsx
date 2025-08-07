'use client'

import React, { useState } from 'react'
import { Equipment } from '@/types/air-duct-sizer'
import { useProjectStore } from '@/stores/project-store'

interface EquipmentPanelProps {
  equipment: Equipment
}

export const EquipmentPanel: React.FC<EquipmentPanelProps> = ({ equipment }) => {
  const { updateEquipment } = useProjectStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    type: equipment.type,
    manufacturer: equipment.properties?.manufacturer || '',
    model: equipment.properties?.model || '',
    airflow: equipment.flowProperties?.airflow || equipment.properties?.cfmCapacity || 0,
    static_pressure: equipment.properties?.staticPressureCapacity || 0,
  })
  
  const handleSave = () => {
    updateEquipment(equipment.id, formData)
    setIsEditing(false)
  }
  
  const handleCancel = () => {
    setFormData({
      type: equipment.type,
      manufacturer: equipment.properties?.manufacturer || '',
      model: equipment.properties?.model || '',
      airflow: equipment.flowProperties?.airflow || equipment.properties?.cfmCapacity || 0,
      static_pressure: equipment.properties?.staticPressureCapacity || 0,
    })
    setIsEditing(false)
  }
  
  const equipmentTypes = [
    'AHU',
    'Air Handling Unit',
    'VAV',
    'Variable Air Volume',
    'Fan',
    'Exhaust Fan',
    'Supply Fan',
    'Damper',
    'Fire Damper',
    'Smoke Damper',
    'Diffuser',
    'Supply Diffuser',
    'Return Grille',
    'Filter',
    'Coil',
    'Heat Exchanger',
    'Other'
  ]
  
  return (
    <div className="p-4 space-y-6">
      {/* Equipment Properties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Equipment Properties</h3>
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
              Equipment Type
            </label>
            {isEditing ? (
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {equipmentTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            ) : (
              <p className="text-gray-900">{equipment.type}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Manufacturer
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter manufacturer"
              />
            ) : (
              <p className="text-gray-900">{equipment.properties?.manufacturer || 'Not specified'}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter model number"
              />
            ) : (
              <p className="text-gray-900">{equipment.properties?.model || 'Not specified'}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Performance Data */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Data</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Airflow (CFM)
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
              <p className="text-gray-900">{equipment.flowProperties?.airflow || equipment.properties?.cfmCapacity || 0} CFM</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Static Pressure (in. w.g.)
            </label>
            {isEditing ? (
              <input
                type="number"
                step="0.01"
                value={formData.static_pressure}
                onChange={(e) => setFormData({ ...formData, static_pressure: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            ) : (
              <p className="text-gray-900">{equipment.properties?.staticPressureCapacity || 'Not specified'} in. w.g.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Position */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Position</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              X Position
            </label>
            <p className="text-gray-900">{equipment.position?.x?.toFixed(0) || 0} px</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Y Position
            </label>
            <p className="text-gray-900">{equipment.position?.y?.toFixed(0) || 0} px</p>
          </div>
        </div>
      </div>
      
      {/* Catalog Data (Pro Feature) */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Catalog Data</h3>
        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Access manufacturer catalogs and performance data
            </p>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
              Pro Only
            </span>
          </div>
          <button
            disabled
            className="mt-3 w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-md cursor-not-allowed"
          >
            Browse Catalog
          </button>
        </div>
      </div>
      
      {/* Equipment Notes */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
        <textarea
          placeholder="Add notes about this equipment..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          disabled={!isEditing}
        />
      </div>
      
      {/* Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900">Actions</h3>
        
        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
          <span>Delete Equipment</span>
        </button>
        
        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
          <span>Duplicate Equipment</span>
        </button>
      </div>
    </div>
  )
}

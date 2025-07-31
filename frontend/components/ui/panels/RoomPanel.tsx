'use client'

import React, { useState } from 'react'
import { Room } from '@/types/air-duct-sizer'
import { useProjectStore } from '@/stores/project-store'
import { useCalculationStore } from '@/stores/calculation-store'
import { useUnitsDisplay } from '@/hooks/useUnitsDisplay'

interface RoomPanelProps {
  room: Room
}

export const RoomPanel: React.FC<RoomPanelProps> = ({ room }) => {
  const { updateRoom } = useProjectStore()
  const { calculateArea } = useCalculationStore()
  const { formatLength, formatArea, formatFlow, getUnitLabel } = useUnitsDisplay()
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: room.name,
    function: room.function || '',
    dimensions: { ...room.dimensions },
    airflow: room.airflow || 0,
  })
  
  const handleSave = () => {
    updateRoom(room.room_id, formData)
    setIsEditing(false)
  }
  
  const handleCancel = () => {
    setFormData({
      name: room.name,
      function: room.function || '',
      dimensions: { ...room.dimensions },
      airflow: room.airflow || 0,
    })
    setIsEditing(false)
  }
  
  const calculatedArea = calculateArea(room.dimensions.length * 12, room.dimensions.width * 12)
  
  return (
    <div className="p-4 space-y-6">
      {/* Room Properties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Room Properties</h3>
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
              Room Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{room.name}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Function
            </label>
            {isEditing ? (
              <select
                value={formData.function}
                onChange={(e) => setFormData({ ...formData, function: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select function</option>
                <option value="office">Office</option>
                <option value="classroom">Classroom</option>
                <option value="laboratory">Laboratory</option>
                <option value="conference">Conference Room</option>
                <option value="storage">Storage</option>
                <option value="mechanical">Mechanical Room</option>
                <option value="other">Other</option>
              </select>
            ) : (
              <p className="text-gray-900">{room.function || 'Not specified'}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Dimensions */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dimensions</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Length ({getUnitLabel('length')})
            </label>
            {isEditing ? (
              <input
                type="number"
                step="0.1"
                value={formData.dimensions.length}
                onChange={(e) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, length: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            ) : (
              <p className="text-gray-900">{room.dimensions.length.toFixed(1)}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width ({getUnitLabel('length')})
            </label>
            {isEditing ? (
              <input
                type="number"
                step="0.1"
                value={formData.dimensions.width}
                onChange={(e) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, width: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            ) : (
              <p className="text-gray-900">{room.dimensions.width.toFixed(1)}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height ({getUnitLabel('length')})
            </label>
            {isEditing ? (
              <input
                type="number"
                step="0.1"
                value={formData.dimensions.height}
                onChange={(e) => setFormData({
                  ...formData,
                  dimensions: { ...formData.dimensions, height: Number(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="6"
              />
            ) : (
              <p className="text-gray-900">{room.dimensions.height.toFixed(1)}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Area ({getUnitLabel('area')})
            </label>
            <p className="text-gray-900 font-medium">
              {formatArea(room.dimensions.length * room.dimensions.width, 1)}
            </p>
          </div>
        </div>
      </div>
      
      {/* Airflow */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Airflow Requirements</h3>
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
            <p className="text-gray-900">{room.airflow || 'Not specified'} CFM</p>
          )}
        </div>
        
        {room.airflow && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Calculated Values</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <div>Air Changes per Hour: {((room.airflow * 60) / (room.dimensions.length * room.dimensions.width * room.dimensions.height)).toFixed(1)} ACH</div>
              <div>CFM per sq ft: {(room.airflow / (room.dimensions.length * room.dimensions.width)).toFixed(1)}</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Position */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Position</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              X Position
            </label>
            <p className="text-gray-900">{room.x?.toFixed(0) || 0} px</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Y Position
            </label>
            <p className="text-gray-900">{room.y?.toFixed(0) || 0} px</p>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { useState } from 'react'
import { Save, Download, Upload, Lock, Unlock } from 'lucide-react'
import { useProjectStore } from '@/stores/project-store'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'

export const ProjectPanel: React.FC = () => {
  const { currentProject, updateProject, updateComputationalProperties } = useProjectStore()
  const { user, canEditComputationalProperties } = useAuthStore()
  const { addNotification } = useUIStore()
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    project_name: currentProject?.project_name || '',
    user_name: currentProject?.user_name || '',
    contractor_name: currentProject?.contractor_name || '',
    project_location: currentProject?.project_location || '',
    codes: currentProject?.codes || [],
  })
  
  const [compProps, setCompProps] = useState({
    default_velocity: currentProject?.computational_properties?.default_velocity || 1200,
    pressure_class: currentProject?.computational_properties?.pressure_class || 'Medium',
    altitude: currentProject?.computational_properties?.altitude || 0,
    r_value: currentProject?.computational_properties?.r_value || 4.2,
    friction_rate: currentProject?.computational_properties?.friction_rate || 0.08,
  })
  
  if (!currentProject) {
    return (
      <div className="p-4">
        <p className="text-gray-500">No project loaded</p>
      </div>
    )
  }
  
  const handleSave = () => {
    updateProject(formData)
    if (canEditComputationalProperties()) {
      updateComputationalProperties(compProps)
    }
    setIsEditing(false)
    addNotification({
      type: 'success',
      message: 'Project saved successfully',
      duration: 3000,
    })
  }
  
  const handleCancel = () => {
    setFormData({
      project_name: currentProject.project_name,
      user_name: currentProject.user_name || '',
      contractor_name: currentProject.contractor_name || '',
      project_location: currentProject.project_location,
      codes: currentProject.codes,
    })
    setIsEditing(false)
  }
  
  const handleCodeToggle = (code: string) => {
    const newCodes = formData.codes.includes(code)
      ? formData.codes.filter(c => c !== code)
      : [...formData.codes, code]
    setFormData({ ...formData, codes: newCodes })
  }
  
  const availableCodes = ['SMACNA', 'ASHRAE', 'UL', 'IMC', 'NFPA']
  const pressureClasses = ['Low', 'Medium', 'High']
  
  return (
    <div className="p-4 space-y-6">
      {/* Project Information */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Project Information</h3>
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
              Project Name *
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.project_name}
                onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            ) : (
              <p className="text-gray-900">{currentProject.project_name}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location *
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.project_location}
                onChange={(e) => setFormData({ ...formData, project_location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            ) : (
              <p className="text-gray-900">{currentProject.project_location}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.user_name}
                onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{currentProject.user_name || 'Not specified'}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contractor
            </label>
            {isEditing ? (
              <input
                type="text"
                value={formData.contractor_name}
                onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <p className="text-gray-900">{currentProject.contractor_name || 'Not specified'}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Codes and Standards */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Codes & Standards</h3>
        <div className="space-y-2">
          {availableCodes.map((code) => (
            <label key={code} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.codes.includes(code)}
                onChange={() => handleCodeToggle(code)}
                disabled={!isEditing}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-label={`Enable ${code} code standard`}
                id={`code-${code.toLowerCase().replace(/\s+/g, '-')}`}
              />
              <span className="ml-2 text-sm text-gray-700">{code}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Computational Properties */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Computational Properties</h3>
          {!canEditComputationalProperties() && (
            <div className="flex items-center text-sm text-gray-500">
              <Lock size={14} className="mr-1" />
              Pro Only
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Default Velocity (FPM)
            </label>
            {isEditing && canEditComputationalProperties() ? (
              <input
                type="number"
                value={compProps.default_velocity}
                onChange={(e) => setCompProps({ ...compProps, default_velocity: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="100"
                max="5000"
              />
            ) : (
              <div className="flex items-center">
                <p className="text-gray-900">{compProps.default_velocity}</p>
                {!canEditComputationalProperties() && (
                  <Lock size={14} className="ml-2 text-gray-400" />
                )}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pressure Class
            </label>
            {isEditing && canEditComputationalProperties() ? (
              <select
                value={compProps.pressure_class}
                onChange={(e) => setCompProps({ ...compProps, pressure_class: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {pressureClasses.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center">
                <p className="text-gray-900">{compProps.pressure_class}</p>
                {!canEditComputationalProperties() && (
                  <Lock size={14} className="ml-2 text-gray-400" />
                )}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Altitude (ft)
            </label>
            {isEditing && canEditComputationalProperties() ? (
              <input
                type="number"
                value={compProps.altitude}
                onChange={(e) => setCompProps({ ...compProps, altitude: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="15000"
              />
            ) : (
              <div className="flex items-center">
                <p className="text-gray-900">{compProps.altitude}</p>
                {!canEditComputationalProperties() && (
                  <Lock size={14} className="ml-2 text-gray-400" />
                )}
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Friction Rate (in. w.g./100ft)
            </label>
            {isEditing && canEditComputationalProperties() ? (
              <input
                type="number"
                step="0.01"
                value={compProps.friction_rate}
                onChange={(e) => setCompProps({ ...compProps, friction_rate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0.01"
                max="1.0"
              />
            ) : (
              <div className="flex items-center">
                <p className="text-gray-900">{compProps.friction_rate}</p>
                {!canEditComputationalProperties() && (
                  <Lock size={14} className="ml-2 text-gray-400" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium text-gray-900">Actions</h3>
        
        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
          <Save size={16} />
          <span>Save Project</span>
        </button>
        
        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
          <Download size={16} />
          <span>Export Project</span>
        </button>
        
        <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
          <Upload size={16} />
          <span>Import Project</span>
        </button>
      </div>
    </div>
  )
}

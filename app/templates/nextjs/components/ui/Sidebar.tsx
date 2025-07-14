'use client'

import React from 'react'
import { X, Settings, Home, Minus, Wrench } from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useProjectStore } from '@/stores/project-store'
import { ProjectPanel } from './panels/ProjectPanel'
import { RoomPanel } from './panels/RoomPanel'
import { SegmentPanel } from './panels/SegmentPanel'
import { EquipmentPanel } from './panels/EquipmentPanel'

export const Sidebar: React.FC = () => {
  const {
    activePanel,
    selectedObjects,
    setSidebarOpen,
    setActivePanel,
  } = useUIStore()
  
  const { currentProject, getRoomById, getSegmentById, getEquipmentById } = useProjectStore()
  
  // Determine which panel to show based on selection
  const getActivePanelContent = () => {
    if (selectedObjects.length === 1) {
      const selectedId = selectedObjects[0]
      
      // Check if it's a room
      const room = getRoomById(selectedId)
      if (room) {
        return <RoomPanel room={room} />
      }
      
      // Check if it's a segment
      const segment = getSegmentById(selectedId)
      if (segment) {
        return <SegmentPanel segment={segment} />
      }
      
      // Check if it's equipment
      const equipment = getEquipmentById(selectedId)
      if (equipment) {
        return <EquipmentPanel equipment={equipment} />
      }
    }
    
    // Default to project panel
    return <ProjectPanel />
  }
  
  const getPanelTitle = () => {
    if (selectedObjects.length === 1) {
      const selectedId = selectedObjects[0]
      
      const room = getRoomById(selectedId)
      if (room) return `Room: ${room.name}`
      
      const segment = getSegmentById(selectedId)
      if (segment) return `Segment: ${segment.type}`
      
      const equipment = getEquipmentById(selectedId)
      if (equipment) return `Equipment: ${equipment.type}`
    }
    
    return 'Project Properties'
  }
  
  const getPanelIcon = () => {
    if (selectedObjects.length === 1) {
      const selectedId = selectedObjects[0]
      
      const room = getRoomById(selectedId)
      if (room) return <Home size={16} />
      
      const segment = getSegmentById(selectedId)
      if (segment) return <Minus size={16} />
      
      const equipment = getEquipmentById(selectedId)
      if (equipment) return <Wrench size={16} />
    }
    
    return <Settings size={16} />
  }
  
  const tabs = [
    {
      id: 'project',
      label: 'Project',
      icon: <Settings size={16} />,
    },
    {
      id: 'room',
      label: 'Room',
      icon: <Home size={16} />,
      disabled: !selectedObjects.some(id => getRoomById(id)),
    },
    {
      id: 'segment',
      label: 'Segment',
      icon: <Minus size={16} />,
      disabled: !selectedObjects.some(id => getSegmentById(id)),
    },
    {
      id: 'equipment',
      label: 'Equipment',
      icon: <Wrench size={16} />,
      disabled: !selectedObjects.some(id => getEquipmentById(id)),
    },
  ]
  
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          {getPanelIcon()}
          <h2 className="text-lg font-semibold text-gray-900">
            {getPanelTitle()}
          </h2>
        </div>
        
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActivePanel(tab.id as any)}
            disabled={tab.disabled}
            className={`
              flex-1 flex items-center justify-center space-x-1 py-3 px-2 text-sm font-medium border-b-2 transition-colors
              ${activePanel === tab.id
                ? 'border-blue-500 text-blue-600'
                : tab.disabled
                ? 'border-transparent text-gray-400 cursor-not-allowed'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
            aria-label={`${tab.label} properties panel`}
            title={`View ${tab.label.toLowerCase()} properties`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">
        {getActivePanelContent()}
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500">
          {currentProject && (
            <>
              <div>Last modified: {new Date(currentProject.last_modified).toLocaleString()}</div>
              <div className="mt-1">
                Objects: {currentProject.rooms.length + currentProject.segments.length + currentProject.equipment.length}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

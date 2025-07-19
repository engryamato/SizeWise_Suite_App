'use client'

import React from 'react'
import {
  MousePointer,
  Square,
  Minus,
  Settings,
  Hand,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Zap,
  Upload,
  Ruler
} from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { useProjectStore } from '@/stores/project-store'
// import { TierEnforcement, UsageCounter } from '@/components/tier/TierEnforcement'
import { DrawingTool } from '@/types/air-duct-sizer'

interface ToolbarProps {
  className?: string
  onImportPlan?: () => void
}

export const Toolbar: React.FC<ToolbarProps> = ({ className = '', onImportPlan }) => {
  const {
    drawingState,
    grid,
    viewport,
    planScale,
    setDrawingTool,
    setGridVisible,
    setSnapToGrid,
    setViewport,
    resetViewport,
  } = useUIStore()

  const { currentProject } = useProjectStore()
  
  const tools: Array<{
    id: DrawingTool
    icon: React.ReactNode
    label: string
    shortcut?: string
    description: string
    tierFeature?: 'rooms' | 'segments' | 'equipment'
  }> = [
    {
      id: 'select',
      icon: <MousePointer size={20} />,
      label: 'Select',
      shortcut: 'V',
      description: 'Select and move objects',
    },
    {
      id: 'room',
      icon: <Square size={20} />,
      label: 'Room',
      shortcut: 'R',
      description: 'Draw rooms and spaces',
      tierFeature: 'rooms',
    },
    {
      id: 'duct',
      icon: <Minus size={20} />,
      label: 'Duct',
      shortcut: 'D',
      description: 'Draw duct segments',
      tierFeature: 'segments',
    },
    {
      id: 'equipment',
      icon: <Zap size={20} />,
      label: 'Equipment',
      shortcut: 'E',
      description: 'Place HVAC equipment',
      tierFeature: 'equipment',
    },
    {
      id: 'pan',
      icon: <Hand size={20} />,
      label: 'Pan',
      shortcut: 'H',
      description: 'Pan and navigate the canvas',
    },
    {
      id: 'scale',
      icon: <Ruler size={20} />,
      label: 'Scale',
      shortcut: 'L',
      description: 'Calibrate plan scale',
    },
  ]
  
  const handleToolSelect = (tool: DrawingTool) => {
    setDrawingTool(tool)
  }
  
  const handleZoomIn = () => {
    const newScale = Math.min(5, viewport.scale * 1.2)
    setViewport({ scale: newScale })
  }
  
  const handleZoomOut = () => {
    const newScale = Math.max(0.1, viewport.scale / 1.2)
    setViewport({ scale: newScale })
  }
  
  const handleResetView = () => {
    resetViewport()
  }
  
  const handleToggleGrid = () => {
    setGridVisible(!grid.visible)
  }
  
  const handleToggleSnap = () => {
    setSnapToGrid(!grid.snapEnabled)
  }
  
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg shadow-sm p-2 ${className}`}
      role="toolbar"
      aria-label="Drawing tools"
    >
      {/* Drawing Tools */}
      <div className="flex flex-col space-y-1 mb-3" role="group" aria-label="Drawing tools">
        <div className="text-xs font-medium text-gray-500 px-2 py-1">Tools</div>
        {tools.map((tool) => (
          // <TierEnforcement key={tool.id} feature={tool.tierFeature}>
            <button
              key={tool.id}
              type="button"
              onClick={() => handleToolSelect(tool.id)}
              className={`
                flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                ${drawingState.tool === tool.id
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
              title={`${tool.description} (${tool.shortcut})`}
              aria-label={`${tool.label} tool - ${tool.description}`}
              aria-pressed={drawingState.tool === tool.id}
            >
              {tool.icon}
              <span>{tool.label}</span>
              {tool.shortcut && (
                <span className="ml-auto text-xs text-gray-400" aria-label={`Keyboard shortcut: ${tool.shortcut}`}>
                  {tool.shortcut}
                </span>
              )}
            </button>
          // </TierEnforcement>
        ))}
      </div>
      
      {/* View Controls */}
      <div className="flex flex-col space-y-1 mb-3">
        <div className="text-xs font-medium text-gray-500 px-2 py-1">View</div>
        
        <button
          onClick={handleZoomIn}
          className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          title="Zoom In (+)"
        >
          <ZoomIn size={16} />
          <span>Zoom In</span>
        </button>
        
        <button
          onClick={handleZoomOut}
          className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          title="Zoom Out (-)"
        >
          <ZoomOut size={16} />
          <span>Zoom Out</span>
        </button>
        
        <button
          onClick={handleResetView}
          className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          title="Reset View (0)"
        >
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
        
        <div className="text-xs text-gray-500 px-2 py-1">
          Zoom: {Math.round(viewport.scale * 100)}%
        </div>
      </div>
      
      {/* Grid Controls */}
      <div className="flex flex-col space-y-1">
        <div className="text-xs font-medium text-gray-500 px-2 py-1">Grid</div>
        
        <button
          onClick={handleToggleGrid}
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${grid.visible
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'text-gray-700 hover:bg-gray-100'
            }
          `}
          title="Toggle Grid (G)"
        >
          <Grid3X3 size={16} />
          <span>Show Grid</span>
        </button>
        
        <button
          onClick={handleToggleSnap}
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${grid.snapEnabled
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'text-gray-700 hover:bg-gray-100'
            }
          `}
          title="Toggle Snap to Grid (S)"
        >
          <Grid3X3 size={16} />
          <span>Snap to Grid</span>
        </button>
        
      <div className="text-xs text-gray-500 px-2 py-1">
        Grid: {grid.size}px
      </div>
      </div>

      {/* Plan Controls */}
      <div className="flex flex-col space-y-1 mt-3">
        <div className="text-xs font-medium text-gray-500 px-2 py-1">Plan</div>
        <button
          onClick={onImportPlan}
          className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <Upload size={16} />
          <span>Import Plan</span>
        </button>

        {/* Scale Status */}
        {currentProject?.plan_pdf && (
          <div className="mt-2 px-2 py-1 bg-gray-50 rounded text-xs">
            <div className="text-gray-500 mb-1">Scale Status:</div>
            {currentProject.plan_scale && currentProject.plan_scale !== 1 ? (
              <div className="text-green-600 font-medium">
                ✓ Calibrated ({currentProject.plan_scale.toFixed(4)} ft/px)
              </div>
            ) : (
              <div className="text-amber-600 font-medium">
                ⚠ Not Calibrated
              </div>
            )}
          </div>
        )}
      </div>

      {/* Usage Counters for Free tier - Temporarily disabled */}
      {/* <div className="border-t border-gray-200 pt-3 space-y-2">
        <div className="text-xs font-medium text-gray-500 px-2 py-1">Usage</div>
        <UsageCounter type="rooms" />
        <UsageCounter type="segments" />
        <UsageCounter type="equipment" />
      </div> */}
    </div>
  )
}

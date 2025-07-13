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
  RotateCcw
} from 'lucide-react'
import { useUIStore } from '@/stores/ui-store'
import { DrawingTool } from '@/types/air-duct-sizer'

interface ToolbarProps {
  className?: string
}

export const Toolbar: React.FC<ToolbarProps> = ({ className = '' }) => {
  const {
    drawingState,
    grid,
    viewport,
    setDrawingTool,
    setGridVisible,
    setSnapToGrid,
    setViewport,
    resetViewport,
  } = useUIStore()
  
  const tools: Array<{
    id: DrawingTool
    icon: React.ReactNode
    label: string
    shortcut?: string
  }> = [
    {
      id: 'select',
      icon: <MousePointer size={20} />,
      label: 'Select',
      shortcut: 'V',
    },
    {
      id: 'room',
      icon: <Square size={20} />,
      label: 'Room',
      shortcut: 'R',
    },
    {
      id: 'duct',
      icon: <Minus size={20} />,
      label: 'Duct',
      shortcut: 'D',
    },
    {
      id: 'equipment',
      icon: <Settings size={20} />,
      label: 'Equipment',
      shortcut: 'E',
    },
    {
      id: 'pan',
      icon: <Hand size={20} />,
      label: 'Pan',
      shortcut: 'H',
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
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-2 ${className}`}>
      {/* Drawing Tools */}
      <div className="flex flex-col space-y-1 mb-3">
        <div className="text-xs font-medium text-gray-500 px-2 py-1">Tools</div>
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolSelect(tool.id)}
            className={`
              flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${drawingState.tool === tool.id
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'text-gray-700 hover:bg-gray-100'
              }
            `}
            title={`${tool.label} (${tool.shortcut})`}
          >
            {tool.icon}
            <span>{tool.label}</span>
            {tool.shortcut && (
              <span className="ml-auto text-xs text-gray-400">{tool.shortcut}</span>
            )}
          </button>
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
    </div>
  )
}

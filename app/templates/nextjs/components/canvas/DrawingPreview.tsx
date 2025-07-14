'use client'

import React from 'react'
import { Group, Rect, Line } from 'react-konva'
import { useUIStore } from '@/stores/ui-store'

export const DrawingPreview: React.FC = () => {
  const { drawingState } = useUIStore()
  
  if (!drawingState.isDrawing || !drawingState.startPoint || !drawingState.endPoint) {
    return null
  }
  
  const { startPoint, endPoint, tool } = drawingState
  
  const renderPreview = () => {
    switch (tool) {
      case 'room':
        return renderRoomPreview()
      case 'duct':
        return renderDuctPreview()
      default:
        return null
    }
  }
  
  const renderRoomPreview = () => {
    const width = Math.abs(endPoint.x - startPoint.x)
    const height = Math.abs(endPoint.y - startPoint.y)
    const x = Math.min(startPoint.x, endPoint.x)
    const y = Math.min(startPoint.y, endPoint.y)
    
    return (
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="rgba(59, 130, 246, 0.2)"
        stroke="#3b82f6"
        strokeWidth={2}
        dash={[5, 5]}
        listening={false}
      />
    )
  }
  
  const renderDuctPreview = () => {
    return (
      <Line
        points={[startPoint.x, startPoint.y, endPoint.x, endPoint.y]}
        stroke="#3b82f6"
        strokeWidth={3}
        lineCap="round"
        dash={[5, 5]}
        listening={false}
      />
    )
  }
  
  return (
    <Group listening={false}>
      {renderPreview()}
    </Group>
  )
}

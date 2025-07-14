'use client'

import React, { useRef } from 'react'
import { Group, Line, Text, Circle } from 'react-konva'
import Konva from 'konva'
import { Segment } from '@/types/air-duct-sizer'
import { useProjectStore } from '@/stores/project-store'
import { useUIStore } from '@/stores/ui-store'

interface DuctSegmentProps {
  segment: Segment
  isSelected: boolean
  onSelect: () => void
}

export const DuctSegment: React.FC<DuctSegmentProps> = ({ segment, isSelected, onSelect }) => {
  const groupRef = useRef<Konva.Group>(null)
  const { updateSegment } = useProjectStore()
  const { grid } = useUIStore()
  
  // Get segment points
  const points = segment.points || [0, 0, 100, 100]
  const [x1, y1, x2, y2] = points
  
  // Calculate segment properties
  const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2
  
  // Handle dragging of control points
  const handlePointDrag = (pointIndex: number, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    let newX = node.x()
    let newY = node.y()
    
    // Snap to grid if enabled
    if (grid.snapEnabled) {
      newX = Math.round(newX / grid.size) * grid.size
      newY = Math.round(newY / grid.size) * grid.size
      node.position({ x: newX, y: newY })
    }
    
    // Update segment points
    const newPoints = [...points]
    newPoints[pointIndex * 2] = newX
    newPoints[pointIndex * 2 + 1] = newY
    
    // Calculate new length
    const newLength = Math.sqrt(
      Math.pow(newPoints[2] - newPoints[0], 2) + 
      Math.pow(newPoints[3] - newPoints[1], 2)
    ) / 12 // Convert pixels to feet
    
    updateSegment(segment.segment_id, {
      points: newPoints,
      length: Math.max(0.1, newLength), // Minimum length
    })
  }
  
  // Get segment color based on warnings and selection
  const getSegmentColor = () => {
    if (isSelected) return '#3b82f6' // Blue when selected
    
    // Check for warnings
    if (segment.warnings && segment.warnings.length > 0) {
      const hasError = segment.warnings.some(w => w.severity === 'critical')
      const hasWarning = segment.warnings.some(w => w.severity === 'warning')
      
      if (hasError) return '#ef4444' // Red for errors
      if (hasWarning) return '#f59e0b' // Orange for warnings
    }
    
    // Color based on velocity (if calculated)
    if (segment.velocity) {
      if (segment.velocity > 2000) return '#ef4444' // Red for high velocity
      if (segment.velocity > 1500) return '#f59e0b' // Orange for medium-high velocity
      if (segment.velocity < 600) return '#6b7280' // Gray for low velocity
    }
    
    return '#374151' // Default dark gray
  }
  
  // Get stroke width based on duct size
  const getStrokeWidth = () => {
    if (isSelected) return 4
    
    // Base width on duct size (larger ducts = thicker lines)
    const baseWidth = 2
    if (segment.size.diameter) {
      return Math.max(2, Math.min(8, segment.size.diameter / 4))
    } else if (segment.size.width && segment.size.height) {
      const avgSize = (segment.size.width + segment.size.height) / 2
      return Math.max(2, Math.min(8, avgSize / 4))
    }
    
    return baseWidth
  }
  
  // Render control points (only when selected)
  const renderControlPoints = () => {
    if (!isSelected) return null
    
    return (
      <>
        {/* Start point */}
        <Circle
          x={x1}
          y={y1}
          radius={6}
          fill="#ffffff"
          stroke="#3b82f6"
          strokeWidth={2}
          draggable={true}
          onDragMove={(e) => handlePointDrag(0, e)}
        />
        
        {/* End point */}
        <Circle
          x={x2}
          y={y2}
          radius={6}
          fill="#ffffff"
          stroke="#3b82f6"
          strokeWidth={2}
          draggable={true}
          onDragMove={(e) => handlePointDrag(1, e)}
        />
      </>
    )
  }
  
  // Render segment labels
  const renderLabels = () => {
    const fontSize = 12
    const labelOffset = 20
    
    // Calculate label position (perpendicular to segment)
    const perpAngle = angle + Math.PI / 2
    const labelX = midX + Math.cos(perpAngle) * labelOffset
    const labelY = midY + Math.sin(perpAngle) * labelOffset
    
    return (
      <Group>
        {/* Size label */}
        <Text
          x={labelX}
          y={labelY - fontSize}
          text={getSegmentSizeText()}
          fontSize={fontSize}
          fontFamily="Arial"
          fill="#374151"
          align="center"
          offsetX={getSegmentSizeText().length * 3} // Approximate centering
          listening={false}
        />
        
        {/* Velocity label (if calculated) */}
        {segment.velocity && (
          <Text
            x={labelX}
            y={labelY}
            text={`${Math.round(segment.velocity)} FPM`}
            fontSize={fontSize * 0.8}
            fontFamily="Arial"
            fill="#059669"
            align="center"
            offsetX={`${Math.round(segment.velocity)} FPM`.length * 2.5}
            listening={false}
          />
        )}
        
        {/* Airflow label (if specified) */}
        {segment.airflow && (
          <Text
            x={labelX}
            y={labelY + fontSize}
            text={`${Math.round(segment.airflow)} CFM`}
            fontSize={fontSize * 0.8}
            fontFamily="Arial"
            fill="#6366f1"
            align="center"
            offsetX={`${Math.round(segment.airflow)} CFM`.length * 2.5}
            listening={false}
          />
        )}
      </Group>
    )
  }
  
  // Get segment size text
  const getSegmentSizeText = () => {
    if (segment.size.diameter) {
      return `Ø${segment.size.diameter}"`
    } else if (segment.size.width && segment.size.height) {
      return `${segment.size.width}" × ${segment.size.height}"`
    }
    return 'Unknown'
  }
  
  // Render warning indicators
  const renderWarningIndicators = () => {
    if (!segment.warnings || segment.warnings.length === 0) return null
    
    const hasError = segment.warnings.some(w => w.severity === 'critical')
    const hasWarning = segment.warnings.some(w => w.severity === 'warning')
    
    if (!hasError && !hasWarning) return null
    
    return (
      <Circle
        x={midX + 15}
        y={midY - 15}
        radius={8}
        fill={hasError ? '#ef4444' : '#f59e0b'}
        stroke="#ffffff"
        strokeWidth={2}
        listening={false}
      />
    )
  }
  
  return (
    <Group ref={groupRef}>
      {/* Main duct line */}
      <Line
        points={points}
        stroke={getSegmentColor()}
        strokeWidth={getStrokeWidth()}
        lineCap="round"
        lineJoin="round"
        onClick={onSelect}
        onTap={onSelect}
      />
      
      {/* Selection highlight */}
      {isSelected && (
        <Line
          points={points}
          stroke="#3b82f6"
          strokeWidth={getStrokeWidth() + 2}
          lineCap="round"
          lineJoin="round"
          opacity={0.3}
          listening={false}
        />
      )}
      
      {/* Control points */}
      {renderControlPoints()}
      
      {/* Labels */}
      {(isSelected || segment.velocity || segment.airflow) && renderLabels()}
      
      {/* Warning indicators */}
      {renderWarningIndicators()}
    </Group>
  )
}

'use client'

import React, { useRef, useEffect } from 'react'
import { Group, Rect, Text, Circle } from 'react-konva'
import Konva from 'konva'
import { Room as RoomType } from '@/types/air-duct-sizer'
import { useProjectStore } from '@/stores/project-store'
import { useUIStore } from '@/stores/ui-store'
import tokens from '@/shared/designTokens'

interface RoomProps {
  room: RoomType
  isSelected: boolean
  onSelect: () => void
}

export const Room: React.FC<RoomProps> = ({ room, isSelected, onSelect }) => {
  const groupRef = useRef<Konva.Group>(null)
  const { updateRoom } = useProjectStore()
  const { grid } = useUIStore()
  
  // Calculate room dimensions in pixels (assuming 12px = 1ft)
  const pixelWidth = room.dimensions.length * 12
  const pixelHeight = room.dimensions.width * 12
  const x = room.x || 0
  const y = room.y || 0
  
  // Handle dragging
  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    let newX = node.x()
    let newY = node.y()
    
    // Snap to grid if enabled
    if (grid.snapEnabled) {
      newX = Math.round(newX / grid.size) * grid.size
      newY = Math.round(newY / grid.size) * grid.size
      node.position({ x: newX, y: newY })
    }
    
    updateRoom(room.room_id, { x: newX, y: newY })
  }
  
  // Handle resize (for future implementation)
  const handleTransformEnd = (e: Konva.KonvaEventObject<Event>) => {
    const node = e.target as Konva.Group
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    
    // Reset scale and update dimensions
    node.scaleX(1)
    node.scaleY(1)
    
    const newLength = (pixelWidth * scaleX) / 12 // Convert back to feet
    const newWidth = (pixelHeight * scaleY) / 12
    
    updateRoom(room.room_id, {
      dimensions: {
        ...room.dimensions,
        length: Math.max(1, newLength), // Minimum 1 foot
        width: Math.max(1, newWidth),
      }
    })
  }
  
  // Calculate text position and size
  const textX = pixelWidth / 2
  const textY = pixelHeight / 2
  const fontSize = Math.min(pixelWidth / 8, pixelHeight / 8, 16)
  
  // Room color based on selection and warnings
  const getRoomColor = () => {
    if (isSelected) return tokens.color.highlight // Blue when selected
    // TODO: Add warning colors based on room.warnings
    return tokens.color['grid-light'] // Default gray
  }
  
  const getStrokeColor = () => {
    if (isSelected) return tokens.color['primary-dark'] // Darker blue when selected
    return tokens.color.label // Default gray
  }
  
  // Resize handles (only show when selected)
  const renderResizeHandles = () => {
    if (!isSelected) return null
    
    const handleSize = 8
    const handles = [
      { x: pixelWidth, y: pixelHeight }, // Bottom-right
      { x: pixelWidth, y: 0 }, // Top-right
      { x: 0, y: pixelHeight }, // Bottom-left
      { x: pixelWidth / 2, y: pixelHeight }, // Bottom-center
      { x: pixelWidth, y: pixelHeight / 2 }, // Right-center
    ]
    
    return handles.map((handle, index) => (
      <Circle
        key={`handle-${index}`}
        x={handle.x}
        y={handle.y}
        radius={handleSize / 2}
        fill={tokens.color.surface}
        stroke={tokens.color.highlight}
        strokeWidth={2}
        draggable={false}
        listening={false}
      />
    ))
  }
  
  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      draggable={true}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
      onClick={onSelect}
      onTap={onSelect}
    >
      {/* Room rectangle */}
      <Rect
        width={pixelWidth}
        height={pixelHeight}
        fill={getRoomColor()}
        stroke={getStrokeColor()}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={4}
      />
      
      {/* Room name */}
      <Text
        x={textX}
        y={textY - fontSize / 2}
        text={room.name}
        fontSize={fontSize}
        fontFamily="Arial"
        fill={tokens.color.label}
        align="center"
        verticalAlign="middle"
        offsetX={textX}
        listening={false}
      />
      
      {/* Room dimensions text */}
      <Text
        x={textX}
        y={textY + fontSize / 2 + 4}
        text={`${room.dimensions.length.toFixed(1)}' × ${room.dimensions.width.toFixed(1)}'`}
        fontSize={fontSize * 0.7}
        fontFamily="Arial"
        fill={tokens.color['text-secondary']}
        align="center"
        verticalAlign="middle"
        offsetX={textX}
        listening={false}
      />
      
      {/* Airflow text (if specified) */}
      {room.airflow && (
        <Text
          x={textX}
          y={textY + fontSize + 8}
          text={`${room.airflow} CFM`}
          fontSize={fontSize * 0.6}
          fontFamily="Arial"
          fill={tokens.color.positive}
          align="center"
          verticalAlign="middle"
          offsetX={textX}
          listening={false}
        />
      )}
      
      {/* Resize handles */}
      {renderResizeHandles()}
    </Group>
  )
}

'use client'

import React from 'react'
import { Group, Line } from 'react-konva'
import { useUIStore } from '@/stores/ui-store'
import tokens from '@/shared/designTokens'

interface GridProps {
  size: number
}

export const Grid: React.FC<GridProps> = ({ size }) => {
  const { viewport } = useUIStore()
  
  // Calculate visible area based on viewport
  const stageWidth = window.innerWidth
  const stageHeight = window.innerHeight
  
  // Calculate grid bounds in world coordinates
  const startX = Math.floor((-viewport.x / viewport.scale) / size) * size
  const endX = Math.ceil((stageWidth - viewport.x) / viewport.scale / size) * size
  const startY = Math.floor((-viewport.y / viewport.scale) / size) * size
  const endY = Math.ceil((stageHeight - viewport.y) / viewport.scale / size) * size
  
  // Generate vertical lines
  const verticalLines = []
  for (let x = startX; x <= endX; x += size) {
    verticalLines.push(
      <Line
        key={`v-${x}`}
        points={[x, startY, x, endY]}
        stroke={tokens.color['grid-light']}
        strokeWidth={0.5}
        listening={false}
      />
    )
  }
  
  // Generate horizontal lines
  const horizontalLines = []
  for (let y = startY; y <= endY; y += size) {
    horizontalLines.push(
      <Line
        key={`h-${y}`}
        points={[startX, y, endX, y]}
        stroke={tokens.color['grid-light']}
        strokeWidth={0.5}
        listening={false}
      />
    )
  }
  
  // Major grid lines (every 5th line)
  const majorVerticalLines = []
  for (let x = startX; x <= endX; x += size * 5) {
    majorVerticalLines.push(
      <Line
        key={`mv-${x}`}
        points={[x, startY, x, endY]}
        stroke={tokens.color['grid-dark']}
        strokeWidth={1}
        listening={false}
      />
    )
  }
  
  const majorHorizontalLines = []
  for (let y = startY; y <= endY; y += size * 5) {
    majorHorizontalLines.push(
      <Line
        key={`mh-${y}`}
        points={[startX, y, endX, y]}
        stroke={tokens.color['grid-dark']}
        strokeWidth={1}
        listening={false}
      />
    )
  }
  
  return (
    <Group listening={false}>
      {/* Minor grid lines */}
      {verticalLines}
      {horizontalLines}
      
      {/* Major grid lines */}
      {majorVerticalLines}
      {majorHorizontalLines}
    </Group>
  )
}

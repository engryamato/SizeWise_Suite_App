'use client'

import React from 'react'
import { Rect } from 'react-konva'
import { useUIStore } from '@/stores/ui-store'

export const SelectionBox: React.FC = () => {
  const { selectionBox } = useUIStore()
  
  if (!selectionBox.visible) return null
  
  return (
    <Rect
      x={selectionBox.x}
      y={selectionBox.y}
      width={selectionBox.width}
      height={selectionBox.height}
      fill="rgba(59, 130, 246, 0.1)"
      stroke="#3b82f6"
      strokeWidth={1}
      dash={[5, 5]}
      listening={false}
    />
  )
}

'use client'

import React from 'react'
import { Rect } from 'react-konva'
import { useUIStore } from '@/stores/ui-store'
import tokens from '@/shared/designTokens'

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `${r}, ${g}, ${b}`
}

export const SelectionBox: React.FC = () => {
  const { selectionBox } = useUIStore()
  
  if (!selectionBox.visible) return null
  
  return (
    <Rect
      x={selectionBox.x}
      y={selectionBox.y}
      width={selectionBox.width}
      height={selectionBox.height}
      fill={`rgba(${hexToRgb(tokens.color.highlight)}, 0.1)`}
      stroke={tokens.color.highlight}
      strokeWidth={1}
      dash={[5, 5]}
      listening={false}
    />
  )
}

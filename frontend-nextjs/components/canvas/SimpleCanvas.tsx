'use client'

import React, { useRef, useEffect, useState } from 'react'
import { useUIStore } from '@/stores/ui-store'
import { useProjectStore } from '@/stores/project-store'

interface SimpleCanvasProps {
  width: number
  height: number
}

export const SimpleCanvas: React.FC<SimpleCanvasProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  
  const {
    drawingState,
    grid,
    viewport,
    selectedObjects,
    setDrawingTool,
    selectObject,
    clearSelection,
  } = useUIStore()
  
  const {
    currentProject,
    addRoom,
    addSegment,
    addEquipment,
  } = useProjectStore()

  // Draw the canvas content
  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, width, height)
    
    // Apply viewport transform
    ctx.save()
    ctx.translate(viewport.x, viewport.y)
    ctx.scale(viewport.scale, viewport.scale)

    // Draw grid if visible
    if (grid.visible) {
      drawGrid(ctx)
    }

    // Draw project objects
    if (currentProject) {
      drawRooms(ctx)
      drawSegments(ctx)
      drawEquipment(ctx)
    }

    ctx.restore()

    // Draw UI elements (not affected by viewport transform)
    drawUI(ctx)
  }

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const gridSize = grid.size
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 0.5

    // Calculate visible area
    const startX = Math.floor((-viewport.x / viewport.scale) / gridSize) * gridSize
    const endX = Math.ceil((width - viewport.x) / viewport.scale / gridSize) * gridSize
    const startY = Math.floor((-viewport.y / viewport.scale) / gridSize) * gridSize
    const endY = Math.ceil((height - viewport.y) / viewport.scale / gridSize) * gridSize

    // Draw vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, startY)
      ctx.lineTo(x, endY)
      ctx.stroke()
    }

    // Draw horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(startX, y)
      ctx.lineTo(endX, y)
      ctx.stroke()
    }
  }

  const drawRooms = (ctx: CanvasRenderingContext2D) => {
    if (!currentProject) return

    currentProject.rooms.forEach((room) => {
      const x = room.x || 0
      const y = room.y || 0
      const w = room.dimensions.length * 12 // Convert feet to pixels
      const h = room.dimensions.width * 12

      // Room rectangle
      ctx.fillStyle = selectedObjects.includes(room.room_id) ? '#3b82f6' : '#f3f4f6'
      ctx.strokeStyle = selectedObjects.includes(room.room_id) ? '#1d4ed8' : '#6b7280'
      ctx.lineWidth = selectedObjects.includes(room.room_id) ? 2 : 1

      ctx.fillRect(x, y, w, h)
      ctx.strokeRect(x, y, w, h)

      // Room label
      ctx.fillStyle = '#374151'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(room.name, x + w / 2, y + h / 2)
      
      // Dimensions
      ctx.font = '10px Arial'
      ctx.fillStyle = '#6b7280'
      ctx.fillText(`${room.dimensions.length.toFixed(1)}' × ${room.dimensions.width.toFixed(1)}'`, x + w / 2, y + h / 2 + 15)
    })
  }

  const drawSegments = (ctx: CanvasRenderingContext2D) => {
    if (!currentProject) return

    currentProject.segments.forEach((segment) => {
      if (!segment.points || segment.points.length < 4) return

      const [x1, y1, x2, y2] = segment.points

      ctx.strokeStyle = selectedObjects.includes(segment.segment_id) ? '#3b82f6' : '#374151'
      ctx.lineWidth = selectedObjects.includes(segment.segment_id) ? 4 : 2
      ctx.lineCap = 'round'

      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()

      // Segment label
      const midX = (x1 + x2) / 2
      const midY = (y1 + y2) / 2
      
      ctx.fillStyle = '#374151'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      
      if (segment.size.width && segment.size.height) {
        ctx.fillText(`${segment.size.width}" × ${segment.size.height}"`, midX, midY - 10)
      } else if (segment.size.diameter) {
        ctx.fillText(`Ø${segment.size.diameter}"`, midX, midY - 10)
      }
    })
  }

  const drawEquipment = (ctx: CanvasRenderingContext2D) => {
    if (!currentProject) return

    currentProject.equipment.forEach((equipment) => {
      const x = equipment.x || 0
      const y = equipment.y || 0
      const size = 40

      // Equipment shape
      ctx.fillStyle = selectedObjects.includes(equipment.equipment_id) ? '#3b82f6' : '#059669'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2

      ctx.fillRect(x - size / 2, y - size / 2, size, size)
      ctx.strokeRect(x - size / 2, y - size / 2, size, size)

      // Equipment label
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(equipment.type.substring(0, 3).toUpperCase(), x, y + 3)
    })
  }

  const drawUI = (ctx: CanvasRenderingContext2D) => {
    // Draw drawing preview if active
    if (isDrawing && startPoint && drawingState.tool !== 'select') {
      // This would show the preview while drawing
    }
  }

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - viewport.x) / viewport.scale
    const y = (e.clientY - rect.top - viewport.y) / viewport.scale

    setStartPoint({ x, y })
    setIsDrawing(true)

    if (drawingState.tool === 'select') {
      // Check if clicking on an object
      const clickedObject = findObjectAt(x, y)
      if (clickedObject) {
        selectObject(clickedObject)
      } else {
        clearSelection()
      }
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - viewport.x) / viewport.scale
    const y = (e.clientY - rect.top - viewport.y) / viewport.scale

    const width = Math.abs(x - startPoint.x)
    const height = Math.abs(y - startPoint.y)

    // Create objects based on tool
    switch (drawingState.tool) {
      case 'room':
        if (width > 10 && height > 10) {
          addRoom({
            name: `Room ${(currentProject?.rooms.length || 0) + 1}`,
            dimensions: {
              length: width / 12, // Convert pixels to feet
              width: height / 12,
              height: 10,
            },
            x: Math.min(startPoint.x, x),
            y: Math.min(startPoint.y, y),
          })
        }
        break
      case 'duct':
        if (width > 20 || height > 20) {
          addSegment({
            type: 'straight',
            material: 'galvanized_steel',
            size: { width: 12, height: 8 },
            length: Math.sqrt(width * width + height * height) / 12,
            points: [startPoint.x, startPoint.y, x, y],
            warnings: [],
          })
        }
        break
      case 'equipment':
        addEquipment({
          type: 'AHU',
          airflow: 1000,
          x: startPoint.x,
          y: startPoint.y,
        })
        break
    }

    setIsDrawing(false)
    setStartPoint(null)
  }

  const findObjectAt = (x: number, y: number): string | null => {
    if (!currentProject) return null

    // Check rooms
    for (const room of currentProject.rooms) {
      const rx = room.x || 0
      const ry = room.y || 0
      const rw = room.dimensions.length * 12
      const rh = room.dimensions.width * 12

      if (x >= rx && x <= rx + rw && y >= ry && y <= ry + rh) {
        return room.room_id
      }
    }

    // Check equipment
    for (const equipment of currentProject.equipment) {
      const ex = equipment.x || 0
      const ey = equipment.y || 0
      const size = 40

      if (x >= ex - size / 2 && x <= ex + size / 2 && y >= ey - size / 2 && y <= ey + size / 2) {
        return equipment.equipment_id
      }
    }

    return null
  }

  // Redraw when state changes
  useEffect(() => {
    draw()
  }, [currentProject, selectedObjects, viewport, grid, width, height])

  return (
    <div className="relative w-full h-full bg-white">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
      
      {/* Canvas info overlay */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded px-2 py-1 text-xs text-gray-600">
        Simple Canvas Mode - {drawingState.tool} tool active
      </div>
    </div>
  )
}

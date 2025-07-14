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
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  
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
    if (isDrawing && startPoint && currentPoint && drawingState.tool !== 'select' && drawingState.tool !== 'pan') {
      ctx.save()
      ctx.translate(viewport.x, viewport.y)
      ctx.scale(viewport.scale, viewport.scale)

      ctx.strokeStyle = '#3b82f6'
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])

      switch (drawingState.tool) {
        case 'room':
          const width = Math.abs(currentPoint.x - startPoint.x)
          const height = Math.abs(currentPoint.y - startPoint.y)
          const x = Math.min(startPoint.x, currentPoint.x)
          const y = Math.min(startPoint.y, currentPoint.y)

          ctx.fillRect(x, y, width, height)
          ctx.strokeRect(x, y, width, height)

          // Show dimensions
          ctx.fillStyle = '#374151'
          ctx.font = '12px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(`${(width / 12).toFixed(1)}' × ${(height / 12).toFixed(1)}'`, x + width / 2, y + height / 2)
          break

        case 'duct':
          ctx.beginPath()
          ctx.moveTo(startPoint.x, startPoint.y)
          ctx.lineTo(currentPoint.x, currentPoint.y)
          ctx.stroke()

          // Show length
          const length = Math.sqrt(
            Math.pow(currentPoint.x - startPoint.x, 2) +
            Math.pow(currentPoint.y - startPoint.y, 2)
          ) / 12
          const midX = (startPoint.x + currentPoint.x) / 2
          const midY = (startPoint.y + currentPoint.y) / 2

          ctx.fillStyle = '#374151'
          ctx.font = '12px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(`${length.toFixed(1)}'`, midX, midY - 10)
          break

        case 'equipment':
          const size = 40
          ctx.fillRect(startPoint.x - size / 2, startPoint.y - size / 2, size, size)
          ctx.strokeRect(startPoint.x - size / 2, startPoint.y - size / 2, size, size)
          break
      }

      ctx.restore()
    }
  }

  // Snap to grid helper
  const snapToGrid = (x: number, y: number): { x: number; y: number } => {
    if (!grid.snapEnabled) return { x, y }

    const gridSize = grid.size
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    }
  }

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    let x = (e.clientX - rect.left - viewport.x) / viewport.scale
    let y = (e.clientY - rect.top - viewport.y) / viewport.scale

    // Apply snap to grid for drawing tools
    if (drawingState.tool !== 'select' && drawingState.tool !== 'pan') {
      const snapped = snapToGrid(x, y)
      x = snapped.x
      y = snapped.y
    }

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
    let x = (e.clientX - rect.left - viewport.x) / viewport.scale
    let y = (e.clientY - rect.top - viewport.y) / viewport.scale

    // Apply snap to grid for drawing tools
    if (drawingState.tool !== 'select' && drawingState.tool !== 'pan') {
      const snapped = snapToGrid(x, y)
      x = snapped.x
      y = snapped.y
    }

    const width = Math.abs(x - startPoint.x)
    const height = Math.abs(y - startPoint.y)

    // Create objects based on tool
    switch (drawingState.tool) {
      case 'room':
        if (width > 20 && height > 20) { // Minimum room size
          const roomLength = width / 12 // Convert pixels to feet
          const roomWidth = height / 12

          addRoom({
            name: `Room ${(currentProject?.rooms.length || 0) + 1}`,
            function: 'office',
            dimensions: {
              length: Math.max(roomLength, 1), // Minimum 1 foot
              width: Math.max(roomWidth, 1),
              height: 10,
            },
            airflow: Math.round(roomLength * roomWidth * 2), // 2 CFM per sq ft estimate
            x: Math.min(startPoint.x, x),
            y: Math.min(startPoint.y, y),
          })
        }
        break
      case 'duct':
        if (width > 20 || height > 20) { // Minimum duct length
          const ductLength = Math.sqrt(width * width + height * height) / 12

          addSegment({
            type: 'straight',
            material: 'galvanized_steel',
            size: { width: 12, height: 8 }, // Default rectangular size
            length: Math.max(ductLength, 1), // Minimum 1 foot
            airflow: 1000, // Default airflow
            points: [startPoint.x, startPoint.y, x, y],
            warnings: [],
          })
        }
        break
      case 'equipment':
        addEquipment({
          type: 'AHU',
          airflow: 1000,
          static_pressure: 1.0,
          x: startPoint.x,
          y: startPoint.y,
        })
        break
    }

    setIsDrawing(false)
    setStartPoint(null)
    setCurrentPoint(null)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    let x = (e.clientX - rect.left - viewport.x) / viewport.scale
    let y = (e.clientY - rect.top - viewport.y) / viewport.scale

    // Apply snap to grid for drawing tools
    if (drawingState.tool !== 'select' && drawingState.tool !== 'pan') {
      const snapped = snapToGrid(x, y)
      x = snapped.x
      y = snapped.y
    }

    setCurrentPoint({ x, y })

    if (isDrawing && startPoint) {
      if (drawingState.tool === 'pan' || isPanning) {
        // Pan the viewport
        const deltaX = (x - startPoint.x) * viewport.scale
        const deltaY = (y - startPoint.y) * viewport.scale

        useUIStore.getState().setViewport({
          x: viewport.x + deltaX,
          y: viewport.y + deltaY
        })

        setStartPoint({ x, y })
      }

      // Redraw to show preview
      draw()
    }
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default for our shortcuts
      const shortcuts = ['v', 'r', 'd', 'e', 'h', 'g', 's', 'Escape']
      if (shortcuts.includes(e.key)) {
        e.preventDefault()
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setDrawingTool('select')
          break
        case 'r':
          setDrawingTool('room')
          break
        case 'd':
          setDrawingTool('duct')
          break
        case 'e':
          setDrawingTool('equipment')
          break
        case 'h':
          setDrawingTool('pan')
          break
        case 'g':
          // Toggle grid visibility
          useUIStore.getState().setGridVisible(!grid.visible)
          break
        case 's':
          // Toggle snap to grid
          useUIStore.getState().setSnapToGrid(!grid.snapEnabled)
          break
        case 'escape':
          clearSelection()
          setDrawingTool('select')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [grid.visible, grid.snapEnabled, setDrawingTool, clearSelection])

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
        className={`${drawingState.tool === 'pan' ? 'cursor-grab' : 'cursor-crosshair'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      
      {/* Canvas info overlay */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded px-3 py-2 text-xs text-gray-600 space-y-1">
        <div className="font-medium">Tool: {drawingState.tool.toUpperCase()}</div>
        <div>Grid: {grid.visible ? 'ON' : 'OFF'} | Snap: {grid.snapEnabled ? 'ON' : 'OFF'}</div>
        <div>Zoom: {(viewport.scale * 100).toFixed(0)}%</div>
        {currentProject && (
          <div>
            Rooms: {currentProject.rooms.length} |
            Segments: {currentProject.segments.length} |
            Equipment: {currentProject.equipment.length}
          </div>
        )}
      </div>

      {/* Keyboard shortcuts help */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded px-3 py-2 text-xs text-gray-600">
        <div className="font-medium mb-1">Shortcuts:</div>
        <div>V: Select | R: Room | D: Duct | E: Equipment | H: Pan</div>
        <div>G: Toggle Grid | S: Toggle Snap | ESC: Clear Selection</div>
      </div>
    </div>
  )
}

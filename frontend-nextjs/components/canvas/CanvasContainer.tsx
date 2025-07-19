'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import Konva from 'konva'
import { useUIStore } from '@/stores/ui-store'
import { useProjectStore } from '@/stores/project-store'
import { Grid } from './Grid'
import { Room } from './Room'
import { DuctSegment } from './DuctSegment'
import { Equipment } from './Equipment'
import { SelectionBox } from './SelectionBox'
import { DrawingPreview } from './DrawingPreview'
import { PlanBackground } from './PlanBackground'
import { ScaleCalibrationPanel } from './ScaleCalibrationPanel'

interface CanvasContainerProps {
  width: number
  height: number
}

export const CanvasContainer: React.FC<CanvasContainerProps> = ({ width, height }) => {
  const stageRef = useRef<Konva.Stage>(null)
  const [stageSize, setStageSize] = useState({ width, height })

  // Scale calibration state
  const [scaleCalibrationVisible, setScaleCalibrationVisible] = useState(false)
  const [calibrationPixelDistance, setCalibrationPixelDistance] = useState(0)
  
  // Store hooks
  const {
    viewport,
    grid,
    drawingState,
    selectedObjects,
    selectionBox,
    setViewport,
    startDrawing,
    updateDrawing,
    finishDrawing,
    cancelDrawing,
    selectObject,
    clearSelection,
    showSelectionBox,
    updateSelectionBox,
    hideSelectionBox,
    setPlanScale: updateUIScale,
    planScale,
  } = useUIStore()
  
  const {
    currentProject,
    addRoom,
    addSegment,
    addEquipment,
    setPlanScale,
  } = useProjectStore()

  // Update stage size when container size changes
  useEffect(() => {
    setStageSize({ width, height })
  }, [width, height])

  // Handle mouse/touch events
  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage()
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    // Convert screen coordinates to world coordinates
    const worldPos = {
      x: (pos.x - viewport.x) / viewport.scale,
      y: (pos.y - viewport.y) / viewport.scale,
    }

    // Handle different drawing tools
    switch (drawingState.tool) {
      case 'select':
        handleSelectTool(e, worldPos)
        break
      case 'room':
        handleRoomTool(worldPos)
        break
      case 'duct':
        handleDuctTool(worldPos)
        break
      case 'equipment':
        handleEquipmentTool(worldPos)
        break
      case 'pan':
        handlePanTool(e, pos)
        break
      case 'scale':
        handleScaleTool(worldPos)
        break
    }
  }

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage()
    if (!stage) return

    const pos = stage.getPointerPosition()
    if (!pos) return

    const worldPos = {
      x: (pos.x - viewport.x) / viewport.scale,
      y: (pos.y - viewport.y) / viewport.scale,
    }

    if (drawingState.isDrawing) {
      updateDrawing(snapToGrid(worldPos))
    }

    // Update selection box if dragging
    if (selectionBox.visible && drawingState.tool === 'select') {
      const width = worldPos.x - selectionBox.x
      const height = worldPos.y - selectionBox.y
      updateSelectionBox(width, height)
    }
  }

  const handleStageMouseUp = () => {
    if (drawingState.isDrawing) {
      finishDrawingAction()
    }
    
    if (selectionBox.visible) {
      handleSelectionBoxComplete()
      hideSelectionBox()
    }
  }

  // Handle wheel events for zooming
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    
    const stage = e.target.getStage()
    if (!stage) return

    const oldScale = viewport.scale
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const mousePointTo = {
      x: (pointer.x - viewport.x) / oldScale,
      y: (pointer.y - viewport.y) / oldScale,
    }

    const scaleBy = 1.1
    const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy
    
    // Clamp scale between 0.1 and 5
    const clampedScale = Math.max(0.1, Math.min(5, newScale))

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    }

    setViewport({
      scale: clampedScale,
      x: newPos.x,
      y: newPos.y,
    })
  }

  // Tool handlers
  const handleSelectTool = (e: Konva.KonvaEventObject<MouseEvent>, worldPos: { x: number; y: number }) => {
    // If clicking on empty space, start selection box
    if (e.target === e.target.getStage()) {
      clearSelection()
      showSelectionBox(worldPos.x, worldPos.y)
      startDrawing(worldPos)
    }
  }

  const handleRoomTool = (worldPos: { x: number; y: number }) => {
    if (!drawingState.isDrawing) {
      startDrawing(snapToGrid(worldPos))
    }
  }

  const handleDuctTool = (worldPos: { x: number; y: number }) => {
    if (!drawingState.isDrawing) {
      startDrawing(snapToGrid(worldPos))
    }
  }

  const handleEquipmentTool = (worldPos: { x: number; y: number }) => {
    // Equipment is placed immediately, no dragging
    const snappedPos = snapToGrid(worldPos)
    addEquipment({
      type: 'AHU',
      airflow: 1000,
      x: snappedPos.x,
      y: snappedPos.y,
    })
  }

  const handlePanTool = (e: Konva.KonvaEventObject<MouseEvent>, screenPos: { x: number; y: number }) => {
    if (!drawingState.isDrawing) {
      startDrawing(screenPos)
    } else if (drawingState.startPoint) {
      const dx = screenPos.x - drawingState.startPoint.x
      const dy = screenPos.y - drawingState.startPoint.y

      setViewport({
        x: viewport.x + dx,
        y: viewport.y + dy,
      })
    }
  }

  const handleScaleTool = (worldPos: { x: number; y: number }) => {
    if (!drawingState.isDrawing) {
      startDrawing(worldPos)
    }
  }

  // Finish drawing action based on current tool
  const finishDrawingAction = () => {
    if (!drawingState.startPoint || !drawingState.endPoint) {
      finishDrawing()
      return
    }

    const start = drawingState.startPoint
    const end = drawingState.endPoint

    switch (drawingState.tool) {
      case 'room':
        const roomWidth = Math.abs(end.x - start.x)
        const roomHeight = Math.abs(end.y - start.y)
        
        if (roomWidth > 10 && roomHeight > 10) { // Minimum size check
          addRoom({
            name: `Room ${(currentProject?.rooms.length || 0) + 1}`,
            dimensions: {
              length: roomWidth / 12, // Convert pixels to feet (assuming 12px = 1ft)
              width: roomHeight / 12,
              height: 10, // Default height
            },
            x: Math.min(start.x, end.x),
            y: Math.min(start.y, end.y),
          })
        }
        break
        
      case 'duct':
        const distance = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        )
        
        if (distance > 20) { // Minimum length check
          addSegment({
            type: 'straight',
            material: 'galvanized_steel',
            size: { width: 12, height: 8 }, // Default size
            length: distance / 12, // Convert pixels to feet
            points: [start.x, start.y, end.x, end.y],
            warnings: [],
          })
        }
        break

      case 'scale':
        const pixelDistance = Math.sqrt(
          Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
        )
        if (pixelDistance > 10) { // Minimum distance check
          setCalibrationPixelDistance(pixelDistance)
          setScaleCalibrationVisible(true)
        }
        break
    }

    finishDrawing()
  }

  // Handle selection box completion
  const handleSelectionBoxComplete = () => {
    if (!currentProject) return

    const { x, y, width, height } = selectionBox
    const selectedIds: string[] = []

    // Check rooms
    currentProject.rooms.forEach(room => {
      if (room.x !== undefined && room.y !== undefined) {
        const roomRight = room.x + (room.dimensions.length * 12)
        const roomBottom = room.y + (room.dimensions.width * 12)
        
        if (isRectangleIntersecting(x, y, width, height, room.x, room.y, roomRight - room.x, roomBottom - room.y)) {
          selectedIds.push(room.room_id)
        }
      }
    })

    // Check segments
    currentProject.segments.forEach(segment => {
      if (segment.points && segment.points.length >= 4) {
        const [x1, y1, x2, y2] = segment.points
        if (isLineIntersectingRectangle(x1, y1, x2, y2, x, y, width, height)) {
          selectedIds.push(segment.segment_id)
        }
      }
    })

    if (selectedIds.length > 0) {
      // TODO: Implement multi-select
      selectObject(selectedIds[0])
    }
  }

  // Snap to grid helper
  const snapToGrid = (pos: { x: number; y: number }) => {
    if (!grid.snapEnabled) return pos
    
    const gridSize = grid.size
    return {
      x: Math.round(pos.x / gridSize) * gridSize,
      y: Math.round(pos.y / gridSize) * gridSize,
    }
  }

  // Geometry helpers
  const isRectangleIntersecting = (
    x1: number, y1: number, w1: number, h1: number,
    x2: number, y2: number, w2: number, h2: number
  ): boolean => {
    return !(x1 > x2 + w2 || x2 > x1 + w1 || y1 > y2 + h2 || y2 > y1 + h1)
  }

  const isLineIntersectingRectangle = (
    x1: number, y1: number, x2: number, y2: number,
    rx: number, ry: number, rw: number, rh: number
  ): boolean => {
    // Simplified line-rectangle intersection
    return (
      (x1 >= rx && x1 <= rx + rw && y1 >= ry && y1 <= ry + rh) ||
      (x2 >= rx && x2 <= rx + rw && y2 >= ry && y2 <= ry + rh)
    )
  }

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100">
        <p className="text-gray-500">No project loaded</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-white">
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={viewport.scale}
        scaleY={viewport.scale}
        x={viewport.x}
        y={viewport.y}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onWheel={handleWheel}
        draggable={false}
      >
        {/* Background layer */}
        <Layer>
          {grid.visible && <Grid size={grid.size} />}
          {currentProject.plan_pdf && (
            <PlanBackground
              pdfData={currentProject.plan_pdf}
              scale={planScale}
              offsetX={0}
              offsetY={0}
            />
          )}
        </Layer>

        {/* Main drawing layer */}
        <Layer>
          {/* Render rooms */}
          {currentProject.rooms.map(room => (
            <Room
              key={room.room_id}
              room={room}
              isSelected={selectedObjects.includes(room.room_id)}
              onSelect={() => selectObject(room.room_id)}
            />
          ))}

          {/* Render duct segments */}
          {currentProject.segments.map(segment => (
            <DuctSegment
              key={segment.segment_id}
              segment={segment}
              isSelected={selectedObjects.includes(segment.segment_id)}
              onSelect={() => selectObject(segment.segment_id)}
            />
          ))}

          {/* Render equipment */}
          {currentProject.equipment.map(equipment => (
            <Equipment
              key={equipment.equipment_id}
              equipment={equipment}
              isSelected={selectedObjects.includes(equipment.equipment_id)}
              onSelect={() => selectObject(equipment.equipment_id)}
            />
          ))}

          {/* Selection box */}
          {selectionBox.visible && <SelectionBox />}

          {/* Drawing preview */}
          {drawingState.isDrawing && <DrawingPreview />}
        </Layer>
      </Stage>

      {/* Scale Calibration Panel */}
      <ScaleCalibrationPanel
        isVisible={scaleCalibrationVisible}
        onClose={() => setScaleCalibrationVisible(false)}
        pixelDistance={calibrationPixelDistance}
      />
    </div>
  )
}

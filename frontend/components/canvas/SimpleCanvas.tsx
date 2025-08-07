'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useUIStore } from '@/stores/ui-store'
import { useProjectStore } from '@/stores/project-store'
import { HVACTracing } from '@/lib/monitoring/HVACTracing'
import { useSentryErrorReporting } from '@/components/error/SentryErrorBoundary'

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
  const { reportError } = useSentryErrorReporting()
  
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

  // --- PDF Background State ---
  const [pdfImage, setPdfImage] = useState<HTMLImageElement | null>(null)
  const pdfUrlRef = useRef<string | null>(null)

  // Load PDF as image whenever plan_pdf changes
  useEffect(() => {
    let revokeUrl: string | null = null
    let isMounted = true
    async function loadPdfImage() {
      setPdfImage(null)
      if (!currentProject?.plan_pdf || !currentProject.plan_pdf.startsWith('data:application/pdf')) return
      try {
        const [{ getDocument, GlobalWorkerOptions }, worker] = await Promise.all([
          // @ts-ignore
          import('pdfjs-dist/build/pdf'),
          // @ts-ignore
          import('pdfjs-dist/build/pdf.worker.entry')
        ])
        if (!GlobalWorkerOptions.workerSrc) {
          GlobalWorkerOptions.workerSrc = worker
        }
        const pdf = await getDocument({ data: atob(currentProject.plan_pdf.split(',')[1]) }).promise
        const page = await pdf.getPage(1)
        const viewport = page.getViewport({ scale: 2 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        await page.render({ canvasContext: ctx, viewport }).promise
        const url = canvas.toDataURL()
        const img = new window.Image()
        img.onload = () => {
          if (isMounted) setPdfImage(img)
        }
        img.src = url
        pdfUrlRef.current = url
        revokeUrl = url
      } catch (err) {
        console.error('Failed to load PDF background:', err)
        reportError(err as Error, {
          component: 'SimpleCanvas',
          action: 'load_pdf_background',
          projectId: currentProject?.id
        }, {
          canvas_error: 'pdf_load_failure'
        })
      }
    }
    loadPdfImage()
    return () => {
      isMounted = false
      if (revokeUrl) {
        // No need to revoke data URLs, but if using object URLs, do revoke here
      }
    }
  }, [currentProject?.id, currentProject?.plan_pdf, reportError])

  // Grid drawing function
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
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
  }, [grid.size, viewport.x, viewport.y, viewport.scale, width, height])

  // Room drawing function
  const drawRooms = useCallback((ctx: CanvasRenderingContext2D) => {
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
  }, [currentProject, selectedObjects]);

  // Segments drawing function
  const drawSegments = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!currentProject) return

    currentProject.segments.forEach((segment) => {
      if (!segment.points || segment.points.length < 4) return

      // Draw duct segment
      ctx.strokeStyle = selectedObjects.includes(segment.segment_id) ? '#ef4444' : '#6b7280'
      ctx.lineWidth = selectedObjects.includes(segment.segment_id) ? 3 : 2
      ctx.beginPath()
      ctx.moveTo(segment.points[0], segment.points[1])
      ctx.lineTo(segment.points[2], segment.points[3])
      ctx.stroke()

      // Draw size label
      if (segment.size) {
        const midX = (segment.points[0] + segment.points[2]) / 2
        const midY = (segment.points[1] + segment.points[3]) / 2

        ctx.fillStyle = '#374151'
        ctx.font = '10px Arial'
        ctx.textAlign = 'center'

        if (segment.size.width && segment.size.height) {
          ctx.fillText(`${segment.size.width}" × ${segment.size.height}"`, midX, midY - 10)
        } else if (segment.size.diameter) {
          ctx.fillText(`Ø${segment.size.diameter}"`, midX, midY - 10)
        }
      }
    })
  }, [currentProject, selectedObjects]);

  // Equipment drawing function
  const drawEquipment = useCallback((ctx: CanvasRenderingContext2D) => {
    if (!currentProject) return

    currentProject.equipment.forEach((equipment) => {
      const x = equipment.position?.x || 0
      const y = equipment.position?.y || 0
      const size = 20

      // Equipment rectangle
      ctx.fillStyle = selectedObjects.includes(equipment.id) ? '#8b5cf6' : '#e5e7eb'
      ctx.strokeStyle = selectedObjects.includes(equipment.id) ? '#7c3aed' : '#6b7280'
      ctx.lineWidth = selectedObjects.includes(equipment.id) ? 2 : 1

      ctx.fillRect(x - size/2, y - size/2, size, size)
      ctx.strokeRect(x - size/2, y - size/2, size, size)

      // Equipment label
      ctx.fillStyle = '#374151'
      ctx.font = '10px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(equipment.type.substring(0, 3).toUpperCase(), x, y + 3)
    })
  }, [currentProject, selectedObjects]);

  // UI drawing function
  const drawUI = useCallback((ctx: CanvasRenderingContext2D) => {
    // Draw drawing preview if active
    if (isDrawing && startPoint && currentPoint && drawingState.tool !== 'select' && drawingState.tool !== 'pan') {
      ctx.save()
      ctx.translate(viewport.x, viewport.y)
      ctx.scale(viewport.scale, viewport.scale)

      ctx.strokeStyle = '#3b82f6'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])

      switch (drawingState.tool) {
        case 'room': {
          const width = Math.abs(currentPoint.x - startPoint.x)
          const height = Math.abs(currentPoint.y - startPoint.y)
          const x = Math.min(startPoint.x, currentPoint.x)
          const y = Math.min(startPoint.y, currentPoint.y)

          ctx.fillRect(x, y, width, height)
          ctx.strokeRect(x, y, width, height)
          break
        }
        case 'duct': {
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

          ctx.fillStyle = '#3b82f6'
          ctx.font = '12px Arial'
          ctx.textAlign = 'center'
          ctx.fillText(`${length.toFixed(1)}'`, midX, midY - 10)
          break
        }
        case 'equipment': {
          const size = 20
          ctx.fillRect(currentPoint.x - size/2, currentPoint.y - size/2, size, size)
          ctx.strokeRect(currentPoint.x - size/2, currentPoint.y - size/2, size, size)
          break
        }
      }

      ctx.restore()
    }
  }, [isDrawing, startPoint, currentPoint, drawingState.tool, viewport]);

  // Draw the canvas content
  const draw = useCallback(() => {
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

    // Draw PDF background first
    if (pdfImage) {
      ctx.globalAlpha = 1.0
      ctx.drawImage(pdfImage, 0, 0)
    }

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
  }, [width, height, viewport, pdfImage, grid, currentProject, drawGrid, drawRooms, drawSegments, drawEquipment, drawUI]);

  // Snap to grid helper
  const snapToGrid = (x: number, y: number): { x: number; y: number } => {
    if (!grid.snapEnabled) return { x, y }

    const gridSize = grid.size
    return {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    }
  }

  // Event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - viewport.x) / viewport.scale
    const y = (e.clientY - rect.top - viewport.y) / viewport.scale

    const snapped = snapToGrid(x, y)
    setStartPoint(snapped)
    setCurrentPoint(snapped)
    setIsDrawing(true)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - viewport.x) / viewport.scale
    const y = (e.clientY - rect.top - viewport.y) / viewport.scale

    const snapped = snapToGrid(x, y)
    setCurrentPoint(snapped)
  }

  const handleMouseUp = () => {
    if (isDrawing && startPoint && currentPoint && drawingState.tool !== 'select' && drawingState.tool !== 'pan') {
      // Create new object based on tool
      // Implementation would go here
    }
    setIsDrawing(false)
    setStartPoint(null)
    setCurrentPoint(null)
  }

  // Use effects
  useEffect(() => {
    draw()
  }, [draw])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-300 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
    </div>
  )
}

export default SimpleCanvas

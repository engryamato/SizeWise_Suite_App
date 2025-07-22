'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Image } from 'react-konva'

interface PlanBackgroundProps {
  pdfData?: string
  scale: number
  offsetX: number
  offsetY: number
}

export const PlanBackground: React.FC<PlanBackgroundProps> = ({ pdfData, scale, offsetX, offsetY }) => {
  const [canvasImage, setCanvasImage] = useState<HTMLCanvasElement | null>(null)
  const workerLoaded = useRef(false)

  useEffect(() => {
    const loadPdf = async () => {
      if (!pdfData) {
        setCanvasImage(null)
        return
      }

      const [{ getDocument, GlobalWorkerOptions }, worker] = await Promise.all([
        // @ts-ignore
        import('pdfjs-dist/build/pdf'),
        // @ts-ignore
        import('pdfjs-dist/build/pdf.worker.entry')
      ])
      if (!workerLoaded.current) {
        GlobalWorkerOptions.workerSrc = worker
        workerLoaded.current = true
      }

      const response = await fetch(pdfData)
      const arrayBuffer = await response.arrayBuffer()
      const pdf = await getDocument({ data: arrayBuffer }).promise
      const page = await pdf.getPage(1)
      const viewport = page.getViewport({ scale: 1 })
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')!
      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({ canvasContext: context, viewport }).promise
      setCanvasImage(canvas)
    }

    loadPdf().catch(err => console.error('PDF load error:', err))
  }, [pdfData])

  if (!canvasImage) return null

  return (
    <Image
      image={canvasImage}
      scaleX={scale}
      scaleY={scale}
      x={offsetX}
      y={offsetY}
      listening={false}
    />
  )
}

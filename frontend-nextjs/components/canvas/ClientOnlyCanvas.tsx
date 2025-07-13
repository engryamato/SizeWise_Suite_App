'use client'

import React, { useEffect, useState } from 'react'

interface ClientOnlyCanvasProps {
  width: number
  height: number
}

export const ClientOnlyCanvas: React.FC<ClientOnlyCanvasProps> = ({ width, height }) => {
  const [CanvasComponent, setCanvasComponent] = useState<React.ComponentType<any> | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Only import Konva components on the client side
    const loadCanvas = async () => {
      try {
        const { CanvasContainer } = await import('./CanvasContainer')
        setCanvasComponent(() => CanvasContainer)
      } catch (error) {
        console.error('Failed to load canvas component:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadCanvas()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">Loading canvas...</p>
        </div>
      </div>
    )
  }

  if (!CanvasComponent) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gray-100">
        <p className="text-red-500">Failed to load canvas component</p>
      </div>
    )
  }

  return <CanvasComponent width={width} height={height} />
}

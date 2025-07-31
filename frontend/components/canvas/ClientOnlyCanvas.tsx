'use client'

import React, { useEffect, useState } from 'react'
import { HVACTracing } from '@/lib/monitoring/HVACTracing'
import { useSentryErrorReporting } from '@/components/error/SentryErrorBoundary'

interface ClientOnlyCanvasProps {
  width: number
  height: number
}

export const ClientOnlyCanvas: React.FC<ClientOnlyCanvasProps> = ({ width, height }) => {
  const [CanvasComponent, setCanvasComponent] = useState<React.ComponentType<any> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { reportError } = useSentryErrorReporting()

  useEffect(() => {
    // Use SimpleCanvas directly for now to avoid React-Konva compatibility issues
    const loadCanvas = async () => {
      return HVACTracing.traceUserInteraction(
        'load_canvas',
        'canvas',
        async () => {
          try {
            const { SimpleCanvas } = await import('./SimpleCanvas')
            setCanvasComponent(() => SimpleCanvas)
          } catch (error) {
            console.error('Failed to load canvas component:', error)

            // Report canvas loading error to Sentry
            reportError(error as Error, {
              component: 'ClientOnlyCanvas',
              action: 'load_canvas',
              canvasSize: { width, height }
            }, {
              canvas_error: 'load_failure'
            })

            const ErrorComponent = () => (
              <div className="flex items-center justify-center w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <p className="text-gray-500 mb-2">Canvas temporarily unavailable</p>
                  <p className="text-sm text-gray-400">Please refresh the page</p>
                </div>
              </div>
            )
            ErrorComponent.displayName = 'CanvasErrorComponent'
            setCanvasComponent(() => ErrorComponent)
          } finally {
            setIsLoading(false)
          }
        },
        { width, height }
      )
    }

    loadCanvas()
  }, [height, reportError, width])

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

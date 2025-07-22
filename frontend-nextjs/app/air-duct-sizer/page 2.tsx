'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Vector3 } from 'three'
import { Canvas3D } from '@/components/3d/Canvas3D'
import { PDFImport } from '@/components/pdf/PDFImport'
import { DrawingTools, DrawingMode, DrawingElement } from '@/components/drawing/DrawingTools'
import { useCalculations, DuctSizingRequest, DuctSegment as APIDuctSegment } from '@/lib/api/calculations'
import { useToast } from '@/lib/hooks/useToaster'
import { useProjectStore } from '@/stores/project-store'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { useCalculationStore } from '@/stores/calculation-store'
import { Toolbar } from '@/components/ui/Toolbar'
import { Sidebar } from '@/components/ui/Sidebar'
import { ClientOnlyCanvas } from '@/components/canvas/ClientOnlyCanvas'
import { WarningPanel, ValidationWarning } from '@/components/ui/WarningPanel'
import { BottomRightCorner } from '@/components/ui/BottomRightCorner'
import { ViewCube, ViewType } from '@/components/ui/ViewCube'
import { HVACValidator } from '@/lib/validation/hvac-validator'
import {
  Play,
  Pause,
  Save,
  FileText,
  Calculator,
  AlertTriangle,
  CheckCircle,
  Settings,
  Layers,
  Eye,
  EyeOff
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AirDuctSizerPage() {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  // Store hooks
  const { currentProject, createProject, setPlanPDF, setPlanScale } = useProjectStore()
  const { sidebarOpen, addNotification, setPlanScale: updateUIScale } = useUIStore()

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Priority 5-7 state
  const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[]>([])
  const [currentView, setCurrentView] = useState<ViewType>('isometric')
  const [validator] = useState(() => HVACValidator.getInstance())

  const handleImportPlan = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const data = reader.result as string
      setPlanPDF(data)
    }
    reader.readAsDataURL(file)
  }

  // Priority 5-7 handlers
  const handleWarningClick = (warning: ValidationWarning) => {
    // Highlight the related element on canvas
    console.log('Warning clicked:', warning)
  }

  const handleWarningResolve = (warningId: string) => {
    setValidationWarnings(prev =>
      prev.map(w => w.id === warningId ? { ...w, resolved: true } : w)
    )
  }

  const handleWarningDismiss = (warningId: string) => {
    setValidationWarnings(prev => prev.filter(w => w.id !== warningId))
  }

  const handleViewChange = (view: ViewType) => {
    setCurrentView(view)
    // TODO: Integrate with Three.js camera controls
  }

  const handleResetView = () => {
    setCurrentView('isometric')
    // TODO: Reset camera to default view
  }

  const handleFitToScreen = () => {
    // TODO: Fit all objects to screen
  }

  // Generate test warnings on component mount
  React.useEffect(() => {
    const testWarnings = validator.generateTestWarnings()
    setValidationWarnings(testWarnings)
  }, [validator])
  const { isAuthenticated, user } = useAuthStore()
  const { loadMaterials, loadStandards } = useCalculationStore()



  // Calculate canvas size based on window and sidebar
  useEffect(() => {
    const updateCanvasSize = () => {
      const sidebarWidth = sidebarOpen ? 320 : 0
      const toolbarWidth = 200
      const headerHeight = 64 // Approximate header height

      const width = window.innerWidth - sidebarWidth - toolbarWidth - 32 // 32px for margins
      const height = window.innerHeight - headerHeight - 32

      setCanvasSize({
        width: Math.max(400, width),
        height: Math.max(300, height),
      })
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [sidebarOpen])

  // Load reference data on mount (skip API calls in development)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      loadMaterials()
      loadStandards()
    }
  }, [loadMaterials, loadStandards])

  // Sync plan scale when project changes
  useEffect(() => {
    if (currentProject?.plan_scale) {
      updateUIScale(currentProject.plan_scale)
    }
  }, [currentProject?.plan_scale])

  // Create default project if none exists
  useEffect(() => {
    if (!currentProject) {
      createProject({
        project_name: 'New Air Duct Project',
        project_location: 'Enter location',
        user_name: user?.name || 'Demo User',
      })

      addNotification({
        type: 'info',
        message: 'New project created. Start by drawing rooms or duct segments.',
        duration: 5000,
      })
    }
  }, [currentProject, user, createProject, addNotification])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const { setDrawingTool, setGridVisible, setSnapToGrid, grid } = useUIStore.getState()

      switch (e.key.toLowerCase()) {
        case 'v':
          e.preventDefault()
          setDrawingTool('select')
          break
        case 'r':
          e.preventDefault()
          setDrawingTool('room')
          break
        case 'd':
          e.preventDefault()
          setDrawingTool('duct')
          break
        case 'e':
          e.preventDefault()
          setDrawingTool('equipment')
          break
        case 'h':
          e.preventDefault()
          setDrawingTool('pan')
          break
        case 'l':
          e.preventDefault()
          setDrawingTool('scale')
          break
        case 'g':
          e.preventDefault()
          setGridVisible(!grid.visible)
          break
        case 's':
          e.preventDefault()
          setSnapToGrid(!grid.snapEnabled)
          break
        case 'escape':
          e.preventDefault()
          useUIStore.getState().cancelDrawing()
          useUIStore.getState().clearSelection()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Show authentication prompt if not logged in (bypassed for development testing)
  if (!isAuthenticated && process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Air Duct Sizer</h2>
          <p className="text-gray-600 mb-6">
            Please log in to access the Air Duct Sizer tool.
          </p>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              Log In
            </button>
            <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors">
              Sign Up
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Air Duct Sizer</h1>
            {currentProject && (
              <span className="text-sm text-gray-500">
                {currentProject.project_name}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* Tier indicator */}
            <span className={`
              px-2 py-1 rounded-full text-xs font-medium
              ${user?.tier === 'pro'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-gray-100 text-gray-800'
              }
            `}>
              {user?.tier === 'pro' ? 'Pro' : 'Free'}
            </span>

            {/* Project stats */}
            {currentProject && (
              <div className="text-sm text-gray-500">
                {currentProject.rooms.length} rooms, {currentProject.segments.length} segments
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex h-[calc(100vh-64px)]">
        {/* Toolbar */}
        <div className="w-48 p-4 bg-gray-50 border-r border-gray-200">
          <Toolbar onImportPlan={handleImportPlan} />
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Canvas area */}
        <div className="flex-1 relative">
          <ClientOnlyCanvas width={canvasSize.width} height={canvasSize.height} />

          {/* Priority 7: ViewCube */}
          <ViewCube
            currentView={currentView}
            onViewChange={handleViewChange}
            onResetView={handleResetView}
            onFitToScreen={handleFitToScreen}
          />
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-80 bg-white border-l border-gray-200">
            <Sidebar />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>Ready</span>
            {currentProject && (
              <>
                <span>•</span>
                <span>
                  {user?.tier === 'free'
                    ? `${currentProject.rooms.length}/3 rooms, ${currentProject.segments.length}/25 segments`
                    : `${currentProject.rooms.length} rooms, ${currentProject.segments.length} segments`
                  }
                </span>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <span>Grid: {useUIStore.getState().grid.size}px</span>
            <span>Zoom: {Math.round(useUIStore.getState().viewport.scale * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Priority 5: Warning Panel */}
      <WarningPanel
        warnings={validationWarnings}
        onWarningClick={handleWarningClick}
        onWarningResolve={handleWarningResolve}
        onWarningDismiss={handleWarningDismiss}
      />

      {/* Priority 6: Bottom Right Corner */}
      <BottomRightCorner />
    </div>
  )
}

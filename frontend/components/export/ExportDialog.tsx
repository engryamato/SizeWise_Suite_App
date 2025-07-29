'use client'

import React, { useState } from 'react'
import { Download, FileText, Image, Database, AlertTriangle, Crown } from 'lucide-react'
import { useExportStore } from '@/stores/export-store'
import { useProjectStore } from '@/stores/project-store'
import { useAuthStore } from '@/stores/auth-store'
import { FeatureGate } from '../ui/FeatureGate'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  canvasElement?: HTMLCanvasElement | null
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  canvasElement
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'png' | 'json' | 'excel'>('pdf')
  const [includeOptions, setIncludeOptions] = useState({
    bom: true,
    schedules: true,
    drawing: true
  })

  const { currentProject } = useProjectStore()
  const { user } = useAuthStore()
  const { 
    isExporting, 
    exportProgress, 
    lastExportResult, 
    exportProject, 
    validateExport 
  } = useExportStore()

  const userTier = user?.tier || 'free'
  const isProUser = userTier === 'pro' || userTier === 'enterprise' || userTier === 'super_admin'

  // Map user tier to export tier (enterprise and super_admin get pro export privileges)
  const exportTier: 'free' | 'pro' = isProUser ? 'pro' : 'free'

  if (!isOpen || !currentProject) return null

  // Validate project for export
  const validation = validateExport(currentProject, exportTier)

  const exportFormats = [
    {
      id: 'pdf' as const,
      name: 'PDF Report',
      description: 'Complete project report with BOM and schedules',
      icon: FileText,
      featureName: 'air_duct_sizer',
      requiredTier: 'free' as const,
      available: true
    },
    {
      id: 'png' as const,
      name: 'PNG Image',
      description: 'Drawing export as high-quality image',
      icon: Image,
      featureName: 'high_res_pdf_export',
      requiredTier: 'pro' as const,
      available: !!canvasElement
    },
    {
      id: 'json' as const,
      name: 'JSON Data',
      description: 'Project data for backup or sharing',
      icon: Database,
      featureName: 'air_duct_sizer',
      requiredTier: 'free' as const,
      available: true
    },
    {
      id: 'excel' as const,
      name: 'Excel Spreadsheet',
      description: 'BOM and schedules in spreadsheet format',
      icon: Database,
      featureName: 'enhanced_csv_export',
      requiredTier: 'pro' as const,
      available: true
    }
  ]

  const handleExport = async () => {
    if (!validation.valid) return

    const result = await exportProject(
      currentProject,
      selectedFormat,
      exportTier,
      canvasElement
    )

    if (result.success) {
      // Close dialog after successful export
      setTimeout(() => {
        onClose()
      }, 1000)
    }
  }

  const getTierLimitations = () => {
    if (isProUser) return null

    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={16} />
          <div>
            <h4 className="font-medium text-yellow-800 mb-1">Free Tier Limitations</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• PDF exports limited to 150 DPI with watermark</li>
              <li>• PNG exports limited to 1200×800 pixels</li>
              <li>• Advanced schedules not included</li>
              <li>• Excel export requires Pro upgrade</li>
            </ul>
            <button className="mt-2 text-sm font-medium text-yellow-800 hover:text-yellow-900 flex items-center gap-1">
              <Crown size={14} />
              Upgrade to Pro for full export capabilities
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Export Project</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={isExporting}
            >
              ×
            </button>
          </div>

          {/* Project validation errors */}
          {!validation.valid && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-red-800 mb-1">Export Blocked</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                  <p className="text-sm text-red-600 mt-2">
                    Please upgrade to Pro or reduce project complexity to export.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tier limitations */}
          {getTierLimitations()}

          {/* Export format selection */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Export Format</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {exportFormats.map((format) => (
                <FeatureGate
                  key={format.id}
                  feature={format.featureName}
                  requiredTier={format.requiredTier}
                  showUpgradePrompt={false}
                  fallback={
                    <div className="p-4 border border-gray-200 rounded-lg text-left opacity-50 cursor-not-allowed">
                      <div className="flex items-start gap-3">
                        <format.icon size={20} className="text-gray-400" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-gray-500">{format.name}</h4>
                            <Crown size={14} className="text-yellow-500" />
                          </div>
                          <p className="text-sm text-gray-400 mt-1">{format.description}</p>
                          <p className="text-xs text-yellow-600 mt-1">Requires {format.requiredTier} tier</p>
                        </div>
                      </div>
                    </div>
                  }
                >
                  <button
                    type="button"
                    onClick={() => setSelectedFormat(format.id)}
                    disabled={!format.available || isExporting}
                    className={`
                      p-4 border rounded-lg text-left transition-colors relative w-full
                      ${selectedFormat === format.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                      ${!format.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <format.icon
                        size={20}
                        className={selectedFormat === format.id ? 'text-blue-600' : 'text-gray-600'}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{format.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{format.description}</p>
                      </div>
                    </div>
                  </button>
                </FeatureGate>
              ))}
            </div>
          </div>

          {/* Export options */}
          {selectedFormat === 'pdf' && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Include in Export</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeOptions.bom}
                    onChange={(e) => setIncludeOptions(prev => ({ ...prev, bom: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Bill of Materials (BOM)</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeOptions.schedules}
                    onChange={(e) => setIncludeOptions(prev => ({ ...prev, schedules: e.target.checked }))}
                    disabled={!isProUser}
                    className="rounded border-gray-300"
                  />
                  <span className={`text-sm ${isProUser ? 'text-gray-700' : 'text-gray-400'}`}>
                    Room & Equipment Schedules
                    {!isProUser && <span className="text-yellow-600 ml-1">(Pro only)</span>}
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={includeOptions.drawing}
                    onChange={(e) => setIncludeOptions(prev => ({ ...prev, drawing: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Drawing/Layout</span>
                </label>
              </div>
            </div>
          )}

          {/* Export progress */}
          {isExporting && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Exporting...</span>
                <span className="text-sm text-gray-500">{exportProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Export result */}
          {lastExportResult && !isExporting && (
            <div className={`mb-6 p-4 rounded-lg ${
              lastExportResult.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`text-sm font-medium ${
                lastExportResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {lastExportResult.success 
                  ? `Export successful: ${lastExportResult.filename}`
                  : `Export failed: ${lastExportResult.error}`
                }
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={!validation.valid || isExporting || !exportFormats.find(f => f.id === selectedFormat)?.available}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Download size={16} />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

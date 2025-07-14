import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { ExportService, ExportOptions, ExportResult } from '@/services/export-service'
import { Project } from '@/types/air-duct-sizer'

interface ExportState {
  // Export state
  isExporting: boolean
  exportProgress: number
  lastExportResult: ExportResult | null
  
  // Export options
  currentOptions: ExportOptions
  
  // Actions
  setExporting: (exporting: boolean) => void
  setExportProgress: (progress: number) => void
  setExportOptions: (options: Partial<ExportOptions>) => void
  
  // Export operations
  exportProject: (
    project: Project,
    format: 'pdf' | 'png' | 'svg' | 'json' | 'excel',
    userTier: 'free' | 'pro',
    canvasElement?: HTMLCanvasElement | null
  ) => Promise<ExportResult>
  
  downloadFile: (blob: Blob, filename: string) => void
  
  // Validation
  validateExport: (project: Project, userTier: 'free' | 'pro') => { valid: boolean; errors: string[] }
}

export const useExportStore = create<ExportState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isExporting: false,
      exportProgress: 0,
      lastExportResult: null,
      
      currentOptions: {
        format: 'pdf',
        quality: 'medium',
        includeWatermark: true,
        maxResolution: { width: 1200, height: 800 },
        includeBOM: true,
        includeSchedules: false,
        includeDrawing: true
      },

      // Actions
      setExporting: (exporting) => {
        set({ isExporting: exporting }, false, 'setExporting')
      },

      setExportProgress: (progress) => {
        set({ exportProgress: progress }, false, 'setExportProgress')
      },

      setExportOptions: (options) => {
        const { currentOptions } = get()
        set({ 
          currentOptions: { ...currentOptions, ...options } 
        }, false, 'setExportOptions')
      },

      // Validation
      validateExport: (project, userTier) => {
        const exportService = ExportService.getInstance()
        return exportService.validateProjectForExport(project, userTier)
      },

      // Main export function
      exportProject: async (project, format, userTier, canvasElement = null) => {
        const { setExporting, setExportProgress, downloadFile } = get()
        
        try {
          setExporting(true)
          setExportProgress(0)

          const exportService = ExportService.getInstance()
          
          // Validate project against tier limits
          const validation = exportService.validateProjectForExport(project, userTier)
          if (!validation.valid) {
            const result: ExportResult = {
              success: false,
              filename: '',
              error: `Export blocked: ${validation.errors.join(', ')}`
            }
            set({ lastExportResult: result }, false, 'exportProject:validation-failed')
            return result
          }

          setExportProgress(25)

          // Get export options based on user tier and format
          const options = exportService.getExportOptions(userTier)
          options.format = format

          setExportProgress(50)

          let result: ExportResult

          // Perform export based on format
          switch (format) {
            case 'pdf':
              result = await exportService.exportToPDF(project, canvasElement, options)
              break
              
            case 'png':
              if (!canvasElement) {
                result = {
                  success: false,
                  filename: '',
                  error: 'Canvas element required for PNG export'
                }
              } else {
                result = await exportService.exportToPNG(canvasElement, options, project.project_name)
              }
              break
              
            case 'json':
              result = exportService.exportToJSON(project)
              break
              
            case 'excel':
              // TODO: Implement Excel export
              result = {
                success: false,
                filename: '',
                error: 'Excel export not yet implemented'
              }
              break
              
            case 'svg':
              // TODO: Implement SVG export
              result = {
                success: false,
                filename: '',
                error: 'SVG export not yet implemented'
              }
              break
              
            default:
              result = {
                success: false,
                filename: '',
                error: `Unsupported export format: ${format}`
              }
          }

          setExportProgress(75)

          // Download file if export was successful
          if (result.success && result.data instanceof Blob) {
            downloadFile(result.data, result.filename)
          }

          setExportProgress(100)
          
          // Store result
          set({ lastExportResult: result }, false, 'exportProject:complete')
          
          return result

        } catch (error) {
          const result: ExportResult = {
            success: false,
            filename: '',
            error: error instanceof Error ? error.message : 'Unknown export error'
          }
          
          set({ lastExportResult: result }, false, 'exportProject:error')
          return result
          
        } finally {
          setExporting(false)
          setExportProgress(0)
        }
      },

      // Download file helper
      downloadFile: (blob, filename) => {
        try {
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        } catch (error) {
          console.error('Failed to download file:', error)
        }
      }
    }),
    {
      name: 'export-store'
    }
  )
)

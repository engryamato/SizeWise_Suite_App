/**
 * Export Store for SizeWise Suite
 * Manages export functionality and state
 */

import { create } from 'zustand'

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json'
  includeCalculations: boolean
  includeDrawings: boolean
  includeReports: boolean
  includeImages: boolean
}

export interface ExportState {
  isExporting: boolean
  exportProgress: number
  lastExportDate: Date | null
  lastExportResult: { success: boolean; error?: string; filename?: string } | null
  exportOptions: ExportOptions

  // Actions
  setExporting: (isExporting: boolean) => void
  setExportProgress: (progress: number) => void
  updateExportOptions: (options: Partial<ExportOptions>) => void
  resetExportState: () => void
  exportProject: (project: any, format: string, tier: string, canvasElement?: HTMLElement | null) => Promise<{ success: boolean; error?: string }>
  validateExport: (project: any, tier?: string) => { valid: boolean; errors: string[] }
}

const defaultExportOptions: ExportOptions = {
  format: 'pdf',
  includeCalculations: true,
  includeDrawings: true,
  includeReports: true,
  includeImages: false
}

export const useExportStore = create<ExportState>((set, get) => ({
  isExporting: false,
  exportProgress: 0,
  lastExportDate: null,
  lastExportResult: null,
  exportOptions: defaultExportOptions,

  setExporting: (isExporting) => set({ isExporting }),

  setExportProgress: (progress) => set({ exportProgress: progress }),

  updateExportOptions: (options) =>
    set((state) => ({
      exportOptions: { ...state.exportOptions, ...options }
    })),

  resetExportState: () => set({
    isExporting: false,
    exportProgress: 0,
    lastExportResult: null,
    exportOptions: defaultExportOptions
  }),

  exportProject: async (project: any, format: string, tier: string, canvasElement?: HTMLElement | null) => {
    set({ isExporting: true, exportProgress: 0 })

    try {
      // Simulate export process
      for (let i = 0; i <= 100; i += 10) {
        set({ exportProgress: i })
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      set({
        isExporting: false,
        exportProgress: 100,
        lastExportDate: new Date(),
        lastExportResult: { success: true, filename: `export_${format}_${Date.now()}.${format}` }
      })

      return { success: true }
    } catch (error) {
      set({
        isExporting: false,
        exportProgress: 0,
        lastExportResult: { success: false, error: String(error) }
      })
      return { success: false, error: String(error) }
    }
  },

  validateExport: (project: any, tier?: string) => {
    // Basic validation - check if project exists and has data
    if (!project) return { valid: false, errors: ['No project selected'] }
    return { valid: true, errors: [] }
  }
}))

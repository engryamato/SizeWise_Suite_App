import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Project, Room, Segment, Equipment } from '@/types/air-duct-sizer'

export interface ExportOptions {
  format: 'pdf' | 'png' | 'svg' | 'json' | 'excel'
  quality: 'low' | 'medium' | 'high'
  includeWatermark: boolean
  maxResolution: { width: number; height: number }
  includeBOM: boolean
  includeSchedules: boolean
  includeDrawing: boolean
}

export interface ExportResult {
  success: boolean
  data?: Blob | string
  filename: string
  error?: string
}

export class ExportService {
  private static instance: ExportService
  
  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService()
    }
    return ExportService.instance
  }

  // Get export options based on user tier
  public getExportOptions(userTier: 'free' | 'pro'): ExportOptions {
    if (userTier === 'pro') {
      return {
        format: 'pdf',
        quality: 'high',
        includeWatermark: false,
        maxResolution: { width: 4096, height: 4096 },
        includeBOM: true,
        includeSchedules: true,
        includeDrawing: true
      }
    } else {
      return {
        format: 'pdf',
        quality: 'low',
        includeWatermark: true,
        maxResolution: { width: 1200, height: 800 },
        includeBOM: true,
        includeSchedules: false, // Limited for free tier
        includeDrawing: true
      }
    }
  }

  // Validate project against tier limits before export
  public validateProjectForExport(project: Project, userTier: 'free' | 'pro'): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (userTier === 'free') {
      if (project.rooms.length > 3) {
        errors.push(`Project has ${project.rooms.length} rooms (Free tier limit: 3)`)
      }
      if (project.segments.length > 25) {
        errors.push(`Project has ${project.segments.length} segments (Free tier limit: 25)`)
      }
      if (project.equipment.length > 2) {
        errors.push(`Project has ${project.equipment.length} equipment units (Free tier limit: 2)`)
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Export project as PDF
  public async exportToPDF(
    project: Project,
    canvasElement: HTMLCanvasElement | null,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      const pdf = new jsPDF('landscape', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      
      // Add title page
      pdf.setFontSize(20)
      pdf.text('HVAC Duct Sizing Report', pageWidth / 2, 30, { align: 'center' })
      
      pdf.setFontSize(14)
      pdf.text(`Project: ${project.project_name}`, 20, 50)
      pdf.text(`Location: ${project.project_location || 'Not specified'}`, 20, 60)
      pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 70)
      pdf.text(`Standards: ${project.codes.join(', ')}`, 20, 80)

      // Add watermark for free tier
      if (options.includeWatermark) {
        pdf.setFontSize(10)
        pdf.setTextColor(128, 128, 128)
        pdf.text('Made with SizeWise Free', pageWidth - 60, pageHeight - 10)
        pdf.setTextColor(0, 0, 0) // Reset color
      }

      let yPosition = 100

      // Add project summary
      pdf.setFontSize(16)
      pdf.text('Project Summary', 20, yPosition)
      yPosition += 15

      pdf.setFontSize(12)
      pdf.text(`Rooms: ${project.rooms.length}`, 20, yPosition)
      pdf.text(`Duct Segments: ${project.segments.length}`, 80, yPosition)
      pdf.text(`Equipment: ${project.equipment.length}`, 140, yPosition)
      yPosition += 20

      // Add Bill of Materials if requested
      if (options.includeBOM) {
        yPosition = this.addBOMToPDF(pdf, project, yPosition, pageHeight)
      }

      // Add schedules if requested and user is Pro
      if (options.includeSchedules) {
        yPosition = this.addSchedulesToPDF(pdf, project, yPosition, pageHeight)
      }

      // Add drawing if available and requested
      if (options.includeDrawing && canvasElement) {
        await this.addDrawingToPDF(pdf, canvasElement, options)
      }

      const pdfBlob = pdf.output('blob')
      const filename = `${project.project_name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`

      return {
        success: true,
        data: pdfBlob,
        filename
      }
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  private addBOMToPDF(pdf: jsPDF, project: Project, startY: number, pageHeight: number): number {
    let yPosition = startY

    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      pdf.addPage()
      yPosition = 20
    }

    pdf.setFontSize(16)
    pdf.text('Bill of Materials', 20, yPosition)
    yPosition += 15

    pdf.setFontSize(10)
    
    // Ductwork materials
    const ductMaterials = this.calculateDuctMaterials(project)
    pdf.text('Ductwork:', 20, yPosition)
    yPosition += 10

    ductMaterials.forEach(item => {
      pdf.text(`• ${item.description}: ${item.quantity} ${item.unit}`, 25, yPosition)
      yPosition += 8
    })

    yPosition += 10

    // Equipment list
    pdf.text('Equipment:', 20, yPosition)
    yPosition += 10

    project.equipment.forEach(equipment => {
      pdf.text(`• ${equipment.type}: ${equipment.airflow} CFM`, 25, yPosition)
      yPosition += 8
    })

    return yPosition + 20
  }

  private addSchedulesToPDF(pdf: jsPDF, project: Project, startY: number, pageHeight: number): number {
    let yPosition = startY

    // Check if we need a new page
    if (yPosition > pageHeight - 60) {
      pdf.addPage()
      yPosition = 20
    }

    pdf.setFontSize(16)
    pdf.text('Room Schedule', 20, yPosition)
    yPosition += 15

    pdf.setFontSize(8)
    
    // Room schedule headers
    const headers = ['Room', 'Function', 'Area (sq ft)', 'Airflow (CFM)', 'ACH']
    let xPosition = 20
    headers.forEach(header => {
      pdf.text(header, xPosition, yPosition)
      xPosition += 35
    })
    yPosition += 10

    // Room schedule data
    project.rooms.forEach(room => {
      xPosition = 20
      const area = room.dimensions.length * room.dimensions.width
      const ach = room.airflow ? (room.airflow * 60) / (area * room.dimensions.height) : 0
      
      pdf.text(room.name, xPosition, yPosition)
      xPosition += 35
      pdf.text(room.function || 'Office', xPosition, yPosition)
      xPosition += 35
      pdf.text(area.toFixed(1), xPosition, yPosition)
      xPosition += 35
      pdf.text((room.airflow || 0).toString(), xPosition, yPosition)
      xPosition += 35
      pdf.text(ach.toFixed(1), xPosition, yPosition)
      
      yPosition += 8
    })

    return yPosition + 20
  }

  private async addDrawingToPDF(pdf: jsPDF, canvasElement: HTMLCanvasElement, options: ExportOptions): Promise<void> {
    // Create a new page for the drawing
    pdf.addPage()
    
    // Capture canvas as image
    const canvas = await html2canvas(canvasElement, {
      width: Math.min(canvasElement.width, options.maxResolution.width),
      height: Math.min(canvasElement.height, options.maxResolution.height),
      scale: options.quality === 'high' ? 2 : options.quality === 'medium' ? 1.5 : 1
    })

    const imgData = canvas.toDataURL('image/png')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    
    // Calculate image dimensions to fit page
    const imgWidth = pageWidth - 40
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, Math.min(imgHeight, pageHeight - 40))

    // Add watermark for free tier
    if (options.includeWatermark) {
      pdf.setFontSize(10)
      pdf.setTextColor(128, 128, 128)
      pdf.text('Made with SizeWise Free', pageWidth - 60, pageHeight - 10)
    }
  }

  private calculateDuctMaterials(project: Project): Array<{ description: string; quantity: number; unit: string }> {
    const materials: Array<{ description: string; quantity: number; unit: string }> = []
    
    // Calculate total duct length by size
    const ductSizes: Record<string, number> = {}
    
    project.segments.forEach(segment => {
      let sizeKey: string
      if (segment.size.diameter) {
        sizeKey = `Round ${segment.size.diameter}"`
      } else {
        sizeKey = `Rectangular ${segment.size.width}" x ${segment.size.height}"`
      }
      
      ductSizes[sizeKey] = (ductSizes[sizeKey] || 0) + segment.length
    })

    // Convert to materials list
    Object.entries(ductSizes).forEach(([size, length]) => {
      materials.push({
        description: `${size} Galvanized Steel Duct`,
        quantity: Math.ceil(length),
        unit: 'ft'
      })
    })

    return materials
  }

  // Export project as JSON
  public exportToJSON(project: Project): ExportResult {
    try {
      const jsonData = JSON.stringify(project, null, 2)
      const blob = new Blob([jsonData], { type: 'application/json' })
      const filename = `${project.project_name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`

      return {
        success: true,
        data: blob,
        filename
      }
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'JSON export failed'
      }
    }
  }

  // Export canvas as PNG
  public async exportToPNG(
    canvasElement: HTMLCanvasElement,
    options: ExportOptions,
    projectName: string
  ): Promise<ExportResult> {
    try {
      const canvas = await html2canvas(canvasElement, {
        width: Math.min(canvasElement.width, options.maxResolution.width),
        height: Math.min(canvasElement.height, options.maxResolution.height),
        scale: options.quality === 'high' ? 2 : options.quality === 'medium' ? 1.5 : 1
      })

      // Add watermark for free tier
      if (options.includeWatermark) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.font = '16px Arial'
          ctx.fillStyle = 'rgba(128, 128, 128, 0.7)'
          ctx.fillText('Made with SizeWise Free', canvas.width - 200, canvas.height - 20)
        }
      }

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const filename = `${projectName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`
            resolve({
              success: true,
              data: blob,
              filename
            })
          } else {
            resolve({
              success: false,
              filename: '',
              error: 'Failed to create PNG blob'
            })
          }
        }, 'image/png')
      })
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'PNG export failed'
      }
    }
  }
}

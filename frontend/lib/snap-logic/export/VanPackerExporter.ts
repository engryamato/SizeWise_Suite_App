/**
 * VanPacker Export Module
 * SizeWise Suite - Fabrication Workflow Integration
 * 
 * Comprehensive VanPacker integration for centerline sketch export and
 * fabrication workflow support. Provides professional-grade export
 * functionality for HVAC fabrication with detailed metadata, fabrication
 * notes, and compatibility with VanPacker fabrication software.
 * 
 * @fileoverview VanPacker export and fabrication workflow integration
 * @version 1.0.0
 * @author SizeWise Suite Development Team
 */

import { Point2D, Centerline } from '@/types/air-duct-sizer';
import { 
  DuctDimensions,
  DuctShape,
  SMACNAValidationResult
} from '../standards/SMACNAValidator';
import { CenterlineAnalysis } from '../utils/CenterlineUtils';

/**
 * VanPacker export format types
 */
export enum VanPackerExportFormat {
  SKETCH = 'sketch',
  DXF = 'dxf',
  CSV = 'csv',
  JSON = 'json',
  XML = 'xml'
}

/**
 * Fabrication material types
 */
export enum FabricationMaterial {
  GALVANIZED_STEEL = 'galvanized_steel',
  STAINLESS_STEEL = 'stainless_steel',
  ALUMINUM = 'aluminum',
  SPIRAL_DUCT = 'spiral_duct',
  FIBERGLASS = 'fiberglass',
  FLEXIBLE_DUCT = 'flexible_duct'
}

/**
 * Fabrication connection types
 */
export enum FabricationConnection {
  SLIP_JOINT = 'slip_joint',
  STANDING_SEAM = 'standing_seam',
  FLANGED = 'flanged',
  WELDED = 'welded',
  SPIRAL_LOCK = 'spiral_lock',
  CLAMP_TOGETHER = 'clamp_together'
}

/**
 * VanPacker sketch element
 */
export interface VanPackerSketchElement {
  id: string;
  type: 'straight' | 'elbow' | 'tee' | 'wye' | 'cross' | 'transition' | 'cap';
  startPoint: Point2D;
  endPoint: Point2D;
  dimensions: DuctDimensions;
  shape: DuctShape;
  material: FabricationMaterial;
  connection: FabricationConnection;
  gauge: number;
  length: number;
  angle?: number; // For elbows
  radius?: number; // For elbows
  branchDimensions?: DuctDimensions; // For tees/wyes
  fabricationNotes: string[];
  partNumber?: string;
  weight?: number; // pounds
  cost?: number; // dollars
}

/**
 * VanPacker project metadata
 */
export interface VanPackerProjectMetadata {
  projectName: string;
  projectNumber: string;
  designer: string;
  fabricator: string;
  dateCreated: string;
  dateModified: string;
  version: string;
  buildingInfo: {
    name: string;
    address: string;
    floorLevel: string;
    zone: string;
  };
  systemInfo: {
    systemType: 'supply' | 'return' | 'exhaust' | 'mixed';
    airflow: number; // CFM
    staticPressure: number; // inches w.g.
    temperature: number; // degrees F
  };
  fabricationInfo: {
    priority: 'standard' | 'rush' | 'emergency';
    deliveryDate: string;
    installationDate: string;
    specialRequirements: string[];
  };
  qualityControl: {
    smacnaCompliance: boolean;
    pressureTestRequired: boolean;
    leakageClass: string;
    inspectionRequired: boolean;
  };
}

/**
 * VanPacker export configuration
 */
export interface VanPackerExportConfig {
  format: VanPackerExportFormat;
  includeMetadata: boolean;
  includeFabricationNotes: boolean;
  includeBOM: boolean;
  includeDrawings: boolean;
  optimizeForFabrication: boolean;
  groupByMaterial: boolean;
  sortByInstallationOrder: boolean;
  includeWasteCalculation: boolean;
  wastePercentage: number; // default 10%
  roundUpDimensions: boolean;
  minimumLength: number; // inches
  standardGauges: number[];
  preferredConnections: FabricationConnection[];
}

/**
 * Default VanPacker export configuration
 */
const DEFAULT_VANPACKER_CONFIG: VanPackerExportConfig = {
  format: VanPackerExportFormat.SKETCH,
  includeMetadata: true,
  includeFabricationNotes: true,
  includeBOM: true,
  includeDrawings: true,
  optimizeForFabrication: true,
  groupByMaterial: true,
  sortByInstallationOrder: true,
  includeWasteCalculation: true,
  wastePercentage: 10,
  roundUpDimensions: true,
  minimumLength: 12, // 12 inches minimum
  standardGauges: [30, 28, 26, 24, 22, 20, 18, 16, 14],
  preferredConnections: [
    FabricationConnection.SLIP_JOINT,
    FabricationConnection.STANDING_SEAM,
    FabricationConnection.FLANGED
  ]
};

/**
 * VanPacker export result
 */
export interface VanPackerExportResult {
  success: boolean;
  format: VanPackerExportFormat;
  data: string | ArrayBuffer;
  filename: string;
  metadata: VanPackerProjectMetadata;
  elements: VanPackerSketchElement[];
  billOfMaterials: BillOfMaterialsItem[];
  fabricationNotes: string[];
  warnings: string[];
  errors: string[];
  statistics: {
    totalElements: number;
    totalLength: number; // linear feet
    totalWeight: number; // pounds
    totalCost: number; // dollars
    fabricationTime: number; // hours
  };
}

/**
 * Bill of materials item
 */
export interface BillOfMaterialsItem {
  partNumber: string;
  description: string;
  material: FabricationMaterial;
  dimensions: string;
  gauge: number;
  quantity: number;
  unitWeight: number; // pounds
  totalWeight: number; // pounds
  unitCost: number; // dollars
  totalCost: number; // dollars
  supplier: string;
  leadTime: number; // days
  fabricationNotes: string[];
}

/**
 * VanPacker exporter class
 */
export class VanPackerExporter {
  private config: VanPackerExportConfig;
  private materialDatabase: Map<string, any> = new Map();
  private partNumberGenerator: PartNumberGenerator;

  constructor(config?: Partial<VanPackerExportConfig>) {
    this.config = { ...DEFAULT_VANPACKER_CONFIG, ...config };
    this.partNumberGenerator = new PartNumberGenerator();
    this.initializeMaterialDatabase();
  }

  /**
   * Export centerlines to VanPacker format
   */
  async exportCenterlines(
    centerlines: Centerline[],
    ductDimensions: DuctDimensions[],
    ductShapes: DuctShape[],
    metadata: Partial<VanPackerProjectMetadata>
  ): Promise<VanPackerExportResult> {
    try {
      // Generate project metadata
      const projectMetadata = this.generateProjectMetadata(metadata);

      // Convert centerlines to VanPacker elements
      const elements = await this.convertCenterlinesToElements(
        centerlines,
        ductDimensions,
        ductShapes
      );

      // Optimize for fabrication if enabled
      if (this.config.optimizeForFabrication) {
        this.optimizeForFabrication(elements);
      }

      // Generate bill of materials
      const billOfMaterials = this.generateBillOfMaterials(elements);

      // Generate fabrication notes
      const fabricationNotes = this.generateFabricationNotes(elements);

      // Calculate statistics
      const statistics = this.calculateStatistics(elements, billOfMaterials);

      // Export to specified format
      const exportData = await this.exportToFormat(
        elements,
        projectMetadata,
        billOfMaterials,
        fabricationNotes
      );

      return {
        success: true,
        format: this.config.format,
        data: exportData.data,
        filename: exportData.filename,
        metadata: projectMetadata,
        elements,
        billOfMaterials,
        fabricationNotes,
        warnings: exportData.warnings,
        errors: [],
        statistics
      };

    } catch (error) {
      return {
        success: false,
        format: this.config.format,
        data: '',
        filename: '',
        metadata: this.generateProjectMetadata(metadata),
        elements: [],
        billOfMaterials: [],
        fabricationNotes: [],
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Unknown export error'],
        statistics: {
          totalElements: 0,
          totalLength: 0,
          totalWeight: 0,
          totalCost: 0,
          fabricationTime: 0
        }
      };
    }
  }

  /**
   * Generate project metadata
   */
  private generateProjectMetadata(
    metadata: Partial<VanPackerProjectMetadata>
  ): VanPackerProjectMetadata {
    const now = new Date().toISOString();

    return {
      projectName: metadata.projectName || 'SizeWise Suite Export',
      projectNumber: metadata.projectNumber || this.generateProjectNumber(),
      designer: metadata.designer || 'SizeWise Suite User',
      fabricator: metadata.fabricator || 'TBD',
      dateCreated: metadata.dateCreated || now,
      dateModified: now,
      version: '1.0.0',
      buildingInfo: {
        name: metadata.buildingInfo?.name || 'Building Name',
        address: metadata.buildingInfo?.address || 'Building Address',
        floorLevel: metadata.buildingInfo?.floorLevel || 'Ground Floor',
        zone: metadata.buildingInfo?.zone || 'Zone 1'
      },
      systemInfo: {
        systemType: metadata.systemInfo?.systemType || 'supply',
        airflow: metadata.systemInfo?.airflow || 0,
        staticPressure: metadata.systemInfo?.staticPressure || 0,
        temperature: metadata.systemInfo?.temperature || 70
      },
      fabricationInfo: {
        priority: metadata.fabricationInfo?.priority || 'standard',
        deliveryDate: metadata.fabricationInfo?.deliveryDate || '',
        installationDate: metadata.fabricationInfo?.installationDate || '',
        specialRequirements: metadata.fabricationInfo?.specialRequirements || []
      },
      qualityControl: {
        smacnaCompliance: metadata.qualityControl?.smacnaCompliance ?? true,
        pressureTestRequired: metadata.qualityControl?.pressureTestRequired ?? false,
        leakageClass: metadata.qualityControl?.leakageClass || 'Class 3',
        inspectionRequired: metadata.qualityControl?.inspectionRequired ?? true
      }
    };
  }

  /**
   * Convert centerlines to VanPacker elements
   */
  private async convertCenterlinesToElements(
    centerlines: Centerline[],
    ductDimensions: DuctDimensions[],
    ductShapes: DuctShape[]
  ): Promise<VanPackerSketchElement[]> {
    const elements: VanPackerSketchElement[] = [];

    for (let i = 0; i < centerlines.length; i++) {
      const centerline = centerlines[i];
      const dimensions = ductDimensions[i] || { width: 12, height: 8 };
      const shape = ductShapes[i] || DuctShape.RECTANGULAR;

      // Convert centerline to fabrication elements
      const centerlineElements = await this.convertSingleCenterline(
        centerline,
        dimensions,
        shape,
        i
      );

      elements.push(...centerlineElements);
    }

    return elements;
  }

  /**
   * Convert single centerline to fabrication elements
   */
  private async convertSingleCenterline(
    centerline: Centerline,
    dimensions: DuctDimensions,
    shape: DuctShape,
    index: number
  ): Promise<VanPackerSketchElement[]> {
    const elements: VanPackerSketchElement[] = [];

    if (centerline.type === 'straight') {
      // Create straight duct element
      const element = this.createStraightElement(centerline, dimensions, shape, index);
      elements.push(element);

    } else if (centerline.type === 'arc') {
      // Create elbow element
      const element = this.createElbowElement(centerline, dimensions, shape, index);
      elements.push(element);

    } else if (centerline.type === 'segmented') {
      // Create multiple elements for segmented centerline
      const segmentElements = this.createSegmentedElements(centerline, dimensions, shape, index);
      elements.push(...segmentElements);
    }

    return elements;
  }

  /**
   * Create straight duct element
   */
  private createStraightElement(
    centerline: Centerline,
    dimensions: DuctDimensions,
    shape: DuctShape,
    index: number
  ): VanPackerSketchElement {
    const startPoint = centerline.points[0];
    const endPoint = centerline.points[centerline.points.length - 1];
    const length = this.calculateLength(startPoint, endPoint);

    // Determine material and gauge based on dimensions
    const material = this.selectMaterial(dimensions, shape);
    const gauge = this.selectGauge(dimensions, shape);
    const connection = this.selectConnection(material, dimensions);

    return {
      id: `straight_${index}_${centerline.id}`,
      type: 'straight',
      startPoint,
      endPoint,
      dimensions: this.roundDimensions(dimensions),
      shape,
      material,
      connection,
      gauge,
      length: Math.max(length, this.config.minimumLength),
      fabricationNotes: this.generateElementFabricationNotes('straight', dimensions, material),
      partNumber: this.partNumberGenerator.generatePartNumber('straight', dimensions, material),
      weight: this.calculateWeight('straight', dimensions, length, material, gauge),
      cost: this.calculateCost('straight', dimensions, length, material, gauge)
    };
  }

  /**
   * Create elbow element
   */
  private createElbowElement(
    centerline: Centerline,
    dimensions: DuctDimensions,
    shape: DuctShape,
    index: number
  ): VanPackerSketchElement {
    const startPoint = centerline.points[0];
    const endPoint = centerline.points[centerline.points.length - 1];
    const radius = centerline.radius || this.calculateDefaultRadius(dimensions);
    const angle = this.calculateElbowAngle(centerline.points);

    const material = this.selectMaterial(dimensions, shape);
    const gauge = this.selectGauge(dimensions, shape);
    const connection = this.selectConnection(material, dimensions);

    return {
      id: `elbow_${index}_${centerline.id}`,
      type: 'elbow',
      startPoint,
      endPoint,
      dimensions: this.roundDimensions(dimensions),
      shape,
      material,
      connection,
      gauge,
      length: this.calculateElbowLength(radius, angle),
      angle,
      radius,
      fabricationNotes: this.generateElementFabricationNotes('elbow', dimensions, material, { radius, angle }),
      partNumber: this.partNumberGenerator.generatePartNumber('elbow', dimensions, material, { radius, angle }),
      weight: this.calculateWeight('elbow', dimensions, radius * angle * Math.PI / 180, material, gauge),
      cost: this.calculateCost('elbow', dimensions, radius * angle * Math.PI / 180, material, gauge)
    };
  }

  /**
   * Create segmented elements
   */
  private createSegmentedElements(
    centerline: Centerline,
    dimensions: DuctDimensions,
    shape: DuctShape,
    index: number
  ): VanPackerSketchElement[] {
    const elements: VanPackerSketchElement[] = [];

    for (let i = 0; i < centerline.points.length - 1; i++) {
      const segmentCenterline: Centerline = {
        id: `${centerline.id}_segment_${i}`,
        type: 'straight',
        points: [centerline.points[i], centerline.points[i + 1]],
        isComplete: true,
        isSMACNACompliant: centerline.isSMACNACompliant,
        warnings: [],
        metadata: {
          totalLength: this.calculateLength(centerline.points[i], centerline.points[i + 1]),
          segmentCount: 1,
          hasArcs: false,
          createdAt: new Date(),
          lastModified: new Date()
        }
      };

      const element = this.createStraightElement(segmentCenterline, dimensions, shape, index * 1000 + i);
      elements.push(element);
    }

    return elements;
  }

  /**
   * Optimize elements for fabrication
   */
  private optimizeForFabrication(elements: VanPackerSketchElement[]): void {
    // Group by material
    if (this.config.groupByMaterial) {
      elements.sort((a, b) => a.material.localeCompare(b.material));
    }

    // Sort by installation order
    if (this.config.sortByInstallationOrder) {
      // Sort by Y coordinate (bottom to top installation)
      elements.sort((a, b) => a.startPoint.y - b.startPoint.y);
    }

    // Optimize lengths for standard fabrication
    elements.forEach(element => {
      if (element.type === 'straight') {
        element.length = this.optimizeLength(element.length);
      }
    });

    // Standardize connections
    this.standardizeConnections(elements);
  }

  /**
   * Generate bill of materials
   */
  private generateBillOfMaterials(elements: VanPackerSketchElement[]): BillOfMaterialsItem[] {
    const bomMap = new Map<string, BillOfMaterialsItem>();

    elements.forEach(element => {
      const key = `${element.type}_${element.material}_${element.dimensions.width}x${element.dimensions.height}_${element.gauge}`;
      
      if (bomMap.has(key)) {
        const item = bomMap.get(key)!;
        item.quantity += 1;
        item.totalWeight += element.weight || 0;
        item.totalCost += element.cost || 0;
      } else {
        bomMap.set(key, {
          partNumber: element.partNumber || '',
          description: this.generatePartDescription(element),
          material: element.material,
          dimensions: `${element.dimensions.width}" x ${element.dimensions.height}"`,
          gauge: element.gauge,
          quantity: 1,
          unitWeight: element.weight || 0,
          totalWeight: element.weight || 0,
          unitCost: element.cost || 0,
          totalCost: element.cost || 0,
          supplier: this.getPreferredSupplier(element.material),
          leadTime: this.getLeadTime(element.material),
          fabricationNotes: element.fabricationNotes
        });
      }
    });

    // Add waste calculation
    if (this.config.includeWasteCalculation) {
      bomMap.forEach(item => {
        const wasteMultiplier = 1 + (this.config.wastePercentage / 100);
        item.quantity = Math.ceil(item.quantity * wasteMultiplier);
        item.totalWeight = item.unitWeight * item.quantity;
        item.totalCost = item.unitCost * item.quantity;
      });
    }

    return Array.from(bomMap.values()).sort((a, b) => a.description.localeCompare(b.description));
  }

  /**
   * Generate fabrication notes
   */
  private generateFabricationNotes(elements: VanPackerSketchElement[]): string[] {
    const notes: string[] = [];

    // General fabrication notes
    notes.push('All ductwork to be fabricated in accordance with SMACNA standards');
    notes.push('All seams to be sealed with appropriate sealant');
    notes.push('All connections to be mechanically fastened');

    // Material-specific notes
    const materials = new Set(elements.map(e => e.material));
    materials.forEach(material => {
      notes.push(...this.getMaterialSpecificNotes(material));
    });

    // Quality control notes
    if (this.config.includeMetadata) {
      notes.push('Pressure test required before installation');
      notes.push('Visual inspection required for all joints');
      notes.push('Dimensional verification required for all fittings');
    }

    return notes;
  }

  /**
   * Calculate project statistics
   */
  private calculateStatistics(
    elements: VanPackerSketchElement[],
    billOfMaterials: BillOfMaterialsItem[]
  ): VanPackerExportResult['statistics'] {
    const totalLength = elements.reduce((sum, element) => sum + element.length, 0) / 12; // convert to feet
    const totalWeight = billOfMaterials.reduce((sum, item) => sum + item.totalWeight, 0);
    const totalCost = billOfMaterials.reduce((sum, item) => sum + item.totalCost, 0);
    const fabricationTime = this.estimateFabricationTime(elements);

    return {
      totalElements: elements.length,
      totalLength,
      totalWeight,
      totalCost,
      fabricationTime
    };
  }

  /**
   * Export to specified format
   */
  private async exportToFormat(
    elements: VanPackerSketchElement[],
    metadata: VanPackerProjectMetadata,
    billOfMaterials: BillOfMaterialsItem[],
    fabricationNotes: string[]
  ): Promise<{
    data: string | ArrayBuffer;
    filename: string;
    warnings: string[];
  }> {
    const warnings: string[] = [];

    switch (this.config.format) {
      case VanPackerExportFormat.SKETCH:
        return this.exportToSketchFormat(elements, metadata, warnings);
      
      case VanPackerExportFormat.DXF:
        return this.exportToDXFFormat(elements, metadata, warnings);
      
      case VanPackerExportFormat.CSV:
        return this.exportToCSVFormat(billOfMaterials, metadata, warnings);
      
      case VanPackerExportFormat.JSON:
        return this.exportToJSONFormat(elements, metadata, billOfMaterials, fabricationNotes, warnings);
      
      case VanPackerExportFormat.XML:
        return this.exportToXMLFormat(elements, metadata, billOfMaterials, fabricationNotes, warnings);
      
      default:
        throw new Error(`Unsupported export format: ${this.config.format}`);
    }
  }

  /**
   * Export to VanPacker sketch format
   */
  private exportToSketchFormat(
    elements: VanPackerSketchElement[],
    metadata: VanPackerProjectMetadata,
    warnings: string[]
  ): { data: string; filename: string; warnings: string[] } {
    const sketchData = {
      version: '1.0',
      metadata,
      elements: elements.map(element => ({
        id: element.id,
        type: element.type,
        start: element.startPoint,
        end: element.endPoint,
        dimensions: element.dimensions,
        material: element.material,
        gauge: element.gauge,
        partNumber: element.partNumber,
        fabricationNotes: element.fabricationNotes
      }))
    };

    const filename = `${metadata.projectName.replace(/\s+/g, '_')}_sketch.json`;
    
    return {
      data: JSON.stringify(sketchData, null, 2),
      filename,
      warnings
    };
  }

  /**
   * Export to DXF format
   */
  private exportToDXFFormat(
    elements: VanPackerSketchElement[],
    metadata: VanPackerProjectMetadata,
    warnings: string[]
  ): { data: string; filename: string; warnings: string[] } {
    warnings.push('DXF export is simplified - use CAD software for detailed drawings');
    
    // Simplified DXF export (basic line entities)
    let dxfContent = '0\nSECTION\n2\nENTITIES\n';
    
    elements.forEach(element => {
      dxfContent += '0\nLINE\n';
      dxfContent += `10\n${element.startPoint.x}\n`;
      dxfContent += `20\n${element.startPoint.y}\n`;
      dxfContent += `30\n0\n`;
      dxfContent += `11\n${element.endPoint.x}\n`;
      dxfContent += `21\n${element.endPoint.y}\n`;
      dxfContent += `31\n0\n`;
    });
    
    dxfContent += '0\nENDSEC\n0\nEOF\n';
    
    const filename = `${metadata.projectName.replace(/\s+/g, '_')}_centerlines.dxf`;
    
    return {
      data: dxfContent,
      filename,
      warnings
    };
  }

  /**
   * Export to CSV format
   */
  private exportToCSVFormat(
    billOfMaterials: BillOfMaterialsItem[],
    metadata: VanPackerProjectMetadata,
    warnings: string[]
  ): { data: string; filename: string; warnings: string[] } {
    const headers = [
      'Part Number', 'Description', 'Material', 'Dimensions', 'Gauge',
      'Quantity', 'Unit Weight', 'Total Weight', 'Unit Cost', 'Total Cost',
      'Supplier', 'Lead Time'
    ];
    
    let csvContent = headers.join(',') + '\n';
    
    billOfMaterials.forEach(item => {
      const row = [
        item.partNumber,
        `"${item.description}"`,
        item.material,
        `"${item.dimensions}"`,
        item.gauge,
        item.quantity,
        item.unitWeight.toFixed(2),
        item.totalWeight.toFixed(2),
        item.unitCost.toFixed(2),
        item.totalCost.toFixed(2),
        item.supplier,
        item.leadTime
      ];
      csvContent += row.join(',') + '\n';
    });
    
    const filename = `${metadata.projectName.replace(/\s+/g, '_')}_BOM.csv`;
    
    return {
      data: csvContent,
      filename,
      warnings
    };
  }

  /**
   * Export to JSON format
   */
  private exportToJSONFormat(
    elements: VanPackerSketchElement[],
    metadata: VanPackerProjectMetadata,
    billOfMaterials: BillOfMaterialsItem[],
    fabricationNotes: string[],
    warnings: string[]
  ): { data: string; filename: string; warnings: string[] } {
    const jsonData = {
      metadata,
      elements,
      billOfMaterials,
      fabricationNotes,
      exportConfig: this.config,
      exportDate: new Date().toISOString()
    };
    
    const filename = `${metadata.projectName.replace(/\s+/g, '_')}_complete.json`;
    
    return {
      data: JSON.stringify(jsonData, null, 2),
      filename,
      warnings
    };
  }

  /**
   * Export to XML format
   */
  private exportToXMLFormat(
    elements: VanPackerSketchElement[],
    metadata: VanPackerProjectMetadata,
    billOfMaterials: BillOfMaterialsItem[],
    fabricationNotes: string[],
    warnings: string[]
  ): { data: string; filename: string; warnings: string[] } {
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xmlContent += '<VanPackerExport>\n';
    xmlContent += '  <Metadata>\n';
    xmlContent += `    <ProjectName>${metadata.projectName}</ProjectName>\n`;
    xmlContent += `    <ProjectNumber>${metadata.projectNumber}</ProjectNumber>\n`;
    xmlContent += `    <Designer>${metadata.designer}</Designer>\n`;
    xmlContent += '  </Metadata>\n';
    xmlContent += '  <Elements>\n';
    
    elements.forEach(element => {
      xmlContent += '    <Element>\n';
      xmlContent += `      <ID>${element.id}</ID>\n`;
      xmlContent += `      <Type>${element.type}</Type>\n`;
      xmlContent += `      <Material>${element.material}</Material>\n`;
      xmlContent += `      <Dimensions>${element.dimensions.width}x${element.dimensions.height}</Dimensions>\n`;
      xmlContent += '    </Element>\n';
    });
    
    xmlContent += '  </Elements>\n';
    xmlContent += '</VanPackerExport>\n';
    
    const filename = `${metadata.projectName.replace(/\s+/g, '_')}_export.xml`;
    
    return {
      data: xmlContent,
      filename,
      warnings
    };
  }

  // Helper methods (simplified implementations)
  private initializeMaterialDatabase(): void {
    // Initialize material properties database
    this.materialDatabase.set('galvanized_steel', {
      density: 0.284, // lb/in³
      costPerPound: 1.50,
      standardGauges: [30, 28, 26, 24, 22, 20, 18, 16, 14]
    });
  }

  private generateProjectNumber(): string {
    return `SP-${Date.now().toString().slice(-6)}`;
  }

  private calculateLength(start: Point2D, end: Point2D): number {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private selectMaterial(dimensions: DuctDimensions, shape: DuctShape): FabricationMaterial {
    // Simple material selection logic
    return FabricationMaterial.GALVANIZED_STEEL;
  }

  private selectGauge(dimensions: DuctDimensions, shape: DuctShape): number {
    // Simple gauge selection based on dimensions
    const area = dimensions.width * dimensions.height;
    if (area <= 100) return 30;
    if (area <= 300) return 28;
    if (area <= 500) return 26;
    return 24;
  }

  private selectConnection(material: FabricationMaterial, dimensions: DuctDimensions): FabricationConnection {
    return FabricationConnection.SLIP_JOINT;
  }

  private roundDimensions(dimensions: DuctDimensions): DuctDimensions {
    if (!this.config.roundUpDimensions) return dimensions;
    
    return {
      width: Math.ceil(dimensions.width),
      height: Math.ceil(dimensions.height)
    };
  }

  private generateElementFabricationNotes(
    type: string,
    dimensions: DuctDimensions,
    material: FabricationMaterial,
    extra?: any
  ): string[] {
    const notes: string[] = [];
    notes.push(`${type.toUpperCase()} - ${dimensions.width}" x ${dimensions.height}"`);
    notes.push(`Material: ${material.replace('_', ' ').toUpperCase()}`);
    
    if (type === 'elbow' && extra) {
      notes.push(`Radius: ${extra.radius}", Angle: ${extra.angle}°`);
    }
    
    return notes;
  }

  private calculateDefaultRadius(dimensions: DuctDimensions): number {
    return Math.max(dimensions.width, dimensions.height) * 1.5;
  }

  private calculateElbowAngle(points: Point2D[]): number {
    if (points.length < 3) return 90; // Default 90-degree elbow
    
    // Calculate angle between vectors
    const v1 = { x: points[1].x - points[0].x, y: points[1].y - points[0].y };
    const v2 = { x: points[2].x - points[1].x, y: points[2].y - points[1].y };
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    const angle = Math.acos(dot / (mag1 * mag2)) * 180 / Math.PI;
    return Math.round(angle);
  }

  private calculateElbowLength(radius: number, angle: number): number {
    return radius * angle * Math.PI / 180;
  }

  private calculateWeight(
    type: string,
    dimensions: DuctDimensions,
    length: number,
    material: FabricationMaterial,
    gauge: number
  ): number {
    const materialData = this.materialDatabase.get(material);
    if (!materialData) return 0;
    
    // Simplified weight calculation
    const perimeter = 2 * (dimensions.width + dimensions.height);
    const thickness = this.getThicknessFromGauge(gauge);
    const volume = perimeter * thickness * length;
    
    return volume * materialData.density;
  }

  private calculateCost(
    type: string,
    dimensions: DuctDimensions,
    length: number,
    material: FabricationMaterial,
    gauge: number
  ): number {
    const weight = this.calculateWeight(type, dimensions, length, material, gauge);
    const materialData = this.materialDatabase.get(material);
    if (!materialData) return 0;
    
    return weight * materialData.costPerPound;
  }

  private getThicknessFromGauge(gauge: number): number {
    // Simplified gauge to thickness conversion (inches)
    const gaugeTable: Record<number, number> = {
      30: 0.0120, 28: 0.0149, 26: 0.0179, 24: 0.0239,
      22: 0.0299, 20: 0.0359, 18: 0.0478, 16: 0.0598, 14: 0.0747
    };
    return gaugeTable[gauge] || 0.0239;
  }

  private optimizeLength(length: number): number {
    // Round up to nearest 6 inches for standard fabrication
    return Math.ceil(length / 6) * 6;
  }

  private standardizeConnections(elements: VanPackerSketchElement[]): void {
    // Ensure consistent connections throughout the system
    elements.forEach(element => {
      if (!this.config.preferredConnections.includes(element.connection)) {
        element.connection = this.config.preferredConnections[0];
      }
    });
  }

  private generatePartDescription(element: VanPackerSketchElement): string {
    return `${element.type.toUpperCase()} ${element.dimensions.width}" x ${element.dimensions.height}" ${element.material.replace('_', ' ').toUpperCase()}`;
  }

  private getPreferredSupplier(material: FabricationMaterial): string {
    const suppliers: Record<FabricationMaterial, string> = {
      [FabricationMaterial.GALVANIZED_STEEL]: 'Local Sheet Metal Supplier',
      [FabricationMaterial.STAINLESS_STEEL]: 'Specialty Steel Supplier',
      [FabricationMaterial.ALUMINUM]: 'Aluminum Supplier',
      [FabricationMaterial.SPIRAL_DUCT]: 'Spiral Duct Manufacturer',
      [FabricationMaterial.FIBERGLASS]: 'Insulation Supplier',
      [FabricationMaterial.FLEXIBLE_DUCT]: 'Flexible Duct Supplier'
    };
    return suppliers[material] || 'TBD';
  }

  private getLeadTime(material: FabricationMaterial): number {
    const leadTimes: Record<FabricationMaterial, number> = {
      [FabricationMaterial.GALVANIZED_STEEL]: 3,
      [FabricationMaterial.STAINLESS_STEEL]: 7,
      [FabricationMaterial.ALUMINUM]: 5,
      [FabricationMaterial.SPIRAL_DUCT]: 2,
      [FabricationMaterial.FIBERGLASS]: 1,
      [FabricationMaterial.FLEXIBLE_DUCT]: 1
    };
    return leadTimes[material] || 5;
  }

  private getMaterialSpecificNotes(material: FabricationMaterial): string[] {
    const notes: Record<FabricationMaterial, string[]> = {
      [FabricationMaterial.GALVANIZED_STEEL]: [
        'All galvanized steel to be G90 coating minimum',
        'Avoid contact with dissimilar metals'
      ],
      [FabricationMaterial.STAINLESS_STEEL]: [
        'Use stainless steel fasteners only',
        'Avoid contamination during fabrication'
      ],
      [FabricationMaterial.ALUMINUM]: [
        'Use aluminum fasteners to prevent galvanic corrosion',
        'Handle with care to prevent denting'
      ],
      [FabricationMaterial.SPIRAL_DUCT]: [
        'Factory-made spiral duct preferred',
        'Ensure proper spiral lock engagement'
      ],
      [FabricationMaterial.FIBERGLASS]: [
        'Handle with appropriate PPE',
        'Seal all joints with approved sealant'
      ],
      [FabricationMaterial.FLEXIBLE_DUCT]: [
        'Support every 4 feet maximum',
        'Avoid sharp bends and compression'
      ]
    };
    return notes[material] || [];
  }

  private estimateFabricationTime(elements: VanPackerSketchElement[]): number {
    // Simplified fabrication time estimation (hours)
    let totalTime = 0;
    
    elements.forEach(element => {
      switch (element.type) {
        case 'straight':
          totalTime += 0.5; // 30 minutes per straight section
          break;
        case 'elbow':
          totalTime += 1.0; // 1 hour per elbow
          break;
        case 'tee':
        case 'wye':
          totalTime += 1.5; // 1.5 hours per branch fitting
          break;
        case 'cross':
          totalTime += 2.0; // 2 hours per cross fitting
          break;
        default:
          totalTime += 0.75; // Default time
      }
    });
    
    return totalTime;
  }

  /**
   * Update export configuration
   */
  updateConfig(newConfig: Partial<VanPackerExportConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): VanPackerExportConfig {
    return { ...this.config };
  }
}

/**
 * Part number generator utility
 */
class PartNumberGenerator {
  private counter = 1000;

  generatePartNumber(
    type: string,
    dimensions: DuctDimensions,
    material: FabricationMaterial,
    extra?: any
  ): string {
    const typeCode = this.getTypeCode(type);
    const materialCode = this.getMaterialCode(material);
    const sizeCode = `${dimensions.width}X${dimensions.height}`;
    const sequenceNumber = (this.counter++).toString().padStart(4, '0');
    
    return `${typeCode}-${materialCode}-${sizeCode}-${sequenceNumber}`;
  }

  private getTypeCode(type: string): string {
    const codes: Record<string, string> = {
      straight: 'ST',
      elbow: 'EL',
      tee: 'TE',
      wye: 'WY',
      cross: 'CR',
      transition: 'TR',
      cap: 'CP'
    };
    return codes[type] || 'UN';
  }

  private getMaterialCode(material: FabricationMaterial): string {
    const codes: Record<FabricationMaterial, string> = {
      [FabricationMaterial.GALVANIZED_STEEL]: 'GS',
      [FabricationMaterial.STAINLESS_STEEL]: 'SS',
      [FabricationMaterial.ALUMINUM]: 'AL',
      [FabricationMaterial.SPIRAL_DUCT]: 'SP',
      [FabricationMaterial.FIBERGLASS]: 'FG',
      [FabricationMaterial.FLEXIBLE_DUCT]: 'FL'
    };
    return codes[material] || 'UN';
  }

  /**
   * Calculate distance between two points
   */
  private calculateLength(point1: any, point2: any): number {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}

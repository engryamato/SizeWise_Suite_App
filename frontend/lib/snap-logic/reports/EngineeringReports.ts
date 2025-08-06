/**
 * Professional Engineering Reports System
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Professional engineering compliance reports with detailed analysis, recommendations,
 * and code references for HVAC ductwork design. Generates comprehensive reports suitable
 * for professional engineering review, code compliance documentation, and project
 * deliverables in accordance with SMACNA standards and engineering best practices.
 * 
 * @fileoverview Professional engineering reports system
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

import { 
  SMACNAValidator,
  SMACNAStandard,
  DuctShape,
  PressureClass,
  DuctDimensions,
  SMACNAValidationResult,
  SMACNAViolation,
  SMACNAWarning,
  SMACNARecommendation
} from '../standards/SMACNAValidator';
import { CenterlineUtils, CenterlineAnalysis } from '../utils/CenterlineUtils';
import { Centerline } from '@/types/air-duct-sizer';

/**
 * Engineering report types
 */
export enum ReportType {
  COMPLIANCE = 'compliance',
  DESIGN_REVIEW = 'design_review',
  OPTIMIZATION = 'optimization',
  FULL_ANALYSIS = 'full_analysis'
}

/**
 * Report format types
 */
export enum ReportFormat {
  PDF = 'pdf',
  HTML = 'html',
  MARKDOWN = 'markdown',
  JSON = 'json'
}

/**
 * Engineering report configuration
 */
export interface EngineeringReportConfig {
  reportType: ReportType;
  format: ReportFormat;
  includeCalculations: boolean;
  includeRecommendations: boolean;
  includeCodeReferences: boolean;
  includeVisualizations: boolean;
  includePressureDropAnalysis: boolean;
  includeOptimizationSuggestions: boolean;
  engineerInfo?: {
    name: string;
    license: string;
    company: string;
    email: string;
    phone: string;
  };
  projectInfo?: {
    name: string;
    number: string;
    location: string;
    client: string;
    date: string;
  };
}

/**
 * Engineering report data
 */
export interface EngineeringReportData {
  metadata: {
    reportId: string;
    generatedAt: string;
    generatedBy: string;
    reportType: ReportType;
    format: ReportFormat;
    version: string;
  };
  projectInfo?: EngineeringReportConfig['projectInfo'];
  engineerInfo?: EngineeringReportConfig['engineerInfo'];
  summary: {
    totalCenterlines: number;
    totalLength: number;
    complianceRate: number;
    criticalViolations: number;
    majorViolations: number;
    minorViolations: number;
    overallRating: 'excellent' | 'good' | 'fair' | 'poor';
  };
  centerlineAnalyses: Array<{
    centerlineId: string;
    analysis: CenterlineAnalysis;
    smacnaResult: SMACNAValidationResult;
    ductInfo: {
      dimensions: DuctDimensions;
      shape: DuctShape;
      airflow?: number;
    };
  }>;
  complianceReport: {
    standardsApplied: SMACNAStandard[];
    pressureClass: PressureClass;
    violations: SMACNAViolation[];
    warnings: SMACNAWarning[];
    recommendations: SMACNARecommendation[];
  };
  calculations: Record<string, any>;
  conclusions: string[];
  recommendations: string[];
}

/**
 * Default engineering report configuration
 */
const DEFAULT_REPORT_CONFIG: EngineeringReportConfig = {
  reportType: ReportType.FULL_ANALYSIS,
  format: ReportFormat.HTML,
  includeCalculations: true,
  includeRecommendations: true,
  includeCodeReferences: true,
  includeVisualizations: false,
  includePressureDropAnalysis: true,
  includeOptimizationSuggestions: true
};

/**
 * Professional engineering reports generator
 */
export class EngineeringReports {
  private config: EngineeringReportConfig;
  private smacnaValidator: SMACNAValidator;

  constructor(config?: Partial<EngineeringReportConfig>) {
    this.config = { ...DEFAULT_REPORT_CONFIG, ...config };
    this.smacnaValidator = new SMACNAValidator({
      standard: SMACNAStandard.HVAC_2019,
      pressureClass: PressureClass.LOW,
      enableStrictMode: true,
      enableOptimizationRecommendations: true,
      enablePressureDropCalculations: true,
      enableRadiusRatioValidation: true,
      enableVelocityValidation: true,
      enableAspectRatioValidation: true
    });
  }

  /**
   * Generate comprehensive engineering report
   */
  generateReport(
    centerlines: Array<{
      centerline: Centerline;
      ductDimensions: DuctDimensions;
      ductShape: DuctShape;
      airflow?: number;
    }>
  ): EngineeringReportData {
    const reportId = this.generateReportId();
    const generatedAt = new Date().toISOString();

    // Analyze all centerlines
    const centerlineAnalyses = centerlines.map(item => {
      const analysis = CenterlineUtils.analyzeCenterline(
        item.centerline,
        item.ductDimensions,
        item.ductShape,
        item.airflow
      );

      const smacnaResult = this.smacnaValidator.validateCenterline(
        item.centerline,
        item.ductDimensions,
        item.ductShape,
        item.airflow
      );

      return {
        centerlineId: item.centerline.id,
        analysis,
        smacnaResult,
        ductInfo: {
          dimensions: item.ductDimensions,
          shape: item.ductShape,
          airflow: item.airflow
        }
      };
    });

    // Generate summary
    const summary = this.generateSummary(centerlineAnalyses);

    // Compile compliance report
    const complianceReport = this.generateComplianceReport(centerlineAnalyses);

    // Generate calculations
    const calculations = this.config.includeCalculations 
      ? this.generateCalculations(centerlineAnalyses)
      : {};

    // Generate conclusions and recommendations
    const conclusions = this.generateConclusions(centerlineAnalyses, summary);
    const recommendations = this.generateRecommendations(centerlineAnalyses);

    return {
      metadata: {
        reportId,
        generatedAt,
        generatedBy: 'SizeWise Suite Engineering Reports v1.1.0',
        reportType: this.config.reportType,
        format: this.config.format,
        version: '1.1.0'
      },
      projectInfo: this.config.projectInfo,
      engineerInfo: this.config.engineerInfo,
      summary,
      centerlineAnalyses,
      complianceReport,
      calculations,
      conclusions,
      recommendations
    };
  }

  /**
   * Generate report summary
   */
  private generateSummary(centerlineAnalyses: any[]): EngineeringReportData['summary'] {
    const totalCenterlines = centerlineAnalyses.length;
    const totalLength = centerlineAnalyses.reduce((sum, item) => sum + item.analysis.totalLength, 0);

    // Count violations
    let criticalViolations = 0;
    let majorViolations = 0;
    let minorViolations = 0;
    let compliantCenterlines = 0;

    centerlineAnalyses.forEach(item => {
      if (item.smacnaResult.isCompliant) {
        compliantCenterlines++;
      }

      item.smacnaResult.violations.forEach(violation => {
        switch (violation.severity) {
          case 'critical':
            criticalViolations++;
            break;
          case 'major':
            majorViolations++;
            break;
          case 'minor':
            minorViolations++;
            break;
        }
      });
    });

    const complianceRate = totalCenterlines > 0 ? (compliantCenterlines / totalCenterlines) * 100 : 0;

    // Determine overall rating
    let overallRating: 'excellent' | 'good' | 'fair' | 'poor';
    if (criticalViolations === 0 && majorViolations === 0 && complianceRate >= 95) {
      overallRating = 'excellent';
    } else if (criticalViolations === 0 && majorViolations <= 2 && complianceRate >= 85) {
      overallRating = 'good';
    } else if (criticalViolations <= 1 && majorViolations <= 5 && complianceRate >= 70) {
      overallRating = 'fair';
    } else {
      overallRating = 'poor';
    }

    return {
      totalCenterlines,
      totalLength,
      complianceRate,
      criticalViolations,
      majorViolations,
      minorViolations,
      overallRating
    };
  }

  /**
   * Generate compliance report
   */
  private generateComplianceReport(centerlineAnalyses: any[]): EngineeringReportData['complianceReport'] {
    const allViolations: SMACNAViolation[] = [];
    const allWarnings: SMACNAWarning[] = [];
    const allRecommendations: SMACNARecommendation[] = [];

    centerlineAnalyses.forEach(item => {
      allViolations.push(...item.smacnaResult.violations);
      allWarnings.push(...item.smacnaResult.warnings);
      allRecommendations.push(...item.smacnaResult.recommendations);
    });

    return {
      standardsApplied: [SMACNAStandard.HVAC_2019],
      pressureClass: PressureClass.LOW,
      violations: allViolations,
      warnings: allWarnings,
      recommendations: allRecommendations
    };
  }

  /**
   * Generate detailed calculations
   */
  private generateCalculations(centerlineAnalyses: any[]): Record<string, any> {
    const calculations: Record<string, any> = {};

    centerlineAnalyses.forEach((item, index) => {
      const centerlineId = item.centerlineId;
      
      calculations[centerlineId] = {
        geometry: {
          length: item.analysis.totalLength,
          segmentCount: item.analysis.segmentCount,
          complexityScore: item.analysis.complexityScore
        },
        smacnaValues: item.smacnaResult.calculatedValues,
        pressureDrop: this.config.includePressureDropAnalysis 
          ? CenterlineUtils.calculatePressureDrop(
              { id: centerlineId, type: 'straight', points: [] } as Centerline,
              item.ductInfo.dimensions,
              item.ductInfo.shape,
              item.ductInfo.airflow || 1000
            )
          : null
      };
    });

    return calculations;
  }

  /**
   * Generate engineering conclusions
   */
  private generateConclusions(centerlineAnalyses: any[], summary: any): string[] {
    const conclusions: string[] = [];

    // Overall assessment
    conclusions.push(
      `Engineering Analysis Summary: ${summary.totalCenterlines} centerlines analyzed with ${summary.complianceRate.toFixed(1)}% SMACNA compliance rate.`
    );

    // Compliance assessment
    if (summary.criticalViolations > 0) {
      conclusions.push(
        `CRITICAL: ${summary.criticalViolations} critical SMACNA violations identified requiring immediate attention.`
      );
    }

    if (summary.majorViolations > 0) {
      conclusions.push(
        `MAJOR: ${summary.majorViolations} major SMACNA violations identified requiring design modifications.`
      );
    }

    // Overall rating assessment
    switch (summary.overallRating) {
      case 'excellent':
        conclusions.push('Overall Design Rating: EXCELLENT - Design meets or exceeds all SMACNA standards with optimal performance characteristics.');
        break;
      case 'good':
        conclusions.push('Overall Design Rating: GOOD - Design meets SMACNA standards with minor optimization opportunities.');
        break;
      case 'fair':
        conclusions.push('Overall Design Rating: FAIR - Design has compliance issues that should be addressed for optimal performance.');
        break;
      case 'poor':
        conclusions.push('Overall Design Rating: POOR - Design requires significant modifications to meet SMACNA standards.');
        break;
    }

    // Performance assessment
    const avgComplexity = centerlineAnalyses.reduce((sum, item) => sum + item.analysis.complexityScore, 0) / centerlineAnalyses.length;
    if (avgComplexity > 70) {
      conclusions.push('Design complexity is high, which may impact fabrication cost and installation time.');
    }

    return conclusions;
  }

  /**
   * Generate engineering recommendations
   */
  private generateRecommendations(centerlineAnalyses: any[]): string[] {
    const recommendations: string[] = [];
    const recommendationSet = new Set<string>();

    // Collect unique recommendations from all analyses
    centerlineAnalyses.forEach(item => {
      item.smacnaResult.recommendations.forEach((rec: SMACNARecommendation) => {
        if (!recommendationSet.has(rec.description)) {
          recommendationSet.add(rec.description);
          recommendations.push(`${rec.priority.toUpperCase()}: ${rec.description} - ${rec.benefit}`);
        }
      });

      // Add optimization suggestions
      if (this.config.includeOptimizationSuggestions) {
        const optimizations = CenterlineUtils.generateOptimizations(
          { id: item.centerlineId, type: 'straight', points: [] } as Centerline,
          item.analysis,
          item.ductInfo.dimensions,
          item.ductInfo.shape
        );

        optimizations.forEach(opt => {
          const recText = `${opt.priority.toUpperCase()}: ${opt.description} - ${opt.benefit}`;
          if (!recommendationSet.has(recText)) {
            recommendationSet.add(recText);
            recommendations.push(recText);
          }
        });
      }
    });

    // Add general engineering recommendations
    recommendations.push('Verify all calculations with licensed professional engineer before construction.');
    recommendations.push('Ensure all ductwork installation follows SMACNA construction standards.');
    recommendations.push('Conduct pressure testing after installation to verify system performance.');

    return recommendations;
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ENG-RPT-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Export report to specified format
   */
  exportReport(reportData: EngineeringReportData): string {
    switch (this.config.format) {
      case ReportFormat.HTML:
        return this.exportToHTML(reportData);
      case ReportFormat.MARKDOWN:
        return this.exportToMarkdown(reportData);
      case ReportFormat.JSON:
        return JSON.stringify(reportData, null, 2);
      default:
        return this.exportToHTML(reportData);
    }
  }

  /**
   * Export report to HTML format
   */
  private exportToHTML(reportData: EngineeringReportData): string {
    // This would generate a comprehensive HTML report
    // For brevity, returning a simplified version
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Engineering Report - ${reportData.metadata.reportId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; }
        .section { margin: 30px 0; }
        .violation { padding: 10px; margin: 5px 0; border-left: 4px solid #ff0000; }
        .warning { padding: 10px; margin: 5px 0; border-left: 4px solid #ffaa00; }
        .recommendation { padding: 10px; margin: 5px 0; border-left: 4px solid #0066cc; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Professional Engineering Report</h1>
        <p><strong>Report ID:</strong> ${reportData.metadata.reportId}</p>
        <p><strong>Generated:</strong> ${new Date(reportData.metadata.generatedAt).toLocaleString()}</p>
        <p><strong>Overall Rating:</strong> ${reportData.summary.overallRating.toUpperCase()}</p>
    </div>
    
    <div class="section">
        <h2>Executive Summary</h2>
        <p>Total Centerlines: ${reportData.summary.totalCenterlines}</p>
        <p>SMACNA Compliance Rate: ${reportData.summary.complianceRate.toFixed(1)}%</p>
        <p>Critical Violations: ${reportData.summary.criticalViolations}</p>
        <p>Major Violations: ${reportData.summary.majorViolations}</p>
    </div>
    
    <div class="section">
        <h2>Engineering Conclusions</h2>
        ${reportData.conclusions.map(conclusion => `<p>• ${conclusion}</p>`).join('')}
    </div>
    
    <div class="section">
        <h2>Recommendations</h2>
        ${reportData.recommendations.map(rec => `<p class="recommendation">• ${rec}</p>`).join('')}
    </div>
</body>
</html>`;
  }

  /**
   * Export report to Markdown format
   */
  private exportToMarkdown(reportData: EngineeringReportData): string {
    return `# Professional Engineering Report

**Report ID:** ${reportData.metadata.reportId}
**Generated:** ${new Date(reportData.metadata.generatedAt).toLocaleString()}
**Overall Rating:** ${reportData.summary.overallRating.toUpperCase()}

## Executive Summary

- Total Centerlines: ${reportData.summary.totalCenterlines}
- SMACNA Compliance Rate: ${reportData.summary.complianceRate.toFixed(1)}%
- Critical Violations: ${reportData.summary.criticalViolations}
- Major Violations: ${reportData.summary.majorViolations}

## Engineering Conclusions

${reportData.conclusions.map(conclusion => `- ${conclusion}`).join('\n')}

## Recommendations

${reportData.recommendations.map(rec => `- ${rec}`).join('\n')}

---
*Generated by SizeWise Suite Engineering Reports v${reportData.metadata.version}*`;
  }

  /**
   * Update report configuration
   */
  updateConfig(newConfig: Partial<EngineeringReportConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): EngineeringReportConfig {
    return { ...this.config };
  }

  /**
   * Generate report template for specific report type
   */
  static generateReportTemplate(reportType: ReportType): Partial<EngineeringReportConfig> {
    switch (reportType) {
      case ReportType.COMPLIANCE:
        return {
          reportType: ReportType.COMPLIANCE,
          format: ReportFormat.HTML,
          includeCalculations: false,
          includeRecommendations: true,
          includeCodeReferences: true,
          includeVisualizations: false,
          includePressureDropAnalysis: false,
          includeOptimizationSuggestions: false
        };

      case ReportType.DESIGN_REVIEW:
        return {
          reportType: ReportType.DESIGN_REVIEW,
          format: ReportFormat.HTML,
          includeCalculations: true,
          includeRecommendations: true,
          includeCodeReferences: true,
          includeVisualizations: true,
          includePressureDropAnalysis: true,
          includeOptimizationSuggestions: true
        };

      case ReportType.OPTIMIZATION:
        return {
          reportType: ReportType.OPTIMIZATION,
          format: ReportFormat.MARKDOWN,
          includeCalculations: true,
          includeRecommendations: true,
          includeCodeReferences: false,
          includeVisualizations: false,
          includePressureDropAnalysis: true,
          includeOptimizationSuggestions: true
        };

      case ReportType.FULL_ANALYSIS:
      default:
        return {
          reportType: ReportType.FULL_ANALYSIS,
          format: ReportFormat.HTML,
          includeCalculations: true,
          includeRecommendations: true,
          includeCodeReferences: true,
          includeVisualizations: true,
          includePressureDropAnalysis: true,
          includeOptimizationSuggestions: true
        };
    }
  }

  /**
   * Validate report data for completeness
   */
  static validateReportData(reportData: EngineeringReportData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!reportData.metadata.reportId) {
      errors.push('Report ID is required');
    }

    if (!reportData.summary) {
      errors.push('Report summary is required');
    }

    if (!reportData.centerlineAnalyses || reportData.centerlineAnalyses.length === 0) {
      errors.push('At least one centerline analysis is required');
    }

    // Check for missing engineer info in professional reports
    if (!reportData.engineerInfo) {
      warnings.push('Engineer information is recommended for professional reports');
    }

    // Check for missing project info
    if (!reportData.projectInfo) {
      warnings.push('Project information is recommended for complete documentation');
    }

    // Validate compliance data
    if (reportData.summary.complianceRate < 70) {
      warnings.push('Low compliance rate may require design review');
    }

    if (reportData.summary.criticalViolations > 0) {
      warnings.push('Critical violations present - immediate attention required');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

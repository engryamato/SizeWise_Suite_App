/**
 * Engineering Reports Integration Example
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Comprehensive example showing how to generate professional engineering reports
 * with SMACNA compliance analysis, detailed calculations, and code references for
 * professional HVAC design workflows. Demonstrates report generation, export
 * functionality, and integration with existing snap logic systems.
 * 
 * @fileoverview Engineering reports integration example
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

'use client';

import React, { useState, useCallback } from 'react';
import { 
  EngineeringReports,
  ReportType,
  ReportFormat,
  EngineeringReportData,
  EngineeringReportConfig
} from '@/lib/snap-logic';
import { 
  DuctShape,
  DuctDimensions,
  SMACNAStandard,
  PressureClass
} from '@/lib/snap-logic';
import { Centerline } from '@/types/air-duct-sizer';

/**
 * Example component showing comprehensive engineering reports integration
 */
export const EngineeringReportsExample: React.FC = () => {
  const [reportGenerator, setReportGenerator] = useState<EngineeringReports>(
    new EngineeringReports({
      reportType: ReportType.FULL_ANALYSIS,
      format: ReportFormat.HTML,
      includeCalculations: true,
      includeRecommendations: true,
      includeCodeReferences: true,
      includePressureDropAnalysis: true,
      includeOptimizationSuggestions: true,
      engineerInfo: {
        name: 'John Smith, P.E.',
        license: 'PE-12345',
        company: 'HVAC Engineering Solutions',
        email: 'j.smith@hvaceng.com',
        phone: '(555) 123-4567'
      },
      projectInfo: {
        name: 'Office Building HVAC System',
        number: 'PROJ-2024-001',
        location: 'Downtown Business District',
        client: 'ABC Corporation',
        date: new Date().toLocaleDateString()
      }
    })
  );

  const [generatedReport, setGeneratedReport] = useState<EngineeringReportData | null>(null);
  const [exportedReport, setExportedReport] = useState<string>('');
  const [selectedReportType, setSelectedReportType] = useState<ReportType>(ReportType.FULL_ANALYSIS);
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>(ReportFormat.HTML);

  // Example ductwork data
  const exampleDuctwork = [
    {
      centerline: {
        id: 'main_supply_1',
        type: 'straight' as const,
        points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
        isComplete: true,
        isSMACNACompliant: true,
        warnings: [],
        metadata: {
          totalLength: 100,
          segmentCount: 1,
          hasArcs: false,
          createdAt: new Date(),
          lastModified: new Date()
        }
      },
      ductDimensions: { width: 24, height: 12 },
      ductShape: DuctShape.RECTANGULAR,
      airflow: 2000
    },
    {
      centerline: {
        id: 'branch_arc_1',
        type: 'arc' as const,
        points: [{ x: 100, y: 0 }, { x: 125, y: 25 }, { x: 150, y: 50 }],
        radius: 18,
        isComplete: true,
        isSMACNACompliant: true,
        warnings: [],
        metadata: {
          totalLength: 70.7,
          segmentCount: 2,
          hasArcs: true,
          createdAt: new Date(),
          lastModified: new Date()
        }
      },
      ductDimensions: { width: 16, height: 10 },
      ductShape: DuctShape.RECTANGULAR,
      airflow: 1200
    },
    {
      centerline: {
        id: 'return_round_1',
        type: 'straight' as const,
        points: [{ x: 200, y: 0 }, { x: 300, y: 0 }],
        isComplete: true,
        isSMACNACompliant: true,
        warnings: [],
        metadata: {
          totalLength: 100,
          segmentCount: 1,
          hasArcs: false,
          createdAt: new Date(),
          lastModified: new Date()
        }
      },
      ductDimensions: { width: 0, height: 0, diameter: 20 },
      ductShape: DuctShape.ROUND,
      airflow: 1800
    },
    {
      centerline: {
        id: 'problematic_arc',
        type: 'arc' as const,
        points: [{ x: 300, y: 0 }, { x: 310, y: 10 }, { x: 320, y: 0 }],
        radius: 4, // Too small radius for 18" duct
        isComplete: true,
        isSMACNACompliant: false,
        warnings: ['Radius too small for duct diameter', 'High velocity detected'],
        metadata: {
          totalLength: 31.4,
          segmentCount: 2,
          hasArcs: true,
          createdAt: new Date(),
          lastModified: new Date()
        }
      },
      ductDimensions: { width: 0, height: 0, diameter: 18 },
      ductShape: DuctShape.ROUND,
      airflow: 2500 // High velocity
    },
    {
      centerline: {
        id: 'high_aspect_ratio',
        type: 'straight' as const,
        points: [{ x: 400, y: 0 }, { x: 500, y: 0 }],
        isComplete: true,
        isSMACNACompliant: false,
        warnings: ['Aspect ratio exceeds 4:1 limit'],
        metadata: {
          totalLength: 100,
          segmentCount: 1,
          hasArcs: false,
          createdAt: new Date(),
          lastModified: new Date()
        }
      },
      ductDimensions: { width: 30, height: 6 }, // 5:1 aspect ratio (exceeds 4:1 limit)
      ductShape: DuctShape.RECTANGULAR,
      airflow: 1500
    }
  ];

  // Update report generator configuration
  const updateReportConfig = useCallback(() => {
    const template = EngineeringReports.generateReportTemplate(selectedReportType);
    const newGenerator = new EngineeringReports({
      ...template,
      format: selectedFormat,
      engineerInfo: {
        name: 'John Smith, P.E.',
        license: 'PE-12345',
        company: 'HVAC Engineering Solutions',
        email: 'j.smith@hvaceng.com',
        phone: '(555) 123-4567'
      },
      projectInfo: {
        name: 'Office Building HVAC System',
        number: 'PROJ-2024-001',
        location: 'Downtown Business District',
        client: 'ABC Corporation',
        date: new Date().toLocaleDateString()
      }
    });
    setReportGenerator(newGenerator);
  }, [selectedReportType, selectedFormat]);

  // Generate engineering report
  const generateReport = useCallback(() => {
    try {
      const reportData = reportGenerator.generateReport(exampleDuctwork);
      setGeneratedReport(reportData);
      
      // Also generate exported version
      const exported = reportGenerator.exportReport(reportData);
      setExportedReport(exported);
      
    } catch (error) {
      console.error('Report generation failed:', error);
      alert(`Report generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [reportGenerator]);

  // Download report
  const downloadReport = useCallback(() => {
    if (!exportedReport || !generatedReport) return;

    const blob = new Blob([exportedReport], { 
      type: selectedFormat === ReportFormat.HTML ? 'text/html' : 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `engineering_report_${generatedReport.metadata.reportId}.${selectedFormat}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportedReport, generatedReport, selectedFormat]);

  // Get severity color for violations
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-800 bg-red-100 border-red-200';
      case 'major': return 'text-orange-800 bg-orange-100 border-orange-200';
      case 'minor': return 'text-yellow-800 bg-yellow-100 border-yellow-200';
      default: return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  // Get rating color
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-800 bg-green-100';
      case 'good': return 'text-blue-800 bg-blue-100';
      case 'fair': return 'text-yellow-800 bg-yellow-100';
      case 'poor': return 'text-red-800 bg-red-100';
      default: return 'text-gray-800 bg-gray-100';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Engineering Reports Example</h1>
      
      {/* Configuration Controls */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Report Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value as ReportType)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {Object.values(ReportType).map(type => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as ReportFormat)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              {Object.values(ReportFormat).map(format => (
                <option key={format} value={format}>
                  {format.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={updateReportConfig}
              className="w-full p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Update Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Example Ductwork Data */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Example Ductwork Data</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exampleDuctwork.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded p-3">
                <h4 className="font-medium text-sm mb-2">{item.centerline.id}</h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Type: {item.centerline.type}</div>
                  <div>Shape: {item.ductShape}</div>
                  <div>
                    Size: {item.ductShape === DuctShape.ROUND 
                      ? `${item.ductDimensions.diameter}" diameter`
                      : `${item.ductDimensions.width}" × ${item.ductDimensions.height}"`
                    }
                  </div>
                  <div>Airflow: {item.airflow} CFM</div>
                  {item.centerline.radius && (
                    <div>Radius: {item.centerline.radius}"</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generate Report */}
      <div className="mb-6">
        <button
          onClick={generateReport}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
        >
          Generate Engineering Report
        </button>
      </div>

      {/* Report Results */}
      {generatedReport && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Generated Report</h2>
            <button
              onClick={downloadReport}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
            >
              Download Report
            </button>
          </div>

          {/* Report Metadata */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Report Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Report ID:</strong> {generatedReport.metadata.reportId}
              </div>
              <div>
                <strong>Generated:</strong> {new Date(generatedReport.metadata.generatedAt).toLocaleString()}
              </div>
              <div>
                <strong>Type:</strong> {generatedReport.metadata.reportType.replace('_', ' ').toUpperCase()}
              </div>
              <div>
                <strong>Format:</strong> {generatedReport.metadata.format.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Executive Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">{generatedReport.summary.totalCenterlines}</div>
                <div className="text-sm text-blue-800">Total Centerlines</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">{generatedReport.summary.complianceRate.toFixed(1)}%</div>
                <div className="text-sm text-green-800">SMACNA Compliance</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <div className="text-2xl font-bold text-red-600">{generatedReport.summary.criticalViolations}</div>
                <div className="text-sm text-red-800">Critical Violations</div>
              </div>
              <div className={`text-center p-3 rounded ${getRatingColor(generatedReport.summary.overallRating)}`}>
                <div className="text-lg font-bold">{generatedReport.summary.overallRating.toUpperCase()}</div>
                <div className="text-sm">Overall Rating</div>
              </div>
            </div>
          </div>

          {/* Violations */}
          {generatedReport.complianceReport.violations.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-red-700">SMACNA Violations</h3>
              <div className="space-y-2">
                {generatedReport.complianceReport.violations.map((violation, index) => (
                  <div key={index} className={`p-3 rounded border ${getSeverityColor(violation.severity)}`}>
                    <div className="font-medium">{violation.code}: {violation.description}</div>
                    <div className="text-sm mt-1">
                      Current: {violation.currentValue.toFixed(2)} | 
                      Required: {violation.requiredValue.toFixed(2)} | 
                      Reference: {violation.standardReference}
                    </div>
                    {violation.centerlineId && (
                      <div className="text-xs mt-1">Centerline: {violation.centerlineId}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {generatedReport.complianceReport.warnings.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-yellow-700">Warnings</h3>
              <div className="space-y-2">
                {generatedReport.complianceReport.warnings.map((warning, index) => (
                  <div key={index} className="p-3 rounded border border-yellow-200 bg-yellow-50 text-yellow-800">
                    <div className="font-medium">{warning.code}: {warning.description}</div>
                    <div className="text-sm mt-1">Recommendation: {warning.recommendation}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Engineering Conclusions */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Engineering Conclusions</h3>
            <div className="space-y-2">
              {generatedReport.conclusions.map((conclusion, index) => (
                <div key={index} className="p-2 bg-gray-50 rounded text-sm">
                  • {conclusion}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Recommendations</h3>
            <div className="space-y-2">
              {generatedReport.recommendations.map((recommendation, index) => (
                <div key={index} className="p-2 bg-blue-50 rounded text-sm">
                  • {recommendation}
                </div>
              ))}
            </div>
          </div>

          {/* Export Preview */}
          {selectedFormat === ReportFormat.HTML && exportedReport && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3">HTML Export Preview</h3>
              <div 
                className="border border-gray-300 rounded p-4 max-h-96 overflow-auto bg-white"
                dangerouslySetInnerHTML={{ __html: exportedReport }}
              />
            </div>
          )}

          {selectedFormat === ReportFormat.MARKDOWN && exportedReport && (
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Markdown Export Preview</h3>
              <pre className="border border-gray-300 rounded p-4 max-h-96 overflow-auto bg-gray-50 text-sm">
                {exportedReport}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EngineeringReportsExample;

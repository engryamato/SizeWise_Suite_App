"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Download, 
  ArrowLeft,
  FileText,
  Image,
  File,
  CheckCircle,
  Settings,
  Folder,
  Calendar,
  User,
  Info
} from 'lucide-react';

interface ExportFormat {
  id: string;
  name: string;
  description: string;
  extension: string;
  icon: React.ReactNode;
  category: 'cad' | 'document' | 'data' | 'image';
  size?: string;
}

const EXPORT_FORMATS: ExportFormat[] = [
  {
    id: 'dwg',
    name: 'AutoCAD Drawing',
    description: 'Industry standard CAD format with full geometry and layers',
    extension: '.dwg',
    icon: <FileText className="w-6 h-6" />,
    category: 'cad',
    size: '~2.5 MB'
  },
  {
    id: 'dxf',
    name: 'Drawing Exchange Format',
    description: 'Universal CAD format compatible with most software',
    extension: '.dxf',
    icon: <FileText className="w-6 h-6" />,
    category: 'cad',
    size: '~3.1 MB'
  },
  {
    id: 'pdf',
    name: 'PDF Document',
    description: 'Portable document with drawings and calculations',
    extension: '.pdf',
    icon: <FileText className="w-6 h-6" />,
    category: 'document',
    size: '~1.8 MB'
  },
  {
    id: 'xlsx',
    name: 'Excel Spreadsheet',
    description: 'Detailed calculations and equipment schedules',
    extension: '.xlsx',
    icon: <FileText className="w-6 h-6" />,
    category: 'data',
    size: '~850 KB'
  },
  {
    id: 'csv',
    name: 'CSV Data',
    description: 'Raw calculation data for analysis',
    extension: '.csv',
    icon: <File className="w-6 h-6" />,
    category: 'data',
    size: '~120 KB'
  },
  {
    id: 'png',
    name: 'PNG Image',
    description: 'High-quality raster image of the layout',
    extension: '.png',
    icon: <Image className="w-6 h-6" />,
    category: 'image',
    size: '~4.2 MB'
  },
  {
    id: 'json',
    name: 'JSON Project',
    description: 'Complete project data in JSON format',
    extension: '.json',
    icon: <File className="w-6 h-6" />,
    category: 'data',
    size: '~650 KB'
  }
];

export default function ExportPage() {
  const router = useRouter();
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['pdf']);
  const [exportSettings, setExportSettings] = useState({
    includeCalculations: true,
    includeDrawings: true,
    includeSchedules: true,
    includeReports: true,
    compressFiles: true,
    includeMetadata: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const toggleFormat = (formatId: string) => {
    setSelectedFormats(prev => 
      prev.includes(formatId) 
        ? prev.filter(id => id !== formatId)
        : [...prev, formatId]
    );
  };

  const startExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    
    // Simulate export progress
    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cad': return 'bg-blue-100 text-blue-800';
      case 'document': return 'bg-green-100 text-green-800';
      case 'data': return 'bg-purple-100 text-purple-800';
      case 'image': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSelectedFormats = () => {
    return EXPORT_FORMATS.filter(format => selectedFormats.includes(format.id));
  };

  const getTotalSize = () => {
    const selected = getSelectedFormats();
    const totalBytes = selected.reduce((total, format) => {
      if (!format.size) return total;
      const sizeStr = format.size.replace(/[^\d.]/g, '');
      const size = parseFloat(sizeStr);
      const unit = format.size.includes('MB') ? 1024 : 1;
      return total + (size * unit);
    }, 0);
    
    return totalBytes > 1024 ? `${(totalBytes / 1024).toFixed(1)} MB` : `${Math.round(totalBytes)} KB`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Export Project</h1>
            <p className="text-gray-600 mt-1">Export your HVAC project in various formats</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Export Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Project Info */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Project</h2>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Folder className="w-8 h-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">Office Building HVAC</h3>
                  <p className="text-gray-600">Commercial HVAC system design with 12 zones</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      <span>John Smith</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Last modified 2 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Formats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Export Formats</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXPORT_FORMATS.map((format) => (
                  <div
                    key={format.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedFormats.includes(format.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => toggleFormat(format.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        selectedFormats.includes(format.id) ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        {format.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{format.name}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(format.category)}`}>
                            {format.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{format.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{format.extension}</span>
                          {format.size && <span>{format.size}</span>}
                        </div>
                      </div>
                      {selectedFormats.includes(format.id) && (
                        <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Export Settings</h2>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={exportSettings.includeCalculations}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      includeCalculations: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Include Calculations</div>
                    <div className="text-sm text-gray-600">Export all HVAC calculations and sizing data</div>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={exportSettings.includeDrawings}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      includeDrawings: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Include Drawings</div>
                    <div className="text-sm text-gray-600">Export technical drawings and layouts</div>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={exportSettings.includeSchedules}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      includeSchedules: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Include Equipment Schedules</div>
                    <div className="text-sm text-gray-600">Export equipment lists and specifications</div>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={exportSettings.includeReports}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      includeReports: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Include Reports</div>
                    <div className="text-sm text-gray-600">Export analysis reports and summaries</div>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={exportSettings.compressFiles}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      compressFiles: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Compress Files</div>
                    <div className="text-sm text-gray-600">Create a ZIP archive for multiple files</div>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={exportSettings.includeMetadata}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      includeMetadata: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Include Metadata</div>
                    <div className="text-sm text-gray-600">Add project information and timestamps</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Export Progress */}
            {isExporting && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Exporting...</h2>
                <div className="space-y-3">
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Processing files...</span>
                    <span>{Math.round(exportProgress)}%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Export Summary */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Selected Formats:</span>
                  <span className="font-medium">{selectedFormats.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimated Size:</span>
                  <span className="font-medium">{getTotalSize()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Compression:</span>
                  <span className="font-medium">{exportSettings.compressFiles ? 'Enabled' : 'Disabled'}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-2">Selected Formats:</h4>
                <div className="space-y-1">
                  {getSelectedFormats().map(format => (
                    <div key={format.id} className="text-sm text-gray-600">
                      • {format.name} ({format.extension})
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={startExport}
                disabled={selectedFormats.length === 0 || isExporting}
                className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {isExporting ? 'Exporting...' : 'Start Export'}
              </button>
            </div>

            {/* Export Tips */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Export Tips</h3>
              </div>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• PDF format is best for sharing with clients</li>
                <li>• DWG/DXF formats preserve full CAD data</li>
                <li>• Excel exports include detailed calculations</li>
                <li>• Enable compression for multiple formats</li>
                <li>• Large exports may take several minutes</li>
              </ul>
            </div>

            {/* Recent Exports */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Exports</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2 border rounded">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Office_HVAC.pdf</div>
                    <div className="text-xs text-gray-500">2 hours ago</div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm">Download</button>
                </div>
                <div className="flex items-center gap-3 p-2 border rounded">
                  <File className="w-4 h-4 text-gray-400" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">HVAC_Data.xlsx</div>
                    <div className="text-xs text-gray-500">Yesterday</div>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm">Download</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

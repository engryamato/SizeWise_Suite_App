"use client";

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Upload, 
  ArrowLeft,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Download,
  Info,
  Folder,
  File
} from 'lucide-react';

interface ImportFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  progress?: number;
  error?: string;
}

const SUPPORTED_FORMATS = [
  { extension: '.dwg', description: 'AutoCAD Drawing Files', icon: FileText },
  { extension: '.dxf', description: 'Drawing Exchange Format', icon: FileText },
  { extension: '.xlsx', description: 'Excel Spreadsheets', icon: FileText },
  { extension: '.csv', description: 'Comma Separated Values', icon: FileText },
  { extension: '.json', description: 'JSON Project Files', icon: FileText },
  { extension: '.xml', description: 'XML Configuration Files', icon: FileText }
];

export default function ImportPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<ImportFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [importSettings, setImportSettings] = useState({
    preserveLayouts: true,
    mergeWithExisting: false,
    validateData: true,
    createBackup: true
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (fileList: FileList) => {
    const newFiles: ImportFile[] = Array.from(fileList).map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      name: file.name,
      size: file.size,
      type: file.type || 'unknown',
      status: 'pending'
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const startImport = () => {
    // Simulate import process
    files.forEach((file, index) => {
      setTimeout(() => {
        setFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, status: 'processing', progress: 0 } : f
        ));
        
        // Simulate progress
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 20;
          if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
            setFiles(prev => prev.map(f => 
              f.id === file.id ? { 
                ...f, 
                status: Math.random() > 0.1 ? 'success' : 'error',
                progress: 100,
                error: Math.random() > 0.1 ? undefined : 'Invalid file format or corrupted data'
              } : f
            ));
          } else {
            setFiles(prev => prev.map(f => 
              f.id === file.id ? { ...f, progress } : f
            ));
          }
        }, 200);
      }, index * 500);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'processing': return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default: return <File className="w-5 h-5 text-gray-400" />;
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Import Projects</h1>
            <p className="text-gray-600 mt-1">Import HVAC projects and data from various file formats</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Import Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Area */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Files</h2>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop files here or click to browse
                </h3>
                <p className="text-gray-600 mb-4">
                  Support for DWG, DXF, Excel, CSV, JSON, and XML files
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Choose Files
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".dwg,.dxf,.xlsx,.csv,.json,.xml"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            </div>

            {/* Import Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Import Settings</h2>
              
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={importSettings.preserveLayouts}
                    onChange={(e) => setImportSettings(prev => ({
                      ...prev,
                      preserveLayouts: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Preserve Layouts</div>
                    <div className="text-sm text-gray-600">Maintain original drawing layouts and dimensions</div>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={importSettings.mergeWithExisting}
                    onChange={(e) => setImportSettings(prev => ({
                      ...prev,
                      mergeWithExisting: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Merge with Existing Project</div>
                    <div className="text-sm text-gray-600">Add imported data to current project</div>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={importSettings.validateData}
                    onChange={(e) => setImportSettings(prev => ({
                      ...prev,
                      validateData: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Validate Data</div>
                    <div className="text-sm text-gray-600">Check for HVAC standards compliance</div>
                  </div>
                </label>

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={importSettings.createBackup}
                    onChange={(e) => setImportSettings(prev => ({
                      ...prev,
                      createBackup: e.target.checked
                    }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Create Backup</div>
                    <div className="text-sm text-gray-600">Backup current project before import</div>
                  </div>
                </label>
              </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Files to Import</h2>
                  <button
                    onClick={startImport}
                    disabled={files.some(f => f.status === 'processing')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    Start Import
                  </button>
                </div>
                
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      {getStatusIcon(file.status)}
                      
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{file.name}</div>
                        <div className="text-sm text-gray-600">{formatFileSize(file.size)}</div>
                        {file.status === 'processing' && file.progress !== undefined && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 mt-1">{Math.round(file.progress)}%</div>
                          </div>
                        )}
                        {file.error && (
                          <div className="text-sm text-red-600 mt-1">{file.error}</div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Supported Formats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Supported Formats</h3>
              <div className="space-y-3">
                {SUPPORTED_FORMATS.map((format) => (
                  <div key={format.extension} className="flex items-center gap-3">
                    <format.icon className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{format.extension}</div>
                      <div className="text-sm text-gray-600">{format.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Import Tips */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-blue-900">Import Tips</h3>
              </div>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• Ensure CAD files are saved in compatible versions</li>
                <li>• Excel files should follow the SizeWise template format</li>
                <li>• Large files may take several minutes to process</li>
                <li>• Always create backups before importing</li>
                <li>• Validate imported data for accuracy</li>
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Download Template</div>
                    <div className="text-sm text-gray-600">Get Excel import template</div>
                  </div>
                </button>
                
                <button className="w-full flex items-center gap-3 p-3 text-left border rounded-lg hover:bg-gray-50 transition-colors">
                  <Folder className="w-5 h-5 text-gray-400" />
                  <div>
                    <div className="font-medium text-gray-900">Import History</div>
                    <div className="text-sm text-gray-600">View previous imports</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

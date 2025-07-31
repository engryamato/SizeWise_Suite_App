"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Clock,
  FileText,
  Folder,
  Search,
  Filter,
  MoreVertical,
  Star,
  Trash2,
  Download,
  Eye,
  Calendar,
  User,
  HardDrive,
  Grid,
  List
} from 'lucide-react';

interface RecentFile {
  id: string;
  name: string;
  type: 'project' | 'drawing' | 'calculation' | 'report' | 'template';
  path: string;
  lastAccessed: string;
  lastModified: string;
  size: string;
  author: string;
  thumbnail?: string;
  isFavorite: boolean;
  isShared: boolean;
}

const RECENT_FILES: RecentFile[] = [
  {
    id: '1',
    name: 'Office Building HVAC',
    type: 'project',
    path: '/projects/office-building-hvac',
    lastAccessed: '2 hours ago',
    lastModified: '2 hours ago',
    size: '2.4 MB',
    author: 'John Smith',
    isFavorite: true,
    isShared: false
  },
  {
    id: '2',
    name: 'Warehouse Ventilation',
    type: 'project',
    path: '/projects/warehouse-ventilation',
    lastAccessed: '1 day ago',
    lastModified: '1 day ago',
    size: '1.8 MB',
    author: 'John Smith',
    isFavorite: false,
    isShared: true
  },
  {
    id: '3',
    name: 'HVAC Load Calculations',
    type: 'calculation',
    path: '/calculations/hvac-load-calc.xlsx',
    lastAccessed: '2 days ago',
    lastModified: '3 days ago',
    size: '850 KB',
    author: 'Sarah Johnson',
    isFavorite: false,
    isShared: false
  },
  {
    id: '4',
    name: 'Duct Layout Drawing',
    type: 'drawing',
    path: '/drawings/duct-layout.dwg',
    lastAccessed: '3 days ago',
    lastModified: '4 days ago',
    size: '3.2 MB',
    author: 'Mike Wilson',
    isFavorite: true,
    isShared: false
  },
  {
    id: '5',
    name: 'Energy Analysis Report',
    type: 'report',
    path: '/reports/energy-analysis.pdf',
    lastAccessed: '5 days ago',
    lastModified: '5 days ago',
    size: '1.2 MB',
    author: 'John Smith',
    isFavorite: false,
    isShared: true
  },
  {
    id: '6',
    name: 'Commercial HVAC Template',
    type: 'template',
    path: '/templates/commercial-hvac.json',
    lastAccessed: '1 week ago',
    lastModified: '2 weeks ago',
    size: '450 KB',
    author: 'System',
    isFavorite: false,
    isShared: false
  }
];

export default function RecentFilesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'lastAccessed' | 'name' | 'size'>('lastAccessed');

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'project': return <Folder className="w-6 h-6 text-blue-600" />;
      case 'drawing': return <FileText className="w-6 h-6 text-green-600" />;
      case 'calculation': return <FileText className="w-6 h-6 text-purple-600" />;
      case 'report': return <FileText className="w-6 h-6 text-red-600" />;
      case 'template': return <FileText className="w-6 h-6 text-orange-600" />;
      default: return <FileText className="w-6 h-6 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'project': return 'bg-blue-100 text-blue-800';
      case 'drawing': return 'bg-green-100 text-green-800';
      case 'calculation': return 'bg-purple-100 text-purple-800';
      case 'report': return 'bg-red-100 text-red-800';
      case 'template': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredFiles = RECENT_FILES
    .filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           file.author.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || file.type === selectedType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'size': return parseFloat(a.size) - parseFloat(b.size);
        case 'lastAccessed':
        default:
          return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime();
      }
    });

  const handleFileOpen = (file: RecentFile) => {
    if (file.type === 'project') {
      router.push(file.path);
    } else {
      // Handle other file types
      console.log('Opening file:', file.name);
    }
  };

  const toggleFavorite = (fileId: string) => {
    // In a real app, this would update the backend
    console.log('Toggle favorite for file:', fileId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
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
            <h1 className="text-3xl font-bold text-gray-900">Recent Files</h1>
            <p className="text-gray-600 mt-1">Access your recently opened files and projects</p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                />
              </div>
              
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="project">Projects</option>
                <option value="drawing">Drawings</option>
                <option value="calculation">Calculations</option>
                <option value="report">Reports</option>
                <option value="template">Templates</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="lastAccessed">Last Accessed</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Files List/Grid */}
        <div className="bg-white rounded-lg shadow-sm border">
          {filteredFiles.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recent files found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedType !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Start working on projects to see them here'
                }
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <div className="divide-y divide-gray-200">
              {filteredFiles.map((file) => (
                <div key={file.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getFileIcon(file.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {file.name}
                        </h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(file.type)}`}>
                          {file.type}
                        </span>
                        {file.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        {file.isShared && <User className="w-4 h-4 text-blue-500" />}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Accessed {file.lastAccessed}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Modified {file.lastModified}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{file.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <HardDrive className="w-3 h-3" />
                          <span>{file.size}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFileOpen(file)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Open file"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleFavorite(file.id)}
                        className="p-2 text-gray-400 hover:text-yellow-500 transition-colors"
                        title="Toggle favorite"
                      >
                        <Star className={`w-4 h-4 ${file.isFavorite ? 'text-yellow-500 fill-current' : ''}`} />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleFileOpen(file)}
                >
                  <div className="flex items-center justify-between mb-3">
                    {getFileIcon(file.type)}
                    <div className="flex items-center gap-1">
                      {file.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                      {file.isShared && <User className="w-4 h-4 text-blue-500" />}
                    </div>
                  </div>
                  
                  <h3 className="font-medium text-gray-900 mb-1 truncate" title={file.name}>
                    {file.name}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(file.type)}`}>
                      {file.type}
                    </span>
                    <span className="text-xs text-gray-500">{file.size}</span>
                  </div>
                  
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Accessed {file.lastAccessed}</div>
                    <div>By {file.author}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{filteredFiles.length}</div>
                <div className="text-sm text-gray-600">Recent Files</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredFiles.filter(f => f.isFavorite).length}
                </div>
                <div className="text-sm text-gray-600">Favorites</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {filteredFiles.filter(f => f.isShared).length}
                </div>
                <div className="text-sm text-gray-600">Shared</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

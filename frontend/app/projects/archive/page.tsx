"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Archive,
  ArrowLeft,
  Search,
  Calendar,
  User,
  MoreVertical,
  RotateCcw,
  Trash2,
  Download,
  Eye,
  Filter
} from 'lucide-react';

interface ArchivedProject {
  id: string;
  name: string;
  description: string;
  archivedDate: string;
  originalCreatedDate: string;
  lastModifiedDate: string;
  author: string;
  size: string;
  category: 'commercial' | 'residential' | 'industrial';
  status: 'archived' | 'deleted';
}

const ARCHIVED_PROJECTS: ArchivedProject[] = [
  {
    id: 'arch-001',
    name: 'Old Office Building HVAC',
    description: 'Legacy HVAC system design for downtown office complex - archived after project completion',
    archivedDate: '2024-01-10',
    originalCreatedDate: '2023-08-15',
    lastModifiedDate: '2023-12-20',
    author: 'John Smith',
    size: '2.4 MB',
    category: 'commercial',
    status: 'archived'
  },
  {
    id: 'arch-002',
    name: 'Residential Complex Phase 1',
    description: 'First phase of residential HVAC design - archived after phase completion',
    archivedDate: '2024-01-05',
    originalCreatedDate: '2023-06-10',
    lastModifiedDate: '2023-11-30',
    author: 'Sarah Johnson',
    size: '1.8 MB',
    category: 'residential',
    status: 'archived'
  },
  {
    id: 'arch-003',
    name: 'Manufacturing Plant Ventilation',
    description: 'Industrial ventilation system - archived due to project cancellation',
    archivedDate: '2023-12-28',
    originalCreatedDate: '2023-05-20',
    lastModifiedDate: '2023-10-15',
    author: 'Mike Wilson',
    size: '3.1 MB',
    category: 'industrial',
    status: 'archived'
  },
  {
    id: 'arch-004',
    name: 'Shopping Mall HVAC System',
    description: 'Large-scale commercial HVAC design - archived after successful implementation',
    archivedDate: '2023-12-15',
    originalCreatedDate: '2023-03-01',
    lastModifiedDate: '2023-09-25',
    author: 'Emily Davis',
    size: '4.2 MB',
    category: 'commercial',
    status: 'archived'
  },
  {
    id: 'arch-005',
    name: 'Hospital Wing Extension',
    description: 'Critical environment HVAC design - archived after project delivery',
    archivedDate: '2023-11-30',
    originalCreatedDate: '2023-01-15',
    lastModifiedDate: '2023-08-10',
    author: 'Dr. Robert Chen',
    size: '5.7 MB',
    category: 'commercial',
    status: 'archived'
  }
];

export default function ProjectArchivePage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const filteredProjects = ARCHIVED_PROJECTS.filter(project => {
    const matchesSearch = searchTerm === '' || 
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || project.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleRestoreProject = (projectId: string) => {
    console.log('Restoring project:', projectId);
    // TODO: Implement project restoration logic
  };

  const handleDeletePermanently = (projectId: string) => {
    console.log('Permanently deleting project:', projectId);
    // TODO: Implement permanent deletion logic
  };

  const handleDownloadProject = (projectId: string) => {
    console.log('Downloading project:', projectId);
    // TODO: Implement project download logic
  };

  const handleViewProject = (projectId: string) => {
    console.log('Viewing project:', projectId);
    // TODO: Implement project preview logic
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'commercial': return 'bg-blue-100 text-blue-800';
      case 'residential': return 'bg-purple-100 text-purple-800';
      case 'industrial': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'archived': return 'bg-yellow-100 text-yellow-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
            <h1 className="text-3xl font-bold text-gray-900">Project Archive</h1>
            <p className="text-gray-600 mt-1">Manage archived and deleted projects</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="commercial">Commercial</option>
                <option value="residential">Residential</option>
                <option value="industrial">Industrial</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Status:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="archived">Archived</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>

            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search archived projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-lg shadow-sm border">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No archived projects found</h3>
              <p className="text-gray-600">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredProjects.map((project) => (
                <div key={project.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${getCategoryColor(project.category)}`}>
                          {project.category}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{project.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{project.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Archived {new Date(project.archivedDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Archive className="w-4 h-4" />
                          <span>{project.size}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400 mt-2">
                        Created: {new Date(project.originalCreatedDate).toLocaleDateString()} • 
                        Last Modified: {new Date(project.lastModifiedDate).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewProject(project.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        title="View Project"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadProject(project.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                        title="Download Project"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRestoreProject(project.id)}
                        className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
                        title="Restore Project"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePermanently(project.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Archive className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {ARCHIVED_PROJECTS.filter(p => p.status === 'archived').length}
                </div>
                <div className="text-sm text-gray-600">Archived Projects</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {ARCHIVED_PROJECTS.filter(p => p.status === 'deleted').length}
                </div>
                <div className="text-sm text-gray-600">Deleted Projects</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Download className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {ARCHIVED_PROJECTS.reduce((total, project) => {
                    const size = parseFloat(project.size.replace(' MB', ''));
                    return total + size;
                  }, 0).toFixed(1)} MB
                </div>
                <div className="text-sm text-gray-600">Total Archive Size</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

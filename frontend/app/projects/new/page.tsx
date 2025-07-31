"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  FileText,
  Settings,
  ArrowLeft,
  Plus,
  Upload
} from 'lucide-react';

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'commercial' | 'residential' | 'industrial';
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'office-building',
    name: 'Office Building HVAC',
    description: 'Complete HVAC system for multi-story office buildings',
    icon: <Building2 className="w-8 h-8" />,
    category: 'commercial'
  },
  {
    id: 'warehouse',
    name: 'Warehouse Ventilation',
    description: 'Industrial ventilation system for warehouse facilities',
    icon: <Building2 className="w-8 h-8" />,
    category: 'industrial'
  },
  {
    id: 'residential',
    name: 'Residential HVAC',
    description: 'Home heating and cooling system design',
    icon: <Building2 className="w-8 h-8" />,
    category: 'residential'
  },
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch with an empty project',
    icon: <FileText className="w-8 h-8" />,
    category: 'commercial'
  }
];

export default function NewProjectPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!projectName.trim() || !selectedTemplate) return;

    setIsCreating(true);
    try {
      // Simulate project creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Redirect to the air duct sizer with the new project
      router.push('/air-duct-sizer');
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleImportProject = () => {
    // TODO: Implement project import functionality
    console.log('Import project functionality not yet implemented');
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
            <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
            <p className="text-gray-600 mt-1">Choose a template or start from scratch</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Template Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Project Templates</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROJECT_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600">{template.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded mt-2 capitalize">
                          {template.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Import Option */}
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={handleImportProject}
                  className="flex items-center gap-3 w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
                >
                  <Upload className="w-6 h-6 text-gray-400" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Import Existing Project</div>
                    <div className="text-sm text-gray-600">Upload a project file or import from another system</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-4">Project Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    id="projectName"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter project name"
                  />
                </div>

                <div>
                  <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="projectDescription"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Optional project description"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleCreateProject}
                    disabled={!projectName.trim() || !selectedTemplate || isCreating}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCreating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Create Project
                      </>
                    )}
                  </button>
                </div>

                {selectedTemplate && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <div className="text-sm text-blue-800">
                      <strong>Selected Template:</strong> {PROJECT_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

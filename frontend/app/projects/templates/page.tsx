"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  FileText, 
  ArrowLeft,
  Plus,
  Download,
  Star,
  Users,
  Calendar,
  Filter
} from 'lucide-react';

interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'commercial' | 'residential' | 'industrial';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  downloads: number;
  rating: number;
  author: string;
  lastUpdated: string;
  tags: string[];
}

const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'office-building',
    name: 'Office Building HVAC',
    description: 'Complete HVAC system for multi-story office buildings with VAV systems, central air handling units, and zone control.',
    icon: <Building2 className="w-8 h-8" />,
    category: 'commercial',
    complexity: 'intermediate',
    estimatedTime: '4-6 hours',
    downloads: 1247,
    rating: 4.8,
    author: 'HVAC Systems Inc.',
    lastUpdated: '2024-01-15',
    tags: ['VAV', 'Central AHU', 'Zone Control', 'Energy Efficient']
  },
  {
    id: 'warehouse',
    name: 'Warehouse Ventilation',
    description: 'Industrial ventilation system for warehouse facilities with high-volume exhaust and make-up air systems.',
    icon: <Building2 className="w-8 h-8" />,
    category: 'industrial',
    complexity: 'advanced',
    estimatedTime: '6-8 hours',
    downloads: 892,
    rating: 4.6,
    author: 'Industrial HVAC Solutions',
    lastUpdated: '2024-01-10',
    tags: ['Exhaust Systems', 'Make-up Air', 'High Volume', 'Industrial']
  },
  {
    id: 'residential',
    name: 'Residential HVAC',
    description: 'Home heating and cooling system design with ductwork optimization and energy efficiency calculations.',
    icon: <Building2 className="w-8 h-8" />,
    category: 'residential',
    complexity: 'beginner',
    estimatedTime: '2-3 hours',
    downloads: 2156,
    rating: 4.9,
    author: 'Home Comfort Systems',
    lastUpdated: '2024-01-20',
    tags: ['Residential', 'Energy Efficient', 'Ductwork', 'Comfort']
  },
  {
    id: 'hospital',
    name: 'Hospital HVAC System',
    description: 'Critical environment HVAC design for healthcare facilities with specialized air handling and filtration.',
    icon: <Building2 className="w-8 h-8" />,
    category: 'commercial',
    complexity: 'advanced',
    estimatedTime: '8-12 hours',
    downloads: 543,
    rating: 4.7,
    author: 'Healthcare HVAC Specialists',
    lastUpdated: '2024-01-08',
    tags: ['Healthcare', 'Critical Environment', 'HEPA Filtration', 'Pressure Control']
  },
  {
    id: 'retail',
    name: 'Retail Store HVAC',
    description: 'Retail space climate control with customer comfort optimization and energy cost management.',
    icon: <Building2 className="w-8 h-8" />,
    category: 'commercial',
    complexity: 'intermediate',
    estimatedTime: '3-4 hours',
    downloads: 1089,
    rating: 4.5,
    author: 'Retail Solutions HVAC',
    lastUpdated: '2024-01-12',
    tags: ['Retail', 'Customer Comfort', 'Energy Management', 'Cost Effective']
  },
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start from scratch with an empty project template with basic structure and configuration.',
    icon: <FileText className="w-8 h-8" />,
    category: 'commercial',
    complexity: 'beginner',
    estimatedTime: '1 hour',
    downloads: 3421,
    rating: 4.3,
    author: 'SizeWise Team',
    lastUpdated: '2024-01-25',
    tags: ['Blank', 'Custom', 'Flexible', 'Basic']
  }
];

export default function ProjectTemplatesPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTemplates = PROJECT_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesComplexity = selectedComplexity === 'all' || template.complexity === selectedComplexity;
    const matchesSearch = searchTerm === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesComplexity && matchesSearch;
  });

  const handleUseTemplate = (templateId: string) => {
    // Navigate to new project page with template pre-selected
    router.push(`/projects/new?template=${templateId}`);
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'commercial': return 'bg-blue-100 text-blue-800';
      case 'residential': return 'bg-purple-100 text-purple-800';
      case 'industrial': return 'bg-orange-100 text-orange-800';
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
            <h1 className="text-3xl font-bold text-gray-900">Project Templates</h1>
            <p className="text-gray-600 mt-1">Choose from professionally designed HVAC project templates</p>
          </div>
        </div>

        {/* Filters */}
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
              <label className="text-sm text-gray-600">Complexity:</label>
              <select
                value={selectedComplexity}
                onChange={(e) => setSelectedComplexity(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-blue-600">{template.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${getComplexityColor(template.complexity)}`}>
                        {template.complexity}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span>{template.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        <span>{template.downloads.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{template.estimatedTime}</span>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 mb-4">
                      <div>By {template.author}</div>
                      <div>Updated {new Date(template.lastUpdated).toLocaleDateString()}</div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleUseTemplate(template.id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Use This Template
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FileText className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
}

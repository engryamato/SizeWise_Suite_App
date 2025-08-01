'use client';

import React, { useState } from 'react';
import { useEnhancedProjectService } from '@/lib/hooks/useEnhancedProjectService';
import { EnhancedProject, EnhancedDuctSegment, EnhancedFittingSegment } from '@/lib/services/EnhancedProjectService';
import { FittingType } from '@/lib/3d-fittings/fitting-interfaces';
import { DuctNode } from '@/lib/3d-fittings/duct-node';
import { getSuperAdminCredentials } from '@/lib/auth/SuperAdminConfig';

export default function TestProjectSavingPage() {
  const projectService = useEnhancedProjectService('test-user-123');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [showCredentials, setShowCredentials] = useState(false);

  // Get super admin credentials
  const adminCredentials = getSuperAdminCredentials();

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const createSampleProject = async () => {
    try {
      addTestResult('Creating sample project...');
      
      // Create sample duct segments
      const sampleDuctSegments: EnhancedDuctSegment[] = [
        {
          segment_id: 'duct-001',
          type: 'straight',
          material: 'galvanized_steel',
          size: { diameter: 12 },
          length: 10,
          airflow: 1000,
          velocity: 1200,
          pressure_loss: 0.08,
          warnings: [],
          points: [0, 0, 100, 0],
          ductNode: new DuctNode({
            id: 'duct-node-001',
            shapeType: 'round',
            dimensions: { diameter: 12 },
            material: { type: 'galvanized_steel', gauge: '26' }
          }),
          material3D: {
            type: 'galvanized_steel',
            gauge: '26',
            finish: 'standard'
          },
          geometry3D: {
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          },
          connections: {}
        },
        {
          segment_id: 'duct-002',
          type: 'straight',
          material: 'galvanized_steel',
          size: { width: 12, height: 8 },
          length: 15,
          airflow: 800,
          velocity: 1000,
          pressure_loss: 0.06,
          warnings: [],
          points: [100, 0, 200, 0],
          ductNode: new DuctNode({
            id: 'duct-node-002',
            shapeType: 'rectangular',
            dimensions: { width: 12, height: 8 },
            material: { type: 'galvanized_steel', gauge: '24' }
          }),
          material3D: {
            type: 'galvanized_steel',
            gauge: '24',
            finish: 'standard'
          },
          geometry3D: {
            position: { x: 100, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 }
          },
          connections: {}
        }
      ];

      // Create sample fitting segments
      const sampleFittingSegments: EnhancedFittingSegment[] = [
        {
          segment_id: 'fitting-001',
          type: FittingType.ELBOW,
          name: 'Round Elbow 90°',
          ductShape: 'round',
          dimensions: { diameter: 12 },
          material: {
            type: 'galvanized_steel',
            gauge: '26',
            finish: 'standard'
          },
          fittingParameters: {
            angle: 90,
            bendRadius: 18,
            radialSegments: 32,
            tubularSegments: 64
          },
          geometry3D: {
            position: { x: 50, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 90 },
            scale: { x: 1, y: 1, z: 1 }
          },
          connections: {
            inlet: 'duct-001',
            outlet: 'duct-002'
          },
          calculationData: {
            pressureLoss: 0.12,
            velocity: 1200,
            kFactor: 0.25
          },
          validationResults: {
            warnings: [],
            recommendations: ['Consider using a larger radius for lower pressure loss'],
            complianceStatus: 'compliant'
          }
        }
      ];

      // Create the project
      const projectId = await projectService.createNewProject({
        project_name: 'Sample HVAC Project',
        project_location: 'Test Building, Test City',
        codes: ['SMACNA', 'ASHRAE'],
        ductSegments: sampleDuctSegments,
        fittingSegments: sampleFittingSegments,
        projectSettings: {
          units: 'imperial',
          defaultMaterial: 'galvanized_steel',
          defaultGauge: '26',
          autoValidation: true,
          autoOptimization: false
        }
      });

      addTestResult(`✅ Sample project created with ID: ${projectId}`);
      addTestResult(`✅ Project includes ${sampleDuctSegments.length} duct segments`);
      addTestResult(`✅ Project includes ${sampleFittingSegments.length} fitting segments`);
      
    } catch (error) {
      addTestResult(`❌ Failed to create sample project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const testProjectSaving = async () => {
    try {
      addTestResult('Testing project saving functionality...');
      
      if (!projectService.currentProject) {
        addTestResult('❌ No current project loaded. Create a sample project first.');
        return;
      }

      // Add a new duct segment
      const newDuctSegment: EnhancedDuctSegment = {
        segment_id: `duct-${Date.now()}`,
        type: 'straight',
        material: 'aluminum',
        size: { diameter: 10 },
        length: 8,
        airflow: 600,
        velocity: 1100,
        pressure_loss: 0.05,
        warnings: [],
        points: [200, 0, 300, 0],
        ductNode: new DuctNode({
          id: `duct-node-${Date.now()}`,
          shapeType: 'round',
          dimensions: { diameter: 10 },
          material: { type: 'aluminum', gauge: '28' }
        }),
        material3D: {
          type: 'aluminum',
          gauge: '28',
          finish: 'standard'
        },
        geometry3D: {
          position: { x: 200, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        connections: {}
      };

      await projectService.addDuctSegment(newDuctSegment);
      addTestResult('✅ Added new duct segment to project');

      // Add a new fitting segment
      const newFittingSegment: EnhancedFittingSegment = {
        segment_id: `fitting-${Date.now()}`,
        type: FittingType.TRANSITION,
        name: 'Round to Rectangular Transition',
        ductShape: 'round',
        dimensions: { diameter: 10 },
        material: {
          type: 'aluminum',
          gauge: '28',
          finish: 'standard'
        },
        fittingParameters: {
          inletDiameter: 10,
          outletWidth: 8,
          outletHeight: 6,
          length: 12
        },
        geometry3D: {
          position: { x: 250, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 }
        },
        connections: {},
        calculationData: {
          pressureLoss: 0.08,
          velocity: 1100,
          kFactor: 0.15
        },
        validationResults: {
          warnings: [],
          recommendations: [],
          complianceStatus: 'compliant'
        }
      };

      await projectService.addFittingSegment(newFittingSegment);
      addTestResult('✅ Added new fitting segment to project');
      addTestResult('✅ Project saved successfully with all segments');
      
    } catch (error) {
      addTestResult(`❌ Failed to test project saving: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const loadProjectList = async () => {
    try {
      addTestResult('Loading project list...');
      await projectService.loadProjectList();
      addTestResult(`✅ Loaded ${projectService.projectCount} projects from database`);
    } catch (error) {
      addTestResult(`❌ Failed to load project list: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Enhanced Project Saving Test</h1>
      
      {/* Super Admin Credentials Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-blue-800">Super Admin Credentials</h2>
          <button
            onClick={() => setShowCredentials(!showCredentials)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {showCredentials ? 'Hide' : 'Show'} Credentials
          </button>
        </div>
        
        {showCredentials && (
          <div className="mt-4 bg-white p-4 rounded border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username:</label>
                <code className="block bg-gray-100 p-2 rounded text-sm">{adminCredentials.username}</code>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email:</label>
                <code className="block bg-gray-100 p-2 rounded text-sm">{adminCredentials.email}</code>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Password:</label>
                <code className="block bg-gray-100 p-2 rounded text-sm font-mono">{adminCredentials.password}</code>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Login URL:</label>
                <code className="block bg-gray-100 p-2 rounded text-sm">{adminCredentials.loginUrl}</code>
              </div>
            </div>
            <p className="mt-3 text-sm text-blue-600">{adminCredentials.note}</p>
          </div>
        )}
      </div>

      {/* Project Status */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3">Project Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded border">
            <div className="text-2xl font-bold text-blue-600">{projectService.projectCount}</div>
            <div className="text-sm text-gray-600">Total Projects</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-2xl font-bold text-green-600">{projectService.ductSegmentCount}</div>
            <div className="text-sm text-gray-600">Duct Segments</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-2xl font-bold text-purple-600">{projectService.fittingSegmentCount}</div>
            <div className="text-sm text-gray-600">Fitting Segments</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="text-2xl font-bold text-orange-600">
              {projectService.isLoading ? '...' : projectService.isSaving ? 'Saving' : 'Ready'}
            </div>
            <div className="text-sm text-gray-600">Status</div>
          </div>
        </div>
        
        {projectService.currentProject && (
          <div className="mt-4 p-3 bg-white rounded border">
            <h3 className="font-semibold">Current Project:</h3>
            <p className="text-sm text-gray-600">{projectService.currentProject.project_name}</p>
            <p className="text-xs text-gray-500">ID: {projectService.currentProject.id}</p>
          </div>
        )}
      </div>

      {/* Test Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3">Test Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={createSampleProject}
            disabled={projectService.isSaving}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            Create Sample Project
          </button>
          <button
            onClick={testProjectSaving}
            disabled={projectService.isSaving || !projectService.currentProject}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Test Adding Segments
          </button>
          <button
            onClick={loadProjectList}
            disabled={projectService.isLoading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Reload Project List
          </button>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Test Results</h2>
          <button
            onClick={() => setTestResults([])}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
        <div className="bg-gray-50 p-3 rounded max-h-96 overflow-y-auto">
          {testResults.length === 0 ? (
            <p className="text-gray-500 text-sm">No test results yet. Run some tests to see results here.</p>
          ) : (
            <div className="space-y-1">
              {testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {projectService.error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-red-800">Error</h3>
            <button
              onClick={projectService.clearError}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Clear
            </button>
          </div>
          <p className="mt-2 text-red-700">{projectService.error}</p>
        </div>
      )}
    </div>
  );
}

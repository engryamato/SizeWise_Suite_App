"use client"

import React, { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Upload, Download, CheckCircle, AlertCircle, Loader2, FolderOpen, Cloud, ArrowRight } from 'lucide-react'

interface LocalProject {
  id: string
  name: string
  created_at: string
  segments_count: number
  size_mb: number
}

interface MigrationWizardProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

export const MigrationWizard: React.FC<MigrationWizardProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const { user, isAuthenticated } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [localProjects, setLocalProjects] = useState<LocalProject[]>([])
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const [isScanning, setIsScanning] = useState(false)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationProgress, setMigrationProgress] = useState(0)
  const [migrationResults, setMigrationResults] = useState<{
    success: string[]
    failed: string[]
  }>({ success: [], failed: [] })

  useEffect(() => {
    if (isOpen && currentStep === 1) {
      scanLocalProjects()
    }
  }, [isOpen, currentStep])

  const scanLocalProjects = async () => {
    setIsScanning(true)
    try {
      // Simulate scanning local storage for projects
      // In real implementation, this would scan IndexedDB or local storage
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const mockProjects: LocalProject[] = [
        {
          id: 'local-1',
          name: 'Office Building HVAC',
          created_at: '2024-01-15T10:30:00Z',
          segments_count: 45,
          size_mb: 2.3
        },
        {
          id: 'local-2',
          name: 'Warehouse Ventilation',
          created_at: '2024-02-20T14:15:00Z',
          segments_count: 28,
          size_mb: 1.8
        },
        {
          id: 'local-3',
          name: 'Residential Complex',
          created_at: '2024-03-10T09:45:00Z',
          segments_count: 67,
          size_mb: 4.1
        }
      ]
      
      setLocalProjects(mockProjects)
      // Auto-select all projects by default
      setSelectedProjects(new Set(mockProjects.map(p => p.id)))
    } catch (error) {
      console.error('Failed to scan local projects:', error)
    } finally {
      setIsScanning(false)
    }
  }

  const handleProjectToggle = (projectId: string) => {
    const newSelected = new Set(selectedProjects)
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId)
    } else {
      newSelected.add(projectId)
    }
    setSelectedProjects(newSelected)
  }

  const handleMigration = async () => {
    if (!isAuthenticated || selectedProjects.size === 0) return

    setIsMigrating(true)
    setMigrationProgress(0)
    
    const projectsToMigrate = localProjects.filter(p => selectedProjects.has(p.id))
    const results = { success: [], failed: [] }
    
    for (let i = 0; i < projectsToMigrate.length; i++) {
      const project = projectsToMigrate[i]
      
      try {
        // Simulate project migration
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Simulate 90% success rate
        if (Math.random() > 0.1) {
          results.success.push(project.name)
        } else {
          results.failed.push(project.name)
        }
        
        setMigrationProgress(((i + 1) / projectsToMigrate.length) * 100)
      } catch (error) {
        results.failed.push(project.name)
      }
    }
    
    setMigrationResults(results)
    setIsMigrating(false)
    setCurrentStep(4)
  }

  const handleComplete = () => {
    onComplete()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Project Migration Wizard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Sync your local projects with your SizeWise account
          </p>
          
          {/* Progress Steps */}
          <div className="flex items-center space-x-4 mt-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step < currentStep ? 'bg-green-600 text-white' :
                  step === currentStep ? 'bg-blue-600 text-white' :
                  'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
                </div>
                {step < 4 && (
                  <div className={`w-12 h-0.5 ${
                    step < currentStep ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Step 1: Scan Local Projects */}
          {currentStep === 1 && (
            <div className="text-center">
              <FolderOpen className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Scanning Local Projects</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We're looking for projects stored locally on your device...
              </p>
              
              {isScanning ? (
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Scanning...</span>
                </div>
              ) : (
                <div>
                  <p className="text-green-600 dark:text-green-400 mb-4">
                    Found {localProjects.length} local projects
                  </p>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Projects */}
          {currentStep === 2 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <FolderOpen className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold">Select Projects to Sync</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose which projects you'd like to sync with your SizeWise account:
              </p>
              
              <div className="space-y-3 mb-6">
                {localProjects.map((project) => (
                  <div
                    key={project.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedProjects.has(project.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    onClick={() => handleProjectToggle(project.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedProjects.has(project.id)}
                          onChange={() => handleProjectToggle(project.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {project.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {project.segments_count} segments • {project.size_mb} MB • {new Date(project.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={selectedProjects.size === 0}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  Continue ({selectedProjects.size} selected)
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm Migration */}
          {currentStep === 3 && (
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Cloud className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold">Confirm Migration</h3>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 mb-6">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Ready to sync {selectedProjects.size} projects
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Your projects will be uploaded to your SizeWise account and remain accessible offline.
                  This process may take a few minutes depending on project size.
                </p>
              </div>
              
              <div className="space-y-2 mb-6">
                {localProjects
                  .filter(p => selectedProjects.has(p.id))
                  .map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="font-medium">{project.name}</span>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>{project.segments_count} segments</span>
                        <ArrowRight className="w-4 h-4" />
                        <Cloud className="w-4 h-4" />
                      </div>
                    </div>
                  ))}
              </div>
              
              {isMigrating ? (
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <Upload className="w-5 h-5 animate-pulse" />
                    <span>Migrating projects...</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${migrationProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {Math.round(migrationProgress)}% complete
                  </p>
                </div>
              ) : (
                <div className="flex justify-between">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleMigration}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Start Migration
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Results */}
          {currentStep === 4 && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Migration Complete!</h3>
              
              <div className="text-left max-w-md mx-auto mb-6">
                {migrationResults.success.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-green-600 mb-2">
                      Successfully migrated ({migrationResults.success.length}):
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {migrationResults.success.map((name, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>{name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {migrationResults.failed.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">
                      Failed to migrate ({migrationResults.failed.length}):
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {migrationResults.failed.map((name, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span>{name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleComplete}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Finish
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

'use client'

import React, { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { 
  Settings, 
  BarChart3, 
  Save, 
  Download, 
  Upload,
  RefreshCw,
  Info
} from 'lucide-react'

// Dynamic imports for toolbar components
const ProjectPropertiesManager = lazy(() =>
  import('@/components/managers/ProjectPropertiesManager').then(module => ({
    default: module.ProjectPropertiesManager
  }))
);

// Import types
import type { DrawingMode } from '@/components/ui/DrawingToolFAB'

export interface SystemSummary {
  totalAirflow: number;
  totalPressureDrop: number;
  systemEfficiency: number;
  complianceStatus: 'compliant' | 'non-compliant' | 'pending';
}

export interface AirDuctSizerToolbarProps {
  drawingMode: DrawingMode;
  onDrawingModeChange: (mode: DrawingMode) => void;
  onToggleModelSummary: () => void;
  systemSummary: SystemSummary;
  className?: string;
}

export const AirDuctSizerToolbar: React.FC<AirDuctSizerToolbarProps> = ({
  drawingMode,
  onDrawingModeChange,
  onToggleModelSummary,
  systemSummary,
  className = ""
}) => {
  const handleSaveProject = () => {
    // Implement save functionality
    console.log('Saving project...');
  };

  const handleExportProject = () => {
    // Implement export functionality
    console.log('Exporting project...');
  };

  const handleImportProject = () => {
    // Implement import functionality
    console.log('Importing project...');
  };

  const handleRefreshCalculations = () => {
    // Implement calculation refresh
    console.log('Refreshing calculations...');
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600 dark:text-green-400';
      case 'non-compliant':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getComplianceStatusText = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'SMACNA Compliant';
      case 'non-compliant':
        return 'Non-Compliant';
      default:
        return 'Checking...';
    }
  };

  return (
    <div className={`fixed top-0 left-0 w-full h-20 bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-700 z-50 ${className}`}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section - Project Properties */}
        <div className="flex items-center space-x-4">
          <Suspense fallback={
            <div className="w-48 h-8 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse" />
          }>
            <ProjectPropertiesManager />
          </Suspense>
        </div>

        {/* Center Section - System Status */}
        <div className="flex items-center space-x-6">
          {/* Airflow Display */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {systemSummary.totalAirflow.toLocaleString()} CFM
            </span>
          </div>

          {/* Pressure Drop Display */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {systemSummary.totalPressureDrop.toFixed(2)}&quot; WC
            </span>
          </div>

          {/* Efficiency Display */}
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {systemSummary.systemEfficiency.toFixed(1)}% Eff
            </span>
          </div>

          {/* Compliance Status */}
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-neutral-500" />
            <span className={`text-sm font-medium ${getComplianceStatusColor(systemSummary.complianceStatus)}`}>
              {getComplianceStatusText(systemSummary.complianceStatus)}
            </span>
          </div>
        </div>

        {/* Right Section - Action Buttons */}
        <div className="flex items-center space-x-2">
          {/* Refresh Calculations */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefreshCalculations}
            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
            title="Refresh Calculations"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>

          {/* Model Summary Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onToggleModelSummary}
            className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-600 dark:text-purple-400 rounded-lg transition-colors"
            title="Toggle Model Summary"
          >
            <BarChart3 className="w-4 h-4" />
          </motion.button>

          {/* Save Project */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSaveProject}
            className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-600 dark:text-green-400 rounded-lg transition-colors"
            title="Save Project"
          >
            <Save className="w-4 h-4" />
          </motion.button>

          {/* Export Project */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleExportProject}
            className="p-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-600 dark:text-orange-400 rounded-lg transition-colors"
            title="Export Project"
          >
            <Download className="w-4 h-4" />
          </motion.button>

          {/* Import Project */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleImportProject}
            className="p-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors"
            title="Import Project"
          >
            <Upload className="w-4 h-4" />
          </motion.button>

          {/* Settings */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-neutral-500/20 hover:bg-neutral-500/30 text-neutral-600 dark:text-neutral-400 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

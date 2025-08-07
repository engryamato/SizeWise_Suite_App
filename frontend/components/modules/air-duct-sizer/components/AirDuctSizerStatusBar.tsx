'use client'

import React, { Suspense, lazy } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Cpu
} from 'lucide-react'

// Dynamic imports for status components
const StatusBar = lazy(() =>
  import('@/components/ui/StatusBar').then(module => ({
    default: module.StatusBar
  }))
);

// Import types
import type { ElementProperties } from '@/components/ui/ContextPropertyPanel'
import type { ValidationWarning } from '@/components/ui/WarningPanel'
import type { SystemSummary } from './AirDuctSizerToolbar'

export interface AirDuctSizerStatusBarProps {
  systemSummary: SystemSummary;
  calculationResults: any;
  warnings: ValidationWarning[];
  selectedElement: ElementProperties | null;
  className?: string;
}

export const AirDuctSizerStatusBar: React.FC<AirDuctSizerStatusBarProps> = ({
  systemSummary,
  calculationResults,
  warnings,
  selectedElement,
  className = ""
}) => {
  // Helper function to determine overall compliance status from unified SystemSummary
  const getComplianceStatus = (): 'compliant' | 'non-compliant' | 'pending' => {
    if (!systemSummary.compliance) return 'pending';
    const { smacna, ashrae, local } = systemSummary.compliance;
    if (smacna && ashrae && local) return 'compliant';
    if (!smacna || !ashrae) return 'non-compliant';
    return 'pending';
  };

  const getStatusColor = () => {
    if (warnings.length > 0) return 'text-yellow-600 dark:text-yellow-400';
    const complianceStatus = getComplianceStatus();
    if (complianceStatus === 'compliant') return 'text-green-600 dark:text-green-400';
    if (complianceStatus === 'non-compliant') return 'text-red-600 dark:text-red-400';
    return 'text-blue-600 dark:text-blue-400';
  };

  const getStatusIcon = () => {
    if (warnings.length > 0) return <AlertTriangle className="w-4 h-4" />;
    const complianceStatus = getComplianceStatus();
    if (complianceStatus === 'compliant') return <CheckCircle className="w-4 h-4" />;
    if (complianceStatus === 'non-compliant') return <AlertTriangle className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (warnings.length > 0) return `${warnings.length} Warning${warnings.length > 1 ? 's' : ''}`;
    const complianceStatus = getComplianceStatus();
    if (complianceStatus === 'compliant') return 'System Compliant';
    if (complianceStatus === 'non-compliant') return 'Compliance Issues';
    return 'Calculating...';
  };

  return (
    <div className={`fixed bottom-0 left-0 w-full h-12 bg-white/10 dark:bg-neutral-900/10 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-700 z-40 ${className}`}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section - System Status */}
        <div className="flex items-center space-x-6">
          {/* Overall Status */}
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{
                scale: warnings.length > 0 ? [1, 1.1, 1] : 1,
                rotate: getComplianceStatus() === 'pending' ? [0, 360] : 0
              }}
              transition={{
                duration: warnings.length > 0 ? 1 : 2,
                repeat: warnings.length > 0 || getComplianceStatus() === 'pending' ? Infinity : 0
              }}
              className={getStatusColor()}
            >
              {getStatusIcon()}
            </motion.div>
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>

          {/* Calculation Status */}
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Real-time Calculations Active
            </span>
          </div>

          {/* Performance Indicator */}
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-green-500" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {systemSummary.systemEfficiency.toFixed(1)}% System Efficiency
            </span>
          </div>
        </div>

        {/* Center Section - Selected Element Info */}
        {selectedElement && (
          <div className="flex items-center space-x-4">
            <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600" />
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Selected: {selectedElement.type} ({selectedElement.id})
              </span>
            </div>
          </div>
        )}

        {/* Right Section - System Metrics */}
        <div className="flex items-center space-x-6">
          {/* Total Elements Count */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Elements: {Object.keys(calculationResults.segments || {}).length + Object.keys(calculationResults.equipment || {}).length}
            </span>
          </div>

          {/* Last Update Time */}
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Updated: {new Date().toLocaleTimeString()}
            </span>
          </div>

          {/* SMACNA Compliance Badge */}
          <div className="flex items-center space-x-2">
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              getComplianceStatus() === 'compliant'
                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                : getComplianceStatus() === 'non-compliant'
                ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
            }`}>
              SMACNA {getComplianceStatus() === 'compliant' ? '✓' : getComplianceStatus() === 'non-compliant' ? '✗' : '...'}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Status Bar Component */}
      <Suspense fallback={null}>
        <StatusBar
          isOnline={true}
          isConnectedToServer={true}
          saveStatus="saved"
          gridEnabled={true}
          snapEnabled={true}
          zoomLevel={100}
          onGridToggle={() => {}}
          onSnapToggle={() => {}}
          onZoomIn={() => {}}
          onZoomOut={() => {}}
          onZoomReset={() => {}}
          currentUnits="imperial"
          onUnitsChange={(units) => {
            console.log('Units changed to:', units);
          }}
          className="hidden" // Hide the original status bar since we're using our custom one
        />
      </Suspense>
    </div>
  );
};

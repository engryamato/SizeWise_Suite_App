/**
 * Snap Logic Status Bar Component
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Enhanced status bar that integrates Build Ductwork functionality, validation warnings,
 * and progress indicators with the existing SizeWise Suite Results/Warnings Bar.
 * Replaces floating Build Ductwork button with integrated UI bar placement.
 * 
 * @fileoverview Enhanced status bar for snap logic system integration
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 * 
 * @example Basic Usage
 * ```typescript
 * const snapLogic = useSnapLogic();
 * 
 * return (
 *   <SnapLogicStatusBar
 *     snapLogic={snapLogic}
 *     systemSummary={systemSummary}
 *     warnings={warnings}
 *     onBuildDuctwork={handleBuildDuctwork}
 *   />
 * );
 * ```
 */

"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Zap, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Cpu,
  Settings,
  Play,
  Pause,
  Square,
  RotateCw,
  Download,
  Eye,
  EyeOff,
  Bug,
  Layers,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UseSnapLogicReturn } from '@/lib/hooks/useSnapLogic';
import { ValidationWarning } from '@/components/ui/WarningPanel';

/**
 * Build Ductwork operation status
 */
export type BuildDuctworkStatus = 'idle' | 'building' | 'success' | 'error';

/**
 * Build Ductwork progress information
 */
export interface BuildDuctworkProgress {
  status: BuildDuctworkStatus;
  progress: number; // 0-100
  currentStep: string;
  totalSteps: number;
  currentStepIndex: number;
  estimatedTimeRemaining?: number; // seconds
}

/**
 * System summary interface (from existing AirDuctSizerStatusBar)
 */
export interface SystemSummary {
  complianceStatus: 'compliant' | 'non-compliant' | 'pending';
  systemEfficiency: number;
  totalElements: number;
  lastCalculation: Date;
}

/**
 * Props for SnapLogicStatusBar component
 */
interface SnapLogicStatusBarProps {
  snapLogic: UseSnapLogicReturn;
  systemSummary?: SystemSummary;
  warnings?: ValidationWarning[];
  selectedElement?: any;
  buildProgress?: BuildDuctworkProgress;
  onBuildDuctwork?: () => Promise<void>;
  onWarningClick?: (warning: ValidationWarning) => void;
  className?: string;
}

/**
 * Enhanced status bar with snap logic integration
 */
export const SnapLogicStatusBar: React.FC<SnapLogicStatusBarProps> = ({
  snapLogic,
  systemSummary,
  warnings = [],
  selectedElement,
  buildProgress,
  onBuildDuctwork,
  onWarningClick,
  className
}) => {
  const [isBuilding, setIsBuilding] = useState(false);
  const [showSnapDetails, setShowSnapDetails] = useState(false);

  // Combine snap logic warnings with system warnings
  const debugData = snapLogic.debugModeEnabled ? snapLogic.getDebugData() : null;
  const snapWarnings = debugData?.drawing?.validationWarnings || [];
  const allWarnings = [...warnings, ...snapWarnings.map((warning, index) => ({
    id: `snap-${index}`,
    type: 'warning' as const,
    category: 'SMACNA' as const,
    title: 'Snap Logic Validation',
    message: warning,
    severity: 'medium' as const,
    timestamp: new Date()
  }))];

  // Handle Build Ductwork operation
  const handleBuildDuctwork = useCallback(async () => {
    if (snapLogic.centerlines.length === 0) {
      // Could integrate with toast system here
      alert('No centerlines to convert. Draw some centerlines first.');
      return;
    }

    setIsBuilding(true);
    
    try {
      if (onBuildDuctwork) {
        await onBuildDuctwork();
      } else {
        // Fallback to direct snap logic build
        const result = snapLogic.buildDuctwork();
        
        if (result.success) {
          // Could integrate with toast system here
          alert(`Ductwork built successfully!\n\nStats:\n- ${result.stats.segmentCount} segments\n- ${result.stats.fittingCount} fittings\n- ${result.stats.totalLength.toFixed(1)} total length`);
        } else {
          alert(`Failed to build ductwork:\n\n${result.errors.join('\n')}`);
        }
      }
    } catch (error) {
      console.error('Build ductwork error:', error);
      alert('An error occurred while building ductwork. Please try again.');
    } finally {
      setIsBuilding(false);
    }
  }, [snapLogic, onBuildDuctwork]);

  // Get status color based on system state
  const getStatusColor = () => {
    if (allWarnings.length > 0) return 'text-yellow-600 dark:text-yellow-400';
    if (systemSummary?.complianceStatus === 'compliant') return 'text-green-600 dark:text-green-400';
    if (systemSummary?.complianceStatus === 'non-compliant') return 'text-red-600 dark:text-red-400';
    if (snapLogic.isActive) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  // Get status icon
  const getStatusIcon = () => {
    if (allWarnings.length > 0) return <AlertTriangle className="w-4 h-4" />;
    if (systemSummary?.complianceStatus === 'compliant') return <CheckCircle className="w-4 h-4" />;
    if (systemSummary?.complianceStatus === 'non-compliant') return <AlertTriangle className="w-4 h-4" />;
    if (snapLogic.isActive) return <Target className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  // Get status text
  const getStatusText = () => {
    if (allWarnings.length > 0) return `${allWarnings.length} Warning${allWarnings.length > 1 ? 's' : ''}`;
    if (systemSummary?.complianceStatus === 'compliant') return 'System Compliant';
    if (systemSummary?.complianceStatus === 'non-compliant') return 'Compliance Issues';
    if (snapLogic.isActive && snapLogic.isDrawing) return 'Drawing Active';
    if (snapLogic.isActive) return 'Snap Logic Active';
    return 'Ready';
  };

  return (
    <div className={cn(
      "fixed bottom-0 left-0 w-full h-16 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md",
      "border-t border-neutral-200 dark:border-neutral-700 z-40",
      className
    )}>
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section - System Status & Snap Logic */}
        <div className="flex items-center space-x-6">
          {/* Overall Status */}
          <div className="flex items-center space-x-2">
            <motion.div
              animate={{ 
                scale: allWarnings.length > 0 ? [1, 1.1, 1] : 1,
                rotate: snapLogic.isDrawing ? [0, 360] : 0
              }}
              transition={{ 
                duration: allWarnings.length > 0 ? 1 : 2,
                repeat: allWarnings.length > 0 || snapLogic.isDrawing ? Infinity : 0
              }}
              className={getStatusColor()}
            >
              {getStatusIcon()}
            </motion.div>
            <span className={cn("text-sm font-medium", getStatusColor())}>
              {getStatusText()}
            </span>
          </div>

          {/* Snap Logic Status */}
          <div className="flex items-center space-x-2">
            <Settings 
              className={cn(
                "w-4 h-4",
                snapLogic.isActive ? "text-blue-500" : "text-gray-400"
              )} 
            />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              Tool: {snapLogic.currentTool}
            </span>
            {snapLogic.touchOverrideActive && (
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                Touch Override
              </span>
            )}
          </div>

          {/* Centerlines Count */}
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-green-500" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {snapLogic.centerlines.length} Centerline{snapLogic.centerlines.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Debug Mode Indicator */}
          {snapLogic.debugModeEnabled && (
            <div className="flex items-center space-x-2">
              <Bug className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-600 dark:text-blue-400">
                Debug Active
              </span>
            </div>
          )}
        </div>

        {/* Center Section - Build Progress */}
        {buildProgress && buildProgress.status !== 'idle' && (
          <div className="flex items-center space-x-4">
            <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600" />
            <div className="flex items-center space-x-3">
              <RotateCw className={cn(
                "w-4 h-4",
                buildProgress.status === 'building' ? "animate-spin text-blue-500" : "text-gray-400"
              )} />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {buildProgress.currentStep}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-32 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${buildProgress.progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {buildProgress.currentStepIndex + 1}/{buildProgress.totalSteps}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Section - Actions & Build Ductwork */}
        <div className="flex items-center space-x-4">
          {/* Snap Details Toggle */}
          <button
            onClick={() => setShowSnapDetails(!showSnapDetails)}
            className={cn(
              "flex items-center space-x-2 px-3 py-1 rounded-lg border transition-colors text-sm",
              showSnapDetails 
                ? "bg-blue-100 text-blue-700 border-blue-200" 
                : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
            )}
            title="Toggle snap point details"
          >
            {showSnapDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>Details</span>
          </button>

          {/* Warnings Count */}
          {allWarnings.length > 0 && (
            <button
              onClick={() => onWarningClick?.(allWarnings[0])}
              className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg border border-yellow-200 hover:bg-yellow-200 transition-colors text-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{allWarnings.length} Warning{allWarnings.length !== 1 ? 's' : ''}</span>
            </button>
          )}

          {/* Build Ductwork Button */}
          <AnimatePresence>
            {snapLogic.centerlines.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={handleBuildDuctwork}
                disabled={isBuilding}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm",
                  isBuilding
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl"
                )}
                whileHover={!isBuilding ? { scale: 1.05 } : {}}
                whileTap={!isBuilding ? { scale: 0.95 } : {}}
              >
                {isBuilding ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Building...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>
                      Build Ductwork ({snapLogic.centerlines.length})
                    </span>
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Last Update Time */}
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span className="text-sm text-neutral-600 dark:text-neutral-400">
              {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Snap Details Overlay */}
      <AnimatePresence>
        {showSnapDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50"
          >
            <div className="px-6 py-3">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">Snap Points:</span>
                  <span className="ml-2 font-medium">{snapLogic.allSnapPoints.length}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Branch Points:</span>
                  <span className="ml-2 font-medium">{snapLogic.branchPoints.length}</span>
                </div>
                <div>
                  <span className="text-neutral-500">Current Snap:</span>
                  <span className="ml-2 font-medium">
                    {snapLogic.snapResult?.snapPoint?.type || 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500">Touch Device:</span>
                  <span className="ml-2 font-medium">
                    {snapLogic.isTouchDevice ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

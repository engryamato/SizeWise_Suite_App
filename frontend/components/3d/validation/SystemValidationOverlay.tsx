/**
 * System Validation Overlay
 * Provides real-time visual feedback for HVAC system validation
 * SizeWise Suite - Real-time Calculation Connectivity Implementation
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Zap, 
  Gauge, 
  Wind,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RealTimeCalculationState } from '@/lib/hooks/useRealTimeCalculations';
import { SystemFlowAnalysis } from '@/lib/system/SystemFlowCalculator';

export interface ValidationDisplayOptions {
  showCalculationStatus: boolean;
  showFlowAnalysis: boolean;
  showValidationErrors: boolean;
  showValidationWarnings: boolean;
  showPerformanceMetrics: boolean;
  autoHide: boolean;
  autoHideDelay: number; // seconds
}

export interface SystemValidationOverlayProps {
  calculationState: RealTimeCalculationState;
  systemAnalysis: SystemFlowAnalysis | null;
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  displayOptions?: Partial<ValidationDisplayOptions>;
  onValidationClick?: (elementId: string) => void;
}

const defaultDisplayOptions: ValidationDisplayOptions = {
  showCalculationStatus: true,
  showFlowAnalysis: true,
  showValidationErrors: true,
  showValidationWarnings: true,
  showPerformanceMetrics: false,
  autoHide: false,
  autoHideDelay: 10
};

/**
 * System Validation Overlay Component
 * Displays real-time validation feedback and system status
 */
export const SystemValidationOverlay: React.FC<SystemValidationOverlayProps> = ({
  calculationState,
  systemAnalysis,
  className,
  position = 'top-left',
  displayOptions = {},
  onValidationClick
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'status' | 'flow' | 'validation'>('status');
  
  const options = { ...defaultDisplayOptions, ...displayOptions };

  // Auto-hide functionality
  useEffect(() => {
    if (options.autoHide && !calculationState.isCalculating && calculationState.systemValid) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, options.autoHideDelay * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [calculationState.isCalculating, calculationState.systemValid, options.autoHide, options.autoHideDelay]);

  // Show overlay when there are issues
  useEffect(() => {
    if (!calculationState.systemValid || calculationState.validationErrors.length > 0) {
      setIsVisible(true);
    }
  }, [calculationState.systemValid, calculationState.validationErrors]);

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  const getStatusIcon = () => {
    if (calculationState.isCalculating) {
      return <Zap className="w-4 h-4 text-blue-500 animate-pulse" />;
    } else if (!calculationState.systemValid || calculationState.validationErrors.length > 0) {
      return <XCircle className="w-4 h-4 text-red-500" />;
    } else if (calculationState.validationWarnings.length > 0) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    } else {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusText = () => {
    if (calculationState.isCalculating) {
      return 'Calculating...';
    } else if (!calculationState.systemValid) {
      return 'System Invalid';
    } else if (calculationState.validationErrors.length > 0) {
      return `${calculationState.validationErrors.length} Error(s)`;
    } else if (calculationState.validationWarnings.length > 0) {
      return `${calculationState.validationWarnings.length} Warning(s)`;
    } else {
      return 'System Valid';
    }
  };

  if (!isVisible) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsVisible(true)}
        className={cn(
          'absolute z-50 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow',
          positionClasses[position],
          className
        )}
      >
        {getStatusIcon()}
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        'absolute z-50 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg',
        positionClasses[position],
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-sm font-medium text-gray-900">
            {getStatusText()}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {options.showCalculationStatus && (
                <button
                  onClick={() => setActiveTab('status')}
                  className={cn(
                    'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
                    activeTab === 'status'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  Status
                </button>
              )}
              {options.showFlowAnalysis && systemAnalysis && (
                <button
                  onClick={() => setActiveTab('flow')}
                  className={cn(
                    'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
                    activeTab === 'flow'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  Flow
                </button>
              )}
              {(options.showValidationErrors || options.showValidationWarnings) && (
                <button
                  onClick={() => setActiveTab('validation')}
                  className={cn(
                    'px-3 py-2 text-xs font-medium border-b-2 transition-colors',
                    activeTab === 'validation'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  )}
                >
                  Issues
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-3 max-h-64 overflow-y-auto">
              {activeTab === 'status' && options.showCalculationStatus && (
                <StatusTab calculationState={calculationState} />
              )}
              
              {activeTab === 'flow' && options.showFlowAnalysis && systemAnalysis && (
                <FlowTab systemAnalysis={systemAnalysis} />
              )}
              
              {activeTab === 'validation' && (
                <ValidationTab
                  errors={calculationState.validationErrors}
                  warnings={calculationState.validationWarnings}
                  showErrors={options.showValidationErrors}
                  showWarnings={options.showValidationWarnings}
                  onValidationClick={onValidationClick}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Status Tab Component
const StatusTab: React.FC<{ calculationState: RealTimeCalculationState }> = ({ calculationState }) => {
  const totalElements = calculationState.calculationResults.size;
  const calculatedElements = Array.from(calculationState.calculationResults.values()).filter((r: any) => r.success).length;
  const failedElements = Array.from(calculationState.calculationResults.values()).filter((r: any) => !r.success).length;
  const progress = totalElements > 0 ? (calculatedElements / totalElements) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Elements:</span>
            <span className="font-mono">{totalElements}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Calculated:</span>
            <span className="font-mono text-green-600">{calculatedElements}</span>
          </div>
          {failedElements > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Failed:</span>
              <span className="font-mono text-red-600">{failedElements}</span>
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Progress:</span>
            <span className="font-mono">{progress.toFixed(0)}%</span>
          </div>
          {calculationState.lastCalculationTime && (
            <div className="text-gray-500">
              Last: {calculationState.lastCalculationTime.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className="bg-blue-500 h-2 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

// Flow Tab Component
const FlowTab: React.FC<{ systemAnalysis: SystemFlowAnalysis }> = ({ systemAnalysis }) => {
  return (
    <div className="space-y-3 text-xs">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Wind className="w-3 h-3 text-blue-500" />
            <span className="text-gray-600">Total Flow:</span>
          </div>
          <div className="font-mono text-lg">{systemAnalysis.totalSystemFlow.toFixed(0)} CFM</div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <Gauge className="w-3 h-3 text-red-500" />
            <span className="text-gray-600">Pressure Drop:</span>
          </div>
          <div className="font-mono text-lg">{systemAnalysis.systemPressureDrop.toFixed(3)}&quot; w.g.</div>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">Flow Paths:</span>
          <span className="font-mono">{systemAnalysis.flowPaths.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Efficiency:</span>
          <span className="font-mono">{(systemAnalysis.systemEfficiency * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

// Validation Tab Component
const ValidationTab: React.FC<{
  errors: string[];
  warnings: string[];
  showErrors: boolean;
  showWarnings: boolean;
  onValidationClick?: (elementId: string) => void;
}> = ({ errors, warnings, showErrors, showWarnings, onValidationClick }) => {
  return (
    <div className="space-y-2">
      {showErrors && errors.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-red-600">
            <XCircle className="w-3 h-3" />
            <span className="text-xs font-medium">Errors ({errors.length})</span>
          </div>
          {errors.map((error, index) => (
            <div
              key={index}
              className="text-xs text-red-700 bg-red-50 p-2 rounded cursor-pointer hover:bg-red-100"
              onClick={() => onValidationClick?.(error)}
            >
              {error}
            </div>
          ))}
        </div>
      )}
      
      {showWarnings && warnings.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-yellow-600">
            <AlertTriangle className="w-3 h-3" />
            <span className="text-xs font-medium">Warnings ({warnings.length})</span>
          </div>
          {warnings.map((warning, index) => (
            <div
              key={index}
              className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded cursor-pointer hover:bg-yellow-100"
              onClick={() => onValidationClick?.(warning)}
            >
              {warning}
            </div>
          ))}
        </div>
      )}
      
      {errors.length === 0 && warnings.length === 0 && (
        <div className="flex items-center gap-2 text-green-600 text-xs">
          <CheckCircle className="w-3 h-3" />
          <span>No validation issues</span>
        </div>
      )}
    </div>
  );
};

export default SystemValidationOverlay;

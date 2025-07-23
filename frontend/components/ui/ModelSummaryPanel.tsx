"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  X, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Calculator,
  Wind,
  Thermometer,
  Zap,
  Target,
  TrendingUp,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalculationResult {
  id: string;
  elementId: string;
  elementName: string;
  type: 'duct' | 'room' | 'equipment';
  status: 'pass' | 'warning' | 'fail';
  value: number;
  unit: string;
  target?: number;
  tolerance?: number;
  message?: string;
}

interface SystemSummary {
  totalRooms: number;
  totalDucts: number;
  totalEquipment: number;
  totalAirflow: number;
  totalPressureDrop: number;
  maxVelocity: number;
  energyConsumption: number;
  compliance: {
    smacna: boolean;
    ashrae: boolean;
    local: boolean;
  };
}

interface ValidationWarning {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  elementId?: string;
  elementName?: string;
  suggestion?: string;
  standard?: string;
}

interface ModelSummaryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  systemSummary: SystemSummary;
  calculationResults: CalculationResult[];
  warnings: ValidationWarning[];
  isCalculating: boolean;
  onRunCalculation: () => void;
  onJumpToElement: (elementId: string) => void;
  className?: string;
}

const StatusBadge: React.FC<{
  status: 'pass' | 'warning' | 'fail';
  children: React.ReactNode;
}> = ({ status, children }) => {
  const colors = {
    pass: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
    fail: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30'
  };

  const icons = {
    pass: <CheckCircle className="w-3 h-3" />,
    warning: <AlertTriangle className="w-3 h-3" />,
    fail: <XCircle className="w-3 h-3" />
  };

  return (
    <div className={cn(
      "inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border",
      colors[status]
    )}>
      {icons[status]}
      <span>{children}</span>
    </div>
  );
};

const MetricCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  status?: 'pass' | 'warning' | 'fail';
  trend?: 'up' | 'down' | 'stable';
}> = ({ icon, label, value, unit, status, trend }) => (
  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center space-x-2">
        <div className="text-neutral-500 dark:text-neutral-400">
          {icon}
        </div>
        <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
          {label}
        </span>
      </div>
      {trend && (
        <TrendingUp className={cn(
          "w-3 h-3",
          trend === 'up' && "text-green-500 rotate-0",
          trend === 'down' && "text-red-500 rotate-180",
          trend === 'stable' && "text-neutral-500 rotate-90"
        )} />
      )}
    </div>
    <div className="flex items-end justify-between">
      <div className="flex items-baseline space-x-1">
        <span className="text-lg font-semibold text-neutral-800 dark:text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {unit && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {unit}
          </span>
        )}
      </div>
      {status && <StatusBadge status={status}>{status}</StatusBadge>}
    </div>
  </div>
);

const CollapsibleSection: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}> = ({ title, icon, children, defaultOpen = false, badge }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {icon}
          <h3 className="font-semibold text-neutral-800 dark:text-white">{title}</h3>
          {badge}
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ModelSummaryPanel: React.FC<ModelSummaryPanelProps> = ({
  isOpen,
  onClose,
  systemSummary,
  calculationResults,
  warnings,
  isCalculating,
  onRunCalculation,
  onJumpToElement,
  className
}) => {
  const errorCount = warnings.filter(w => w.type === 'error').length;
  const warningCount = warnings.filter(w => w.type === 'warning').length;
  const infoCount = warnings.filter(w => w.type === 'info').length;

  const getWarningIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed right-0 top-0 h-full w-96 bg-white/90 dark:bg-neutral-900/90",
              "backdrop-blur-lg border-l border-white/20 shadow-2xl z-50",
              "overflow-y-auto",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                </div>
                <h2 className="text-lg font-semibold text-neutral-800 dark:text-white">
                  Model Summary
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>

            {/* Calculation Controls */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onRunCalculation}
                  disabled={isCalculating}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors",
                    isCalculating
                      ? "bg-orange-500/20 text-orange-600 cursor-not-allowed"
                      : "bg-orange-500 hover:bg-orange-600 text-white"
                  )}
                >
                  {isCalculating ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </motion.div>
                      <span>Calculating...</span>
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4" />
                      <span>Run Calculation</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>
            </div>

            {/* System Overview */}
            <CollapsibleSection
              title="System Overview"
              icon={<Target className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />}
              defaultOpen
            >
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  icon={<Wind className="w-4 h-4" />}
                  label="Total Airflow"
                  value={systemSummary.totalAirflow}
                  unit="CFM"
                  status="pass"
                />
                <MetricCard
                  icon={<Thermometer className="w-4 h-4" />}
                  label="Pressure Drop"
                  value={systemSummary.totalPressureDrop.toFixed(2)}
                  unit="in. w.g."
                  status="warning"
                />
                <MetricCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Max Velocity"
                  value={systemSummary.maxVelocity}
                  unit="FPM"
                  status="pass"
                />
                <MetricCard
                  icon={<Zap className="w-4 h-4" />}
                  label="Energy Use"
                  value={systemSummary.energyConsumption.toFixed(1)}
                  unit="kW"
                  status="pass"
                />
              </div>
              
              <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Compliance Status
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">SMACNA</span>
                    <StatusBadge status={systemSummary.compliance.smacna ? 'pass' : 'fail'}>
                      {systemSummary.compliance.smacna ? 'Pass' : 'Fail'}
                    </StatusBadge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">ASHRAE</span>
                    <StatusBadge status={systemSummary.compliance.ashrae ? 'pass' : 'warning'}>
                      {systemSummary.compliance.ashrae ? 'Pass' : 'Warning'}
                    </StatusBadge>
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* Warnings & Issues */}
            <CollapsibleSection
              title="Warnings & Issues"
              icon={<AlertTriangle className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />}
              defaultOpen
              badge={
                <div className="flex space-x-1">
                  {errorCount > 0 && (
                    <span className="px-2 py-1 bg-red-500/20 text-red-600 dark:text-red-400 text-xs rounded-full">
                      {errorCount}
                    </span>
                  )}
                  {warningCount > 0 && (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-xs rounded-full">
                      {warningCount}
                    </span>
                  )}
                </div>
              }
            >
              <div className="space-y-3">
                {warnings.length === 0 ? (
                  <div className="text-center py-4 text-neutral-500 dark:text-neutral-400">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm">No issues found</p>
                  </div>
                ) : (
                  warnings.map((warning) => (
                    <div
                      key={warning.id}
                      className="p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => warning.elementId && onJumpToElement(warning.elementId)}
                    >
                      <div className="flex items-start space-x-3">
                        {getWarningIcon(warning.type)}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-neutral-800 dark:text-white">
                            {warning.title}
                          </h4>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                            {warning.message}
                          </p>
                          {warning.elementName && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                              Element: {warning.elementName}
                            </p>
                          )}
                          {warning.suggestion && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Suggestion: {warning.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CollapsibleSection>

            {/* Calculation Results */}
            <CollapsibleSection
              title="Calculation Results"
              icon={<Calculator className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />}
            >
              <div className="space-y-2">
                {calculationResults.length === 0 ? (
                  <div className="text-center py-4 text-neutral-500 dark:text-neutral-400">
                    <Calculator className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No calculations yet</p>
                    <p className="text-xs">Run calculation to see results</p>
                  </div>
                ) : (
                  calculationResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => onJumpToElement(result.elementId)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 dark:text-white truncate">
                          {result.elementName}
                        </p>
                        <p className="text-xs text-neutral-600 dark:text-neutral-400">
                          {result.value} {result.unit}
                        </p>
                      </div>
                      <StatusBadge status={result.status}>
                        {result.status}
                      </StatusBadge>
                    </div>
                  ))
                )}
              </div>
            </CollapsibleSection>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  XCircle, 
  AlertCircle, 
  Info,
  ChevronRight,
  ChevronLeft,
  Filter,
  X,
  CheckCircle,
  Eye,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ValidationWarning {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'SMACNA' | 'NFPA' | 'ASHRAE' | 'Safety' | 'Performance';
  title: string;
  message: string;
  elementId?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  timestamp: Date;
  resolved?: boolean;
  codeReference?: string;
}

interface WarningPanelProps {
  warnings: ValidationWarning[];
  onWarningClick?: (warning: ValidationWarning) => void;
  onWarningResolve?: (warningId: string) => void;
  onWarningDismiss?: (warningId: string) => void;
  className?: string;
}

export const WarningPanel: React.FC<WarningPanelProps> = ({
  warnings = [],
  onWarningClick,
  onWarningResolve,
  onWarningDismiss,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedType, setSelectedType] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Auto-expand for critical warnings
  useEffect(() => {
    const hasCritical = warnings.some(w => w.severity === 'critical' && !w.resolved);
    if (hasCritical && !isExpanded) {
      setIsExpanded(true);
    }
  }, [warnings, isExpanded]);

  // Filter warnings
  const filteredWarnings = warnings.filter(warning => {
    if (selectedType !== 'all' && warning.type !== selectedType) return false;
    if (selectedCategory !== 'all' && warning.category !== selectedCategory) return false;
    return true;
  });

  // Count warnings by type
  const errorCount = warnings.filter(w => w.type === 'error' && !w.resolved).length;
  const warningCount = warnings.filter(w => w.type === 'warning' && !w.resolved).length;
  const infoCount = warnings.filter(w => w.type === 'info' && !w.resolved).length;

  const getWarningIcon = (type: ValidationWarning['type']) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info': return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getWarningColor = (type: ValidationWarning['type']) => {
    switch (type) {
      case 'error': return 'border-red-500/20 bg-red-500/10';
      case 'warning': return 'border-yellow-500/20 bg-yellow-500/10';
      case 'info': return 'border-blue-500/20 bg-blue-500/10';
    }
  };

  const getSeverityColor = (severity: ValidationWarning['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <div className={cn("fixed right-0 top-20 bottom-0 z-40", className)}>
      {/* Collapsed Trigger */}
      {!isExpanded && (
        <motion.button
          initial={{ x: 100 }}
          animate={{ x: 0 }}
          onClick={() => setIsExpanded(true)}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2",
            "w-12 h-24 rounded-l-xl",
            "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md",
            "border border-r-0 border-white/20 dark:border-neutral-700/50",
            "shadow-lg hover:shadow-xl transition-all duration-200",
            "flex flex-col items-center justify-center space-y-1"
          )}
          whileHover={{ x: -5 }}
        >
          <ChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
          
          {/* Warning Count Badges */}
          <div className="flex flex-col space-y-1">
            {errorCount > 0 && (
              <div className="w-6 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {errorCount}
              </div>
            )}
            {warningCount > 0 && (
              <div className="w-6 h-4 bg-yellow-500 text-white text-xs rounded-full flex items-center justify-center">
                {warningCount}
              </div>
            )}
            {infoCount > 0 && (
              <div className="w-6 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                {infoCount}
              </div>
            )}
          </div>
        </motion.button>
      )}

      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className={cn(
              "w-96 h-full",
              "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md",
              "border-l border-white/20 dark:border-neutral-700/50",
              "shadow-2xl overflow-hidden flex flex-col"
            )}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 dark:border-neutral-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-white">
                      Validation Warnings
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                      {filteredWarnings.length} of {warnings.length} warnings
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 rounded-lg hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-white/10 dark:border-neutral-700/50 space-y-3">
              {/* Type Filter */}
              <div className="flex space-x-2">
                {[
                  { key: 'all', label: 'All', count: warnings.length },
                  { key: 'error', label: 'Error', count: errorCount },
                  { key: 'warning', label: 'Warning', count: warningCount },
                  { key: 'info', label: 'Info', count: infoCount }
                ].map(({ key, label, count }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedType(key as any)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-colors",
                      selectedType === key
                        ? "bg-blue-500 text-white"
                        : "bg-white/40 dark:bg-white/10 text-neutral-600 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-white/20"
                    )}
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={cn(
                  "w-full px-3 py-2 rounded-lg text-sm",
                  "bg-white/40 dark:bg-white/10 backdrop-blur-sm",
                  "border border-white/20 dark:border-neutral-700/50",
                  "text-neutral-900 dark:text-white"
                )}
              >
                <option value="all">All Categories</option>
                <option value="SMACNA">SMACNA Standards</option>
                <option value="NFPA">NFPA Codes</option>
                <option value="ASHRAE">ASHRAE Guidelines</option>
                <option value="Safety">Safety Requirements</option>
                <option value="Performance">Performance Issues</option>
              </select>
            </div>

            {/* Warnings List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredWarnings.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <p className="text-neutral-600 dark:text-neutral-300">
                    No warnings found
                  </p>
                </div>
              ) : (
                filteredWarnings.map((warning) => (
                  <motion.div
                    key={warning.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-4 rounded-lg border cursor-pointer transition-all duration-200",
                      getWarningColor(warning.type),
                      warning.resolved && "opacity-50",
                      "hover:shadow-md"
                    )}
                    onClick={() => onWarningClick?.(warning)}
                  >
                    <div className="flex items-start space-x-3">
                      {getWarningIcon(warning.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm text-neutral-900 dark:text-white">
                            {warning.title}
                          </h4>
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            getSeverityColor(warning.severity)
                          )}>
                            {warning.severity}
                          </span>
                        </div>
                        
                        <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-2">
                          {warning.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-neutral-500">
                            <span>{warning.category}</span>
                            {warning.codeReference && (
                              <span>• {warning.codeReference}</span>
                            )}
                          </div>
                          
                          <div className="flex space-x-1">
                            {!warning.resolved && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onWarningResolve?.(warning.id);
                                }}
                                className="p-1 rounded hover:bg-green-500/20 transition-colors"
                                title="Mark as resolved"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onWarningDismiss?.(warning.id);
                              }}
                              className="p-1 rounded hover:bg-red-500/20 transition-colors"
                              title="Dismiss warning"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 dark:border-neutral-700/50">
              <p className="text-xs text-neutral-500 text-center">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

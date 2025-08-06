/**
 * Debug Overlay Component
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Provides comprehensive debug visualization with snap point overlay, performance metrics,
 * system state inspection, and troubleshooting information. Accessible via Ctrl+Alt+D
 * on desktop or settings menu on touch devices.
 * 
 * @fileoverview Debug overlay component for snap logic system
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 * 
 * @example Basic Usage
 * ```typescript
 * const [debugVisible, setDebugVisible] = useState(false);
 * 
 * return (
 *   <div>
 *     <SnapLogicCanvas />
 *     <DebugOverlay
 *       visible={debugVisible}
 *       snapLogicSystem={snapSystem}
 *       onClose={() => setDebugVisible(false)}
 *     />
 *   </div>
 * );
 * ```
 */

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bug, 
  X, 
  Eye, 
  EyeOff, 
  Download, 
  RefreshCw,
  Activity,
  Target,
  Settings,
  BarChart3,
  Clock,
  Zap,
  Info,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SnapPoint, SnapResult, Centerline } from '@/types/air-duct-sizer';

/**
 * Debug data interface
 */
export interface DebugData {
  // System state
  systemState: {
    isActive: boolean;
    currentTool: string;
    isDrawing: boolean;
    snapEnabled: boolean;
    touchOverrideActive: boolean;
  };
  
  // Snap points
  snapPoints: {
    total: number;
    byType: Record<string, number>;
    visible: number;
    active: SnapPoint | null;
  };
  
  // Performance metrics
  performance: {
    lastSnapTime: number;
    averageSnapTime: number;
    snapCallsPerSecond: number;
    memoryUsage: number;
    renderTime: number;
  };
  
  // Drawing state
  drawing: {
    centerlineCount: number;
    totalPoints: number;
    currentCenterline: Centerline | null;
    branchPoints: number;
    validationWarnings: string[];
  };
  
  // Configuration
  configuration: {
    snapThreshold: number;
    magneticThreshold: number;
    attractionStrength: number;
    touchGesturesEnabled: boolean;
    smacnaValidation: boolean;
  };

  // Performance monitoring data
  performanceAlerts?: Array<{
    id: string;
    type: 'warning' | 'critical' | 'info';
    title: string;
    description: string;
    timestamp: number;
  }>;

  optimizationRecommendations?: Array<{
    id: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    estimatedImprovement: number;
  }>;

  performanceMetrics?: {
    frameRate: number;
    performanceScore: number;
    memoryUsage: number;
    cacheHitRate: number;
  };

  // Complex fitting analysis data
  complexIntersections?: Array<{
    intersectionPoint: { x: number; y: number };
    branchCount: number;
    complexity: 'simple' | 'moderate' | 'complex' | 'expert';
    recommendedSolution?: {
      type: string;
      name: string;
      confidence: number;
    };
  }>;

  complexFittingMetrics?: {
    totalComplexIntersections: number;
    averageComplexity: string;
    smacnaCompliance: number;
    fabricationComplexity: string;
  };
}

/**
 * Debug view types
 */
export type DebugViewType = 'overview' | 'snapPoints' | 'performance' | 'drawing' | 'configuration';

/**
 * Props for DebugOverlay component
 */
interface DebugOverlayProps {
  visible: boolean;
  debugData: DebugData;
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  onClose: () => void;
  onExportData?: () => void;
  onRefreshData?: () => void;
  className?: string;
}

/**
 * Main debug overlay component
 */
export const DebugOverlay: React.FC<DebugOverlayProps> = ({
  visible,
  debugData,
  viewport,
  onClose,
  onExportData,
  onRefreshData,
  className
}) => {
  const [activeView, setActiveView] = useState<DebugViewType>('overview');
  const [showSnapPointOverlay, setShowSnapPointOverlay] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(1000); // 1 second

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !visible) return;

    const interval = setInterval(() => {
      onRefreshData?.();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, visible, refreshInterval, onRefreshData]);

  // Keyboard shortcut handling
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key === 'd') {
        event.preventDefault();
        onClose();
      }
    };

    if (visible) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [visible, onClose]);

  // Export debug data
  const handleExportData = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      debugData,
      viewport,
      version: '1.1.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sizewise-debug-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onExportData?.();
  }, [debugData, viewport, onExportData]);

  // Calculate performance status
  const performanceStatus = useMemo(() => {
    const { performance } = debugData;
    if (performance.lastSnapTime > 10) return 'warning';
    if (performance.lastSnapTime > 5) return 'caution';
    return 'good';
  }, [debugData.performance]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn(
          "fixed inset-0 bg-black/50 z-[9999] flex items-start justify-end p-4",
          className
        )}
        onClick={onClose}
      >
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          className="bg-white rounded-lg shadow-2xl border w-96 max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <div className="flex items-center gap-2">
              <Bug className="text-blue-600" size={20} />
              <h2 className="font-semibold text-gray-900">Debug Mode</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={cn(
                  "p-1 rounded transition-colors",
                  autoRefresh ? "text-green-600 bg-green-100" : "text-gray-400"
                )}
                title={autoRefresh ? "Auto-refresh enabled" : "Auto-refresh disabled"}
              >
                <RefreshCw size={16} className={autoRefresh ? "animate-spin" : ""} />
              </button>
              <button
                onClick={handleExportData}
                className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                title="Export debug data"
              >
                <Download size={16} />
              </button>
              <button
                onClick={onClose}
                className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                title="Close debug mode (Ctrl+Alt+D)"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Navigation tabs */}
          <div className="flex border-b bg-gray-50">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'snapPoints', label: 'Snap', icon: Target },
              { id: 'performance', label: 'Perf', icon: Activity },
              { id: 'drawing', label: 'Draw', icon: Settings },
              { id: 'configuration', label: 'Config', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveView(id as DebugViewType)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2 px-1 text-xs transition-colors",
                  activeView === id
                    ? "text-blue-600 bg-white border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                <Icon size={14} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeView === 'overview' && <OverviewPanel debugData={debugData} />}
            {activeView === 'snapPoints' && (
              <SnapPointsPanel 
                debugData={debugData} 
                showOverlay={showSnapPointOverlay}
                onToggleOverlay={setShowSnapPointOverlay}
              />
            )}
            {activeView === 'performance' && (
              <PerformancePanel 
                debugData={debugData} 
                status={performanceStatus}
              />
            )}
            {activeView === 'drawing' && <DrawingPanel debugData={debugData} />}
            {activeView === 'configuration' && <ConfigurationPanel debugData={debugData} />}
          </div>

          {/* Footer */}
          <div className="border-t bg-gray-50 p-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>SizeWise Debug v1.1.0</span>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  performanceStatus === 'good' ? "bg-green-500" :
                  performanceStatus === 'caution' ? "bg-yellow-500" : "bg-red-500"
                )} />
                <span>
                  {performanceStatus === 'good' ? 'Optimal' :
                   performanceStatus === 'caution' ? 'Caution' : 'Warning'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Snap point overlay */}
        {showSnapPointOverlay && (
          <SnapPointDebugOverlay 
            debugData={debugData}
            viewport={viewport}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Overview panel component
 */
const OverviewPanel: React.FC<{ debugData: DebugData }> = ({ debugData }) => {
  const { systemState, snapPoints, performance, drawing } = debugData;

  return (
    <div className="space-y-4">
      {/* System status */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
          <Activity size={16} />
          System Status
        </h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span>Active:</span>
            <span className={systemState.isActive ? "text-green-600" : "text-red-600"}>
              {systemState.isActive ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Tool:</span>
            <span className="font-mono">{systemState.currentTool}</span>
          </div>
          <div className="flex justify-between">
            <span>Drawing:</span>
            <span className={systemState.isDrawing ? "text-blue-600" : "text-gray-600"}>
              {systemState.isDrawing ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Snap:</span>
            <span className={systemState.snapEnabled ? "text-green-600" : "text-orange-600"}>
              {systemState.snapEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">{snapPoints.total}</div>
          <div className="text-sm text-blue-700">Snap Points</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600">{drawing.centerlineCount}</div>
          <div className="text-sm text-green-700">Centerlines</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-600">{performance.lastSnapTime.toFixed(1)}ms</div>
          <div className="text-sm text-purple-700">Last Snap</div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-orange-600">{drawing.validationWarnings.length}</div>
          <div className="text-sm text-orange-700">Warnings</div>
        </div>
      </div>

      {/* Recent warnings */}
      {drawing.validationWarnings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <h4 className="font-medium text-orange-900 mb-2 flex items-center gap-2">
            <AlertTriangle size={16} />
            Recent Warnings
          </h4>
          <div className="space-y-1">
            {drawing.validationWarnings.slice(0, 3).map((warning, index) => (
              <div key={index} className="text-sm text-orange-800">
                • {warning}
              </div>
            ))}
            {drawing.validationWarnings.length > 3 && (
              <div className="text-sm text-orange-600">
                +{drawing.validationWarnings.length - 3} more...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Snap points panel component
 */
interface SnapPointsPanelProps {
  debugData: DebugData;
  showOverlay: boolean;
  onToggleOverlay: (show: boolean) => void;
}

const SnapPointsPanel: React.FC<SnapPointsPanelProps> = ({ 
  debugData, 
  showOverlay, 
  onToggleOverlay 
}) => {
  const { snapPoints } = debugData;

  return (
    <div className="space-y-4">
      {/* Overlay toggle */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Snap Point Visualization</h3>
        <button
          onClick={() => onToggleOverlay(!showOverlay)}
          className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-lg text-sm transition-colors",
            showOverlay 
              ? "bg-blue-100 text-blue-700" 
              : "bg-gray-100 text-gray-600"
          )}
        >
          {showOverlay ? <Eye size={16} /> : <EyeOff size={16} />}
          {showOverlay ? "Hide Overlay" : "Show Overlay"}
        </button>
      </div>

      {/* Snap point statistics */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="font-medium text-gray-900 mb-3">Statistics</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Points:</span>
            <span className="font-mono">{snapPoints.total}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Visible Points:</span>
            <span className="font-mono">{snapPoints.visible}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Active Point:</span>
            <span className="font-mono">
              {snapPoints.active ? snapPoints.active.type : "None"}
            </span>
          </div>
        </div>
      </div>

      {/* Snap point types breakdown */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="font-medium text-gray-900 mb-3">By Type</h4>
        <div className="space-y-2">
          {Object.entries(snapPoints.byType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded border"
                  style={{
                    backgroundColor: {
                      endpoint: '#ef4444',
                      centerline: '#3b82f6',
                      midpoint: '#10b981',
                      intersection: '#f59e0b'
                    }[type] || '#6b7280'
                  }}
                />
                <span className="capitalize">{type}</span>
              </div>
              <span className="font-mono">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active snap point details */}
      {snapPoints.active && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 mb-2">Active Snap Point</h4>
          <div className="space-y-1 text-sm">
            <div><strong>Type:</strong> {snapPoints.active.type}</div>
            <div><strong>Position:</strong> ({snapPoints.active.position.x.toFixed(1)}, {snapPoints.active.position.y.toFixed(1)})</div>
            <div><strong>Priority:</strong> {snapPoints.active.priority}</div>
            {snapPoints.active.elementId && (
              <div><strong>Element:</strong> {snapPoints.active.elementId}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Performance panel component
 */
interface PerformancePanelProps {
  debugData: DebugData;
  status: 'good' | 'caution' | 'warning';
}

const PerformancePanel: React.FC<PerformancePanelProps> = ({ debugData, status }) => {
  const { performance } = debugData;

  const statusConfig = {
    good: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle },
    caution: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock },
    warning: { color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle }
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="space-y-4">
      {/* Performance status */}
      <div className={cn("rounded-lg p-3 border", config.bg)}>
        <div className="flex items-center gap-2 mb-2">
          <StatusIcon size={16} className={config.color} />
          <h3 className={cn("font-medium", config.color)}>
            Performance Status: {status.charAt(0).toUpperCase() + status.slice(1)}
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          {status === 'good' && "System is performing optimally."}
          {status === 'caution' && "Performance is acceptable but could be improved."}
          {status === 'warning' && "Performance issues detected. Consider optimization."}
        </p>
      </div>

      {/* Performance metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-gray-900">{performance.lastSnapTime.toFixed(2)}ms</div>
          <div className="text-sm text-gray-600">Last Snap Time</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-gray-900">{performance.averageSnapTime.toFixed(2)}ms</div>
          <div className="text-sm text-gray-600">Average Snap Time</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-gray-900">{performance.snapCallsPerSecond.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Snaps/Second</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-gray-900">{performance.renderTime.toFixed(2)}ms</div>
          <div className="text-sm text-gray-600">Render Time</div>
        </div>
      </div>

      {/* Cache performance metrics */}
      {(performance as any).snapCacheMetrics && (
        <div className="bg-blue-50 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 mb-2">Cache Performance</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Hit Rate:</span>
              <span className="font-mono">{((performance as any).snapCacheMetrics.cacheHitRate * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Memory:</span>
              <span className="font-mono">{(performance as any).snapCacheMetrics.memoryUsage.toFixed(1)}MB</span>
            </div>
            <div className="flex justify-between">
              <span>Entries:</span>
              <span className="font-mono">{(performance as any).snapCacheMetrics.entryCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Evictions:</span>
              <span className="font-mono">{(performance as any).snapCacheMetrics.evictionCount}</span>
            </div>
          </div>
        </div>
      )}

      {/* Performance optimizer metrics */}
      {(performance as any).performanceOptimizerMetrics && (
        <div className="bg-green-50 rounded-lg p-3">
          <h4 className="font-medium text-green-900 mb-2">Performance Optimizer</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Debouncing:</span>
              <span className="font-mono">{((performance as any).performanceOptimizerMetrics.debouncingEfficiency * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Batching:</span>
              <span className="font-mono">{((performance as any).performanceOptimizerMetrics.batchingEfficiency * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Frame Rate:</span>
              <span className="font-mono">{(performance as any).performanceOptimizerMetrics.frameRate.toFixed(1)}fps</span>
            </div>
            <div className="flex justify-between">
              <span>Score:</span>
              <span className="font-mono">{(performance as any).performanceOptimizerMetrics.performanceScore}/100</span>
            </div>
            <div className="flex justify-between col-span-2">
              <span>Adaptive Level:</span>
              <span className="font-mono capitalize">{(performance as any).performanceOptimizerMetrics.adaptiveLevel}</span>
            </div>
          </div>
        </div>
      )}

      {/* Performance monitoring alerts */}
      {debugData.performanceAlerts && debugData.performanceAlerts.length > 0 && (
        <div className="bg-red-50 rounded-lg p-3">
          <h4 className="font-medium text-red-900 mb-2">Performance Alerts</h4>
          <div className="space-y-2">
            {debugData.performanceAlerts.slice(0, 3).map((alert: any, index: number) => (
              <div key={index} className="text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    alert.type === 'critical' ? 'bg-red-500' :
                    alert.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></span>
                  <span className="font-medium">{alert.title}</span>
                </div>
                <div className="text-gray-600 ml-4">{alert.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance recommendations */}
      {debugData.optimizationRecommendations && debugData.optimizationRecommendations.length > 0 && (
        <div className="bg-purple-50 rounded-lg p-3">
          <h4 className="font-medium text-purple-900 mb-2">Optimization Tips</h4>
          <div className="space-y-2">
            {debugData.optimizationRecommendations.slice(0, 2).map((rec: any, index: number) => (
              <div key={index} className="text-sm">
                <div className="flex items-center gap-2">
                  <span className={`px-1 py-0.5 text-xs rounded ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority}
                  </span>
                  <span className="font-medium">{rec.title}</span>
                </div>
                <div className="text-gray-600 ml-4">+{rec.estimatedImprovement}% improvement</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Memory usage */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="font-medium text-gray-900 mb-2">Memory Usage</h4>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (performance.memoryUsage / 100) * 100)}%` }}
            />
          </div>
          <span className="text-sm font-mono">{performance.memoryUsage.toFixed(1)}MB</span>
        </div>
      </div>

      {/* Performance recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Info size={16} />
          Recommendations
        </h4>
        <div className="space-y-1 text-sm text-blue-800">
          {performance.lastSnapTime > 10 && (
            <div>• Consider reducing snap point density</div>
          )}
          {performance.snapCallsPerSecond > 60 && (
            <div>• Enable snap result caching for better performance</div>
          )}
          {performance.memoryUsage > 50 && (
            <div>• Memory usage is high, consider clearing unused data</div>
          )}
          {performance.renderTime > 16 && (
            <div>• Render time exceeds 60fps target, optimize visual feedback</div>
          )}
          {status === 'good' && (
            <div>• Performance is optimal, no action needed</div>
          )}
        </div>
      </div>

      {/* Complex fitting analysis */}
      {debugData.complexIntersections && debugData.complexIntersections.length > 0 && (
        <div className="bg-orange-50 rounded-lg p-3">
          <h4 className="font-medium text-orange-900 mb-2">Complex Intersections</h4>
          <div className="space-y-2">
            {debugData.complexIntersections.slice(0, 3).map((intersection, index) => (
              <div key={index} className="text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    intersection.complexity === 'expert' ? 'bg-red-500' :
                    intersection.complexity === 'complex' ? 'bg-orange-500' :
                    intersection.complexity === 'moderate' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}></span>
                  <span className="font-medium">{intersection.branchCount} branches</span>
                  <span className="text-gray-600 capitalize">({intersection.complexity})</span>
                </div>
                {intersection.recommendedSolution && (
                  <div className="text-gray-600 ml-4">
                    {intersection.recommendedSolution.name} - {(intersection.recommendedSolution.confidence * 100).toFixed(0)}% confidence
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Complex fitting metrics */}
      {debugData.complexFittingMetrics && (
        <div className="bg-indigo-50 rounded-lg p-3">
          <h4 className="font-medium text-indigo-900 mb-2">Complex Fitting Metrics</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span>Complex Intersections:</span>
              <span className="font-mono">{debugData.complexFittingMetrics.totalComplexIntersections}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Complexity:</span>
              <span className="font-mono capitalize">{debugData.complexFittingMetrics.averageComplexity}</span>
            </div>
            <div className="flex justify-between">
              <span>SMACNA Compliance:</span>
              <span className="font-mono">{debugData.complexFittingMetrics.smacnaCompliance.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Fabrication:</span>
              <span className="font-mono capitalize">{debugData.complexFittingMetrics.fabricationComplexity}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Drawing panel component
 */
const DrawingPanel: React.FC<{ debugData: DebugData }> = ({ debugData }) => {
  const { drawing, systemState } = debugData;

  return (
    <div className="space-y-4">
      {/* Drawing statistics */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h3 className="font-medium text-gray-900 mb-3">Drawing Statistics</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span>Centerlines:</span>
            <span className="font-mono">{drawing.centerlineCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Points:</span>
            <span className="font-mono">{drawing.totalPoints}</span>
          </div>
          <div className="flex justify-between">
            <span>Branch Points:</span>
            <span className="font-mono">{drawing.branchPoints}</span>
          </div>
          <div className="flex justify-between">
            <span>Warnings:</span>
            <span className="font-mono text-orange-600">{drawing.validationWarnings.length}</span>
          </div>
        </div>
      </div>

      {/* Current centerline */}
      {drawing.currentCenterline && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 mb-2">Current Centerline</h4>
          <div className="space-y-1 text-sm">
            <div><strong>ID:</strong> {drawing.currentCenterline.id}</div>
            <div><strong>Type:</strong> {drawing.currentCenterline.type}</div>
            <div><strong>Points:</strong> {drawing.currentCenterline.points.length}</div>
            <div><strong>SMACNA Compliant:</strong>
              <span className={drawing.currentCenterline.isSMACNACompliant ? "text-green-600" : "text-red-600"}>
                {drawing.currentCenterline.isSMACNACompliant ? " Yes" : " No"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Drawing state */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="font-medium text-gray-900 mb-2">Drawing State</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Currently Drawing:</span>
            <span className={systemState.isDrawing ? "text-green-600" : "text-gray-600"}>
              {systemState.isDrawing ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Active Tool:</span>
            <span className="font-mono">{systemState.currentTool}</span>
          </div>
          <div className="flex justify-between">
            <span>Touch Override:</span>
            <span className={systemState.touchOverrideActive ? "text-orange-600" : "text-gray-600"}>
              {systemState.touchOverrideActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Validation warnings */}
      {drawing.validationWarnings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <h4 className="font-medium text-orange-900 mb-2">Validation Warnings</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {drawing.validationWarnings.map((warning, index) => (
              <div key={index} className="text-sm text-orange-800">
                • {warning}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Configuration panel component
 */
const ConfigurationPanel: React.FC<{ debugData: DebugData }> = ({ debugData }) => {
  const { configuration } = debugData;

  return (
    <div className="space-y-4">
      {/* Snap configuration */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h3 className="font-medium text-gray-900 mb-3">Snap Configuration</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Snap Threshold:</span>
            <span className="font-mono">{configuration.snapThreshold}px</span>
          </div>
          <div className="flex justify-between">
            <span>Magnetic Threshold:</span>
            <span className="font-mono">{configuration.magneticThreshold}px</span>
          </div>
          <div className="flex justify-between">
            <span>Attraction Strength:</span>
            <span className="font-mono">{(configuration.attractionStrength * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Feature toggles */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="font-medium text-gray-900 mb-3">Feature Toggles</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Touch Gestures:</span>
            <span className={configuration.touchGesturesEnabled ? "text-green-600" : "text-red-600"}>
              {configuration.touchGesturesEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>SMACNA Validation:</span>
            <span className={configuration.smacnaValidation ? "text-green-600" : "text-red-600"}>
              {configuration.smacnaValidation ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>
      </div>

      {/* Configuration recommendations */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Settings size={16} />
          Recommendations
        </h4>
        <div className="space-y-1 text-sm text-blue-800">
          {configuration.snapThreshold > 20 && (
            <div>• Consider reducing snap threshold for more precise snapping</div>
          )}
          {configuration.magneticThreshold < configuration.snapThreshold && (
            <div>• Magnetic threshold should be larger than snap threshold</div>
          )}
          {!configuration.smacnaValidation && (
            <div>• Enable SMACNA validation for professional compliance</div>
          )}
          {!configuration.touchGesturesEnabled && 'ontouchstart' in window && (
            <div>• Enable touch gestures for better mobile experience</div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Snap point debug overlay component
 */
interface SnapPointDebugOverlayProps {
  debugData: DebugData;
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
}

const SnapPointDebugOverlay: React.FC<SnapPointDebugOverlayProps> = ({
  debugData,
  viewport
}) => {
  // This would render snap points with debug information
  // For now, we'll return a placeholder that shows the concept
  return (
    <div className="fixed inset-0 pointer-events-none z-[9998]">
      {/* Debug snap point indicators would be rendered here */}
      {/* This would integrate with the actual snap points from the system */}
      <div className="absolute top-4 left-4 bg-black/80 text-white px-2 py-1 rounded text-xs">
        Debug Overlay: {debugData.snapPoints.total} snap points
      </div>
    </div>
  );
};

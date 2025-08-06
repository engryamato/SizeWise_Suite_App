/**
 * Debug Mode Integration Component
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Provides debug mode integration with keyboard shortcuts, settings menu access,
 * and seamless integration with the snap logic system. Handles debug overlay
 * visibility and data management.
 * 
 * @fileoverview Debug mode integration for snap logic system
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 * 
 * @example Basic Usage
 * ```typescript
 * const snapLogic = useSnapLogic();
 * 
 * return (
 *   <div>
 *     <SnapLogicCanvas />
 *     <DebugModeIntegration
 *       snapLogic={snapLogic}
 *       viewport={viewport}
 *     />
 *   </div>
 * );
 * ```
 */

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, Settings } from 'lucide-react';
import { DebugOverlay, DebugData } from './DebugOverlay';
import { UseSnapLogicReturn } from '@/lib/hooks/useSnapLogic';

/**
 * Props for DebugModeIntegration component
 */
interface DebugModeIntegrationProps {
  snapLogic: UseSnapLogicReturn;
  viewport: {
    x: number;
    y: number;
    scale: number;
  };
  showDebugButton?: boolean;
  className?: string;
}

/**
 * Debug mode integration component
 */
export const DebugModeIntegration: React.FC<DebugModeIntegrationProps> = ({
  snapLogic,
  viewport,
  showDebugButton = true,
  className
}) => {
  const [debugOverlayVisible, setDebugOverlayVisible] = useState(false);
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Handle keyboard shortcut (Ctrl+Alt+D)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key === 'd') {
        event.preventDefault();
        toggleDebugMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-refresh debug data when overlay is visible
  useEffect(() => {
    if (debugOverlayVisible && snapLogic.debugModeEnabled) {
      // Initial data load
      refreshDebugData();

      // Set up auto-refresh
      const interval = setInterval(refreshDebugData, 1000);
      setRefreshInterval(interval);

      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    } else {
      // Clear refresh interval when overlay is hidden
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }
  }, [debugOverlayVisible, snapLogic.debugModeEnabled]);

  /**
   * Toggle debug mode on/off
   */
  const toggleDebugMode = useCallback(() => {
    if (debugOverlayVisible) {
      // Close debug overlay and disable debug mode
      setDebugOverlayVisible(false);
      snapLogic.disableDebugMode();
    } else {
      // Enable debug mode and show overlay
      snapLogic.enableDebugMode();
      setDebugOverlayVisible(true);
    }
  }, [debugOverlayVisible, snapLogic]);

  /**
   * Refresh debug data from snap logic system
   */
  const refreshDebugData = useCallback(() => {
    const data = snapLogic.getDebugData();
    if (data) {
      setDebugData(data);
    }
  }, [snapLogic]);

  /**
   * Handle debug overlay close
   */
  const handleDebugOverlayClose = useCallback(() => {
    setDebugOverlayVisible(false);
    snapLogic.disableDebugMode();
  }, [snapLogic]);

  /**
   * Handle debug data export
   */
  const handleExportDebugData = useCallback(() => {
    const exportedData = snapLogic.exportDebugData();
    
    // Create and download file
    const blob = new Blob([exportedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sizewise-debug-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [snapLogic]);

  return (
    <div className={className}>
      {/* Debug mode toggle button */}
      {showDebugButton && (
        <motion.button
          onClick={toggleDebugMode}
          className={`
            fixed bottom-4 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg
            transition-all duration-200 text-sm font-medium
            ${snapLogic.debugModeEnabled 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Toggle Debug Mode (Ctrl+Alt+D)"
        >
          <Bug size={16} />
          <span>Debug</span>
          {snapLogic.debugModeEnabled && (
            <motion.div
              className="w-2 h-2 bg-green-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </motion.button>
      )}

      {/* Debug overlay */}
      <AnimatePresence>
        {debugOverlayVisible && debugData && (
          <DebugOverlay
            visible={debugOverlayVisible}
            debugData={debugData}
            viewport={viewport}
            onClose={handleDebugOverlayClose}
            onExportData={handleExportDebugData}
            onRefreshData={refreshDebugData}
          />
        )}
      </AnimatePresence>

      {/* Touch device debug access */}
      {snapLogic.isTouchDevice && (
        <DebugSettingsMenu
          debugModeEnabled={snapLogic.debugModeEnabled}
          onToggleDebugMode={toggleDebugMode}
          onExportData={handleExportDebugData}
        />
      )}
    </div>
  );
};

/**
 * Debug settings menu for touch devices
 */
interface DebugSettingsMenuProps {
  debugModeEnabled: boolean;
  onToggleDebugMode: () => void;
  onExportData: () => void;
}

const DebugSettingsMenu: React.FC<DebugSettingsMenuProps> = ({
  debugModeEnabled,
  onToggleDebugMode,
  onExportData
}) => {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <div className="fixed top-4 right-4 z-40">
      {/* Settings button */}
      <motion.button
        onClick={() => setMenuVisible(!menuVisible)}
        className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-lg border hover:bg-gray-50 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Settings size={20} className="text-gray-600" />
      </motion.button>

      {/* Settings menu */}
      <AnimatePresence>
        {menuVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute top-14 right-0 bg-white rounded-lg shadow-xl border p-2 min-w-48"
          >
            <div className="text-sm font-medium text-gray-900 px-3 py-2 border-b">
              Debug Settings
            </div>
            
            <button
              onClick={() => {
                onToggleDebugMode();
                setMenuVisible(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-gray-50 rounded transition-colors"
            >
              <Bug size={16} className={debugModeEnabled ? "text-blue-600" : "text-gray-400"} />
              <div>
                <div className="font-medium text-sm">Debug Mode</div>
                <div className="text-xs text-gray-500">
                  {debugModeEnabled ? "Enabled" : "Disabled"}
                </div>
              </div>
            </button>

            {debugModeEnabled && (
              <button
                onClick={() => {
                  onExportData();
                  setMenuVisible(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-gray-50 rounded transition-colors"
              >
                <div className="w-4 h-4 bg-green-500 rounded" />
                <div>
                  <div className="font-medium text-sm">Export Data</div>
                  <div className="text-xs text-gray-500">Download debug info</div>
                </div>
              </button>
            )}

            <div className="border-t mt-2 pt-2">
              <div className="px-3 py-2 text-xs text-gray-500">
                Keyboard: Ctrl+Alt+D
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {menuVisible && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => setMenuVisible(false)}
        />
      )}
    </div>
  );
};

/**
 * Debug mode status indicator
 */
interface DebugStatusIndicatorProps {
  enabled: boolean;
  className?: string;
}

export const DebugStatusIndicator: React.FC<DebugStatusIndicatorProps> = ({
  enabled,
  className
}) => {
  if (!enabled) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-1 
        bg-blue-500 text-white rounded-lg shadow-lg text-sm font-medium
        ${className}
      `}
    >
      <Bug size={14} />
      <span>Debug Active</span>
      <motion.div
        className="w-2 h-2 bg-green-400 rounded-full"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    </motion.div>
  );
};

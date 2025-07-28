"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TestTube,
  Eye,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const TestingHelper: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);

  const runQuickDiagnostic = () => {
    const results = [];

    // Check for Priority 5 components
    const warningPanel = document.querySelector('[data-component="warning-panel"]') || 
                        document.querySelector('.warning-panel') ||
                        document.querySelector('[class*="warning"]');
    results.push({
      test: 'Priority 5: Warning Panel',
      status: warningPanel ? 'pass' : 'fail',
      details: warningPanel ? 'Warning Panel component found in DOM' : 'Warning Panel not found'
    });

    // Check for Priority 6 components
    const profileDropdown = document.querySelector('[data-component="profile-dropdown"]') ||
                           document.querySelector('.profile-dropdown') ||
                           document.querySelector('[class*="profile"]');
    results.push({
      test: 'Priority 6: Profile Dropdown',
      status: profileDropdown ? 'pass' : 'fail',
      details: profileDropdown ? 'Profile dropdown found' : 'Profile dropdown not found'
    });

    const bottomRightCorner = document.querySelector('[data-component="bottom-right-corner"]') ||
                             document.querySelector('.bottom-right-corner') ||
                             document.querySelector('[class*="bottom-right"]');
    results.push({
      test: 'Priority 6: Bottom Right Corner',
      status: bottomRightCorner ? 'pass' : 'fail',
      details: bottomRightCorner ? 'Bottom right corner found' : 'Bottom right corner not found'
    });

    // Check for Priority 7 components
    const viewCube = document.querySelector('[data-component="view-cube"]') ||
                    document.querySelector('.view-cube') ||
                    document.querySelector('[class*="view-cube"]');
    results.push({
      test: 'Priority 7: ViewCube',
      status: viewCube ? 'pass' : 'fail',
      details: viewCube ? 'ViewCube found' : 'ViewCube not found'
    });

    // Check for existing components
    const drawingTools = document.querySelector('[data-component="drawing-tools"]') ||
                        document.querySelector('.drawing-tools') ||
                        document.querySelector('[class*="drawing"]');
    results.push({
      test: 'Existing: Drawing Tools FAB',
      status: drawingTools ? 'pass' : 'warning',
      details: drawingTools ? 'Drawing tools found' : 'Drawing tools not found'
    });

    const calculationBar = document.querySelector('[data-component="calculation-bar"]') ||
                          document.querySelector('.calculation-bar') ||
                          document.querySelector('[class*="calculation"]');
    results.push({
      test: 'Existing: Calculation Bar',
      status: calculationBar ? 'pass' : 'warning',
      details: calculationBar ? 'Calculation bar found' : 'Calculation bar not found'
    });

    setTestResults(results);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'border-green-500/20 bg-green-500/10';
      case 'fail': return 'border-red-500/20 bg-red-500/10';
      case 'warning': return 'border-yellow-500/20 bg-yellow-500/10';
      default: return 'border-gray-500/20 bg-gray-500/10';
    }
  };

  return (
    <>
      {/* Testing Helper Toggle */}
      <motion.button
        onClick={() => setIsVisible(!isVisible)}
        className={cn(
          "fixed bottom-6 left-20 z-50",
          "w-12 h-12 rounded-full",
          "bg-blue-500 hover:bg-blue-600 text-white",
          "shadow-lg hover:shadow-xl transition-all duration-200",
          "flex items-center justify-center"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Testing Helper"
      >
        <TestTube className="w-6 h-6" />
      </motion.button>

      {/* Testing Panel */}
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -400 }}
          className={cn(
            "fixed left-6 bottom-20 z-50 w-80",
            "bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md",
            "border border-white/20 dark:border-neutral-700/50",
            "rounded-xl shadow-2xl overflow-hidden"
          )}
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 dark:border-neutral-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <TestTube className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Testing Helper
                </h3>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="p-1 rounded hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
              >
                <Eye className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 border-b border-white/10 dark:border-neutral-700/50">
            <button
              onClick={runQuickDiagnostic}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Run Quick Diagnostic
            </button>
          </div>

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="max-h-64 overflow-y-auto p-4 space-y-2">
              {testResults.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "p-3 rounded-lg border",
                    getStatusColor(result.status)
                  )}
                >
                  <div className="flex items-start space-x-3">
                    {getStatusIcon(result.status)}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-neutral-900 dark:text-white">
                        {result.test}
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                        {result.details}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Testing Instructions */}
          <div className="p-4 border-t border-white/10 dark:border-neutral-700/50">
            <h4 className="font-medium text-sm text-neutral-900 dark:text-white mb-2">
              Testing Instructions:
            </h4>
            <ul className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
              <li>• Check right edge for Warning Panel</li>
              <li>• Look for ViewCube in top-right</li>
              <li>• Find Chat/Help in bottom-right</li>
              <li>• Test profile dropdown in nav</li>
              <li>• Press F12 for console errors</li>
            </ul>
          </div>
        </motion.div>
      )}
    </>
  );
};

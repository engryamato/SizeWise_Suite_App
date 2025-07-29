'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  AlertTriangle, 
  ArrowLeft,
  Wrench,
  Ruler,
  Calculator
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDeviceDetection, getDeviceRequirementMessage } from '@/lib/hooks/useDeviceDetection';

interface MobileToolRestrictionProps {
  toolName?: string;
  toolDescription?: string;
  className?: string;
}

/**
 * Mobile Tool Restriction Component
 * 
 * Displays when mobile users attempt to access professional HVAC engineering tools.
 * Provides clear messaging about device requirements and suggests alternatives.
 * 
 * Features:
 * - Responsive design that works on mobile devices
 * - Clear explanation of device requirements
 * - Visual device comparison
 * - Navigation back to dashboard
 * - Professional messaging for engineering context
 */
export const MobileToolRestriction: React.FC<MobileToolRestrictionProps> = ({
  toolName = 'HVAC Engineering Tool',
  toolDescription = 'Professional HVAC design and calculation tools',
  className = ''
}) => {
  const router = useRouter();
  const { screenWidth, screenHeight, type } = useDeviceDetection();
  
  const requirementMessage = getDeviceRequirementMessage(screenWidth);

  const handleGoBack = () => {
    router.push('/');
  };

  const handleViewProjects = () => {
    router.push('/projects');
  };

  const handleViewReports = () => {
    router.push('/reports');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-6"
      >
        {/* Header with Warning Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 mx-auto mb-6 bg-orange-500/20 rounded-full flex items-center justify-center"
        >
          <AlertTriangle className="w-8 h-8 text-orange-500" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xl font-bold text-neutral-900 dark:text-white mb-2 text-center"
        >
          Larger Screen Required
        </motion.h1>

        {/* Tool Name */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-neutral-600 dark:text-neutral-300 mb-4 text-center font-medium"
        >
          {toolName}
        </motion.p>

        {/* Device Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center space-x-4 mb-6"
        >
          {/* Current Device (Mobile) */}
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-2">
              <Smartphone className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <span className="text-xs text-red-600 dark:text-red-400 font-medium">Mobile</span>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">{screenWidth}px</div>
          </div>

          {/* Arrow */}
          <div className="text-neutral-400">→</div>

          {/* Required Devices */}
          <div className="flex space-x-3">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
                <Tablet className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Tablet</span>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">768px+</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
                <Monitor className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">Desktop</span>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">1024px+</div>
            </div>
          </div>
        </motion.div>

        {/* Explanation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6"
        >
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center">
            <Wrench className="w-4 h-4 mr-2" />
            Professional Engineering Tools
          </h3>
          <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
            {toolDescription} require precise input, detailed visualization, and complex calculations. 
            These tools are optimized for larger screens to ensure accuracy and professional workflow.
          </p>
        </motion.div>

        {/* Features Available on Mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-6"
        >
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-3">
            Available on Mobile:
          </h3>
          <div className="space-y-2">
            <div className="flex items-center text-xs text-neutral-600 dark:text-neutral-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Dashboard & Project Overview
            </div>
            <div className="flex items-center text-xs text-neutral-600 dark:text-neutral-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Project Management & Lists
            </div>
            <div className="flex items-center text-xs text-neutral-600 dark:text-neutral-300">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
              Reports & Export History
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-3"
        >
          {/* Primary Action - Go to Dashboard */}
          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Dashboard</span>
          </button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleViewProjects}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm transition-colors"
            >
              <span>Projects</span>
            </button>
            <button
              onClick={handleViewReports}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm transition-colors"
            >
              <span>Reports</span>
            </button>
          </div>
        </motion.div>

        {/* Footer Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-xs text-neutral-500 dark:text-neutral-400 mt-4 text-center"
        >
          Switch to a tablet, laptop, or desktop to access engineering tools
        </motion.p>
      </motion.div>
    </div>
  );
};

export default MobileToolRestriction;

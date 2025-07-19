"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Palette,
  Bell,
  Settings,
  Zap,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Play,
  FileText,
  Pencil,
  Calculator
} from 'lucide-react';
import { useToast } from '@/lib/hooks/useToaster';
import { useTheme } from '@/lib/hooks/useTheme';
import { Dock, DockItem } from '@/components/ui/Dock';

export default function DemoPage() {
  const toast = useToast();
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();
  const [demoCount, setDemoCount] = useState(0);

  const handleToastDemo = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: {
        title: "Operation Successful!",
        message: "Your HVAC calculation has been completed successfully.",
      },
      error: {
        title: "Calculation Error",
        message: "Unable to process duct sizing. Please check your input parameters.",
      },
      warning: {
        title: "Standards Warning",
        message: "Duct velocity exceeds SMACNA recommendations. Consider increasing size.",
      },
      info: {
        title: "Project Information",
        message: "Auto-save enabled. Your work is being saved automatically.",
      },
    };

    const msg = messages[type];
    toast[type](msg.title, msg.message, {
      actions: type === 'error' ? {
        label: 'Retry',
        onClick: () => console.log('Retry clicked'),
      } : undefined,
    });
  };

  const dockItems: DockItem[] = [
    {
      id: 'theme',
      icon: Palette,
      label: 'Toggle Theme',
      onClick: toggleTheme,
    },
    {
      id: 'notifications',
      icon: Bell,
      label: 'Notifications',
      badge: 3,
      onClick: () => handleToastDemo('info'),
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      onClick: () => handleToastDemo('warning'),
    },
    {
      id: 'performance',
      icon: Zap,
      label: 'Performance',
      onClick: () => handleToastDemo('success'),
    },
  ];

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
          SizeWise V1 Component Demo
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
          Experience the new glassmorphism UI with centered navigation, universal toaster notifications,
          and enhanced theme system.
        </p>
      </motion.div>

      {/* Demo Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

        {/* Theme Demo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-neutral-700/50 shadow-lg"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Palette className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">Theme System</h3>
          </div>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
            Current theme: <span className="font-medium">{theme}</span>
            {theme === 'system' && ` (${actualTheme})`}
          </p>

          <div className="space-y-2">
            <button
              onClick={() => setTheme('light')}
              className={`w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                theme === 'light'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/40 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-white/20'
              }`}
            >
              Light Mode
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/40 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-white/20'
              }`}
            >
              Dark Mode
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`w-full px-3 py-2 text-sm rounded-lg transition-colors ${
                theme === 'system'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/40 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-white/20'
              }`}
            >
              System
            </button>
          </div>
        </motion.div>

        {/* Toast Demo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-neutral-700/50 shadow-lg"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Bell className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">Toast Notifications</h3>
          </div>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
            Universal animated notification system with glassmorphism effects.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleToastDemo('success')}
              className="flex items-center justify-center space-x-2 px-3 py-2 text-sm rounded-lg bg-green-500/20 text-green-700 dark:text-green-300 hover:bg-green-500/30 transition-colors"
            >
              <CheckCircle size={16} />
              <span>Success</span>
            </button>
            <button
              onClick={() => handleToastDemo('error')}
              className="flex items-center justify-center space-x-2 px-3 py-2 text-sm rounded-lg bg-red-500/20 text-red-700 dark:text-red-300 hover:bg-red-500/30 transition-colors"
            >
              <AlertCircle size={16} />
              <span>Error</span>
            </button>
            <button
              onClick={() => handleToastDemo('warning')}
              className="flex items-center justify-center space-x-2 px-3 py-2 text-sm rounded-lg bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-500/30 transition-colors"
            >
              <AlertTriangle size={16} />
              <span>Warning</span>
            </button>
            <button
              onClick={() => handleToastDemo('info')}
              className="flex items-center justify-center space-x-2 px-3 py-2 text-sm rounded-lg bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-500/30 transition-colors"
            >
              <Info size={16} />
              <span>Info</span>
            </button>
          </div>
        </motion.div>

        {/* Dock Demo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-neutral-700/50 shadow-lg"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Play className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">Dock Component</h3>
          </div>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
            Interactive dock with hover effects and label animations.
          </p>

          <div className="flex justify-center">
            <Dock
              items={dockItems}
              orientation="horizontal"
              size="md"
              variant="glass"
            />
          </div>
        </motion.div>

        {/* Glassmorphism Demo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-neutral-700/50 shadow-lg md:col-span-2 lg:col-span-1"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Zap className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">Glassmorphism</h3>
          </div>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
            Frosted glass effects with backdrop blur and transparency.
          </p>

          <div className="space-y-3">
            <div className="h-12 bg-white/40 dark:bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 dark:border-neutral-700/50 flex items-center justify-center">
              <span className="text-sm text-neutral-600 dark:text-neutral-300">Glass Panel</span>
            </div>
            <div className="h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-lg border border-white/20 dark:border-neutral-700/50 flex items-center justify-center">
              <span className="text-sm text-neutral-600 dark:text-neutral-300">Gradient Glass</span>
            </div>
          </div>
        </motion.div>

        {/* Keyboard Shortcuts */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-neutral-700/50 shadow-lg md:col-span-2"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-indigo-500/20">
              <Settings className="w-5 h-5 text-indigo-500" />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">Keyboard Shortcuts</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600 dark:text-neutral-300">Project Properties</span>
              <kbd className="px-2 py-1 bg-white/40 dark:bg-white/10 rounded border border-white/20 dark:border-neutral-700/50 text-xs">
                ⌘ P
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600 dark:text-neutral-300">Toggle Theme</span>
              <kbd className="px-2 py-1 bg-white/40 dark:bg-white/10 rounded border border-white/20 dark:border-neutral-700/50 text-xs">
                Click Dock
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600 dark:text-neutral-300">Close Panels</span>
              <kbd className="px-2 py-1 bg-white/40 dark:bg-white/10 rounded border border-white/20 dark:border-neutral-700/50 text-xs">
                Esc
              </kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-600 dark:text-neutral-300">Navigation</span>
              <kbd className="px-2 py-1 bg-white/40 dark:bg-white/10 rounded border border-white/20 dark:border-neutral-700/50 text-xs">
                Hover Menu
              </kbd>
            </div>
          </div>
        </motion.div>

        {/* Phase 2 Demo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white/60 dark:bg-neutral-800/60 backdrop-blur-md rounded-xl p-6 border border-white/20 dark:border-neutral-700/50 shadow-lg md:col-span-3"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <h3 className="font-semibold text-neutral-900 dark:text-white">Phase 2: Core Workspace</h3>
          </div>

          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">
            Complete 3D workspace with Three.js canvas, PDF import, drawing tools, and calculation integration.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a
              href="/air-duct-sizer-v1"
              className="flex flex-col items-center p-3 rounded-lg bg-blue-500/20 text-blue-700 dark:text-blue-300 hover:bg-blue-500/30 transition-colors"
            >
              <Zap size={20} className="mb-2" />
              <span className="text-xs font-medium">3D Canvas</span>
            </a>
            <div className="flex flex-col items-center p-3 rounded-lg bg-green-500/20 text-green-700 dark:text-green-300">
              <FileText size={20} className="mb-2" />
              <span className="text-xs font-medium">PDF Import</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-orange-500/20 text-orange-700 dark:text-orange-300">
              <Pencil size={20} className="mb-2" />
              <span className="text-xs font-medium">Drawing Tools</span>
            </div>
            <div className="flex flex-col items-center p-3 rounded-lg bg-purple-500/20 text-purple-700 dark:text-purple-300">
              <Calculator size={20} className="mb-2" />
              <span className="text-xs font-medium">Calculations</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
            <p className="text-xs text-neutral-600 dark:text-neutral-300">
              <strong>Try it now:</strong> Visit the Air Duct Sizer V1 to experience the complete 3D workspace with
              interactive duct modeling, PDF plan import, and real-time HVAC calculations.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center mt-12 text-sm text-neutral-500 dark:text-neutral-400"
      >
        <p>SizeWise V1 • Phase 1 & 2 Implementation Complete</p>
        <p className="mt-1">Centered Navigation • Universal Toaster • Enhanced Theme System • Project Properties</p>
        <p className="mt-1">3D Canvas • PDF Import • Drawing Tools • Calculation Integration</p>
      </motion.div>
    </div>
  );
}

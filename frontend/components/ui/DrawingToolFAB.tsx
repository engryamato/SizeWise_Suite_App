"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DrawingMode = 'off' | 'on' | 'drawing';

interface DrawingToolFABProps {
  drawingMode: DrawingMode;
  onDrawingModeChange: (mode: DrawingMode) => void;
  onPropertyPanelOpen?: () => void;
  className?: string;
}

interface DuctProperties {
  shape: 'rectangular' | 'round';
  width?: number;
  height?: number;
  diameter?: number;
  material: string;
  insulation: boolean;
  insulationThickness?: number;
  name: string;
}

export const DrawingToolFAB: React.FC<DrawingToolFABProps> = ({
  drawingMode,
  onDrawingModeChange,
  onPropertyPanelOpen,
  className
}) => {
  const [showPropertyPanel, setShowPropertyPanel] = useState(false);
  const [ductProperties, setDuctProperties] = useState<DuctProperties>({
    shape: 'rectangular',
    width: 12,
    height: 8,
    material: 'Galvanized Steel',
    insulation: false,
    name: 'Duct-1'
  });

  const handleMainButtonClick = useCallback(() => {
    if (drawingMode === 'off') {
      // Toggle to ON mode - show property panel first
      setShowPropertyPanel(true);
      onPropertyPanelOpen?.();
      onDrawingModeChange('on');
    } else {
      // Toggle to OFF mode - auto-convert and exit drawing
      onDrawingModeChange('off');
      setShowPropertyPanel(false);
    }
  }, [drawingMode, onPropertyPanelOpen, onDrawingModeChange]);

  const handlePropertyConfirm = () => {
    setShowPropertyPanel(false);
    // Ready to start drawing with properties set
  };

  // Keyboard support for 'D' key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'd' || event.key === 'D') {
        // Only toggle if not typing in an input field
        if (event.target instanceof HTMLElement &&
            !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
          event.preventDefault();
          handleMainButtonClick();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingMode, showPropertyPanel, handleMainButtonClick]);

  const getTooltipText = () => {
    switch (drawingMode) {
      case 'off':
        return 'Draw Duct Lines (OFF) - Press D';
      case 'on':
        return 'Draw Duct Lines (ON) - Press D';
      case 'drawing':
        return 'Drawing in progress...';
      default:
        return 'Draw Duct Lines';
    }
  };

  const getButtonColor = () => {
    switch (drawingMode) {
      case 'off':
        return 'bg-neutral-400 hover:bg-neutral-500'; // Grey
      case 'on':
        return 'bg-orange-500 hover:bg-orange-600'; // Orange
      case 'drawing':
        return 'bg-orange-500 hover:bg-orange-600'; // Orange but dimmed
      default:
        return 'bg-neutral-400 hover:bg-neutral-500';
    }
  };

  const getButtonOpacity = () => {
    return drawingMode === 'drawing' ? 'opacity-60' : 'opacity-100';
  };

  return (
    <>
      {/* Duct Properties Panel */}
      <AnimatePresence>
        {showPropertyPanel && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 z-[60] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-6 w-80"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-neutral-800 dark:text-white text-lg">
                Duct Properties
              </h3>
              <button
                type="button"
                onClick={() => setShowPropertyPanel(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                title="Close properties panel"
                aria-label="Close properties panel"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Duct Shape */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Duct Shape
                </label>
                <div className="flex space-x-3">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="shape"
                      value="rectangular"
                      checked={ductProperties.shape === 'rectangular'}
                      onChange={(e) => setDuctProperties(prev => ({ ...prev, shape: e.target.value as 'rectangular' | 'round' }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Rectangular</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="shape"
                      value="round"
                      checked={ductProperties.shape === 'round'}
                      onChange={(e) => setDuctProperties(prev => ({ ...prev, shape: e.target.value as 'rectangular' | 'round' }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Round</span>
                  </label>
                </div>
              </div>

              {/* Dimensions */}
              {ductProperties.shape === 'rectangular' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Width (in)
                    </label>
                    <input
                      type="number"
                      value={ductProperties.width || ''}
                      onChange={(e) => setDuctProperties(prev => ({ ...prev, width: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Height (in)
                    </label>
                    <input
                      type="number"
                      value={ductProperties.height || ''}
                      onChange={(e) => setDuctProperties(prev => ({ ...prev, height: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                      placeholder="8"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Diameter (in)
                  </label>
                  <input
                    type="number"
                    value={ductProperties.diameter || ''}
                    onChange={(e) => setDuctProperties(prev => ({ ...prev, diameter: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                    placeholder="12"
                  />
                </div>
              )}

              {/* Material Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Material Type
                </label>
                <select
                  value={ductProperties.material}
                  onChange={(e) => setDuctProperties(prev => ({ ...prev, material: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                >
                  <option value="Galvanized Steel">Galvanized Steel</option>
                  <option value="Aluminum">Aluminum</option>
                  <option value="Stainless Steel">Stainless Steel</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>

              {/* Insulation */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={ductProperties.insulation}
                    onChange={(e) => setDuctProperties(prev => ({ ...prev, insulation: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    Insulation
                  </span>
                </label>
                {ductProperties.insulation && (
                  <div className="mt-2">
                    <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1">
                      Thickness (in)
                    </label>
                    <input
                      type="number"
                      value={ductProperties.insulationThickness || ''}
                      onChange={(e) => setDuctProperties(prev => ({ ...prev, insulationThickness: Number(e.target.value) }))}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                      placeholder="1"
                      step="0.5"
                    />
                  </div>
                )}
              </div>

              {/* Duct Name */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Duct Name/Tag
                </label>
                <input
                  type="text"
                  value={ductProperties.name}
                  onChange={(e) => setDuctProperties(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  placeholder="Duct-1"
                />
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                type="button"
                onClick={handlePropertyConfirm}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Start Drawing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPropertyPanel(false);
                  onDrawingModeChange('off');
                }}
                className="px-4 py-2 bg-neutral-500 text-white rounded-lg hover:bg-neutral-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        type="button"
        onClick={handleMainButtonClick}
        className={cn(
          "fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full",
          getButtonColor(),
          getButtonOpacity(),
          "text-white shadow-2xl",
          "flex items-center justify-center transition-all duration-150",
          "border-2 border-white/20",
          "focus:outline-none focus:ring-2 focus:ring-orange-500/50",
          className
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={getTooltipText()}
        aria-label={getTooltipText()}
      >
        <Pencil className="w-6 h-6" />
      </motion.button>

      {/* Tool Indicator Tooltip */}
      {!showPropertyPanel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 right-6 z-[60] bg-black/80 text-white px-3 py-1 rounded-lg text-sm font-medium pointer-events-none"
        >
          {getTooltipText()}
        </motion.div>
      )}
    </>
  );
};

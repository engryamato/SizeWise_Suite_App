"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pencil,
  X,
  Settings,
  Fan
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUnitsDisplay } from '@/hooks/useUnitsDisplay';

export type DrawingMode = 'off' | 'duct' | 'equipment' | 'drawing';

interface DrawingToolFABProps {
  drawingMode: DrawingMode;
  onDrawingModeChange: (mode: DrawingMode) => void;
  onPropertyPanelOpen?: () => void;
  className?: string;
  ductProperties: DuctProperties;
  onDuctPropertiesChange: (properties: DuctProperties) => void;
  // Equipment placement functionality
  onEquipmentPlace?: (position: { x: number; y: number; z: number }) => void;
}

export interface DuctProperties {
  shape: 'rectangular' | 'round';
  width?: number;
  height?: number;
  diameter?: number;
  material: string;
  insulation: boolean;
  insulationThickness?: number;
  name: string; // Keep for backward compatibility, but will be auto-generated
  ductType: 'supply' | 'return' | 'exhaust'; // Duct type selection
}

export const DrawingToolFAB: React.FC<DrawingToolFABProps> = ({
  drawingMode,
  onDrawingModeChange,
  onPropertyPanelOpen,
  className,
  ductProperties,
  onDuctPropertiesChange,
  onEquipmentPlace
}) => {
  const { getUnitLabel } = useUnitsDisplay();
  const [showPropertyPanel, setShowPropertyPanel] = useState(false);

  const handleMainButtonClick = useCallback(() => {
    if (drawingMode === 'off') {
      // Toggle to duct drawing mode - show property panel first
      setShowPropertyPanel(true);
      onPropertyPanelOpen?.();
      onDrawingModeChange('duct');
    } else {
      // Toggle to OFF mode - auto-convert and exit drawing
      onDrawingModeChange('off');
      setShowPropertyPanel(false);
    }
  }, [drawingMode, onPropertyPanelOpen, onDrawingModeChange]);

  const handleEquipmentButtonClick = useCallback(() => {
    if (drawingMode === 'equipment') {
      // Turn off equipment mode
      onDrawingModeChange('off');
    } else {
      // Turn on equipment mode
      onDrawingModeChange('equipment');
      setShowPropertyPanel(false);
    }
  }, [drawingMode, onDrawingModeChange]);

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
      case 'duct':
        return 'Draw Duct Lines (ON) - Press D';
      case 'equipment':
        return 'Equipment Mode (ON) - Click to place equipment';
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
      case 'duct':
        return 'bg-orange-500 hover:bg-orange-600'; // Orange for duct mode
      case 'equipment':
        return 'bg-blue-500 hover:bg-blue-600'; // Blue for equipment mode
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
            className="fixed bottom-32 right-6 z-[60] bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-6 w-80"
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
                      onChange={(e) => onDuctPropertiesChange({ ...ductProperties, shape: e.target.value as 'rectangular' | 'round' })}
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
                      onChange={(e) => onDuctPropertiesChange({ ...ductProperties, shape: e.target.value as 'rectangular' | 'round' })}
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
                      Width ({getUnitLabel('length', true)})
                    </label>
                    <input
                      type="number"
                      value={ductProperties.width || ''}
                      onChange={(e) => onDuctPropertiesChange({ ...ductProperties, width: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                      Height ({getUnitLabel('length', true)})
                    </label>
                    <input
                      type="number"
                      value={ductProperties.height || ''}
                      onChange={(e) => onDuctPropertiesChange({ ...ductProperties, height: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                      placeholder="8"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Diameter ({getUnitLabel('length', true)})
                  </label>
                  <input
                    type="number"
                    value={ductProperties.diameter || ''}
                    onChange={(e) => onDuctPropertiesChange({ ...ductProperties, diameter: Number(e.target.value) })}
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
                  onChange={(e) => onDuctPropertiesChange({ ...ductProperties, material: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  title="Material Type"
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
                    onChange={(e) => onDuctPropertiesChange({ ...ductProperties, insulation: e.target.checked })}
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
                      onChange={(e) => onDuctPropertiesChange({ ...ductProperties, insulationThickness: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                      placeholder="1"
                      step="0.5"
                    />
                  </div>
                )}
              </div>

              {/* Duct Type Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Duct Type
                </label>
                <select
                  value={ductProperties.ductType}
                  onChange={(e) => onDuctPropertiesChange({
                    ...ductProperties,
                    ductType: e.target.value as 'supply' | 'return' | 'exhaust'
                  })}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                >
                  <option value="supply">Supply Air</option>
                  <option value="return">Return Air</option>
                  <option value="exhaust">Exhaust Air</option>
                </select>
              </div>

              {/* Duct Name - Hidden, auto-generated */}
              {/* Note: Duct names are now auto-generated using system naming convention */}
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

      {/* Equipment FAB Button */}
      <motion.button
        type="button"
        onClick={handleEquipmentButtonClick}
        className={cn(
          "fixed bottom-32 right-6 z-[60] w-12 h-12 rounded-full",
          drawingMode === 'equipment'
            ? 'bg-blue-500 hover:bg-blue-600'
            : 'bg-neutral-400 hover:bg-neutral-500',
          "text-white shadow-xl",
          "flex items-center justify-center transition-all duration-150",
          "border-2 border-white/20",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title={drawingMode === 'equipment' ? 'Equipment Mode (ON)' : 'Equipment Mode (OFF)'}
        aria-label={drawingMode === 'equipment' ? 'Equipment Mode (ON)' : 'Equipment Mode (OFF)'}
      >
        <Fan className="w-5 h-5" />
      </motion.button>

      {/* Main FAB Button */}
      <motion.button
        type="button"
        onClick={handleMainButtonClick}
        className={cn(
          "fixed bottom-14 right-6 z-[60] w-14 h-14 rounded-full",
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
        {drawingMode === 'equipment' ? <Fan className="w-6 h-6" /> : <Pencil className="w-6 h-6" />}
      </motion.button>

      {/* Tool Indicator Tooltip */}
      {!showPropertyPanel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-28 right-6 z-[60] bg-black/80 text-white px-3 py-1 rounded-lg text-sm font-medium pointer-events-none"
        >
          {getTooltipText()}
        </motion.div>
      )}
    </>
  );
};

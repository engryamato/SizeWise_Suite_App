"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Edit,
  Copy,
  Trash2,
  RotateCw,
  Move,
  Layers,
  Palette,
  Settings,
  Ruler,
  Wind,
  Thermometer,
  Zap,
  Info,
  Wrench
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ElementType = 'room' | 'duct' | 'equipment' | 'fitting' | 'annotation' | 'group';

export interface ElementProperties {
  id: string;
  type: ElementType;
  name: string;
  position: { x: number; y: number; z?: number };
  dimensions?: { width: number; height: number; depth?: number };
  rotation?: number;
  color?: string;
  strokeWidth?: number;
  opacity?: number;
  // Room specific
  area?: number;
  volume?: number;
  loadCooling?: number;
  loadHeating?: number;
  airflow?: number;
  // Duct specific
  ductType?: 'supply' | 'return' | 'exhaust';
  material?: string;
  insulation?: string;
  velocity?: number;
  pressureDrop?: number;
  // Equipment specific
  equipmentType?: string;
  capacity?: number;
  power?: number;
  efficiency?: number;
  // Fitting specific
  fittingType?: string;
  angle?: number;
  bendRadius?: number;
  diameter?: number;
  gauge?: string;
  pressureLoss?: number;
  fabricationType?: 'standard' | 'custom';
  smacnaCompliant?: boolean;
}

interface ContextPropertyPanelProps {
  isVisible: boolean;
  selectedElement: ElementProperties | null;
  position: { x: number; y: number };
  onClose: () => void;
  onElementUpdate: (id: string, properties: Partial<ElementProperties>) => void;
  onElementDelete: (id: string) => void;
  onElementCopy: (id: string) => void;
  className?: string;
}

const InputField: React.FC<{
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  unit?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, type = 'text', unit, disabled = false }) => (
  <div className="space-y-1">
    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
      {label}
    </label>
    <div className="flex items-center space-x-2">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "flex-1 px-2 py-1 text-sm rounded border border-white/20 bg-white/10 backdrop-blur-sm",
          "text-neutral-800 dark:text-white placeholder-neutral-500",
          "focus:outline-none focus:ring-1 focus:ring-orange-500/50",
          "transition-colors",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      {unit && (
        <span className="text-xs text-neutral-500 dark:text-neutral-400 min-w-fit">
          {unit}
        </span>
      )}
    </div>
  </div>
);

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}> = ({ icon, label, onClick, variant = 'default' }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
      variant === 'default' && "bg-white/10 hover:bg-white/20 text-neutral-700 dark:text-neutral-300",
      variant === 'danger' && "bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400"
    )}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export const ContextPropertyPanel: React.FC<ContextPropertyPanelProps> = ({
  isVisible,
  selectedElement,
  position,
  onClose,
  onElementUpdate,
  onElementDelete,
  onElementCopy,
  className
}) => {
  const [activeTab, setActiveTab] = useState<'properties' | 'style' | 'data'>('properties');

  if (!isVisible || !selectedElement) return null;

  const handlePropertyChange = (key: keyof ElementProperties, value: any) => {
    onElementUpdate(selectedElement.id, { [key]: value });
  };

  const getElementIcon = () => {
    switch (selectedElement.type) {
      case 'room': return <Layers className="w-4 h-4" />;
      case 'duct': return <Wind className="w-4 h-4" />;
      case 'equipment': return <Zap className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getElementTypeColor = () => {
    switch (selectedElement.type) {
      case 'room': return 'text-blue-500';
      case 'duct': return 'text-green-500';
      case 'equipment': return 'text-purple-500';
      default: return 'text-neutral-500';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        style={{
          left: Math.min(position.x, window.innerWidth - 320),
          top: Math.min(position.y, window.innerHeight - 400),
        }}
        className={cn(
          "fixed z-50 w-80 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-lg",
          "rounded-2xl border border-white/20 shadow-2xl",
          "max-h-96 overflow-hidden flex flex-col",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className={cn("p-2 rounded-lg bg-white/10", getElementTypeColor())}>
              {getElementIcon()}
            </div>
            <div>
              <h3 className="font-semibold text-neutral-800 dark:text-white">
                {selectedElement.name || `${selectedElement.type} ${selectedElement.id.slice(0, 8)}`}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 capitalize">
                {selectedElement.type}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10">
          {[
            { id: 'properties', label: 'Properties', icon: <Settings className="w-4 h-4" /> },
            { id: 'style', label: 'Style', icon: <Palette className="w-4 h-4" /> },
            { id: 'data', label: 'Data', icon: <Info className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-b-2 border-orange-500"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-white/5"
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'properties' && (
            <div className="space-y-4">
              <InputField
                label="Name"
                value={selectedElement.name || ''}
                onChange={(value) => handlePropertyChange('name', value)}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="X Position"
                  value={selectedElement.position.x}
                  onChange={(value) => handlePropertyChange('position', { 
                    ...selectedElement.position, 
                    x: parseFloat(value) || 0 
                  })}
                  type="number"
                  unit="ft"
                />
                <InputField
                  label="Y Position"
                  value={selectedElement.position.y}
                  onChange={(value) => handlePropertyChange('position', { 
                    ...selectedElement.position, 
                    y: parseFloat(value) || 0 
                  })}
                  type="number"
                  unit="ft"
                />
              </div>

              {selectedElement.dimensions && (
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Width"
                    value={selectedElement.dimensions.width}
                    onChange={(value) => handlePropertyChange('dimensions', { 
                      ...selectedElement.dimensions!, 
                      width: parseFloat(value) || 0 
                    })}
                    type="number"
                    unit="ft"
                  />
                  <InputField
                    label="Height"
                    value={selectedElement.dimensions.height}
                    onChange={(value) => handlePropertyChange('dimensions', { 
                      ...selectedElement.dimensions!, 
                      height: parseFloat(value) || 0 
                    })}
                    type="number"
                    unit="ft"
                  />
                </div>
              )}

              {selectedElement.rotation !== undefined && (
                <InputField
                  label="Rotation"
                  value={selectedElement.rotation}
                  onChange={(value) => handlePropertyChange('rotation', parseFloat(value) || 0)}
                  type="number"
                  unit="°"
                />
              )}
            </div>
          )}

          {activeTab === 'style' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={selectedElement.color || '#3b82f6'}
                    onChange={(e) => handlePropertyChange('color', e.target.value)}
                    className="w-8 h-8 rounded border border-white/20"
                  />
                  <input
                    type="text"
                    value={selectedElement.color || '#3b82f6'}
                    onChange={(e) => handlePropertyChange('color', e.target.value)}
                    className="flex-1 px-2 py-1 text-sm rounded border border-white/20 bg-white/10 backdrop-blur-sm text-neutral-800 dark:text-white"
                  />
                </div>
              </div>

              <InputField
                label="Stroke Width"
                value={selectedElement.strokeWidth || 2}
                onChange={(value) => handlePropertyChange('strokeWidth', parseFloat(value) || 1)}
                type="number"
                unit="px"
              />

              <InputField
                label="Opacity"
                value={selectedElement.opacity || 1}
                onChange={(value) => handlePropertyChange('opacity', Math.max(0, Math.min(1, parseFloat(value) || 1)))}
                type="number"
                unit="%"
              />
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              {selectedElement.type === 'room' && (
                <>
                  <InputField
                    label="Area"
                    value={selectedElement.area || 0}
                    onChange={(value) => handlePropertyChange('area', parseFloat(value) || 0)}
                    type="number"
                    unit="sq ft"
                  />
                  <InputField
                    label="Cooling Load"
                    value={selectedElement.loadCooling || 0}
                    onChange={(value) => handlePropertyChange('loadCooling', parseFloat(value) || 0)}
                    type="number"
                    unit="BTU/hr"
                  />
                  <InputField
                    label="Heating Load"
                    value={selectedElement.loadHeating || 0}
                    onChange={(value) => handlePropertyChange('loadHeating', parseFloat(value) || 0)}
                    type="number"
                    unit="BTU/hr"
                  />
                  <InputField
                    label="Airflow"
                    value={selectedElement.airflow || 0}
                    onChange={(value) => handlePropertyChange('airflow', parseFloat(value) || 0)}
                    type="number"
                    unit="CFM"
                  />
                </>
              )}

              {selectedElement.type === 'duct' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                      Duct Type
                    </label>
                    <select
                      value={selectedElement.ductType || 'supply'}
                      onChange={(e) => handlePropertyChange('ductType', e.target.value)}
                      className="w-full px-2 py-1 text-sm rounded border border-white/20 bg-white/10 backdrop-blur-sm text-neutral-800 dark:text-white"
                    >
                      <option value="supply">Supply</option>
                      <option value="return">Return</option>
                      <option value="exhaust">Exhaust</option>
                    </select>
                  </div>
                  <InputField
                    label="Velocity"
                    value={selectedElement.velocity || 0}
                    onChange={(value) => handlePropertyChange('velocity', parseFloat(value) || 0)}
                    type="number"
                    unit="FPM"
                  />
                  <InputField
                    label="Pressure Drop"
                    value={selectedElement.pressureDrop || 0}
                    onChange={(value) => handlePropertyChange('pressureDrop', parseFloat(value) || 0)}
                    type="number"
                    unit="in. w.g."
                  />
                </>
              )}

              {selectedElement.type === 'equipment' && (
                <>
                  <InputField
                    label="Capacity"
                    value={selectedElement.capacity || 0}
                    onChange={(value) => handlePropertyChange('capacity', parseFloat(value) || 0)}
                    type="number"
                    unit="CFM"
                  />
                  <InputField
                    label="Power"
                    value={selectedElement.power || 0}
                    onChange={(value) => handlePropertyChange('power', parseFloat(value) || 0)}
                    type="number"
                    unit="kW"
                  />
                </>
              )}

              {selectedElement.type === 'fitting' && (
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <Wrench className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                      Fitting Properties
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        Fitting Type
                      </label>
                      <select
                        value={selectedElement.fittingType || 'elbow'}
                        onChange={(e) => handlePropertyChange('fittingType', e.target.value)}
                        className="w-full px-2 py-1 text-sm rounded border border-white/20 bg-white/10 backdrop-blur-sm text-neutral-800 dark:text-white"
                        title="Select fitting type"
                      >
                        <option value="elbow">Elbow</option>
                        <option value="tee">Tee</option>
                        <option value="wye">Wye</option>
                        <option value="reducer">Reducer</option>
                        <option value="transition">Transition</option>
                        <option value="cap">Cap</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
                        Fabrication
                      </label>
                      <select
                        value={selectedElement.fabricationType || 'standard'}
                        onChange={(e) => handlePropertyChange('fabricationType', e.target.value)}
                        className="w-full px-2 py-1 text-sm rounded border border-white/20 bg-white/10 backdrop-blur-sm text-neutral-800 dark:text-white"
                        title="Select fabrication type"
                      >
                        <option value="standard">Standard</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>

                  <InputField
                    label="Angle"
                    value={selectedElement.angle || 90}
                    onChange={(value) => handlePropertyChange('angle', parseFloat(value) || 90)}
                    type="number"
                    unit="degrees"
                  />

                  <InputField
                    label="Bend Radius"
                    value={selectedElement.bendRadius || 12}
                    onChange={(value) => handlePropertyChange('bendRadius', parseFloat(value) || 12)}
                    type="number"
                    unit="inches"
                  />

                  <InputField
                    label="Diameter"
                    value={selectedElement.diameter || 12}
                    onChange={(value) => handlePropertyChange('diameter', parseFloat(value) || 12)}
                    type="number"
                    unit="inches"
                  />

                  <InputField
                    label="Gauge"
                    value={selectedElement.gauge || '26'}
                    onChange={(value) => handlePropertyChange('gauge', value)}
                    type="text"
                  />

                  <InputField
                    label="Pressure Loss"
                    value={selectedElement.pressureLoss || 0}
                    onChange={(value) => handlePropertyChange('pressureLoss', parseFloat(value) || 0)}
                    type="number"
                    unit="in. w.g."
                  />

                  <div className="flex items-center gap-2 p-2 rounded bg-white/5">
                    <Zap className={`w-4 h-4 ${selectedElement.smacnaCompliant ? 'text-green-500' : 'text-yellow-500'}`} />
                    <span className="text-xs text-neutral-600 dark:text-neutral-400">
                      {selectedElement.smacnaCompliant ? 'SMACNA Compliant' : 'Check SMACNA Compliance'}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-white/10">
          <div className="flex space-x-2">
            <ActionButton
              icon={<Copy className="w-4 h-4" />}
              label="Copy"
              onClick={() => onElementCopy(selectedElement.id)}
            />
            <ActionButton
              icon={<Trash2 className="w-4 h-4" />}
              label="Delete"
              onClick={() => onElementDelete(selectedElement.id)}
              variant="danger"
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

"use client";

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pencil, 
  Square, 
  Circle, 
  Move, 
  RotateCw,
  Copy,
  Trash2,
  Undo,
  Redo,
  Ruler,
  MousePointer,
  Zap,
  Wind,
  ArrowRight,
  Settings
} from 'lucide-react';
import { Vector3 } from 'three';
import { cn } from '@/lib/utils';
import { useToast } from '@/lib/hooks/useToaster';

export type DrawingMode = 
  | 'select' 
  | 'line' 
  | 'rectangle' 
  | 'circle' 
  | 'duct' 
  | 'equipment' 
  | 'measure'
  | 'move'
  | 'rotate';

export type DuctType = 'supply' | 'return' | 'exhaust';
export type EquipmentType = 'ahu' | 'vav' | 'diffuser' | 'grille' | 'damper' | 'fan';

export interface DrawingElement {
  id: string;
  type: 'line' | 'rectangle' | 'circle' | 'duct' | 'equipment';
  points: Vector3[];
  properties: {
    color?: string;
    strokeWidth?: number;
    fillColor?: string;
    ductType?: DuctType;
    equipmentType?: EquipmentType;
    width?: number;
    height?: number;
    cfm?: number;
    label?: string;
  };
  metadata: {
    created: Date;
    modified: Date;
    layer: string;
  };
}

interface DrawingToolsProps {
  mode: DrawingMode;
  onModeChange: (mode: DrawingMode) => void;
  onElementAdd?: (element: DrawingElement) => void;
  onElementUpdate?: (id: string, element: Partial<DrawingElement>) => void;
  onElementDelete?: (id: string) => void;
  selectedElements?: string[];
  onSelectionChange?: (elementIds: string[]) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  className?: string;
}

interface ToolButton {
  id: DrawingMode;
  icon: any;
  label: string;
  shortcut?: string;
  group: 'selection' | 'drawing' | 'duct' | 'actions';
}

const DRAWING_TOOLS: ToolButton[] = [
  // Selection Tools
  { id: 'select', icon: MousePointer, label: 'Select', shortcut: 'V', group: 'selection' },
  { id: 'move', icon: Move, label: 'Move', shortcut: 'M', group: 'selection' },
  { id: 'rotate', icon: RotateCw, label: 'Rotate', shortcut: 'R', group: 'selection' },
  
  // Drawing Tools
  { id: 'line', icon: Pencil, label: 'Line', shortcut: 'L', group: 'drawing' },
  { id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'U', group: 'drawing' },
  { id: 'circle', icon: Circle, label: 'Circle', shortcut: 'C', group: 'drawing' },
  
  // HVAC Tools
  { id: 'duct', icon: Wind, label: 'Duct', shortcut: 'D', group: 'duct' },
  { id: 'equipment', icon: Zap, label: 'Equipment', shortcut: 'E', group: 'duct' },
  
  // Measurement
  { id: 'measure', icon: Ruler, label: 'Measure', shortcut: 'T', group: 'actions' },
];

const DuctTypeSelector: React.FC<{
  value: DuctType;
  onChange: (type: DuctType) => void;
}> = ({ value, onChange }) => {
  const ductTypes: { type: DuctType; label: string; color: string }[] = [
    { type: 'supply', label: 'Supply', color: 'bg-green-500' },
    { type: 'return', label: 'Return', color: 'bg-amber-500' },
    { type: 'exhaust', label: 'Exhaust', color: 'bg-red-500' },
  ];

  return (
    <div className="flex space-x-1">
      {ductTypes.map((duct) => (
        <button
          key={duct.type}
          type="button"
          onClick={() => onChange(duct.type)}
          className={cn(
            "px-3 py-1 text-xs rounded-md transition-colors",
            value === duct.type
              ? `${duct.color} text-white`
              : "bg-white/40 dark:bg-white/10 text-neutral-700 dark:text-neutral-300 hover:bg-white/60 dark:hover:bg-white/20"
          )}
        >
          {duct.label}
        </button>
      ))}
    </div>
  );
};

const EquipmentTypeSelector: React.FC<{
  value: EquipmentType;
  onChange: (type: EquipmentType) => void;
}> = ({ value, onChange }) => {
  const equipmentTypes: { type: EquipmentType; label: string }[] = [
    { type: 'ahu', label: 'AHU' },
    { type: 'vav', label: 'VAV' },
    { type: 'diffuser', label: 'Diffuser' },
    { type: 'grille', label: 'Grille' },
    { type: 'damper', label: 'Damper' },
    { type: 'fan', label: 'Fan' },
  ];

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as EquipmentType)}
      className="px-2 py-1 text-xs rounded-md bg-white/40 dark:bg-white/10 border border-white/20 dark:border-neutral-700/50 text-neutral-700 dark:text-neutral-300"
    >
      {equipmentTypes.map((equipment) => (
        <option key={equipment.type} value={equipment.type}>
          {equipment.label}
        </option>
      ))}
    </select>
  );
};

const ToolGroup: React.FC<{
  title: string;
  tools: ToolButton[];
  activeMode: DrawingMode;
  onModeChange: (mode: DrawingMode) => void;
}> = ({ title, tools, activeMode, onModeChange }) => {
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
        {title}
      </h4>
      <div className="grid grid-cols-3 gap-1">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeMode === tool.id;
          
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => onModeChange(tool.id)}
              className={cn(
                "p-2 rounded-md transition-all duration-200 group relative",
                "hover:bg-white/40 dark:hover:bg-white/10",
                isActive && "bg-blue-500 text-white shadow-lg"
              )}
              title={`${tool.label} ${tool.shortcut ? `(${tool.shortcut})` : ''}`}
            >
              <Icon 
                size={18} 
                className={cn(
                  "transition-colors",
                  isActive ? "text-white" : "text-neutral-600 dark:text-neutral-300"
                )} 
              />
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-neutral-900 dark:bg-neutral-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {tool.label}
                {tool.shortcut && <span className="ml-1 text-neutral-300">({tool.shortcut})</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const DrawingTools: React.FC<DrawingToolsProps> = ({
  mode,
  onModeChange,
  onElementAdd,
  onElementUpdate,
  onElementDelete,
  selectedElements = [],
  onSelectionChange,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  className,
}) => {
  const [ductType, setDuctType] = useState<DuctType>('supply');
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('diffuser');
  const [isExpanded, setIsExpanded] = useState(true);
  const toast = useToast();

  // Group tools by category
  const toolGroups = {
    selection: DRAWING_TOOLS.filter(tool => tool.group === 'selection'),
    drawing: DRAWING_TOOLS.filter(tool => tool.group === 'drawing'),
    duct: DRAWING_TOOLS.filter(tool => tool.group === 'duct'),
    actions: DRAWING_TOOLS.filter(tool => tool.group === 'actions'),
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const tool = DRAWING_TOOLS.find(t => t.shortcut?.toLowerCase() === e.key.toLowerCase());
      if (tool) {
        e.preventDefault();
        onModeChange(tool.id);
      }

      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo?.();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        onRedo?.();
      }

      // Delete selected elements
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElements.length > 0) {
          e.preventDefault();
          selectedElements.forEach(id => onElementDelete?.(id));
          onSelectionChange?.([]);
          toast.info('Elements Deleted', `Deleted ${selectedElements.length} element(s).`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, selectedElements, onModeChange, onUndo, onRedo, onElementDelete, onSelectionChange, toast]);

  const handleCopyElements = () => {
    if (selectedElements.length > 0) {
      // In a real implementation, this would copy elements to clipboard
            // Safe: Only fires on copy elements action, not in render/effect/loop
      toast.success('Elements Copied', `Copied ${selectedElements.length} element(s).`);
    }
  };

  const handleDeleteElements = () => {
    if (selectedElements.length > 0) {
      selectedElements.forEach(id => onElementDelete?.(id));
      onSelectionChange?.([]);
      // Safe: Only fires on delete elements action, not in render/effect/loop
      toast.info('Elements Deleted', `Deleted ${selectedElements.length} element(s).`);
    }
  };

  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={cn(
        "fixed left-4 top-1/2 -translate-y-1/2 z-30",
        "bg-white/80 dark:bg-neutral-800/80 backdrop-blur-md",
        "border border-white/20 dark:border-neutral-700/50",
        "rounded-xl shadow-lg p-4 w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-neutral-900 dark:text-white">Drawing Tools</h3>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 rounded-md hover:bg-white/40 dark:hover:bg-white/10 transition-colors"
        >
          <Settings size={16} />
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="space-y-6"
          >
            {/* Selection Tools */}
            <ToolGroup
              title="Selection"
              tools={toolGroups.selection}
              activeMode={mode}
              onModeChange={onModeChange}
            />

            {/* Drawing Tools */}
            <ToolGroup
              title="Drawing"
              tools={toolGroups.drawing}
              activeMode={mode}
              onModeChange={onModeChange}
            />

            {/* HVAC Tools */}
            <ToolGroup
              title="HVAC"
              tools={toolGroups.duct}
              activeMode={mode}
              onModeChange={onModeChange}
            />

            {/* Duct Type Selector */}
            {mode === 'duct' && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                  Duct Type
                </h4>
                <DuctTypeSelector value={ductType} onChange={setDuctType} />
              </div>
            )}

            {/* Equipment Type Selector */}
            {mode === 'equipment' && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                  Equipment Type
                </h4>
                <EquipmentTypeSelector value={equipmentType} onChange={setEquipmentType} />
              </div>
            )}

            {/* Actions */}
            <ToolGroup
              title="Actions"
              tools={toolGroups.actions}
              activeMode={mode}
              onModeChange={onModeChange}
            />

            {/* Element Actions */}
            {selectedElements.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                  Selected ({selectedElements.length})
                </h4>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={handleCopyElements}
                    className="flex-1 p-2 rounded-md bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 transition-colors"
                    title="Copy (Ctrl+C)"
                  >
                    <Copy size={16} className="mx-auto" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteElements}
                    className="flex-1 p-2 rounded-md bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                    title="Delete (Del)"
                  >
                    <Trash2 size={16} className="mx-auto" />
                  </button>
                </div>
              </div>
            )}

            {/* Undo/Redo */}
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
                History
              </h4>
              <div className="flex space-x-1">
                <button
                  type="button"
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="flex-1 p-2 rounded-md bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo size={16} className="mx-auto" />
                </button>
                <button
                  type="button"
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="flex-1 p-2 rounded-md bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo size={16} className="mx-auto" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

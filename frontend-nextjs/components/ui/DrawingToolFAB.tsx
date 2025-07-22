"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
  X, 
  Square, 
  Circle, 
  Minus, 
  Type, 
  Move, 
  RotateCw,
  Trash2,
  Copy,
  Settings,
  Palette,
  Layers
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type DrawingTool = 
  | 'select' 
  | 'rectangle' 
  | 'circle' 
  | 'line' 
  | 'text' 
  | 'move' 
  | 'rotate' 
  | 'delete' 
  | 'copy';

interface DrawingToolFABProps {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onPropertyPanelOpen?: () => void;
  className?: string;
}

interface ToolOption {
  id: DrawingTool;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  color?: string;
}

const toolOptions: ToolOption[] = [
  {
    id: 'select',
    label: 'Select',
    icon: <Move className="w-5 h-5" />,
    shortcut: 'V',
    color: 'text-blue-500'
  },
  {
    id: 'rectangle',
    label: 'Rectangle',
    icon: <Square className="w-5 h-5" />,
    shortcut: 'R',
    color: 'text-green-500'
  },
  {
    id: 'circle',
    label: 'Circle',
    icon: <Circle className="w-5 h-5" />,
    shortcut: 'C',
    color: 'text-purple-500'
  },
  {
    id: 'line',
    label: 'Line',
    icon: <Minus className="w-5 h-5" />,
    shortcut: 'L',
    color: 'text-orange-500'
  },
  {
    id: 'text',
    label: 'Text',
    icon: <Type className="w-5 h-5" />,
    shortcut: 'T',
    color: 'text-pink-500'
  },
  {
    id: 'rotate',
    label: 'Rotate',
    icon: <RotateCw className="w-5 h-5" />,
    shortcut: 'Shift+R',
    color: 'text-indigo-500'
  },
  {
    id: 'copy',
    label: 'Copy',
    icon: <Copy className="w-5 h-5" />,
    shortcut: 'Ctrl+C',
    color: 'text-cyan-500'
  },
  {
    id: 'delete',
    label: 'Delete',
    icon: <Trash2 className="w-5 h-5" />,
    shortcut: 'Del',
    color: 'text-red-500'
  }
];

export const DrawingToolFAB: React.FC<DrawingToolFABProps> = ({
  activeTool,
  onToolChange,
  onPropertyPanelOpen,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPropertyPanel, setShowPropertyPanel] = useState(false);

  const activeToolOption = toolOptions.find(tool => tool.id === activeTool);

  const handleMainButtonClick = () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      // First click - show property panel
      if (!showPropertyPanel) {
        setShowPropertyPanel(true);
        onPropertyPanelOpen?.();
      } else {
        // Second click - expand tools
        setIsExpanded(true);
      }
    }
  };

  const handleToolSelect = (tool: DrawingTool) => {
    onToolChange(tool);
    setIsExpanded(false);
    setShowPropertyPanel(false);
  };

  return (
    <>
      {/* Property Panel Overlay */}
      <AnimatePresence>
        {showPropertyPanel && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 z-[60] bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-4 w-64"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-neutral-800 dark:text-white">
                Drawing Properties
              </h3>
              <button
                type="button"
                onClick={() => setShowPropertyPanel(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Palette className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Stroke Color
                </span>
                <div className="w-6 h-6 bg-blue-500 rounded border border-white/20"></div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Layers className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Line Width
                </span>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  defaultValue="2" 
                  className="flex-1"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <Settings className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Snap to Grid
                </span>
                <input type="checkbox" defaultChecked className="ml-auto" />
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="w-full px-3 py-2 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors text-sm font-medium"
              >
                Show All Tools
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tool Selection Menu */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-24 right-6 z-[60] bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg rounded-2xl border border-white/20 shadow-2xl p-2"
          >
            <div className="grid grid-cols-2 gap-2 w-48">
              {toolOptions.map((tool) => (
                <motion.button
                  key={tool.id}
                  type="button"
                  onClick={() => handleToolSelect(tool.id)}
                  className={cn(
                    "flex flex-col items-center space-y-1 p-3 rounded-xl transition-colors",
                    "hover:bg-white/20 dark:hover:bg-white/10",
                    activeTool === tool.id && "bg-orange-500/20 text-orange-600 dark:text-orange-400"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className={cn(
                    "transition-colors",
                    activeTool === tool.id ? "text-orange-500" : tool.color
                  )}>
                    {tool.icon}
                  </div>
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    {tool.label}
                  </span>
                  {tool.shortcut && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {tool.shortcut}
                    </span>
                  )}
                </motion.button>
              ))}
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
          "bg-orange-500 hover:bg-orange-600 text-white shadow-2xl",
          "flex items-center justify-center transition-colors",
          "border-2 border-white/20",
          className
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          rotate: isExpanded ? 45 : 0,
        }}
      >
        {isExpanded ? (
          <X className="w-6 h-6" />
        ) : (
          <div className={cn(
            "transition-colors",
            activeToolOption?.color || "text-white"
          )}>
            {activeToolOption?.icon || <Edit3 className="w-6 h-6" />}
          </div>
        )}
      </motion.button>

      {/* Tool Indicator */}
      {!isExpanded && !showPropertyPanel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 right-6 z-[60] bg-black/80 text-white px-3 py-1 rounded-lg text-sm font-medium"
        >
          {activeToolOption?.label || 'Drawing Tool'}
          {activeToolOption?.shortcut && (
            <span className="ml-2 text-white/60">
              {activeToolOption.shortcut}
            </span>
          )}
        </motion.div>
      )}
    </>
  );
};

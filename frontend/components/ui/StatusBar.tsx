"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Wifi, 
  WifiOff, 
  Save, 
  Clock, 
  Grid3X3, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  User,
  Shield,
  AlertCircle,
  CheckCircle,
  Loader,
  Settings,
  Info,
  GitBranch,
  Cloud,
  CloudOff,
  ChevronDown,
  Ruler
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusBarProps {
  // Connection status
  isOnline: boolean;
  isConnectedToServer: boolean;
  
  // Save status
  saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
  lastSaved?: Date;
  
  // Grid and view controls
  gridEnabled: boolean;
  snapEnabled: boolean;
  zoomLevel: number;
  onGridToggle: () => void;
  onSnapToggle: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  
  // User and project info
  userName?: string;
  projectName?: string;
  
  // Version control
  currentBranch?: string;
  hasUnsavedChanges?: boolean;
  
  // System status
  calculationStatus?: 'idle' | 'running' | 'complete' | 'error';
  warningCount?: number;
  errorCount?: number;

  // Units selection
  currentUnits: 'imperial' | 'metric';
  onUnitsChange: (units: 'imperial' | 'metric') => void;

  className?: string;
}

const StatusIndicator: React.FC<{
  icon: React.ReactNode;
  label: string;
  status: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  onClick?: () => void;
  tooltip?: string;
}> = ({ icon, label, status, onClick, tooltip }) => {
  const colors = {
    success: 'text-green-500 bg-green-500/10 border-green-500/20',
    warning: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    error: 'text-red-500 bg-red-500/10 border-red-500/20',
    info: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    neutral: 'text-neutral-500 bg-neutral-500/10 border-neutral-500/20'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={cn(
        "flex items-center space-x-2 px-3 py-1 rounded-lg border transition-colors",
        "hover:bg-white/10 dark:hover:bg-white/5",
        colors[status],
        !onClick && "cursor-default"
      )}
    >
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
};

const ToggleButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  tooltip?: string;
}> = ({ icon, label, isActive, onClick, tooltip }) => (
  <button
    type="button"
    onClick={onClick}
    title={tooltip}
    className={cn(
      "flex items-center space-x-2 px-3 py-1 rounded-lg border transition-colors",
      isActive
        ? "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30"
        : "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border-neutral-500/20 hover:bg-neutral-500/20"
    )}
  >
    {icon}
    <span className="text-xs font-medium">{label}</span>
  </button>
);

const ActionButton: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  tooltip?: string;
  disabled?: boolean;
}> = ({ icon, onClick, tooltip, disabled = false }) => (
  <button
    type="button"
    onClick={onClick}
    title={tooltip}
    disabled={disabled}
    className={cn(
      "p-2 rounded-lg border border-neutral-500/20 transition-colors",
      "hover:bg-white/10 dark:hover:bg-white/5",
      "text-neutral-600 dark:text-neutral-400",
      disabled && "opacity-50 cursor-not-allowed"
    )}
  >
    {icon}
  </button>
);

const UnitsSelector: React.FC<{
  currentUnits: 'imperial' | 'metric';
  onUnitsChange: (units: 'imperial' | 'metric') => void;
}> = ({ currentUnits, onUnitsChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const units = [
    { value: 'imperial' as const, label: 'Imperial', description: 'ft, in, °F' },
    { value: 'metric' as const, label: 'Metric', description: 'm, mm, °C' }
  ];

  const currentUnit = units.find(unit => unit.value === currentUnits);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center space-x-2 px-3 py-1 rounded-lg border transition-colors",
          "hover:bg-white/10 dark:hover:bg-white/5",
          "text-neutral-600 dark:text-neutral-400 bg-neutral-500/10 border-neutral-500/20"
        )}
        title="Change measurement units"
      >
        <Ruler className="w-4 h-4" />
        <span className="text-xs font-medium">{currentUnit?.label}</span>
        <ChevronDown className={cn(
          "w-3 h-3 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-2">
            {units.map((unit) => (
              <button
                key={unit.value}
                type="button"
                onClick={() => {
                  onUnitsChange(unit.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-2 rounded-md transition-colors text-left",
                  "hover:bg-gray-100 dark:hover:bg-gray-700",
                  currentUnits === unit.value && "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                )}
              >
                <div>
                  <div className="font-medium text-sm">{unit.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{unit.description}</div>
                </div>
                {currentUnits === unit.value && (
                  <CheckCircle className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const StatusBar: React.FC<StatusBarProps> = ({
  isOnline,
  isConnectedToServer,
  saveStatus,
  lastSaved,
  gridEnabled,
  snapEnabled,
  zoomLevel,
  onGridToggle,
  onSnapToggle,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  userName,
  projectName,
  currentBranch,
  hasUnsavedChanges,
  calculationStatus,
  warningCount = 0,
  errorCount = 0,
  currentUnits,
  onUnitsChange,
  className
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getSaveStatusInfo = () => {
    switch (saveStatus) {
      case 'saved':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          label: lastSaved ? `Saved ${lastSaved.toLocaleTimeString()}` : 'Saved',
          status: 'success' as const
        };
      case 'saving':
        return {
          icon: <Loader className="w-4 h-4 animate-spin" />,
          label: 'Saving...',
          status: 'info' as const
        };
      case 'unsaved':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          label: 'Unsaved changes',
          status: 'warning' as const
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          label: 'Save failed',
          status: 'error' as const
        };
      default:
        return {
          icon: <Save className="w-4 h-4" />,
          label: 'Unknown',
          status: 'neutral' as const
        };
    }
  };

  const getConnectionStatus = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="w-4 h-4" />,
        label: 'Offline',
        status: 'error' as const
      };
    }
    
    if (!isConnectedToServer) {
      return {
        icon: <CloudOff className="w-4 h-4" />,
        label: 'Server disconnected',
        status: 'warning' as const
      };
    }
    
    return {
      icon: <Cloud className="w-4 h-4" />,
      label: 'Connected',
      status: 'success' as const
    };
  };

  const getCalculationStatus = () => {
    switch (calculationStatus) {
      case 'running':
        return {
          icon: <Loader className="w-4 h-4 animate-spin" />,
          label: 'Calculating...',
          status: 'info' as const
        };
      case 'complete':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Calculation complete',
          status: 'success' as const
        };
      case 'error':
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          label: 'Calculation error',
          status: 'error' as const
        };
      default:
        return null;
    }
  };

  const saveStatusInfo = getSaveStatusInfo();
  const connectionStatus = getConnectionStatus();
  const calcStatus = getCalculationStatus();

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-30",
        "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg",
        "border-t border-white/20 shadow-lg",
        "px-4 py-2",
        className
      )}
    >
      <div className="flex items-center justify-between">
        {/* Left Section - Project & User Info */}
        <div className="flex items-center space-x-4">
          {/* User Info */}
          {userName && (
            <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
              <User className="w-4 h-4" />
              <span>{userName}</span>
            </div>
          )}
          
          {/* Project Info */}
          {projectName && (
            <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
              <Shield className="w-4 h-4" />
              <span>{projectName}</span>
              {hasUnsavedChanges && (
                <span className="text-orange-500">*</span>
              )}
            </div>
          )}
          
          {/* Version Control */}
          {currentBranch && (
            <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
              <GitBranch className="w-4 h-4" />
              <span>{currentBranch}</span>
            </div>
          )}
        </div>

        {/* Center Section - Grid & View Controls */}
        <div className="flex items-center space-x-3">
          <ToggleButton
            icon={<Grid3X3 className="w-4 h-4" />}
            label="Grid"
            isActive={gridEnabled}
            onClick={onGridToggle}
            tooltip="Toggle grid (G)"
          />
          
          <ToggleButton
            icon={<Settings className="w-4 h-4" />}
            label="Snap"
            isActive={snapEnabled}
            onClick={onSnapToggle}
            tooltip="Toggle snap to grid (Shift+G)"
          />
          
          <div className="flex items-center space-x-1 px-3 py-1 bg-neutral-500/10 rounded-lg border border-neutral-500/20">
            <ActionButton
              icon={<ZoomOut className="w-4 h-4" />}
              onClick={onZoomOut}
              tooltip="Zoom out (-)"
            />
            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 min-w-[3rem] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <ActionButton
              icon={<ZoomIn className="w-4 h-4" />}
              onClick={onZoomIn}
              tooltip="Zoom in (+)"
            />
            <ActionButton
              icon={<RotateCcw className="w-4 h-4" />}
              onClick={onZoomReset}
              tooltip="Reset zoom (0)"
            />
          </div>

          {/* Units Selection */}
          <UnitsSelector
            currentUnits={currentUnits}
            onUnitsChange={onUnitsChange}
          />
        </div>

        {/* Right Section - Status Indicators */}
        <div className="flex items-center space-x-3">
          {/* Calculation Status */}
          {calcStatus && (
            <StatusIndicator
              icon={calcStatus.icon}
              label={calcStatus.label}
              status={calcStatus.status}
            />
          )}
          
          {/* Warnings & Errors */}
          {(warningCount > 0 || errorCount > 0) && (
            <div className="flex items-center space-x-2">
              {errorCount > 0 && (
                <StatusIndicator
                  icon={<AlertCircle className="w-4 h-4" />}
                  label={`${errorCount} error${errorCount !== 1 ? 's' : ''}`}
                  status="error"
                />
              )}
              {warningCount > 0 && (
                <StatusIndicator
                  icon={<AlertCircle className="w-4 h-4" />}
                  label={`${warningCount} warning${warningCount !== 1 ? 's' : ''}`}
                  status="warning"
                />
              )}
            </div>
          )}
          
          {/* Save Status */}
          <StatusIndicator
            icon={saveStatusInfo.icon}
            label={saveStatusInfo.label}
            status={saveStatusInfo.status}
          />
          
          {/* Connection Status */}
          <StatusIndicator
            icon={connectionStatus.icon}
            label={connectionStatus.label}
            status={connectionStatus.status}
          />
          
          {/* Current Time */}
          <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400">
            <Clock className="w-4 h-4" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

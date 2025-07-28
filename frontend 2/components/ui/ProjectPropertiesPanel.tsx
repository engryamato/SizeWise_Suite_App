"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Folder, 
  X, 
  ChevronDown, 
  ChevronRight,
  Upload,
  Download,
  Settings,
  Users,
  Shield,
  FileText,
  Building,
  Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectInfo {
  name: string;
  number: string;
  description: string;
  location: string;
  clientName: string;
  estimatorName: string;
  dateCreated: string;
  lastModified: string;
  version: string;
  companyLogo?: string;
}

interface CodeStandards {
  smacna: boolean;
  ashrae: boolean;
  ul: boolean;
  imc: boolean;
  nfpa: boolean;
}

interface GlobalDefaults {
  units: 'Imperial' | 'Metric';
  defaultDuctSize: { width: number; height: number };
  defaultMaterial: string;
  defaultInsulation: string;
  defaultFitting: string;
  calibrationMode: 'Auto' | 'Manual';
  defaultVelocity: number;
  pressureClass: string;
  altitude: number;
  frictionRate: number;
}

interface ProjectPropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectInfo: ProjectInfo;
  codeStandards: CodeStandards;
  globalDefaults: GlobalDefaults;
  onProjectInfoChange: (info: Partial<ProjectInfo>) => void;
  onCodeStandardsChange: (standards: Partial<CodeStandards>) => void;
  onGlobalDefaultsChange: (defaults: Partial<GlobalDefaults>) => void;
  className?: string;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  icon, 
  children, 
  defaultOpen = false 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3">
          {icon}
          <h3 className="font-semibold text-neutral-800 dark:text-white">{title}</h3>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const InputField: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'number';
  readOnly?: boolean;
  required?: boolean;
}> = ({ label, value, onChange, placeholder, type = 'text', readOnly = false, required = false }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {type === 'textarea' ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          "w-full px-3 py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm",
          "text-neutral-800 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400",
          "focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50",
          "transition-colors resize-none",
          readOnly && "bg-white/5 cursor-not-allowed"
        )}
        rows={3}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          "w-full px-3 py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm",
          "text-neutral-800 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400",
          "focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50",
          "transition-colors",
          readOnly && "bg-white/5 cursor-not-allowed"
        )}
      />
    )}
  </div>
);

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}> = ({ label, value, onChange, options, disabled = false }) => (
  <div className="space-y-2">
    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "w-full px-3 py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm",
        "text-neutral-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50",
        "transition-colors",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

const CheckboxField: React.FC<{
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ label, checked, onChange, disabled = false }) => (
  <div className="flex items-center space-x-3">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className={cn(
        "w-4 h-4 rounded border-white/20 bg-white/10 text-orange-500",
        "focus:ring-2 focus:ring-orange-500/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    />
    <label className={cn(
      "text-sm text-neutral-700 dark:text-neutral-300",
      disabled && "opacity-50"
    )}>
      {label}
    </label>
  </div>
);

// Trigger Button Component (for collapsed state)
export const ProjectPropertiesTrigger: React.FC<{
  onClick: () => void;
  isActive: boolean;
  className?: string;
}> = ({ onClick, isActive, className }) => (
  <motion.button
    onClick={onClick}
    className={cn(
      "fixed top-0 left-0 z-40 flex items-center space-x-2 px-4 py-3",
      "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-lg",
      "border-r border-b border-white/20 shadow-lg",
      "hover:bg-white/95 dark:hover:bg-neutral-900/95 transition-colors",
      "rounded-br-2xl",
      isActive && "bg-orange-50/90 dark:bg-orange-900/20 border-orange-500/30",
      className
    )}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <div className={cn(
      "p-2 rounded-lg transition-colors",
      isActive ? "bg-orange-500/20 text-orange-500" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
    )}>
      <Folder className="w-5 h-5" />
    </div>
    <span className="text-sm font-medium text-neutral-800 dark:text-white hidden sm:block">
      Project
    </span>
  </motion.button>
);

export const ProjectPropertiesPanel: React.FC<ProjectPropertiesPanelProps> = ({
  isOpen,
  onClose,
  projectInfo,
  codeStandards,
  globalDefaults,
  onProjectInfoChange,
  onCodeStandardsChange,
  onGlobalDefaultsChange,
  className
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Panel */}
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed left-0 top-0 h-full w-80 bg-white/90 dark:bg-neutral-900/90",
              "backdrop-blur-lg border-r border-white/20 shadow-2xl z-50",
              "overflow-y-auto",
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <Folder className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-lg font-semibold text-neutral-800 dark:text-white">
                  Project Properties
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1">
              {/* Project Information - Always Expanded */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Building className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                    <h3 className="font-semibold text-neutral-800 dark:text-white">
                      Project Information
                    </h3>
                  </div>
                  <button className="p-1 hover:bg-white/10 rounded transition-colors">
                    <Edit className="w-4 h-4 text-neutral-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <InputField
                    label="Project Name"
                    value={projectInfo.name}
                    onChange={(value) => onProjectInfoChange({ name: value })}
                    placeholder="Enter project name"
                    required
                  />

                  <InputField
                    label="Location"
                    value={projectInfo.location}
                    onChange={(value) => onProjectInfoChange({ location: value })}
                    placeholder="Enter location"
                    required
                  />

                  <InputField
                    label="User Name"
                    value={projectInfo.estimatorName}
                    onChange={(value) => onProjectInfoChange({ estimatorName: value })}
                    placeholder="Demo User"
                  />

                  <InputField
                    label="Contractor"
                    value={projectInfo.clientName}
                    onChange={(value) => onProjectInfoChange({ clientName: value })}
                    placeholder="Not specified"
                  />
                </div>
              </div>

              {/* Code References */}
              <CollapsibleSection
                title="Codes & Standards"
                icon={<FileText className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />}
              >
                <div className="space-y-3">
                  <CheckboxField
                    label="SMACNA"
                    checked={codeStandards.smacna}
                    onChange={(checked) => onCodeStandardsChange({ smacna: checked })}
                    disabled
                  />
                  <CheckboxField
                    label="ASHRAE"
                    checked={codeStandards.ashrae}
                    onChange={(checked) => onCodeStandardsChange({ ashrae: checked })}
                    disabled
                  />
                  <CheckboxField
                    label="UL"
                    checked={codeStandards.ul}
                    onChange={(checked) => onCodeStandardsChange({ ul: checked })}
                    disabled
                  />
                  <CheckboxField
                    label="IMC"
                    checked={codeStandards.imc}
                    onChange={(checked) => onCodeStandardsChange({ imc: checked })}
                    disabled
                  />
                  <CheckboxField
                    label="NFPA"
                    checked={codeStandards.nfpa}
                    onChange={(checked) => onCodeStandardsChange({ nfpa: checked })}
                    disabled
                  />
                </div>
              </CollapsibleSection>

              {/* Computational Properties */}
              <CollapsibleSection
                title="Computational Properties"
                icon={<Settings className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />}
              >
                {/* Pro Only badge removed for clean UX - users don't need subscription reminders */}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Default Velocity (FPM)"
                      value={globalDefaults.defaultVelocity.toString()}
                      onChange={(value) => onGlobalDefaultsChange({ defaultVelocity: parseInt(value) || 1200 })}
                      type="number"
                    />
                    <SelectField
                      label="Pressure Class"
                      value={globalDefaults.pressureClass}
                      onChange={(value) => onGlobalDefaultsChange({ pressureClass: value })}
                      options={[
                        { value: 'Low', label: 'Low' },
                        { value: 'Medium', label: 'Medium' },
                        { value: 'High', label: 'High' }
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField
                      label="Altitude (ft)"
                      value={globalDefaults.altitude.toString()}
                      onChange={(value) => onGlobalDefaultsChange({ altitude: parseInt(value) || 0 })}
                      type="number"
                    />
                    <InputField
                      label="Friction Rate (in. w.g./100ft)"
                      value={globalDefaults.frictionRate.toString()}
                      onChange={(value) => onGlobalDefaultsChange({ frictionRate: parseFloat(value) || 0.08 })}
                      type="number"
                    />
                  </div>
                </div>
              </CollapsibleSection>

              {/* Actions */}
              <CollapsibleSection
                title="Actions"
                icon={<Shield className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />}
                defaultOpen
              >
                <div className="space-y-3">
                  <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Save Project</span>
                  </button>

                  <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-500/20 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Export Project</span>
                  </button>

                  <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Import Project</span>
                  </button>
                </div>
              </CollapsibleSection>

              {/* Footer Info */}
              <div className="p-4 border-t border-white/10 text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
                <div>Last modified: {projectInfo.lastModified}</div>
                <div>Objects: 0</div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

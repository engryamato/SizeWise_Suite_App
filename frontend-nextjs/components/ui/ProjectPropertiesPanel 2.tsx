"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderOpen, 
  X, 
  ChevronDown, 
  ChevronRight,
  Building,
  User,
  Calendar,
  Settings,
  Users,
  Shield,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProjectPropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  project?: {
    name: string;
    number: string;
    description: string;
    location: string;
    client: string;
    estimator: string;
    created: string;
    modified: string;
    version: string;
  };
  onProjectUpdate?: (project: any) => void;
  className?: string;
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-200/50 dark:border-neutral-700/50 last:border-b-0">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/20 dark:hover:bg-white/5 transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3">
          <Icon size={18} className="text-neutral-600 dark:text-neutral-400" />
          <span className="font-medium text-neutral-900 dark:text-white">{title}</span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight size={16} className="text-neutral-500 dark:text-neutral-400" />
        </motion.div>
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
            <div className="px-4 pb-4 space-y-4">
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
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'date';
  readOnly?: boolean;
}> = ({ label, value, onChange, placeholder, type = 'text', readOnly = false }) => {
  const inputClasses = cn(
    "w-full px-3 py-2 text-sm rounded-md transition-colors",
    "bg-white/60 dark:bg-white/10 border border-neutral-200/50 dark:border-neutral-700/50",
    "text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400",
    "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50",
    readOnly && "cursor-not-allowed opacity-75"
  );

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={cn(inputClasses, "min-h-[80px] resize-y")}
          rows={3}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className={inputClasses}
        />
      )}
    </div>
  );
};

const SelectField: React.FC<{
  label: string;
  value: string;
  onChange?: (value: string) => void;
  options: { value: string; label: string }[];
}> = ({ label, value, onChange, options }) => {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "w-full px-3 py-2 text-sm rounded-md transition-colors",
          "bg-white/60 dark:bg-white/10 border border-neutral-200/50 dark:border-neutral-700/50",
          "text-neutral-900 dark:text-white",
          "focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
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
};

export const ProjectPropertiesPanel: React.FC<ProjectPropertiesPanelProps> = ({
  isOpen,
  onClose,
  project = {
    name: 'New Project',
    number: 'PRJ-001',
    description: '',
    location: '',
    client: '',
    estimator: 'Demo User',
    created: new Date().toLocaleDateString(),
    modified: new Date().toLocaleDateString(),
    version: '1.0',
  },
  onProjectUpdate,
  className,
}) => {
  const [projectData, setProjectData] = useState(project);

  const handleFieldChange = (field: string, value: string) => {
    const updated = { ...projectData, [field]: value };
    setProjectData(updated);
    onProjectUpdate?.(updated);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: -400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed left-0 top-0 h-full w-80 z-50",
              "bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md",
              "border-r border-white/20 dark:border-neutral-700/50",
              "shadow-2xl overflow-y-auto",
              className
            )}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-700/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-orange-500/20">
                    <FolderOpen size={20} className="text-orange-500" />
                  </div>
                  <h2 className="font-semibold text-neutral-900 dark:text-white">
                    Project Properties
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                  aria-label="Close panel"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="pb-6">
              {/* Project Information - Always Open */}
              <div className="p-4 space-y-4 border-b border-neutral-200/50 dark:border-neutral-700/50">
                <div className="flex items-center space-x-3 mb-4">
                  <Building size={18} className="text-neutral-600 dark:text-neutral-400" />
                  <span className="font-medium text-neutral-900 dark:text-white">Project Information</span>
                </div>
                
                <InputField
                  label="Project Name"
                  value={projectData.name}
                  onChange={(value) => handleFieldChange('name', value)}
                  placeholder="Enter project name"
                />
                
                <InputField
                  label="Project Number"
                  value={projectData.number}
                  onChange={(value) => handleFieldChange('number', value)}
                  placeholder="PRJ-001"
                />
                
                <InputField
                  label="Description"
                  value={projectData.description}
                  onChange={(value) => handleFieldChange('description', value)}
                  placeholder="Project description"
                  type="textarea"
                />
                
                <InputField
                  label="Location"
                  value={projectData.location}
                  onChange={(value) => handleFieldChange('location', value)}
                  placeholder="Project location"
                />
                
                <InputField
                  label="Client Name"
                  value={projectData.client}
                  onChange={(value) => handleFieldChange('client', value)}
                  placeholder="Client name"
                />
                
                <InputField
                  label="Estimator"
                  value={projectData.estimator}
                  onChange={(value) => handleFieldChange('estimator', value)}
                  placeholder="Estimator name"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <InputField
                    label="Date Created"
                    value={projectData.created}
                    readOnly
                  />
                  <InputField
                    label="Last Modified"
                    value={projectData.modified}
                    readOnly
                  />
                </div>
                
                <InputField
                  label="Version"
                  value={projectData.version}
                  readOnly
                />
              </div>

              {/* Collapsible Sections */}
              <CollapsibleSection title="Code References" icon={Settings}>
                <SelectField
                  label="Duct Sizing Standard"
                  value="SMACNA"
                  options={[
                    { value: 'SMACNA', label: 'SMACNA' },
                    { value: 'ASHRAE', label: 'ASHRAE' },
                    { value: 'Local', label: 'Local Standards' },
                  ]}
                />
                <SelectField
                  label="Material Standard"
                  value="Galvanized Steel"
                  options={[
                    { value: 'Galvanized Steel', label: 'Galvanized Steel' },
                    { value: 'Stainless Steel', label: 'Stainless Steel' },
                    { value: 'Aluminum', label: 'Aluminum' },
                  ]}
                />
              </CollapsibleSection>

              <CollapsibleSection title="Global Defaults" icon={Settings}>
                <SelectField
                  label="Measurement Units"
                  value="Imperial"
                  options={[
                    { value: 'Imperial', label: 'Imperial' },
                    { value: 'Metric', label: 'Metric' },
                  ]}
                />
                <InputField
                  label="Default Duct Size"
                  value="8 x 8"
                  placeholder="8 x 8 inches"
                />
              </CollapsibleSection>

              <CollapsibleSection title="Team & Collaboration" icon={Users}>
                <InputField
                  label="Project Owner"
                  value={projectData.estimator}
                  readOnly
                />
                <div className="text-sm text-neutral-600 dark:text-neutral-400">
                  Team collaboration features coming soon
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="Project Administration" icon={Shield}>
                <SelectField
                  label="Project Status"
                  value="Design"
                  options={[
                    { value: 'Design', label: 'Design' },
                    { value: 'Bid', label: 'Bid' },
                    { value: 'Construction', label: 'Construction' },
                    { value: 'As-Built', label: 'As-Built' },
                  ]}
                />
                <InputField
                  label="Project Notes"
                  value=""
                  placeholder="Add project notes..."
                  type="textarea"
                />
              </CollapsibleSection>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

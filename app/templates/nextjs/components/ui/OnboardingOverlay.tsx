"use client";

import React, { useState } from "react";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Play,
  FileText,
  Users,
  Wrench,
  Settings,
  Star
} from "lucide-react";

interface OnboardingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
  icon: React.ReactNode;
}

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Welcome to SizeWise Suite",
      description: "Your professional HVAC engineering platform",
      icon: <Star className="w-8 h-8" />,
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
            <Star className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              Welcome to SizeWise Suite!
            </h3>
            <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-md mx-auto">
              A modular, offline-first HVAC engineering and estimating platform with standards compliance
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              This quick tour will help you get started with the key features and tools
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "navigation",
      title: "Navigation & Layout",
      description: "Learn how to navigate the app shell",
      icon: <Settings className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold text-neutral-900 dark:text-white">Sidebar Navigation</h4>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Access all tools and features</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Collapse/expand for more space</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Badge notifications for updates</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-semibold text-neutral-900 dark:text-white">Top Bar Features</h4>
              <ul className="space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Breadcrumb navigation</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Notifications center</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>User profile & settings</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
            <p className="text-neutral-600 dark:text-neutral-300 text-sm">
              💡 <strong>Tip:</strong> Use the sidebar toggle button to maximize your workspace when needed
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "tools",
      title: "HVAC Tools",
      description: "Discover professional engineering tools",
      icon: <Wrench className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Wrench className="w-16 h-16 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              Professional HVAC Tools
            </h4>
            <p className="text-neutral-600 dark:text-neutral-300">
              Standards-compliant tools for all your HVAC engineering needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
              <h5 className="font-medium text-neutral-900 dark:text-white mb-2">Air Duct Sizer</h5>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">
                SMACNA standards-compliant duct sizing with velocity validation
              </p>
              <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                Available Now
              </span>
            </div>
            
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
              <h5 className="font-medium text-neutral-900 dark:text-white mb-2">More Tools</h5>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">
                Grease Duct Sizer, Engine Exhaust Sizer, and more coming soon
              </p>
              <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "projects",
      title: "Project Management",
      description: "Organize your work efficiently",
      icon: <FileText className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <FileText className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              Project Organization
            </h4>
            <p className="text-neutral-600 dark:text-neutral-300">
              Keep your HVAC projects organized and accessible
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">1</span>
              </div>
              <div>
                <h5 className="font-medium text-neutral-900 dark:text-white">Create Projects</h5>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Start new projects with templates for different building types
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">2</span>
              </div>
              <div>
                <h5 className="font-medium text-neutral-900 dark:text-white">Use Tools</h5>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Apply HVAC tools to calculate and size systems within your projects
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">3</span>
              </div>
              <div>
                <h5 className="font-medium text-neutral-900 dark:text-white">Export & Share</h5>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">
                  Generate professional reports and share with your team
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "collaboration",
      title: "Team Collaboration",
      description: "Work together effectively",
      icon: <Users className="w-8 h-8" />,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <Users className="w-16 h-16 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              Team Features
            </h4>
            <p className="text-neutral-600 dark:text-neutral-300">
              Collaborate with your team using built-in communication tools
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
              <h5 className="font-medium text-neutral-900 dark:text-white mb-2">Team Chat</h5>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Real-time messaging with your team members
              </p>
            </div>
            
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
              <h5 className="font-medium text-neutral-900 dark:text-white mb-2">Announcements</h5>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Stay updated with important team announcements
              </p>
            </div>
            
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
              <h5 className="font-medium text-neutral-900 dark:text-white mb-2">Support</h5>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Get help from our technical support team
              </p>
            </div>
            
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
              <h5 className="font-medium text-neutral-900 dark:text-white mb-2">Help & Docs</h5>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Access comprehensive documentation and tutorials
              </p>
            </div>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <p className="text-purple-800 dark:text-purple-200 text-sm">
              💬 Look for the floating chat button in the bottom-right corner to start collaborating!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-400">
              {currentStepData.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
                {currentStepData.title}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                {currentStepData.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
            aria-label="Close onboarding"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-900 dark:text-white">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-neutral-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% complete
            </span>
          </div>
          <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={handleSkip}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 transition-colors"
          >
            Skip Tour
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>{currentStep === steps.length - 1 ? "Get Started" : "Next"}</span>
              {currentStep === steps.length - 1 ? (
                <Play size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

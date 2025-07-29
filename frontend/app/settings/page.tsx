"use client";

import React, { useState } from "react";
import { 
  User, 
  Globe, 
  Palette, 
  Shield, 
  Key, 
  Bell,
  Monitor,
  Moon,
  Sun,
  Ruler
} from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [units, setUnits] = useState("imperial");
  const [language, setLanguage] = useState("en");

  const tabs = [
    { id: "profile", label: "Profile & Account", icon: <User size={20} /> },
    { id: "appearance", label: "Appearance", icon: <Palette size={20} /> },
    { id: "units", label: "Units & Language", icon: <Globe size={20} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={20} /> },
    { id: "security", label: "Security", icon: <Shield size={20} /> },
    { id: "api", label: "API & Integrations", icon: <Key size={20} /> },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    defaultValue="Demo"
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    defaultValue="User"
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    defaultValue="demo@sizewise.com"
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Job Title
                  </label>
                  <input
                    type="text"
                    defaultValue="HVAC Engineer"
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Theme</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={!isDarkMode}
                    onChange={() => setIsDarkMode(false)}
                    className="text-blue-600"
                  />
                  <Sun className="w-5 h-5 text-yellow-500" />
                  <span className="text-neutral-900 dark:text-white">Light Mode</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={isDarkMode}
                    onChange={() => setIsDarkMode(true)}
                    className="text-blue-600"
                  />
                  <Moon className="w-5 h-5 text-blue-500" />
                  <span className="text-neutral-900 dark:text-white">Dark Mode</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="theme"
                    value="system"
                    className="text-blue-600"
                  />
                  <Monitor className="w-5 h-5 text-neutral-500" />
                  <span className="text-neutral-900 dark:text-white">System Default</span>
                </label>
              </div>
            </div>
          </div>
        );

      case "units":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Units System</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="units"
                    value="imperial"
                    checked={units === "imperial"}
                    onChange={() => setUnits("imperial")}
                    className="text-blue-600"
                  />
                  <Ruler className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="text-neutral-900 dark:text-white">Imperial (US)</div>
                    <div className="text-sm text-neutral-500">Feet, inches, BTU, °F</div>
                  </div>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="units"
                    value="metric"
                    checked={units === "metric"}
                    onChange={() => setUnits("metric")}
                    className="text-blue-600"
                  />
                  <Ruler className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-neutral-900 dark:text-white">Metric (SI)</div>
                    <div className="text-sm text-neutral-500">Meters, centimeters, kW, °C</div>
                  </div>
                </label>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Language</h3>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full md:w-64 px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Notification Preferences</h3>
              <div className="space-y-4">
                {[
                  { id: "updates", label: "Product Updates", description: "New features and improvements" },
                  { id: "support", label: "Support Replies", description: "Responses to your support tickets" },
                  { id: "standards", label: "Standards Alerts", description: "Updates to HVAC standards and codes" },
                  { id: "exports", label: "Export Completion", description: "When your reports are ready" },
                ].map((item) => (
                  <label key={item.id} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="mt-1 text-blue-600"
                    />
                    <div>
                      <div className="text-neutral-900 dark:text-white">{item.label}</div>
                      <div className="text-sm text-neutral-500">{item.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">Password & Security</h3>
              <div className="space-y-4">
                <button className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Change Password
                </button>
                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
                  <h4 className="font-medium text-neutral-900 dark:text-white mb-2">Two-Factor Authentication</h4>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">
                    Add an extra layer of security to your account
                  </p>
                  <button className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    Enable 2FA
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case "api":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">API Keys</h3>
              <p className="text-neutral-600 dark:text-neutral-300 mb-4">
                Manage API keys for integrations and external applications
              </p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Generate New API Key
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Settings</h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Manage your account preferences and application settings
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors
                    ${activeTab === tab.id
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                      : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    }
                  `}
                >
                  {tab.icon}
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
              {renderTabContent()}
              
              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

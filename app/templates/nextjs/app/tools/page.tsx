"use client";

import React from "react";
import Link from "next/link";
import { Wrench, Calculator, Zap, Flame, DollarSign, ArrowRight } from "lucide-react";

export default function ToolsPage() {
  const tools = [
    {
      id: "air-duct-sizer",
      name: "Air Duct Sizer",
      description: "Friction-loss sizing per SMACNA standards with velocity and gauge validation",
      icon: <Wrench className="w-8 h-8" />,
      status: "available",
      href: "/air-duct-sizer",
      color: "blue",
    },
    {
      id: "grease-duct-sizer",
      name: "Grease Duct Sizer",
      description: "NFPA 96 compliance, hood airflow optimization, and clearance management",
      icon: <Flame className="w-8 h-8" />,
      status: "coming-soon",
      href: "#",
      color: "red",
    },
    {
      id: "engine-exhaust-sizer",
      name: "Engine Exhaust Sizer",
      description: "High-velocity exhaust design for generators and CHP systems",
      icon: <Zap className="w-8 h-8" />,
      status: "coming-soon",
      href: "#",
      color: "yellow",
    },
    {
      id: "boiler-vent-sizer",
      name: "Boiler Vent Sizer",
      description: "Natural and mechanical draft vent sizing for boiler applications",
      icon: <Calculator className="w-8 h-8" />,
      status: "coming-soon",
      href: "#",
      color: "green",
    },
    {
      id: "estimating-app",
      name: "Estimating App",
      description: "Cost estimation and quantity takeoffs for HVAC projects",
      icon: <DollarSign className="w-8 h-8" />,
      status: "coming-soon",
      href: "#",
      color: "purple",
    },
  ];

  const getColorClasses = (color: string, available: boolean) => {
    const baseClasses = {
      blue: available ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400" : "bg-blue-50 text-blue-400 dark:bg-blue-900/50 dark:text-blue-500",
      red: available ? "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400" : "bg-red-50 text-red-400 dark:bg-red-900/50 dark:text-red-500",
      yellow: available ? "bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400" : "bg-yellow-50 text-yellow-400 dark:bg-yellow-900/50 dark:text-yellow-500",
      green: available ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400" : "bg-green-50 text-green-400 dark:bg-green-900/50 dark:text-green-500",
      purple: available ? "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400" : "bg-purple-50 text-purple-400 dark:bg-purple-900/50 dark:text-purple-500",
    };
    return baseClasses[color as keyof typeof baseClasses] || baseClasses.blue;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">HVAC Tools</h1>
        <p className="text-neutral-600 dark:text-neutral-300">
          Professional HVAC engineering tools with standards compliance
        </p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const isAvailable = tool.status === "available";
          const Component = isAvailable ? Link : "div";
          
          return (
            <Component
              key={tool.id}
              href={isAvailable ? tool.href : undefined}
              className={`
                group bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 
                rounded-lg p-6 transition-all
                ${isAvailable 
                  ? "hover:shadow-md hover:scale-105 cursor-pointer" 
                  : "opacity-75 cursor-not-allowed"
                }
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${getColorClasses(tool.color, isAvailable)}`}>
                  {tool.icon}
                </div>
                {isAvailable ? (
                  <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
                ) : (
                  <span className="px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400 rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                {tool.name}
              </h3>
              
              <p className="text-neutral-600 dark:text-neutral-300 text-sm leading-relaxed">
                {tool.description}
              </p>
              
              {isAvailable && (
                <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                    Open Tool →
                  </span>
                </div>
              )}
            </Component>
          );
        })}
      </div>

      {/* Standards Information */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
          Standards Compliance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-neutral-900 dark:text-white">SMACNA</div>
            <div className="text-neutral-600 dark:text-neutral-300">Sheet Metal and Air Conditioning Contractors' National Association</div>
          </div>
          <div>
            <div className="font-medium text-neutral-900 dark:text-white">NFPA 96</div>
            <div className="text-neutral-600 dark:text-neutral-300">Ventilation Control and Fire Protection of Commercial Cooking Operations</div>
          </div>
          <div>
            <div className="font-medium text-neutral-900 dark:text-white">ASHRAE</div>
            <div className="text-neutral-600 dark:text-neutral-300">American Society of Heating, Refrigerating and Air-Conditioning Engineers</div>
          </div>
        </div>
      </div>
    </div>
  );
}

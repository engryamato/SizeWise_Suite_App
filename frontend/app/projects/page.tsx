"use client";

import React from "react";
import { FolderOpen, Plus, Search, Filter } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Projects</h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Manage your HVAC projects and templates
          </p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={20} />
          <span>New Project</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={20} />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          />
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
          <Filter size={20} />
          <span>Filter</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sample Project Cards */}
        {[
          { name: "Office Building HVAC", type: "Commercial", status: "Active", lastModified: "2 hours ago" },
          { name: "Warehouse Ventilation", type: "Industrial", status: "Draft", lastModified: "Yesterday" },
          { name: "Residential Complex", type: "Residential", status: "Complete", lastModified: "3 days ago" },
        ].map((project, index) => (
          <div
            key={`project-${index}-${project.name}`}
            className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                project.status === "Active" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                project.status === "Draft" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
              }`}>
                {project.status}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              {project.name}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-300 text-sm mb-4">
              {project.type} • Last modified {project.lastModified}
            </p>
          </div>
        ))}
      </div>

      {/* Empty State (if no projects) */}
      <div className="text-center py-12 hidden">
        <FolderOpen className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
          No projects yet
        </h3>
        <p className="text-neutral-600 dark:text-neutral-300 mb-6">
          Get started by creating your first HVAC project
        </p>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Create Project
        </button>
      </div>
    </div>
  );
}

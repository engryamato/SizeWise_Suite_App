"use client";

import React, { useState } from "react";
import { 
  FileText, 
  FolderOpen, 
  Upload, 
  Download, 
  Search, 
  Filter,
  MoreVertical,
  Grid,
  List,
  Plus,
  Trash2,
  Edit,
  Share
} from "lucide-react";

export default function FilePage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const files = [
    {
      id: 1,
      name: "Office Building HVAC.pdf",
      type: "pdf",
      size: "2.4 MB",
      modified: "2 hours ago",
      folder: "Projects",
    },
    {
      id: 2,
      name: "Warehouse Ventilation.xlsx",
      type: "excel",
      size: "1.8 MB",
      modified: "1 day ago",
      folder: "Calculations",
    },
    {
      id: 3,
      name: "Residential Complex.dwg",
      type: "cad",
      size: "5.2 MB",
      modified: "3 days ago",
      folder: "Drawings",
    },
    {
      id: 4,
      name: "SMACNA Standards.pdf",
      type: "pdf",
      size: "12.1 MB",
      modified: "1 week ago",
      folder: "References",
    },
    {
      id: 5,
      name: "Project Template.xlsx",
      type: "excel",
      size: "856 KB",
      modified: "2 weeks ago",
      folder: "Templates",
    },
  ];

  const folders = [
    { name: "Projects", count: 12, color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400" },
    { name: "Calculations", count: 8, color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400" },
    { name: "Drawings", count: 5, color: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400" },
    { name: "References", count: 15, color: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400" },
    { name: "Templates", count: 3, color: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400" },
  ];

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-8 h-8 text-red-500" />;
      case "excel":
        return <FileText className="w-8 h-8 text-green-500" />;
      case "cad":
        return <FileText className="w-8 h-8 text-blue-500" />;
      default:
        return <FileText className="w-8 h-8 text-neutral-500" />;
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">File Manager</h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Organize and manage your HVAC project files and documents
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            className="flex items-center space-x-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Upload size={16} />
            <span>Upload</span>
          </button>
          <button
            type="button"
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} />
            <span>New Folder</span>
          </button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            />
          </div>
          <button
            type="button"
            className="flex items-center space-x-2 px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "grid"
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <Grid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "list"
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            }`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Folders */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Folders</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {folders.map((folder, index) => (
            <div
              key={index}
              className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${folder.color}`}>
                  <FolderOpen size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-neutral-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {folder.name}
                  </div>
                  <div className="text-sm text-neutral-500">{folder.count} files</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Files */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Recent Files</h2>
        
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-3">
                  {getFileIcon(file.type)}
                  <button
                    type="button"
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-600 transition-all"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
                <div className="space-y-1">
                  <div className="font-medium text-neutral-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {file.name}
                  </div>
                  <div className="text-sm text-neutral-500">{file.size}</div>
                  <div className="text-xs text-neutral-400">{file.modified}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Modified
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Folder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {getFileIcon(file.type)}
                        <div className="font-medium text-neutral-900 dark:text-white">{file.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-300">
                      {file.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-300">
                      {file.modified}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-300">
                      {file.folder}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          type="button"
                          className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-300"
                        >
                          <Share size={16} />
                        </button>
                        <button
                          type="button"
                          className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-300"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            No files found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-300">
            {searchQuery ? "Try adjusting your search terms" : "Upload your first file to get started"}
          </p>
        </div>
      )}
    </div>
  );
}

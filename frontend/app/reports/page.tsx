"use client";

import React from "react";
import { BarChart3, Download, FileText, Calendar, Filter } from "lucide-react";

export default function ReportsPage() {
  const reports = [
    {
      id: 1,
      name: "Office Building HVAC Report.pdf",
      type: "PDF",
      date: "2024-01-15",
      size: "2.4 MB",
      status: "completed",
    },
    {
      id: 2,
      name: "Warehouse Ventilation Calculations.xlsx",
      type: "Excel",
      date: "2024-01-14",
      size: "1.8 MB",
      status: "completed",
    },
    {
      id: 3,
      name: "Residential Complex Summary.pdf",
      type: "PDF",
      date: "2024-01-12",
      size: "3.1 MB",
      status: "completed",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Reports & Exports</h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Export history, batch operations, and file management
          </p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Download size={20} />
          <span>Export Report</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Calendar size={20} className="text-neutral-400" />
          <select className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
            <option>Last 30 days</option>
            <option>Last 7 days</option>
            <option>Last 3 months</option>
            <option>All time</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Filter size={20} className="text-neutral-400" />
          <select className="border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white">
            <option>All formats</option>
            <option>PDF only</option>
            <option>Excel only</option>
            <option>CAD only</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Export History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-neutral-400 mr-3" />
                      <div className="text-sm font-medium text-neutral-900 dark:text-white">
                        {report.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      report.type === "PDF" 
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    }`}>
                      {report.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-300">
                    {new Date(report.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-300">
                    {report.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {report.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                        Download
                      </button>
                      <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Formats */}
      <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
          Available Export Formats
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="font-medium text-neutral-900 dark:text-white">PDF Reports</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-300">Professional documentation</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-2">
              <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="font-medium text-neutral-900 dark:text-white">Excel Sheets</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-300">Calculation data</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-2">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="font-medium text-neutral-900 dark:text-white">CAD Files</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-300">Technical drawings</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-2">
              <Download className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="font-medium text-neutral-900 dark:text-white">Batch Export</div>
            <div className="text-sm text-neutral-600 dark:text-neutral-300">Multiple formats</div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import {
  Wrench,
  FileText,
  FolderOpen,
  BarChart3,
  Clock,
  Star,
  TrendingUp,
  Users,
  CheckCircle
} from "lucide-react";

// Dashboard Component with App Shell
export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <div className="p-6">Redirecting...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Welcome Section */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4" data-testid="dashboard-title">
          Welcome to SizeWise Suite
        </h1>
        <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
          A modular, offline-first HVAC engineering and estimating platform with standards compliance
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link
          href="/projects/new"
          className="group p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-105"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Start New Project
            </h3>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300">
            Create a new HVAC project with templates
          </p>
        </Link>

        <Link
          href="/air-duct-sizer"
          className="group p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-105"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Wrench className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              Air Duct Sizer Tool
            </h3>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300">
            SMACNA standards-compliant duct sizing
          </p>
        </Link>

        <Link
          href="/reports"
          className="group p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-105"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              View Reports
            </h3>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300">
            Export history and project reports
          </p>
        </Link>

        <Link
          href="/modules"
          className="group p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm hover:shadow-md transition-all hover:scale-105"
        >
          <div className="flex items-center space-x-3 mb-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
              All Modules
            </h3>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300">
            Access all HVAC calculation modules
          </p>
        </Link>
      </div>

      {/* Recent Activity & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">
              Recent Projects
            </h2>
            <Link href="/projects" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
              <Clock className="w-5 h-5 text-neutral-500" />
              <div className="flex-1">
                <div className="font-medium text-neutral-900 dark:text-white">Office Building HVAC</div>
                <div className="text-sm text-neutral-500">Last modified 2 hours ago</div>
              </div>
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
              <Clock className="w-5 h-5 text-neutral-500" />
              <div className="flex-1">
                <div className="font-medium text-neutral-900 dark:text-white">Warehouse Ventilation</div>
                <div className="text-sm text-neutral-500">Last modified yesterday</div>
              </div>
              <div className="w-5 h-5"></div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">12</div>
                <div className="text-sm text-neutral-500">Active Projects</div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">3</div>
                <div className="text-sm text-neutral-500">Team Members</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-center">
        <p className="text-blue-800 dark:text-blue-200 mb-3">
          🎯 Welcome to your SizeWise Suite dashboard! Access all your HVAC engineering tools and projects from here.
        </p>
        <Link
          href="/air-duct-sizer"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm underline"
        >
          Start with Air Duct Sizer →
        </Link>
      </div>
    </div>
  );
}

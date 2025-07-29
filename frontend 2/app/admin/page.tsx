"use client";

import React from "react";
import Link from "next/link";
import { 
  Shield, 
  Users, 
  Settings, 
  FileText, 
  CreditCard, 
  Cloud,
  Activity,
  AlertTriangle,
  TrendingUp,
  UserCheck
} from "lucide-react";

export default function AdminPage() {
  const adminModules = [
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: <Users className="w-8 h-8" />,
      href: "/admin/users",
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400",
      stats: "24 active users"
    },
    {
      title: "Team Permissions",
      description: "Configure team access and role-based permissions",
      icon: <UserCheck className="w-8 h-8" />,
      href: "/admin/permissions",
      color: "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400",
      stats: "5 teams configured"
    },
    {
      title: "Audit Logs",
      description: "View system activity and user actions",
      icon: <FileText className="w-8 h-8" />,
      href: "/admin/audit",
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400",
      stats: "1,247 events today"
    },
    {
      title: "Company Profile",
      description: "Manage company information and branding",
      icon: <Settings className="w-8 h-8" />,
      href: "/admin/company",
      color: "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400",
      stats: "Profile 95% complete"
    },
    {
      title: "Billing & Subscription",
      description: "Manage subscription plans and billing",
      icon: <CreditCard className="w-8 h-8" />,
      href: "/admin/billing",
      color: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400",
      stats: "Pro plan active"
    },
    {
      title: "Cloud Sync Settings",
      description: "Configure cloud storage and synchronization",
      icon: <Cloud className="w-8 h-8" />,
      href: "/admin/cloud",
      color: "bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-400",
      stats: "Sync enabled"
    }
  ];

  const recentActivity = [
    { user: "John Smith", action: "Created new project", time: "2 minutes ago", type: "create" },
    { user: "Sarah Johnson", action: "Updated user permissions", time: "15 minutes ago", type: "update" },
    { user: "Mike Chen", action: "Exported report", time: "1 hour ago", type: "export" },
    { user: "Lisa Wang", action: "Logged in", time: "2 hours ago", type: "login" },
  ];

  const systemStats = [
    { label: "Active Users", value: "24", change: "+2", trend: "up" },
    { label: "Projects", value: "156", change: "+12", trend: "up" },
    { label: "Storage Used", value: "2.4 GB", change: "+0.3 GB", trend: "up" },
    { label: "API Calls", value: "1,247", change: "-45", trend: "down" },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Admin Panel</h1>
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
              Super Admin
            </span>
          </div>
          <p className="text-neutral-600 dark:text-neutral-300">
            Manage users, permissions, and system settings
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-neutral-500">Last login</div>
          <div className="font-medium text-neutral-900 dark:text-white">Today at 9:15 AM</div>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {systemStats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</div>
                <div className="text-sm text-neutral-500">{stat.label}</div>
              </div>
              <div className={`flex items-center space-x-1 text-sm ${
                stat.trend === "up" ? "text-green-600" : "text-red-600"
              }`}>
                <TrendingUp className={`w-4 h-4 ${stat.trend === "down" ? "rotate-180" : ""}`} />
                <span>{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Modules */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-6">Administration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminModules.map((module, index) => (
            <Link
              key={index}
              href={module.href}
              className="group bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 hover:shadow-md transition-all hover:scale-105"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${module.color}`}>
                  {module.icon}
                </div>
                <div className="text-xs text-neutral-500 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded-full">
                  {module.stats}
                </div>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {module.title}
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                {module.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Recent Activity</h3>
            <Link href="/admin/audit" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === "create" ? "bg-green-500" :
                  activity.type === "update" ? "bg-blue-500" :
                  activity.type === "export" ? "bg-purple-500" :
                  "bg-neutral-500"
                }`} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-neutral-900 dark:text-white">
                    {activity.user}
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-300">
                    {activity.action}
                  </div>
                </div>
                <div className="text-xs text-neutral-500">
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 text-green-500 mr-2" />
            System Health
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-300">Database</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Healthy
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-300">API Services</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-300">Cloud Storage</span>
              <span className="flex items-center text-yellow-600">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                Warning
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600 dark:text-neutral-300">Backup System</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Alert */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Security Notice</h4>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
              2 users have not logged in for over 30 days. Consider reviewing inactive accounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

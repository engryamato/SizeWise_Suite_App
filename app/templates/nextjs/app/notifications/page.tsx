"use client";

import React, { useState } from "react";
import { 
  Bell, 
  Check, 
  X, 
  Filter, 
  MoreVertical,
  AlertCircle,
  Info,
  CheckCircle,
  Clock
} from "lucide-react";

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const notifications = [
    {
      id: 1,
      type: "info",
      title: "New SMACNA standards update available",
      message: "Please review the updated guidelines in the Help section for the latest SMACNA standards.",
      timestamp: "2 hours ago",
      read: false,
    },
    {
      id: 2,
      type: "success",
      title: "Export completed successfully",
      message: "Your Office Building HVAC report has been exported and is ready for download.",
      timestamp: "4 hours ago",
      read: false,
    },
    {
      id: 3,
      type: "warning",
      title: "Scheduled maintenance reminder",
      message: "System maintenance is scheduled for Sunday 2 AM - 4 AM EST. Plan accordingly.",
      timestamp: "1 day ago",
      read: true,
    },
    {
      id: 4,
      type: "info",
      title: "Team member joined",
      message: "Sarah Johnson has joined your team and can now access shared projects.",
      timestamp: "2 days ago",
      read: true,
    },
    {
      id: 5,
      type: "success",
      title: "Project calculation completed",
      message: "Air duct sizing calculations for Warehouse Ventilation project are complete.",
      timestamp: "3 days ago",
      read: true,
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "error":
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === "unread") return !notification.read;
    if (filter === "read") return notification.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Notifications</h1>
          <p className="text-neutral-600 dark:text-neutral-300">
            Stay updated with important messages and system alerts
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            className="flex items-center space-x-2 px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <Check size={16} />
            <span>Mark All Read</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Bell className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{notifications.length}</div>
              <div className="text-sm text-neutral-500">Total</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{unreadCount}</div>
              <div className="text-sm text-neutral-500">Unread</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">{notifications.length - unreadCount}</div>
              <div className="text-sm text-neutral-500">Read</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            <div>
              <div className="text-2xl font-bold text-neutral-900 dark:text-white">2</div>
              <div className="text-sm text-neutral-500">Today</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Filter size={20} className="text-neutral-400" />
          <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Filter:</span>
        </div>
        <div className="flex space-x-2">
          {["all", "unread", "read"].map((filterOption) => (
            <button
              key={filterOption}
              type="button"
              onClick={() => setFilter(filterOption as typeof filter)}
              className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                filter === filterOption
                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200"
              }`}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 transition-colors ${
              !notification.read ? "border-l-4 border-l-blue-500" : ""
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {getIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`text-sm font-medium ${
                      !notification.read 
                        ? "text-neutral-900 dark:text-white" 
                        : "text-neutral-700 dark:text-neutral-300"
                    }`}>
                      {notification.title}
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-neutral-500">{notification.timestamp}</span>
                      {!notification.read && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {!notification.read && (
                      <button
                        type="button"
                        className="p-1 text-neutral-400 hover:text-green-600 transition-colors"
                        title="Mark as read"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
                      title="More options"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNotifications.length === 0 && (
        <div className="text-center py-12">
          <Bell className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
            No notifications found
          </h3>
          <p className="text-neutral-600 dark:text-neutral-300">
            {filter === "unread" 
              ? "You're all caught up! No unread notifications."
              : filter === "read"
              ? "No read notifications to display."
              : "You don't have any notifications yet."
            }
          </p>
        </div>
      )}
    </div>
  );
}

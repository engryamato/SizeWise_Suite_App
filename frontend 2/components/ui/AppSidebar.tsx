"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  FolderOpen,
  Wrench,
  BarChart3,
  Settings,
  HelpCircle,
  MessageSquare,
  Bell,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
  adminOnly?: boolean;
}

interface AppSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  userRole?: "admin" | "user";
  onHelpClick?: () => void;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home size={20} />,
    href: "/",
  },
  {
    id: "file",
    label: "File",
    icon: <FileText size={20} />,
    href: "/file",
  },
  {
    id: "projects",
    label: "Projects",
    icon: <FolderOpen size={20} />,
    href: "/projects",
  },
  {
    id: "tools",
    label: "Tools",
    icon: <Wrench size={20} />,
    href: "/tools",
  },
  {
    id: "reports",
    label: "Reports",
    icon: <BarChart3 size={20} />,
    href: "/reports",
  },
  {
    id: "admin",
    label: "Admin",
    icon: <Shield size={20} />,
    href: "/admin",
    adminOnly: true,
  },
  {
    id: "help",
    label: "Help & Docs",
    icon: <HelpCircle size={20} />,
    href: "/help",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings size={20} />,
    href: "/settings",
  },
  {
    id: "chat",
    label: "Chat",
    icon: <MessageSquare size={20} />,
    href: "/chat",
    badge: 3,
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: <Bell size={20} />,
    href: "/notifications",
    badge: 5,
  },
];

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
  userRole = "user",
  onHelpClick,
}) => {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const filteredItems = SIDEBAR_ITEMS.filter(
    (item) => !item.adminOnly || userRole === "admin"
  );

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={`
        h-full bg-neutral-900 dark:bg-neutral-950 border-r border-neutral-800
        transition-all duration-300 ease-in-out flex flex-col
        ${isCollapsed ? "w-16" : "w-64"}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-white">Navigation</h2>
          )}
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-2 space-y-1">
        {/* @ts-ignore */}
        {filteredItems.map((item) => {
          const isHelpItem = item.id === "help";

          return isHelpItem ? (
            <button
              key={item.id}
              type="button"
              onClick={onHelpClick}

              aria-current={isActive(item.href) ? "page" : undefined}
              className={`
                group flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900
                ${
                  isActive(item.href)
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-800"
                }
              `}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              title={isCollapsed ? item.label : undefined}
              aria-label={isCollapsed ? item.label : undefined}
            >
              <div className="flex items-center justify-center w-5 h-5 flex-shrink-0">
                {item.icon}
              </div>

              {!isCollapsed && (
                <>
                  <span className="ml-3 flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </>
              )}

              {isCollapsed && item.badge && item.badge > 0 && (
                <span className="absolute left-8 top-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </button>
          ) : (
            <Link
              key={item.id}
              href={item.href || '/'}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`
                group flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-left
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-900
                ${
                  isActive(item.href)
                    ? "bg-neutral-800 text-white"
                    : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                }
              `}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              title={isCollapsed ? item.label : undefined}
            >
              <div className="relative flex items-center">
                {/* @ts-ignore */}
                <item.icon
                  size={20}
                  className={`
                    transition-colors
                    ${isActive(item.href) ? "text-white" : "text-neutral-400 group-hover:text-white"}
                  `}
                />
              </div>

              {!isCollapsed && (
                <>
                  <span className="ml-3 flex-1">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </>
              )}

              {isCollapsed && item.badge && item.badge > 0 && (
                <span className="absolute left-8 top-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-neutral-800">
        {!isCollapsed && (
          <div className="text-xs text-neutral-500">
            SizeWise Suite v0.1.0
          </div>
        )}
      </div>
    </nav>
  );
};

"use client";

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  FileText, 
  FolderOpen, 
  Wrench, 
  User,
  ChevronDown,
  Settings,
  BarChart3,
  LogOut,
  Shield,
  Globe,
  Key,
  Download,
  Users,
  CreditCard,
  Activity,
  MessageSquare,
  Bell,
  HelpCircle
} from 'lucide-react';
import { Dock, DockItem } from './Dock';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: string;
  label: string;
  icon: any;
  href?: string;
  onClick?: () => void;
  dropdown?: DropdownItem[];
  badge?: number;
}

interface DropdownItem {
  id: string;
  label: string;
  icon?: any;
  href?: string;
  onClick?: () => void;
  separator?: boolean;
  adminOnly?: boolean;
}

interface CenteredNavigationProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role?: 'admin' | 'user';
  };
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  className?: string;
}

const MAIN_NAV_ITEMS: NavigationItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    href: '/',
  },
  {
    id: 'file',
    label: 'File',
    icon: FileText,
    dropdown: [
      { id: 'new-project', label: 'New Project', icon: FolderOpen, href: '/projects/new' },
      { id: 'open-project', label: 'Open Project', icon: FolderOpen, href: '/projects' },
      { id: 'save-project', label: 'Save Project', onClick: () => console.log('Save') },
      { id: 'separator-1', label: '', separator: true },
      { id: 'import', label: 'Import', icon: Download, href: '/import' },
      { id: 'export', label: 'Export', icon: Download, href: '/export' },
      { id: 'separator-2', label: '', separator: true },
      { id: 'recent', label: 'Recent Files', icon: FileText, href: '/recent' },
    ],
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: FolderOpen,
    dropdown: [
      { id: 'all-projects', label: 'All Projects', href: '/projects' },
      { id: 'templates', label: 'Project Templates', href: '/projects/templates' },
      { id: 'create-new', label: 'Create New Project', href: '/projects/new' },
      { id: 'archive', label: 'Project Archive', href: '/projects/archive' },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: Wrench,
    dropdown: [
      { id: 'air-duct-sizer', label: 'Air Duct Sizer', href: '/air-duct-sizer-v1' },
      { id: 'combustion-vent', label: 'Combustion Vent Sizer', href: '/combustion-vent-sizer' },
      { id: 'grease-duct', label: 'Grease Duct Sizer', href: '/grease-duct-sizer' },
      { id: 'generator-exhaust', label: 'Generator Exhaust Sizer', href: '/generator-exhaust-sizer' },
      { id: 'estimating', label: 'Estimating App', href: '/estimating' },
    ],
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: User,
    dropdown: [
      { id: 'profile-account', label: 'Profile & Account', icon: User, href: '/profile' },
      { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
      { id: 'separator-1', label: '', separator: true },
      { id: 'reports-exports', label: 'Reports & Exports', icon: BarChart3, href: '/reports' },
      { id: 'separator-2', label: '', separator: true },
      { id: 'admin', label: 'Administrative Access', icon: Shield, href: '/admin', adminOnly: true },
      { id: 'separator-3', label: '', separator: true },
      { id: 'logout', label: 'Logout', icon: LogOut, onClick: () => console.log('Logout') },
    ],
  },
];

const DropdownMenu: React.FC<{
  items: DropdownItem[];
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'admin' | 'user';
}> = ({ items, isOpen, onClose, userRole }) => {
  const filteredItems = items.filter(item => !item.adminOnly || userRole === 'admin');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-white/90 dark:bg-neutral-800/90 backdrop-blur-md rounded-lg shadow-lg border border-white/20 dark:border-neutral-700/50 py-2 z-50"
          onMouseLeave={onClose}
        >
          {filteredItems.map((item) => {
            if (item.separator) {
              return (
                <div key={item.id} className="h-px bg-neutral-200 dark:bg-neutral-700 mx-2 my-1" />
              );
            }

            const Icon = item.icon;
            const content = (
              <div className="flex items-center space-x-3 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-white/40 dark:hover:bg-white/10 transition-colors cursor-pointer">
                {Icon && <Icon size={16} />}
                <span>{item.label}</span>
              </div>
            );

            if (item.href) {
              return (
                <a key={item.id} href={item.href} onClick={onClose}>
                  {content}
                </a>
              );
            }

            return (
              <div
                key={item.id}
                onClick={() => {
                  item.onClick?.();
                  onClose();
                }}
              >
                {content}
              </div>
            );
          })}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const NavigationItem: React.FC<{
  item: NavigationItem;
  isActive: boolean;
  userRole?: 'admin' | 'user';
}> = ({ item, isActive, userRole }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const Icon = item.icon;

  const handleClick = () => {
    if (item.dropdown) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      item.onClick?.();
    }
  };

  const content = (
    <div className="relative">
      <motion.div
        className={cn(
          "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer",
          "hover:bg-white/40 dark:hover:bg-white/10",
          isActive && "bg-white/60 dark:bg-white/20"
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        onMouseEnter={() => item.dropdown && setIsDropdownOpen(true)}
      >
        <Icon 
          size={20} 
          className={cn(
            "text-neutral-600 dark:text-neutral-300",
            isActive && "text-blue-600 dark:text-blue-400"
          )} 
        />
        <span className={cn(
          "text-sm font-medium text-neutral-700 dark:text-neutral-200",
          isActive && "text-blue-700 dark:text-blue-300"
        )}>
          {item.label}
        </span>
        {item.dropdown && (
          <ChevronDown 
            size={16} 
            className={cn(
              "text-neutral-500 dark:text-neutral-400 transition-transform",
              isDropdownOpen && "rotate-180"
            )} 
          />
        )}
        {item.badge && item.badge > 0 && (
          <div className="min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center px-1">
            {item.badge > 99 ? '99+' : item.badge}
          </div>
        )}
      </motion.div>

      {item.dropdown && (
        <DropdownMenu
          items={item.dropdown}
          isOpen={isDropdownOpen}
          onClose={() => setIsDropdownOpen(false)}
          userRole={userRole}
        />
      )}
    </div>
  );

  if (item.href && !item.dropdown) {
    return (
      <a href={item.href}>
        {content}
      </a>
    );
  }

  return content;
};

export const CenteredNavigation: React.FC<CenteredNavigationProps> = ({
  user,
  onThemeToggle,
  isDarkMode,
  className,
}) => {
  const pathname = usePathname();

  const isActive = (item: NavigationItem) => {
    if (item.href === '/') {
      return pathname === '/';
    }
    return item.href ? pathname.startsWith(item.href) : false;
  };

  // Bottom-right corner items
  const cornerItems: DockItem[] = [
    {
      id: 'notifications',
      icon: MessageSquare,
      label: 'Chat & Notifications',
      badge: 3,
      onClick: () => console.log('Open chat'),
    },
    {
      id: 'help',
      icon: HelpCircle,
      label: 'Help & Docs',
      onClick: () => console.log('Open help'),
    },
  ];

  return (
    <>
      {/* Main Navigation Bar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "fixed top-0 left-1/2 -translate-x-1/2 z-40 mt-4",
          "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md",
          "border border-white/20 dark:border-neutral-700/50",
          "rounded-xl shadow-lg px-6 py-3",
          className
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center space-x-6">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SW</span>
            </div>
            <span className="font-semibold text-neutral-900 dark:text-white">SizeWise</span>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1">
            {MAIN_NAV_ITEMS.map((item) => (
              <NavigationItem
                key={item.id}
                item={item}
                isActive={isActive(item)}
                userRole={user?.role}
              />
            ))}
          </div>
        </div>
      </motion.nav>

      {/* Bottom-right corner dock */}
      <div className="fixed bottom-4 right-20 z-40">
        <Dock
          items={cornerItems}
          orientation="vertical"
          size="md"
          variant="glass"
        />
      </div>
    </>
  );
};

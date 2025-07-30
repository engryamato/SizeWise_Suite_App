"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DockItem {
  id: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  href?: string;
  badge?: number;
  disabled?: boolean;
  active?: boolean;
}

interface DockProps {
  items: DockItem[];
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'glass' | 'solid' | 'minimal';
}

const SIZE_CONFIGS = {
  sm: {
    container: 'h-12',
    item: 'w-10 h-10',
    icon: 16,
    gap: 'gap-1',
  },
  md: {
    container: 'h-14',
    item: 'w-12 h-12',
    icon: 20,
    gap: 'gap-2',
  },
  lg: {
    container: 'h-16',
    item: 'w-14 h-14',
    icon: 24,
    gap: 'gap-3',
  },
};

const VARIANT_STYLES = {
  glass: {
    container: 'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-white/20 dark:border-neutral-700/50',
    item: 'hover:bg-white/40 dark:hover:bg-white/10',
    activeItem: 'bg-white/60 dark:bg-white/20',
  },
  solid: {
    container: 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700',
    item: 'hover:bg-neutral-100 dark:hover:bg-neutral-700',
    activeItem: 'bg-neutral-200 dark:bg-neutral-600',
  },
  minimal: {
    container: 'bg-transparent',
    item: 'hover:bg-black/5 dark:hover:bg-white/5',
    activeItem: 'bg-black/10 dark:bg-white/10',
  },
};

const DockItem: React.FC<{
  item: DockItem;
  size: keyof typeof SIZE_CONFIGS;
  variant: keyof typeof VARIANT_STYLES;
  orientation: 'horizontal' | 'vertical';
}> = ({ item, size, variant, orientation }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sizeConfig = SIZE_CONFIGS[size];
  const variantStyle = VARIANT_STYLES[variant];
  const Icon = item.icon;

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Delay label appearance slightly for smoother UX
    timeoutRef.current = setTimeout(() => setShowLabel(true), 150);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setShowLabel(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleClick = () => {
    if (item.disabled) return;
    item.onClick?.();
  };

  const itemContent = (
    <motion.div
      className={cn(
        "relative flex items-center justify-center rounded-lg transition-all duration-200 cursor-pointer",
        sizeConfig.item,
        variantStyle.item,
        item.active && variantStyle.activeItem,
        item.disabled && "opacity-50 cursor-not-allowed"
      )}
      whileHover={!item.disabled ? { scale: 1.05 } : {}}
      whileTap={!item.disabled ? { scale: 0.95 } : {}}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role="button"
      tabIndex={item.disabled ? -1 : 0}
      aria-label={item.label}
      aria-disabled={item.disabled}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !item.disabled) {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Icon with floating animation */}
      <motion.div
        animate={isHovered ? { y: -2 } : { y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Icon 
          size={sizeConfig.icon} 
          className={cn(
            "text-neutral-600 dark:text-neutral-300",
            item.active && "text-blue-600 dark:text-blue-400",
            isHovered && "text-neutral-900 dark:text-white"
          )} 
        />
      </motion.div>

      {/* Badge */}
      {item.badge && item.badge > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center px-1"
        >
          {item.badge > 99 ? '99+' : item.badge}
        </motion.div>
      )}

      {/* Hover label */}
      <AnimatePresence>
        {showLabel && (
          <motion.div
            initial={{ opacity: 0, y: orientation === 'horizontal' ? 10 : 0, x: orientation === 'vertical' ? -10 : 0 }}
            animate={{ opacity: 1, y: orientation === 'horizontal' ? -40 : 0, x: orientation === 'vertical' ? -60 : 0 }}
            exit={{ opacity: 0, y: orientation === 'horizontal' ? 10 : 0, x: orientation === 'vertical' ? -10 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "absolute z-50 px-2 py-1 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-700 rounded-md shadow-lg pointer-events-none whitespace-nowrap",
              orientation === 'horizontal' ? "left-1/2 -translate-x-1/2" : "right-full top-1/2 -translate-y-1/2 mr-2"
            )}
          >
            {item.label}
            {/* Arrow */}
            <div 
              className={cn(
                "absolute w-2 h-2 bg-neutral-900 dark:bg-neutral-700 rotate-45",
                orientation === 'horizontal' 
                  ? "bottom-[-4px] left-1/2 -translate-x-1/2" 
                  : "right-[-4px] top-1/2 -translate-y-1/2"
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );

  // Wrap with link if href is provided
  if (item.href && !item.disabled) {
    return (
      <a href={item.href} className="block">
        {itemContent}
      </a>
    );
  }

  return itemContent;
};

export const Dock: React.FC<DockProps> = ({
  items,
  className,
  orientation = 'horizontal',
  size = 'md',
  variant = 'glass',
}) => {
  const sizeConfig = SIZE_CONFIGS[size];
  const variantStyle = VARIANT_STYLES[variant];

  return (
    <motion.nav
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "flex items-center rounded-xl shadow-lg",
        orientation === 'horizontal' ? `${sizeConfig.container} px-3` : `w-16 py-3 flex-col`,
        sizeConfig.gap,
        variantStyle.container,
        className
      )}
      role="navigation"
      aria-label="Dock navigation"
    >
      {items.map((item) => (
        <DockItem
          key={item.id}
          item={item}
          size={size}
          variant={variant}
          orientation={orientation}
        />
      ))}
    </motion.nav>
  );
};

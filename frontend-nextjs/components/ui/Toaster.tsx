"use client";

import React, { forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastData {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
  duration?: number; // 0 = persistent, undefined = 5000ms default
  actions?: {
    label: string;
    onClick: () => void;
  };
  highlightTitle?: boolean;
}

interface Toast extends ToastData {
  id: string;
  timestamp: number;
}

export interface ToasterRef {
  show: (data: ToastData) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

interface ToasterProps {
  defaultPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
  className?: string;
}

const VARIANT_STYLES = {
  default: {
    bg: 'bg-white dark:bg-neutral-800',
    border: 'border-neutral-200 dark:border-neutral-700',
    icon: Info,
    iconColor: 'text-blue-500',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: CheckCircle,
    iconColor: 'text-green-500',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: AlertCircle,
    iconColor: 'text-red-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Info,
    iconColor: 'text-blue-500',
  },
};

const POSITION_STYLES = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-center': 'top-4 left-1/2 -translate-x-1/2',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
};

const generateToastId = (): string => {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const ToastItem: React.FC<{
  toast: Toast;
  onDismiss: (id: string) => void;
  position: string;
}> = ({ toast, onDismiss, position }) => {
  const variant = VARIANT_STYLES[toast.variant || 'default'];
  const Icon = variant.icon;
  
  const isRightSide = position.includes('right');
  const isTopSide = position.includes('top');

  return (
    <motion.div
      initial={{
        opacity: 0,
        x: isRightSide ? 100 : -100,
        y: isTopSide ? -20 : 20,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        x: isRightSide ? 100 : -100,
        scale: 0.95,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className={cn(
        "relative w-80 p-4 rounded-lg shadow-lg backdrop-blur-sm border",
        "transform-gpu will-change-transform",
        variant.bg,
        variant.border
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-white/10 dark:bg-white/5 rounded-lg pointer-events-none" />
      
      <div className="relative flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className={cn("w-5 h-5", variant.iconColor)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={cn(
            "text-sm font-medium text-neutral-900 dark:text-white",
            toast.highlightTitle && "font-semibold"
          )}>
            {toast.title}
          </h4>
          
          {toast.message && (
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              {toast.message}
            </p>
          )}

          {/* Action Button */}
          {toast.actions && (
            <div className="mt-3">
              <button
                type="button"
                onClick={toast.actions.onClick}
                className={cn(
                  "text-sm font-medium rounded-md px-3 py-1.5 transition-colors",
                  "hover:bg-white/20 dark:hover:bg-white/10",
                  variant.iconColor
                )}
              >
                {toast.actions.label}
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="flex-shrink-0 p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export const Toaster = forwardRef<ToasterRef, ToasterProps>(({
  defaultPosition = 'bottom-right',
  maxToasts = 5,
  className,
}, ref) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((data: ToastData) => {
    const toast: Toast = {
      ...data,
      id: generateToastId(),
      timestamp: Date.now(),
    };

    setToasts(prev => {
      const newToasts = [toast, ...prev];
      return newToasts.slice(0, maxToasts);
    });

    // Auto-dismiss after duration
    const duration = data.duration === 0 ? 0 : (data.duration || 5000);
    if (duration > 0) {
      setTimeout(() => {
        dismiss(toast.id);
      }, duration);
    }
  }, [maxToasts]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  useImperativeHandle(ref, () => ({
    show,
    dismiss,
    clear,
  }), [show, dismiss, clear]);

  return (
    <div
      className={cn(
        "fixed z-50 pointer-events-none",
        POSITION_STYLES[defaultPosition],
        className
      )}
    >
      <div className="space-y-2 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={dismiss}
              position={defaultPosition}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});

Toaster.displayName = 'Toaster';

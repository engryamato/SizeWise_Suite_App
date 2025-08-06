/**
 * Error Notification System
 * SizeWise Suite - Centerline Drawing and Magnetic Snapping System
 * 
 * Comprehensive error notification system with toast notifications, persistent alerts,
 * and user action prompts. Integrates with the ErrorHandler system to provide
 * user-friendly error communication for professional HVAC design workflows.
 * 
 * @fileoverview Error notification display system
 * @version 1.1.0
 * @author SizeWise Suite Development Team
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  X, 
  RefreshCw,
  Bug,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ErrorHandler, ErrorNotification } from '@/lib/snap-logic/system/ErrorHandler';
import { ErrorSeverity } from '@/lib/snap-logic/system/SnapLogicError';

/**
 * Notification system props
 */
interface ErrorNotificationSystemProps {
  errorHandler: ErrorHandler;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxNotifications?: number;
  enableSound?: boolean;
  enableHapticFeedback?: boolean;
  className?: string;
}

/**
 * Notification component props
 */
interface NotificationProps {
  notification: ErrorNotification;
  onDismiss: (id: string) => void;
  onAction: (action: () => void) => void;
  enableHapticFeedback?: boolean;
}

/**
 * Individual notification component
 */
const NotificationComponent: React.FC<NotificationProps> = ({
  notification,
  onDismiss,
  onAction,
  enableHapticFeedback
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  // Auto-dismiss timer
  useEffect(() => {
    if (!notification.dismissible) return;

    const duration = 5000; // 5 seconds
    const interval = 50; // Update every 50ms
    const decrement = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - decrement;
        if (newProgress <= 0) {
          setIsVisible(false);
          setTimeout(() => onDismiss(notification.id), 300);
          return 0;
        }
        return newProgress;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [notification.dismissible, notification.id, onDismiss]);

  // Haptic feedback on mount
  useEffect(() => {
    if (enableHapticFeedback && 'vibrate' in navigator) {
      const patterns = {
        [ErrorSeverity.LOW]: 10,
        [ErrorSeverity.MEDIUM]: 25,
        [ErrorSeverity.HIGH]: [50, 30, 50],
        [ErrorSeverity.CRITICAL]: [100, 50, 100, 50, 100]
      };
      
      const pattern = patterns[notification.severity];
      if (pattern) {
        navigator.vibrate(pattern);
      }
    }
  }, [notification.severity, enableHapticFeedback]);

  // Get notification styling based on severity
  const getSeverityStyles = (severity: ErrorSeverity) => {
    const styles = {
      [ErrorSeverity.LOW]: {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-800',
        icon: Info,
        iconColor: 'text-blue-500'
      },
      [ErrorSeverity.MEDIUM]: {
        bg: 'bg-yellow-50 border-yellow-200',
        text: 'text-yellow-800',
        icon: AlertTriangle,
        iconColor: 'text-yellow-500'
      },
      [ErrorSeverity.HIGH]: {
        bg: 'bg-orange-50 border-orange-200',
        text: 'text-orange-800',
        icon: AlertCircle,
        iconColor: 'text-orange-500'
      },
      [ErrorSeverity.CRITICAL]: {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-800',
        icon: AlertTriangle,
        iconColor: 'text-red-500'
      }
    };
    return styles[severity];
  };

  const severityStyle = getSeverityStyles(notification.severity);
  const Icon = severityStyle.icon;

  const handleAction = (action: () => void) => {
    onAction(action);
    if (notification.dismissible) {
      onDismiss(notification.id);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(notification.id), 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.9 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        x: isVisible ? 0 : 300, 
        scale: isVisible ? 1 : 0.9 
      }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'relative w-full max-w-sm rounded-lg border shadow-lg overflow-hidden',
        severityStyle.bg
      )}
    >
      {/* Progress bar for auto-dismiss */}
      {notification.dismissible && (
        <div className="absolute top-0 left-0 h-1 bg-gray-200">
          <div 
            className="h-full bg-gray-400 transition-all duration-50 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Icon className={cn('w-5 h-5', severityStyle.iconColor)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className={cn('text-sm font-medium', severityStyle.text)}>
              {notification.userMessage}
            </div>
            
            {notification.message !== notification.userMessage && (
              <div className="text-xs text-gray-600 mt-1 opacity-75">
                {notification.message}
              </div>
            )}
          </div>

          {/* Dismiss button */}
          {notification.dismissible && (
            <button
              onClick={handleDismiss}
              className={cn(
                'flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors',
                severityStyle.text
              )}
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Actions */}
        {notification.actions && notification.actions.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {notification.actions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleAction(action.action)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  'bg-white/80 hover:bg-white border border-current/20',
                  severityStyle.text
                )}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-500 mt-2 opacity-75">
          {new Date(notification.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Error notification system component
 */
export const ErrorNotificationSystem: React.FC<ErrorNotificationSystemProps> = ({
  errorHandler,
  position = 'top-right',
  maxNotifications = 5,
  enableSound = false,
  enableHapticFeedback = true,
  className
}) => {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);

  // Handle new notifications
  const handleNewNotification = useCallback((notification: ErrorNotification) => {
    setNotifications(prev => {
      const updated = [notification, ...prev];
      
      // Limit number of notifications
      if (updated.length > maxNotifications) {
        return updated.slice(0, maxNotifications);
      }
      
      return updated;
    });

    // Play sound if enabled
    if (enableSound && notification.severity === ErrorSeverity.CRITICAL) {
      try {
        const audio = new Audio('/sounds/error.mp3');
        audio.play().catch(() => {
          // Ignore audio play errors
        });
      } catch {
        // Ignore audio creation errors
      }
    }
  }, [maxNotifications, enableSound]);

  // Handle notification dismissal
  const handleDismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    errorHandler.dismissNotification(notificationId);
  }, [errorHandler]);

  // Handle notification actions
  const handleNotificationAction = useCallback((action: () => void) => {
    try {
      action();
    } catch (error) {
      console.error('[ErrorNotificationSystem] Action failed:', error);
    }
  }, []);

  // Subscribe to error handler notifications
  useEffect(() => {
    errorHandler.addNotificationListener(handleNewNotification);
    
    // Load existing notifications
    const existingNotifications = errorHandler.getActiveNotifications();
    setNotifications(existingNotifications);

    return () => {
      errorHandler.removeNotificationListener(handleNewNotification);
    };
  }, [errorHandler, handleNewNotification]);

  // Get position styles
  const getPositionStyles = (position: string) => {
    const styles = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
    };
    return styles[position as keyof typeof styles] || styles['top-right'];
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed z-50 pointer-events-none',
        getPositionStyles(position),
        className
      )}
    >
      <div className="space-y-3 pointer-events-auto">
        <AnimatePresence mode="popLayout">
          {notifications.map((notification) => (
            <NotificationComponent
              key={notification.id}
              notification={notification}
              onDismiss={handleDismissNotification}
              onAction={handleNotificationAction}
              enableHapticFeedback={enableHapticFeedback}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ErrorNotificationSystem;

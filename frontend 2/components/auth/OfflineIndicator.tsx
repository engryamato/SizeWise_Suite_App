"use client"

import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'

interface OfflineIndicatorProps {
  className?: string
  showDetails?: boolean
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'inline'
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showDetails = false,
  position = 'top-right'
}) => {
  const { isOnline, lastSync, syncWithServer } = useAuthStore()
  const [isRetrying, setIsRetrying] = useState(false)
  const [lastSyncFormatted, setLastSyncFormatted] = useState<string>('')

  useEffect(() => {
    const updateLastSync = () => {
      if (lastSync) {
        const syncDate = new Date(lastSync)
        const now = new Date()
        const diffMs = now.getTime() - syncDate.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))
        const diffHours = Math.floor(diffMins / 60)
        const diffDays = Math.floor(diffHours / 24)

        if (diffMins < 1) {
          setLastSyncFormatted('Just now')
        } else if (diffMins < 60) {
          setLastSyncFormatted(`${diffMins}m ago`)
        } else if (diffHours < 24) {
          setLastSyncFormatted(`${diffHours}h ago`)
        } else {
          setLastSyncFormatted(`${diffDays}d ago`)
        }
      } else {
        setLastSyncFormatted('Never')
      }
    }

    updateLastSync()
    const interval = setInterval(updateLastSync, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [lastSync])

  const handleRetrySync = async () => {
    setIsRetrying(true)
    try {
      await syncWithServer()
    } catch (error) {
      console.error('Sync retry failed:', error)
    } finally {
      setIsRetrying(false)
    }
  }

  const getPositionStyles = () => {
    if (position === 'inline') return ''
    
    const baseStyles = 'fixed z-50'
    switch (position) {
      case 'top-left':
        return `${baseStyles} top-4 left-4`
      case 'top-right':
        return `${baseStyles} top-4 right-4`
      case 'bottom-left':
        return `${baseStyles} bottom-4 left-4`
      case 'bottom-right':
        return `${baseStyles} bottom-4 right-4`
      default:
        return `${baseStyles} top-4 right-4`
    }
  }

  const getStatusIcon = () => {
    if (isRetrying) {
      return <RefreshCw className="w-4 h-4 animate-spin" />
    }
    if (isOnline) {
      return <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
    }
    return <WifiOff className="w-4 h-4 text-red-600 dark:text-red-400" />
  }

  const getStatusColor = () => {
    if (isOnline) {
      return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
    }
    return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
  }

  const getStatusText = () => {
    if (isRetrying) return 'Syncing...'
    if (isOnline) return 'Online'
    return 'Offline'
  }

  // Compact version for inline use
  if (!showDetails) {
    return (
      <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-medium ${getStatusColor()} ${getPositionStyles()} ${className}`}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
        {!isOnline && !isRetrying && (
          <button
            onClick={handleRetrySync}
            className="ml-1 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
            title="Retry connection"
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  // Detailed version
  return (
    <div className={`p-4 rounded-lg border shadow-lg bg-white dark:bg-gray-800 ${getPositionStyles()} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getStatusIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              Connection Status
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isOnline ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' :
              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
            }`}>
              {getStatusText()}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-between">
              <span>Last sync:</span>
              <span className="font-medium">{lastSyncFormatted}</span>
            </div>
            
            {isOnline ? (
              <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                <span>Connected to SizeWise servers</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>Working offline - some features limited</span>
              </div>
            )}
          </div>
          
          {!isOnline && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-medium text-sm text-amber-800 dark:text-amber-200 mb-1">
                Offline Mode Active
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">
                You can continue working with cached data. Some features may be limited:
              </p>
              <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                <li>• Tier limits based on last sync</li>
                <li>• No real-time trial status updates</li>
                <li>• Registration requires connection</li>
              </ul>
            </div>
          )}
          
          <div className="flex items-center space-x-2 mt-3">
            <button
              onClick={handleRetrySync}
              disabled={isRetrying || isOnline}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isOnline 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                  : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
              }`}
            >
              {isRetrying ? 'Syncing...' : 'Retry Connection'}
            </button>
            
            {isOnline && (
              <button
                onClick={handleRetrySync}
                disabled={isRetrying}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
              >
                Refresh Sync
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Simple status dot for minimal UI
export const OfflineStatusDot: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isOnline } = useAuthStore()
  
  return (
    <div 
      className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-green-500' : 'bg-red-500'
      } ${className}`}
      title={isOnline ? 'Online' : 'Offline'}
    />
  )
}

// Network status hook for components that need to react to connectivity
export const useNetworkStatus = () => {
  const { isOnline, lastSync, syncWithServer } = useAuthStore()
  const [isRetrying, setIsRetrying] = useState(false)

  const retryConnection = async () => {
    setIsRetrying(true)
    try {
      const success = await syncWithServer()
      return success
    } catch (error) {
      console.error('Connection retry failed:', error)
      return false
    } finally {
      setIsRetrying(false)
    }
  }

  return {
    isOnline,
    lastSync,
    isRetrying,
    retryConnection,
  }
}

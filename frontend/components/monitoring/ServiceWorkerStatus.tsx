/**
 * Service Worker Status Component
 * 
 * Displays the status of the enhanced service worker and provides controls
 * for cache management, offline queue monitoring, and update management.
 * 
 * @see docs/post-implementation-bridging-plan.md Task 2.1
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Download, 
  Trash2, 
  Clock, 
  Database,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useEnhancedServiceWorker } from '@/hooks/useEnhancedServiceWorker';
import { BackgroundSyncEvent } from '@/lib/services/EnhancedServiceWorkerManager';

// =============================================================================
// Service Worker Status Component
// =============================================================================

export function ServiceWorkerStatus() {
  const {
    status,
    isOnline,
    cacheStatus,
    offlineQueue,
    initialize,
    activateUpdate,
    checkForUpdates,
    clearCache,
    refreshCacheStatus,
    refreshOfflineQueue,
    onUpdateAvailable,
    onBackgroundSyncSuccess,
    onBackgroundSyncFailed,
    isBackgroundSyncSupported,
    isPushNotificationSupported
  } = useEnhancedServiceWorker();

  const [isLoading, setIsLoading] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [syncEvents, setSyncEvents] = useState<BackgroundSyncEvent[]>([]);

  // =============================================================================
  // Event Handlers
  // =============================================================================

  useEffect(() => {
    onUpdateAvailable(() => {
      setUpdateAvailable(true);
    });

    onBackgroundSyncSuccess((event) => {
      setSyncEvents(prev => [...prev.slice(-9), event]);
    });

    onBackgroundSyncFailed((event) => {
      setSyncEvents(prev => [...prev.slice(-9), event]);
    });
  }, [onUpdateAvailable, onBackgroundSyncSuccess, onBackgroundSyncFailed]);

  // =============================================================================
  // Action Handlers
  // =============================================================================

  const handleInitialize = async () => {
    setIsLoading(true);
    try {
      await initialize();
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateUpdate = async () => {
    setIsLoading(true);
    try {
      await activateUpdate();
      setUpdateAvailable(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckForUpdates = async () => {
    setIsLoading(true);
    try {
      await checkForUpdates();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async (cacheType?: string) => {
    setIsLoading(true);
    try {
      await clearCache(cacheType);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        refreshCacheStatus(),
        refreshOfflineQueue()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================================================
  // Utility Functions
  // =============================================================================

  const getStatusBadge = () => {
    if (!status.isSupported) {
      return <Badge variant="destructive">Not Supported</Badge>;
    }
    if (!status.isRegistered) {
      return <Badge variant="secondary">Not Registered</Badge>;
    }
    if (!status.isActive) {
      return <Badge variant="outline">Inactive</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getOnlineStatusIcon = () => {
    return isOnline ? (
      <Wifi className="h-4 w-4 text-green-500" />
    ) : (
      <WifiOff className="h-4 w-4 text-red-500" />
    );
  };

  const formatCacheSize = (entries: number) => {
    if (entries === 0) return '0 entries';
    if (entries === 1) return '1 entry';
    return `${entries} entries`;
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // =============================================================================
  // Render
  // =============================================================================

  return (
    <div className="space-y-6">
      {/* Service Worker Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Enhanced Service Worker Status
            {getOnlineStatusIcon()}
          </CardTitle>
          <CardDescription>
            Advanced offline capabilities for HVAC calculations and data management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Status:</span>
            {getStatusBadge()}
          </div>
          
          <div className="flex items-center justify-between">
            <span>Online:</span>
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? "Connected" : "Offline"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>Background Sync:</span>
            <Badge variant={isBackgroundSyncSupported ? "default" : "secondary"}>
              {isBackgroundSyncSupported ? "Supported" : "Not Supported"}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span>Push Notifications:</span>
            <Badge variant={isPushNotificationSupported ? "default" : "secondary"}>
              {isPushNotificationSupported ? "Supported" : "Not Supported"}
            </Badge>
          </div>

          <Separator />

          <div className="flex gap-2 flex-wrap">
            {!status.isRegistered && (
              <Button 
                onClick={handleInitialize} 
                disabled={isLoading}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Initialize
              </Button>
            )}
            
            <Button 
              onClick={handleCheckForUpdates} 
              disabled={isLoading || !status.isActive}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Check Updates
            </Button>

            <Button 
              onClick={handleRefresh} 
              disabled={isLoading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {updateAvailable && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>A service worker update is available.</span>
                <Button 
                  onClick={handleActivateUpdate}
                  disabled={isLoading}
                  size="sm"
                >
                  Activate Update
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Cache Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Cache Status
          </CardTitle>
          <CardDescription>
            Current cache usage for offline functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cacheStatus ? (
            <div className="space-y-3">
              {Object.entries(cacheStatus).map(([key, cache]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatCacheSize(cache.entries)}
                    </span>
                    <Button
                      onClick={() => handleClearCache(key)}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Separator />
              
              <Button
                onClick={() => handleClearCache()}
                disabled={isLoading}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Caches
              </Button>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              Cache status not available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Offline Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Offline Queue
          </CardTitle>
          <CardDescription>
            Operations queued for when connection is restored
          </CardDescription>
        </CardHeader>
        <CardContent>
          {offlineQueue.length > 0 ? (
            <div className="space-y-2">
              {offlineQueue.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {item.method} {item.url}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Queued at {formatTimestamp(item.timestamp)}
                    </div>
                  </div>
                  <Badge variant="outline" className="ml-2">
                    {item.method}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              No operations in queue
            </div>
          )}
        </CardContent>
      </Card>

      {/* Background Sync Events */}
      {syncEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Recent Sync Events
            </CardTitle>
            <CardDescription>
              Background synchronization activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {syncEvents.slice(-5).reverse().map((event, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  {event.type === 'BACKGROUND_SYNC_SUCCESS' ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <div className="flex-1">
                    <div className="text-sm">
                      {event.type === 'BACKGROUND_SYNC_SUCCESS' ? 'Success' : 'Failed'}: {event.url}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Queue ID: {event.queueId}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ServiceWorkerStatus;

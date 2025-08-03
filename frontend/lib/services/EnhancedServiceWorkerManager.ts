/**
 * Enhanced Service Worker Manager for SizeWise Suite
 * 
 * Manages the enhanced service worker alongside the existing next-pwa service worker.
 * Provides advanced offline capabilities for HVAC calculations and data management.
 * 
 * @see docs/post-implementation-bridging-plan.md Task 2.1
 */

import { EventEmitter } from 'events';

// =============================================================================
// Types and Interfaces
// =============================================================================

export interface ServiceWorkerStatus {
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  hasUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
}

export interface CacheStatus {
  HVAC_CALCULATIONS: { name: string; entries: number };
  HVAC_DATA: { name: string; entries: number };
  OFFLINE_QUEUE: { name: string; entries: number };
  COMPLIANCE_DATA: { name: string; entries: number };
  PROJECT_DATA: { name: string; entries: number };
}

export interface OfflineQueueItem {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string | null;
  timestamp: string;
}

export interface BackgroundSyncEvent {
  type: 'BACKGROUND_SYNC_SUCCESS' | 'BACKGROUND_SYNC_FAILED';
  queueId: string;
  url: string;
  error?: string;
}

// =============================================================================
// Enhanced Service Worker Manager
// =============================================================================

export class EnhancedServiceWorkerManager extends EventEmitter {
  private registration: ServiceWorkerRegistration | null = null;
  private isInitialized = false;
  private updateCheckInterval: NodeJS.Timeout | null = null;
  private config: {
    enableAutoUpdate: boolean;
    updateCheckIntervalMs: number;
    enableBackgroundSync: boolean;
    enableOfflineQueue: boolean;
  };

  constructor(config: Partial<typeof EnhancedServiceWorkerManager.prototype.config> = {}) {
    super();
    
    this.config = {
      enableAutoUpdate: true,
      updateCheckIntervalMs: 60000, // 1 minute
      enableBackgroundSync: true,
      enableOfflineQueue: true,
      ...config
    };
  }

  // =============================================================================
  // Initialization and Registration
  // =============================================================================

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (!this.isServiceWorkerSupported()) {
      console.warn('[Enhanced SW Manager] Service Workers not supported');
      return false;
    }

    try {
      // Register the enhanced service worker alongside next-pwa
      this.registration = await navigator.serviceWorker.register('/enhanced-sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('[Enhanced SW Manager] Enhanced service worker registered successfully');

      // Set up event listeners
      this.setupEventListeners();

      // Start update checking if enabled
      if (this.config.enableAutoUpdate) {
        this.startUpdateChecking();
      }

      this.isInitialized = true;
      this.emit('initialized', { registration: this.registration });

      return true;
    } catch (error) {
      console.error('[Enhanced SW Manager] Failed to register enhanced service worker:', error);
      this.emit('error', { error, context: 'registration' });
      return false;
    }
  }

  private setupEventListeners(): void {
    if (!this.registration) return;

    // Listen for service worker updates
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.emit('updateAvailable', { registration: this.registration });
          }
        });
      }
    });

    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });

    // Listen for controller changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      this.emit('controllerChanged');
    });
  }

  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'BACKGROUND_SYNC_SUCCESS':
        this.emit('backgroundSyncSuccess', data as BackgroundSyncEvent);
        break;
      case 'BACKGROUND_SYNC_FAILED':
        this.emit('backgroundSyncFailed', data as BackgroundSyncEvent);
        break;
      case 'CACHE_STATUS':
        this.emit('cacheStatus', data as CacheStatus);
        break;
      case 'CACHE_CLEARED':
        this.emit('cacheCleared', data);
        break;
      case 'OFFLINE_QUEUE':
        this.emit('offlineQueue', data as OfflineQueueItem[]);
        break;
      default:
        console.log('[Enhanced SW Manager] Unknown message from service worker:', type);
    }
  }

  // =============================================================================
  // Service Worker Status and Control
  // =============================================================================

  getStatus(): ServiceWorkerStatus {
    return {
      isSupported: this.isServiceWorkerSupported(),
      isRegistered: this.registration !== null,
      isActive: this.registration?.active !== null,
      hasUpdate: this.registration?.waiting !== null,
      registration: this.registration
    };
  }

  async activateUpdate(): Promise<boolean> {
    if (!this.registration?.waiting) {
      return false;
    }

    try {
      // Tell the waiting service worker to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload the page to activate the new service worker
      window.location.reload();
      
      return true;
    } catch (error) {
      console.error('[Enhanced SW Manager] Failed to activate update:', error);
      this.emit('error', { error, context: 'activateUpdate' });
      return false;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      
      if (result) {
        this.registration = null;
        this.isInitialized = false;
        this.stopUpdateChecking();
        this.emit('unregistered');
      }
      
      return result;
    } catch (error) {
      console.error('[Enhanced SW Manager] Failed to unregister service worker:', error);
      this.emit('error', { error, context: 'unregister' });
      return false;
    }
  }

  // =============================================================================
  // Cache Management
  // =============================================================================

  async getCacheStatus(): Promise<CacheStatus | null> {
    if (!this.registration?.active) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_STATUS') {
          resolve(event.data.data);
        } else {
          reject(new Error('Unexpected response type'));
        }
      };

      this.registration!.active!.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Cache status request timeout')), 5000);
    });
  }

  async clearCache(cacheType?: string): Promise<boolean> {
    if (!this.registration?.active) {
      return false;
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'CACHE_CLEARED') {
          resolve(true);
        } else {
          reject(new Error('Unexpected response type'));
        }
      };

      this.registration!.active!.postMessage(
        { type: 'CLEAR_CACHE', data: { cacheType } },
        [messageChannel.port2]
      );

      // Timeout after 10 seconds
      setTimeout(() => reject(new Error('Clear cache request timeout')), 10000);
    });
  }

  // =============================================================================
  // Offline Queue Management
  // =============================================================================

  async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    if (!this.registration?.active) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'OFFLINE_QUEUE') {
          resolve(event.data.data);
        } else {
          reject(new Error('Unexpected response type'));
        }
      };

      this.registration!.active!.postMessage(
        { type: 'GET_OFFLINE_QUEUE' },
        [messageChannel.port2]
      );

      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Offline queue request timeout')), 5000);
    });
  }

  // =============================================================================
  // Update Management
  // =============================================================================

  private startUpdateChecking(): void {
    if (this.updateCheckInterval) {
      return;
    }

    this.updateCheckInterval = setInterval(() => {
      this.checkForUpdates();
    }, this.config.updateCheckIntervalMs);
  }

  private stopUpdateChecking(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }

  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      await this.registration.update();
      return true;
    } catch (error) {
      console.error('[Enhanced SW Manager] Failed to check for updates:', error);
      this.emit('error', { error, context: 'checkForUpdates' });
      return false;
    }
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  private isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  isBackgroundSyncSupported(): boolean {
    return 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype;
  }

  isPushNotificationSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // =============================================================================
  // Cleanup
  // =============================================================================

  destroy(): void {
    this.stopUpdateChecking();
    this.removeAllListeners();
    this.registration = null;
    this.isInitialized = false;
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let enhancedServiceWorkerManager: EnhancedServiceWorkerManager | null = null;

export function getEnhancedServiceWorkerManager(): EnhancedServiceWorkerManager {
  if (!enhancedServiceWorkerManager) {
    enhancedServiceWorkerManager = new EnhancedServiceWorkerManager();
  }
  return enhancedServiceWorkerManager;
}

export default EnhancedServiceWorkerManager;

/**
 * Enhanced Offline Service with Dexie.js Integration
 * 
 * Provides high-performance offline-first data operations with:
 * - Dexie.js for optimized IndexedDB operations
 * - Automatic sync queue management
 * - Conflict resolution strategies
 * - Performance monitoring
 * - Data integrity validation
 */

import { getSizeWiseDatabase, SizeWiseDatabase, SizeWiseProject, SizeWiseCalculation, SpatialDataLayer } from '../database/DexieDatabase';
import { Project, CalculationResult, CalculationInput } from '@/types/air-duct-sizer';
import { EventEmitter } from 'events';

// =============================================================================
// Service Interfaces
// =============================================================================

export interface OfflineServiceConfig {
  enableAutoSync: boolean;
  syncIntervalMs: number;
  maxRetryAttempts: number;
  enablePerformanceMonitoring: boolean;
  enableDataValidation: boolean;
}

export interface SyncStatus {
  isOnline: boolean;
  lastSyncAttempt: Date | null;
  lastSuccessfulSync: Date | null;
  pendingOperations: number;
  failedOperations: number;
  syncInProgress: boolean;
}

export interface PerformanceMetrics {
  averageQueryTime: number;
  totalQueries: number;
  cacheHitRate: number;
  storageUsage: number;
  lastMeasurement: Date;
}

// =============================================================================
// Enhanced Offline Service
// =============================================================================

export class EnhancedOfflineService extends EventEmitter {
  private db: SizeWiseDatabase;
  private config: OfflineServiceConfig;
  private syncStatus: SyncStatus;
  private performanceMetrics: PerformanceMetrics;
  private queryCache: Map<string, { data: any; timestamp: Date; ttl: number }>;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<OfflineServiceConfig> = {}) {
    super();
    
    this.db = getSizeWiseDatabase();
    this.config = {
      enableAutoSync: false, // Disabled for offline-first mode
      syncIntervalMs: 30000, // 30 seconds
      maxRetryAttempts: 3,
      enablePerformanceMonitoring: true,
      enableDataValidation: true,
      ...config
    };

    this.syncStatus = {
      isOnline: false,
      lastSyncAttempt: null,
      lastSuccessfulSync: null,
      pendingOperations: 0,
      failedOperations: 0,
      syncInProgress: false
    };

    this.performanceMetrics = {
      averageQueryTime: 0,
      totalQueries: 0,
      cacheHitRate: 0,
      storageUsage: 0,
      lastMeasurement: new Date()
    };

    this.queryCache = new Map();

    this.initialize();
  }

  // =============================================================================
  // Initialization
  // =============================================================================

  private async initialize(): Promise<void> {
    try {
      await this.db.open();
      await this.updateSyncStatus();
      
      if (this.config.enableAutoSync) {
        this.startAutoSync();
      }

      this.emit('initialized');
      console.log('✅ Enhanced Offline Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Offline Service:', error);
      this.emit('error', error);
    }
  }

  // =============================================================================
  // Project Operations
  // =============================================================================

  async createProject(projectData: Omit<Project, 'id'>): Promise<string> {
    const startTime = performance.now();
    
    try {
      const uuid = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const sizeWiseProject: Omit<SizeWiseProject, 'id' | 'lastModified' | 'syncStatus' | 'version'> = {
        ...projectData,
        uuid,
        rooms: projectData.rooms || [],
        segments: projectData.segments || [],
        equipment: projectData.equipment || []
      };

      await this.db.createProject(sizeWiseProject);
      
      this.recordPerformanceMetric(startTime);
      this.invalidateCache('projects');
      this.emit('project:created', { uuid, project: sizeWiseProject });
      
      return uuid;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  async updateProject(uuid: string, updates: Partial<Project>): Promise<void> {
    const startTime = performance.now();
    
    try {
      await this.db.updateProject(uuid, updates as any);
      
      this.recordPerformanceMetric(startTime);
      this.invalidateCache('projects');
      this.invalidateCache(`project:${uuid}`);
      this.emit('project:updated', { uuid, updates });
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  }

  async getProject(uuid: string): Promise<Project | null> {
    const startTime = performance.now();
    const cacheKey = `project:${uuid}`;
    
    try {
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        this.recordPerformanceMetric(startTime, true);
        return cached;
      }

      const sizeWiseProject = await this.db.getProject(uuid);
      if (!sizeWiseProject) {
        this.recordPerformanceMetric(startTime);
        return null;
      }

      const project: Project = this.convertFromSizeWiseProject(sizeWiseProject);
      
      // Cache the result
      this.setCachedData(cacheKey, project, 300000); // 5 minutes TTL
      
      this.recordPerformanceMetric(startTime);
      return project;
    } catch (error) {
      console.error('Failed to get project:', error);
      throw error;
    }
  }

  async getAllProjects(): Promise<Project[]> {
    const startTime = performance.now();
    const cacheKey = 'projects';
    
    try {
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        this.recordPerformanceMetric(startTime, true);
        return cached;
      }

      const sizeWiseProjects = await this.db.getAllProjects();
      const projects = sizeWiseProjects.map(p => this.convertFromSizeWiseProject(p));
      
      // Cache the result
      this.setCachedData(cacheKey, projects, 60000); // 1 minute TTL
      
      this.recordPerformanceMetric(startTime);
      return projects;
    } catch (error) {
      console.error('Failed to get all projects:', error);
      throw error;
    }
  }

  async deleteProject(uuid: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      await this.db.deleteProject(uuid);
      
      this.recordPerformanceMetric(startTime);
      this.invalidateCache('projects');
      this.invalidateCache(`project:${uuid}`);
      this.emit('project:deleted', { uuid });
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  // =============================================================================
  // Calculation Operations
  // =============================================================================

  async saveCalculation(
    projectUuid: string,
    input: CalculationInput,
    result: CalculationResult,
    segmentUuid?: string,
    roomUuid?: string
  ): Promise<string> {
    const startTime = performance.now();
    
    try {
      const uuid = `calc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const calculation: Omit<SizeWiseCalculation, 'id' | 'timestamp' | 'syncStatus'> = {
        uuid,
        projectUuid,
        segmentUuid,
        roomUuid,
        calculationType: input.duct_type || 'rectangular',
        inputData: input,
        result
      };

      await this.db.saveCalculation(calculation);
      
      this.recordPerformanceMetric(startTime);
      this.invalidateCache(`calculations:${projectUuid}`);
      this.emit('calculation:saved', { uuid, calculation });
      
      return uuid;
    } catch (error) {
      console.error('Failed to save calculation:', error);
      throw error;
    }
  }

  async getCalculationsByProject(projectUuid: string): Promise<SizeWiseCalculation[]> {
    const startTime = performance.now();
    const cacheKey = `calculations:${projectUuid}`;
    
    try {
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        this.recordPerformanceMetric(startTime, true);
        return cached;
      }

      const calculations = await this.db.getCalculationsByProject(projectUuid);
      
      // Cache the result
      this.setCachedData(cacheKey, calculations, 120000); // 2 minutes TTL
      
      this.recordPerformanceMetric(startTime);
      return calculations;
    } catch (error) {
      console.error('Failed to get calculations:', error);
      throw error;
    }
  }

  // =============================================================================
  // Spatial Data Operations
  // =============================================================================

  async saveSpatialLayer(
    projectUuid: string,
    layerType: SpatialDataLayer['layerType'],
    geometry: any,
    properties: Record<string, any> = {}
  ): Promise<string> {
    const startTime = performance.now();
    
    try {
      const uuid = `spatial-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const layer: Omit<SpatialDataLayer, 'id' | 'lastModified' | 'syncStatus'> = {
        uuid,
        projectUuid,
        layerType,
        geometry,
        properties,
        visible: true,
        locked: false
      };

      await this.db.saveSpatialLayer(layer);
      
      this.recordPerformanceMetric(startTime);
      this.invalidateCache(`spatial:${projectUuid}`);
      this.emit('spatial:saved', { uuid, layer });
      
      return uuid;
    } catch (error) {
      console.error('Failed to save spatial layer:', error);
      throw error;
    }
  }

  async getSpatialLayersByProject(projectUuid: string): Promise<SpatialDataLayer[]> {
    const startTime = performance.now();
    const cacheKey = `spatial:${projectUuid}`;
    
    try {
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        this.recordPerformanceMetric(startTime, true);
        return cached;
      }

      const layers = await this.db.getSpatialLayersByProject(projectUuid);
      
      // Cache the result
      this.setCachedData(cacheKey, layers, 180000); // 3 minutes TTL
      
      this.recordPerformanceMetric(startTime);
      return layers;
    } catch (error) {
      console.error('Failed to get spatial layers:', error);
      throw error;
    }
  }

  // =============================================================================
  // Sync Operations
  // =============================================================================

  async getSyncStatus(): Promise<SyncStatus> {
    await this.updateSyncStatus();
    return { ...this.syncStatus };
  }

  private async updateSyncStatus(): Promise<void> {
    try {
      const pendingOps = await this.db.getPendingSyncOperations();
      this.syncStatus.pendingOperations = pendingOps.length;
      this.syncStatus.failedOperations = pendingOps.filter(op => op.status === 'failed').length;
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  }

  async forceSyncAll(): Promise<void> {
    // In offline-first mode, this would prepare data for future sync
    console.log('📝 Sync operations queued for future online mode');
    this.emit('sync:queued');
  }

  // =============================================================================
  // Performance Monitoring
  // =============================================================================

  private recordPerformanceMetric(startTime: number, cacheHit: boolean = false): void {
    if (!this.config.enablePerformanceMonitoring) return;

    const queryTime = performance.now() - startTime;
    this.performanceMetrics.totalQueries++;
    
    if (cacheHit) {
      this.performanceMetrics.cacheHitRate = 
        (this.performanceMetrics.cacheHitRate * (this.performanceMetrics.totalQueries - 1) + 1) / 
        this.performanceMetrics.totalQueries;
    } else {
      this.performanceMetrics.averageQueryTime = 
        (this.performanceMetrics.averageQueryTime * (this.performanceMetrics.totalQueries - 1) + queryTime) / 
        this.performanceMetrics.totalQueries;
    }

    this.performanceMetrics.lastMeasurement = new Date();
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    const stats = await this.db.getStorageStats();
    this.performanceMetrics.storageUsage = stats.totalSize;
    return { ...this.performanceMetrics };
  }

  // =============================================================================
  // Cache Management
  // =============================================================================

  private getCachedData(key: string): any | null {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    const now = new Date();
    if (now.getTime() - cached.timestamp.getTime() > cached.ttl) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCachedData(key: string, data: any, ttl: number): void {
    this.queryCache.set(key, {
      data,
      timestamp: new Date(),
      ttl
    });
  }

  private invalidateCache(pattern: string): void {
    for (const key of this.queryCache.keys()) {
      if (key.includes(pattern)) {
        this.queryCache.delete(key);
      }
    }
  }

  // =============================================================================
  // Utility Methods
  // =============================================================================

  private convertFromSizeWiseProject(sizeWiseProject: SizeWiseProject): Project {
    const { id, uuid, lastModified, syncStatus, version, ...projectData } = sizeWiseProject;
    return {
      id: uuid,
      ...projectData
    };
  }

  private startAutoSync(): void {
    if (this.syncTimer) return;

    this.syncTimer = setInterval(async () => {
      if (!this.syncStatus.syncInProgress && this.syncStatus.isOnline) {
        await this.forceSyncAll();
      }
    }, this.config.syncIntervalMs);
  }

  private stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // =============================================================================
  // Cleanup
  // =============================================================================

  async cleanup(): Promise<void> {
    this.stopAutoSync();
    this.queryCache.clear();
    await this.db.clearOldSyncOperations();
    this.emit('cleanup:completed');
  }

  async close(): Promise<void> {
    await this.cleanup();
    await this.db.close();
    this.emit('closed');
  }
}

// =============================================================================
// Factory Function
// =============================================================================

export async function createEnhancedOfflineService(config?: Partial<OfflineServiceConfig>): Promise<EnhancedOfflineService> {
  const service = new EnhancedOfflineService(config);
  
  // Wait for initialization
  return new Promise((resolve, reject) => {
    service.once('initialized', () => resolve(service));
    service.once('error', reject);
  });
}

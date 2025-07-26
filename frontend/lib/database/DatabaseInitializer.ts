/**
 * Database Initializer for Frontend
 * 
 * Handles SQLite database initialization for offline desktop mode.
 * Creates and manages the local database connection for Phase 1 operation.
 * 
 * @see docs/implementation/tier-system/repository-pattern-guide.md
 */

import { BrowserDatabaseManager, initializeBrowserDatabase } from './BrowserDatabaseManager';
import { BrowserProjectRepository } from '../repositories/browser/BrowserProjectRepository';
import { BrowserUserRepository } from '../repositories/browser/BrowserUserRepository';
import { BrowserFeatureFlagRepository } from '../repositories/browser/BrowserFeatureFlagRepository';

/**
 * Database configuration for frontend
 */
export interface DatabaseConfig {
  filePath: string;
  enableWAL: boolean;
  enableForeignKeys: boolean;
  timeout: number;
  verbose: boolean;
}

/**
 * Repository container for dependency injection
 */
export interface RepositoryContainer {
  projectRepository: BrowserProjectRepository;
  userRepository: BrowserUserRepository;
  featureFlagRepository: BrowserFeatureFlagRepository;
}

/**
 * Database initialization result
 */
export interface DatabaseInitResult {
  success: boolean;
  dbManager: BrowserDatabaseManager | null;
  repositories: RepositoryContainer | null;
  error?: string;
}

/**
 * Database initializer for offline desktop mode
 */
export class DatabaseInitializer {
  private static instance: DatabaseInitializer | null = null;
  private dbManager: BrowserDatabaseManager | null = null;
  private repositories: RepositoryContainer | null = null;
  private initialized = false;

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseInitializer {
    if (!DatabaseInitializer.instance) {
      DatabaseInitializer.instance = new DatabaseInitializer();
    }
    return DatabaseInitializer.instance;
  }

  /**
   * Initialize database for offline mode
   */
  public async initialize(config?: Partial<DatabaseConfig>): Promise<DatabaseInitResult> {
    if (this.initialized && this.dbManager && this.repositories) {
      return {
        success: true,
        dbManager: this.dbManager,
        repositories: this.repositories
      };
    }

    try {
      console.log('🗄️ Initializing IndexedDB database for offline mode...');

      // Initialize browser database manager
      this.dbManager = await initializeBrowserDatabase();

      console.log('✅ Database initialized successfully');

      // Create repositories
      this.repositories = this.createRepositories(this.dbManager);

      console.log('✅ Repositories created successfully');

      // Initialize default data
      await this.initializeDefaultData();

      console.log('✅ Default data initialized');

      this.initialized = true;

      return {
        success: true,
        dbManager: this.dbManager,
        repositories: this.repositories
      };

    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      
      return {
        success: false,
        dbManager: null,
        repositories: null,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  /**
   * Get database manager instance
   */
  public getDatabaseManager(): BrowserDatabaseManager | null {
    return this.dbManager;
  }

  /**
   * Get repositories container
   */
  public getRepositories(): RepositoryContainer | null {
    return this.repositories;
  }

  /**
   * Check if database is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Close database connection
   */
  public async close(): Promise<void> {
    if (this.dbManager) {
      await this.dbManager.close();
      this.dbManager = null;
      this.repositories = null;
      this.initialized = false;
      console.log('🗄️ Database connection closed');
    }
  }

  // Note: Database configuration not needed for browser IndexedDB

  /**
   * Create repository instances
   */
  private createRepositories(dbManager: BrowserDatabaseManager): RepositoryContainer {
    return {
      projectRepository: new BrowserProjectRepository(dbManager),
      userRepository: new BrowserUserRepository(dbManager),
      featureFlagRepository: new BrowserFeatureFlagRepository(dbManager)
    };
  }

  /**
   * Initialize default data for offline mode
   */
  private async initializeDefaultData(): Promise<void> {
    if (!this.repositories) {
      throw new Error('Repositories not initialized');
    }

    try {
      // Check if default user exists
      const existingUsers = await this.repositories.userRepository.getAllUsers();
      
      if (existingUsers.length === 0) {
        // Create default offline user
        const defaultUser = {
          id: 'offline-user-001',
          email: 'offline@sizewise.local',
          name: 'Offline User',
          tier: 'free' as const,
          company: 'Local Company',
          licenseKey: 'OFFLINE-LICENSE-001',
          organizationId: null,
          settings: {
            theme: 'system',
            units: 'imperial',
            autoSave: true
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await this.repositories.userRepository.saveUser(defaultUser);
        console.log('✅ Default offline user created');
      }

      // Initialize default feature flags for free tier
      await this.initializeDefaultFeatureFlags();

    } catch (error) {
      console.error('❌ Failed to initialize default data:', error);
      throw error;
    }
  }

  /**
   * Initialize default feature flags for offline mode
   */
  private async initializeDefaultFeatureFlags(): Promise<void> {
    if (!this.repositories) {
      throw new Error('Repositories not initialized');
    }

    const defaultFeatures = [
      {
        id: 'feature-air-duct-sizer',
        userId: null, // Global flag
        organizationId: null,
        featureName: 'air_duct_sizer',
        enabled: true,
        tierRequired: 'free' as const,
        expiresAt: null,
        metadata: { description: 'Basic air duct sizing calculations' },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'feature-project-management',
        userId: null,
        organizationId: null,
        featureName: 'project_management',
        enabled: true,
        tierRequired: 'free' as const,
        expiresAt: null,
        metadata: { description: 'Basic project management features' },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'feature-basic-export',
        userId: null,
        organizationId: null,
        featureName: 'basic_export',
        enabled: true,
        tierRequired: 'free' as const,
        expiresAt: null,
        metadata: { description: 'Basic export functionality with watermark' },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const feature of defaultFeatures) {
      try {
        const existing = await this.repositories.featureFlagRepository.getFeatureFlag(
          feature.userId || null,
          feature.featureName
        );
        
        if (!existing) {
          const featureFlag = {
            ...feature,
            userId: feature.userId || undefined,
            organizationId: feature.organizationId || undefined,
            expiresAt: feature.expiresAt || undefined
          };
          await this.repositories.featureFlagRepository.setFeatureFlag(featureFlag);
        }
      } catch (error) {
        console.warn(`Failed to initialize feature flag ${feature.featureName}:`, error);
      }
    }

    console.log('✅ Default feature flags initialized');
  }

  /**
   * Reset database (for development/testing)
   */
  public async reset(): Promise<void> {
    if (this.dbManager) {
      await this.dbManager.deleteDatabase();
      this.dbManager = null;
      this.repositories = null;
      this.initialized = false;
    }

    // Reinitialize
    await this.initialize();
  }

  /**
   * Get database statistics
   */
  public async getStats(): Promise<any> {
    if (!this.dbManager || !this.repositories) {
      return null;
    }

    try {
      return await this.dbManager.getStats();
    } catch (error) {
      console.error('Failed to get database stats:', error);
      return null;
    }
  }
}

/**
 * Convenience function to get initialized database
 */
export async function initializeOfflineDatabase(config?: Partial<DatabaseConfig>): Promise<DatabaseInitResult> {
  const initializer = DatabaseInitializer.getInstance();
  return await initializer.initialize(config);
}

/**
 * Convenience function to get repositories
 */
export function getOfflineRepositories(): RepositoryContainer | null {
  const initializer = DatabaseInitializer.getInstance();
  return initializer.getRepositories();
}

/**
 * Convenience function to check if database is ready
 */
export function isDatabaseReady(): boolean {
  const initializer = DatabaseInitializer.getInstance();
  return initializer.isInitialized();
}

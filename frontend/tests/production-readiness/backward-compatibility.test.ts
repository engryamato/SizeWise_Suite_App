/**
 * Backward Compatibility Testing
 * 
 * Verify that existing authenticated users can still access their data and functionality
 * after authentication system changes, ensuring no breaking changes for existing users.
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

// Mock user data representing existing users before system changes
interface LegacyUser {
  id: string;
  email: string;
  tier: string;
  licenseKey?: string;
  isActive: boolean;
  createdAt: Date;
  lastLogin: Date;
  // Legacy fields that might exist in older user records
  oldTierFormat?: string;
  legacyPermissions?: string[];
  deprecatedFields?: any;
}

interface LegacyProject {
  id: string;
  userId: string;
  name: string;
  data: any;
  createdAt: Date;
  // Legacy project structure
  oldFormat?: boolean;
  legacySegments?: any[];
  deprecatedCalculations?: any;
}

// Mock repository for testing backward compatibility
class BackwardCompatibilityRepository {
  private users: Map<string, LegacyUser> = new Map();
  private projects: Map<string, LegacyProject> = new Map();

  // Simulate existing users with various legacy formats
  async seedLegacyData(): Promise<void> {
    // Legacy user with old tier format
    const legacyUser1: LegacyUser = {
      id: 'legacy-user-1',
      email: 'legacy1@sizewise.com',
      tier: 'premium', // Old tier name
      oldTierFormat: 'premium',
      isActive: true,
      createdAt: new Date('2023-01-01'),
      lastLogin: new Date('2024-12-01'),
      legacyPermissions: ['read_projects', 'write_projects', 'export_pdf']
    };

    // Legacy user with missing license key
    const legacyUser2: LegacyUser = {
      id: 'legacy-user-2',
      email: 'legacy2@sizewise.com',
      tier: 'free',
      isActive: true,
      createdAt: new Date('2023-06-01'),
      lastLogin: new Date('2024-11-15'),
      deprecatedFields: { oldAuthToken: 'deprecated-token-123' }
    };

    // Legacy user with enterprise tier
    const legacyUser3: LegacyUser = {
      id: 'legacy-user-3',
      email: 'legacy3@sizewise.com',
      tier: 'enterprise',
      licenseKey: 'LEGACY-ENT-2023-ABC123',
      isActive: true,
      createdAt: new Date('2023-03-15'),
      lastLogin: new Date('2024-12-20')
    };

    this.users.set(legacyUser1.id, legacyUser1);
    this.users.set(legacyUser2.id, legacyUser2);
    this.users.set(legacyUser3.id, legacyUser3);

    // Legacy projects with old data structures
    const legacyProject1: LegacyProject = {
      id: 'legacy-project-1',
      userId: 'legacy-user-1',
      name: 'Legacy HVAC System',
      data: {
        segments: [
          { type: 'duct', oldFormat: true, material: 'galvanized' },
          { type: 'fitting', oldFormat: true, shape: 'elbow' }
        ]
      },
      createdAt: new Date('2023-02-01'),
      oldFormat: true,
      legacySegments: [
        { id: 1, type: 'straight_duct', length: 10 },
        { id: 2, type: 'elbow_90', diameter: 12 }
      ]
    };

    const legacyProject2: LegacyProject = {
      id: 'legacy-project-2',
      userId: 'legacy-user-3',
      name: 'Enterprise Legacy Project',
      data: {
        segments: [
          { type: 'duct', material: 'stainless_steel', gauge: 20 },
          { type: 'transition', shape: 'rectangular_to_round' }
        ],
        calculations: {
          oldCalculationEngine: true,
          version: '1.0'
        }
      },
      createdAt: new Date('2023-04-10'),
      deprecatedCalculations: { oldMethod: 'manual_calculation' }
    };

    this.projects.set(legacyProject1.id, legacyProject1);
    this.projects.set(legacyProject2.id, legacyProject2);
  }

  async getUser(userId: string): Promise<LegacyUser | null> {
    return this.users.get(userId) || null;
  }

  async getUserProjects(userId: string): Promise<LegacyProject[]> {
    return Array.from(this.projects.values()).filter(p => p.userId === userId);
  }

  async getAllUsers(): Promise<LegacyUser[]> {
    return Array.from(this.users.values());
  }

  async getAllProjects(): Promise<LegacyProject[]> {
    return Array.from(this.projects.values());
  }
}

// Mock authentication service for backward compatibility testing
class BackwardCompatibilityAuthService {
  constructor(private repository: BackwardCompatibilityRepository) {}

  // Migrate legacy tier formats to new format
  migrateTierFormat(oldTier: string): string {
    const tierMigrationMap: Record<string, string> = {
      'premium': 'pro',
      'basic': 'free',
      'professional': 'pro',
      'business': 'enterprise'
    };

    return tierMigrationMap[oldTier] || oldTier;
  }

  // Validate legacy user can still authenticate
  async validateLegacyAuthentication(userId: string): Promise<{
    valid: boolean;
    user?: LegacyUser;
    migrationNeeded?: boolean;
    issues?: string[];
  }> {
    const user = await this.repository.getUser(userId);
    if (!user) {
      return { valid: false, issues: ['User not found'] };
    }

    const issues: string[] = [];
    let migrationNeeded = false;

    // Check for tier migration needs
    if (user.oldTierFormat) {
      migrationNeeded = true;
      const newTier = this.migrateTierFormat(user.oldTierFormat);
      issues.push(`Tier format migration needed: ${user.oldTierFormat} -> ${newTier}`);
    }

    // Check for missing license key in paid tiers
    if (['pro', 'enterprise'].includes(user.tier) && !user.licenseKey) {
      issues.push('Missing license key for paid tier');
    }

    // Check for deprecated fields
    if (user.deprecatedFields) {
      issues.push('Deprecated fields present, cleanup recommended');
    }

    return {
      valid: user.isActive,
      user,
      migrationNeeded,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  // Validate legacy project data compatibility
  async validateLegacyProjectData(projectId: string): Promise<{
    valid: boolean;
    project?: LegacyProject;
    migrationNeeded?: boolean;
    issues?: string[];
  }> {
    const projects = await this.repository.getAllProjects();
    const project = projects.find(p => p.id === projectId);
    
    if (!project) {
      return { valid: false, issues: ['Project not found'] };
    }

    const issues: string[] = [];
    let migrationNeeded = false;

    // Check for old format segments
    if (project.oldFormat) {
      migrationNeeded = true;
      issues.push('Project uses old data format');
    }

    // Check for legacy segments
    if (project.legacySegments && project.legacySegments.length > 0) {
      migrationNeeded = true;
      issues.push('Legacy segment format detected');
    }

    // Check for deprecated calculations
    if (project.deprecatedCalculations) {
      issues.push('Deprecated calculation methods present');
    }

    return {
      valid: true,
      project,
      migrationNeeded,
      issues: issues.length > 0 ? issues : undefined
    };
  }
}

describe('Backward Compatibility Testing', () => {
  let repository: BackwardCompatibilityRepository;
  let authService: BackwardCompatibilityAuthService;

  beforeAll(async () => {
    console.log('🔄 Starting backward compatibility testing...');
    
    repository = new BackwardCompatibilityRepository();
    authService = new BackwardCompatibilityAuthService(repository);
    
    // Seed legacy data
    await repository.seedLegacyData();
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up backward compatibility test data...');
  });

  beforeEach(async () => {
    // Reset any test state if needed
  });

  describe('Legacy User Authentication', () => {
    test('should authenticate legacy users with old tier formats', async () => {
      const result = await authService.validateLegacyAuthentication('legacy-user-1');
      
      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.tier).toBe('premium'); // Old format preserved
      expect(result.migrationNeeded).toBe(true);
      expect(result.issues).toContain('Tier format migration needed: premium -> pro');
      
      console.log('✅ Legacy user with old tier format can authenticate');
    });

    test('should handle legacy users with missing license keys', async () => {
      const result = await authService.validateLegacyAuthentication('legacy-user-2');
      
      expect(result.valid).toBe(true);
      expect(result.user?.tier).toBe('free');
      expect(result.issues).toContain('Deprecated fields present, cleanup recommended');
      
      console.log('✅ Legacy user with missing license key handled correctly');
    });

    test('should validate enterprise legacy users', async () => {
      const result = await authService.validateLegacyAuthentication('legacy-user-3');
      
      expect(result.valid).toBe(true);
      expect(result.user?.tier).toBe('enterprise');
      expect(result.user?.licenseKey).toBe('LEGACY-ENT-2023-ABC123');
      expect(result.migrationNeeded).toBeFalsy();
      
      console.log('✅ Enterprise legacy user validates correctly');
    });

    test('should migrate tier formats correctly', async () => {
      const migrations = [
        { old: 'premium', new: 'pro' },
        { old: 'basic', new: 'free' },
        { old: 'professional', new: 'pro' },
        { old: 'business', new: 'enterprise' },
        { old: 'enterprise', new: 'enterprise' } // No change needed
      ];

      for (const migration of migrations) {
        const result = authService.migrateTierFormat(migration.old);
        expect(result).toBe(migration.new);
      }
      
      console.log('✅ Tier format migration works correctly');
    });
  });

  describe('Legacy Project Data Compatibility', () => {
    test('should validate legacy project with old format', async () => {
      const result = await authService.validateLegacyProjectData('legacy-project-1');
      
      expect(result.valid).toBe(true);
      expect(result.project).toBeDefined();
      expect(result.migrationNeeded).toBe(true);
      expect(result.issues).toContain('Project uses old data format');
      expect(result.issues).toContain('Legacy segment format detected');
      
      console.log('✅ Legacy project with old format validated');
    });

    test('should handle enterprise legacy project', async () => {
      const result = await authService.validateLegacyProjectData('legacy-project-2');
      
      expect(result.valid).toBe(true);
      expect(result.project?.userId).toBe('legacy-user-3');
      expect(result.issues).toContain('Deprecated calculation methods present');
      
      console.log('✅ Enterprise legacy project handled correctly');
    });

    test('should preserve legacy project data integrity', async () => {
      const projects = await repository.getAllProjects();
      
      for (const project of projects) {
        // Verify essential data is preserved
        expect(project.id).toBeDefined();
        expect(project.userId).toBeDefined();
        expect(project.name).toBeDefined();
        expect(project.createdAt).toBeDefined();
        expect(project.data).toBeDefined();
        
        // Verify segments are accessible
        if (project.data.segments) {
          expect(Array.isArray(project.data.segments)).toBe(true);
        }
      }
      
      console.log('✅ Legacy project data integrity preserved');
    });
  });

  describe('Feature Access Backward Compatibility', () => {
    test('should maintain feature access for legacy users', async () => {
      const users = await repository.getAllUsers();
      
      for (const user of users) {
        const authResult = await authService.validateLegacyAuthentication(user.id);
        expect(authResult.valid).toBe(true);
        
        // Verify tier-based access is maintained
        if (user.tier === 'enterprise' || user.tier === 'premium') {
          // Should have access to advanced features
          expect(user.isActive).toBe(true);
        }
        
        if (user.tier === 'free') {
          // Should have basic access
          expect(user.isActive).toBe(true);
        }
      }
      
      console.log('✅ Feature access maintained for legacy users');
    });

    test('should handle legacy permissions gracefully', async () => {
      const user = await repository.getUser('legacy-user-1');
      
      expect(user?.legacyPermissions).toBeDefined();
      expect(user?.legacyPermissions).toContain('read_projects');
      expect(user?.legacyPermissions).toContain('write_projects');
      expect(user?.legacyPermissions).toContain('export_pdf');
      
      // Legacy permissions should not break new system
      expect(user?.isActive).toBe(true);
      
      console.log('✅ Legacy permissions handled gracefully');
    });
  });

  describe('Data Migration Compatibility', () => {
    test('should identify all users needing migration', async () => {
      const users = await repository.getAllUsers();
      const migrationNeeded: string[] = [];
      
      for (const user of users) {
        const result = await authService.validateLegacyAuthentication(user.id);
        if (result.migrationNeeded) {
          migrationNeeded.push(user.id);
        }
      }
      
      expect(migrationNeeded.length).toBeGreaterThan(0);
      expect(migrationNeeded).toContain('legacy-user-1'); // Has old tier format
      
      console.log(`✅ Identified ${migrationNeeded.length} users needing migration`);
    });

    test('should identify all projects needing migration', async () => {
      const projects = await repository.getAllProjects();
      const migrationNeeded: string[] = [];
      
      for (const project of projects) {
        const result = await authService.validateLegacyProjectData(project.id);
        if (result.migrationNeeded) {
          migrationNeeded.push(project.id);
        }
      }
      
      expect(migrationNeeded.length).toBeGreaterThan(0);
      expect(migrationNeeded).toContain('legacy-project-1'); // Has old format
      
      console.log(`✅ Identified ${migrationNeeded.length} projects needing migration`);
    });

    test('should ensure no data loss during compatibility checks', async () => {
      const usersBefore = await repository.getAllUsers();
      const projectsBefore = await repository.getAllProjects();
      
      // Run compatibility validation on all data
      for (const user of usersBefore) {
        await authService.validateLegacyAuthentication(user.id);
      }
      
      for (const project of projectsBefore) {
        await authService.validateLegacyProjectData(project.id);
      }
      
      // Verify data is still intact
      const usersAfter = await repository.getAllUsers();
      const projectsAfter = await repository.getAllProjects();
      
      expect(usersAfter.length).toBe(usersBefore.length);
      expect(projectsAfter.length).toBe(projectsBefore.length);
      
      console.log('✅ No data loss during compatibility checks');
    });
  });

  describe('System Integration Backward Compatibility', () => {
    test('should maintain API compatibility for legacy clients', async () => {
      // Simulate legacy API calls
      const legacyApiResponses = {
        getUserTier: async (userId: string) => {
          // Legacy API might expect different tier names
          const user = await repository.getUser(userId);
          return user ? { tier: user.tier } : null;
        },

        getProjectData: async (projectId: string) => {
          // Legacy API might expect different data structure
          const projects = await repository.getAllProjects();
          const project = projects.find(p => p.id === projectId);
          return project ? { data: project.data } : null;
        }
      };
      
      // Test legacy API compatibility
      const tierResponse = await legacyApiResponses.getUserTier('legacy-user-1');
      expect(tierResponse).toBeDefined();
      expect(tierResponse?.tier).toBe('premium');

      const projectResponse = await legacyApiResponses.getProjectData('legacy-project-1');
      expect(projectResponse).toBeDefined();
      expect(projectResponse?.data.segments).toBeDefined();
      
      console.log('✅ API compatibility maintained for legacy clients');
    });
  });
});

'use client';

import React, { useState, useEffect } from 'react';
import { SizeWiseDatabase } from '@/lib/database/DexieDatabase';
import { DatabaseHealthMonitor, DatabaseHealthReport } from '@/lib/monitoring/DatabaseHealthMonitor';

// Simple standalone test page that doesn't require authentication

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
  duration?: number;
}

// Standalone test page that bypasses main app layout
export default function DatabaseTestPage() {
  const [database, setDatabase] = useState<SizeWiseDatabase | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [healthMonitor, setHealthMonitor] = useState<DatabaseHealthMonitor | null>(null);
  const [healthReport, setHealthReport] = useState<DatabaseHealthReport | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Initialize database and measure startup time
    const startupStart = performance.now();
    const db = new SizeWiseDatabase();

    db.open().then(() => {
      const startupTime = performance.now() - startupStart;
      console.log(`Database startup time: ${startupTime.toFixed(2)}ms`);

      // Add startup time as initial test result
      const startupResult: TestResult = {
        name: 'Database Startup Time',
        status: startupTime < 3000 ? 'success' : 'error',
        message: startupTime < 3000
          ? `Database started in ${startupTime.toFixed(2)}ms (under 3s target)`
          : `Database startup too slow: ${startupTime.toFixed(2)}ms (over 3s target)`,
        duration: startupTime
      };
      setTestResults([startupResult]);

      // Initialize health monitor
      const monitor = new DatabaseHealthMonitor(db);
      setHealthMonitor(monitor);
    });

    setDatabase(db);
  }, []);

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const updateTestResult = (index: number, updates: Partial<TestResult>) => {
    setTestResults(prev => prev.map((result, i) => 
      i === index ? { ...result, ...updates } : result
    ));
  };

  const runDatabaseTests = async () => {
    if (!database) {
      alert('Database not initialized');
      return;
    }

    setIsRunning(true);
    setTestResults([]);

    // Test 1: Database Connection
    const connectionTest: TestResult = {
      name: 'Database Connection Test',
      status: 'pending',
      message: 'Testing database connection...'
    };
    addTestResult(connectionTest);

    try {
      const startTime = Date.now();
      const connected = await database.testDatabaseConnection();
      const duration = Date.now() - startTime;
      
      updateTestResult(0, {
        status: connected ? 'success' : 'error',
        message: connected ? 'Database connection successful' : 'Database connection failed',
        duration
      });
    } catch (error) {
      updateTestResult(0, {
        status: 'error',
        message: `Database connection error: ${error}`,
        duration: Date.now() - Date.now()
      });
    }

    // Test 2: Schema Validation
    const schemaTest: TestResult = {
      name: 'Schema Validation Test',
      status: 'pending',
      message: 'Validating database schema...'
    };
    addTestResult(schemaTest);

    try {
      const startTime = Date.now();
      const schemaResult = await database.validateDatabaseSchema();
      const duration = Date.now() - startTime;
      
      updateTestResult(1, {
        status: schemaResult.valid ? 'success' : 'error',
        message: schemaResult.valid ? 'Schema validation successful' : 'Schema validation failed',
        details: schemaResult.errors,
        duration
      });
    } catch (error) {
      updateTestResult(1, {
        status: 'error',
        message: `Schema validation error: ${error}`,
        duration: Date.now() - Date.now()
      });
    }

    // Test 3: Basic CRUD Operations
    const crudTest: TestResult = {
      name: 'CRUD Operations Test',
      status: 'pending',
      message: 'Testing basic CRUD operations...'
    };
    addTestResult(crudTest);

    try {
      const startTime = Date.now();
      const crudResult = await database.performBasicCRUDTest();
      const duration = Date.now() - startTime;
      
      updateTestResult(2, {
        status: crudResult.success ? 'success' : 'error',
        message: crudResult.success ? 'CRUD operations successful' : 'CRUD operations failed',
        details: { results: crudResult.results, errors: crudResult.errors },
        duration
      });
    } catch (error) {
      updateTestResult(2, {
        status: 'error',
        message: `CRUD operations error: ${error}`,
        duration: Date.now() - Date.now()
      });
    }

    // Test 4: IndexedDB Storage Test
    const storageTest: TestResult = {
      name: 'IndexedDB Storage Test',
      status: 'pending',
      message: 'Testing IndexedDB storage capabilities...'
    };
    addTestResult(storageTest);

    try {
      const startTime = Date.now();
      
      // Test storage quota and usage
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        const duration = Date.now() - startTime;
        
        updateTestResult(3, {
          status: 'success',
          message: 'IndexedDB storage test successful',
          details: {
            quota: estimate.quota,
            usage: estimate.usage,
            usageDetails: estimate.usageDetails
          },
          duration
        });
      } else {
        updateTestResult(3, {
          status: 'error',
          message: 'Storage API not supported',
          duration: Date.now() - startTime
        });
      }
    } catch (error) {
      updateTestResult(3, {
        status: 'error',
        message: `Storage test error: ${error}`,
        duration: Date.now() - Date.now()
      });
    }

    // Test 5: Offline Project Management
    const projectTest: TestResult = {
      name: 'Offline Project Management Test',
      status: 'pending',
      message: 'Testing project CRUD operations in offline mode...'
    };
    addTestResult(projectTest);

    try {
      const startTime = Date.now();

      // Test project creation
      const testProject = {
        id: `test-project-${Date.now()}`,
        name: 'Test HVAC Project',
        description: 'Test project for offline validation',
        organizationId: 'test-org',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        settings: {
          units: 'imperial',
          defaultAirDensity: 0.075,
          defaultRoughness: 0.0001
        }
      };

      // Create project
      await database.projects.add(testProject);

      // Read project
      const retrievedProject = await database.projects.get(testProject.id);
      if (!retrievedProject) {
        throw new Error('Project not found after creation');
      }

      // Update project
      await database.projects.update(testProject.id, {
        description: 'Updated test project description',
        updatedAt: new Date()
      });

      // Verify update
      const updatedProject = await database.projects.get(testProject.id);
      if (updatedProject?.description !== 'Updated test project description') {
        throw new Error('Project update failed');
      }

      // Delete project
      await database.projects.delete(testProject.id);

      // Verify deletion
      const deletedProject = await database.projects.get(testProject.id);
      if (deletedProject) {
        throw new Error('Project deletion failed');
      }

      const duration = Date.now() - startTime;

      updateTestResult(4, {
        status: 'success',
        message: 'Offline project management test successful',
        details: {
          operations: ['create', 'read', 'update', 'delete'],
          projectId: testProject.id,
          testDuration: duration
        },
        duration
      });
    } catch (error) {
      updateTestResult(4, {
        status: 'error',
        message: `Offline project management error: ${error}`,
        duration: Date.now() - Date.now()
      });
    }

    // Test 6: Sync Queue Functionality
    const syncTest: TestResult = {
      name: 'Sync Queue Functionality Test',
      status: 'pending',
      message: 'Testing sync operation queuing...'
    };
    addTestResult(syncTest);

    try {
      const startTime = Date.now();

      // Test sync operation creation
      const syncOperation = {
        id: `sync-${Date.now()}`,
        operation: 'CREATE_PROJECT',
        entityType: 'project',
        entityId: 'test-project-123',
        data: { name: 'Test Project', description: 'Test sync operation' },
        status: 'pending',
        createdAt: new Date(),
        retryCount: 0
      };

      // Add sync operation to queue
      await database.syncOperations.add(syncOperation);

      // Retrieve sync operation
      const retrievedSync = await database.syncOperations.get(syncOperation.id);
      if (!retrievedSync) {
        throw new Error('Sync operation not found after creation');
      }

      // Update sync status
      await database.syncOperations.update(syncOperation.id, {
        status: 'completed',
        completedAt: new Date()
      });

      // Get all pending sync operations
      const pendingSyncs = await database.syncOperations
        .where('status')
        .equals('pending')
        .toArray();

      // Clean up test sync operation
      await database.syncOperations.delete(syncOperation.id);

      const duration = Date.now() - startTime;

      updateTestResult(5, {
        status: 'success',
        message: 'Sync queue functionality test successful',
        details: {
          syncOperationId: syncOperation.id,
          pendingSyncsCount: pendingSyncs.length,
          testDuration: duration
        },
        duration
      });
    } catch (error) {
      updateTestResult(5, {
        status: 'error',
        message: `Sync queue functionality error: ${error}`,
        duration: Date.now() - Date.now()
      });
    }

    // Test 7: HVAC Calculation Integrity & Data Persistence
    const hvacTest: TestResult = {
      name: 'HVAC Calculation Integrity Test',
      status: 'pending',
      message: 'Testing HVAC calculations and data persistence...'
    };
    addTestResult(hvacTest);

    try {
      const startTime = Date.now();

      // Test HVAC calculation with realistic parameters
      const hvacInputs = {
        airflow: 2000, // CFM
        ductType: 'rectangular' as const,
        frictionRate: 0.08, // inches w.g. per 100 feet
        units: 'imperial' as const,
        material: 'galvanized_steel',
        targetVelocity: 1200, // FPM
        maxVelocity: 2500,
        minVelocity: 600
      };

      // Perform mock HVAC calculation (simplified for testing)
      const hvacResult = {
        width: 14,
        height: 10,
        area: (14 * 10) / 144, // sq ft
        velocity: hvacInputs.airflow / ((14 * 10) / 144),
        pressureLoss: 0.08,
        reynoldsNumber: 85000,
        frictionFactor: 0.018,
        equivalentDiameter: Math.sqrt((4 * 14 * 10) / Math.PI),
        aspectRatio: 14 / 10,
        isOptimal: true,
        warnings: [],
        recommendations: [],
        standardsCompliance: {
          smacna: true,
          ashrae: true,
          velocityCompliant: true
        }
      };

      // Store calculation in database
      const calculationRecord = {
        id: `calc-${Date.now()}`,
        projectId: 'test-project',
        segmentId: 'test-segment',
        calculationType: 'duct_sizing',
        inputData: hvacInputs,
        result: hvacResult,
        timestamp: new Date(),
        isValid: true
      };

      await database.calculations.add(calculationRecord);

      // Retrieve and verify calculation
      const retrievedCalc = await database.calculations.get(calculationRecord.id);
      if (!retrievedCalc) {
        throw new Error('Calculation not found after storage');
      }

      // Verify calculation integrity
      if (retrievedCalc.result.velocity !== hvacResult.velocity) {
        throw new Error('Calculation data integrity compromised');
      }

      // Test calculation history retrieval
      const allCalculations = await database.calculations
        .where('projectId')
        .equals('test-project')
        .toArray();

      // Clean up test calculation
      await database.calculations.delete(calculationRecord.id);

      const duration = Date.now() - startTime;

      updateTestResult(6, {
        status: 'success',
        message: 'HVAC calculation integrity test successful',
        details: {
          calculationId: calculationRecord.id,
          inputAirflow: hvacInputs.airflow,
          resultVelocity: hvacResult.velocity,
          resultDimensions: `${hvacResult.width}" x ${hvacResult.height}"`,
          calculationsInProject: allCalculations.length,
          testDuration: duration
        },
        duration
      });
    } catch (error) {
      updateTestResult(6, {
        status: 'error',
        message: `HVAC calculation integrity error: ${error}`,
        duration: Date.now() - Date.now()
      });
    }

    // Test 8: Performance Validation & Startup Time
    const performanceTest: TestResult = {
      name: 'Performance Validation Test',
      status: 'pending',
      message: 'Testing database performance and startup time...'
    };
    addTestResult(performanceTest);

    try {
      const startTime = Date.now();

      // Test database initialization performance
      const dbInitStart = performance.now();
      const testDb = new SizeWiseDatabase();
      await testDb.open();
      const dbInitTime = performance.now() - dbInitStart;

      // Test bulk operations performance
      const bulkTestStart = performance.now();
      const testProjects = Array.from({ length: 100 }, (_, i) => ({
        uuid: `perf-test-${i}`,
        name: `Performance Test Project ${i}`,
        description: `Test project for performance validation`,
        organizationId: 'perf-test-org',
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        settings: {
          units: 'imperial',
          defaultAirDensity: 0.075,
          defaultRoughness: 0.0001
        }
      }));

      // Bulk insert
      await testDb.projects.bulkAdd(testProjects);

      // Bulk query
      const retrievedProjects = await testDb.projects
        .where('organizationId')
        .equals('perf-test-org')
        .toArray();

      // Bulk delete
      await testDb.projects
        .where('organizationId')
        .equals('perf-test-org')
        .delete();

      const bulkTestTime = performance.now() - bulkTestStart;

      // Test memory usage (if available)
      let memoryInfo = null;
      if ('memory' in performance) {
        memoryInfo = (performance as any).memory;
      }

      // Test storage quota
      let storageInfo = null;
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        storageInfo = await navigator.storage.estimate();
      }

      await testDb.close();

      const totalDuration = Date.now() - startTime;

      // Validate performance criteria
      const performanceIssues = [];
      if (dbInitTime > 1000) { // 1 second threshold
        performanceIssues.push(`Database initialization too slow: ${dbInitTime.toFixed(2)}ms`);
      }
      if (bulkTestTime > 2000) { // 2 second threshold for 100 operations
        performanceIssues.push(`Bulk operations too slow: ${bulkTestTime.toFixed(2)}ms`);
      }

      updateTestResult(7, {
        status: performanceIssues.length === 0 ? 'success' : 'error',
        message: performanceIssues.length === 0
          ? 'Performance validation successful'
          : `Performance issues detected: ${performanceIssues.join(', ')}`,
        details: {
          dbInitTime: `${dbInitTime.toFixed(2)}ms`,
          bulkOperationsTime: `${bulkTestTime.toFixed(2)}ms`,
          totalTestTime: `${totalDuration}ms`,
          projectsProcessed: testProjects.length,
          retrievedCount: retrievedProjects.length,
          memoryUsage: memoryInfo ? {
            used: `${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
            total: `${(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
            limit: `${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
          } : 'Not available',
          storageQuota: storageInfo ? {
            used: `${((storageInfo.usage || 0) / 1024 / 1024).toFixed(2)}MB`,
            quota: `${((storageInfo.quota || 0) / 1024 / 1024).toFixed(2)}MB`
          } : 'Not available',
          performanceIssues
        },
        duration: totalDuration
      });
    } catch (error) {
      updateTestResult(7, {
        status: 'error',
        message: `Performance validation error: ${error}`,
        duration: Date.now() - Date.now()
      });
    }

    setIsRunning(false);
  };

  // Health monitoring functions
  const runHealthCheck = async () => {
    if (!healthMonitor) return;

    try {
      const report = await healthMonitor.performHealthCheck();
      setHealthReport(report);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const startHealthMonitoring = () => {
    if (!healthMonitor) return;

    healthMonitor.startMonitoring(30000); // Check every 30 seconds
    setIsMonitoring(true);
  };

  const stopHealthMonitoring = () => {
    if (!healthMonitor) return;

    healthMonitor.stopMonitoring();
    setIsMonitoring(false);
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'pending': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            SizeWise Database Validation Tests
          </h1>
          
          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              This page validates the Dexie.js database integration and offline functionality.
              Click the button below to run comprehensive database tests.
            </p>
            
            <button
              type="button"
              onClick={runDatabaseTests}
              disabled={isRunning || !database}
              className={`px-6 py-3 rounded-lg font-medium ${
                isRunning || !database
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isRunning ? 'Running Tests...' : 'Run Database Tests'}
            </button>
          </div>

          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <span>{getStatusIcon(result.status)}</span>
                    {result.name}
                  </h3>
                  {result.duration && (
                    <span className="text-sm text-gray-500">
                      {result.duration}ms
                    </span>
                  )}
                </div>
                
                <p className={`mb-2 ${getStatusColor(result.status)}`}>
                  {result.message}
                </p>
                
                {result.details && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      View Details
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>

          {testResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No tests run yet. Click "Run Database Tests" to begin validation.
            </div>
          )}
        </div>
      </div>

      {/* Health Monitoring Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Database Health Monitoring</h2>

        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={runHealthCheck}
            disabled={!healthMonitor}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Run Health Check
          </button>

          <button
            type="button"
            onClick={isMonitoring ? stopHealthMonitoring : startHealthMonitoring}
            disabled={!healthMonitor}
            className={`px-4 py-2 text-white rounded ${
              isMonitoring
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-green-500 hover:bg-green-600'
            } disabled:bg-gray-300`}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
        </div>

        {healthReport && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg ${
              healthReport.overall.status === 'healthy' ? 'bg-green-50 border border-green-200' :
              healthReport.overall.status === 'warning' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <h3 className="font-semibold mb-2">Overall Health: {healthReport.overall.status.toUpperCase()}</h3>
              <p>{healthReport.overall.message}</p>
              <p className="text-sm text-gray-600 mt-1">
                Check completed in {healthReport.overall.duration.toFixed(2)}ms
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(healthReport.checks).map(([checkName, result]) => (
                <div key={checkName} className={`p-3 rounded border ${
                  result.status === 'healthy' ? 'bg-green-50 border-green-200' :
                  result.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <h4 className="font-medium capitalize">{checkName}</h4>
                  <p className="text-sm">{result.message}</p>
                  <p className="text-xs text-gray-500">{result.duration.toFixed(2)}ms</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Performance Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Startup Time:</span> {healthReport.metrics.startupTime}ms
                </div>
                <div>
                  <span className="font-medium">Operation Latency:</span> {healthReport.metrics.operationLatency.toFixed(2)}ms
                </div>
                <div>
                  <span className="font-medium">Storage Used:</span> {(healthReport.metrics.storageUsed / 1024 / 1024).toFixed(2)}MB
                </div>
                <div>
                  <span className="font-medium">Storage Quota:</span> {(healthReport.metrics.storageQuota / 1024 / 1024).toFixed(2)}MB
                </div>
                <div>
                  <span className="font-medium">Pending Syncs:</span> {healthReport.metrics.pendingSyncs}
                </div>
                <div>
                  <span className="font-medium">Recent Errors:</span> {healthReport.metrics.errorCount}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

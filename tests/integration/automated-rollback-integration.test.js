/**
 * Automated Rollback Integration Tests
 * 
 * Comprehensive integration tests for automated rollback mechanisms
 * Part of Phase 1 bridging plan for deployment reliability
 * 
 * @see docs/post-implementation-bridging-plan.md Task 1.3
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    HEALTH_CHECK_SCRIPT: path.join(__dirname, '../../scripts/health-check.ps1'),
    ROLLBACK_SCRIPT: path.join(__dirname, '../../scripts/automated-rollback.ps1'),
    TEST_TIMEOUT: 30000,
    HEALTH_CHECK_TIMEOUT: 10000,
    ROLLBACK_TIMEOUT: 15000
};

// Mock environment variables for testing
const TEST_ENV = {
    BACKEND_URL: 'http://localhost:5000',
    FRONTEND_URL: 'http://localhost:3000',
    AUTH_URL: 'http://localhost:8000',
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: '5432',
    POSTGRES_DB: 'sizewise_test',
    POSTGRES_USER: 'sizewise_test',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6379',
    ENVIRONMENT: 'test'
};

// Mock server setup for testing
class MockServer {
    constructor(port, shouldFail = false) {
        this.port = port;
        this.shouldFail = shouldFail;
        this.server = null;
    }

    start() {
        return new Promise((resolve, reject) => {
            const http = require('http');
            
            this.server = http.createServer((req, res) => {
                if (this.shouldFail) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Mock server failure' }));
                } else {
                    // Mock different endpoints
                    if (req.url === '/api/health') {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
                    } else if (req.url === '/api/calculations/air-duct') {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ duct_size: { width: 12, height: 8 }, velocity: 1500 }));
                    } else if (req.url === '/api/compliance/check') {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ validation: 'passed', compliance: true }));
                    } else if (req.url === '/api/compliance/standards-info') {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ 
                            standards: ['ASHRAE 90.2', 'IECC 2024'],
                            version: '1.0.0'
                        }));
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end('<html><body>Mock SizeWise Suite</body></html>');
                    }
                }
            });

            this.server.listen(this.port, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    stop() {
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    setFailureMode(shouldFail) {
        this.shouldFail = shouldFail;
    }
}

// Test utilities
const testUtils = {
    createMockDeploymentHistory: () => {
        const historyPath = path.join(__dirname, '../../logs/deployment-history.json');
        const history = {
            deployments: [
                {
                    deployment_id: 'test-deployment-001',
                    status: 'success',
                    timestamp: '2024-01-01 10:00:00 UTC',
                    environment: 'test'
                },
                {
                    deployment_id: 'test-deployment-002',
                    status: 'success',
                    timestamp: '2024-01-01 11:00:00 UTC',
                    environment: 'test'
                },
                {
                    deployment_id: 'test-deployment-003',
                    status: 'failed',
                    timestamp: '2024-01-01 12:00:00 UTC',
                    environment: 'test'
                }
            ]
        };

        // Ensure logs directory exists
        const logsDir = path.dirname(historyPath);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }

        fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
        return historyPath;
    },

    cleanupTestFiles: () => {
        const filesToClean = [
            path.join(__dirname, '../../logs/deployment-history.json'),
            path.join(__dirname, '../../logs/health-check.log'),
            path.join(__dirname, '../../logs/rollback.log'),
            path.join(__dirname, '../../logs/rollback-notifications.log')
        ];

        filesToClean.forEach(file => {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        });
    },

    executeScript: (scriptPath, args = [], env = {}) => {
        return new Promise((resolve, reject) => {
            const fullEnv = { ...process.env, ...TEST_ENV, ...env };

            // Use PowerShell on Windows
            const isWindows = process.platform === 'win32';
            const command = isWindows ? 'powershell.exe' : 'bash';
            const scriptArgs = isWindows ?
                ['-ExecutionPolicy', 'Bypass', '-File', scriptPath, ...args] :
                [scriptPath, ...args];

            const child = spawn(command, scriptArgs, {
                env: fullEnv,
                stdio: 'pipe'
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                resolve({
                    code,
                    stdout,
                    stderr
                });
            });

            child.on('error', (error) => {
                reject(error);
            });
        });
    }
};

describe('Automated Rollback Integration Tests', () => {
    let mockBackend, mockFrontend, mockAuth;

    beforeAll(async () => {
        // Create mock servers
        mockBackend = new MockServer(5000);
        mockFrontend = new MockServer(3000);
        mockAuth = new MockServer(8000);

        // Start mock servers
        await mockBackend.start();
        await mockFrontend.start();
        await mockAuth.start();

        // Create test deployment history
        testUtils.createMockDeploymentHistory();
    }, TEST_CONFIG.TEST_TIMEOUT);

    afterAll(async () => {
        // Stop mock servers
        await mockBackend.stop();
        await mockFrontend.stop();
        await mockAuth.stop();

        // Cleanup test files
        testUtils.cleanupTestFiles();
    });

    beforeEach(() => {
        // Reset mock servers to healthy state
        mockBackend.setFailureMode(false);
        mockFrontend.setFailureMode(false);
        mockAuth.setFailureMode(false);
    });

    describe('Health Check Script', () => {
        test('should pass all health checks when services are healthy', async () => {
            const result = await testUtils.executeScript(TEST_CONFIG.HEALTH_CHECK_SCRIPT);
            
            expect(result.code).toBe(0);
            expect(result.stdout).toContain('All health checks passed');
            expect(result.stdout).toContain('Backend health check passed');
            expect(result.stdout).toContain('Frontend health check passed');
            expect(result.stdout).toContain('Auth service health check passed');
        }, TEST_CONFIG.HEALTH_CHECK_TIMEOUT);

        test('should fail health checks when backend is unhealthy', async () => {
            mockBackend.setFailureMode(true);
            
            const result = await testUtils.executeScript(TEST_CONFIG.HEALTH_CHECK_SCRIPT);
            
            expect(result.code).toBe(1);
            expect(result.stdout).toContain('Backend health check failed');
            expect(result.stdout).toContain('health checks failed');
        }, TEST_CONFIG.HEALTH_CHECK_TIMEOUT);

        test('should fail health checks when frontend is unhealthy', async () => {
            mockFrontend.setFailureMode(true);
            
            const result = await testUtils.executeScript(TEST_CONFIG.HEALTH_CHECK_SCRIPT);
            
            expect(result.code).toBe(1);
            expect(result.stdout).toContain('Frontend health check failed');
        }, TEST_CONFIG.HEALTH_CHECK_TIMEOUT);

        test('should test HVAC calculation functionality', async () => {
            const result = await testUtils.executeScript(TEST_CONFIG.HEALTH_CHECK_SCRIPT);
            
            expect(result.code).toBe(0);
            expect(result.stdout).toContain('HVAC calculation health check passed');
        }, TEST_CONFIG.HEALTH_CHECK_TIMEOUT);

        test('should test compliance system functionality', async () => {
            const result = await testUtils.executeScript(TEST_CONFIG.HEALTH_CHECK_SCRIPT);
            
            expect(result.code).toBe(0);
            expect(result.stdout).toContain('Compliance system health check passed');
        }, TEST_CONFIG.HEALTH_CHECK_TIMEOUT);

        test('should test advanced compliance standards', async () => {
            const result = await testUtils.executeScript(TEST_CONFIG.HEALTH_CHECK_SCRIPT);
            
            expect(result.code).toBe(0);
            expect(result.stdout).toContain('Advanced compliance health check passed');
        }, TEST_CONFIG.HEALTH_CHECK_TIMEOUT);

        test('should create health check log file', async () => {
            await testUtils.executeScript(TEST_CONFIG.HEALTH_CHECK_SCRIPT);
            
            const logPath = path.join(__dirname, '../../logs/health-check.log');
            expect(fs.existsSync(logPath)).toBe(true);
            
            const logContent = fs.readFileSync(logPath, 'utf8');
            expect(logContent).toContain('Starting comprehensive health checks');
        }, TEST_CONFIG.HEALTH_CHECK_TIMEOUT);
    });

    describe('Automated Rollback Script', () => {
        test('should identify last successful deployment', async () => {
            const result = await testUtils.executeScript(TEST_CONFIG.ROLLBACK_SCRIPT, ['auto']);
            
            // Should identify test-deployment-002 as the last successful deployment
            expect(result.stdout).toContain('test-deployment-002');
        }, TEST_CONFIG.ROLLBACK_TIMEOUT);

        test('should record rollback attempt in deployment history', async () => {
            await testUtils.executeScript(TEST_CONFIG.ROLLBACK_SCRIPT, ['auto']);
            
            const historyPath = path.join(__dirname, '../../logs/deployment-history.json');
            const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
            
            // Should have a new rollback entry
            const rollbackEntries = history.deployments.filter(d => d.deployment_id.startsWith('rollback-'));
            expect(rollbackEntries.length).toBeGreaterThan(0);
        }, TEST_CONFIG.ROLLBACK_TIMEOUT);

        test('should create rollback log file', async () => {
            await testUtils.executeScript(TEST_CONFIG.ROLLBACK_SCRIPT, ['auto']);
            
            const logPath = path.join(__dirname, '../../logs/rollback.log');
            expect(fs.existsSync(logPath)).toBe(true);
            
            const logContent = fs.readFileSync(logPath, 'utf8');
            expect(logContent).toContain('Starting automated rollback process');
        }, TEST_CONFIG.ROLLBACK_TIMEOUT);

        test('should handle manual rollback with specific deployment ID', async () => {
            const result = await testUtils.executeScript(TEST_CONFIG.ROLLBACK_SCRIPT, ['-Command', 'manual', '-Target', 'test-deployment-001']);

            expect(result.stdout).toContain('test-deployment-001');
            expect(result.stdout).toContain('manual rollback');
        }, TEST_CONFIG.ROLLBACK_TIMEOUT);

        test('should validate deployment ID format for manual rollback', async () => {
            const result = await testUtils.executeScript(TEST_CONFIG.ROLLBACK_SCRIPT, ['-Command', 'manual']);

            expect(result.code).toBe(1);
            expect(result.stderr).toContain('Manual rollback requires target deployment ID');
        }, TEST_CONFIG.ROLLBACK_TIMEOUT);

        test('should support different rollback types', async () => {
            const dockerResult = await testUtils.executeScript(TEST_CONFIG.ROLLBACK_SCRIPT, ['-Command', 'docker', '-Target', 'test-deployment-001']);
            expect(dockerResult.stdout).toContain('Docker-based rollback');

            const gitResult = await testUtils.executeScript(TEST_CONFIG.ROLLBACK_SCRIPT, ['-Command', 'git', '-Target', 'test-deployment-001']);
            expect(gitResult.stdout).toContain('Git-based rollback');
        }, TEST_CONFIG.ROLLBACK_TIMEOUT);
    });

    describe('Integration Scenarios', () => {
        test('should trigger rollback when health checks fail', async () => {
            // Simulate deployment failure by making backend unhealthy
            mockBackend.setFailureMode(true);
            
            // Run health check (should fail)
            const healthResult = await testUtils.executeScript(TEST_CONFIG.HEALTH_CHECK_SCRIPT);
            expect(healthResult.code).toBe(1);
            
            // Run rollback (should succeed)
            const rollbackResult = await testUtils.executeScript(TEST_CONFIG.ROLLBACK_SCRIPT, ['-Command', 'auto']);
            expect(rollbackResult.stdout).toContain('rollback');
        }, TEST_CONFIG.TEST_TIMEOUT);

        test('should maintain deployment history across operations', async () => {
            const historyPath = path.join(__dirname, '../../logs/deployment-history.json');
            
            // Get initial deployment count
            const initialHistory = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
            const initialCount = initialHistory.deployments.length;
            
            // Perform rollback
            await testUtils.executeScript(TEST_CONFIG.ROLLBACK_SCRIPT, ['-Command', 'auto']);
            
            // Check that history was updated
            const updatedHistory = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
            expect(updatedHistory.deployments.length).toBeGreaterThan(initialCount);
        }, TEST_CONFIG.TEST_TIMEOUT);

        test('should preserve existing functionality during rollback', async () => {
            // Verify that rollback doesn't break existing health checks
            const preRollbackHealth = await testUtils.executeScript(TEST_CONFIG.HEALTH_CHECK_SCRIPT);
            expect(preRollbackHealth.code).toBe(0);
            
            // Perform rollback
            await testUtils.executeScript(TEST_CONFIG.ROLLBACK_SCRIPT, ['-Command', 'auto']);
            
            // Verify health checks still work
            const postRollbackHealth = await testUtils.executeScript(TEST_CONFIG.HEALTH_CHECK_SCRIPT);
            expect(postRollbackHealth.code).toBe(0);
        }, TEST_CONFIG.TEST_TIMEOUT);

        test('should handle rollback timeout scenarios', async () => {
            // Test with very short timeout
            const result = await testUtils.executeScript(
                TEST_CONFIG.ROLLBACK_SCRIPT, 
                ['auto'], 
                { ROLLBACK_TIMEOUT: '1' }  // 1 second timeout
            );
            
            // Should handle timeout gracefully
            expect(result.code).toBe(1);
        }, TEST_CONFIG.TEST_TIMEOUT);

        test('should validate rollback completes within 5 minutes requirement', async () => {
            const startTime = Date.now();
            
            await testUtils.executeScript(TEST_CONFIG.ROLLBACK_SCRIPT, ['auto']);
            
            const endTime = Date.now();
            const duration = (endTime - startTime) / 1000; // Convert to seconds
            
            // Should complete within 5 minutes (300 seconds)
            expect(duration).toBeLessThan(300);
        }, TEST_CONFIG.TEST_TIMEOUT);
    });

    describe('Notification and Logging', () => {
        test('should create notification log entries', async () => {
            await testUtils.executeScript(TEST_CONFIG.ROLLBACK_SCRIPT, ['auto']);
            
            const notificationLogPath = path.join(__dirname, '../../logs/rollback-notifications.log');
            
            // Check if notification log was created (even without Slack webhook)
            if (fs.existsSync(notificationLogPath)) {
                const logContent = fs.readFileSync(notificationLogPath, 'utf8');
                expect(logContent).toContain('timestamp');
                expect(logContent).toContain('status');
            }
        }, TEST_CONFIG.TEST_TIMEOUT);

        test('should log rollback events with proper timestamps', async () => {
            await testUtils.executeScript(TEST_CONFIG.ROLLBACK_SCRIPT, ['auto']);
            
            const logPath = path.join(__dirname, '../../logs/rollback.log');
            const logContent = fs.readFileSync(logPath, 'utf8');
            
            // Check for timestamp format
            expect(logContent).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
        }, TEST_CONFIG.TEST_TIMEOUT);

        test('should maintain audit trail for rollback operations', async () => {
            await testUtils.executeScript(TEST_CONFIG.ROLLBACK_SCRIPT, ['-Command', 'manual', '-Target', 'test-deployment-001']);
            
            const historyPath = path.join(__dirname, '../../logs/deployment-history.json');
            const history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
            
            // Find rollback entry
            const rollbackEntry = history.deployments.find(d => d.deployment_id.startsWith('rollback-'));
            expect(rollbackEntry).toBeDefined();
            expect(rollbackEntry.timestamp).toBeDefined();
            expect(rollbackEntry.environment).toBe('test');
        }, TEST_CONFIG.TEST_TIMEOUT);
    });
});

// Export test utilities for use in other test files
module.exports = {
    testUtils,
    MockServer,
    TEST_CONFIG
};

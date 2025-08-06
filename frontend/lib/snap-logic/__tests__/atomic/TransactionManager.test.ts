/**
 * Transaction Manager Tests
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Comprehensive test suite for atomic operations, state consistency,
 * and rollback capabilities in the transaction management system.
 * 
 * @fileoverview Transaction manager tests
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

import {
  TransactionManager,
  StateManager,
  RollbackManager,
  Transaction
} from '../../services/TransactionManager';
import {
  AtomicOperation,
  TransactionStatus,
  TransactionIsolationLevel,
  RollbackPointType,
  MigrationStep,
  ValidationResult
} from '../../core/interfaces/ITransactionManager';

// Mock logger
class MockLogger {
  info = jest.fn();
  warn = jest.fn();
  error = jest.fn();
  debug = jest.fn();
}

describe('StateManager', () => {
  let stateManager: StateManager;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    stateManager = new StateManager(mockLogger as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Snapshot Management', () => {
    it('should create full snapshot', async () => {
      const snapshot = await stateManager.createSnapshot('full');
      
      expect(snapshot.id).toBeDefined();
      expect(snapshot.type).toBe('full');
      expect(snapshot.timestamp).toBeInstanceOf(Date);
      expect(snapshot.data).toBeDefined();
      expect(snapshot.checksum).toBeDefined();
      expect(snapshot.size).toBeGreaterThan(0);
    });

    it('should create incremental snapshot', async () => {
      const snapshot = await stateManager.createSnapshot('incremental');
      
      expect(snapshot.type).toBe('incremental');
      expect(snapshot.data).toBeDefined();
    });

    it('should restore from snapshot', async () => {
      const snapshot = await stateManager.createSnapshot('full');
      
      await expect(stateManager.restoreFromSnapshot(snapshot.id)).resolves.not.toThrow();
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`Restored state from snapshot: ${snapshot.id}`)
      );
    });

    it('should validate snapshot integrity', async () => {
      const snapshot = await stateManager.createSnapshot('full');
      
      const validation = await stateManager.validateSnapshot(snapshot.id);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should fail validation for non-existent snapshot', async () => {
      const validation = await stateManager.validateSnapshot('non-existent');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Snapshot not found: non-existent');
    });

    it('should delete snapshot', async () => {
      const snapshot = await stateManager.createSnapshot('full');
      
      const deleted = await stateManager.deleteSnapshot(snapshot.id);
      expect(deleted).toBe(true);
      
      const validation = await stateManager.validateSnapshot(snapshot.id);
      expect(validation.isValid).toBe(false);
    });

    it('should get all snapshots', async () => {
      const snapshot1 = await stateManager.createSnapshot('full');
      const snapshot2 = await stateManager.createSnapshot('incremental');
      
      const snapshots = await stateManager.getSnapshots();
      
      expect(snapshots).toHaveLength(2);
      expect(snapshots.map(s => s.id)).toContain(snapshot1.id);
      expect(snapshots.map(s => s.id)).toContain(snapshot2.id);
    });

    it('should get snapshot metadata', async () => {
      const snapshot = await stateManager.createSnapshot('full');
      
      const metadata = await stateManager.getSnapshotMetadata(snapshot.id);
      
      expect(metadata.id).toBe(snapshot.id);
      expect(metadata.type).toBe('full');
      expect(metadata.size).toBeDefined();
      expect(metadata.checksum).toBeDefined();
    });
  });
});

describe('Transaction', () => {
  let transaction: Transaction;
  let stateManager: StateManager;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    stateManager = new StateManager(mockLogger as any);
    
    const context = {
      transactionId: 'test-txn-123',
      userId: 'test-user',
      sessionId: 'test-session',
      timestamp: new Date(),
      metadata: {}
    };
    
    transaction = new Transaction('test-txn-123', context, stateManager, mockLogger as any);
  });

  describe('Transaction Lifecycle', () => {
    it('should start with PENDING status', () => {
      expect(transaction.status).toBe(TransactionStatus.PENDING);
    });

    it('should execute operation successfully', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      const result = await transaction.execute(operation);
      
      expect(result).toBe('success');
      expect(transaction.status).toBe(TransactionStatus.ACTIVE);
      expect(operation).toHaveBeenCalled();
    });

    it('should handle operation failure', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      
      await expect(transaction.execute(operation)).rejects.toThrow('Operation failed');
      expect(transaction.status).toBe(TransactionStatus.FAILED);
    });

    it('should commit successfully', async () => {
      await transaction.commit();
      expect(transaction.status).toBe(TransactionStatus.COMMITTED);
    });

    it('should rollback successfully', async () => {
      const mockOperation: AtomicOperation = {
        id: 'test-op',
        name: 'Test Operation',
        description: 'Test operation for rollback',
        execute: jest.fn().mockResolvedValue('success'),
        rollback: jest.fn().mockResolvedValue(undefined),
        validate: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
        dependencies: [],
        timeout: 5000,
        retryCount: 3,
        priority: 5
      };

      await transaction.addOperation(mockOperation);
      await transaction.rollback();
      
      expect(transaction.status).toBe(TransactionStatus.ROLLED_BACK);
      expect(mockOperation.rollback).toHaveBeenCalled();
    });
  });

  describe('Checkpoint Management', () => {
    it('should create checkpoint', async () => {
      const checkpoint = await transaction.createCheckpoint('Test checkpoint');
      
      expect(checkpoint.id).toBeDefined();
      expect(checkpoint.transactionId).toBe('test-txn-123');
      expect(checkpoint.type).toBe(RollbackPointType.CHECKPOINT);
      expect(checkpoint.description).toBe('Test checkpoint');
    });

    it('should rollback to checkpoint', async () => {
      const checkpoint = await transaction.createCheckpoint('Test checkpoint');
      
      await expect(transaction.rollbackToCheckpoint(checkpoint.id)).resolves.not.toThrow();
    });

    it('should fail rollback to non-existent checkpoint', async () => {
      await expect(transaction.rollbackToCheckpoint('non-existent')).rejects.toThrow(
        'Checkpoint not found: non-existent'
      );
    });

    it('should get rollback points', async () => {
      const checkpoint1 = await transaction.createCheckpoint('Checkpoint 1');
      const checkpoint2 = await transaction.createCheckpoint('Checkpoint 2');
      
      const rollbackPoints = await transaction.getRollbackPoints();
      
      expect(rollbackPoints).toHaveLength(2);
      expect(rollbackPoints.map(rp => rp.id)).toContain(checkpoint1.id);
      expect(rollbackPoints.map(rp => rp.id)).toContain(checkpoint2.id);
    });
  });

  describe('Operation Management', () => {
    it('should add operation to transaction', async () => {
      const mockOperation: AtomicOperation = {
        id: 'test-op',
        name: 'Test Operation',
        description: 'Test operation',
        execute: jest.fn().mockResolvedValue('success'),
        rollback: jest.fn().mockResolvedValue(undefined),
        validate: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
        dependencies: [],
        timeout: 5000,
        retryCount: 3,
        priority: 5
      };

      await transaction.addOperation(mockOperation);
      
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Added operation Test Operation to transaction test-txn-123')
      );
    });

    it('should validate transaction operations', async () => {
      const mockOperation: AtomicOperation = {
        id: 'test-op',
        name: 'Test Operation',
        description: 'Test operation',
        execute: jest.fn().mockResolvedValue('success'),
        rollback: jest.fn().mockResolvedValue(undefined),
        validate: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
        dependencies: [],
        timeout: 5000,
        retryCount: 3,
        priority: 5
      };

      await transaction.addOperation(mockOperation);
      
      const validation = await transaction.validate();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(mockOperation.validate).toHaveBeenCalled();
    });

    it('should handle validation failures', async () => {
      const mockOperation: AtomicOperation = {
        id: 'test-op',
        name: 'Test Operation',
        description: 'Test operation',
        execute: jest.fn().mockResolvedValue('success'),
        rollback: jest.fn().mockResolvedValue(undefined),
        validate: jest.fn().mockResolvedValue({ 
          isValid: false, 
          errors: ['Validation error'], 
          warnings: [] 
        }),
        dependencies: [],
        timeout: 5000,
        retryCount: 3,
        priority: 5
      };

      await transaction.addOperation(mockOperation);
      
      const validation = await transaction.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Validation error');
    });
  });
});

describe('TransactionManager', () => {
  let transactionManager: TransactionManager;
  let stateManager: StateManager;
  let rollbackManager: RollbackManager;
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = new MockLogger();
    stateManager = new StateManager(mockLogger as any);
    rollbackManager = new RollbackManager(mockLogger as any);
    transactionManager = new TransactionManager(
      stateManager,
      rollbackManager,
      mockLogger as any
    );
  });

  describe('Transaction Lifecycle', () => {
    it('should begin transaction', async () => {
      const transaction = await transactionManager.beginTransaction();
      
      expect(transaction.id).toBeDefined();
      expect(transaction.status).toBe(TransactionStatus.PENDING);
      expect(transaction.context).toBeDefined();
    });

    it('should execute atomic operation successfully', async () => {
      const mockOperation: AtomicOperation = {
        id: 'test-op',
        name: 'Test Operation',
        description: 'Test atomic operation',
        execute: jest.fn().mockResolvedValue('operation result'),
        rollback: jest.fn().mockResolvedValue(undefined),
        validate: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
        dependencies: [],
        timeout: 5000,
        retryCount: 3,
        priority: 5
      };

      const result = await transactionManager.executeAtomicOperation(mockOperation);
      
      expect(result.status).toBe(TransactionStatus.COMMITTED);
      expect(result.result).toBe('operation result');
      expect(result.executedOperations).toContain('test-op');
      expect(mockOperation.execute).toHaveBeenCalled();
    });

    it('should handle operation validation failure', async () => {
      const mockOperation: AtomicOperation = {
        id: 'test-op',
        name: 'Test Operation',
        description: 'Test atomic operation',
        execute: jest.fn().mockResolvedValue('operation result'),
        rollback: jest.fn().mockResolvedValue(undefined),
        validate: jest.fn().mockResolvedValue({ 
          isValid: false, 
          errors: ['Validation failed'], 
          warnings: [] 
        }),
        dependencies: [],
        timeout: 5000,
        retryCount: 3,
        priority: 5
      };

      await expect(transactionManager.executeAtomicOperation(mockOperation))
        .rejects.toThrow('Operation validation failed: Validation failed');
    });

    it('should execute multiple atomic operations', async () => {
      const operations: AtomicOperation[] = [
        {
          id: 'op-1',
          name: 'Operation 1',
          description: 'First operation',
          execute: jest.fn().mockResolvedValue('result 1'),
          rollback: jest.fn().mockResolvedValue(undefined),
          validate: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
          dependencies: [],
          timeout: 5000,
          retryCount: 3,
          priority: 5
        },
        {
          id: 'op-2',
          name: 'Operation 2',
          description: 'Second operation',
          execute: jest.fn().mockResolvedValue('result 2'),
          rollback: jest.fn().mockResolvedValue(undefined),
          validate: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
          dependencies: ['op-1'],
          timeout: 5000,
          retryCount: 3,
          priority: 5
        }
      ];

      const result = await transactionManager.executeAtomicOperations(operations);
      
      expect(result.status).toBe(TransactionStatus.COMMITTED);
      expect(result.executedOperations).toEqual(['op-1', 'op-2']);
      expect(operations[0].execute).toHaveBeenCalled();
      expect(operations[1].execute).toHaveBeenCalled();
    });

    it('should rollback on operation failure', async () => {
      const operations: AtomicOperation[] = [
        {
          id: 'op-1',
          name: 'Operation 1',
          description: 'First operation',
          execute: jest.fn().mockResolvedValue('result 1'),
          rollback: jest.fn().mockResolvedValue(undefined),
          validate: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
          dependencies: [],
          timeout: 5000,
          retryCount: 3,
          priority: 5
        },
        {
          id: 'op-2',
          name: 'Operation 2',
          description: 'Second operation that fails',
          execute: jest.fn().mockRejectedValue(new Error('Operation 2 failed')),
          rollback: jest.fn().mockResolvedValue(undefined),
          validate: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
          dependencies: ['op-1'],
          timeout: 5000,
          retryCount: 3,
          priority: 5
        }
      ];

      await expect(transactionManager.executeAtomicOperations(operations))
        .rejects.toThrow('Operation 2 failed');
      
      // Verify rollback was called
      expect(operations[0].rollback).toHaveBeenCalled();
    });
  });

  describe('Migration Management', () => {
    it('should execute migration successfully', async () => {
      const migrationSteps: MigrationStep[] = [
        {
          id: 'step-1',
          name: 'Migration Step 1',
          description: 'First migration step',
          phase: 'phase-1',
          operations: [
            {
              id: 'op-1',
              name: 'Operation 1',
              description: 'Migration operation',
              execute: jest.fn().mockResolvedValue('success'),
              rollback: jest.fn().mockResolvedValue(undefined),
              validate: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
              dependencies: [],
              timeout: 5000,
              retryCount: 3,
              priority: 5
            }
          ],
          prerequisites: [],
          rollbackStrategy: 'step',
          validationRules: [],
          estimatedDuration: 1000
        }
      ];

      const result = await transactionManager.executeMigration(migrationSteps);
      
      expect(result.success).toBe(true);
      expect(result.completedSteps).toContain('step-1');
      expect(result.error).toBeUndefined();
    });

    it('should handle migration step failure', async () => {
      const migrationSteps: MigrationStep[] = [
        {
          id: 'step-1',
          name: 'Failing Migration Step',
          description: 'Step that will fail',
          phase: 'phase-1',
          operations: [
            {
              id: 'op-1',
              name: 'Failing Operation',
              description: 'Operation that fails',
              execute: jest.fn().mockRejectedValue(new Error('Operation failed')),
              rollback: jest.fn().mockResolvedValue(undefined),
              validate: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
              dependencies: [],
              timeout: 5000,
              retryCount: 3,
              priority: 5
            }
          ],
          prerequisites: [],
          rollbackStrategy: 'step',
          validationRules: [],
          estimatedDuration: 1000
        }
      ];

      const result = await transactionManager.executeMigration(migrationSteps);
      
      expect(result.success).toBe(false);
      expect(result.failedStep).toBe('step-1');
      expect(result.error).toBeDefined();
    });
  });

  describe('Transaction Status Management', () => {
    it('should get transaction status', async () => {
      const transaction = await transactionManager.beginTransaction();
      
      const status = await transactionManager.getTransactionStatus(transaction.id);
      expect(status).toBe(TransactionStatus.PENDING);
    });

    it('should get active transactions', async () => {
      const transaction1 = await transactionManager.beginTransaction();
      const transaction2 = await transactionManager.beginTransaction();
      
      const activeTransactions = await transactionManager.getActiveTransactions();
      
      expect(activeTransactions).toHaveLength(2);
      expect(activeTransactions.map(t => t.id)).toContain(transaction1.id);
      expect(activeTransactions.map(t => t.id)).toContain(transaction2.id);
    });

    it('should cancel transaction', async () => {
      const transaction = await transactionManager.beginTransaction();
      
      const cancelled = await transactionManager.cancelTransaction(transaction.id);
      expect(cancelled).toBe(true);
      
      const activeTransactions = await transactionManager.getActiveTransactions();
      expect(activeTransactions.map(t => t.id)).not.toContain(transaction.id);
    });
  });

  describe('Transaction History', () => {
    it('should maintain transaction history', async () => {
      const mockOperation: AtomicOperation = {
        id: 'test-op',
        name: 'Test Operation',
        description: 'Test operation for history',
        execute: jest.fn().mockResolvedValue('success'),
        rollback: jest.fn().mockResolvedValue(undefined),
        validate: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
        dependencies: [],
        timeout: 5000,
        retryCount: 3,
        priority: 5
      };

      await transactionManager.executeAtomicOperation(mockOperation);
      
      const history = await transactionManager.getTransactionHistory();
      expect(history).toHaveLength(1);
      expect(history[0].status).toBe(TransactionStatus.COMMITTED);
    });

    it('should cleanup old transactions', async () => {
      const mockOperation: AtomicOperation = {
        id: 'test-op',
        name: 'Test Operation',
        description: 'Test operation for cleanup',
        execute: jest.fn().mockResolvedValue('success'),
        rollback: jest.fn().mockResolvedValue(undefined),
        validate: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
        dependencies: [],
        timeout: 5000,
        retryCount: 3,
        priority: 5
      };

      await transactionManager.executeAtomicOperation(mockOperation);
      
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const cleanedCount = await transactionManager.cleanupTransactions(futureDate);
      
      expect(cleanedCount).toBe(1);
      
      const history = await transactionManager.getTransactionHistory();
      expect(history).toHaveLength(0);
    });
  });
});

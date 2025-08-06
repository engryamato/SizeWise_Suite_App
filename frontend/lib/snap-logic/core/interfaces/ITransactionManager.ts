/**
 * Transaction Manager Interfaces
 * SizeWise Suite - Enhanced Implementation Priority Group
 * 
 * Atomic operation management interfaces for ensuring data consistency,
 * state preservation, and comprehensive rollback capabilities during
 * architectural migrations and critical operations.
 * 
 * @fileoverview Transaction manager interfaces
 * @version 2.0.0
 * @author SizeWise Suite Development Team
 */

/**
 * Transaction isolation levels
 */
export enum TransactionIsolationLevel {
  READ_UNCOMMITTED = 'read_uncommitted',
  READ_COMMITTED = 'read_committed',
  REPEATABLE_READ = 'repeatable_read',
  SERIALIZABLE = 'serializable'
}

/**
 * Transaction status
 */
export enum TransactionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMMITTED = 'committed',
  ROLLED_BACK = 'rolled_back',
  FAILED = 'failed'
}

/**
 * Rollback point types
 */
export enum RollbackPointType {
  AUTOMATIC = 'automatic',     // System-generated rollback points
  MANUAL = 'manual',          // User-requested rollback points
  CHECKPOINT = 'checkpoint',   // Phase completion checkpoints
  EMERGENCY = 'emergency'      // Emergency rollback points
}

/**
 * Transaction context for operations
 */
export interface TransactionContext {
  transactionId: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

/**
 * Atomic operation interface
 */
export interface AtomicOperation<T = any> {
  id: string;
  name: string;
  description: string;
  execute: (context: TransactionContext) => Promise<T>;
  rollback: (context: TransactionContext, result?: T) => Promise<void>;
  validate: (context: TransactionContext) => Promise<ValidationResult>;
  dependencies: string[]; // IDs of operations this depends on
  timeout: number; // Maximum execution time in milliseconds
  retryCount: number; // Number of retry attempts
  priority: number; // Execution priority (1-10)
}

/**
 * Validation result for operations
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: Record<string, any>;
}

/**
 * Transaction options
 */
export interface TransactionOptions {
  isolationLevel?: TransactionIsolationLevel;
  timeout?: number; // Transaction timeout in milliseconds
  maxRetries?: number;
  autoRollback?: boolean;
  createCheckpoint?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Rollback point snapshot
 */
export interface RollbackPoint {
  id: string;
  transactionId: string;
  type: RollbackPointType;
  timestamp: Date;
  description: string;
  snapshots: {
    database?: any;
    serviceStates?: Record<string, any>;
    configuration?: any;
    userSessions?: any;
    fileSystem?: any;
    cache?: any;
  };
  dependencies: string[];
  validationChecks: ValidationResult[];
  metadata: Record<string, any>;
}

/**
 * Transaction result
 */
export interface TransactionResult<T = any> {
  transactionId: string;
  status: TransactionStatus;
  result?: T;
  error?: Error;
  rollbackPoints: RollbackPoint[];
  executedOperations: string[];
  duration: number;
  metadata: Record<string, any>;
}

/**
 * Migration step for complex workflows
 */
export interface MigrationStep {
  id: string;
  name: string;
  description: string;
  phase: string;
  operations: AtomicOperation[];
  prerequisites: string[];
  rollbackStrategy: 'operation' | 'step' | 'phase';
  validationRules: ValidationRule[];
  estimatedDuration: number;
}

/**
 * Validation rule for migration steps
 */
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  validate: (context: any) => Promise<ValidationResult>;
  severity: 'error' | 'warning' | 'info';
  required: boolean;
}

/**
 * Migration result
 */
export interface MigrationResult {
  migrationId: string;
  success: boolean;
  completedSteps: string[];
  failedStep?: string;
  rollbackPoints: RollbackPoint[];
  error?: Error;
  duration: number;
  metadata: Record<string, any>;
}

/**
 * State snapshot for rollback
 */
export interface StateSnapshot {
  id: string;
  timestamp: Date;
  type: 'full' | 'incremental';
  data: {
    snapPoints: any[];
    centerlines: any[];
    configuration: any;
    userPreferences: any;
    serviceStates: Record<string, any>;
  };
  checksum: string;
  size: number; // Size in bytes
  compressionType?: string;
}

/**
 * Main Transaction Manager interface
 */
export interface ITransactionManager {
  /**
   * Begin a new transaction
   */
  beginTransaction(options?: TransactionOptions): Promise<ITransaction>;

  /**
   * Execute atomic operation within transaction
   */
  executeAtomicOperation<T>(
    operation: AtomicOperation<T>,
    options?: TransactionOptions
  ): Promise<TransactionResult<T>>;

  /**
   * Execute multiple operations atomically
   */
  executeAtomicOperations(
    operations: AtomicOperation[],
    options?: TransactionOptions
  ): Promise<TransactionResult>;

  /**
   * Execute migration workflow
   */
  executeMigration(
    migrationSteps: MigrationStep[],
    options?: TransactionOptions
  ): Promise<MigrationResult>;

  /**
   * Create rollback point
   */
  createRollbackPoint(
    transactionId: string,
    type: RollbackPointType,
    description: string
  ): Promise<RollbackPoint>;

  /**
   * Execute rollback to specific point
   */
  executeRollback(rollbackPointId: string): Promise<boolean>;

  /**
   * Get transaction status
   */
  getTransactionStatus(transactionId: string): Promise<TransactionStatus>;

  /**
   * Get active transactions
   */
  getActiveTransactions(): Promise<ITransaction[]>;

  /**
   * Cancel transaction
   */
  cancelTransaction(transactionId: string): Promise<boolean>;

  /**
   * Get transaction history
   */
  getTransactionHistory(userId?: string): Promise<TransactionResult[]>;

  /**
   * Cleanup completed transactions
   */
  cleanupTransactions(olderThan: Date): Promise<number>;
}

/**
 * Individual transaction interface
 */
export interface ITransaction {
  /**
   * Transaction ID
   */
  readonly id: string;

  /**
   * Transaction status
   */
  readonly status: TransactionStatus;

  /**
   * Transaction context
   */
  readonly context: TransactionContext;

  /**
   * Set isolation level
   */
  setIsolationLevel(level: TransactionIsolationLevel): Promise<void>;

  /**
   * Execute operation within transaction
   */
  execute<T>(operation: () => Promise<T>): Promise<T>;

  /**
   * Add operation to transaction
   */
  addOperation(operation: AtomicOperation): Promise<void>;

  /**
   * Create checkpoint
   */
  createCheckpoint(description: string): Promise<RollbackPoint>;

  /**
   * Rollback to checkpoint
   */
  rollbackToCheckpoint(checkpointId: string): Promise<void>;

  /**
   * Commit transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback transaction
   */
  rollback(): Promise<void>;

  /**
   * Get rollback points
   */
  getRollbackPoints(): Promise<RollbackPoint[]>;

  /**
   * Validate transaction state
   */
  validate(): Promise<ValidationResult>;
}

/**
 * State manager for preserving system state
 */
export interface IStateManager {
  /**
   * Create state snapshot
   */
  createSnapshot(type: 'full' | 'incremental'): Promise<StateSnapshot>;

  /**
   * Restore from snapshot
   */
  restoreFromSnapshot(snapshotId: string): Promise<void>;

  /**
   * Get available snapshots
   */
  getSnapshots(): Promise<StateSnapshot[]>;

  /**
   * Delete snapshot
   */
  deleteSnapshot(snapshotId: string): Promise<boolean>;

  /**
   * Validate snapshot integrity
   */
  validateSnapshot(snapshotId: string): Promise<ValidationResult>;

  /**
   * Get snapshot metadata
   */
  getSnapshotMetadata(snapshotId: string): Promise<any>;
}

/**
 * Rollback manager for handling rollback operations
 */
export interface IRollbackManager {
  /**
   * Create rollback strategy
   */
  createRollbackStrategy(
    operations: AtomicOperation[],
    type: 'sequential' | 'parallel'
  ): Promise<RollbackStrategy>;

  /**
   * Execute rollback strategy
   */
  executeRollbackStrategy(strategyId: string): Promise<boolean>;

  /**
   * Validate rollback feasibility
   */
  validateRollbackFeasibility(rollbackPointId: string): Promise<ValidationResult>;

  /**
   * Get rollback impact analysis
   */
  getRollbackImpactAnalysis(rollbackPointId: string): Promise<RollbackImpactAnalysis>;
}

/**
 * Rollback strategy
 */
export interface RollbackStrategy {
  id: string;
  type: 'sequential' | 'parallel';
  operations: RollbackOperation[];
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
  dependencies: string[];
}

/**
 * Rollback operation
 */
export interface RollbackOperation {
  id: string;
  name: string;
  execute: () => Promise<void>;
  validate: () => Promise<ValidationResult>;
  estimatedDuration: number;
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Rollback impact analysis
 */
export interface RollbackImpactAnalysis {
  affectedServices: string[];
  affectedUsers: number;
  dataLossRisk: 'none' | 'low' | 'medium' | 'high';
  downtime: number; // Estimated downtime in seconds
  dependencies: string[];
  recommendations: string[];
}

/**
 * Transaction monitoring interface
 */
export interface ITransactionMonitor {
  /**
   * Monitor transaction progress
   */
  monitorTransaction(transactionId: string): Promise<TransactionProgress>;

  /**
   * Get transaction metrics
   */
  getTransactionMetrics(): Promise<TransactionMetrics>;

  /**
   * Set up transaction alerts
   */
  setupTransactionAlerts(config: TransactionAlertConfig): Promise<void>;

  /**
   * Get failed transactions
   */
  getFailedTransactions(since: Date): Promise<TransactionResult[]>;
}

/**
 * Transaction progress
 */
export interface TransactionProgress {
  transactionId: string;
  totalOperations: number;
  completedOperations: number;
  currentOperation: string;
  estimatedTimeRemaining: number;
  progressPercentage: number;
}

/**
 * Transaction metrics
 */
export interface TransactionMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  averageDuration: number;
  rollbackRate: number;
  performanceMetrics: {
    throughput: number; // Transactions per second
    latency: number;    // Average latency in ms
    errorRate: number;  // Error rate percentage
  };
}

/**
 * Transaction alert configuration
 */
export interface TransactionAlertConfig {
  longRunningThreshold: number; // Alert if transaction runs longer than this (ms)
  failureRateThreshold: number; // Alert if failure rate exceeds this percentage
  rollbackRateThreshold: number; // Alert if rollback rate exceeds this percentage
  notificationChannels: string[]; // Email, Slack, etc.
}

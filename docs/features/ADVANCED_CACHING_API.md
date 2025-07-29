# Advanced Caching Service API Reference

## Overview

The Advanced Caching Service provides intelligent caching capabilities with LRU eviction, TTL expiration, multi-tier storage, and performance optimization for SizeWise Suite.

## Core Classes

### AdvancedCachingService

The main caching service class that provides all caching functionality.

#### Constructor

```typescript
constructor(config?: CacheConfig)
```

**Parameters:**
- `config` (optional): Configuration object for the caching service

#### Methods

##### `initialize(): Promise<boolean>`

Initializes the caching service and sets up IndexedDB connection.

**Returns:** Promise that resolves to `true` if initialization succeeds, `false` otherwise.

```typescript
const service = new AdvancedCachingService();
const initialized = await service.initialize();
```

##### `get<T>(key: string): Promise<T | null>`

Retrieves a value from the cache.

**Parameters:**
- `key`: The cache key to retrieve

**Returns:** Promise that resolves to the cached value or `null` if not found.

```typescript
const cachedResult = await service.get<CalculationResult>('project-123-calculation');
```

##### `set<T>(key: string, value: T, ttl?: number): Promise<void>`

Stores a value in the cache.

**Parameters:**
- `key`: The cache key
- `value`: The value to cache
- `ttl` (optional): Time to live in milliseconds

```typescript
await service.set('project-123-calculation', result, 300000); // 5 minutes TTL
```

##### `delete(key: string): Promise<void>`

Removes a specific key from the cache.

**Parameters:**
- `key`: The cache key to remove

```typescript
await service.delete('project-123-calculation');
```

##### `clear(): Promise<void>`

Clears all cached data.

```typescript
await service.clear();
```

##### `cacheCalculationResult(projectUuid: string, inputHash: string, result: CalculationResult): Promise<void>`

Specialized method for caching HVAC calculation results.

**Parameters:**
- `projectUuid`: The project identifier
- `inputHash`: Hash of the calculation inputs
- `result`: The calculation result to cache

```typescript
await service.cacheCalculationResult('project-123', 'input-hash-456', calculationResult);
```

##### `getCachedCalculationResult(projectUuid: string, inputHash: string): Promise<CalculationResult | null>`

Retrieves a cached calculation result.

**Parameters:**
- `projectUuid`: The project identifier
- `inputHash`: Hash of the calculation inputs

**Returns:** Promise that resolves to the cached result or `null`.

```typescript
const cached = await service.getCachedCalculationResult('project-123', 'input-hash-456');
```

##### `prefetchProjectData(projectUuid: string): Promise<void>`

Prefetches commonly used data for a project.

**Parameters:**
- `projectUuid`: The project identifier

```typescript
await service.prefetchProjectData('project-123');
```

##### `getMetrics(): CacheMetrics`

Returns current cache performance metrics.

**Returns:** Object containing cache metrics.

```typescript
const metrics = service.getMetrics();
console.log(`Hit rate: ${metrics.hitRate * 100}%`);
```

##### `optimizeCache(): Promise<void>`

Performs cache optimization including cleanup and reorganization.

```typescript
await service.optimizeCache();
```

## React Hook: useAdvancedCaching

### Hook Signature

```typescript
function useAdvancedCaching(config?: CachingHookConfig): CachingHookReturn
```

### Configuration

```typescript
interface CachingHookConfig extends Partial<CacheConfig> {
  enableAutoWarmup?: boolean;
  enablePerformanceMonitoring?: boolean;
  monitoringInterval?: number;
  autoCleanupInterval?: number;
}
```

### Return Value

```typescript
interface CachingHookReturn {
  // Core caching operations
  get: <T>(key: string) => Promise<T | null>;
  set: <T>(key: string, value: T, ttl?: number) => Promise<void>;
  delete: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  
  // Specialized operations
  cacheCalculation: (projectUuid: string, inputHash: string, result: CalculationResult) => Promise<void>;
  getCachedCalculation: (projectUuid: string, inputHash: string) => Promise<CalculationResult | null>;
  prefetchProject: (projectUuid: string) => Promise<void>;
  
  // Cache management
  warmCache: (keys: string[]) => Promise<void>;
  addPrefetchStrategy: (strategy: PrefetchStrategy) => void;
  
  // Monitoring and metrics
  metrics: CacheMetrics;
  isReady: boolean;
  error: Error | null;
  
  // Performance optimization
  optimizeCache: () => Promise<void>;
  getRecommendations: () => CacheOptimizationRecommendation[];
}
```

### Usage Example

```typescript
function MyComponent() {
  const {
    get,
    set,
    cacheCalculation,
    getCachedCalculation,
    metrics,
    optimizeCache,
    isReady,
    error
  } = useAdvancedCaching({
    maxMemorySize: 100,
    defaultTTL: 600000,
    enableAutoWarmup: true
  });

  const handleCalculation = async (inputs: any) => {
    if (!isReady) return;

    const inputHash = generateHash(inputs);
    
    // Check cache first
    const cached = await getCachedCalculation('project-123', inputHash);
    if (cached) {
      return cached;
    }

    // Perform calculation
    const result = await performCalculation(inputs);
    
    // Cache result
    await cacheCalculation('project-123', inputHash, result);
    
    return result;
  };

  if (error) {
    return <div>Caching error: {error.message}</div>;
  }

  return (
    <div>
      <p>Cache Hit Rate: {(metrics.hitRate * 100).toFixed(1)}%</p>
      <p>Memory Usage: {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB</p>
      <button onClick={optimizeCache}>Optimize Cache</button>
    </div>
  );
}
```

## Type Definitions

### CacheConfig

```typescript
interface CacheConfig {
  maxMemorySize: number;        // Maximum memory cache size in MB
  defaultTTL: number;          // Default TTL in milliseconds
  maxIndexedDBSize: number;    // Maximum IndexedDB cache size in MB
  compressionEnabled: boolean; // Enable compression
  prefetchEnabled: boolean;    // Enable prefetching
  metricsEnabled: boolean;     // Enable metrics collection
}
```

### CacheEntry

```typescript
interface CacheEntry<T = any> {
  key: string;
  value: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  compressed: boolean;
}
```

### CacheMetrics

```typescript
interface CacheMetrics {
  hitRate: number;           // Cache hit rate (0-1)
  missRate: number;          // Cache miss rate (0-1)
  totalRequests: number;     // Total cache requests
  totalHits: number;         // Total cache hits
  totalMisses: number;       // Total cache misses
  memoryUsage: number;       // Memory usage in bytes
  indexedDBUsage: number;    // IndexedDB usage in bytes
  evictionCount: number;     // Number of evicted entries
  compressionRatio: number;  // Compression ratio (0-1)
}
```

### PrefetchStrategy

```typescript
interface PrefetchStrategy {
  name: string;
  condition: (context: PrefetchContext) => boolean;
  keys: (context: PrefetchContext) => string[];
  priority: number;
}
```

### CacheOptimizationRecommendation

```typescript
interface CacheOptimizationRecommendation {
  type: 'memory' | 'performance' | 'storage' | 'configuration';
  severity: 'low' | 'medium' | 'high';
  message: string;
  action: string;
  impact: string;
}
```

## Performance Characteristics

### Memory Management

- **LRU Eviction**: Automatically removes least recently used items when memory limit is reached
- **Memory Pressure Handling**: Responds to browser memory pressure events
- **Compression**: Optional compression for large values to save memory

### Storage Tiers

1. **Memory Cache**: Fast access, limited size, volatile
2. **IndexedDB**: Persistent storage, larger capacity, slower access

### Performance Metrics

- **Hit Rate**: Typically 60-80% for well-configured caches
- **Memory Usage**: Configurable limits with automatic cleanup
- **Access Time**: Sub-millisecond for memory cache, 1-5ms for IndexedDB

## Best Practices

### Cache Key Design

```typescript
// Good: Hierarchical, descriptive keys
const key = `project:${projectUuid}:calculation:${calculationType}:${inputHash}`;

// Bad: Generic, collision-prone keys
const key = `calc_${id}`;
```

### TTL Strategy

```typescript
// Different TTL for different data types
const TTL_STRATEGIES = {
  calculations: 300000,    // 5 minutes - frequently changing
  projectData: 1800000,    // 30 minutes - moderately stable
  userPreferences: 3600000 // 1 hour - rarely changing
};
```

### Memory Management

```typescript
// Monitor memory usage and optimize regularly
const { metrics } = useAdvancedCaching();

useEffect(() => {
  if (metrics.memoryUsage > 80 * 1024 * 1024) { // 80MB threshold
    optimizeCache();
  }
}, [metrics.memoryUsage]);
```

### Error Handling

```typescript
const handleCacheOperation = async () => {
  try {
    const result = await get('my-key');
    return result;
  } catch (error) {
    console.warn('Cache operation failed, proceeding without cache:', error);
    // Continue with non-cached operation
    return await performDirectOperation();
  }
};
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**: Reduce `maxMemorySize` or increase cleanup frequency
2. **Low Hit Rate**: Review cache key strategy and TTL settings
3. **IndexedDB Errors**: Check browser storage quotas and permissions
4. **Performance Issues**: Enable compression and optimize prefetch strategies

### Debug Mode

```typescript
const service = new AdvancedCachingService({
  metricsEnabled: true,
  debugMode: true // Enable detailed logging
});
```

### Monitoring

```typescript
// Set up performance monitoring
const { metrics, getRecommendations } = useAdvancedCaching();

useEffect(() => {
  const recommendations = getRecommendations();
  recommendations.forEach(rec => {
    if (rec.severity === 'high') {
      console.warn('Cache optimization needed:', rec.message);
    }
  });
}, [metrics]);
```

## Related Documentation

- [Genuine Enhancements Integration Guide](./GENUINE_ENHANCEMENTS_INTEGRATION_GUIDE.md)
- [Microservices Infrastructure Guide](./MICROSERVICES_GUIDE.md)
- [Performance Benchmarking Results](./PERFORMANCE_BENCHMARKS.md)

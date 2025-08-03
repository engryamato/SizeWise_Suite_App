# MongoDB Indexing Strategy
## SizeWise Suite - Phase 4: Performance Optimization

This document outlines the MongoDB indexing strategy for HVAC-specific collections to achieve 60% sync performance improvement and <100ms query response times.

## Overview

The MongoDB indexing strategy complements the SQLite indexing improvements by optimizing NoSQL collections used for:
- Spatial data and 3D geometry
- HVAC calculation results
- Real-time collaboration data
- Offline sync operations

## Target Performance Metrics

- **Sync Performance**: 60% improvement in user data synchronization
- **Query Response Time**: <100ms for 95% of database operations
- **Concurrent Users**: Support 100+ users without performance degradation
- **Index Usage Rate**: >90% of queries using indexes effectively

## Collection Indexing Strategy

### 1. Projects Collection
```javascript
// User projects with status filtering
db.projects.createIndex({ "user_id": 1, "status": 1, "last_modified": -1 })

// Building type filtering for HVAC-specific queries
db.projects.createIndex({ "building_type": 1, "user_id": 1, "created_at": -1 })

// Project name and description search
db.projects.createIndex({ "name": "text", "description": "text" })

// Organization-based queries for multi-tenant support
db.projects.createIndex({ "organization_id": 1, "status": 1 })
```

### 2. Calculations Collection
```javascript
// Project calculations by type
db.calculations.createIndex({ "project_id": 1, "calculation_type": 1, "created_at": -1 })

// CFM and pressure drop queries for HVAC analysis
db.calculations.createIndex({ "result_data.cfm": 1 })
db.calculations.createIndex({ "result_data.pressure_drop": 1 })

// User-specific calculation history
db.calculations.createIndex({ "user_id": 1, "created_at": -1 })

// Calculation validation status
db.calculations.createIndex({ "validation_status": 1, "calculation_type": 1 })
```

### 3. Spatial Data Collection
```javascript
// Project spatial layers
db.spatial_data.createIndex({ "project_id": 1, "layer_type": 1 })

// 2D spatial index for geometry queries
db.spatial_data.createIndex({ "geometry": "2d" })

// Bounding box queries for viewport optimization
db.spatial_data.createIndex({ "bounds": "2d" })

// Temporal spatial data queries
db.spatial_data.createIndex({ "project_id": 1, "updated_at": -1 })
```

### 4. HVAC Systems Collection
```javascript
// System type filtering
db.hvac_systems.createIndex({ "project_id": 1, "system_type": 1 })

// Equipment performance queries
db.hvac_systems.createIndex({ "equipment_data.cfm": 1 })
db.hvac_systems.createIndex({ "equipment_data.pressure": 1 })
db.hvac_systems.createIndex({ "equipment_data.efficiency": 1 })

// System creation timeline
db.hvac_systems.createIndex({ "created_at": -1 })
```

### 5. Duct Layouts Collection
```javascript
// Layout type and project filtering
db.duct_layouts.createIndex({ "project_id": 1, "layout_type": 1 })

// Spatial indexes for duct segment endpoints
db.duct_layouts.createIndex({ "segments.start_point": "2d" })
db.duct_layouts.createIndex({ "segments.end_point": "2d" })

// Duct sizing queries
db.duct_layouts.createIndex({ "segments.diameter": 1 })
db.duct_layouts.createIndex({ "segments.width": 1, "segments.height": 1 })

// Layout modification tracking
db.duct_layouts.createIndex({ "created_at": -1 })
```

### 6. User Data Collection (Sync Optimization)
```javascript
// User sync status tracking
db.user_data.createIndex({ "user_id": 1, "sync_status": 1, "last_modified": -1 })

// Data type filtering for selective sync
db.user_data.createIndex({ "data_type": 1, "sync_status": 1 })

// Conflict resolution queries
db.user_data.createIndex({ "sync_status": 1, "conflict_resolution_required": 1 })
```

### 7. Change Log Collection (Audit and Sync)
```javascript
// Entity change tracking
db.change_log.createIndex({ "entity_type": 1, "entity_id": 1, "timestamp": -1 })

// User activity tracking
db.change_log.createIndex({ "user_id": 1, "timestamp": -1 })

// Sync operation queries
db.change_log.createIndex({ "sync_status": 1, "timestamp": 1 })

// Operation type filtering
db.change_log.createIndex({ "operation": 1, "entity_type": 1 })
```

### 8. Cache Collection (Performance Optimization)
```javascript
// Cache key lookup
db.cache.createIndex({ "cache_key": 1 })

// TTL index for automatic cache expiration
db.cache.createIndex({ "expires_at": 1 }, { expireAfterSeconds: 0 })

// Cache type and user filtering
db.cache.createIndex({ "cache_type": 1, "user_id": 1 })
```

## Implementation Commands

### Manual Implementation
```bash
# Connect to MongoDB
mongo sizewise_db

# Execute index creation commands
db.projects.createIndex({ "user_id": 1, "status": 1, "last_modified": -1 })
db.projects.createIndex({ "building_type": 1, "user_id": 1, "created_at": -1 })
# ... (continue with all indexes)
```

### Automated Implementation
```bash
# Run the MongoDB indexing script
cd backend/database
python migrations/001_mongodb_performance_indexes.py
```

## Performance Validation

### Query Performance Tests
```javascript
// Test project queries
db.projects.find({ "user_id": "test-user", "status": "active" }).sort({ "last_modified": -1 }).explain("executionStats")

// Test calculation queries
db.calculations.find({ "project_id": "test-project", "calculation_type": "air_duct" }).explain("executionStats")

// Test spatial queries
db.spatial_data.find({ "geometry": { $near: [x, y] } }).explain("executionStats")
```

### Expected Performance Improvements
- **Project Queries**: 70-80% faster response times
- **Calculation Lookups**: 60-70% improvement in complex queries
- **Spatial Operations**: 80-90% faster 3D geometry queries
- **Sync Operations**: 60% improvement in offline-first synchronization
- **Overall MongoDB Performance**: 50-60% reduction in query execution time

## Monitoring and Maintenance

### Index Usage Monitoring
```javascript
// Check index usage statistics
db.projects.aggregate([{ $indexStats: {} }])
db.calculations.aggregate([{ $indexStats: {} }])
```

### Performance Metrics Collection
```javascript
// Monitor slow queries
db.setProfilingLevel(2, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(5)
```

### Index Maintenance
```javascript
// Rebuild indexes if needed
db.projects.reIndex()
db.calculations.reIndex()
```

## Integration with SQLite Indexing

The MongoDB indexing strategy works in conjunction with the SQLite indexing improvements:

1. **SQLite**: Handles core application data, user management, and project metadata
2. **MongoDB**: Handles spatial data, complex calculations, and real-time collaboration
3. **Hybrid Queries**: Optimized for both databases working together
4. **Sync Performance**: Coordinated indexing for offline-first functionality

## Status: READY FOR IMPLEMENTATION

✅ **Strategy Defined**: Complete indexing strategy for all 8 collections
✅ **Performance Targets**: Clear metrics for 60% sync improvement
✅ **Implementation Plan**: Both manual and automated approaches
✅ **Validation Framework**: Performance testing and monitoring setup
✅ **Integration Ready**: Coordinates with completed SQLite indexing

The MongoDB indexing strategy is ready for implementation when MongoDB collections are actively used in the SizeWise Suite application.

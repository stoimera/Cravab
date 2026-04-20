# Cache Architecture Improvements

## Overview
This document outlines the comprehensive cache architecture improvements implemented to resolve stale cache issues and improve coordination between multiple cache layers.

## Problems Addressed

### 1. **Multiple Disconnected Cache Layers**
- **Before**: 5 different caching systems (React Query, AppCache, CacheManager, PWAStorage, OfflineCache) operating independently
- **After**: Unified cache invalidation service coordinates all layers

### 2. **Inconsistent Cache Invalidation**
- **Before**: Data changes only invalidated some cache layers, leaving others stale
- **After**: All cache layers are invalidated simultaneously when data changes

### 3. **Conflicting TTL Values**
- **Before**: AppCache (1 hour) vs others (5 minutes) caused stale data persistence
- **After**: Standardized TTL values across all layers (5 minutes for most data)

### 4. **Missing Cache Synchronization**
- **Before**: React Query updates didn't propagate to other caches
- **After**: Unified invalidation service updates all caches on mutations

### 5. **Race Conditions in Real-time Updates**
- **Before**: Real-time subscriptions only updated React Query
- **After**: Real-time updates invalidate all cache layers

## New Architecture

### Core Components

#### 1. **CacheInvalidationService** (`CacheInvalidationService.ts`)
- Centralized cache invalidation across all layers
- Standardized TTL values
- Cache warming capabilities
- Pattern-based key invalidation

#### 2. **CacheHealthMonitor** (`CacheHealthMonitor.ts`)
- Monitors cache consistency across layers
- Performance metrics tracking
- Health recommendations
- Version consistency checking

#### 3. **CacheInitialization** (`CacheInitialization.ts`)
- Sets up cache coordination on app startup
- Initializes query client references
- Runs health checks

### Updated Components

#### 1. **AppCache** (`AppCache.ts`)
- ✅ Reduced TTL from 1 hour to 5 minutes
- ✅ Added cache versioning
- ✅ Added pattern-based key matching
- ✅ Version-based stale detection

#### 2. **CacheManager** (`cache-manager.ts`)
- ✅ Added cache versioning
- ✅ Version-based stale detection
- ✅ Improved cleanup logic

#### 3. **PWAStorage** (`PWAStorage.ts`)
- ✅ Added cache versioning
- ✅ Version-based stale detection
- ✅ Improved cache management

#### 4. **OfflineCache** (`offline-cache.ts`)
- ✅ Added cache versioning
- ✅ Version-based stale detection
- ✅ Improved stale checking

#### 5. **Webhook Handlers** (`handlers.ts`)
- ✅ Updated to use unified invalidation
- ✅ All data changes now invalidate all cache layers
- ✅ Cache warming on successful operations

#### 6. **Mutation Hooks** (`useQueries.ts`)
- ✅ Updated to use unified invalidation
- ✅ Cache synchronization on mutations
- ✅ Real-time subscription updates

#### 7. **QueryProvider** (`QueryProvider.tsx`)
- ✅ Initializes cache coordination
- ✅ Sets up query client references

## Standardized TTL Values

```typescript
const CACHE_TTL = {
  REAL_TIME: 30 * 1000,      // 30 seconds (calls, live data)
  FREQUENT: 5 * 60 * 1000,   // 5 minutes (appointments, clients)
  STABLE: 15 * 60 * 1000,    // 15 minutes (services, settings)
  STATIC: 60 * 60 * 1000     // 1 hour (business hours, company data)
}
```

## Cache Versioning

All cache layers now use version `1.0.0` for consistency. When versions mismatch, cached data is considered stale and automatically invalidated.

## Usage Examples

### Invalidate All Caches for a Data Type
```typescript
import { cacheInvalidationService } from '@/lib/cache/CacheInvalidationService'

// Invalidate all cache layers for appointments
await cacheInvalidationService.invalidateData({
  tenantId: 'tenant-123',
  dataType: 'appointments',
  specificId: 'appointment-456',
  warmCache: true
})
```

### Check Cache Health
```typescript
import { cacheHealthMonitor } from '@/lib/cache/CacheHealthMonitor'

// Generate health report
const healthReport = await cacheHealthMonitor.generateHealthReport('tenant-123')
console.log('Cache health:', healthReport.overall)
console.log('Recommendations:', healthReport.recommendations)
```

### Initialize Cache Coordination
```typescript
import { cacheInitializationService } from '@/lib/cache/CacheInitialization'

// Initialize with query client
await cacheInitializationService.initialize(queryClient)
```

## Benefits

1. **Eliminated Stale Cache Issues**: All cache layers are now synchronized
2. **Improved Performance**: Consistent TTL values prevent unnecessary cache misses
3. **Better Monitoring**: Health monitoring provides visibility into cache performance
4. **Easier Maintenance**: Centralized invalidation logic reduces code duplication
5. **Version Control**: Cache versioning ensures consistency across deployments

## Migration Notes

- All existing cache invalidation calls have been updated
- New cache versioning is backward compatible
- Health monitoring is optional and doesn't affect performance
- TTL changes are applied automatically on next cache write

## Monitoring

The cache health monitor tracks:
- Cache hit rates
- Version consistency
- Cache sizes
- Performance metrics
- Health recommendations

Access health data via `cacheHealthMonitor.getHealthHistory()` or `cacheHealthMonitor.getPerformanceMetrics()`.

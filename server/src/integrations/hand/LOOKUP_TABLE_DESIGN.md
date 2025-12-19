# Equity Lookup Table Design

## Overview

The equity lookup table provides a high-performance caching layer for equity calculations. It's designed for **O(1) lookup time** using hash-based keys, making repeated queries extremely fast.

## Key Features

### 1. **Fast Lookups (O(1))**
- Hash-based key generation
- In-memory Map storage
- Instant retrieval for cached scenarios

### 2. **Canonical Key Generation**
- Normalizes card order (same scenario = same key)
- Handles isomorphic scenarios correctly
- Includes calculation mode in key (exact vs MC)

### 3. **LRU Cache Management**
- Automatic eviction when cache is full
- Configurable max size (default: 10,000 entries)
- Tracks access order for optimal eviction

### 4. **Drop-in Replacement**
- Same API as `computeEquity()`
- No changes needed to existing code
- Automatic caching with zero configuration

## Architecture

```
┌─────────────────────────────────────────┐
│  computeEquityWithCache()               │
│  (Public API)                           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  EquityLookupTable                     │
│  - get() → O(1) lookup                 │
│  - set() → O(1) store                  │
│  - LRU eviction                         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  createEquityKey()                      │
│  - Normalizes holes, board, dead cards │
│  - Creates deterministic string key     │
└─────────────────────────────────────────┘
```

## Performance Characteristics

### Lookup Speed
- **Cached query**: < 1ms (hash lookup)
- **Cache miss**: Same as `computeEquity()` (computes + caches)

### Memory Usage
- Each entry: ~200 bytes (key + result)
- 10,000 entries: ~2 MB
- Configurable max size

### Cache Hit Rate
- Depends on query patterns
- Best for: Repeated scenarios, common matchups
- Worst for: Unique scenarios (every query different)

## Usage Examples

### Basic Usage
```typescript
import { computeEquityWithCache } from "./equityLookup";

// First call: computes and caches
const result1 = computeEquityWithCache(players, board, { mode: "exact" });

// Second call: instant from cache
const result2 = computeEquityWithCache(players, board, { mode: "exact" });
```

### Pre-computing Common Scenarios
```typescript
import { getLookupTable } from "./equityLookup";

// At startup, pre-compute common matchups
const lookupTable = getLookupTable();
await lookupTable.precomputeCommonScenarios();
```

### Cache Management
```typescript
import { clearEquityCache, getCacheStats } from "./equityLookup";

// Get statistics
const stats = getCacheStats();
console.log(`Cache size: ${stats.size}/${stats.maxSize}`);

// Clear if needed
clearEquityCache();
```

## Key Generation Strategy

The canonical key ensures that:
1. **Same scenario = same key** (regardless of card order)
2. **Different scenarios = different keys**
3. **Calculation mode affects key** (exact vs MC results cached separately)

### Key Format
```
equity:{normalizedHoles}:{normalizedBoard}:{normalizedDead}:{options}
```

Example:
```
equity:14h14d|13h13d::exact
```

## When to Use

### ✅ Best For:
- **Repeated queries** (same scenarios queried multiple times)
- **Common matchups** (pre-flop scenarios, popular flop textures)
- **Interactive applications** (user exploring different options)
- **API endpoints** (caching common requests)

### ❌ Not Ideal For:
- **One-time calculations** (cache overhead not worth it)
- **Unique scenarios** (every query different, no cache hits)
- **Memory-constrained environments** (cache uses RAM)

## Advanced Options

### Custom Cache Size
```typescript
const lookupTable = getLookupTable(50_000); // 50k entries max
```

### Persistent Storage (Future Enhancement)
Could be extended to:
- Store cache in database (ClickHouse)
- Persist across server restarts
- Share cache across instances
- Pre-populate from database

## Performance Comparison

### Without Cache
- Pre-flop exact: ~5-10 seconds
- Flop exact: ~100-500ms
- Turn exact: ~10-50ms

### With Cache (cached)
- Any scenario: < 1ms
- **1000x+ speedup** for repeated queries

## Implementation Details

### LRU Eviction
- Tracks access order in array
- Evicts least recently used when full
- O(1) access, O(n) eviction (n = cache size)

### Memory Efficiency
- Stores compact result representation
- Keys are strings (canonical form)
- No duplicate data storage

### Thread Safety
- Currently single-threaded (Node.js)
- Could add locking for multi-threaded scenarios

## Future Enhancements

1. **Persistent Storage**: Save cache to database
2. **Hit Rate Tracking**: Monitor cache effectiveness
3. **Adaptive Sizing**: Auto-adjust max size based on memory
4. **TTL Support**: Expire old entries automatically
5. **Compression**: Compress stored results for memory savings
6. **Distributed Cache**: Share cache across instances (Redis)


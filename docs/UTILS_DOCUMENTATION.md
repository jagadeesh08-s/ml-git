# Bloch-Verse Utils Documentation

## Overview

This document provides comprehensive documentation for the refactored Bloch-Verse utilities system. The utilities have been reorganized into a clean, modular structure that eliminates code duplication and improves maintainability.

## New File Structure

```
src/utils/
├── index.ts                    # Main exports hub
├── cache/                      # Cache utilities
│   ├── index.ts               # Cache exports
│   ├── memory.ts              # MemoryCache class
│   ├── persistent.ts          # PersistentCache class
│   ├── invalidation.ts        # CacheInvalidator class
│   └── metrics.ts             # CacheMetricsCollector class
├── quantum/                    # Quantum computing utilities
│   ├── index.ts
│   ├── circuitOperations.ts
│   ├── gates.ts
│   ├── densityMatrix.ts
│   ├── ketState.ts
│   ├── quantumSimulation.ts
│   └── ...
├── core/                      # Core mathematical utilities
│   ├── index.ts
│   ├── matrixOperations.ts
│   ├── complex.ts
│   └── stateNotationConverter.ts
├── helpers/                   # Helper functions
│   ├── index.ts
│   ├── validation.ts
│   ├── formatting.ts
│   └── constants.ts
└── ml/                        # Machine learning utilities
└── simulation/                # Simulation utilities
```

## Import Structure

### Before (Scattered imports)
```typescript
import { MemoryCache } from '../cache/cache';
import { PersistentCache } from '../cache/persistentCache';
import { simulateCircuit } from '../circuitOperations';
import { matrixMultiply } from '../core/matrixOperations';
```

### After (Unified imports)
```typescript
// Import everything from main utils
import { MemoryCache, PersistentCache, simulateCircuit, matrixMultiply } from '@/utils';

// Or import from specific modules
import { MemoryCache, CacheKeys } from '@/utils/cache';
import { simulateCircuit, applyGate } from '@/utils/quantum';
import { matrixMultiply, tensorProduct } from '@/utils/core';
import { validateQuantumState, formatComplexNumber } from '@/utils/helpers';
```

## Cache System

### Overview
The cache system has been consolidated from 5 separate files into a unified, well-organized module with clear separation of concerns.

### Classes

#### `MemoryCache<T>`
In-memory caching with TTL and size management.
```typescript
const cache = new MemoryCache<string>({
  maxSize: 10 * 1024 * 1024, // 10MB
  defaultTTL: 30 * 60 * 1000, // 30 minutes
  maxEntries: 100
});

cache.set('key', 'value');
const value = cache.get('key');
```

#### `PersistentCache`
IndexedDB-based persistent storage for long-term data.
```typescript
const persistentCache = new PersistentCache({
  dbName: 'MyAppCache',
  storeName: 'settings'
});

await persistentCache.set('theme', 'dark');
const theme = await persistentCache.get('theme');
```

#### `CacheInvalidator`
Intelligent cache invalidation with dependency management.
```typescript
cacheInvalidator.registerDependency({
  source: 'circuit_change',
  targets: ['circuitCache', 'blochCache'],
  invalidationType: 'cascade'
});

await cacheInvalidator.invalidateBySource('circuit_change');
```

#### `CacheManager`
Unified interface for all cache operations.
```typescript
// Get specific cache type
const circuitCache = cacheManager.getCache('circuit');

// Clear all caches
await cacheManager.clearAll();

// Get comprehensive stats
const stats = cacheManager.getStats();
```

### Global Cache Instances
```typescript
import {
  monitoredCircuitCache,
  monitoredGateCache,
  monitoredBlochCache,
  monitoredSettingsCache,
  userSettingsCache,
  tutorialProgressCache
} from '@/utils/cache';
```

## Quantum Utilities

### Circuit Operations
```typescript
import { simulateCircuit, applyGate, EXAMPLE_CIRCUITS } from '@/utils/quantum';

// Simulate a quantum circuit
const result = simulateCircuit({
  numQubits: 2,
  gates: [
    { name: 'H', qubits: [0] },
    { name: 'CNOT', qubits: [0, 1] }
  ]
});

// Use example circuits
const bellState = EXAMPLE_CIRCUITS['Bell State'];
```

### Gate Operations
```typescript
import { getGateMatrixReal, PAULI } from '@/utils/quantum';

// Get gate matrix
const hMatrix = getGateMatrixReal('H');
const xGate = PAULI.X;
```

## Core Utilities

### Matrix Operations
```typescript
import { matrixMultiply, tensorProduct, transpose } from '@/utils/core';

// Matrix multiplication
const result = matrixMultiply(matrixA, matrixB);

// Tensor product
const combined = tensorProduct(matrix1, matrix2);
```

### Complex Numbers
```typescript
import { complex, add, multiply, magnitude } from '@/utils/core';

const z1 = complex(1, 2);        // 1 + 2i
const z2 = complex(3, 4);        // 3 + 4i
const sum = add(z1, z2);         // 4 + 6i
const mag = magnitude(z1);       // √5
```

## Helper Functions

### Validation
```typescript
import { validateQuantumState, validateCircuit, validateGate } from '@/utils/helpers';

// Validate quantum state
const validation = validateQuantumState([1, 0, 0, 0], 2);
if (!validation.isValid) {
  console.error(validation.errors);
}

// Validate circuit
const circuitValidation = validateCircuit(myCircuit);
```

### Formatting
```typescript
import { formatComplexNumber, formatMatrix, formatKetState } from '@/utils/helpers';

// Format complex numbers
const formatted = formatComplexNumber(complex(1/Math.sqrt(2), 1/Math.sqrt(2)));
// Output: "0.707 + 0.707i"

// Format quantum states
const stateStr = formatKetState([1, 0, 0, 0]);
// Output: "|00⟩"
```

### Constants
```typescript
import { QUANTUM_CONSTANTS, UI_CONSTANTS, CACHE_CONSTANTS } from '@/utils/helpers';

// Use physical constants
const hbar = QUANTUM_CONSTANTS.HBAR;

// Use UI constants
const animationDuration = UI_CONSTANTS.NORMAL_ANIMATION;

// Use cache constants
const defaultTTL = CACHE_CONSTANTS.CIRCUIT_CACHE_TTL;
```

## Migration Guide

### Updating Existing Imports

1. **Replace scattered cache imports:**
   ```typescript
   // Old
   import { MemoryCache } from '../cache/cache';
   import { PersistentCache } from '../cache/persistentCache';

   // New
   import { MemoryCache, PersistentCache } from '@/utils/cache';
   ```

2. **Replace quantum utility imports:**
   ```typescript
   // Old
   import { simulateCircuit } from '../circuitOperations';

   // New
   import { simulateCircuit } from '@/utils/quantum';
   ```

3. **Replace core utility imports:**
   ```typescript
   // Old
   import { matrixMultiply } from '../core/matrixOperations';

   // New
   import { matrixMultiply } from '@/utils/core';
   ```

### Benefits of the New Structure

1. **Reduced Code Duplication**: Consolidated 5 cache files into organized modules
2. **Clear Separation of Concerns**: Each module has a specific responsibility
3. **Consistent Import Patterns**: All utilities accessible through `@/utils`
4. **Better Type Safety**: Improved TypeScript interfaces and exports
5. **Enhanced Maintainability**: Modular structure makes updates easier
6. **Comprehensive Documentation**: Clear API with examples

### Performance Improvements

- **Unified Cache Management**: Single point of control for all caching operations
- **Intelligent Invalidation**: Dependency-based cache invalidation reduces unnecessary clears
- **Memory Optimization**: Better size management and eviction strategies
- **Monitoring**: Built-in performance metrics and analytics

### Best Practices

1. **Use the unified imports** from `@/utils` for common operations
2. **Import from specific modules** when you need detailed control
3. **Leverage the CacheManager** for complex cache operations
4. **Use validation helpers** before processing quantum data
5. **Utilize formatting functions** for consistent display

### Example Usage Patterns

```typescript
// Complete quantum circuit workflow
import {
  validateCircuit,
  simulateCircuit,
  formatKetState,
  cacheManager
} from '@/utils';

// Validate circuit
const validation = validateCircuit(myCircuit);
if (!validation.isValid) {
  throw new Error(validation.errors.join(', '));
}

// Check cache first
const cacheKey = `circuit_${JSON.stringify(myCircuit)}`;
let result = cacheManager.getCache('circuit').get(cacheKey);

if (!result) {
  // Simulate if not cached
  result = simulateCircuit(myCircuit);
  cacheManager.getCache('circuit').set(cacheKey, result);
}

// Format and display result
console.log('Final state:', formatKetState(result.statevector));
```

This refactored structure provides a solid foundation for the Bloch-Verse quantum application with improved organization, reduced duplication, and enhanced maintainability.
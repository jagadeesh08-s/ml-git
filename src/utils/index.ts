// Main Utils Index
// Central hub for all utility functions and modules

// Export all utility modules
export * from './cache';
export * from './quantum';
export * from './core';
export * from './helpers';

// Re-export commonly used utilities for convenience
export {
  // Cache utilities
  cacheManager,
  CacheManager,
  monitoredCircuitCache,
  monitoredGateCache,
  monitoredBlochCache,
  monitoredSettingsCache,
  cacheInvalidator,
  cacheMetricsCollector,
  cachePerformanceReporter
} from './cache';

export {
  // Quantum utilities
  simulateCircuit,
  applyGate,
  computeGateOutputState,
  EXAMPLE_CIRCUITS,
  testGateOutputs,
  testHZHSequence
} from './quantum';

export {
  // Core utilities
  matrixMultiply,
  tensorProduct,
  transpose,
  complex,
  complexToRealMatrix,
  realToComplexMatrix
} from './core';

export {
  // Helper utilities
  validateQuantumState,
  validateCircuit,
  validateGate,
  formatComplexNumber,
  formatMatrix,
  formatProbability,
  formatKetState,
  QUANTUM_CONSTANTS,
  UI_CONSTANTS,
  CACHE_CONSTANTS,
  DEFAULT_VALUES
} from './helpers';

// Export version info
export const VERSION = '1.0.0';
export const UTILS_VERSION = '1.0.0';
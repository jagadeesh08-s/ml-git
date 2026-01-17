// Constants and Default Values
// Centralized constants for the quantum application

// Quantum Constants
export const QUANTUM_CONSTANTS = {
  // Physical constants
  HBAR: 1.0545718e-34, // Reduced Planck constant (J⋅s)
  PLANCK: 6.62607015e-34, // Planck constant (J⋅s)
  SPEED_OF_LIGHT: 299792458, // Speed of light (m/s)

  // Quantum gates
  PAULI_I: [[1, 0], [0, 1]],
  PAULI_X: [[0, 1], [1, 0]],
  PAULI_Y: [[0, -1], [1, 0]],
  PAULI_Z: [[1, 0], [0, -1]],

  // Common angles
  PI_OVER_2: Math.PI / 2,
  PI_OVER_4: Math.PI / 4,
  PI_OVER_8: Math.PI / 8,

  // Precision thresholds
  NORMALIZATION_THRESHOLD: 1e-10,
  ZERO_THRESHOLD: 1e-12,
  EQUALITY_THRESHOLD: 1e-10,
} as const;

// UI Constants
export const UI_CONSTANTS = {
  // Animation durations
  FAST_ANIMATION: 150,
  NORMAL_ANIMATION: 300,
  SLOW_ANIMATION: 500,

  // Sizes
  BLOCH_SPHERE_SIZE: 300,
  SMALL_BLOCH_SPHERE_SIZE: 200,
  LARGE_BLOCH_SPHERE_SIZE: 400,

  // Colors (CSS custom properties)
  PRIMARY_COLOR: 'hsl(var(--primary))',
  SECONDARY_COLOR: 'hsl(var(--secondary))',
  ACCENT_COLOR: 'hsl(var(--accent))',
  MUTED_COLOR: 'hsl(var(--muted))',

  // Layout
  SIDEBAR_WIDTH: 320,
  HEADER_HEIGHT: 64,
  FOOTER_HEIGHT: 48,

  // Z-indices
  MODAL_Z_INDEX: 50,
  TOOLTIP_Z_INDEX: 40,
  DROPDOWN_Z_INDEX: 30,
} as const;

// Cache Constants
export const CACHE_CONSTANTS = {
  // Default TTL values (in milliseconds)
  CIRCUIT_CACHE_TTL: 60 * 60 * 1000, // 1 hour
  GATE_CACHE_TTL: 24 * 60 * 60 * 1000, // 24 hours
  BLOCH_CACHE_TTL: 30 * 60 * 1000, // 30 minutes
  SETTINGS_CACHE_TTL: 7 * 24 * 60 * 60 * 1000, // 7 days

  // Size limits (in bytes)
  CIRCUIT_CACHE_SIZE: 20 * 1024 * 1024, // 20MB
  GATE_CACHE_SIZE: 5 * 1024 * 1024, // 5MB
  BLOCH_CACHE_SIZE: 10 * 1024 * 1024, // 10MB
  SETTINGS_CACHE_SIZE: 1 * 1024 * 1024, // 1MB

  // Entry limits
  CIRCUIT_CACHE_ENTRIES: 200,
  GATE_CACHE_ENTRIES: 500,
  BLOCH_CACHE_ENTRIES: 300,
  SETTINGS_CACHE_ENTRIES: 50,

  // Cleanup intervals
  CLEANUP_INTERVAL: 5 * 60 * 1000, // 5 minutes
  METRICS_REPORT_INTERVAL: 5 * 60 * 1000, // 5 minutes
} as const;

// Default Values
export const DEFAULT_VALUES = {
  // Circuit defaults
  DEFAULT_NUM_QUBITS: 2,
  DEFAULT_CIRCUIT: {
    numQubits: 2,
    gates: []
  },

  // Simulation defaults
  DEFAULT_INITIAL_STATE: '|00⟩',
  DEFAULT_SIMULATION_SETTINGS: {
    precision: 1e-10,
    maxIterations: 1000,
    useWebGL: true,
    useWebWorkers: true
  },

  // UI defaults
  DEFAULT_THEME: 'system',
  DEFAULT_LANGUAGE: 'en',
  DEFAULT_ANIMATION_SPEED: 'normal',

  // Visualization defaults
  DEFAULT_BLOCH_SPHERE_SETTINGS: {
    showAxes: true,
    showGrid: true,
    showLabels: true,
    interactive: true,
    size: UI_CONSTANTS.BLOCH_SPHERE_SIZE
  },

  // Tutorial defaults
  DEFAULT_TUTORIAL_PROGRESS: {
    completedSteps: [],
    currentStep: 0,
    totalPoints: 0
  },

  // Cache defaults
  DEFAULT_CACHE_OPTIONS: {
    maxSize: 50 * 1024 * 1024, // 50MB
    defaultTTL: 30 * 60 * 1000, // 30 minutes
    maxEntries: 1000
  }
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_CIRCUIT: 'Invalid quantum circuit configuration',
  INVALID_STATE: 'Invalid quantum state',
  INVALID_GATE: 'Invalid quantum gate',
  SIMULATION_FAILED: 'Quantum simulation failed',
  CACHE_ERROR: 'Cache operation failed',
  NETWORK_ERROR: 'Network request failed',
  VALIDATION_ERROR: 'Data validation failed'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CIRCUIT_SAVED: 'Circuit saved successfully',
  SIMULATION_COMPLETE: 'Simulation completed successfully',
  CACHE_CLEARED: 'Cache cleared successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
  TUTORIAL_COMPLETED: 'Tutorial completed successfully'
} as const;

// File Extensions
export const FILE_EXTENSIONS = {
  QUANTUM_CIRCUIT: '.qcircuit',
  QUANTUM_STATE: '.qstate',
  SIMULATION_DATA: '.qsim',
  CACHE_DATA: '.qcache'
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  SIMULATE_CIRCUIT: '/api/simulate',
  SAVE_CIRCUIT: '/api/circuits',
  LOAD_CIRCUIT: '/api/circuits',
  GET_CACHE_STATS: '/api/cache/stats',
  CLEAR_CACHE: '/api/cache/clear',
  SAVE_SETTINGS: '/api/settings',
  LOAD_SETTINGS: '/api/settings'
} as const;
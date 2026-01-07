/**
 * WebAssembly Quantum Simulator Interface
 * Provides a JavaScript interface for fast client-side quantum circuit simulation
 */

import { executeCircuit } from './quantumSimulator';
export { QuantumSimulator } from './quantumSimulator';
export { StateVector } from './stateVector';
export { QuantumGates } from './gates';
export { Complex } from './complex';

/**
 * Simulation mode configuration
 */
export interface SimulationConfig {
  mode: 'local' | 'wasm' | 'backend';
  backend?: string;
  token?: string;
}

/**
 * Main quantum simulation API
 */
export class WasmQuantumSimulator {
  private config: SimulationConfig;

  constructor(config: SimulationConfig = { mode: 'wasm' }) {
    this.config = config;
  }

  /**
   * Execute a quantum circuit
   */
  async executeCircuit(circuitData: {
    circuit: { numQubits: number; gates: Array<{ name: string; qubits: number[]; parameters?: number[] }> };
    initialState: string;
    customState?: { alpha: string; beta: string };
  }) {
    if (this.config.mode === 'wasm') {
      // Use our fast JavaScript implementation
      return executeCircuit(circuitData);
    } else {
      // Fallback to backend or other simulation methods
      throw new Error(`Simulation mode '${this.config.mode}' not implemented yet`);
    }
  }

  /**
   * Set simulation configuration
   */
  setConfig(config: SimulationConfig): void {
    this.config = config;
  }

  /**
   * Get current configuration
   */
  getConfig(): SimulationConfig {
    return { ...this.config };
  }
}

// Default instance
export const wasmSimulator = new WasmQuantumSimulator();
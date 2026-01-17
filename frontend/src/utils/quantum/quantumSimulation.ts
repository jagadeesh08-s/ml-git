// Quantum simulation utilities for multi-qubit systems
// Main entry point that re-exports from modular components

export { GATES, PAULI, AVAILABLE_GATES, SINGLE_QUBIT_GATES, TWO_QUBIT_GATES, THREE_QUBIT_GATES, getGateMatrix, validateGateParameters } from './gates';
export { matrixMultiply, tensorProduct, trace, transpose, matrixAdd, scalarMultiply, identity, zeros, isSquare, isHermitian, frobeniusNorm, matrixEquals } from '../core/matrixOperations';
export { createInitialState, calculateBlochVector, calculateSuperposition, calculateEntanglement, calculateConcurrence, calculateVonNeumannEntropy, calculateReducedDensityMatrix, calculateEntanglementWitness, formatDensityMatrix, partialTrace } from './densityMatrix';
export { applyGate, simulateCircuit, computeGateOutputState, simulateCircuitWithStates, EXAMPLE_CIRCUITS, testGateOutputs } from './circuitOperations';

// Re-export types and interfaces
export type { QuantumGate } from './gates';
export type { DensityMatrix } from './densityMatrix';
export type { QuantumCircuit } from './circuitOperations';

// Legacy exports for backward compatibility
import { trace } from '../core/matrixOperations';

export const matrixTrace = (matrix: number[][]): number => {
  return trace(matrix);
};

// Web Worker for heavy quantum computations
// Offloads matrix operations and circuit simulations to prevent UI blocking

import { QuantumCircuit } from './circuitOperations';
import { matrixMultiply, tensorProduct } from '../core/matrixOperations';

interface WorkerMessage {
  type: 'simulate' | 'matrix_multiply' | 'tensor_product';
  id: string;
  data: any;
}

interface WorkerResponse {
  type: 'result' | 'error';
  id: string;
  data?: any;
  error?: string;
}

// Quantum simulation worker
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, id, data } = e.data;

  try {
    let result: any;

    switch (type) {
      case 'simulate':
        result = simulateCircuitWorker(data.circuit, data.initialState);
        break;

      case 'matrix_multiply':
        result = matrixMultiply(data.A, data.B);
        break;

      case 'tensor_product':
        result = tensorProduct(data.A, data.B);
        break;

      default:
        throw new Error(`Unknown worker operation: ${type}`);
    }

    const response: WorkerResponse = {
      type: 'result',
      id,
      data: result
    };

    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      id,
      error: error instanceof Error ? error.message : 'Unknown error'
    };

    self.postMessage(response);
  }
};

// Optimized circuit simulation for worker
function simulateCircuitWorker(circuit: QuantumCircuit, initialState?: number[][]) {
  const { numQubits, gates } = circuit;

  // Initialize state
  let state = initialState || createIdentityState(numQubits);

  // Apply gates sequentially
  for (const gate of gates) {
    state = applyGateWorker(state, gate, numQubits);
  }

  // Compute results
  const probabilities = state.map((row, i) => row[i]);
  const reducedStates: any[] = [];

  for (let i = 0; i < numQubits; i++) {
    reducedStates.push(partialTraceWorker(state, i, numQubits));
  }

  return {
    statevector: state,
    probabilities,
    densityMatrix: state,
    reducedStates
  };
}

// Worker-optimized gate application
function applyGateWorker(state: number[][], gate: any, numQubits: number): number[][] {
  if (gate.qubits.length === 1) {
    return applySingleQubitGateWorker(state, gate.matrix, gate.qubits[0], numQubits);
  } else if (gate.qubits.length === 2) {
    return applyTwoQubitGateWorker(state, gate.matrix, gate.qubits[0], gate.qubits[1], numQubits);
  }
  return state;
}

// Single qubit gate application (worker optimized)
function applySingleQubitGateWorker(state: number[][], gateMatrix: number[][], qubit: number, numQubits: number): number[][] {
  const dim = 1 << numQubits;
  const result = Array(dim).fill(0).map(() => Array(dim).fill(0));

  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      // Check if only the target qubit differs
      const iMasked = i & ~(1 << qubit);
      const jMasked = j & ~(1 << qubit);
      const iBit = (i >> qubit) & 1;
      const jBit = (j >> qubit) & 1;

      if (iMasked === jMasked) {
        result[i][j] = gateMatrix[iBit][jBit] * state[i][j];
      } else {
        result[i][j] = state[i][j];
      }
    }
  }

  return result;
}

// Two qubit gate application (worker optimized)
function applyTwoQubitGateWorker(state: number[][], gateMatrix: number[][], q1: number, q2: number, numQubits: number): number[][] {
  const dim = 1 << numQubits;
  const result = Array(dim).fill(0).map(() => Array(dim).fill(0));

  for (let i = 0; i < dim; i++) {
    for (let j = 0; j < dim; j++) {
      const iBit1 = (i >> q1) & 1;
      const iBit2 = (i >> q2) & 1;
      const jBit1 = (j >> q1) & 1;
      const jBit2 = (j >> q2) & 1;

      const inIdx = iBit1 * 2 + iBit2;
      const outIdx = jBit1 * 2 + jBit2;

      // Only apply gate when the other qubits match
      const iOther = i & ~((1 << q1) | (1 << q2));
      const jOther = j & ~((1 << q1) | (1 << q2));

      if (iOther === jOther) {
        result[i][j] = gateMatrix[outIdx][inIdx] * state[i][j];
      } else {
        result[i][j] = state[i][j];
      }
    }
  }

  return result;
}

// Create identity state for initialization
function createIdentityState(numQubits: number): number[][] {
  const dim = 1 << numQubits;
  const state = Array(dim).fill(0).map(() => Array(dim).fill(0));
  state[0][0] = 1; // |00...0⟩ state
  return state;
}

// Partial trace for reduced density matrices
function partialTraceWorker(state: number[][], qubitIndex: number, numQubits: number): any {
  const dim = 1 << numQubits;
  const reducedDim = 1 << (numQubits - 1);
  const reducedState = Array(reducedDim).fill(0).map(() => Array(reducedDim).fill(0));

  for (let i = 0; i < reducedDim; i++) {
    for (let j = 0; j < reducedDim; j++) {
      for (let k = 0; k < 2; k++) {
        const fullI = i | (k << qubitIndex);
        const fullJ = j | (k << qubitIndex);
        reducedState[i][j] += state[fullI][fullJ];
      }
    }
  }

  // Calculate Bloch vector (simplified for real matrices)
  const x = 2 * reducedState[0][1];
  const y = 0; // Simplified - complex number support would be needed for full calculation
  const z = reducedState[0][0] - reducedState[1][1];

  return {
    matrix: reducedState,
    blochVector: { x: x || 0, y: y || 0, z: z || 0 },
    purity: reducedState[0][0] ** 2 + reducedState[1][1] ** 2 + 2 * Math.abs(reducedState[0][1]) ** 2
  };
}

export type { WorkerMessage, WorkerResponse };
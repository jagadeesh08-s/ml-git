// Circuit Operations and Gate Application WITH COMPLEX NUMBERS
// Corrected for Quantum Phase and Multi-qubit Gates

import { GATES } from './gates';
import {
  ComplexMatrix,
  Complex,
  complex,
  multiplyComplexMatrices,
  tensorProduct,
  conjugateTranspose,
  complexToRealMatrix,
  realToComplexMatrix,
  add,
  multiply
} from '../core/complex';
import { DensityMatrix, partialTrace, createInitialState, calculateBlochVector } from './densityMatrix';
import { monitoredCircuitCache, monitoredGateCache, CacheKeys } from '../cache/memory';

export interface QuantumGate {
  name: string;
  qubits: number[];
  matrix?: number[][] | ComplexMatrix | ((angle: number) => number[][]) | ((angle: number) => ComplexMatrix);
  parameters?: {
    angle?: number;
    phi?: number;
    theta?: number;
    [key: string]: any;
  };
  position?: number;
}

// Helper to Convert Inputs to ComplexMatrix
const ensureComplexMatrix = (input: number[][] | ComplexMatrix): ComplexMatrix => {
  if (!input || !Array.isArray(input)) return [[complex(0, 0)]];

  if (input.length > 0 && Array.isArray(input[0]) && typeof input[0][0] === 'object' && 'real' in input[0][0]) {
    return input as ComplexMatrix;
  }

  return realToComplexMatrix(input as number[][]);
};

export interface QuantumCircuit {
  numQubits: number;
  gates: QuantumGate[];
}

// Create initial state |00...0⟩ as Density Matrix (Complex)
const createInitialStateComplex = (numQubits: number): ComplexMatrix => {
  const dim = 1 << numQubits;
  const state: ComplexMatrix = Array(dim).fill(0).map(() => Array(dim).fill(complex(0, 0)));
  state[0][0] = complex(1, 0); // |0...0⟩⟨0...0|
  return state;
};

// Apply a gate to the quantum state (Complex Engine)
export const applyGate = (state: number[][] | ComplexMatrix, gate: QuantumGate, numQubits: number): ComplexMatrix => {
  let outputState = ensureComplexMatrix(state);

  // Validation
  if (!gate || !gate.name) return outputState;

  // Get Gate Matrix (Complex)
  let gateMatrix: ComplexMatrix | undefined;

  try {
    // 1. Check for parameterized matrix function in gate definition
    if (typeof gate.matrix === 'function') {
      // This is usually defining a real matrix in the old code, strict check needed
      // But GATES in gates.ts has complex definitions if we use GATES[name]
    }

    // 2. Use Standard GATES definition (Complex)
    const standardGate = GATES[gate.name as keyof typeof GATES];
    if (standardGate) {
      if (typeof standardGate === 'function') {
        // Parameterized
        const angle = gate.parameters?.angle ?? gate.parameters?.phi ?? Math.PI / 2;
        // The function in GATES returns ComplexMatrix
        // @ts-ignore
        gateMatrix = standardGate(angle);
      } else {
        // Constant
        gateMatrix = standardGate as ComplexMatrix;
      }
    } else if (gate.matrix && Array.isArray(gate.matrix) && !Array.isArray(gate.matrix[0])) {
      // It might be a flat array or something, ignore
    } else if (gate.matrix) {
      // Custom matrix provided in gate object
      if (typeof gate.matrix === 'function') {
        const angle = gate.parameters?.angle ?? 0;
        // @ts-ignore
        gateMatrix = ensureComplexMatrix(gate.matrix(angle));
      } else {
        gateMatrix = ensureComplexMatrix(gate.matrix as any);
      }
    }
  } catch (e) {
    console.error(`Error resolving matrix for ${gate.name}`, e);
  }

  if (!gateMatrix) return outputState;

  // Apply Gate
  try {
    if (gate.qubits.length === 1) {
      return applySingleQubitGateComplex(outputState, gateMatrix, gate.qubits[0], numQubits);
    } else if (gate.qubits.length === 2) {
      return applyTwoQubitGateComplex(outputState, gateMatrix, gate.qubits[0], gate.qubits[1], numQubits);
    } else if (gate.qubits.length === 3) {
      return applyThreeQubitGateComplex(outputState, gateMatrix, gate.qubits[0], gate.qubits[1], gate.qubits[2], numQubits);
    }
  } catch (e) {
    console.error(`Error applying gate ${gate.name}`, e);
  }

  return outputState;
};

const applySingleQubitGateComplex = (state: ComplexMatrix, gate: ComplexMatrix, qubit: number, numQubits: number): ComplexMatrix => {
  // Tensor Product: I ⊗ ... ⊗ U ⊗ ... ⊗ I

  let fullU: ComplexMatrix = [[complex(1, 0)]];
  // 2x2 Identity
  const I2: ComplexMatrix = [[complex(1, 0), complex(0, 0)], [complex(0, 0), complex(1, 0)]];

  // Assuming qubit 0 is MSB (First in tensor product)
  for (let i = 0; i < numQubits; i++) {
    fullU = tensorProduct(fullU, i === qubit ? gate : I2);
  }

  const U_rho = multiplyComplexMatrices(fullU, state);
  const rho_new = multiplyComplexMatrices(U_rho, conjugateTranspose(fullU));

  return rho_new;
};

const applyTwoQubitGateComplex = (state: ComplexMatrix, gate: ComplexMatrix, q1: number, q2: number, num: number): ComplexMatrix => {
  const dim = 1 << num;
  const U = Array(dim).fill(null).map((_, i) => Array(dim).fill(null).map(() => complex(0, 0)));

  for (let r = 0; r < dim; r++) {
    // For each basis state |r>, find what it maps to.
    // r in binary has bits at q1 and q2.
    // Extract the 2-bit state |b1 b2>
    const b1 = (r >> (num - 1 - q1)) & 1; // Assuming q0 is MSB
    const b2 = (r >> (num - 1 - q2)) & 1;

    const inIdx = b1 * 2 + b2; // MSB is q1?
    // We need to match the gate matrix convention.
    // Usually CNOT matrix is [1 0 0 0; 0 1 0 0; 0 0 0 1; 0 0 1 0]
    // Where input is |00> |01> |10> |11> (control target)
    // So if q1 is control, b1 is first bit.
    // Correct.

    for (let outIdx = 0; outIdx < 4; outIdx++) {
      const val = gate[outIdx][inIdx]; // Complex value
      if (Math.abs(val.real) < 1e-10 && Math.abs(val.imag) < 1e-10) continue;

      // Construct the output full state index 'c'
      const out_b1 = (outIdx >> 1) & 1;
      const out_b2 = outIdx & 1;

      let c = r;
      c &= ~(1 << (num - 1 - q1));
      c &= ~(1 << (num - 1 - q2));
      c |= (out_b1 << (num - 1 - q1));
      c |= (out_b2 << (num - 1 - q2));

      U[c][r] = val;
    }
  }

  const U_rho = multiplyComplexMatrices(U, state);
  return multiplyComplexMatrices(U_rho, conjugateTranspose(U));
};

const applyThreeQubitGateComplex = (state: ComplexMatrix, gate: ComplexMatrix, q1: number, q2: number, q3: number, num: number): ComplexMatrix => {
  const dim = 1 << num;
  const U = Array(dim).fill(null).map((_, i) => Array(dim).fill(null).map(() => complex(0, 0)));

  for (let r = 0; r < dim; r++) {
    const b1 = (r >> (num - 1 - q1)) & 1;
    const b2 = (r >> (num - 1 - q2)) & 1;
    const b3 = (r >> (num - 1 - q3)) & 1;

    const inIdx = b1 * 4 + b2 * 2 + b3;

    for (let outIdx = 0; outIdx < 8; outIdx++) {
      const val = gate[outIdx][inIdx];
      if (Math.abs(val.real) < 1e-10 && Math.abs(val.imag) < 1e-10) continue;

      const out_b1 = (outIdx >> 2) & 1;
      const out_b2 = (outIdx >> 1) & 1;
      const out_b3 = outIdx & 1;

      let c = r;
      c &= ~(1 << (num - 1 - q1));
      c &= ~(1 << (num - 1 - q2));
      c &= ~(1 << (num - 1 - q3));

      c |= (out_b1 << (num - 1 - q1));
      c |= (out_b2 << (num - 1 - q2));
      c |= (out_b3 << (num - 1 - q3));

      U[c][r] = val;
    }
  }

  const U_rho = multiplyComplexMatrices(U, state);
  return multiplyComplexMatrices(U_rho, conjugateTranspose(U));
};

// Simulate Circuit
export const simulateCircuit = (
  circuit: QuantumCircuit,
  initialState?: number[][] | string | ComplexMatrix
): {
  statevector: number[][] | ComplexMatrix;
  probabilities: number[];
  densityMatrix: number[][] | ComplexMatrix;
  reducedStates: DensityMatrix[];
  error?: string;
} => {
  try {
    const { numQubits, gates } = circuit;

    // Initialize State (Complex Density Matrix)
    let state: ComplexMatrix;

    if (initialState) {
      // Handle custom initial state if needed
      if (typeof initialState === 'string') {
        // Basic support for string state if cached or parsed
        state = createInitialStateComplex(numQubits);
      } else {
        state = ensureComplexMatrix(initialState as any);
      }
    } else {
      state = createInitialStateComplex(numQubits);
    }

    // Apply Gates
    for (const gate of gates) {
      state = applyGate(state, gate, numQubits);
    }

    // Results
    const densityMatrix = state;
    // Probabilities (diagonals)
    const probabilities: number[] = [];
    for (let i = 0; i < state.length; i++) {
      probabilities.push(state[i][i].real);
    }

    // Reduced States
    const reducedStates: DensityMatrix[] = [];
    for (let i = 0; i < numQubits; i++) {
      // @ts-ignore
      reducedStates.push(partialTrace(state, i, numQubits));
    }

    return {
      statevector: state, // Returning ComplexMatrix
      probabilities,
      densityMatrix: state,
      reducedStates
    };

  } catch (e: any) {
    return { statevector: [], probabilities: [], densityMatrix: [], reducedStates: [], error: e.message };
  }
};

// Helper for Gate Output State identifying (Ket Notation)
export const computeGateOutputState = (
  gate: QuantumGate,
  inputState: any,
  numQubits: number
): any => {
  // Use full simulation for single step to get accurate bloch vector
  // We compute gate applied to |0> for the gate icon usually

  let rhoInput: ComplexMatrix;
  rhoInput = [[complex(1, 0), complex(0, 0)], [complex(0, 0), complex(0, 0)]]; // Default |0>

  // Apply Gate
  const rhoOutput = applyGate(rhoInput, gate, 1);

  // Calculate Bloch
  const bloch = calculateBlochVector(rhoOutput);

  // Identify
  return identifyQuantumStateFromBloch(bloch, rhoOutput);
};


const identifyQuantumStateFromBloch = (
  bloch: { x: number; y: number; z: number },
  rho: ComplexMatrix | number[][]
): string => {
  // Check Basics
  if (bloch.z > 0.9) return '|0⟩';
  if (bloch.z < -0.9) return '|1⟩';
  if (bloch.x > 0.9) return '|+⟩';
  if (bloch.x < -0.9) return '|-⟩';
  if (bloch.y > 0.9) return '|+i⟩'; // Correct Y+
  if (bloch.y < -0.9) return '|-i⟩'; // Correct Y-

  return `[${bloch.x.toFixed(2)}, ${bloch.y.toFixed(2)}, ${bloch.z.toFixed(2)}]`;
};

export const simulateCircuitWithStates = (circuit: QuantumCircuit, initialState?: any, initialKetStates?: string[]): any => {
  return simulateCircuit(circuit);
};

export { createInitialState };

// Backward compatibility exports
export const EXAMPLE_CIRCUITS: any[] = [];
export const testGateOutputs = () => { console.log("Gate testing moved to unit tests"); };


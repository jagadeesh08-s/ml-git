// Validation Helper Functions
// Utility functions for validating quantum states, circuits, and other data

import type { Complex } from '../core/complex';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Validate quantum state vector
export function validateQuantumState(state: number[] | Complex[], numQubits?: number): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!Array.isArray(state)) {
    result.isValid = false;
    result.errors.push('State must be an array');
    return result;
  }

  if (state.length === 0) {
    result.isValid = false;
    result.errors.push('State cannot be empty');
    return result;
  }

  // Check if it's a power of 2 (valid for quantum states)
  const log2 = Math.log2(state.length);
  if (!Number.isInteger(log2)) {
    result.isValid = false;
    result.errors.push('State length must be a power of 2');
    return result;
  }

  if (numQubits && state.length !== Math.pow(2, numQubits)) {
    result.isValid = false;
    result.errors.push(`State length ${state.length} does not match ${numQubits} qubits (expected ${Math.pow(2, numQubits)})`);
    return result;
  }

  // Check normalization
  let normSquared = 0;
  for (const amplitude of state) {
    if (typeof amplitude === 'number') {
      normSquared += amplitude * amplitude;
    } else if (amplitude && typeof amplitude.real === 'number' && typeof amplitude.imag === 'number') {
      normSquared += amplitude.real * amplitude.real + amplitude.imag * amplitude.imag;
    } else {
      result.isValid = false;
      result.errors.push('Invalid amplitude format');
      return result;
    }
  }

  if (Math.abs(normSquared - 1) > 1e-10) {
    result.warnings.push(`State is not normalized (norm² = ${normSquared.toFixed(6)}, expected 1.0)`);
  }

  return result;
}

// Validate quantum circuit
export function validateCircuit(circuit: any): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!circuit || typeof circuit !== 'object') {
    result.isValid = false;
    result.errors.push('Circuit must be an object');
    return result;
  }

  if (!circuit.numQubits || !Number.isInteger(circuit.numQubits) || circuit.numQubits < 1) {
    result.isValid = false;
    result.errors.push('Circuit must have valid numQubits (positive integer)');
    return result;
  }

  if (!Array.isArray(circuit.gates)) {
    result.isValid = false;
    result.errors.push('Circuit gates must be an array');
    return result;
  }

  // Validate each gate
  circuit.gates.forEach((gate: any, index: number) => {
    const gateValidation = validateGate(gate, circuit.numQubits);
    if (!gateValidation.isValid) {
      result.isValid = false;
      result.errors.push(`Gate ${index}: ${gateValidation.errors.join(', ')}`);
    }
    gateValidation.warnings.forEach(warning =>
      result.warnings.push(`Gate ${index}: ${warning}`)
    );
  });

  return result;
}

// Validate quantum gate
export function validateGate(gate: any, numQubits: number): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!gate || typeof gate !== 'object') {
    result.isValid = false;
    result.errors.push('Gate must be an object');
    return result;
  }

  if (!gate.name || typeof gate.name !== 'string') {
    result.isValid = false;
    result.errors.push('Gate must have a valid name');
    return result;
  }

  if (!Array.isArray(gate.qubits) || gate.qubits.length === 0) {
    result.isValid = false;
    result.errors.push('Gate must have qubits array');
    return result;
  }

  // Validate qubit indices
  for (const qubit of gate.qubits) {
    if (!Number.isInteger(qubit) || qubit < 0 || qubit >= numQubits) {
      result.isValid = false;
      result.errors.push(`Invalid qubit index ${qubit} for ${numQubits}-qubit system`);
      return result;
    }
  }

  // Check for duplicate qubits in same gate
  const uniqueQubits = new Set(gate.qubits);
  if (uniqueQubits.size !== gate.qubits.length) {
    result.isValid = false;
    result.errors.push('Gate cannot have duplicate qubit indices');
    return result;
  }

  return result;
}

// Validate complex number
export function isValidComplexNumber(value: any): boolean {
  if (typeof value === 'number' && !isNaN(value)) {
    return true;
  }

  if (value && typeof value.real === 'number' && typeof value.imag === 'number') {
    return !isNaN(value.real) && !isNaN(value.imag);
  }

  return false;
}

// Validate matrix
export function isValidMatrix(matrix: any): boolean {
  if (!Array.isArray(matrix) || matrix.length === 0) {
    return false;
  }

  const firstRowLength = matrix[0].length;
  if (!firstRowLength) {
    return false;
  }

  // Check all rows have same length
  for (const row of matrix) {
    if (!Array.isArray(row) || row.length !== firstRowLength) {
      return false;
    }

    // Check all elements are valid numbers
    for (const element of row) {
      if (!isValidComplexNumber(element)) {
        return false;
      }
    }
  }

  return true;
}

// Validate ket state string
export function validateKetStateString(stateStr: string): ValidationResult {
  const result: ValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  if (!stateStr || typeof stateStr !== 'string') {
    result.isValid = false;
    result.errors.push('State must be a non-empty string');
    return result;
  }

  // Basic format checks
  const braKetMatch = stateStr.match(/\|[^⟩]*⟩/g);
  const vectorMatch = stateStr.match(/\[.*\]/);

  if (!braKetMatch && !vectorMatch) {
    result.isValid = false;
    result.errors.push('State must be in bra-ket notation |ψ⟩ or vector notation [a,b,...]');
    return result;
  }

  return result;
}
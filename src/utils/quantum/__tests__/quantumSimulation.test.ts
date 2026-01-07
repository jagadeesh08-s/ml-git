// Comprehensive test suite for quantum simulation utilities
// Ensures accuracy and reliability of quantum computations

import {
  simulateCircuit,
  applyGate,
  computeGateOutputState,
  EXAMPLE_CIRCUITS,
  testGateOutputs
} from '../quantumSimulation';
import { PAULI, getGateMatrixReal } from '../gates';
import { matrixMultiply, tensorProduct } from '../../core/matrixOperations';

describe('Quantum Simulation Engine', () => {
  describe('Basic Gate Operations', () => {
    it('should apply identity gate correctly', () => {
      const state = [[1, 0], [0, 0]]; // |0⟩ state
      const result = applyGate(state, { name: 'I', qubits: [0] }, 1);

      expect(result[0][0]).toBeCloseTo(1, 5);
      expect(result[1][1]).toBeCloseTo(0, 5);
    });

    it('should apply Pauli-X gate correctly', () => {
      const state = [[1, 0], [0, 0]]; // |0⟩⟨0| density matrix
      const result = applyGate(state, { name: 'X', qubits: [0] }, 1);

      // X|0⟩ = |1⟩, so density matrix should be |1⟩⟨1| = [[0,0],[0,1]]
      expect(result[0][0]).toBeCloseTo(0, 5);
      expect(result[0][1]).toBeCloseTo(0, 5);
      expect(result[1][0]).toBeCloseTo(0, 5);
      expect(result[1][1]).toBeCloseTo(1, 5);
    });

    it('should apply Hadamard gate correctly', () => {
      const state = [[1, 0], [0, 0]]; // |0⟩⟨0| density matrix
      const result = applyGate(state, { name: 'H', qubits: [0] }, 1);

      // H|0⟩ = (|0⟩ + |1⟩)/√2, so density matrix = |ψ⟩⟨ψ| = [[0.5, 0.5], [0.5, 0.5]]
      expect(result[0][0]).toBeCloseTo(0.5, 5);
      expect(result[0][1]).toBeCloseTo(0.5, 5);
      expect(result[1][0]).toBeCloseTo(0.5, 5);
      expect(result[1][1]).toBeCloseTo(0.5, 5);
    });

    it('should handle parameterized gates', () => {
      const state = [[1, 0], [0, 0]]; // |0⟩⟨0| density matrix
      const result = applyGate(state, {
        name: 'RX',
        qubits: [0],
        parameters: { angle: Math.PI / 2 }
      }, 1);

      // RX(π/2)|0⟩ = cos(π/4)|0⟩ - sin(π/4)|1⟩
      // Density matrix = [[cos²(π/4), -cos(π/4)sin(π/4)], [-cos(π/4)sin(π/4), sin²(π/4)]]
      // = [[0.5, -0.5], [-0.5, 0.5]]
      expect(result[0][0]).toBeCloseTo(0.5, 5);
      expect(result[0][1]).toBeCloseTo(-0.5, 5);
      expect(result[1][0]).toBeCloseTo(-0.5, 5);
      expect(result[1][1]).toBeCloseTo(0.5, 5);
    });
  });

  describe('Multi-Qubit Operations', () => {
    it('should apply CNOT gate correctly', () => {
      const state = [[0.5, 0.5, 0, 0], [0.5, 0.5, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]; // |+0⟩ state
      const result = applyGate(state, { name: 'CNOT', qubits: [0, 1] }, 2);

      // CNOT|+0⟩ should give |+0⟩ (no change since control is in superposition)
      expect(result[0][0]).toBeCloseTo(0.5, 5);
      expect(result[1][1]).toBeCloseTo(0.5, 5);
    });

    it('should handle Bell state preparation', () => {
      const circuit = EXAMPLE_CIRCUITS['Bell State'];
      const result = simulateCircuit(circuit);

      expect(result.statevector.length).toBe(4);
      expect(result.probabilities.length).toBe(4);

      // Bell state should have equal probabilities for |00⟩ and |11⟩
      expect(result.probabilities[0]).toBeCloseTo(0.5, 3); // |00⟩
      expect(result.probabilities[3]).toBeCloseTo(0.5, 3); // |11⟩
      expect(result.probabilities[1]).toBeCloseTo(0, 3);   // |01⟩
      expect(result.probabilities[2]).toBeCloseTo(0, 3);   // |10⟩
    });
  });

  describe('Circuit Simulation', () => {
    it('should simulate simple circuits correctly', () => {
      const circuit = {
        numQubits: 1,
        gates: [{ name: 'X', qubits: [0] }]
      };

      const result = simulateCircuit(circuit);

      expect(result.probabilities[1]).toBeCloseTo(1, 5); // Should be in |1⟩ state
      expect(result.probabilities[0]).toBeCloseTo(0, 5);
    });

    it('should handle complex multi-gate circuits', () => {
      const circuit = {
        numQubits: 2,
        gates: [
          { name: 'H', qubits: [0] },
          { name: 'X', qubits: [1] },
          { name: 'CNOT', qubits: [0, 1] }
        ]
      };

      const result = simulateCircuit(circuit);

      // This creates a Bell state equivalent to |01⟩ + |10⟩
      expect(result.probabilities[1]).toBeCloseTo(0.5, 3); // |01⟩
      expect(result.probabilities[2]).toBeCloseTo(0.5, 3); // |10⟩
    });

    it('should maintain normalization', () => {
      const circuit = EXAMPLE_CIRCUITS['Bell State'];
      const result = simulateCircuit(circuit);

      const totalProbability = result.probabilities.reduce((sum, p) => sum + p, 0);
      expect(totalProbability).toBeCloseTo(1, 10);
    });
  });

  describe('Gate Output Computation', () => {
    it('should compute correct gate outputs', () => {
      const testResults = testGateOutputs();

      // Debug: print failing tests
      testResults.forEach(result => {
        if (!result.pass) {
          console.log('Failing test:', result);
        }
      });

      // All tests should pass
      testResults.forEach(result => {
        expect(result.pass).toBe(true);
      });
    });

    it('should handle state recognition correctly', () => {
      // Test |0⟩ state recognition
      const output1 = computeGateOutputState(
        { name: 'I', qubits: [0] },
        '|0⟩',
        1
      );
      expect(output1).toBe('|0⟩');

      // Test |1⟩ state recognition
      const output2 = computeGateOutputState(
        { name: 'X', qubits: [0] },
        '|0⟩',
        1
      );
      expect(output2).toBe('|1⟩');

      // Test superposition state
      const output3 = computeGateOutputState(
        { name: 'H', qubits: [0] },
        '|0⟩',
        1
      );
      expect(output3).toBe('|+⟩');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid gate names gracefully', () => {
      const state = [[1, 0], [0, 0]];
      const result = applyGate(state, { name: 'INVALID_GATE', qubits: [0] }, 1);

      // Should return original state unchanged
      expect(result).toEqual(state);
    });

    it('should handle invalid qubit indices', () => {
      const state = [[1, 0], [0, 0]];
      const result = applyGate(state, { name: 'X', qubits: [5] }, 1);

      // Should return original state unchanged
      expect(result).toEqual(state);
    });

    it('should handle malformed circuits', () => {
      const result = simulateCircuit({ numQubits: 0, gates: [] });

      expect(result.error).toBeDefined();
      expect(result.statevector.length).toBe(0);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large circuits efficiently', () => {
      const circuit = {
        numQubits: 3,
        gates: Array(10).fill(null).map((_, i) => ({
          name: 'H',
          qubits: [i % 3]
        }))
      };

      const startTime = Date.now();
      const result = simulateCircuit(circuit);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.probabilities.length).toBe(8); // 2^3 = 8 states
    });

    it('should cache repeated computations', () => {
      const circuit = EXAMPLE_CIRCUITS['Bell State'];

      const startTime1 = Date.now();
      simulateCircuit(circuit);
      const endTime1 = Date.now();

      const startTime2 = Date.now();
      simulateCircuit(circuit); // Should use cache
      const endTime2 = Date.now();

      // Second run should be significantly faster
      expect(endTime2 - startTime2).toBeLessThan(endTime1 - startTime1);
    });
  });

  describe('Mathematical Correctness', () => {
    it('should preserve unitarity', () => {
      const gateMatrix = getGateMatrixReal('H');
      expect(gateMatrix).toBeDefined();

      if (gateMatrix) {
        // U†U = I for unitary matrices
        const conjugateTranspose = transpose(gateMatrix);
        const product = matrixMultiply(conjugateTranspose, gateMatrix);

        // Should be approximately identity
        expect(product[0][0]).toBeCloseTo(1, 10);
        expect(product[0][1]).toBeCloseTo(0, 10);
        expect(product[1][0]).toBeCloseTo(0, 10);
        expect(product[1][1]).toBeCloseTo(1, 10);
      }
    });

    it('should handle tensor products correctly', () => {
      const A = PAULI.X;
      const B = PAULI.Z;
      const result = tensorProduct(A, B);

      expect(result.length).toBe(4);
      expect(result[0].length).toBe(4);

      // X ⊗ Z should have specific structure
      expect(result[0][3]).toBe(1);
      expect(result[1][2]).toBe(-1);
      expect(result[2][1]).toBe(1);
      expect(result[3][0]).toBe(-1);
    });
  });
});

// Helper function for matrix transpose (used in tests)
function transpose(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result: number[][] = Array(cols).fill(0).map(() => Array(rows).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = matrix[i][j];
    }
  }

  return result;
}
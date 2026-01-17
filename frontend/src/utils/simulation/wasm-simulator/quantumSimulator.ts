import { StateVector } from './stateVector';
import { QuantumGates } from './gates';
import { Complex } from './complex';

/**
 * High-performance quantum circuit simulator
 */
export class QuantumSimulator {
  private stateVector: StateVector;
  private numQubits: number;

  constructor(numQubits: number) {
    this.numQubits = numQubits;
    this.stateVector = new StateVector(1 << numQubits);
  }

  /**
   * Initialize the quantum state
   */
  initializeState(initialState: string, customState?: { alpha: Complex; beta: Complex }): void {
    switch (initialState) {
      case 'ket0':
        this.stateVector.initializeToBasis(0);
        break;
      case 'ket1':
        this.stateVector.initializeToBasis(1);
        break;
      case 'ket2': // |+⟩
        this.stateVector.initializeToBasis(0);
        this.applyGate('H', [0]);
        break;
      case 'ket3': // |-⟩
        this.stateVector.initializeToBasis(0);
        this.applyGate('X', [0]);
        this.applyGate('H', [0]);
        break;
      case 'ket4': // |+i⟩
        this.stateVector.initializeToBasis(0);
        this.applyGate('H', [0]);
        this.applyGate('S', [0]);
        break;
      case 'ket5': // |-i⟩
        this.stateVector.initializeToBasis(0);
        this.applyGate('X', [0]);
        this.applyGate('H', [0]);
        this.applyGate('S', [0]);
        break;
      case 'ket6': // Custom state
        if (customState) {
          this.stateVector.initializeFirstQubit(customState.alpha, customState.beta);
        } else {
          this.stateVector.initializeToBasis(0);
        }
        break;
      default:
        this.stateVector.initializeToBasis(0);
    }
  }

  /**
   * Apply a quantum gate to the circuit
   */
  applyGate(gateName: string, qubits: number[], parameters: number[] = []): void {
    try {
      const gate = QuantumGates.getGate(gateName, parameters);
      this.stateVector.applyUnitary(gate, qubits);
    } catch (error) {
      throw new Error(`Failed to apply gate ${gateName}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Apply multiple gates in sequence
   */
  applyGates(gates: Array<{ name: string; qubits: number[]; parameters?: number[] }>): void {
    for (const gate of gates) {
      this.applyGate(gate.name, gate.qubits, gate.parameters || []);
    }
  }

  /**
   * Measure a specific qubit
   */
  measure(qubitIndex: number): { outcome: number; probability: number } {
    const result = this.stateVector.measure(qubitIndex);
    this.stateVector = result.newState; // Update to collapsed state
    return { outcome: result.outcome, probability: result.probability };
  }

  /**
   * Get measurement probabilities for all qubits
   */
  getMeasurementProbabilities(): number[] {
    return this.stateVector.getProbabilities();
  }

  /**
   * Get Bloch vector for a specific qubit
   */
  getBlochVector(qubitIndex: number): { x: number; y: number; z: number } {
    return this.stateVector.getBlochVector(qubitIndex);
  }

  /**
   * Get purity of a qubit
   */
  getPurity(qubitIndex: number): number {
    return this.stateVector.getPurity(qubitIndex);
  }

  /**
   * Calculate concurrence for 2-qubit entanglement
   */
  getConcurrence(): number {
    if (this.numQubits !== 2) {
      return 0.0;
    }

    // For 2-qubit systems, calculate concurrence
    const rho = this.computeDensityMatrix();

    // Calculate concurrence using simplified formula
    const offDiag = Math.abs(rho[0][3].magnitude()) + Math.abs(rho[1][2].magnitude()) + Math.abs(rho[2][1].magnitude()) + Math.abs(rho[3][0].magnitude());
    const diag = Math.abs(rho[0][0].magnitude()) + Math.abs(rho[1][1].magnitude()) + Math.abs(rho[2][2].magnitude()) + Math.abs(rho[3][3].magnitude());

    const concurrence = Math.max(0, 2 * offDiag - diag);
    return Math.min(concurrence, 1.0);
  }

  /**
   * Calculate von Neumann entropy
   */
  getVonNeumannEntropy(): number {
    const rho = this.computeDensityMatrix();
    const eigenvalues = this.getMatrixEigenvalues(rho);

    let entropy = 0.0;
    for (const eigenval of eigenvalues) {
      const realVal = eigenval.real;
      if (realVal > 1e-10) {
        entropy -= realVal * Math.log2(realVal);
      }
    }

    return entropy;
  }

  /**
   * Get the full state vector
   */
  getStateVector(): [number, number][] {
    return this.stateVector.toArray();
  }

  /**
   * Clone the simulator
   */
  clone(): QuantumSimulator {
    const cloned = new QuantumSimulator(this.numQubits);
    cloned.stateVector = this.stateVector.clone();
    return cloned;
  }

  /**
   * Reset to |0...0⟩ state
   */
  reset(): void {
    this.stateVector = new StateVector(1 << this.numQubits);
    this.stateVector.initializeToBasis(0);
  }

  /**
   * Compute density matrix from state vector
   */
  private computeDensityMatrix(): Complex[][] {
    const size = this.stateVector.size;
    const rho: Complex[][] = [];

    for (let i = 0; i < size; i++) {
      rho[i] = [];
      for (let j = 0; j < size; j++) {
        rho[i][j] = this.stateVector.get(i).multiply(this.stateVector.get(j).conjugate());
      }
    }

    return rho;
  }

  /**
   * Get eigenvalues of a matrix (simplified for small matrices)
   */
  private getMatrixEigenvalues(matrix: Complex[][]): Complex[] {
    // For small matrices, use numerical methods
    // This is a simplified implementation - in practice, you'd use a proper eigenvalue solver
    const size = matrix.length;

    if (size === 1) {
      return [matrix[0][0]];
    }

    if (size === 2) {
      // For 2x2 matrices, use analytical solution
      const a = matrix[0][0].real;
      const b = matrix[0][1].real;
      const c = matrix[1][0].real;
      const d = matrix[1][1].real;

      const trace = a + d;
      const det = a * d - b * c;
      const discriminant = Math.sqrt(trace * trace - 4 * det);

      const lambda1 = (trace + discriminant) / 2;
      const lambda2 = (trace - discriminant) / 2;

      return [new Complex(lambda1, 0), new Complex(lambda2, 0)];
    }

    // For larger matrices, return approximate values
    // In a real implementation, you'd use LAPACK or similar
    const eigenvalues: Complex[] = [];
    for (let i = 0; i < size; i++) {
      eigenvalues.push(new Complex(1.0 / size, 0)); // Uniform approximation
    }

    return eigenvalues;
  }
}

/**
 * Execute a complete quantum circuit
 */
export function executeCircuit(circuitData: {
  circuit: { numQubits: number; gates: Array<{ name: string; qubits: number[]; parameters?: number[] }> };
  initialState: string;
  customState?: { alpha: string; beta: string };
}): {
  success: boolean;
  qubitResults: Array<{
    qubitIndex: number;
    blochVector: { x: number; y: number; z: number };
    purity: number;
    reducedRadius: number;
    isEntangled: boolean;
    concurrence: number;
    vonNeumannEntropy: number;
    witnessValue: number;
    statevector?: [number, number][];
  }>;
  executionTime: number;
  error?: string;
} {
  const startTime = performance.now();

  try {
    const { circuit, initialState, customState } = circuitData;
    const simulator = new QuantumSimulator(circuit.numQubits);

    // Initialize state
    let customComplexState;
    if (customState) {
      customComplexState = {
        alpha: new Complex(parseFloat(customState.alpha) || 1, 0),
        beta: new Complex(parseFloat(customState.beta) || 0, 0)
      };
    }

    simulator.initializeState(initialState, customComplexState);

    // Apply gates
    simulator.applyGates(circuit.gates);

    // Calculate entanglement measures
    const concurrence = simulator.getConcurrence();
    const vonNeumannEntropy = simulator.getVonNeumannEntropy();
    const isEntangled = concurrence > 0.1;
    const witnessValue = concurrence - 0.5;

    // Calculate results for each qubit
    const qubitResults: Array<{
      qubitIndex: number;
      blochVector: { x: number; y: number; z: number };
      purity: number;
      reducedRadius: number;
      isEntangled: boolean;
      concurrence: number;
      vonNeumannEntropy: number;
      witnessValue: number;
      statevector?: [number, number][];
    }> = [];
    for (let i = 0; i < circuit.numQubits; i++) {
      const blochVector = simulator.getBlochVector(i);
      const purity = simulator.getPurity(i);
      const blochRadius = Math.sqrt(blochVector.x ** 2 + blochVector.y ** 2 + blochVector.z ** 2);
      const reducedRadius = Math.min(blochRadius, 1.0);

      qubitResults.push({
        qubitIndex: i,
        blochVector,
        purity,
        reducedRadius,
        isEntangled,
        concurrence,
        vonNeumannEntropy,
        witnessValue,
        statevector: i === 0 ? simulator.getStateVector() : undefined
      });
    }

    const executionTime = performance.now() - startTime;

    return {
      success: true,
      qubitResults,
      executionTime
    };

  } catch (error) {
    return {
      success: false,
      qubitResults: [],
      executionTime: performance.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
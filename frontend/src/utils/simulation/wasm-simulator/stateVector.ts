import { Complex } from './complex';

/**
 * Quantum state vector implementation
 */
export class StateVector {
  private amplitudes: Complex[];

  constructor(size: number) {
    this.amplitudes = new Array(size).fill(null).map(() => new Complex(0, 0));
  }

  static fromArray(amplitudes: Complex[]): StateVector {
    const sv = new StateVector(amplitudes.length);
    sv.amplitudes = amplitudes.map(c => c.clone());
    return sv;
  }

  static fromRealArray(reals: number[], imags: number[]): StateVector {
    if (reals.length !== imags.length) {
      throw new Error('Real and imaginary arrays must have the same length');
    }
    const amplitudes = reals.map((r, i) => new Complex(r, imags[i]));
    return StateVector.fromArray(amplitudes);
  }

  get size(): number {
    return this.amplitudes.length;
  }

  get numQubits(): number {
    return Math.log2(this.size);
  }

  get(index: number): Complex {
    if (index < 0 || index >= this.size) {
      throw new Error(`Index ${index} out of bounds for state vector of size ${this.size}`);
    }
    return this.amplitudes[index];
  }

  set(index: number, value: Complex): void {
    if (index < 0 || index >= this.size) {
      throw new Error(`Index ${index} out of bounds for state vector of size ${this.size}`);
    }
    this.amplitudes[index] = value.clone();
  }

  /**
   * Initialize to computational basis state |n⟩
   */
  initializeToBasis(n: number): void {
    if (n < 0 || n >= this.size) {
      throw new Error(`Basis state ${n} out of range for ${this.numQubits} qubits`);
    }
    this.amplitudes.fill(new Complex(0, 0));
    this.amplitudes[n] = new Complex(1, 0);
  }

  /**
   * Initialize to superposition state
   */
  initializeToSuperposition(): void {
    const amplitude = 1 / Math.sqrt(this.size);
    this.amplitudes = this.amplitudes.map(() => new Complex(amplitude, 0));
  }

  /**
   * Initialize to custom state for first qubit
   */
  initializeFirstQubit(alpha: Complex, beta: Complex): void {
    if (this.numQubits < 1) return;

    // Normalize the state
    const norm = Math.sqrt(alpha.magnitudeSquared() + beta.magnitudeSquared());
    if (norm > 0) {
      alpha = alpha.multiplyScalar(1 / norm);
      beta = beta.multiplyScalar(1 / norm);
    }

    if (this.numQubits === 1) {
      this.amplitudes[0] = alpha;
      this.amplitudes[1] = beta;
    } else {
      // For multi-qubit systems, initialize first qubit with custom state
      // and other qubits to |0⟩
      for (let i = 0; i < this.size; i++) {
        const firstQubitState = (i & 1) === 0 ? alpha : beta;
        this.amplitudes[i] = firstQubitState;
      }
    }
  }

  /**
   * Normalize the state vector
   */
  normalize(): void {
    let normSquared = 0;
    for (const amp of this.amplitudes) {
      normSquared += amp.magnitudeSquared();
    }
    const norm = Math.sqrt(normSquared);
    if (norm > 0) {
      for (let i = 0; i < this.amplitudes.length; i++) {
        this.amplitudes[i] = this.amplitudes[i].multiplyScalar(1 / norm);
      }
    }
  }

  /**
   * Apply a unitary matrix to the state vector
   */
  applyUnitary(unitary: Complex[][], targetQubits: number[]): void {
    if (targetQubits.length === 1) {
      this.applySingleQubitGate(unitary, targetQubits[0]);
    } else if (targetQubits.length === 2) {
      this.applyTwoQubitGate(unitary, targetQubits[0], targetQubits[1]);
    } else {
      throw new Error('Only 1 and 2-qubit gates are supported');
    }
  }

  private applySingleQubitGate(gate: Complex[][], qubitIndex: number): void {
    if (gate.length !== 2 || gate[0].length !== 2 || gate[1].length !== 2) {
      throw new Error('Single qubit gate must be 2x2 matrix');
    }

    const newAmplitudes = new Array(this.size).fill(null).map(() => new Complex(0, 0));

    for (let i = 0; i < this.size; i++) {
      const bit = (i >> qubitIndex) & 1;
      const otherBits = i & ~(1 << qubitIndex);

      // Apply gate to this qubit
      const amp0 = this.amplitudes[otherBits | (0 << qubitIndex)];
      const amp1 = this.amplitudes[otherBits | (1 << qubitIndex)];

      newAmplitudes[i] = gate[bit][0].multiply(amp0).add(gate[bit][1].multiply(amp1));
    }

    this.amplitudes = newAmplitudes;
  }

  private applyTwoQubitGate(gate: Complex[][], qubit1: number, qubit2: number): void {
    if (gate.length !== 4 || gate[0].length !== 4) {
      throw new Error('Two qubit gate must be 4x4 matrix');
    }

    const newAmplitudes = new Array(this.size).fill(null).map(() => new Complex(0, 0));

    for (let i = 0; i < this.size; i++) {
      const bit1 = (i >> qubit1) & 1;
      const bit2 = (i >> qubit2) & 1;
      const otherBits = i & ~(1 << qubit1) & ~(1 << qubit2);
      const stateIndex = (bit1 << 1) | bit2;

      let sum = new Complex(0, 0);
      for (let j = 0; j < 4; j++) {
        const jBit1 = (j >> 1) & 1;
        const jBit2 = j & 1;
        const jIndex = otherBits | (jBit1 << qubit1) | (jBit2 << qubit2);
        sum = sum.add(gate[stateIndex][j].multiply(this.amplitudes[jIndex]));
      }

      newAmplitudes[i] = sum;
    }

    this.amplitudes = newAmplitudes;
  }

  /**
   * Measure a qubit in computational basis
   */
  measure(qubitIndex: number): { outcome: number; probability: number; newState: StateVector } {
    let prob0 = 0;
    let prob1 = 0;

    for (let i = 0; i < this.size; i++) {
      const bit = (i >> qubitIndex) & 1;
      const magnitudeSquared = this.amplitudes[i].magnitudeSquared();
      if (bit === 0) {
        prob0 += magnitudeSquared;
      } else {
        prob1 += magnitudeSquared;
      }
    }

    const outcome = Math.random() < prob0 ? 0 : 1;
    const probability = outcome === 0 ? prob0 : prob1;

    // Create collapsed state
    const newState = new StateVector(this.size);
    const normalizationFactor = 1 / Math.sqrt(probability);

    for (let i = 0; i < this.size; i++) {
      const bit = (i >> qubitIndex) & 1;
      if (bit === outcome) {
        newState.amplitudes[i] = this.amplitudes[i].multiplyScalar(normalizationFactor);
      }
    }

    return { outcome, probability, newState };
  }

  /**
   * Get probabilities for all computational basis states
   */
  getProbabilities(): number[] {
    return this.amplitudes.map(amp => amp.magnitudeSquared());
  }

  /**
   * Clone the state vector
   */
  clone(): StateVector {
    return StateVector.fromArray(this.amplitudes);
  }

  /**
   * Convert to array format for external use
   */
  toArray(): [number, number][] {
    return this.amplitudes.map(amp => [amp.real, amp.imag]);
  }

  /**
   * Get Bloch vector for a specific qubit
   */
  getBlochVector(qubitIndex: number): { x: number; y: number; z: number } {
    if (this.numQubits === 1) {
      // Single qubit case
      const alpha = this.amplitudes[0];
      const beta = this.amplitudes[1];

      const x = 2 * (alpha.real * beta.real + alpha.imag * beta.imag);
      const y = 2 * (alpha.real * beta.imag - alpha.imag * beta.real);
      const z = alpha.magnitudeSquared() - beta.magnitudeSquared();

      return { x, y, z };
    } else {
      // Multi-qubit case - compute reduced density matrix
      const reducedDM = this.getReducedDensityMatrix(qubitIndex);
      const x = 2 * reducedDM[0][1].real;
      const y = 2 * reducedDM[0][1].imag;
      const z = reducedDM[0][0].real - reducedDM[1][1].real;

      return { x, y, z };
    }
  }

  /**
   * Get reduced density matrix for a qubit
   */
  private getReducedDensityMatrix(qubitIndex: number): Complex[][] {
    const dm = [[new Complex(0, 0), new Complex(0, 0)], [new Complex(0, 0), new Complex(0, 0)]];

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const iBit = (i >> qubitIndex) & 1;
        const jBit = (j >> qubitIndex) & 1;

        if (iBit === jBit) {
          const otherBits = i & ~(1 << qubitIndex);
          if (otherBits === (j & ~(1 << qubitIndex))) {
            dm[iBit][jBit] = dm[iBit][jBit].add(this.amplitudes[i].multiply(this.amplitudes[j].conjugate()));
          }
        }
      }
    }

    return dm;
  }

  /**
   * Calculate purity of a qubit (1.0 for pure states, < 1.0 for mixed states)
   */
  getPurity(qubitIndex: number): number {
    if (this.numQubits === 1) {
      return 1.0; // Pure state
    }

    const reducedDM = this.getReducedDensityMatrix(qubitIndex);
    let traceSquared = 0;

    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        traceSquared += reducedDM[i][j].multiply(reducedDM[j][i]).magnitudeSquared();
      }
    }

    return traceSquared;
  }
}
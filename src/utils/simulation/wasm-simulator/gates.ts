import { Complex } from './complex';

/**
 * Quantum gate definitions and implementations
 */
export class QuantumGates {
  // Pauli gates
  static readonly I = [
    [new Complex(1, 0), new Complex(0, 0)],
    [new Complex(0, 0), new Complex(1, 0)]
  ];

  static readonly X = [
    [new Complex(0, 0), new Complex(1, 0)],
    [new Complex(1, 0), new Complex(0, 0)]
  ];

  static readonly Y = [
    [new Complex(0, 0), new Complex(0, -1)],
    [new Complex(0, 1), new Complex(0, 0)]
  ];

  static readonly Z = [
    [new Complex(1, 0), new Complex(0, 0)],
    [new Complex(0, 0), new Complex(-1, 0)]
  ];

  // Hadamard gate
  static readonly H = [
    [new Complex(1/Math.sqrt(2), 0), new Complex(1/Math.sqrt(2), 0)],
    [new Complex(1/Math.sqrt(2), 0), new Complex(-1/Math.sqrt(2), 0)]
  ];

  // Phase gates
  static readonly S = [
    [new Complex(1, 0), new Complex(0, 0)],
    [new Complex(0, 0), new Complex(0, 1)]
  ];

  static readonly T = [
    [new Complex(1, 0), new Complex(0, 0)],
    [new Complex(0, 0), new Complex(Math.cos(Math.PI/4), Math.sin(Math.PI/4))]
  ];

  // Rotation gates (parameterized)
  static rx(theta: number): Complex[][] {
    const cos = Math.cos(theta/2);
    const sin = Math.sin(theta/2);
    return [
      [new Complex(cos, 0), new Complex(0, -sin)],
      [new Complex(0, -sin), new Complex(cos, 0)]
    ];
  }

  static ry(theta: number): Complex[][] {
    const cos = Math.cos(theta/2);
    const sin = Math.sin(theta/2);
    return [
      [new Complex(cos, 0), new Complex(-sin, 0)],
      [new Complex(sin, 0), new Complex(cos, 0)]
    ];
  }

  static rz(theta: number): Complex[][] {
    const phase = theta / 2;
    return [
      [new Complex(Math.cos(-phase), Math.sin(-phase)), new Complex(0, 0)],
      [new Complex(0, 0), new Complex(Math.cos(phase), Math.sin(phase))]
    ];
  }

  // Two-qubit gates
  static readonly CNOT = [
    [new Complex(1, 0), new Complex(0, 0), new Complex(0, 0), new Complex(0, 0)],
    [new Complex(0, 0), new Complex(1, 0), new Complex(0, 0), new Complex(0, 0)],
    [new Complex(0, 0), new Complex(0, 0), new Complex(0, 0), new Complex(1, 0)],
    [new Complex(0, 0), new Complex(0, 0), new Complex(1, 0), new Complex(0, 0)]
  ];

  static readonly CZ = [
    [new Complex(1, 0), new Complex(0, 0), new Complex(0, 0), new Complex(0, 0)],
    [new Complex(0, 0), new Complex(1, 0), new Complex(0, 0), new Complex(0, 0)],
    [new Complex(0, 0), new Complex(0, 0), new Complex(1, 0), new Complex(0, 0)],
    [new Complex(0, 0), new Complex(0, 0), new Complex(0, 0), new Complex(-1, 0)]
  ];

  static readonly SWAP = [
    [new Complex(1, 0), new Complex(0, 0), new Complex(0, 0), new Complex(0, 0)],
    [new Complex(0, 0), new Complex(0, 0), new Complex(1, 0), new Complex(0, 0)],
    [new Complex(0, 0), new Complex(1, 0), new Complex(0, 0), new Complex(0, 0)],
    [new Complex(0, 0), new Complex(0, 0), new Complex(0, 0), new Complex(1, 0)]
  ];

  /**
   * Get gate matrix by name
   */
  static getGate(name: string, parameters: number[] = []): Complex[][] {
    switch (name.toUpperCase()) {
      case 'I':
        return this.I;
      case 'X':
        return this.X;
      case 'Y':
        return this.Y;
      case 'Z':
        return this.Z;
      case 'H':
        return this.H;
      case 'S':
        return this.S;
      case 'T':
        return this.T;
      case 'RX':
        return this.rx(parameters[0] || Math.PI/2);
      case 'RY':
        return this.ry(parameters[0] || Math.PI/2);
      case 'RZ':
        return this.rz(parameters[0] || Math.PI/2);
      case 'CNOT':
      case 'CX':
        return this.CNOT;
      case 'CZ':
        return this.CZ;
      case 'SWAP':
        return this.SWAP;
      default:
        throw new Error(`Unknown gate: ${name}`);
    }
  }

  /**
   * Check if gate is single-qubit
   */
  static isSingleQubitGate(name: string): boolean {
    const singleQubitGates = ['I', 'X', 'Y', 'Z', 'H', 'S', 'T', 'RX', 'RY', 'RZ'];
    return singleQubitGates.includes(name.toUpperCase());
  }

  /**
   * Check if gate is two-qubit
   */
  static isTwoQubitGate(name: string): boolean {
    const twoQubitGates = ['CNOT', 'CX', 'CZ', 'SWAP'];
    return twoQubitGates.includes(name.toUpperCase());
  }

  /**
   * Get number of qubits required for gate
   */
  static getQubitCount(name: string): number {
    if (this.isSingleQubitGate(name)) return 1;
    if (this.isTwoQubitGate(name)) return 2;
    throw new Error(`Unknown gate: ${name}`);
  }
}